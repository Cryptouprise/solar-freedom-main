import type { Request, Response } from "express";
import crypto from "node:crypto";
import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { sdk } from "../_core/sdk";
import { notifyOwner } from "../_core/notification";
import { getDb } from "../db";
import { discoveredBacklinks, ghlPipelineEvents, lawFirms, leadDeliveries, leads, seoPages, seoScorecardSnapshots } from "../../drizzle/schema";
import { createAction, getActionQueue } from "../agents/engine";
import { refreshGscPageMetrics } from "../gscRefresh";
import { comparisonDelta } from "../scorecardComparisons";
import { buildAuthorityScorecardAlerts, buildLeadScorecardAlerts } from "../scorecardLeadHealth";

async function readLeadScorecard(now = new Date()) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable for lead scorecard.");
  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - 28);
  const priorStart = new Date(currentStart);
  priorStart.setDate(priorStart.getDate() - 28);

  const [
    currentLeads,
    priorLeads,
    currentCrmSynced,
    priorCrmSynced,
    currentPartnerDelivered,
    priorPartnerDelivered,
    activePartners,
    currentAppointments,
    priorAppointments,
  ] = await Promise.all([
    db.select({ value: count() }).from(leads).where(gte(leads.createdAt, currentStart)),
    db.select({ value: count() }).from(leads).where(sql`${leads.createdAt} >= ${priorStart} AND ${leads.createdAt} < ${currentStart}`),
    db.select({ value: count() }).from(leads).where(and(gte(leads.createdAt, currentStart), eq(leads.ghlWebhookSent, 1))),
    db.select({ value: count() }).from(leads).where(sql`${leads.createdAt} >= ${priorStart} AND ${leads.createdAt} < ${currentStart} AND ${leads.ghlWebhookSent} = 1`),
    db.select({ value: count() }).from(leadDeliveries).where(gte(leadDeliveries.deliveredAt, currentStart)),
    db.select({ value: count() }).from(leadDeliveries).where(sql`${leadDeliveries.deliveredAt} >= ${priorStart} AND ${leadDeliveries.deliveredAt} < ${currentStart}`),
    db.select({ value: count() }).from(lawFirms).where(eq(lawFirms.status, "active")),
    db.select({ value: count() }).from(ghlPipelineEvents).where(sql`${ghlPipelineEvents.eventType} = 'appointment_booked' AND ${ghlPipelineEvents.occurredAt} >= ${currentStart}`),
    db.select({ value: count() }).from(ghlPipelineEvents).where(sql`${ghlPipelineEvents.eventType} = 'appointment_booked' AND ${ghlPipelineEvents.occurredAt} >= ${priorStart} AND ${ghlPipelineEvents.occurredAt} < ${currentStart}`),
  ]);

  const scorecard = {
    priorLeads: Number(priorLeads[0]?.value ?? 0),
    currentLeads: Number(currentLeads[0]?.value ?? 0),
    priorCrmSynced: Number(priorCrmSynced[0]?.value ?? 0),
    currentCrmSynced: Number(currentCrmSynced[0]?.value ?? 0),
    priorPartnerDelivered: Number(priorPartnerDelivered[0]?.value ?? 0),
    currentPartnerDelivered: Number(currentPartnerDelivered[0]?.value ?? 0),
    activePartnerCount: Number(activePartners[0]?.value ?? 0),
    priorAppointments: Number(priorAppointments[0]?.value ?? 0),
    currentAppointments: Number(currentAppointments[0]?.value ?? 0),
  };
  return { ...scorecard, alerts: buildLeadScorecardAlerts(scorecard) };
}

async function surfaceScorecardAlerts(alerts: Array<{ severity: string; metric: string; message: string }>) {
  if (!alerts.length) return;
  const queued = await getActionQueue({ status: "queued", limit: 100 });
  for (const alert of alerts) {
    const title = `[SCORECARD ${alert.severity.toUpperCase()}] ${alert.metric}`;
    if (queued.some((action) => action.title === title)) continue;
    await createAction({
      agentSlug: "seo_intel",
      priority: alert.severity === "critical" ? "p1" : "p2",
      title,
      description: alert.message,
      actionType: "technical_fix",
      requiresApproval: 0,
    });
  }
}

async function saveSnapshotAndComparisons(input: {
  now: Date;
  scorecard: { startDate: string; endDate: string; rows: number; clicks: number; impressions: number };
  leadScorecard: { currentLeads: number; currentCrmSynced: number; currentAppointments: number };
  geoReadiness: number;
  alerts: Array<{ severity: string; metric: string; message: string }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable for scorecard snapshot.");
  const [verifiedBacklinks] = await db.select({ value: count() })
    .from(discoveredBacklinks)
    .where(sql`${discoveredBacklinks.status} = 'verified' AND ${discoveredBacklinks.isActive} = 1`);
  const values = {
    clicks: input.scorecard.clicks,
    impressions: input.scorecard.impressions,
    durableLeads: input.leadScorecard.currentLeads,
    crmDeliveries: input.leadScorecard.currentCrmSynced,
    bookedAppointments: input.leadScorecard.currentAppointments,
    verifiedBacklinks: Number(verifiedBacklinks?.value ?? 0),
    geoReadiness: input.geoReadiness,
  };
  await db.insert(seoScorecardSnapshots).values({
    capturedAt: input.now,
    periodStart: input.scorecard.startDate,
    periodEnd: input.scorecard.endDate,
    pageRows: input.scorecard.rows,
    ...values,
    alerts: JSON.stringify(input.alerts),
  });

  const comparisonForDays = async (days: number) => {
    const cutoff = new Date(input.now);
    cutoff.setDate(cutoff.getDate() - days);
    const [baseline] = await db.select().from(seoScorecardSnapshots)
      .where(lte(seoScorecardSnapshots.capturedAt, cutoff))
      .orderBy(desc(seoScorecardSnapshots.capturedAt))
      .limit(1);
    return { days, baselineCapturedAt: baseline?.capturedAt ?? null, delta: comparisonDelta(values, baseline) };
  };

  return { sevenDay: await comparisonForDays(7), fourteenDay: await comparisonForDays(14) };
}

async function readVerifiedBacklinkCount() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable for authority scorecard.");
  const [verifiedBacklinks] = await db.select({ value: count() })
    .from(discoveredBacklinks)
    .where(sql`${discoveredBacklinks.status} = 'verified' AND ${discoveredBacklinks.isActive} = 1`);
  return Number(verifiedBacklinks?.value ?? 0);
}

async function readTechnicalGeoReadiness() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable for GEO readiness scorecard.");
  const [coverage] = await db.select({
    total: count(),
    ready: sql<number>`SUM(CASE WHEN ${seoPages.hasCanonical} = 1 AND ${seoPages.hasSchema} = 1 AND ${seoPages.inSitemap} = 1 THEN 1 ELSE 0 END)`,
  })
    .from(seoPages)
    .where(sql`${seoPages.pageType} IN ('blog', 'company', 'state_law') AND ${seoPages.inSitemap} = 1`);
  const total = Number(coverage?.total ?? 0);
  const ready = Number(coverage?.ready ?? 0);
  return { total, score: total > 0 ? Math.round((ready / total) * 100) : 0 };
}

/** Runs one complete verified scorecard cycle for either a scheduled callback or an explicit admin baseline refresh. */
export async function runSeoScorecard(now = new Date()) {
  const [scorecard, leadScorecard, verifiedBacklinks, geoCoverage] = await Promise.all([
    refreshGscPageMetrics(now),
    readLeadScorecard(now),
    readVerifiedBacklinkCount(),
    readTechnicalGeoReadiness(),
  ]);
  const geoAlerts = geoCoverage.total > 0 && geoCoverage.score < 95
    ? [{ severity: "warning", metric: "geo_readiness", message: `Technical GEO readiness is ${geoCoverage.score}% across ${geoCoverage.total} indexable commercial pages. Restore canonical, schema, and sitemap coverage before expanding content.` }]
    : [];
  const alerts = [...scorecard.alerts, ...leadScorecard.alerts, ...buildAuthorityScorecardAlerts(verifiedBacklinks), ...geoAlerts];
  await surfaceScorecardAlerts(alerts);
  if (alerts.length > 0) {
    await notifyOwner({
      title: `SEO and lead scorecard alert — ${alerts.length} material change${alerts.length === 1 ? "" : "s"}`,
      content: [
        `28-day window: ${scorecard.startDate} through ${scorecard.endDate}`,
        `Clicks: ${scorecard.clicks} | Impressions: ${scorecard.impressions} | Pages: ${scorecard.rows}`,
        `Durable leads: ${leadScorecard.currentLeads} | HighLevel syncs: ${leadScorecard.currentCrmSynced} | Partner deliveries: ${leadScorecard.currentPartnerDelivered} | Booked appointments: ${leadScorecard.currentAppointments}`,
        ...alerts.map((alert) => `${alert.severity.toUpperCase()}: ${alert.message}`),
      ].join("\n"),
    });
  }
  const comparisons = await saveSnapshotAndComparisons({ now, scorecard, leadScorecard, geoReadiness: geoCoverage.score, alerts });
  return { ok: true, scorecard, leadScorecard, geoCoverage, alerts, comparisons, refreshedAt: now.toISOString() };
}

/** Refreshes source-of-truth GSC page metrics for the existing SEO agent and dashboard. */
export async function seoScorecardHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only endpoint" });
    return res.json(await runSeoScorecard());
  } catch (error: any) {
    const errorId = crypto.randomUUID();
    console.error(`[SeoScorecard:${errorId}]`, error);
    return res.status(500).json({
      error: "SEO scorecard refresh failed",
      errorId,
      detail: String(error?.message || "Unknown scorecard error").slice(0, 500),
      timestamp: new Date().toISOString(),
    });
  }
}
