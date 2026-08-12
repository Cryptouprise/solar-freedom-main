import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import {
  agentDailyChecklists,
  agentQualityReviews,
  agentRunLog,
} from "../../drizzle/schema";
import type { AgentSlug, AgentThinkResult } from "./engine";

export type WorkerSlug = Exclude<AgentSlug, "manager">;

export type DailyMatrixItem = {
  objective: string;
  revenuePath: string;
  successCriteria: string;
  minActions: number;
  minMessages: number;
};

export const DAILY_QUALITY_MATRIX: Record<WorkerSlug, DailyMatrixItem> = {
  revenue_intel: {
    objective: "Rank revenue opportunities using real lead, search, and conversion evidence.",
    revenuePath: "Prioritizes SEO and conversion changes by predicted dollars, then compares prediction with actual outcome.",
    successCriteria: "Produce at least one evidence-backed revenue action with predicted impact and confidence.",
    minActions: 1,
    minMessages: 0,
  },
  seo_intel: {
    objective: "Identify and execute the highest-impact SEO improvement on an existing, real Solar Freedom page.",
    revenuePath: "Improves qualified organic traffic and the volume of attorney-ready leads.",
    successCriteria: "Create at least one real-post recommendation or BlogStudio optimization draft with a target keyword and evidence.",
    minActions: 1,
    minMessages: 1,
  },
  money_maker: {
    objective: "Advance a verified attorney partnership or revenue-collection opportunity without inventing prospects or sending unapproved outreach.",
    revenuePath: "Creates attorney buyers and collects earned lead-delivery revenue.",
    successCriteria: "Log a verified prospect/revenue action, or explicitly document the external dependency that blocks it.",
    minActions: 1,
    minMessages: 1,
  },
  content: {
    objective: "Create a conversion-oriented, search-targeted draft based on the day’s verified opportunity.",
    revenuePath: "Creates pages designed to attract qualified solar-contract leads.",
    successCriteria: "Save a complete BlogStudio draft with target keyword, internal links, CTA, and strategy brief.",
    minActions: 1,
    minMessages: 1,
  },
  editor: {
    objective: "Perform an editorial, compliance, and conversion quality gate on new or existing content.",
    revenuePath: "Prevents low-quality or risky content from harming trust and search performance.",
    successCriteria: "Provide a review result, score, and actionable revision or approval decision.",
    minActions: 1,
    minMessages: 0,
  },
  infra: {
    objective: "Verify agent health, run evidence, retry failures, and cost/operational anomalies.",
    revenuePath: "Keeps revenue-producing automation dependable and reduces avoidable AI spend.",
    successCriteria: "Record health evidence and surface any broken workflow with a concrete owner and recovery state.",
    minActions: 0,
    minMessages: 0,
  },
};

export function denverBusinessDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Denver",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export async function ensureDailyChecklists(date = denverBusinessDate()): Promise<Record<WorkerSlug, number>> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const ids = {} as Record<WorkerSlug, number>;

  for (const [slug, matrix] of Object.entries(DAILY_QUALITY_MATRIX) as Array<[WorkerSlug, DailyMatrixItem]>) {
    const [existing] = await db.select({ id: agentDailyChecklists.id })
      .from(agentDailyChecklists)
      .where(and(eq(agentDailyChecklists.date, date), eq(agentDailyChecklists.agentSlug, slug)))
      .orderBy(desc(agentDailyChecklists.id))
      .limit(1);
    if (existing) {
      ids[slug] = existing.id;
      continue;
    }
    const [created] = await db.insert(agentDailyChecklists).values({
      date,
      agentSlug: slug,
      objective: matrix.objective,
      revenuePath: matrix.revenuePath,
      successCriteria: matrix.successCriteria,
      status: "planned",
    }).$returningId();
    ids[slug] = created.id;
  }
  return ids;
}

export async function beginChecklist(checklistId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(agentDailyChecklists).set({ status: "running", startedAt: new Date() })
    .where(eq(agentDailyChecklists.id, checklistId));
}

export type QualityVerdict = "passed" | "rework" | "blocked" | "failed";

export function evaluateDailyQuality(input: {
  agentSlug: WorkerSlug;
  summary?: string | null;
  errorMessage?: string | null;
  runStatus?: string | null;
  actionsCreated?: number | null;
  messagesCreated?: number | null;
  error?: Error;
}): { verdict: QualityVerdict; score: number; feedback: string; dimensions: Record<string, unknown> } {
  const matrix = DAILY_QUALITY_MATRIX[input.agentSlug];
  const summary = input.summary || "";
  const lower = `${summary}\n${input.errorMessage || ""}`.toLowerCase();
  const dependencyBlocked = /blocked|not configured|awaiting|external dependency|assistable/.test(lower);
  const failed = Boolean(input.error || input.runStatus === "failed" || /\berror\b|\bfailed\b/.test(lower));
  const evidenceQuality = summary.trim().length >= 80;
  const producedActions = Number(input.actionsCreated || 0) >= matrix.minActions;
  const producedMessages = Number(input.messagesCreated || 0) >= matrix.minMessages;
  const completed = input.runStatus === "completed" || Boolean(input.summary);

  const dimensions = {
    completed,
    evidenceQuality,
    producedActions,
    producedMessages,
    dependencyBlocked,
    failed,
    expected: matrix,
  };
  let score = 0;
  if (completed) score += 25;
  if (evidenceQuality) score += 25;
  if (producedActions) score += 25;
  if (producedMessages) score += 15;
  if (!failed) score += 10;

  const essentialDeliverableMissing = (matrix.minActions > 0 && !producedActions)
    || (matrix.minMessages > 0 && !producedMessages);

  let verdict: QualityVerdict = "passed";
  let feedback = "Output meets the deterministic daily quality matrix.";
  if (failed) {
    verdict = "failed";
    score = Math.min(score, 25);
    feedback = input.error?.message || input.errorMessage || "The agent run failed before producing reviewable evidence.";
  } else if (dependencyBlocked) {
    verdict = "blocked";
    score = Math.min(Math.max(score, 50), 60);
    feedback = "Work is transparently blocked by an external dependency. No unsupported completion was claimed; resolve the named dependency before retrying.";
  } else if (score < 70 || essentialDeliverableMissing) {
    verdict = "rework";
    feedback = `Quality score ${score}/100 is below the 70-point acceptance threshold or a required deliverable is missing. Required: ${matrix.successCriteria}`;
  }
  return { verdict, score, feedback, dimensions };
}

export async function reviewWorkerRun(params: {
  agentSlug: WorkerSlug;
  checklistId: number;
  result?: AgentThinkResult;
  error?: Error;
  retryNumber: number;
  date?: string;
}): Promise<{ verdict: QualityVerdict; score: number; feedback: string; runId: number | null }> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const date = params.date ?? denverBusinessDate();
  const [run] = await db.select().from(agentRunLog)
    .where(eq(agentRunLog.agentSlug, params.agentSlug))
    .orderBy(desc(agentRunLog.startedAt))
    .limit(1);
  const runId = run?.id ?? null;
  const summary = params.result?.summary || run?.summary || "";
  const quality = evaluateDailyQuality({
    agentSlug: params.agentSlug,
    summary,
    errorMessage: run?.errorMessage,
    runStatus: run?.status,
    actionsCreated: params.result?.actionsCreated ?? run?.actionsCreated,
    messagesCreated: params.result?.messagesCreated ?? run?.messagesCreated,
    error: params.error,
  });

  await db.insert(agentQualityReviews).values({
    date,
    agentSlug: params.agentSlug,
    runId: runId ?? 0,
    checklistId: params.checklistId,
    verdict: quality.verdict,
    qualityScore: quality.score,
    dimensions: JSON.stringify(quality.dimensions),
    feedback: quality.feedback,
    retryNumber: params.retryNumber,
  });
  await db.update(agentDailyChecklists).set({
    runId,
    status: quality.verdict,
    evidence: summary || run?.errorMessage || null,
    qaScore: quality.score,
    qaFeedback: quality.feedback,
    retryCount: params.retryNumber,
    completedAt: new Date(),
  }).where(eq(agentDailyChecklists.id, params.checklistId));

  return { verdict: quality.verdict, score: quality.score, feedback: quality.feedback, runId };
}
