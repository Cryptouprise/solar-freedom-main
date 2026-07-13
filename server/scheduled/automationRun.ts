/**
 * /api/scheduled/automation-run
 *
 * Called by the Heartbeat platform when a user-defined automation cron fires.
 * Looks up the automation by taskUid and records a truthful evidence receipt.
 * Prompt-only specs are blocked because this route has no typed tool runner.
 *
 * Auth: cron-only (user.isCron === true, user.taskUid set by platform).
 */
import type { Request, Response } from "express";
import crypto from "node:crypto";
import { sdk } from "../_core/sdk";
import {
  updateAutomation,
  createAutomationRun,
  updateAutomationRun,
} from "../db";
import { automations } from "../../drizzle/schema";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { createPromptOnlyReceipt, summarizePromptOnlyReceipt } from "../automationPolicy";
import { logSafeError } from "../_core/safeLog";

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

    // 4. Prompt text is not an executor. Record a content-addressed receipt
    // proving that no tool call or external state change was attempted.
    const completedAt = new Date();
    const receipt = createPromptOnlyReceipt({
      automationId: automation.id,
      taskUid: user.taskUid,
      spec: automation.spec,
      startedAt: new Date(startedAt),
      completedAt,
    });
    const summary = summarizePromptOnlyReceipt(receipt);
    const durationMs = Date.now() - startedAt;

    // 5. Update run log
    if (runId) {
      await updateAutomationRun(runId, {
        status: "blocked",
        summary,
        details: JSON.stringify(receipt, null, 2),
        completedAt,
        durationMs,
      });
    }

    // 6. Update automation last run metadata
    await updateAutomation(automation.id, {
      lastRunAt: new Date(),
      lastRunStatus: "blocked",
      lastRunSummary: summary.slice(0, 1000),
      runCount: (automation.runCount ?? 0) + 1,
    });

    return res.json({
      ok: true,
      executed: false,
      outcome: "blocked",
      summary,
      receipt,
      durationMs,
    });
  } catch (error: any) {
    const durationMs = Date.now() - startedAt;
    const errorId = crypto.randomUUID();
    const safeSummary = `Automation run failed; reference ${errorId}`;

    // Update run log on error
    if (runId) {
      await updateAutomationRun(runId, {
        status: "error",
        summary: safeSummary,
        details: safeSummary,
        completedAt: new Date(),
        durationMs,
      }).catch(() => {});
    }

    // Update automation last run status
    if (automationId) {
      await updateAutomation(automationId, {
        lastRunAt: new Date(),
        lastRunStatus: "error",
        lastRunSummary: safeSummary,
      }).catch(() => {});
    }

    logSafeError("automation.run_failed", error);
    return res.status(500).json({
      error: "Automation run failed",
      errorId,
      timestamp: new Date().toISOString(),
    });
  }
}
