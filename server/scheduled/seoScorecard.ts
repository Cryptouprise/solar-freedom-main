import type { Request, Response } from "express";
import crypto from "node:crypto";
import { sdk } from "../_core/sdk";
import { refreshGscPageMetrics } from "../gscRefresh";

/** Refreshes source-of-truth GSC page metrics for the existing SEO agent and dashboard. */
export async function seoScorecardHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only endpoint" });

    const scorecard = await refreshGscPageMetrics();
    return res.json({ ok: true, scorecard, refreshedAt: new Date().toISOString() });
  } catch (error: any) {
    const errorId = crypto.randomUUID();
    console.error(`[SeoScorecard:${errorId}]`, error);
    return res.status(500).json({
      error: "SEO scorecard refresh failed",
      errorId,
      timestamp: new Date().toISOString(),
    });
  }
}
