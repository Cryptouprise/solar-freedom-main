import type { ContentPipeline, BlogDraft } from "../drizzle/schema";
import { agentActions, blogDrafts, contentPipeline } from "../drizzle/schema";
import { and, asc, desc, eq, ne, notInArray, sql } from "drizzle-orm";
import { getDb } from "./db";
import { actualDraftWordCount, draftFingerprint, normalizedContentTarget } from "./agents/contentAgent";
import { assessEditorialSafety, editorialDecision } from "./agents/editorAgent";

/** Read-only snapshot supplied by the durable dispatcher; no LLM, DB writes or publishing. */
export type AutonomousContentRow = Pick<ContentPipeline,
  "id" | "title" | "slug" | "targetKeyword" | "contentType" | "stage" | "draft" |
  "finalContent" | "revisionCount" | "wordCount" | "reviewedBy" | "editorFeedback" |
  "seoScore" | "readabilityScore" | "eatScore" | "duplicateRisk" | "createdAt">;
export type AutonomousDraftArtifact = Pick<BlogDraft, "id" | "postSlug" | "content" | "targetKeyword">;
export type AutonomousEditorialReceipt = {
  id: number;
  agentSlug: string;
  actionType: string;
  status: string;
  payload: string | null;
  result: string | null;
};
export type AutonomousContentSnapshot = {
  rows: readonly AutonomousContentRow[];
  artifacts?: readonly AutonomousDraftArtifact[];
  editorialReviews?: readonly AutonomousEditorialReceipt[];
  /** Persist the selected ID before dispatch and pass it on every continuation. Never retarget silently. */
  canonicalItemId?: number | null;
  /** Existing durable revisionCount is authoritative; default two, hard maximum three. */
  maxRevisions?: 2 | 3;
};
type PlanBase = {
  itemId: number | null;
  canonicalTarget: string | null;
  reason: string;
  /** Always false: editorial readiness is never publication authorization. */
  publish: false;
};
export type AutonomousContentPlan = PlanBase & (
  | { state: "dispatch"; nextRole: "content" | "editor"; expectedStage: ContentPipeline["stage"]; expectedFingerprint: string }
  | { state: "owner_ready"; nextRole: null; fingerprint: string; draftId: number; reviewActionId: number }
  | { state: "human_escalation"; nextRole: null; issues: string[] }
  | { state: "idle"; nextRole: null }
);

function parseObject(text: string | null): Record<string, unknown> | undefined {
  try {
    const parsed: unknown = JSON.parse(text || "null");
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown> : undefined;
  } catch { return undefined; }
}

/** Only actual approved final text plus a completed matching Editor receipt is owner-ready. */
export function assessOwnerReadyContent(
  row: AutonomousContentRow,
  artifacts: readonly AutonomousDraftArtifact[] = [],
  editorialReviews: readonly AutonomousEditorialReceipt[] = [],
): { ready: boolean; issues: string[]; fingerprint: string; draftId?: number; reviewActionId?: number } {
  const fingerprint = draftFingerprint(row.draft);
  const wordCount = actualDraftWordCount(row.draft);
  const issues: string[] = [];
  if (row.stage !== "approved" || row.reviewedBy !== "editor") issues.push("Actual pipeline stage must be approved and reviewedBy must be editor.");
  if (!row.draft || !row.finalContent || row.finalContent !== row.draft
    || draftFingerprint(row.finalContent) !== fingerprint) issues.push("Approved finalContent must exactly match the reviewed full draft fingerprint.");
  if (!row.targetKeyword?.trim() || row.wordCount !== wordCount) issues.push("Actual saved keyword or measured word count is missing or stale.");
  const safety = assessEditorialSafety(row.finalContent);
  issues.push(...safety.issues, ...safety.hardFails);
  if (/revision_needed|revision (?:needed|required)|requires? (?:revision|rewrite)|cannot (?:approve|publish)/i.test(row.editorFeedback || "")) {
    issues.push("Saved approval feedback still requires revision.");
  }
  // A newer decision for this exact pipeline supersedes historical approvals, even if malformed.
  const latest = editorialReviews.filter(action => action.agentSlug === "editor"
    && action.actionType === "editorial_review" && action.status === "completed"
    && parseObject(action.payload)?.pipelineId === row.id)
    .slice().sort((a, b) => b.id - a.id)[0];
  const receipt = latest && parseObject(latest.payload);
  const review = latest && parseObject(latest.result);
  const artifact = artifacts.find(item => item.id === receipt?.draftId);
  if (!receipt || !review || !Number.isSafeInteger(receipt.runId) || Number(receipt.runId) <= 0
    || receipt.fullDraftReviewed !== true || receipt.fingerprint !== fingerprint || receipt.wordCount !== wordCount) {
    issues.push("No completed full-draft Editor receipt matches this pipeline, actual words and fingerprint.");
  }
  if (!artifact || artifact.postSlug !== row.slug || artifact.targetKeyword !== row.targetKeyword
    || artifact.content !== row.finalContent) issues.push("Saved BlogStudio artifact does not match the approved finalContent and target identity.");
  const metrics = ["seoScore", "readabilityScore", "eatScore", "duplicateRisk"] as const;
  if (!review || review.decision !== "approve" || review.stage !== "approved"
    || !Array.isArray(review.issues) || review.issues.length !== 0
    || !Array.isArray(review.hardFails) || review.hardFails.length !== 0
    || metrics.some(key => review[key] !== row[key])
    || editorialDecision({ pipelineId: row.id, decision: String(review?.decision),
      seoScore: review?.seoScore as number, readabilityScore: review?.readabilityScore as number,
      eatScore: review?.eatScore as number, duplicateRisk: review?.duplicateRisk as number,
      hardFails: review?.hardFails as string[], feedback: review?.feedback as string,
      approvalReason: review?.approvalReason as string }, safety) !== "approve") {
    issues.push("Persisted review decision, quality metrics or full-draft safety evidence do not support approval.");
  }
  return { ready: issues.length === 0, issues, fingerprint, draftId: artifact?.id, reviewActionId: latest?.id };
}

const stagePriority: Record<ContentPipeline["stage"], number> = {
  in_review: 0, draft_complete: 0, revision_needed: 1, rejected: 1, approved: 2,
  drafting: 3, outlined: 4, researching: 5, idea: 6, published: 7,
};

/**
 * One decision per fresh durable snapshot. Persist canonicalItemId, claim that row,
 * recheck expectedStage/fingerprint, then dispatch ONLY nextRole with itemId.
 * Re-read after completion; do not chain multiple model calls in one callback.
 * Terminal plans require no agent call. Persist/display human_escalation once;
 * owner_ready means a saved editorial artifact, not outreach or a publish action.
 */
export function planAutonomousContentProgression(snapshot: AutonomousContentSnapshot): AutonomousContentPlan {
  const pinned = snapshot.canonicalItemId != null;
  const candidates = snapshot.rows.filter(row => row.contentType !== "city_page" && row.stage !== "published");
  const row = pinned ? snapshot.rows.find(item => item.id === snapshot.canonicalItemId)
    : candidates.slice().sort((a, b) => stagePriority[a.stage] - stagePriority[b.stage]
      || a.createdAt.getTime() - b.createdAt.getTime() || a.id - b.id)[0];
  const base: PlanBase = { itemId: row?.id ?? snapshot.canonicalItemId ?? null,
    canonicalTarget: row ? normalizedContentTarget(row.targetKeyword || row.slug || row.title) : null,
    reason: "", publish: false };
  const escalate = (issues: string[]): AutonomousContentPlan => ({ ...base, state: "human_escalation", nextRole: null,
    reason: issues.join(" "), issues });
  if (!row) return pinned ? escalate(["Pinned canonical content item is missing; do not substitute another topic."])
    : { ...base, state: "idle", nextRole: null, reason: "No existing eligible pipeline target. No new ideas were requested." };
  if (row.contentType === "city_page") return escalate(["City-page content is excluded from autonomous progression."]);
  if (row.stage === "published") return { ...base, state: "idle", nextRole: null,
    reason: "Canonical item is already published; no publication or replacement work requested." };
  if (!Number.isSafeInteger(row.id) || row.id <= 0 || !row.slug?.trim() || !row.targetKeyword?.trim()) {
    return escalate(["Canonical content identity is incomplete; a saved positive ID, slug and target keyword are required."]);
  }
  if (row.stage === "approved") {
    const evidence = assessOwnerReadyContent(row, snapshot.artifacts, snapshot.editorialReviews);
    return evidence.ready ? { ...base, state: "owner_ready", nextRole: null,
      reason: "Fingerprint-matched finalContent passed the saved full-draft Editor gate. Nothing is published.",
      fingerprint: evidence.fingerprint, draftId: evidence.draftId!, reviewActionId: evidence.reviewActionId! }
      : escalate(evidence.issues);
  }
  const maxRevisions = snapshot.maxRevisions === 3 ? 3 : 2;
  if (!Number.isSafeInteger(row.revisionCount) || row.revisionCount < 0) return escalate(["Durable revision count is invalid; automatic retries are blocked."]);
  const needsContent = !["draft_complete", "in_review"].includes(row.stage);
  if (needsContent && row.revisionCount >= maxRevisions) return escalate([
    `Pipeline #${row.id} reached the ${maxRevisions}-revision limit. Human review is required; do not generate a substitute topic.`,
  ]);
  // The last allowed replacement still gets its Editor gate; only another repair is blocked.
  return { ...base, state: "dispatch", nextRole: needsContent ? "content" : "editor",
    expectedStage: row.stage, expectedFingerprint: draftFingerprint(row.draft),
    reason: needsContent ? `Complete or repair this exact saved target; ${maxRevisions - row.revisionCount} revision attempts remain.`
      : "Review this exact full draft before starting any other content target." };
}

/** Read-only integration adapter. Dispatcher owns durable canonical ID, leases and escalation display. */
export async function readAutonomousContentPlan(options: Pick<AutonomousContentSnapshot, "canonicalItemId" | "maxRevisions"> & { excludeItemIds?: readonly number[] } = {}) {
  const excluded = Array.from(new Set(options.excludeItemIds || []));
  if (excluded.length > 100 || excluded.some(id => !Number.isSafeInteger(id) || id <= 0)) {
    throw new Error("Resolved content exclusion list exceeds 100 IDs or contains an invalid ID; human triage required.");
  }
  const db = await getDb();
  if (!db) throw new Error("Database unavailable; autonomous content planning is blocked.");
  const rows = await db.select().from(contentPipeline).where(options.canonicalItemId != null
    ? eq(contentPipeline.id, options.canonicalItemId)
    : and(ne(contentPipeline.stage, "published"), ne(contentPipeline.contentType, "city_page"),
      excluded.length ? notInArray(contentPipeline.id, excluded) : undefined))
    .orderBy(asc(contentPipeline.createdAt), asc(contentPipeline.id)).limit(501);
  if (rows.length > 500) throw new Error("Open content queue exceeds bounded planning scan; human triage required, no ideas generated.");
  const initial = planAutonomousContentProgression({ rows, ...options });
  const selected = rows.find(row => row.id === initial.itemId);
  let plan = initial;
  if (selected?.stage === "approved") {
    const [artifacts, editorialReviews] = await Promise.all([
      db.select().from(blogDrafts).where(eq(blogDrafts.postSlug, selected.slug || "")).orderBy(desc(blogDrafts.updatedAt)).limit(20),
      db.select().from(agentActions).where(and(eq(agentActions.agentSlug, "editor"),
        eq(agentActions.actionType, "editorial_review"), eq(agentActions.status, "completed"),
        sql`JSON_VALID(${agentActions.payload}) AND JSON_EXTRACT(${agentActions.payload}, '$.pipelineId') = ${selected.id}`))
        .orderBy(desc(agentActions.id)).limit(20),
    ]);
    plan = planAutonomousContentProgression({ rows, artifacts, editorialReviews, ...options, canonicalItemId: selected.id });
  }
  return { ...plan, agentSlug: plan.nextRole, pipelineId: plan.itemId ?? undefined,
    blocked: plan.state === "human_escalation" };
}
