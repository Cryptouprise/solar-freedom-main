/**
 * /api/scheduled/agent-run
 *
 * Called by the Heartbeat platform when an agent cron fires.
 * Auth: cron-only (user.isCron === true).
 */
import type { Request, Response } from "express";
import { sdk } from "../_core/sdk";
import { runAgent, seedAgents, sendMessage, type AgentSlug, type AgentThinkResult } from "../agents";
import { ensureDailyChecklists, reviewWorkerRun, type WorkerSlug } from "../agents/managerQuality";

export const SCHEDULED_AGENT_SLUGS = [
  "money_maker",
  "seo_intel",
  "content",
  "editor",
  "manager",
  "infra",
  "revenue_intel",
] as const satisfies readonly AgentSlug[];

const WORKER_SLUGS = new Set<WorkerSlug>(["revenue_intel", "seo_intel", "money_maker", "content", "editor", "infra"]);

export function resolveScheduledAgentSlug(value: unknown): AgentSlug | null {
  return typeof value === "string" && SCHEDULED_AGENT_SLUGS.includes(value as AgentSlug)
    ? value as AgentSlug
    : null;
}

function isEightAmMountain(now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Denver",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  return Number(parts.find(part => part.type === "hour")?.value) === 8;
}

export function shouldRunImmediateQualityRetry(isScheduledCallback: boolean): boolean {
  return !isScheduledCallback;
}

async function recordWorkerQuality(
  agentSlug: AgentSlug,
  result?: AgentThinkResult,
  error?: Error,
  options: { isScheduledCallback?: boolean } = {},
) {
  if (!WORKER_SLUGS.has(agentSlug as WorkerSlug)) return;
  const worker = agentSlug as WorkerSlug;
  const checklistIds = await ensureDailyChecklists();
  const checklistId = checklistIds[worker];
  if (!checklistId) return;

  const review = await reviewWorkerRun({
    agentSlug: worker,
    checklistId,
    result,
    error,
    retryNumber: 0,
  });

  if (review.verdict === "rework") {
    await sendMessage({
      fromAgent: "manager",
      toAgent: worker,
      type: "directive",
      priority: "p1",
      subject: "QUALITY REWORK REQUIRED",
      body: `Your latest scheduled delivery needs rework. ${review.feedback}\n\nReturn specific evidence, execution output, and measurable impact on your next scheduled run.`,
    });
    if (!shouldRunImmediateQualityRetry(options.isScheduledCallback ?? true)) return;
    try {
      const retry = await runAgent(agentSlug, "directive", "manager_quality_rework");
      await reviewWorkerRun({
        agentSlug: worker,
        checklistId,
        result: retry,
        retryNumber: 1,
      });
    } catch (retryError: any) {
      const normalized = retryError instanceof Error ? retryError : new Error(String(retryError));
      await reviewWorkerRun({
        agentSlug: worker,
        checklistId,
        error: normalized,
        retryNumber: 1,
      });
    }
  }
}

export async function agentRunHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only endpoint" });
    }

    const payload = req.body || {};
    const agentSlug = resolveScheduledAgentSlug(payload.agentSlug);
    if (!agentSlug) {
      return res.status(422).json({
        ok: false,
        error: `Invalid or missing agentSlug: ${String(payload.agentSlug ?? "")}`,
      });
    }

    if (payload.scheduleMode === "mountain_8" && !isEightAmMountain()) {
      return res.json({ ok: true, skipped: "Outside 8:00 AM America/Denver window" });
    }

    await seedAgents();

    let result: AgentThinkResult;
    try {
      result = await runAgent(agentSlug, "cron", `heartbeat:${user.taskUid}`);
    } catch (error: any) {
      const normalized = error instanceof Error ? error : new Error(String(error));
      await recordWorkerQuality(agentSlug, undefined, normalized, { isScheduledCallback: true });
      throw normalized;
    }

    await recordWorkerQuality(agentSlug, result, undefined, { isScheduledCallback: true });
    return res.json({
      ok: true,
      agent: agentSlug,
      summary: result.summary,
      actionsCreated: result.actionsCreated,
      messagesCreated: result.messagesCreated,
    });
  } catch (error: any) {
    console.error("[AgentRun] Error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message,
      context: { path: req.path },
      timestamp: new Date().toISOString(),
    });
  }
}
