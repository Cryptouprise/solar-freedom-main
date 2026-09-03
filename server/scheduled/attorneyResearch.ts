/**
 * /api/scheduled/attorney-research
 *
 * Nightly Heartbeat producer: one rotating state's Justia consumer-law listing.
 * Auth: cron-only (user.isCron === true).
 */
import type { Request, Response } from "express";
import { sdk } from "../_core/sdk";
import { isTwoAmMountain, runJustiaAttorneyResearch } from "../justiaAttorneyResearch";

export async function attorneyResearchHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only endpoint" });
    }

    const payload = req.body || {};
    if (payload.scheduleMode === "mountain_2" && !isTwoAmMountain()) {
      return res.json({ ok: true, skipped: "Outside 2:00 AM America/Denver window" });
    }

    const result = await runJustiaAttorneyResearch([], undefined);
    return res.json({ ok: true, ...result, taskUid: user.taskUid });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[AttorneyResearch] Error:", error);
    return res.status(500).json({
      ok: false,
      error: message,
      context: { path: req.path },
      timestamp: new Date().toISOString(),
    });
  }
}
