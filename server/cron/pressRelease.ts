/**
 * Press-release draft generator — approval-first, dry-run only.
 *
 * This runtime module can generate a reviewable draft. It does not contain a
 * publisher, credentialed browser flow, distribution adapter, or scheduler.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { asc, eq } from "drizzle-orm";
import { pressReleaseSettings, pressReleaseTopics } from "../../drizzle/schema";
import { getDb } from "../db";
import { callLLM } from "./aiCostTracker";

const DEFAULT_MODEL = "openrouter/free";

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

async function generatePressRelease(
  topic: {
    title: string;
    angle?: string | null;
    targetKeywords?: string | null;
    targetUrl?: string | null;
  },
  model: string,
  topicId: number,
): Promise<GeneratedPR> {
  const promptTemplate = readFileSync(
    join(process.cwd(), "server/prompts/press-release.md"),
    "utf8",
  );

  const userPrompt = `Write a press release for the following topic:

**Topic/Headline Angle:** ${topic.title}
${topic.angle ? `**Additional Context:** ${topic.angle}` : ""}
${topic.targetKeywords ? `**Target Keywords to Include:** ${topic.targetKeywords}` : ""}
${topic.targetUrl ? `**Target URL to Link To:** ${topic.targetUrl}` : ""}
**Today's Date:** ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

Follow the format and guidelines in the system prompt exactly. Return valid JSON only.`;

  const content = await callLLM({
    model,
    messages: [
      { role: "system", content: promptTemplate },
      { role: "user", content: userPrompt },
    ],
    feature: "press_release_draft",
    referenceId: topicId,
    referenceType: "press_release_topic",
    responseFormat: { type: "json_object" },
    temperature: 0.7,
    maxTokens: 2000,
  });
  if (!content) throw new Error("OpenRouter returned empty content");

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("OpenRouter returned invalid press release JSON");
  }

  if (
    !parsed
    || typeof parsed !== "object"
    || typeof (parsed as Partial<GeneratedPR>).headline !== "string"
    || typeof (parsed as Partial<GeneratedPR>).body !== "string"
    || !(parsed as Partial<GeneratedPR>).headline?.trim()
    || !(parsed as Partial<GeneratedPR>).body?.trim()
  ) {
    throw new Error("Generated PR missing required fields (headline, body)");
  }

  const draft = parsed as Partial<GeneratedPR> & Pick<GeneratedPR, "headline" | "body">;
  return {
    headline: draft.headline,
    subheadline: typeof draft.subheadline === "string" ? draft.subheadline : "",
    body: draft.body,
    boilerplate: typeof draft.boilerplate === "string" ? draft.boilerplate : "",
    seoSummary: typeof draft.seoSummary === "string" ? draft.seoSummary : "",
  };
}

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
  topicId?: number;
  dryRun?: boolean;
}): Promise<PressRunResult> {
  const dryRun = options?.dryRun ?? true;
  if (!dryRun) {
    throw new Error(
      "External publication is disabled until an approval-bound, idempotent, verified adapter is implemented.",
    );
  }

  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  const model = await getSetting("model", DEFAULT_MODEL);
  const scheduleEnabled = await getSetting("schedule_enabled", "false");
  if (scheduleEnabled !== "true" && !options?.topicId) {
    throw new Error("Press release schedule is disabled. Enable it in the admin panel.");
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const topic = options?.topicId
    ? (await db
        .select()
        .from(pressReleaseTopics)
        .where(eq(pressReleaseTopics.id, options.topicId))
        .limit(1))[0]
    : (await db
        .select()
        .from(pressReleaseTopics)
        .where(eq(pressReleaseTopics.status, "pending"))
        .orderBy(asc(pressReleaseTopics.sortOrder), asc(pressReleaseTopics.createdAt))
        .limit(1))[0];

  if (!topic) {
    throw new Error(
      options?.topicId
        ? `Topic ID ${options.topicId} not found`
        : "No pending topics in queue. Add topics in the admin panel.",
    );
  }

  await db
    .update(pressReleaseTopics)
    .set({ status: "running" })
    .where(eq(pressReleaseTopics.id, topic.id));

  let draft: GeneratedPR;
  try {
    draft = await generatePressRelease(
      {
        title: topic.title,
        angle: topic.angle,
        targetKeywords: topic.targetKeywords,
        targetUrl: topic.targetUrl,
      },
      model,
      topic.id,
    );
  } catch (error) {
    await db
      .update(pressReleaseTopics)
      .set({ status: "failed" })
      .where(eq(pressReleaseTopics.id, topic.id));
    throw error;
  }

  // A successful draft is returned to the queue for explicit human review.
  await db
    .update(pressReleaseTopics)
    .set({ status: "pending" })
    .where(eq(pressReleaseTopics.id, topic.id));

  return {
    topicId: topic.id,
    topicTitle: topic.title,
    headline: draft.headline,
    model,
    submissions: [],
    successCount: 0,
    failedCount: 0,
    skippedCount: 0,
  };
}

export function startPressReleaseCron(): void {
  console.warn(
    "[PR Cron] Disabled: external publishing requires an approval-bound execution service.",
  );
}

export function stopPressReleaseCron(): void {
  // Intentionally empty. This runtime never starts an in-process publisher.
}
