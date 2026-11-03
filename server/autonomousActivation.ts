import { eq } from "drizzle-orm";
import { autonomousWorkItems } from "../drizzle/schema";
import { getDb } from "./db";
import { createHeartbeatJob, listHeartbeatJobs } from "./_core/heartbeat";
import { DESIRED_AGENT_JOBS } from "./agents/registerCrons";
import { queueDailyAutonomousCycle } from "./autonomousWorker";

export const AUTONOMOUS_WORKER_JOB = { name: "agent-autonomous-worker", cron: "0 */5 * * * *", path: "/api/scheduled/autonomous-tick", method: "POST" as const,
  description: "Solar Freedom daily execution loop: one resumable <=24-second step every five minutes; max48 steps/day; no unapproved publication or outreach." };
export async function bindAutonomousSchedule(taskUid: string, spec: { name: string; path: string; payload?: unknown }) {
  const db = await getDb(); if (!db) throw new Error("Binding database unavailable");
  const payload = spec.payload as Record<string, unknown> | undefined;
  const kind = spec.path === AUTONOMOUS_WORKER_JOB.path ? "worker" : spec.path === "/api/scheduled/action-executor" ? "execute" : spec.path === "/api/scheduled/agent-run" ? "agent" : null;
  if (!kind) return;
  const stateJson = JSON.stringify({ kind, name: spec.name, scheduleMode: payload?.scheduleMode, enabled: true });
  const values = { kind: "binding", scheduleCronTaskUid: taskUid, status: "completed" as const,
    agentSlug: typeof payload?.agentSlug === "string" ? payload.agentSlug : null, stateJson,
    resultSummary: "Schedule identity registered; this is not an executed worker delivery.", updatedAt: new Date() };
  await db.insert(autonomousWorkItems).values({ workKey: `schedule:${taskUid}`, ...values }).onDuplicateKeyUpdate({ set: values });
}
/** Call after deploying these endpoints. Does not modify unrelated or existing cron timing. */
export async function activateAutonomousSchedules(sessionToken: string) {
  const deployed = await fetch("https://breakyoursolarcontract.com/api/autonomous/version", { redirect: "manual", signal: AbortSignal.timeout(4_000), cache: "no-store" });
  const marker = deployed.ok && deployed.headers.get("content-type")?.includes("application/json") ? await deployed.json() : null;
  if (marker?.version !== "durable-steps-v1") throw new Error("Publish this release first. The production worker endpoint is not deployed; no schedules were changed.");
  const response = await listHeartbeatJobs(sessionToken, { page: 1, pageSize: 100 });
  if (response.total > response.jobs.length) throw new Error("Schedule inventory is paged; activation stopped rather than guessing missing schedules.");
  for (const spec of DESIRED_AGENT_JOBS) {
    const job = response.jobs.find(j => j.name === spec.name);
    if (job && job.isEnable) await bindAutonomousSchedule(job.taskUid, spec);
  }
  let worker = response.jobs.find(j => j.name === AUTONOMOUS_WORKER_JOB.name);
  if (worker && !worker.isEnable) throw new Error("Autonomous worker is paused; resume that exact schedule explicitly before activation.");
  const created = worker ? { taskUid: worker.taskUid, nextExecutionAt: worker.nextExecutionAt } : await createHeartbeatJob(AUTONOMOUS_WORKER_JOB, sessionToken);
  await bindAutonomousSchedule(created.taskUid, AUTONOMOUS_WORKER_JOB);
  const work = await queueDailyAutonomousCycle();
  return { activated: true, taskUid: created.taskUid, nextExecutionAt: created.nextExecutionAt, jobIds: work.map(j => j.id), stepLimit: 48 };
}

/** An already-bound application schedule may bootstrap the new worker after publication. */
export async function ensureAutonomousWorkerStarted() {
  const db = await getDb(); if (!db) throw new Error("Worker activation database unavailable");
  const rows = await db.select().from(autonomousWorkItems).where(eq(autonomousWorkItems.kind, "binding")).limit(40);
  if (rows.some(row => { try { return JSON.parse(row.stateJson || "{}").kind === "worker"; } catch { return false; } })) return;
  // Empty session uses the SDK's documented project-owner identity, not a fabricated user cookie.
  await activateAutonomousSchedules("");
}
