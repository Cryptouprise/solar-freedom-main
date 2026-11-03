import type { Request, Response } from "express";
import { sdk } from "../_core/sdk";
import type { AgentSlug } from "../agents";
import { queueAutonomousRole } from "../autonomousWorker";
import { readAutonomousScheduleBinding } from "../autonomousQueue";
import { ensureAutonomousWorkerStarted } from "../autonomousActivation";

export const SCHEDULED_AGENT_SLUGS = ["money_maker", "seo_intel", "content", "editor", "manager", "infra", "revenue_intel"] as const satisfies readonly AgentSlug[];
export function resolveScheduledAgentSlug(value: unknown): AgentSlug | null {
  return typeof value === "string" && SCHEDULED_AGENT_SLUGS.includes(value as AgentSlug) ? value as AgentSlug : null;
}
export function shouldRunImmediateQualityRetry(isScheduledCallback: boolean): boolean { return !isScheduledCallback; }
export function isEightAmMountain(now = new Date()): boolean {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Denver", hour: "numeric", hourCycle: "h23" }).formatToParts(now).find(p => p.type === "hour")?.value) === 8;
}
/** Schedules enqueue only. A separate platform tick awaits each bounded work step. */
export async function agentRunHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only endpoint" });
    const binding = await readAutonomousScheduleBinding(user.taskUid);
    if (!binding || binding.binding.kind !== "agent") return res.status(403).json({ error: "Unbound agent schedule; no role accepted from request body." });
    const agentSlug = resolveScheduledAgentSlug(binding.agentSlug);
    if (!agentSlug) return res.status(422).json({ error: "Persisted agent binding is invalid" });
    if (binding.binding.scheduleMode === "mountain_8" && !isEightAmMountain()) return res.json({ ok: true, skipped: "Outside 8:00 AM America/Denver window" });
    const job = await queueAutonomousRole(agentSlug, `heartbeat:${user.taskUid}`);
    await ensureAutonomousWorkerStarted();
    return res.status(202).json({ ok: true, agent: agentSlug, jobId: job.id, status: job.status,
      summary: "Work saved durably. This acknowledgement is not a completed draft, publication or live SEO change." });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: String(error?.message || error).slice(0, 500), timestamp: new Date().toISOString() });
  }
}
