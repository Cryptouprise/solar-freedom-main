import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "../db";
import {
  agentDailyChecklists,
  agentQualityReviews,
  agentRunLog,
  agentActions,
  contentPipeline,
  blogDrafts,
} from "../../drizzle/schema";
import type { AgentSlug, AgentThinkResult } from "./engine";
import { actualDraftWordCount, assessDraftReadiness, draftFingerprint } from "./contentAgent";
import { assessEditorialSafety } from "./editorAgent";

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

export type LinkedContentEvidence = {
  pipeline: typeof contentPipeline.$inferSelect;
  artifact?: typeof blogDrafts.$inferSelect;
  receipt: Record<string, any>;
  review: Record<string, any>;
};

export function validateLinkedContentEvidence(agentSlug: "content" | "editor", evidence: LinkedContentEvidence[]): { valid: boolean; issues: string[]; artifacts: unknown[] } {
  const issues: string[] = [];
  if (!evidence.length) issues.push("No actual run-linked full draft/artifact/review receipt exists.");
  const artifacts = evidence.map(({ pipeline: p, artifact, receipt, review }) => {
    const wordCount = actualDraftWordCount(p.draft);
    const fingerprint = draftFingerprint(p.draft);
    if (!p.draft || !artifact || artifact.id !== receipt.draftId || artifact.postSlug !== p.slug
      || artifact.content !== p.draft || artifact.targetKeyword !== p.targetKeyword || !p.targetKeyword?.trim()) {
      issues.push(`Pipeline #${p.id}: full draft, BlogStudio artifact and keyword do not match.`);
    }
    if (receipt.pipelineId !== p.id || receipt.fingerprint !== fingerprint || receipt.wordCount !== wordCount || p.wordCount !== wordCount) {
      issues.push(`Pipeline #${p.id}: recorded word count or draft fingerprint differs from actual text.`);
    }
    if (p.stage === "published") issues.push(`Pipeline #${p.id}: published labels are not proof of authenticated owner publication.`);
    const contradictory = /revision_needed|revision (?:needed|required)|cannot (?:approve|publish)/i.test(`${p.editorFeedback || ""} ${review.feedback || ""}`);
    if (agentSlug === "content") {
      if (!assessDraftReadiness(p.draft || "").passed || receipt.preflightPassed !== true
        || !["draft_complete", "in_review", "approved"].includes(p.stage)) {
        issues.push(`Pipeline #${p.id}: content is incomplete or still revision_needed; counters cannot turn it into an accepted draft.`);
      }
      if (!p.contentBrief || !/\[[^\]]+\]\(\/(?!\/)|href=["']\/(?!\/)/i.test(p.draft || "")) {
        issues.push(`Pipeline #${p.id}: saved strategy brief or actual internal links are missing.`);
      }
    } else {
      if (p.reviewedBy !== "editor" || receipt.fullDraftReviewed !== true || !["approve", "reject", "revision_needed"].includes(review.decision)
        || !["approved", "rejected", "revision_needed"].includes(p.stage) || !review.feedback?.trim()) {
        issues.push(`Pipeline #${p.id}: actual full-draft review decision and actionable feedback are missing.`);
      }
      const stage = review.decision === "approve" ? "approved" : review.decision === "reject" ? "rejected" : "revision_needed";
      if (p.stage !== stage) issues.push(`Pipeline #${p.id}: saved stage contradicts its review decision.`);
      for (const key of ["seoScore", "readabilityScore", "eatScore", "duplicateRisk"] as const) {
        if (typeof review[key] !== "number" || !Number.isFinite(review[key]) || review[key] < 0 || review[key] > 100 || review[key] !== p[key]) {
          issues.push(`Pipeline #${p.id}: ${key} is not a valid matching persisted review metric.`);
        }
      }
      if (review.decision === "approve") {
        const safety = assessEditorialSafety(p.draft);
        if (contradictory || safety.issues.length || safety.hardFails.length
          || (review.hardFails?.length || 0) > 0 || (review.issues?.length || 0) > 0
          || review.seoScore < 75 || review.readabilityScore < 70 || review.eatScore < 70 || review.duplicateRisk > 30) {
          issues.push(`Pipeline #${p.id}: approval contradicts revision_needed, compliance defects, or actual full-draft metrics.`);
        }
      }
    }
    if (p.stage === "approved" && contradictory) issues.push(`Pipeline #${p.id}: approved state contradicts revision_needed feedback.`);
    return { pipelineId: p.id, draftId: artifact?.id, stage: p.stage, wordCount, fingerprint, decision: review.decision };
  });
  return { valid: issues.length === 0, issues, artifacts };
}

export function evaluateDailyQuality(input: {
  agentSlug: WorkerSlug;
  summary?: string | null;
  errorMessage?: string | null;
  runStatus?: string | null;
  actionsCreated?: number | null;
  messagesCreated?: number | null;
  error?: Error;
  linkedEvidence?: LinkedContentEvidence[];
  noOp?: boolean;
}): { verdict: QualityVerdict; score: number; feedback: string; dimensions: Record<string, unknown> } {
  const matrix = DAILY_QUALITY_MATRIX[input.agentSlug];
  const summary = input.summary || "";
  const lower = `${summary}\n${input.errorMessage || ""}`.toLowerCase();
  const dependencyBlocked = /blocked|not configured|awaiting|external dependency|assistable/.test(lower);
  const failed = Boolean(input.error || input.runStatus === "failed" || /\berror\b|\bfailed\b/.test(lower));
  const evidenceQuality = summary.trim().length >= 80;
  const producedActions = Number(input.actionsCreated || 0) >= matrix.minActions;
  const producedMessages = Number(input.messagesCreated || 0) >= matrix.minMessages;
  const completed = input.runStatus ? input.runStatus === "completed" : Boolean(input.summary);

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
  if (input.agentSlug === "content" || input.agentSlug === "editor") {
    const linked = validateLinkedContentEvidence(input.agentSlug, input.linkedEvidence || []);
    Object.assign(dimensions, { linkedArtifacts: linked.artifacts, actualArtifactStateValid: linked.valid, artifactIssues: linked.issues });
    if (!failed && input.noOp && !input.linkedEvidence?.length) {
      verdict = "blocked"; score = 50;
      feedback = "Explicit no-op: no full draft or actual review queue exists. No approval or publication was claimed; there is no content deliverable to accept.";
    } else if (!failed && !linked.valid) {
      verdict = "rework"; score = Math.min(score, 60);
      feedback = `Quality score ${score}/100 is below the 70-point acceptance threshold or a required deliverable is missing. Actual linked artifact gate: ${linked.issues.join(" ")}`;
    } else if (!failed && !completed) {
      verdict = "rework"; score = Math.min(score, 60);
      feedback = "The exact artifact-linked run has not completed; no accepted content or review receipt can be claimed yet.";
    } else if (!failed && linked.valid && completed) {
      verdict = "passed"; score = 100;
      feedback = "Accepted actual run-linked full draft/artifact/review state, measured words, fingerprint and persisted decision; counters alone were not used.";
    }
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
    .where(params.result?.runId ? and(eq(agentRunLog.id, params.result.runId), eq(agentRunLog.agentSlug, params.agentSlug)) : eq(agentRunLog.agentSlug, params.agentSlug))
    .orderBy(desc(agentRunLog.startedAt))
    .limit(1);
  const runId = run?.id ?? null;
  const summary = params.result?.summary || run?.summary || "";
  const linkedEvidence: LinkedContentEvidence[] = [];
  if (runId && (params.agentSlug === "content" || params.agentSlug === "editor")) {
    const receipts = await db.select().from(agentActions).where(and(
      eq(agentActions.agentSlug, params.agentSlug), eq(agentActions.status, "completed"),
      eq(agentActions.actionType, params.agentSlug === "content" ? "content_artifact" : "editorial_review"),
      sql`JSON_VALID(${agentActions.payload}) AND JSON_EXTRACT(${agentActions.payload}, '$.runId') = ${runId}`,
    )).orderBy(desc(agentActions.id)).limit(5);
    for (const action of receipts) {
      try {
        const receipt = JSON.parse(action.payload || "{}");
        if (receipt.runId !== runId || !Number.isSafeInteger(receipt.pipelineId)) continue;
        const [pipeline] = await db.select().from(contentPipeline).where(eq(contentPipeline.id, receipt.pipelineId)).limit(1);
        if (!pipeline) continue;
        const [artifact] = Number.isSafeInteger(receipt.draftId)
          ? await db.select().from(blogDrafts).where(eq(blogDrafts.id, receipt.draftId)).limit(1) : [];
        linkedEvidence.push({ pipeline, artifact, receipt, review: JSON.parse(action.result || "{}") });
      } catch { /* Malformed evidence is never accepted. */ }
    }
  }
  const quality = evaluateDailyQuality({
    agentSlug: params.agentSlug,
    summary,
    errorMessage: run?.errorMessage,
    runStatus: run?.status || params.result?.status,
    actionsCreated: params.result?.actionsCreated ?? run?.actionsCreated,
    messagesCreated: params.result?.messagesCreated ?? run?.messagesCreated,
    error: params.error,
    linkedEvidence,
    noOp: params.result?.noOp ?? /^No-op:/i.test(summary),
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
