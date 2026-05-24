/**
 * /api/scheduled/automation-run
 *
 * Called by the Heartbeat platform when a user-defined automation cron fires.
 * Looks up the automation by taskUid, runs the spec as an LLM agent, and logs
 * the result.
 *
 * Auth: cron-only (user.isCron === true, user.taskUid set by platform).
 */
import type { Request, Response } from "express";
import { sdk } from "../_core/sdk";
import {
  getAutomation,
  updateAutomation,
  createAutomationRun,
  updateAutomationRun,
} from "../db";
import { automations } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { eq } from "drizzle-orm";

export async function automationRunHandler(req: Request, res: Response) {
  const startedAt = Date.now();
  let runId: number | undefined;
  let automationId: number | undefined;

  try {
    // 1. Authenticate — must be a cron caller
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only endpoint" });
    }

    // 2. Look up automation by taskUid (never trust req.body for this)
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database not available" });

    const rows = await db
      .select()
      .from(automations)
      .where(eq(automations.scheduleCronTaskUid, user.taskUid))
      .limit(1);

    const automation = rows[0];
    if (!automation) {
      // Orphan — 2xx so platform stops retrying
      return res.json({ ok: true, skipped: "orphan — no automation found for taskUid" });
    }

    if (!automation.isEnabled) {
      return res.json({ ok: true, skipped: "automation is disabled" });
    }

    automationId = automation.id;

    // 3. Create run log entry
    const run = await createAutomationRun({
      automationId: automation.id,
      status: "running",
    });
    runId = run?.id;

    // 4. Run the spec as an LLM agent
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an automation agent. Execute the following automation spec precisely and completely. 
Return a concise summary of what you did, what succeeded, what failed, and any actions that require human approval.
Be specific — include URLs, issue numbers, file names, and counts.
Format your response as plain text, not markdown.`,
        },
        {
          role: "user",
          content: `Execute this automation spec:\n\n${automation.spec}\n\nToday's date: ${new Date().toISOString().split("T")[0]}`,
        },
      ],
    });

    const summary =
      (response as any)?.choices?.[0]?.message?.content?.trim() ??
      "Automation completed but no summary was returned.";

    const durationMs = Date.now() - startedAt;

    // 5. Update run log
    if (runId) {
      await updateAutomationRun(runId, {
        status: "success",
        summary,
        completedAt: new Date(),
        durationMs,
      });
    }

    // 6. Update automation last run metadata
    await updateAutomation(automation.id, {
      lastRunAt: new Date(),
      lastRunStatus: "success",
      lastRunSummary: summary.slice(0, 1000),
      runCount: (automation.runCount ?? 0) + 1,
    });

    return res.json({ ok: true, summary, durationMs });
  } catch (error: any) {
    const durationMs = Date.now() - startedAt;
    const errorMsg = error?.message ?? String(error);
    const stack = error?.stack ?? "";

    // Update run log on error
    if (runId) {
      await updateAutomationRun(runId, {
        status: "error",
        summary: `Error: ${errorMsg}`,
        details: stack,
        completedAt: new Date(),
        durationMs,
      }).catch(() => {});
    }

    // Update automation last run status
    if (automationId) {
      await updateAutomation(automationId, {
        lastRunAt: new Date(),
        lastRunStatus: "error",
        lastRunSummary: `Error: ${errorMsg}`.slice(0, 1000),
      }).catch(() => {});
    }

    console.error("[AutomationRun] Error:", errorMsg);
    return res.status(500).json({
      error: errorMsg,
      stack,
      context: { taskUid: (req as any).__taskUid, automationId },
      timestamp: new Date().toISOString(),
    });
  }
}
