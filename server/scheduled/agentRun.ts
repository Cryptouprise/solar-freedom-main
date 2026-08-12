/**
 * /api/scheduled/agent-run
 *
 * Called by the Heartbeat platform when an agent cron fires.
 * Identifies which agent to run from the payload and executes it.
 *
 * Auth: cron-only (user.isCron === true).
 */
import type { Request, Response } from "express";
import { sdk } from "../_core/sdk";
import { runAgent, seedAgents, type AgentSlug } from "../agents";

export const SCHEDULED_AGENT_SLUGS = [
  "money_maker",
  "seo_intel",
  "content",
  "editor",
  "manager",
  "infra",
  "revenue_intel",
] as const satisfies readonly AgentSlug[];

export function resolveScheduledAgentSlug(value: unknown): AgentSlug | null {
  return typeof value === "string" && SCHEDULED_AGENT_SLUGS.includes(value as AgentSlug)
    ? value as AgentSlug
    : null;
}

export async function agentRunHandler(req: Request, res: Response) {
  try {
    // 1. Authenticate — must be a cron caller
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only endpoint" });
    }

    // 2. Determine which agent to run from payload
    const payload = req.body || {};
    const agentSlug = resolveScheduledAgentSlug(payload.agentSlug);

    if (!agentSlug) {
      return res.status(422).json({
        ok: false,
        error: `Invalid or missing agentSlug: ${String(payload.agentSlug ?? "")}`,
      });
    }

    // 3. Keep the database registry aligned with the scheduled contract.
    await seedAgents();

    // 4. Run the agent
    const result = await runAgent(agentSlug, "cron", `heartbeat:${user.taskUid}`);

    return res.json({
      ok: true,
      agent: agentSlug,
      summary: result.summary,
      actionsCreated: result.actionsCreated,
      messagesCreated: result.messagesCreated,
    });

  } catch (error: any) {
    console.error(`[AgentRun] Error:`, error);
    return res.status(500).json({
      ok: false,
      error: error.message,
      context: { path: req.path },
      timestamp: new Date().toISOString(),
    });
  }
}
