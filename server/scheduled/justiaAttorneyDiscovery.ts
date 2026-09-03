/**
 * Nightly Justia attorney discovery.
 * One rotating state, paginated public listings, no outreach.
 */
import type { Request, Response } from "express";
import { sdk } from "../_core/sdk";
import { executeJustiaAttorneyResearch, rotateJustiaState } from "../justiaAttorneyResearch";

function mountainHour(now = new Date()) {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Denver",
    hour: "numeric",
    hour12: false,
  }).formatToParts(now).find((part) => part.type === "hour")?.value;
  return Number(hour);
}

export async function justiaAttorneyDiscoveryHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only endpoint" });

    const scheduleMode = (req.body || {}).scheduleMode;
    if (scheduleMode === "mountain_2" && mountainHour() !== 2) {
      return res.json({ ok: true, skipped: true, reason: "outside 2:00 AM America/Denver window" });
    }

    const state = rotateJustiaState();
    const result = await executeJustiaAttorneyResearch([state], {
      maxPagesPerState: 5,
      maxSaves: 200,
    });
    return res.json({ ok: true, state, ...result, taskUid: user.taskUid });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[JustiaAttorneyDiscovery] Error:", error);
    return res.status(500).json({ ok: false, error: message, timestamp: new Date().toISOString() });
  }
}
