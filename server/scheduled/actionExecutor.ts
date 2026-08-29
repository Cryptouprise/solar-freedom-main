/**
 * /api/scheduled/action-executor
 *
 * Drains the agent action queue. Every four hours it takes the highest-priority
 * ready actions that have a typed executor and applies them to the live site,
 * so agent recommendations stop accumulating as permanently "queued" rows.
 *
 * Auth: cron-only (user.isCron === true), matching the other scheduled workers.
 */
import type { Request, Response } from "express";
import { sdk } from "../_core/sdk";
import { EXECUTOR_LIMITS, runQueuedActionExecutions, type BatchReport } from "../agents/executors";

/** Shared runner so the admin dashboard and the cron callback behave identically. */
export async function runActionExecutorBatch(options?: {
  limit?: number;
  actor?: string;
}): Promise<BatchReport> {
  return runQueuedActionExecutions({
    limit: options?.limit ?? EXECUTOR_LIMITS.defaultBatchSize,
    actor: options?.actor ?? "scheduled_executor",
  });
}

export function summarizeBatch(report: BatchReport): string {
  if (!report.executed) {
    return "No executable actions were ready in the queue.";
  }
  return [
    `Executed ${report.executed} of ${report.considered} ready actions:`,
    `${report.changed} applied a live change`,
    `${report.blocked} blocked`,
    `${report.failed} failed`,
  ].join(" ");
}

export async function actionExecutorHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only endpoint" });
    }

    const requested = Number((req.body || {}).limit);
    const limit = Number.isFinite(requested) && requested > 0 ? requested : undefined;

    const report = await runActionExecutorBatch({ limit, actor: `cron:${user.taskUid}` });

    return res.json({
      ok: true,
      summary: summarizeBatch(report),
      considered: report.considered,
      executed: report.executed,
      changed: report.changed,
      blocked: report.blocked,
      failed: report.failed,
      reports: report.reports,
    });
  } catch (error: any) {
    console.error("[ActionExecutor] Error:", error);
    return res.status(500).json({
      ok: false,
      error: String(error?.message ?? error).slice(0, 500),
      context: { path: req.path },
      timestamp: new Date().toISOString(),
    });
  }
}
