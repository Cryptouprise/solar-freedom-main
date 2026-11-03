import { createHash } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { autonomousWorkItems, seoChangeLog } from "../drizzle/schema";
import { getDb } from "./db";
import { runAgent, type AgentSlug } from "./agents";
import { withAutonomousBudget } from "./autonomousBudget";
import { AUTONOMOUS_STEP_MS, autonomousHourKey, claimAutonomousWork, enqueueAutonomousWork, failAutonomousStep, finishAutonomousStep, reserveDailyAutonomousStep, type WorkInput } from "./autonomousQueue";
import { readAutonomousContentPlan } from "./autonomousContentLoop";
import { runContentDraftStep } from "./autonomousContentDraft";
import { runActionExecutorBatch, summarizeBatch } from "./scheduled/actionExecutor";
import { measureSeoChangeOutcomes } from "./seoChangeOutcomes";
import { maintainAutonomousQueue } from "./autonomousQueueMaintenance";

export async function queueAutonomousRole(role: AgentSlug, source: string, now = new Date()) {
  const kind = role === "content" || role === "editor" ? "content_plan" : "agent";
  return enqueueAutonomousWork({ workKey: `role:${role}:${autonomousHourKey(now)}`, kind, agentSlug: role,
    priority: role === "seo_intel" ? 10 : role === "content" || role === "editor" ? 30 : 60,
    state: { source, requestedAt: now.toISOString() } });
}
export async function queueDailyAutonomousCycle(now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  // Measurement and maintenance run in their own ticks, never inside the SEO model request.
  return Promise.all([
    queueAutonomousRole("seo_intel", "daily_gsc_scorecard", now),
    enqueueAutonomousWork({ workKey: `daily:measure:${day}`, kind: "measure", priority: 5 }),
    enqueueAutonomousWork({ workKey: `daily:execute:${day}`, kind: "execute", priority: 20 }),
    enqueueAutonomousWork({ workKey: `daily:content:${day}`, kind: "content_plan", priority: 30 }),
  ]);
}
async function dispatchContentPlan(canonicalItemId?: number) {
  const db = await getDb(); if (!db) throw new Error("Content progression database unavailable");
  const closed = canonicalItemId ? [] : await db.select({ state: autonomousWorkItems.stateJson }).from(autonomousWorkItems)
    .where(and(eq(autonomousWorkItems.kind, "content_plan"), inArray(autonomousWorkItems.status, ["completed", "blocked"])))
    .orderBy(desc(autonomousWorkItems.id)).limit(200);
  const excluded = Array.from(new Set(closed.flatMap(row => {
    try { const state = JSON.parse(row.state || "{}"); return ["owner_ready", "human_escalation"].includes(state.state) && Number.isSafeInteger(state.itemId) ? [Number(state.itemId)] : []; } catch { return []; }
  })));
  const plan = await readAutonomousContentPlan({ canonicalItemId, maxRevisions: 3, excludeItemIds: excluded });
  if (plan.state !== "dispatch") return { done: true, blocked: plan.state === "human_escalation", summary: plan.reason, state: plan };
  const [active] = await db.select({ id: autonomousWorkItems.id }).from(autonomousWorkItems)
    .where(and(eq(autonomousWorkItems.pipelineId, plan.itemId!), inArray(autonomousWorkItems.kind, ["content_draft", "editor"]), inArray(autonomousWorkItems.status, ["queued", "leased"]))).limit(1);
  if (active) return { done: true, summary: `Existing exact pipeline work #${active.id} is already active; no duplicate draft or topic created.`, state: { pipelineId: plan.itemId, activeJobId: active.id } };
  const hash = createHash("sha256").update(`${plan.expectedStage}:${plan.expectedFingerprint}`).digest("hex").slice(0, 32);
  const input: WorkInput = { workKey: `content:${plan.itemId}:${plan.nextRole}:${hash}`,
    kind: plan.nextRole === "content" ? "content_draft" : "editor", agentSlug: plan.nextRole,
    pipelineId: plan.itemId!, priority: plan.nextRole === "editor" ? 25 : 40,
    state: { expectedStage: plan.expectedStage, expectedFingerprint: plan.expectedFingerprint } };
  const next = await enqueueAutonomousWork(input);
  return { done: true, summary: `Saved next step #${next.id}: ${plan.reason} No publication performed.`, state: { ...plan, nextJobId: next.id } };
}
async function processJob(job: NonNullable<Awaited<ReturnType<typeof claimAutonomousWork>>>): Promise<{ done: boolean; summary: string; blocked?: boolean; state?: unknown; delayMs?: number }> {
  if (job.kind === "content_plan") return dispatchContentPlan(job.pipelineId ?? undefined);
  if (job.kind === "content_draft") {
    if (!job.pipelineId) throw new Error("Content job has no saved pipeline target");
    const result = await runContentDraftStep(job.pipelineId, job.id);
    if (result.done && !result.blocked) await enqueueAutonomousWork({ workKey: `continue:${job.id}`, kind: "content_plan", pipelineId: job.pipelineId, priority: 25 });
    return result;
  }
  if (job.kind === "agent" || job.kind === "editor") {
    const role = (job.kind === "editor" ? "editor" : job.agentSlug) as AgentSlug;
    if (!["seo_intel", "manager", "money_maker", "revenue_intel", "infra", "editor"].includes(role)) throw new Error("Unsupported autonomous role");
    const result = await runAgent(role, "cron", `autopilot:${job.id}`);
    if (result.status === "failed") throw new Error(result.summary);
    if (role === "seo_intel" || role === "revenue_intel") await enqueueAutonomousWork({ workKey: `execute:after:${job.id}`, kind: "execute", priority: 20 });
    if (role === "editor") await enqueueAutonomousWork({ workKey: `continue:${job.id}`, kind: "content_plan", pipelineId: job.pipelineId ?? undefined, priority: 26 });
    return { done: true, summary: result.summary, state: { runId: result.runId, modelId: result.modelId, publicChange: false } };
  }
  if (job.kind === "execute") {
    // Maintenance is deterministic and bounded; only exact equivalents / verified measurement holds change state.
    const maintenance = await maintainAutonomousQueue();
    const report = await runActionExecutorBatch({ limit: 1, actor: `autopilot:${job.id}` });
    const db = await getDb();
    if (report.changed && db) {
      const { desc, gte } = await import("drizzle-orm");
      const changes = await db.select().from(seoChangeLog).where(gte(seoChangeLog.createdAt, new Date(Date.now() - AUTONOMOUS_STEP_MS))).orderBy(desc(seoChangeLog.id)).limit(2);
      for (const change of changes) await enqueueAutonomousWork({ workKey: `verify:change:${change.id}`, kind: "verify", priority: 15, state: { changeId: change.id } });
    }
    return { done: true, summary: summarizeBatch(report), state: { report, maintenance, publicChange: report.changed > 0 } };
  }
  if (job.kind === "measure") {
    const report = await measureSeoChangeOutcomes({ limit: 1 });
    return { done: true, summary: `Exact-window outcome follow-up: ${report.measured} newly measured. Missing or immature evidence is not counted as a win.`, state: { measured: report.measured, pending: report.pending, unavailable: report.unavailable, confounded: report.confounded, refreshedAt: report.refreshedAt, persistedMeasurements: report.persistedMeasurements, warning: report.warning } };
  }
  if (job.kind === "verify") {
    const input = JSON.parse(job.stateJson || "{}"); const db = await getDb(); if (!db) throw new Error("Verification database unavailable");
    const [change] = await db.select().from(seoChangeLog).where(eq(seoChangeLog.id, Number(input.changeId))).limit(1);
    if (!change) throw new Error("Exact change receipt missing");
    const paths: unknown = JSON.parse(change.pagesAffected || "[]");
    if (!Array.isArray(paths) || paths.length !== 1 || !/^\/blog\/[a-z0-9-]+$/.test(paths[0])) throw new Error("Verification requires one canonical own-site blog path");
    const response = await fetch(`https://breakyoursolarcontract.com${paths[0]}`, { redirect: "manual", signal: AbortSignal.timeout(5_000) });
    const html = await response.text();
    if (response.status !== 200 || !/\btext\/html\b/i.test(response.headers.get("content-type") || "")) throw new Error(`Public page verification failed: HTTP ${response.status}`);
    const after = JSON.parse(change.afterSnapshot || "{}");
    const expected = [after.metaTitle, after.metaDescription].filter((v: unknown): v is string => typeof v === "string" && v.length > 0);
    const normalized = html.replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&#x27;/g, "'");
    if (expected.length && expected.some((text: string) => !normalized.includes(text))) throw new Error("Public HTML does not yet contain the saved metadata; cache or deployment verification pending");
    return { done: true, summary: `Public HTTP 200 verified for ${paths[0]}; change #${change.id}. This is delivery evidence, not a ranking result.`, state: { changeId: change.id, path: paths[0], httpStatus: 200, checkedAt: new Date().toISOString(), metadataChecked: expected.length > 0 } };
  }
  throw new Error("Unknown work kind; no execution performed");
}
export async function runAutonomousTick() {
  const job = await claimAutonomousWork();
  if (!job) return { ok: true, status: "idle", summary: "No due persisted work; no model called." };
  if (!await reserveDailyAutonomousStep()) {
    const tomorrow = new Date(); tomorrow.setUTCHours(24, 0, 0, 0);
    await finishAutonomousStep(job, { done: false, summary: "Daily execution-step ceiling reached; remaining work retained for tomorrow.", delayMs: tomorrow.getTime() - Date.now() });
    return { ok: true, status: "budget_wait", jobId: job.id };
  }
  try {
    const outcome = await withAutonomousBudget({ jobId: job.id, pipelineId: job.pipelineId ?? undefined, deadlineAt: Date.now() + AUTONOMOUS_STEP_MS }, () => processJob(job));
    await finishAutonomousStep(job, outcome);
    return { ok: true, status: outcome.blocked ? "blocked" : outcome.done ? "completed" : "progress_saved", jobId: job.id, summary: outcome.summary };
  } catch (error) {
    await failAutonomousStep(job, error);
    return { ok: false, status: job.failures + 1 >= 3 ? "failed" : "retry_saved", jobId: job.id, error: String(error instanceof Error ? error.message : error).slice(0, 500) };
  }
}
