import type { Request, Response } from "express";
import crypto from "node:crypto";
import { count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { sdk } from "../_core/sdk";
import { notifyOwner } from "../_core/notification";
import { getDb } from "../db";
import { discoveredBacklinks, leadDeliveries, leads, seoScorecardSnapshots } from "../../drizzle/schema";
import { createAction, getActionQueue } from "../agents/engine";
import { refreshGscPageMetrics } from "../gscRefresh";
import { comparisonDelta } from "../scorecardComparisons";
import { buildLeadScorecardAlerts } from "../scorecardLeadHealth";

async function readLeadScorecard(now = new Date()) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable for lead scorecard.");
  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - 28);
  const priorStart = new Date(currentStart);
  priorStart.setDate(priorStart.getDate() - 28);

  const [currentLeads, priorLeads, currentDeliveries, priorDeliveries] = await Promise.all([
    db.select({ value: count() }).from(leads).where(gte(leads.createdAt, currentStart)),
    db.select({ value: count() }).from(leads).where(sql`${leads.createdAt} >= ${priorStart} AND ${leads.createdAt} < ${currentStart}`),
    db.select({ value: count() }).from(leadDeliveries).where(gte(leadDeliveries.deliveredAt, currentStart)),
    db.select({ value: count() }).from(leadDeliveries).where(sql`${leadDeliveries.deliveredAt} >= ${priorStart} AND ${leadDeliveries.deliveredAt} < ${currentStart}`),
  ]);
  const scorecard = {
    priorLeads: Number(priorLeads[0]?.value ?? 0),
    currentLeads: Number(currentLeads[0]?.value ?? 0),
    priorDelivered: Number(priorDeliveries[0]?.value ?? 0),
    currentDelivered: Number(currentDeliveries[0]?.value ?? 0),
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
  leadScorecard: { currentLeads: number; currentDelivered: number };
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
    crmDeliveries: input.leadScorecard.currentDelivered,
    verifiedBacklinks: Number(verifiedBacklinks?.value ?? 0),
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

/** Refreshes source-of-truth GSC page metrics for the existing SEO agent and dashboard. */
export async function seoScorecardHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only endpoint" });

    const [scorecard, leadScorecard] = await Promise.all([refreshGscPageMetrics(), readLeadScorecard()]);
    const alerts = [...scorecard.alerts, ...leadScorecard.alerts];
    await surfaceScorecardAlerts(alerts);
    if (alerts.length > 0) {
      await notifyOwner({
        title: `SEO and lead scorecard alert — ${alerts.length} material change${alerts.length === 1 ? "" : "s"}`,
        content: [
          `28-day window: ${scorecard.startDate} through ${scorecard.endDate}`,
          `Clicks: ${scorecard.clicks} | Impressions: ${scorecard.impressions} | Pages: ${scorecard.rows}`,
          `Durable leads: ${leadScorecard.currentLeads} | CRM/partner deliveries: ${leadScorecard.currentDelivered}`,
          ...alerts.map((alert) => `${alert.severity.toUpperCase()}: ${alert.message}`),
        ].join("\n"),
      });
    }
    const now = new Date();
    const comparisons = await saveSnapshotAndComparisons({ now, scorecard, leadScorecard, alerts });
    return res.json({ ok: true, scorecard, leadScorecard, alerts, comparisons, refreshedAt: now.toISOString() });
  } catch (error: any) {
    const errorId = crypto.randomUUID();
    console.error(`[SeoScorecard:${errorId}]`, error);
    return res.status(500).json({
      error: "SEO scorecard refresh failed",
      errorId,
      timestamp: new Date().toISOString(),
    });
  }
}
