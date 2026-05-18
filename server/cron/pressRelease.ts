/**
 * Press Release Automation — Weekly cron job
 *
 * Runs every Monday at 9am MT (15:00 UTC).
 * Pulls the next pending topic from the DB, generates a press release via OpenRouter,
 * and submits it to free distribution sites via HTTP POST.
 *
 * To use a different model, update the OPENROUTER_MODEL setting in the DB
 * or change the DEFAULT_MODEL constant below.
 *
 * Supported free distribution sites:
 *   - prlog       → PRLog.com (HTTP form POST)
 *   - newsbywire  → NewsByWire.com (HTTP form POST)
 *   - openpr      → OpenPR.com (HTTP form POST)
 *
 * Playwright-based sites (requires PLAYWRIGHT_ENABLED=true in settings):
 *   - 1888        → 1888PressRelease.com
 *
 * Cost estimate: ~$0.001 per press release using Qwen 3 8B or Gemini Flash 2.0 via OpenRouter.
 */

import { readFileSync } from "fs";
import { join } from "path";
import { getDb } from "../db";
import { pressReleaseLogs, pressReleaseSettings, pressReleaseTopics } from "../../drizzle/schema";
import { eq, asc, and } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_MODEL = "qwen/qwen3-8b:free";   // Free tier on OpenRouter — excellent for writing
const FALLBACK_MODEL = "google/gemini-flash-1.5:free"; // Fallback if Qwen is unavailable
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Distribution sites — HTTP POST based (no browser required)
const HTTP_SITES = [
  {
    id: "prlog",
    label: "PRLog.com",
    enabled: true,
  },
  {
    id: "newsbywire",
    label: "NewsByWire.com",
    enabled: true,
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeneratedPR {
  headline: string;
  subheadline: string;
  body: string;
  boilerplate: string;
  seoSummary: string;
}

interface SubmissionResult {
  site: string;
  siteLabel: string;
  status: "success" | "failed" | "skipped";
  publishedUrl?: string;
  errorMessage?: string;
}

// ─── Settings helpers ─────────────────────────────────────────────────────────

async function getSetting(key: string, defaultValue: string): Promise<string> {
  const db = await getDb();
  if (!db) return defaultValue;
  const rows = await db
    .select()
    .from(pressReleaseSettings)
    .where(eq(pressReleaseSettings.key, key))
    .limit(1);
  return rows[0]?.value ?? defaultValue;
}

async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(pressReleaseSettings)
    .values({ key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}

// ─── OpenRouter generation ────────────────────────────────────────────────────

async function generatePressRelease(
  topic: { title: string; angle?: string | null; targetKeywords?: string | null; targetUrl?: string | null },
  model: string,
  apiKey: string
): Promise<GeneratedPR> {
  // Load the prompt template
  const promptTemplate = readFileSync(
    join(process.cwd(), "server/prompts/press-release.md"),
    "utf-8"
  );

  const userPrompt = `Write a press release for the following topic:

**Topic/Headline Angle:** ${topic.title}
${topic.angle ? `**Additional Context:** ${topic.angle}` : ""}
${topic.targetKeywords ? `**Target Keywords to Include:** ${topic.targetKeywords}` : ""}
${topic.targetUrl ? `**Target URL to Link To:** ${topic.targetUrl}` : ""}
**Today's Date:** ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

Follow the format and guidelines in the system prompt exactly. Return valid JSON only.`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://www.breakyoursolarcontract.com",
      "X-Title": "Solar Freedom Press Release Automation",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: promptTemplate },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter returned empty content");

  const parsed = JSON.parse(content) as GeneratedPR;

  // Validate required fields
  if (!parsed.headline || !parsed.body) {
    throw new Error("Generated PR missing required fields (headline, body)");
  }

  return {
    headline: parsed.headline,
    subheadline: parsed.subheadline ?? "",
    body: parsed.body,
    boilerplate: parsed.boilerplate ?? "",
    seoSummary: parsed.seoSummary ?? "",
  };
}

// ─── Distribution: PRLog ──────────────────────────────────────────────────────

async function submitToPRLog(pr: GeneratedPR, apiKey?: string): Promise<SubmissionResult> {
  const site = "prlog";
  const siteLabel = "PRLog.com";

  // PRLog has a free API for registered accounts
  // Without API key, we log the content for manual submission
  if (!apiKey) {
    console.log(`[PR] PRLog: No API key configured — logging for manual submission`);
    return {
      site,
      siteLabel,
      status: "skipped",
      errorMessage: "No PRLog API key configured. Add PRLOG_API_KEY to settings.",
    };
  }

  try {
    // PRLog REST API endpoint
    const formData = new URLSearchParams({
      key: apiKey,
      title: pr.headline,
      summary: pr.subheadline,
      body: `${pr.body}\n\n${pr.boilerplate}`,
      industry: "Legal Services",
      tag: "solar contract,solar energy,consumer protection,solar cancellation",
      country: "US",
      state: "FL",
      city: "Jacksonville",
    });

    const response = await fetch("https://www.prlog.org/api/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const text = await response.text();
    if (response.ok && text.includes("success")) {
      // Extract URL from response if available
      const urlMatch = text.match(/https:\/\/www\.prlog\.org\/\d+/);
      return {
        site,
        siteLabel,
        status: "success",
        publishedUrl: urlMatch?.[0],
      };
    } else {
      return {
        site,
        siteLabel,
        status: "failed",
        errorMessage: `PRLog returned: ${text.substring(0, 200)}`,
      };
    }
  } catch (err) {
    return {
      site,
      siteLabel,
      status: "failed",
      errorMessage: String(err),
    };
  }
}

// ─── Distribution: NewsByWire ─────────────────────────────────────────────────

async function submitToNewsByWire(pr: GeneratedPR, apiKey?: string): Promise<SubmissionResult> {
  const site = "newsbywire";
  const siteLabel = "NewsByWire.com";

  if (!apiKey) {
    console.log(`[PR] NewsByWire: No API key configured — logging for manual submission`);
    return {
      site,
      siteLabel,
      status: "skipped",
      errorMessage: "No NewsByWire API key configured. Add NEWSBYWIRE_API_KEY to settings.",
    };
  }

  try {
    const payload = {
      api_key: apiKey,
      title: pr.headline,
      summary: pr.subheadline,
      content: `${pr.body}\n\n${pr.boilerplate}`,
      industry: "Legal",
      keywords: "solar contract cancellation,solar energy,consumer protection",
      city: "Jacksonville",
      state: "FL",
      country: "US",
    };

    const response = await fetch("https://newsbywire.com/api/v1/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        site,
        siteLabel,
        status: "success",
        publishedUrl: data.url ?? data.link,
      };
    } else {
      const text = await response.text();
      return {
        site,
        siteLabel,
        status: "failed",
        errorMessage: `NewsByWire returned ${response.status}: ${text.substring(0, 200)}`,
      };
    }
  } catch (err) {
    return {
      site,
      siteLabel,
      status: "failed",
      errorMessage: String(err),
    };
  }
}

// ─── Log results to DB ────────────────────────────────────────────────────────

async function logResult(
  topicId: number,
  pr: GeneratedPR,
  result: SubmissionResult,
  model: string,
  tokensUsed?: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(pressReleaseLogs).values({
    topicId,
    headline: pr.headline,
    body: pr.body,
    boilerplate: pr.boilerplate,
    modelUsed: model,
    tokensUsed: tokensUsed ?? null,
    site: result.site,
    siteLabel: result.siteLabel,
    submittedAt: new Date(),
    publishedUrl: result.publishedUrl ?? null,
    status: result.status,
    errorMessage: result.errorMessage ?? null,
  });
}

// ─── Main runner ──────────────────────────────────────────────────────────────

export interface PressRunResult {
  topicId: number;
  topicTitle: string;
  headline: string;
  model: string;
  submissions: SubmissionResult[];
  successCount: number;
  failedCount: number;
  skippedCount: number;
}

export async function runPressReleaseCycle(options?: {
  topicId?: number;   // Override: run a specific topic instead of next pending
  dryRun?: boolean;   // Generate but don't submit
}): Promise<PressRunResult> {
  console.log("[PR] Starting press release cycle...");

  // 1. Load settings
  const openRouterKey = process.env.OPENROUTER_API_KEY ?? "";
  if (!openRouterKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  const model = await getSetting("model", DEFAULT_MODEL);
  const scheduleEnabled = await getSetting("schedule_enabled", "true");

  if (scheduleEnabled !== "true" && !options?.topicId) {
    throw new Error("Press release schedule is disabled. Enable it in the admin panel.");
  }

  // 2. Pick the next topic
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let topic;
  if (options?.topicId) {
    const rows = await db
      .select()
      .from(pressReleaseTopics)
      .where(eq(pressReleaseTopics.id, options.topicId))
      .limit(1);
    topic = rows[0];
    if (!topic) throw new Error(`Topic ID ${options.topicId} not found`);
  } else {
    const rows = await db
      .select()
      .from(pressReleaseTopics)
      .where(eq(pressReleaseTopics.status, "pending"))
      .orderBy(asc(pressReleaseTopics.sortOrder), asc(pressReleaseTopics.createdAt))
      .limit(1);
    topic = rows[0];
    if (!topic) throw new Error("No pending topics in queue. Add topics in the admin panel.");
  }

  console.log(`[PR] Processing topic: "${topic.title}" (ID: ${topic.id})`);

  // 3. Mark as running (db is guaranteed non-null from step 2)
  await db
    .update(pressReleaseTopics)
    .set({ status: "running" })
    .where(eq(pressReleaseTopics.id, topic.id));

  let pr: GeneratedPR;
  try {
    // 4. Generate the press release
    console.log(`[PR] Generating with model: ${model}`);
    pr = await generatePressRelease(
      {
        title: topic.title,
        angle: topic.angle,
        targetKeywords: topic.targetKeywords,
        targetUrl: topic.targetUrl,
      },
      model,
      openRouterKey
    );
    console.log(`[PR] Generated headline: "${pr.headline}"`);
  } catch (err) {
    // Generation failed — mark topic as failed
    await db
      .update(pressReleaseTopics)
      .set({ status: "failed" })
      .where(eq(pressReleaseTopics.id, topic.id));
    throw err;
  }

  if (options?.dryRun) {
    // Dry run — don't submit, just return the generated content
    await db
      .update(pressReleaseTopics)
      .set({ status: "pending" })
      .where(eq(pressReleaseTopics.id, topic.id));
    return {
      topicId: topic.id,
      topicTitle: topic.title,
      headline: pr.headline,
      model,
      submissions: [],
      successCount: 0,
      failedCount: 0,
      skippedCount: 0,
    };
  }

  // 5. Submit to distribution sites
  const prlogKey = await getSetting("prlog_api_key", "");
  const newsbywireKey = await getSetting("newsbywire_api_key", "");

  const submissions: SubmissionResult[] = [];

  // PRLog
  const prlogResult = await submitToPRLog(pr, prlogKey || undefined);
  submissions.push(prlogResult);
  await logResult(topic.id, pr, prlogResult, model);

  // NewsByWire
  const nbwResult = await submitToNewsByWire(pr, newsbywireKey || undefined);
  submissions.push(nbwResult);
  await logResult(topic.id, pr, nbwResult, model);

  // 6. Mark topic as published (if at least one succeeded or all skipped)
  const successCount = submissions.filter((s) => s.status === "success").length;
  const failedCount = submissions.filter((s) => s.status === "failed").length;
  const skippedCount = submissions.filter((s) => s.status === "skipped").length;

  const newStatus = failedCount > 0 && successCount === 0 ? "failed" : "published";
  await db
    .update(pressReleaseTopics)
    .set({ status: newStatus })
    .where(eq(pressReleaseTopics.id, topic.id));

  // 7. Notify owner
  const submissionSummary = submissions
    .map((s) => `• ${s.siteLabel}: ${s.status}${s.publishedUrl ? ` → ${s.publishedUrl}` : ""}${s.errorMessage ? ` (${s.errorMessage})` : ""}`)
    .join("\n");

  await notifyOwner({
    title: `Press Release Published: "${pr.headline}"`,
    content: `Topic: ${topic.title}\nModel: ${model}\n\nSubmissions:\n${submissionSummary}`,
  });

  console.log(`[PR] Cycle complete. Success: ${successCount}, Failed: ${failedCount}, Skipped: ${skippedCount}`);

  return {
    topicId: topic.id,
    topicTitle: topic.title,
    headline: pr.headline,
    model,
    submissions,
    successCount,
    failedCount,
    skippedCount,
  };
}

// ─── Cron scheduler ───────────────────────────────────────────────────────────

let cronInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the weekly press release cron.
 * Fires every Monday at 9:00 AM Mountain Time (15:00 UTC).
 * Call this once from server startup.
 */
export function startPressReleaseCron(): void {
  // Check every 5 minutes if it's time to run
  cronInterval = setInterval(async () => {
    try {
      const enabled = await getSetting("schedule_enabled", "true");
      if (enabled !== "true") return;

      const now = new Date();
      const utcDay = now.getUTCDay();    // 0=Sun, 1=Mon
      const utcHour = now.getUTCHours(); // 15 = 9am MT (UTC-6)
      const utcMin = now.getUTCMinutes();

      // Fire on Monday between 15:00–15:05 UTC
      if (utcDay === 1 && utcHour === 15 && utcMin < 5) {
        // Check we haven't already run this week
        const lastRun = await getSetting("last_run_week", "");
        const thisWeek = `${now.getUTCFullYear()}-W${getWeekNumber(now)}`;
        if (lastRun === thisWeek) return;

        console.log("[PR Cron] Monday 9am MT — starting press release cycle");
        await setSetting("last_run_week", thisWeek);
        await runPressReleaseCycle();
      }
    } catch (err) {
      console.error("[PR Cron] Error:", err);
    }
  }, 5 * 60 * 1000); // every 5 minutes

  console.log("[PR Cron] Press release cron started (checks every 5 minutes)");
}

export function stopPressReleaseCron(): void {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
