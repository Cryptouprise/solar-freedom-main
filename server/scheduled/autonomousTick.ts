import type { Request, Response } from "express";
import { sdk } from "../_core/sdk";
import { readAutonomousScheduleBinding } from "../autonomousQueue";
import { runAutonomousTick } from "../autonomousWorker";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { autonomousWorkItems } from "../../drizzle/schema";

export async function autonomousTickHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only endpoint" });
    const binding = await readAutonomousScheduleBinding(user.taskUid);
    if (!binding || binding.binding.kind !== "worker") return res.status(403).json({ error: "Unbound autonomous-worker schedule" });
    // Awaited work; lease/retry lives in the DB. Nothing depends on process uptime after response.
    const result = await runAutonomousTick();
    const db = await getDb();
    if (db) await db.update(autonomousWorkItems).set({ resultSummary: `Tick ${result.status}: ${"summary" in result ? result.summary : ""}`, updatedAt: new Date() }).where(eq(autonomousWorkItems.id, binding.id));
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: String(error?.message || error).slice(0, 500), timestamp: new Date().toISOString() });
  }
}
