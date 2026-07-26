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
import { runAgent, type AgentSlug } from "../agents";

const VALID_SLUGS: AgentSlug[] = ["money_maker", "seo_intel", "content", "editor", "manager"];

export async function agentRunHandler(req: Request, res: Response) {
  try {
    // 1. Authenticate — must be a cron caller
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only endpoint" });
    }

    // 2. Determine which agent to run from payload
    const payload = req.body || {};
    const agentSlug = payload.agentSlug as AgentSlug;

    if (!agentSlug || !VALID_SLUGS.includes(agentSlug)) {
      return res.json({ ok: true, skipped: `Invalid or missing agentSlug: ${agentSlug}` });
    }

    // 3. Run the agent
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
    // Return 200 so platform doesn't retry on app-level errors
    return res.json({
      ok: false,
      error: error.message,
    });
  }
}
