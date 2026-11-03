import { beforeEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
const mocks = vi.hoisted(() => ({ getDb: vi.fn(), agentLLM: vi.fn(), startRun: vi.fn(), completeRun: vi.fn(),
  createAction: vi.fn(), sendMessage: vi.fn(), getUnreadMessages: vi.fn(), markMessageActedOn: vi.fn(),
  selects: [] as any[][], queries: [] as any[], writes: [] as any[], affectedRows: 1 }));
vi.mock("./db", () => ({ getDb: mocks.getDb }));
vi.mock("./agents/engine", () => ({ agentLLM: mocks.agentLLM, startRun: mocks.startRun, completeRun: mocks.completeRun,
  createAction: mocks.createAction, sendMessage: mocks.sendMessage, getUnreadMessages: mocks.getUnreadMessages,
  markMessageActedOn: mocks.markMessageActedOn }));
import { assessOwnerReadyContent, planAutonomousContentProgression, readAutonomousContentPlan,
  type AutonomousContentRow } from "./autonomousContentLoop";
import { actualDraftWordCount, draftFingerprint } from "./agents/contentAgent";
import { runEditorAgent } from "./agents/editorAgent";

const draft = `${Array.from({ length: 5 }, (_, heading) =>
  `### Practical guidance ${heading + 1}\n${Array.from({ length: 6 }, () =>
    "Homeowners should keep records and ask qualified professionals about their options. ".repeat(5).trim(),
  ).join("\n\n")}`,
).join("\n\n")}
## Frequently Asked Questions
### How can I ask for help?
[Useful guide](/free-cancellation-letter). Request a no-obligation case review. This is not legal advice.`;
function row(overrides: Partial<AutonomousContentRow> = {}): AutonomousContentRow {
  return { id: 7, title: "Cancel Sunrun Contract", slug: "cancel-sunrun-contract", targetKeyword: "cancel sunrun contract",
    contentType: "blog_article", stage: "draft_complete", draft, finalContent: null, wordCount: actualDraftWordCount(draft),
    revisionCount: 0, reviewedBy: null, editorFeedback: null, seoScore: null, readabilityScore: null,
    eatScore: null, duplicateRisk: null, createdAt: new Date("2026-01-01"), ...overrides };
}
function evidence(overrides: Partial<AutonomousContentRow> = {}) {
  const p = row({ stage: "approved", reviewedBy: "editor", finalContent: draft,
    seoScore: 90, readabilityScore: 85, eatScore: 80, duplicateRisk: 10, ...overrides });
  const artifact = { id: 70, postSlug: p.slug!, content: draft, targetKeyword: p.targetKeyword };
  const review = { decision: "approve", stage: "approved", seoScore: 90, readabilityScore: 85, eatScore: 80, duplicateRisk: 10,
    feedback: "Reviewed supplied evidence, safe conversion CTA, internal links and full jurisdiction qualifications.", issues: [], hardFails: [] };
  const receipt = { runId: 99, pipelineId: 7, draftId: 70, fingerprint: draftFingerprint(draft),
    wordCount: actualDraftWordCount(draft), fullDraftReviewed: true };
  const action = { id: 100, agentSlug: "editor", actionType: "editorial_review", status: "completed",
    payload: JSON.stringify(receipt), result: JSON.stringify(review) };
  return { p, artifact, review, receipt, action };
}
const dialect = new MySqlDialect();
const db = {
  select: vi.fn(() => {
    const answer = mocks.selects.shift();
    if (!answer) throw new Error("Unexpected select; missing deterministic fixture.");
    const query: any = { from: () => query, where: (condition: any) => {
      mocks.queries.push(dialect.sqlToQuery(condition)); return query;
    }, orderBy: () => query, limit: async () => answer };
    return query;
  }),
  update: vi.fn(() => ({ set: (values: any) => ({ where: async (condition: any) => {
    mocks.writes.push({ values, query: dialect.sqlToQuery(condition) }); return [{ affectedRows: mocks.affectedRows }];
  } }) })),
};
beforeEach(() => {
  vi.clearAllMocks(); mocks.selects = []; mocks.queries = []; mocks.writes = []; mocks.affectedRows = 1;
  mocks.getDb.mockResolvedValue(db);
  mocks.startRun.mockResolvedValue({ runId: 99, actionsCreated: 0, messagesCreated: 0 });
  mocks.getUnreadMessages.mockResolvedValue([]);
  mocks.completeRun.mockImplementation(async (_ctx, summary) => ({ summary }));
  mocks.agentLLM.mockResolvedValue(JSON.stringify({ reviews: [{ pipelineId: 7, ...evidence().review }] }));
});

describe("single-target content progression", () => {
  it.each(["draft_complete", "in_review"] as const)("dispatches actual %s rows directly to Editor before 427 ideas or repairs", stage => {
    const ideas = Array.from({ length: 427 }, (_, index) => row({ id: index + 100, stage: "idea" }));
    const result = planAutonomousContentProgression({ rows: [...ideas, row({ id: 8, stage: "revision_needed" }), row({ stage })] });
    expect(result).toMatchObject({ state: "dispatch", nextRole: "editor", itemId: 7,
      expectedStage: stage, expectedFingerprint: draftFingerprint(draft), publish: false });
  });
  it("routes the exact canonical repair to Content even when another draft is ready", () => {
    expect(planAutonomousContentProgression({ canonicalItemId: 8, rows: [row(), row({ id: 8, stage: "revision_needed" })] }))
      .toMatchObject({ state: "dispatch", nextRole: "content", itemId: 8 });
  });
  it("never retargets a missing pinned ID or starts a new idea when no rows exist", () => {
    expect(planAutonomousContentProgression({ canonicalItemId: 999, rows: [row()] })).toMatchObject({ state: "human_escalation", itemId: 999, nextRole: null });
    expect(planAutonomousContentProgression({ rows: [] })).toMatchObject({ state: "idle", itemId: null, nextRole: null, publish: false });
  });
  it("selects one existing outlined/idea target deterministically and never requests ideation", () => {
    const result = planAutonomousContentProgression({ rows: [row({ id: 9, stage: "idea" }), row({ id: 8, stage: "outlined" })] });
    expect(result).toMatchObject({ state: "dispatch", itemId: 8, nextRole: "content" });
    expect(result.reason).toContain("exact saved target");
  });
  it.each(["revision_needed", "rejected", "drafting"] as const)("visibly escalates %s after two repairs by default", stage => {
    expect(planAutonomousContentProgression({ rows: [row({ stage, revisionCount: 2 })] })).toMatchObject({
      state: "human_escalation", itemId: 7, nextRole: null, publish: false });
  });
  it("permits an explicit third repair but never a fourth, and still reviews the last replacement", () => {
    expect(planAutonomousContentProgression({ maxRevisions: 3, rows: [row({ stage: "revision_needed", revisionCount: 2 })] }).nextRole).toBe("content");
    expect(planAutonomousContentProgression({ maxRevisions: 3, rows: [row({ stage: "revision_needed", revisionCount: 3 })] }).state).toBe("human_escalation");
    expect(planAutonomousContentProgression({ rows: [row({ revisionCount: 3 })] }).nextRole).toBe("editor");
  });
  it("does not touch city pages or publish a canonical published item", () => {
    expect(planAutonomousContentProgression({ rows: [row({ contentType: "city_page" })] }).state).toBe("idle");
    expect(planAutonomousContentProgression({ canonicalItemId: 7, rows: [row({ contentType: "city_page" })] }).state).toBe("human_escalation");
    expect(planAutonomousContentProgression({ canonicalItemId: 7, rows: [row({ stage: "published" })] })).toMatchObject({ state: "idle", nextRole: null, publish: false });
  });
  it("read-only adapter returns dispatcher aliases and passes exact-ID filtering", async () => {
    mocks.selects.push([row({ stage: "in_review" })]);
    expect(await readAutonomousContentPlan({ canonicalItemId: 7 })).toMatchObject({ agentSlug: "editor", pipelineId: 7, blocked: false });
    expect(mocks.queries[0].params).toContain(7); expect(mocks.writes).toHaveLength(0);
  });
  it("excludes resolved targets in SQL before the bounded scan but never excludes an explicit pin", async () => {
    mocks.selects.push([row({ id: 8 })]);
    expect(await readAutonomousContentPlan({ excludeItemIds: [7, 9] })).toMatchObject({ pipelineId: 8, agentSlug: "editor" });
    expect(mocks.queries[0].sql).toContain("not in"); expect(mocks.queries[0].params).toEqual(expect.arrayContaining([7, 9]));
    mocks.selects.push([row()]);
    expect(await readAutonomousContentPlan({ canonicalItemId: 7, excludeItemIds: [7] })).toMatchObject({ pipelineId: 7 });
    expect(mocks.queries[1].sql).not.toContain("not in");
  });
  it("fails explicitly instead of scanning an unbounded resolved-target exclusion list", async () => {
    await expect(readAutonomousContentPlan({ excludeItemIds: Array.from({ length: 101 }, (_, index) => index + 1) }))
      .rejects.toThrow("100 IDs");
    expect(db.select).not.toHaveBeenCalled();
  });
});

describe("fingerprint-matched finalContent owner readiness", () => {
  it("returns explicit owner_ready only for actual final text, artifact and completed Editor evidence", () => {
    const e = evidence();
    const plan = planAutonomousContentProgression({ rows: [e.p], artifacts: [e.artifact], editorialReviews: [e.action] });
    expect(plan).toMatchObject({ state: "owner_ready", nextRole: null, itemId: 7, draftId: 70,
      reviewActionId: 100, fingerprint: draftFingerprint(draft), publish: false });
  });
  it.each([
    ["missing finalContent", { finalContent: null }], ["stale finalContent", { finalContent: `${draft} Changed.` }],
    ["inflated stored words", { wordCount: 9999 }], ["non-editor label", { reviewedBy: "manager" }],
    ["contradictory feedback", { editorFeedback: "revision_needed: verify this source" }],
    ["weak actual score", { eatScore: 20 }], ["actual revision stage", { stage: "revision_needed" }],
  ])("blocks %s instead of treating an approval label as evidence", (_label, overrides) => {
    const e = evidence(overrides as Partial<AutonomousContentRow>);
    expect(assessOwnerReadyContent(e.p, [e.artifact], [e.action]).ready).toBe(false);
  });
  it.each([
    ["wrong fingerprint", { fingerprint: "not-the-reviewed-text" }], ["wrong pipeline", { pipelineId: 999 }],
    ["wrong artifact", { draftId: 999 }], ["missing full review", { fullDraftReviewed: false }],
    ["wrong measured words", { wordCount: 2500 }], ["missing real run", { runId: 0 }],
  ])("rejects receipt evidence with %s", (_label, overrides) => {
    const e = evidence(); e.action.payload = JSON.stringify({ ...e.receipt, ...overrides });
    expect(assessOwnerReadyContent(e.p, [e.artifact], [e.action]).ready).toBe(false);
  });
  it("rejects artifact edits and does not resurrect an older approval over a newer review", () => {
    const e = evidence();
    expect(assessOwnerReadyContent(e.p, [{ ...e.artifact, content: `${draft} Edited.` }], [e.action]).ready).toBe(false);
    const newer = { ...e.action, id: 101, result: JSON.stringify({ ...e.review, decision: "revision_needed", stage: "revision_needed" }) };
    expect(assessOwnerReadyContent(e.p, [e.artifact], [e.action, newer]).ready).toBe(false);
  });
});

describe("Editor exact dispatch and stale approval guards", () => {
  it("reviews in_review for only the requested ID and persists matching finalContent", async () => {
    const e = evidence({ stage: "in_review", reviewedBy: null, finalContent: null });
    mocks.selects.push([e.p], [e.artifact], [e.p]);
    await runEditorAgent("cron", "autonomous-work:11", { itemId: 7 });
    expect(mocks.queries[0].params).toContain(7);
    expect(mocks.queries[0].params).toContain("in_review");
    expect(mocks.writes[0].values).toMatchObject({ stage: "approved", finalContent: draft, approvedBy: null });
    expect(mocks.writes[0].query.sql).toContain("EXISTS");
    expect(JSON.parse(mocks.createAction.mock.calls[0][0].payload).fingerprint).toBe(draftFingerprint(draft));
    expect(mocks.writes[0].values).not.toHaveProperty("publishedAt");
  });
  it.each([{ slug: "changed-target" }, { targetKeyword: "different keyword" }, { title: "Changed title" }])("discards review after identity changed %#", async change => {
    const p = row(); mocks.selects.push([p], [{ ...evidence().artifact }], [{ ...p, ...change }]);
    await runEditorAgent("cron", "dispatcher", { itemId: 7 });
    expect(mocks.writes).toHaveLength(0); expect(mocks.createAction).not.toHaveBeenCalled();
  });
  it("creates no review receipt, approval message or false success after a lost compare-and-set race", async () => {
    const p = row(); mocks.selects.push([p], [evidence().artifact], [p]); mocks.affectedRows = 0;
    await runEditorAgent("cron", "dispatcher", { itemId: 7 });
    expect(mocks.createAction).not.toHaveBeenCalled(); expect(mocks.sendMessage).not.toHaveBeenCalled();
  });
  it("clears old finalContent when full-draft review requires repair", async () => {
    const p = row({ finalContent: "old approved text" }); mocks.selects.push([p], [evidence().artifact], [p]);
    mocks.agentLLM.mockResolvedValue(JSON.stringify({ reviews: [{ pipelineId: 7, ...evidence().review, decision: "revision_needed" }] }));
    await runEditorAgent("cron", "dispatcher", { itemId: 7 });
    expect(mocks.writes[0].values).toMatchObject({ stage: "revision_needed", finalContent: null });
  });
});
