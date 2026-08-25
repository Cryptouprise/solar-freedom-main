import type { Request, Response } from "express";
import { desc, eq, gte } from "drizzle-orm";
import { getDb } from "../db";
import { sdk } from "../_core/sdk";
import { notifyOwner } from "../_core/notification";
import { agentDailyChecklists, blogDrafts, seoPages, systemChangeLog } from "../../drizzle/schema";
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
    timeZone: "America/Denver", hour: "numeric", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const hour = Number(parts.find(part => part.type === "hour")?.value);
  const minute = Number(parts.find(part => part.type === "minute")?.value);
  return hour === 8 && minute === 30;
}

function workerSummary(rows: ReportRow[], date: string): string {
  const passed = rows.filter(row => row.status === "passed").length;
  const needsAttention = rows.filter(row => !["passed", "planned"].includes(row.status)).length;
  const lines = rows.map(row => {
    const score = row.qaScore == null ? "—" : `${row.qaScore}/100`;
    const detail = row.qaFeedback || row.evidence || "Awaiting worker evidence.";
    return `• ${row.agentSlug}: ${row.status} (${score})${row.retryCount ? `; retry ${row.retryCount}` : ""}\n  ${detail.slice(0, 320)}`;
  });
  return [
    `Manager QA report — ${date} (America/Denver)`,
    `Workers passed: ${passed}/${rows.length}. Workers needing attention: ${needsAttention}.`, "", ...lines,
    "", "Open /admin/agents for full evidence, action outcomes, and run history.",
  ].join("\n");
}

async function seoSummary(): Promise<string> {
  const db = await getDb();
  if (!db) return "SEO Performance\nDatabase unavailable; no SEO measurements could be included.";
  const freshSince = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
  const sinceYesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [pages, changes, drafts] = await Promise.all([
    db.select({ url: seoPages.url, clicks: seoPages.gscClicks, impressions: seoPages.gscImpressions, position: seoPages.gscAvgPosition, indexStatus: seoPages.gscIndexStatus })
      .from(seoPages).where(gte(seoPages.gscLastChecked, freshSince)).orderBy(desc(seoPages.gscImpressions)).limit(100),
    db.select({ description: systemChangeLog.description, category: systemChangeLog.category })
      .from(systemChangeLog).where(gte(systemChangeLog.createdAt, sinceYesterday)).orderBy(desc(systemChangeLog.createdAt)).limit(6),
    db.select({ postSlug: blogDrafts.postSlug, title: blogDrafts.title, targetKeyword: blogDrafts.targetKeyword })
      .from(blogDrafts).where(gte(blogDrafts.updatedAt, sinceYesterday)).orderBy(desc(blogDrafts.updatedAt)).limit(6),
  ]);
  if (pages.length === 0) {
    return "SEO Performance\nNo fresh Search Console page measurements are stored. The report will show rankings after the next authenticated GSC refresh.";
  }
  const indexed = pages.filter(page => page.indexStatus === "indexed").length;
  const topPages = pages.slice(0, 5).map(page => {
    const position = page.position ? Number(page.position).toFixed(1) : "—";
    return `• ${page.url.replace("https://breakyoursolarcontract.com", "") || "/"}: ${page.clicks ?? 0} clicks, ${page.impressions ?? 0} impressions, average position ${position}`;
  });
  const changeLines = changes.map(change => `• ${change.category}: ${change.description.slice(0, 220)}`);
  const draftLines = drafts.map(draft => `• Review draft: ${draft.title || draft.postSlug}${draft.targetKeyword ? ` — keyword: ${draft.targetKeyword}` : ""}`);
  return [
    "SEO Performance — verified current data",
    `Fresh measured pages: ${pages.length}; indexed: ${indexed}; freshness threshold: eight days.`,
    "Top pages by Search Console impressions:", ...topPages,
    "Recent SEO/system changes (last 24 hours):", ...(changeLines.length ? changeLines : ["• No SEO/system changes logged in the last 24 hours."]),
    "Recent review-required SEO drafts (last 24 hours):", ...(draftLines.length ? draftLines : ["• No new SEO drafts awaiting review."]),
    "Rank movement will be reported once two verified daily snapshots exist; this report never estimates ranking movement.",
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
      agentSlug: agentDailyChecklists.agentSlug, status: agentDailyChecklists.status, qaScore: agentDailyChecklists.qaScore,
      qaFeedback: agentDailyChecklists.qaFeedback, evidence: agentDailyChecklists.evidence, retryCount: agentDailyChecklists.retryCount,
    }).from(agentDailyChecklists).where(eq(agentDailyChecklists.date, date)).orderBy(agentDailyChecklists.agentSlug);
    const content = `${workerSummary(rows, date)}\n\n${await seoSummary()}`;
    const delivered = await notifyOwner({ title: `Solar Freedom Manager QA — ${date}`, content });
    if (!delivered) return res.status(502).json({ error: "Owner notification service did not accept report" });
    return res.json({ ok: true, date, workers: rows.length, delivered: true });
  } catch (error: any) {
    console.error("[ManagerQaReport] Error:", error);
    return res.status(500).json({ ok: false, error: error?.message || String(error), timestamp: new Date().toISOString() });
  }
}
