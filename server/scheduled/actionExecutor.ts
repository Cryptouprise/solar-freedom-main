import type { Request, Response } from "express";
import { sdk } from "../_core/sdk";
import { EXECUTOR_LIMITS, runQueuedActionExecutions, type BatchReport } from "../agents/executors";
import { autonomousHourKey, enqueueAutonomousWork, readAutonomousScheduleBinding } from "../autonomousQueue";
import { ensureAutonomousWorkerStarted } from "../autonomousActivation";

export async function runActionExecutorBatch(options?: { limit?: number; actor?: string }): Promise<BatchReport> {
  return runQueuedActionExecutions({ limit: options?.limit ?? EXECUTOR_LIMITS.defaultBatchSize, actor: options?.actor ?? "scheduled_executor" });
}
export function summarizeBatch(report: BatchReport): string {
  if (!report.executed) return "No executable actions were ready in the queue.";
  return `Executed ${report.executed} of ${report.considered} ready actions: ${report.changed} applied a live change ${report.blocked} blocked ${report.failed} failed`;
}
/** Callback persists intent only; the platform worker performs the awaited bounded step. */
export async function actionExecutorHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only endpoint" });
    const binding = await readAutonomousScheduleBinding(user.taskUid);
    if (!binding || binding.binding.kind !== "execute") return res.status(403).json({ error: "Unbound executor schedule" });
    const job = await enqueueAutonomousWork({ workKey: `scheduled:execute:${autonomousHourKey()}`, kind: "execute", priority: 20 });
    await ensureAutonomousWorkerStarted();
    return res.status(202).json({ ok: true, jobId: job.id, status: job.status,
      summary: "Bounded execution saved durably. No live change is claimed by this acknowledgement." });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: String(error?.message || error).slice(0, 500), timestamp: new Date().toISOString() });
  }
}
