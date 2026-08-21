import type { Request, Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { sdk } from "../_core/sdk";
import { notifyOwner } from "../_core/notification";
import { agentDailyChecklists, agentQualityReviews } from "../../drizzle/schema";
import { denverBusinessDate } from "../agents/managerQuality";

type ReportRow = {
  agentSlug: string;
  status: string;
  qaScore: number | null;
  qaFeedback: string | null;
  evidence: string | null;
  retryCount: number | null;
};

function isEightThirtyMountain(now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Denver",
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = Number(parts.find(part => part.type === "hour")?.value);
  const minute = Number(parts.find(part => part.type === "minute")?.value);
  return hour === 8 && minute === 30;
}

function summarize(rows: ReportRow[], date: string): string {
  const passed = rows.filter(row => row.status === "passed").length;
  const needsAttention = rows.filter(row => !["passed", "planned"].includes(row.status)).length;
  const lines = rows.map(row => {
    const score = row.qaScore == null ? "—" : `${row.qaScore}/100`;
    const detail = row.qaFeedback || row.evidence || "Awaiting worker evidence.";
    return `• ${row.agentSlug}: ${row.status} (${score})${row.retryCount ? `; retry ${row.retryCount}` : ""}\n  ${detail.slice(0, 320)}`;
  });
  return [
    `Manager QA report — ${date} (America/Denver)`,
    `Workers passed: ${passed}/${rows.length}. Workers needing attention: ${needsAttention}.`,
    "",
    ...lines,
    "",
    "Open /admin/agents for full evidence, action outcomes, and run history.",
  ].join("\n");
}

/** Daily owner report. Cron authentication prevents public access. */
export async function managerQaReportHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only endpoint" });
    if (req.body?.scheduleMode === "mountain_830" && !isEightThirtyMountain()) {
      return res.json({ ok: true, skipped: "Outside 8:30 AM America/Denver window" });
    }

    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });
    const date = denverBusinessDate();
    const rows = await db.select({
      agentSlug: agentDailyChecklists.agentSlug,
      status: agentDailyChecklists.status,
      qaScore: agentDailyChecklists.qaScore,
      qaFeedback: agentDailyChecklists.qaFeedback,
      evidence: agentDailyChecklists.evidence,
      retryCount: agentDailyChecklists.retryCount,
    }).from(agentDailyChecklists)
      .where(eq(agentDailyChecklists.date, date))
      .orderBy(agentDailyChecklists.agentSlug);

    const content = summarize(rows, date);
    const delivered = await notifyOwner({ title: `Solar Freedom Manager QA — ${date}`, content });
    if (!delivered) return res.status(502).json({ error: "Owner notification service did not accept report" });
    return res.json({ ok: true, date, workers: rows.length, delivered: true });
  } catch (error: any) {
    console.error("[ManagerQaReport] Error:", error);
    return res.status(500).json({ ok: false, error: error?.message || String(error), timestamp: new Date().toISOString() });
  }
}
