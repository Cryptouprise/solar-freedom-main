import { randomUUID } from "node:crypto";
import { and, asc, eq, gte, inArray, isNull, lt, lte, or, sql } from "drizzle-orm";
import { autonomousWorkItems, type AutonomousWorkItem } from "../drizzle/schema";
import { getDb } from "./db";

export const AUTONOMOUS_STEP_MS = 24_000;
export const AUTONOMOUS_DAILY_STEP_LIMIT = 48;
export const AUTONOMOUS_MAX_FAILURES = 3;
export const AUTONOMOUS_WORK_KINDS = ["agent", "content_plan", "content_draft", "editor", "execute", "measure", "verify"] as const;
export type AutonomousWorkKind = typeof AUTONOMOUS_WORK_KINDS[number];
export type WorkInput = { workKey: string; kind: AutonomousWorkKind; agentSlug?: string; pipelineId?: number; priority?: number; state?: unknown; nextRunAt?: Date };
export function autonomousRetryDelayMs(failures: number): number { return Math.min(60, 5 * Math.pow(2, Math.max(0, failures - 1))) * 60_000; }
export function autonomousFailureStatus(failures: number): "failed" | "queued" { return failures >= AUTONOMOUS_MAX_FAILURES ? "failed" : "queued"; }
export function autonomousHourKey(now = new Date()): string { return now.toISOString().slice(0, 13); }
async function database() { const db = await getDb(); if (!db) throw new Error("Autonomous work database unavailable"); return db; }
export async function enqueueAutonomousWork(input: WorkInput): Promise<AutonomousWorkItem> {
  if (!AUTONOMOUS_WORK_KINDS.includes(input.kind) || !input.workKey || input.workKey.length > 191) throw new Error("Invalid autonomous work identity");
  const db = await database();
  await db.insert(autonomousWorkItems).ignore().values({ workKey: input.workKey, kind: input.kind, agentSlug: input.agentSlug,
    pipelineId: input.pipelineId, priority: input.priority ?? 50, stateJson: input.state ? JSON.stringify(input.state) : null,
    nextRunAt: input.nextRunAt ?? new Date() });
  const [row] = await db.select().from(autonomousWorkItems).where(eq(autonomousWorkItems.workKey, input.workKey)).limit(1);
  if (!row) throw new Error("Work enqueue could not be verified");
  return row;
}
/** Binding rows are not executable. Only verified platform task IDs select a role. */
export async function readAutonomousScheduleBinding(taskUid: string) {
  const db = await database();
  const [row] = await db.select().from(autonomousWorkItems).where(and(eq(autonomousWorkItems.scheduleCronTaskUid, taskUid), eq(autonomousWorkItems.kind, "binding"))).limit(1);
  if (!row) return null;
  let state: Record<string, unknown> = {}; try { state = JSON.parse(row.stateJson || "{}"); } catch {}
  return { ...row, binding: state };
}
export async function reserveDailyAutonomousStep(now = new Date()): Promise<boolean> {
  const db = await database(); const workKey = `budget:${now.toISOString().slice(0, 10)}`;
  await db.insert(autonomousWorkItems).ignore().values({ workKey, kind: "budget", status: "completed", resultSummary: "Daily bounded work-step counter, not a completed SEO change." });
  const result = await db.update(autonomousWorkItems).set({ attempts: sql`${autonomousWorkItems.attempts} + 1`, updatedAt: now })
    .where(and(eq(autonomousWorkItems.workKey, workKey), lt(autonomousWorkItems.attempts, AUTONOMOUS_DAILY_STEP_LIMIT)));
  return Number((result as any)[0]?.affectedRows ?? 0) === 1;
}
export async function claimAutonomousWork(now = new Date()): Promise<AutonomousWorkItem | null> {
  const db = await database();
  const ready = and(inArray(autonomousWorkItems.kind, [...AUTONOMOUS_WORK_KINDS]), lt(autonomousWorkItems.failures, AUTONOMOUS_MAX_FAILURES),
    lte(autonomousWorkItems.nextRunAt, now), or(eq(autonomousWorkItems.status, "queued"), and(eq(autonomousWorkItems.status, "leased"), lt(autonomousWorkItems.leaseUntil, now))));
  const candidates = await db.select().from(autonomousWorkItems).where(ready).orderBy(asc(autonomousWorkItems.priority), asc(autonomousWorkItems.nextRunAt), asc(autonomousWorkItems.id)).limit(5);
  for (const candidate of candidates) {
    if (candidate.status === "leased" && candidate.failures + 1 >= AUTONOMOUS_MAX_FAILURES) {
      await db.update(autonomousWorkItems).set({ status: "failed", failures: AUTONOMOUS_MAX_FAILURES, leaseToken: null, leaseUntil: null, finishedAt: now,
        errorMessage: "Repeated interrupted worker leases; automatic recovery stopped for review.", updatedAt: now }).where(and(eq(autonomousWorkItems.id, candidate.id), ready));
      continue;
    }
    const token = randomUUID();
    const result = await db.update(autonomousWorkItems).set({ status: "leased", leaseToken: token, leaseUntil: new Date(now.getTime() + 90_000),
      attempts: sql`${autonomousWorkItems.attempts} + 1`, failures: candidate.failures + (candidate.status === "leased" ? 1 : 0), updatedAt: now })
      .where(and(eq(autonomousWorkItems.id, candidate.id), ready));
    if (Number((result as any)[0]?.affectedRows ?? 0) === 1) return { ...candidate, status: "leased", leaseToken: token, attempts: candidate.attempts + 1, failures: candidate.failures + (candidate.status === "leased" ? 1 : 0) };
  }
  return null;
}
export async function finishAutonomousStep(job: AutonomousWorkItem, outcome: { done: boolean; summary: string; blocked?: boolean; state?: unknown; delayMs?: number }) {
  const db = await database(); const now = new Date();
  await db.update(autonomousWorkItems).set({ status: outcome.blocked ? "blocked" : outcome.done ? "completed" : "queued",
    steps: sql`${autonomousWorkItems.steps} + 1`, failures: 0, leaseToken: null, leaseUntil: null,
    resultSummary: outcome.summary.slice(0, 6000), errorMessage: null,
    ...(outcome.state === undefined ? {} : { stateJson: JSON.stringify(outcome.state) }),
    nextRunAt: new Date(now.getTime() + (outcome.delayMs ?? 60_000)), finishedAt: outcome.done || outcome.blocked ? now : null, updatedAt: now })
    .where(and(eq(autonomousWorkItems.id, job.id), eq(autonomousWorkItems.status, "leased"), eq(autonomousWorkItems.leaseToken, job.leaseToken!)));
}
export async function failAutonomousStep(job: AutonomousWorkItem, error: unknown) {
  const db = await database(); const failures = job.failures + 1; const now = new Date(); const status = autonomousFailureStatus(failures);
  const detail = String(error instanceof Error ? error.message : error).replace(/Bearer\s+\S+|\bsk-[\w-]+/gi, "[REDACTED]").slice(0, 1200);
  await db.update(autonomousWorkItems).set({ status, failures, leaseToken: null, leaseUntil: null, errorMessage: detail,
    resultSummary: status === "failed" ? "Stopped after three failed steps; owner-visible blocker. No success or live change claimed." : "Failed step saved; bounded automatic retry scheduled.",
    nextRunAt: new Date(now.getTime() + autonomousRetryDelayMs(failures)), finishedAt: status === "failed" ? now : null, updatedAt: now })
    .where(and(eq(autonomousWorkItems.id, job.id), eq(autonomousWorkItems.leaseToken, job.leaseToken!)));
}
