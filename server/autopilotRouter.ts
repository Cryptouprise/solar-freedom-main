import { z } from "zod";
import { and, count, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { agentActions, agentRunLog, contentPipeline, seoChangeLog, siteConfig } from "../drizzle/schema";
import { readSeoChangeOutcomeReport } from "./seoChangeOutcomes";

export const COMPETITOR_EVIDENCE_KEY = "seo_competitor_watch_latest";
const competitor = z.object({ url: z.string().url().max(1000), title: z.string().min(1).max(500), evidence: z.string().min(1).max(4000) });
export const competitorEvidenceSchema = z.object({
  capturedAt: z.string().datetime(),
  topics: z.array(z.object({
    key: z.string().min(1).max(50), query: z.string().min(1).max(500), checkedAt: z.string().datetime(),
    searchSource: z.string().min(1).max(2000), rankingVerified: z.boolean(),
    competitors: z.array(competitor).min(1).max(3), targetGap: z.string().max(5000),
    recommendedChange: z.string().max(5000), limitations: z.string().max(5000),
  })).min(1).max(3),
}).superRefine((value, ctx) => {
  const now = Date.now();
  for (const date of [value.capturedAt, ...value.topics.map(t => t.checkedAt)]) {
    if (new Date(date).getTime() > now + 5 * 60_000) ctx.addIssue({ code: "custom", message: "Evidence dates cannot be in the future." });
  }
});

function readJson(value: string | null | undefined): unknown {
  try { return value ? JSON.parse(value) : null; } catch { return null; }
}
const admin = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new Error("Forbidden");
  return next({ ctx });
});

export const autopilotRouter = router({
  status: admin.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Autopilot evidence database unavailable; no zeroes substituted.");
    const since = new Date(Date.now() - 24 * 60 * 60_000);
    const [runs, changes, queue, invalidPublications, competitorRows] = await Promise.all([
      db.select().from(agentRunLog).where(gte(agentRunLog.startedAt, since)).orderBy(desc(agentRunLog.startedAt)).limit(30),
      db.select().from(seoChangeLog).orderBy(desc(seoChangeLog.createdAt)).limit(8),
      db.select({ value: count() }).from(agentActions).where(inArray(agentActions.status, ["queued", "approved"])),
      db.select({ value: count() }).from(contentPipeline).where(and(eq(contentPipeline.stage, "published"), sql`(${contentPipeline.blogPostId} IS NULL OR ${contentPipeline.publishedUrl} IS NULL)`)),
      db.select().from(siteConfig).where(eq(siteConfig.key, COMPETITOR_EVIDENCE_KEY)).limit(1),
    ]);
    const stored = competitorEvidenceSchema.safeParse(readJson(competitorRows[0]?.value));
    const outcomes = await readSeoChangeOutcomeReport();
    return {
      capturedAt: new Date(),
      outcomes: { status: outcomes.status, measured: outcomes.measured, pending: outcomes.pending, confounded: outcomes.confounded, unavailable: outcomes.unavailable, warning: outcomes.warning },
      policy: { changes: "Existing approved blog pages only; per-page cooldown and FAQ cap. New pages require owner publication.", measurement: "Equal nonoverlapping before/after windows; observations are not proof of causation.", aiVisibility: "Not measured: crawler access and schema are not ChatGPT, Grok or Perplexity citation results." },
      runs: runs.map(r => ({ id: r.id, agentSlug: r.agentSlug, status: r.status, summary: r.summary, startedAt: r.startedAt, completedAt: r.completedAt, model: r.model, noOp: r.summary?.startsWith("No-op:") ?? false })),
      changes: changes.map(c => ({ id: c.id, title: c.title, createdAt: c.createdAt, pagesAffected: readJson(c.pagesAffected), measured: c.impactMeasured === 1, impactSummary: c.impactSummary, measurementDate: c.measurementDate, clicksDelta: c.clicksDelta, relatedActionId: c.relatedActionId })),
      queued: Number(queue[0]?.value ?? 0),
      historicalPublicationLabelsNeedingReview: Number(invalidPublications[0]?.value ?? 0),
      competitorEvidence: stored.success ? stored.data : null,
      competitorEvidenceFresh: stored.success && Date.now() - new Date(stored.data.capturedAt).getTime() < 48 * 60 * 60_000,
    };
  }),
  recordCompetitorEvidence: admin.input(competitorEvidenceSchema).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const value = JSON.stringify(input);
    await db.insert(siteConfig).values({ key: COMPETITOR_EVIDENCE_KEY, value, description: "Dated competitor research evidence; source observations, not inferred Google rank or AI visibility." })
      .onDuplicateKeyUpdate({ set: { value, updatedAt: new Date() } });
    return { saved: true, capturedAt: input.capturedAt, topics: input.topics.length };
  }),
});
