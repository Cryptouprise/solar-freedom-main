import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getDb: vi.fn(), callAgentLLM: vi.fn(), getAgentModel: vi.fn(), startRun: vi.fn(),
  completeRun: vi.fn(), row: null as any, config: null as any, artifact: null as any, actions: [] as any[],
  mutations: [] as any[], transactionCalls: 0, invocation: undefined as any }));
vi.mock("./db", () => ({ getDb: mocks.getDb }));
vi.mock("./agents/agentLLM", () => ({ callAgentLLM: mocks.callAgentLLM, getAgentModel: mocks.getAgentModel,
  withTimeout: async (promise: Promise<unknown>) => promise }));
vi.mock("./agents/engine", () => ({ startRun: mocks.startRun, completeRun: mocks.completeRun }));
vi.mock("./autonomousBudget", () => ({ getAutonomousInvocation: () => mocks.invocation,
  remainingAutonomousBudgetMs: () => undefined }));
import { agentActions, blogDrafts, contentPipeline, siteConfig } from "../drizzle/schema";
import { CONTENT_DRAFT_SECTIONS, CONTENT_DRAFT_STATE_PREFIX, runContentDraftStep, validateContentDraftSection } from "./autonomousContentDraft";
import { actualDraftWordCount, draftFingerprint } from "./agents/contentAgent";

function source(overrides: any = {}) { return { id: 7, title: "Cancel Sunrun Contract", slug: "cancel-sunrun-contract",
  targetKeyword: "cancel sunrun contract", contentType: "blog_article", stage: "revision_needed", draft: "Original supplied draft.",
  contentBrief: '{"source":"https://example.org/supplied-evidence","note":"This source is supplied context, not verified by the model."}',
  editorFeedback: "Add complete practical guidance, FAQ and a qualified CTA without inventing legal evidence.",
  revisionCount: 0, wordCount: 4, ...overrides }; }
function section(index: number, tail = "") {
  const special = index === 4 ? "## Frequently Asked Questions\n### What records help?\n### Who should review my documents?\n### What happens next?\n"
    : index === 5 ? "## From Trapped to Free\nRequest a no-obligation case review. Call (904) 921-4971. [Letter tool](/free-cancellation-letter). This is not legal advice.\n"
    : `${index === 0 ? "# Cancel Sunrun Contract" : `## Helpful section ${index}`}\n`;
  return `${special}${`Useful practical guidance for homeowners in section ${index}. `.repeat(40)}${tail}`.trim();
}
const response = (index: number, text = section(index)) => JSON.stringify({ sectionIndex: index, complete: true, section: text });
const db: any = {
  select: () => {
    let table: any;
    const query: any = { from: (value: any) => { table = value; return query; }, where: () => query, orderBy: () => query,
      limit: () => query, for: () => query,
      then: (resolve: any, reject: any) => Promise.resolve(table === contentPipeline ? (mocks.row ? [{ ...mocks.row }] : [])
        : table === siteConfig ? (mocks.config ? [{ ...mocks.config }] : [])
        : table === blogDrafts ? (mocks.artifact ? [{ ...mocks.artifact }] : []) : []).then(resolve, reject) };
    return query;
  },
  update: (table: any) => ({ set: (values: any) => ({ where: async () => {
    mocks.mutations.push({ table, values });
    if (table === contentPipeline) mocks.row = { ...mocks.row, ...values };
    if (table === siteConfig) mocks.config = { ...mocks.config, ...values };
    if (table === blogDrafts) mocks.artifact = { ...mocks.artifact, ...values };
    return [{ affectedRows: 1 }];
  } }) }),
  insert: (table: any) => ({ values: (values: any) => {
    const apply = () => {
      mocks.mutations.push({ table, values });
      if (table === siteConfig) mocks.config = { id: 4, ...values };
      if (table === blogDrafts) mocks.artifact = { id: 70, ...values };
      if (table === agentActions) mocks.actions.push(values);
    };
    const query: any = { then: (resolve: any) => { apply(); return Promise.resolve([{ insertId: 4 }]).then(resolve); },
      $returningId: async () => { apply(); return [{ id: 70 }]; } };
    return query;
  } }),
  transaction: async (work: (tx: any) => Promise<void>) => { mocks.transactionCalls++; return work(db); },
};
beforeEach(() => {
  vi.clearAllMocks(); mocks.row = source(); mocks.config = null; mocks.artifact = null;
  mocks.actions = []; mocks.mutations = []; mocks.transactionCalls = 0; mocks.invocation = undefined;
  mocks.getDb.mockResolvedValue(db); mocks.getAgentModel.mockResolvedValue("existing-content-model");
  mocks.startRun.mockResolvedValue({ runId: 99, actionsCreated: 0, messagesCreated: 0,
    llmCalls: 0, tokensIn: 0, tokensOut: 0, costUsd: 0 });
  mocks.completeRun.mockResolvedValue({});
  mocks.callAgentLLM.mockImplementation(async (options: any) => {
    const index = JSON.parse(options.messages[1].content).sectionIndex;
    return { content: response(index), modelId: "existing-content-model", costSource: "unverified" };
  });
});

describe("one complete validated Content section", () => {
  it("accepts a complete correctly indexed bounded section", () => {
    expect(validateContentDraftSection(response(0), 0, [], [])).toBe(section(0));
    expect(actualDraftWordCount(section(0))).toBeGreaterThanOrEqual(270);
  });
  it.each([
    ["invalid JSON", "{\"section\":"], ["truncated flag", JSON.stringify({ sectionIndex: 0, complete: false, section: section(0) })],
    ["wrong index", response(2)], ["short section", response(0, "# Heading\nOnly a few words.")],
    ["truncated sentence", response(0, section(0).trim().replace(/\.$/, ""))],
    ["invented source", response(0, section(0, "See https://invented.example/claim."))],
    ["obsolete phone", response(0, section(0, "Call 214-529-1631."))],
    ["invented city", response(0, section(0, "[City](/cancel-solar-contract/orlando-fl)."))],
    ["placeholder", response(0, section(0, "TODO verify this."))],
  ])("does not append %s", (_label, text) => {
    expect(() => validateContentDraftSection(text, 0, [], [])).toThrow();
  });
  it("rejects a duplicate section and requires actual FAQ questions/closing conversion evidence", () => {
    expect(() => validateContentDraftSection(response(0), 0, [section(0)], [])).toThrow("Repeated");
    expect(() => validateContentDraftSection(response(4, section(1)), 4, [], [])).toThrow("FAQ");
    expect(() => validateContentDraftSection(response(5, section(1)), 5, [], [])).toThrow("Closing");
    expect(() => validateContentDraftSection(response(1, section(0)), 1, [], [])).toThrow("global H1");
    expect(() => validateContentDraftSection(response(0, section(0, "\n# Another H1\nFinal sentence.")), 0, [], [])).toThrow("global H1");
  });
});

describe("durable autonomous Content step (no live calls)", () => {
  it("uses the saved natural title as H1 when its keyword terms have harmless intervening words", async () => {
    mocks.row = source({ title: "How to Cancel Your Sunrun Contract Safely", targetKeyword: "cancel sunrun contract" });
    mocks.getAgentModel.mockResolvedValue("qwen/qwen3.7-flash");
    await runContentDraftStep(7, 11);
    expect(JSON.parse(mocks.config.value).sections[0]).toMatch(/^# How to Cancel Your Sunrun Contract Safely/);
    expect(mocks.callAgentLLM.mock.calls[0][0].openRouterReasoning).toEqual({ enabled: false });
  });
  it("makes one configured-model request, persists one section and never inserts new pipeline ideas", async () => {
    const original = mocks.row.draft;
    const step = await runContentDraftStep(7, 11);
    expect(step).toMatchObject({ done: false, stage: "drafting", sectionsCompleted: 1, pipelineId: 7, jobId: 11 });
    expect(mocks.callAgentLLM).toHaveBeenCalledTimes(1);
    expect(mocks.callAgentLLM.mock.calls[0][0]).toMatchObject({ modelOverride: "existing-content-model", agentSlug: "content",
      executionMode: "scheduled", allowFallback: false, maxTokens: 1000 });
    expect(mocks.callAgentLLM.mock.calls[0][0].totalTimeoutMs).toBeLessThanOrEqual(16_000);
    expect(mocks.config.key).toBe(`${CONTENT_DRAFT_STATE_PREFIX}7`);
    expect(JSON.parse(mocks.config.value).sections).toEqual([section(0)]);
    expect(mocks.row.draft).toBe(original); expect(mocks.row.revisionCount).toBe(0);
    expect(mocks.artifact).toBeNull(); expect(mocks.actions).toHaveLength(0);
    expect(mocks.mutations.filter(change => change.table === contentPipeline)).toHaveLength(1);
  });
  it("resumes six finite HTTP steps, then atomically saves full BlogStudio draft plus exact content artifact receipt", async () => {
    const progress = [];
    for (let index = 0; index < CONTENT_DRAFT_SECTIONS.length; index++) progress.push(await runContentDraftStep(7, 11));
    expect(progress.map(step => step.sectionsCompleted)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(progress.at(-1)).toMatchObject({ done: true, stage: "draft_complete", sectionsCompleted: 6, issues: [] });
    expect(mocks.callAgentLLM).toHaveBeenCalledTimes(6);
    const secondPrompt = JSON.parse(mocks.callAgentLLM.mock.calls[1][0].messages[1].content);
    expect(secondPrompt.previousSections).toEqual([section(0)]);
    expect(secondPrompt.originalDraft).toBe("Original supplied draft.");
    expect(mocks.row.revisionCount).toBe(1); expect(mocks.row.wordCount).toBeGreaterThanOrEqual(1600);
    expect(mocks.row.wordCount).toBe(actualDraftWordCount(mocks.row.draft));
    expect(mocks.row.draft).toBe(mocks.artifact.content); expect(mocks.row.finalContent).toBeNull();
    expect(mocks.artifact.targetKeyword).toBe(mocks.row.targetKeyword);
    expect(mocks.actions).toHaveLength(1); expect(mocks.actions[0]).toMatchObject({ actionType: "content_artifact", status: "completed", requiresApproval: 0 });
    expect(JSON.parse(mocks.actions[0].payload)).toMatchObject({ runId: 99, pipelineId: 7, draftId: 70, jobId: 11,
      fingerprint: draftFingerprint(mocks.row.draft), wordCount: actualDraftWordCount(mocks.row.draft), preflightPassed: true });
    expect(mocks.row).not.toHaveProperty("publishedAt");
    const replay = await runContentDraftStep(7, 11);
    expect(replay.done).toBe(true); expect(mocks.callAgentLLM).toHaveBeenCalledTimes(6); expect(mocks.row.revisionCount).toBe(1);
  });
  it("does not consume a revision round when drafting an existing idea for the first time", async () => {
    mocks.row = source({ stage: "idea", draft: null });
    for (let index = 0; index < 6; index++) await runContentDraftStep(7, 11);
    expect(mocks.row.revisionCount).toBe(0); expect(mocks.row.stage).toBe("draft_complete");
  });
  it("leaves all durable text untouched after timeout or invalid section and retries only on a later request", async () => {
    mocks.callAgentLLM.mockRejectedValueOnce(new Error("timed out after 16s"));
    await expect(runContentDraftStep(7, 11)).rejects.toThrow("timed out");
    expect(mocks.mutations).toHaveLength(0); expect(mocks.callAgentLLM).toHaveBeenCalledTimes(1);
    mocks.callAgentLLM.mockResolvedValueOnce({ content: "{broken", modelId: "existing-content-model" });
    await expect(runContentDraftStep(7, 11)).rejects.toThrow("valid JSON"); expect(mocks.mutations).toHaveLength(0);
    expect((await runContentDraftStep(7, 11)).sectionsCompleted).toBe(1);
  });
  it("discards a model response if the exact draft changed during the call", async () => {
    mocks.callAgentLLM.mockImplementationOnce(async () => {
      mocks.row.draft = "A human changed this draft while the model worked.";
      return { content: response(0), modelId: "existing-content-model" };
    });
    await expect(runContentDraftStep(7, 11)).rejects.toThrow("stale response discarded");
    expect(mocks.mutations).toHaveLength(0); expect(mocks.config).toBeNull();
  });
  it("binds saved partial sections to one exact job ID", async () => {
    await runContentDraftStep(7, 11);
    const savedState = mocks.config.value;
    expect(await runContentDraftStep(7, 12)).toMatchObject({ done: true, blocked: true, stage: "human_escalation" });
    expect(mocks.config.value).toBe(savedState); expect(mocks.callAgentLLM).toHaveBeenCalledTimes(1);
    expect((await runContentDraftStep(7, 11)).sectionsCompleted).toBe(2);
  });
  it("visibly escalates changed partial source state, missing identity, city pages and max revisions", async () => {
    await runContentDraftStep(7, 11); mocks.row.editorFeedback = "New human instruction.";
    expect(await runContentDraftStep(7, 11)).toMatchObject({ done: true, blocked: true, stage: "human_escalation" });
    expect(mocks.callAgentLLM).toHaveBeenCalledTimes(1);
    for (const overrides of [{ revisionCount: 3 }, { contentType: "city_page" }, { slug: null }]) {
      mocks.row = source(overrides);
      expect(await runContentDraftStep(7, 12)).toMatchObject({ blocked: true, stage: "human_escalation" });
    }
  });
  it("uses and checks the parent's claimed invocation rather than accepting unrelated IDs", async () => {
    mocks.invocation = { jobId: 11, pipelineId: 99, deadlineAt: Date.now() + 24_000 };
    await expect(runContentDraftStep(7, 11)).rejects.toThrow("does not match");
    expect(mocks.callAgentLLM).not.toHaveBeenCalled();
  });
});
