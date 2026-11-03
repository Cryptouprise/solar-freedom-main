import { and, desc, eq, inArray } from "drizzle-orm";
import { autonomousWorkItems } from "../drizzle/schema";
import { getDb } from "./db";
import { AUTONOMOUS_DAILY_STEP_LIMIT, AUTONOMOUS_WORK_KINDS } from "./autonomousQueue";

export async function readAutonomousStatus() {
  const db = await getDb(); if (!db) throw new Error("Durable work status unavailable");
  const [jobs, bindings, budget] = await Promise.all([
    db.select({ id: autonomousWorkItems.id, kind: autonomousWorkItems.kind, role: autonomousWorkItems.agentSlug,
      pipelineId: autonomousWorkItems.pipelineId, status: autonomousWorkItems.status, steps: autonomousWorkItems.steps,
      failures: autonomousWorkItems.failures, nextRunAt: autonomousWorkItems.nextRunAt, summary: autonomousWorkItems.resultSummary,
      error: autonomousWorkItems.errorMessage, updatedAt: autonomousWorkItems.updatedAt })
      .from(autonomousWorkItems).where(inArray(autonomousWorkItems.kind, [...AUTONOMOUS_WORK_KINDS])).orderBy(desc(autonomousWorkItems.updatedAt)).limit(12),
    db.select().from(autonomousWorkItems).where(eq(autonomousWorkItems.kind, "binding")).limit(30),
    db.select().from(autonomousWorkItems).where(eq(autonomousWorkItems.workKey, `budget:${new Date().toISOString().slice(0, 10)}`)).limit(1),
  ]);
  const worker = bindings.find(row => { try { return JSON.parse(row.stateJson || "{}").kind === "worker"; } catch { return false; } });
  const last = worker?.resultSummary?.startsWith("Tick ") ? worker.updatedAt : null;
  return { configured: !!worker, lastTickAt: last, workerReceipt: worker?.resultSummary ?? null,
    roleBindings: bindings.filter(row => row.agentSlug).length, dailyStepLimit: AUTONOMOUS_DAILY_STEP_LIMIT,
    usedStepsToday: budget[0]?.attempts ?? 0, budgetTimeZone: "UTC", jobs,
    acceptance: "A schedule binding is configuration, not proof of a successful worker delivery. Inspect the last tick and saved step receipt." };
}
