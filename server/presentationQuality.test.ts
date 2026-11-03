import { beforeEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), agentLLM: vi.fn(), callAgentLLM: vi.fn(), getAgentModel: vi.fn(),
  startRun: vi.fn(), completeRun: vi.fn(), sendMessage: vi.fn(), createAction: vi.fn(),
  getUnreadMessages: vi.fn(), markMessageActedOn: vi.fn(), invocation: undefined as any,
  selects: [] as any[][], writes: [] as any[], actions: [] as any[], row: null as any, config: null as any,
  artifact: null as any, affectedRows: 1 }));
vi.mock("./db", () => ({ getDb: mocks.getDb }));
vi.mock("./agents/engine", () => ({ agentLLM: mocks.agentLLM, startRun: mocks.startRun, completeRun: mocks.completeRun,
  sendMessage: mocks.sendMessage, createAction: mocks.createAction, getUnreadMessages: mocks.getUnreadMessages,
  markMessageActedOn: mocks.markMessageActedOn }));
vi.mock("./agents/agentLLM", () => ({ callAgentLLM: mocks.callAgentLLM, getAgentModel: mocks.getAgentModel,
  withTimeout: async (promise: Promise<unknown>) => promise }));
vi.mock("./autonomousBudget", () => ({ getAutonomousInvocation: () => mocks.invocation, remainingAutonomousBudgetMs: () => undefined }));

import { auditDraftPresentation, presentationAuditForModel, presentationAuditFeedback, DRAFT_PRESENTATION_EVIDENCE,
  PRESENTATION_LIMITS } from "../shared/presentationQuality";
import { assessEditorialSafety, editorialDecision, runEditorAgent } from "./agents/editorAgent";
import { runContentDraftStep, validateContentDraftSection } from "./autonomousContentDraft";
import { actualDraftWordCount, draftFingerprint } from "./agents/contentAgent";
import { agentActions, blogDrafts, contentPipeline, siteConfig } from "../drizzle/schema";
import { readFileSync } from "node:fs";

const prose = (words: number) => `${"records ".repeat(words - 1)}help.`;
const safeParagraph = "Homeowners should keep records and ask qualified professionals about their options. ".repeat(5).trim();
const goodDraft = `# Cancel Sunrun Contract\n\n${Array.from({ length: 6 }, (_, i) =>
  `## Records and options ${i + 1}\n\n${Array(5).fill(safeParagraph).join("\n\n")}`).join("\n\n")}\n\n## Practical steps\n\n1. Gather your documents.\n2. Ask focused questions.\n\n## Frequently Asked Questions\n\n### Who can review my records?\n\nRequest a no-obligation case review. Call [(904) 921-4971](tel:9049214971). [Letter tool](/free-cancellation-letter). This is not legal advice.`;
const approvedReview = { pipelineId: 7, decision: "approve", seoScore: 90, readabilityScore: 85, eatScore: 80,
  duplicateRisk: 10, hardFails: [], feedback: "Paragraphs are short, headings readable, and the qualified case-review CTA gives a clear next action." };
const row = (overrides: any = {}) => ({ id: 7, title: "Cancel Sunrun Contract", slug: "cancel-sunrun-contract",
  targetKeyword: "cancel sunrun contract", contentType: "blog_article", stage: "draft_complete", draft: goodDraft,
  contentBrief: "Only supplied claims are evidence; no source images supplied.", editorFeedback: null, revisionCount: 0,
  ...overrides });
const artifact = (p: any) => ({ id: 70, content: p.draft, postSlug: p.slug, targetKeyword: p.targetKeyword });
const dialect = new MySqlDialect();
const editorDb: any = {
  select: () => {
    const answer = mocks.selects.shift();
    if (!answer) throw new Error("Missing editor select fixture");
    const query: any = { from: () => query, where: () => query, orderBy: () => query, limit: async () => answer };
    return query;
  },
  update: (table: any) => ({ set: (values: any) => ({ where: async (condition: any) => {
    mocks.writes.push({ table, values, query: dialect.sqlToQuery(condition) }); return [{ affectedRows: mocks.affectedRows }];
  } }) }),
};
const contentDb: any = {
  select: () => {
    let table: any;
    const query: any = { from: (value: any) => { table = value; return query; }, where: () => query, orderBy: () => query,
      limit: () => query, for: () => query, then: (resolve: any) => Promise.resolve(table === contentPipeline ? [mocks.row]
        : table === siteConfig ? (mocks.config ? [mocks.config] : []) : table === blogDrafts ? (mocks.artifact ? [mocks.artifact] : []) : []).then(resolve) };
    return query;
  },
  update: (table: any) => ({ set: (values: any) => ({ where: async () => {
    mocks.writes.push({ table, values });
    if (table === contentPipeline) mocks.row = { ...mocks.row, ...values };
    if (table === siteConfig) mocks.config = { ...mocks.config, ...values };
    if (table === blogDrafts) mocks.artifact = { ...mocks.artifact, ...values };
    return [{ affectedRows: 1 }];
  } }) }),
  insert: (table: any) => ({ values: (values: any) => {
    const apply = () => {
      if (table === siteConfig) mocks.config = { id: 4, ...values };
      if (table === blogDrafts) mocks.artifact = { id: 70, ...values };
      if (table === agentActions) mocks.actions.push(values);
    };
    return { then: (resolve: any) => { apply(); return Promise.resolve([{ insertId: 4 }]).then(resolve); },
      $returningId: async () => { apply(); return [{ id: 70 }]; } };
  } }),
  transaction: async (work: any) => work(contentDb),
};
const section = (index: number, dense = false) => {
  const heading = index === 0 ? "# Cancel Sunrun Contract" : index === 4 ? "## Frequently Asked Questions\n\n### What records help?\n\nA complete record helps.\n\n### Who can advise?\n\nA qualified professional.\n\n### What comes next?" : `## Useful section ${index}`;
  const body = dense ? prose(300) : Array(5).fill(prose(60)).join("\n\n");
  return `${heading}\n\n${body}${index === 5 ? "\n\nRequest a no-obligation case review. Call (904) 921-4971. [Letter tool](/free-cancellation-letter). This is not legal advice." : ""}`;
};
const sectionResponse = (index: number, text = section(index)) => JSON.stringify({ sectionIndex: index, complete: true, section: text });

beforeEach(() => {
  vi.clearAllMocks(); mocks.selects = []; mocks.writes = []; mocks.actions = []; mocks.row = null; mocks.config = null;
  mocks.artifact = null; mocks.invocation = undefined; mocks.affectedRows = 1;
  mocks.getDb.mockResolvedValue(editorDb); mocks.agentLLM.mockResolvedValue(JSON.stringify({ reviews: [approvedReview] }));
  mocks.startRun.mockResolvedValue({ runId: 99, llmCalls: 0, tokensIn: 0, tokensOut: 0, costUsd: 0, actionsCreated: 0, messagesCreated: 0 });
  mocks.completeRun.mockImplementation(async (_context, summary) => ({ summary })); mocks.getUnreadMessages.mockResolvedValue([]);
  mocks.getAgentModel.mockResolvedValue("unchanged-content-model");
  mocks.callAgentLLM.mockImplementation(async (opts: any) => {
    const index = JSON.parse(opts.messages[1].content).sectionIndex;
    return { content: sectionResponse(index), modelId: "unchanged-content-model", costSource: "unverified" };
  });
});

describe("draft-only presentation audit", () => {
  it.each(["markdown", "html"])("locates dense paragraphs and prose runs in %s", format => {
    const text = format === "html" ? `<h1>Article</h1><h2>Records</h2><p>${prose(121)}</p><p>${prose(121)}</p><p>${prose(121)}</p>`
      : `# Article\n\n## Records\n\n${Array(3).fill(prose(121)).join("\n\n")}`;
    const audit = auditDraftPresentation(text);
    expect(audit.format).toBe(format); expect(audit.longParagraphs).toHaveLength(3);
    expect(audit.longParagraphs[0]).toMatchObject({ index: 1, words: 121, section: "Records" });
    expect(audit.proseRuns).toEqual([{ fromParagraph: 1, toParagraph: 3, words: 363, section: "Records" }]);
    expect(audit.passed).toBe(false); expect(audit.visualRenderVerified).toBe(false);
    expect(audit.evidence).toContain("no screenshot/visual render verified");
    expect(audit.issues.join(" ")).toContain("not a Google rule");
  });
  it("uses exclusive, documented editorial thresholds rather than invented ranking rules", () => {
    expect(PRESENTATION_LIMITS).toMatchObject({ longParagraphWords: 120, uninterruptedProseWords: 360 });
    const atBound = auditDraftPresentation(`## Records\n\n${Array(3).fill(prose(120)).join("\n\n")}`);
    expect(atBound.longParagraphs).toHaveLength(0); expect(atBound.proseRuns).toHaveLength(0);
    expect(auditDraftPresentation(`## Records\n\n${Array(7).fill(prose(60)).join("\n\n")}`).proseRuns[0].words).toBe(420);
  });
  it.each(["## Better section", "- Gather records.\n- Ask questions.", "> Note: options depend on facts."])("breaks a prose run at useful structure: %s", structure => {
    const audit = auditDraftPresentation(`## Records\n\n${Array(3).fill(prose(100)).join("\n\n")}\n\n${structure}\n\n${prose(100)}`);
    expect(audit.proseRuns).toHaveLength(0); expect(audit.longParagraphs).toHaveLength(0);
  });
  it("does not let empty headings, one-item lists or line breaks disguise a prose wall", () => {
    const audit = auditDraftPresentation(`<h2></h2><div>${prose(200)}<br>${prose(200)}</div><ul><li>One point</li></ul>`);
    expect(audit.passed).toBe(false); expect(audit.headings[0].usable).toBe(false); expect(audit.lists[0].usable).toBe(false);
    expect(audit.longParagraphs[0].words).toBe(400);
  });
  it("does not let callout or list wrappers hide long paragraphs", () => {
    const quoted = auditDraftPresentation(`## Records\n\n> ${prose(200)}`);
    expect(quoted.calloutCount).toBe(1); expect(quoted.longParagraphs[0].words).toBe(200); expect(quoted.passed).toBe(false);
    const listed = auditDraftPresentation(`## Records\n\n- ${prose(200)}\n- Ask focused questions.`);
    expect(listed.lists[0].usable).toBe(true); expect(listed.longParagraphs[0].words).toBe(200); expect(listed.passed).toBe(false);
  });
  it("parses setext headings, reference images, nested lists, and ignores code/script fake markup", () => {
    const audit = auditDraftPresentation("Article\n=======\n\nUseful records\n--------------\n\n- Keep records\n  - Date them\n- Ask questions\n\n![Document checklist][asset]\n\n[asset]: https://cdn.owner.test/assets/checklist.webp\n\n```html\n<p>fake</p><img src='fake'>\n```\n<script><img src='also-fake'></script>");
    expect(audit.headings.map(h => h.level)).toEqual([1, 2]); expect(audit.lists[0]).toMatchObject({ usable: true, items: 2 });
    expect(audit.images).toHaveLength(1); expect(audit.images[0]).toMatchObject({ alt: "Document checklist", url: "https://cdn.owner.test/assets/checklist.webp", warnings: [] });
  });
  it("inventories image URLs and alt warnings without claiming they were viewed or fetched", () => {
    const audit = auditDraftPresentation(`<h2>Evidence</h2><img src="/managed/checklist.webp" alt="Records checklist"><img src="javascript:alert(1)"><img src="https://placehold.co/800x400" alt="image">`);
    expect(audit.images).toHaveLength(3); expect(audit.images[0].warnings).toEqual([]);
    expect(audit.images[1].warnings.join(" ")).toMatch(/alt text.*unsafe/);
    expect(audit.images[2].warnings.join(" ")).toMatch(/Generic.*placeholder/);
    expect(audit.passed).toBe(true); expect(audit.evidence).toContain("not fetched");
  });
  it("missing imagery is a separate non-blocking managed-asset need, not a text-revision loop", () => {
    const audit = auditDraftPresentation(goodDraft);
    expect(audit.passed).toBe(true); expect(audit.images).toHaveLength(0);
    expect(audit.warnings.join(" ")).toContain("Missing imagery alone is non-blocking");
    expect(audit.assetPolicy).toContain("never invent image URLs");
    expect(audit.cta).toMatchObject({ caseReviewMentioned: true, noObligationMentioned: true, currentPhoneMentioned: true, actionLinks: ["tel:9049214971"] });
    expect(presentationAuditFeedback(audit)).toContain(DRAFT_PRESENTATION_EVIDENCE);
  });
  it("bounds diagnostics without truncating or inventing the article inventory", () => {
    const audit = auditDraftPresentation(Array.from({ length: 30 }, (_, i) => `## Records ${i}\n\n${prose(121)}`).join("\n\n"));
    const input = presentationAuditForModel(audit);
    expect(audit.longParagraphs).toHaveLength(30); expect(input.longParagraphs).toMatchObject({ total: 30, omitted: 18 });
    expect(input.longParagraphs.items).toHaveLength(12); expect(audit.issues.join(" ").length).toBeLessThan(2000);
  });
});

describe("Editor presentation gate and Argon assessment", () => {
  it("overrides a high-scoring model approval for paragraph/layout defects, not missing images", () => {
    const dense = `# Cancel Sunrun Contract\n\n${prose(1700)}\n\n## FAQ\n\nRequest a no-obligation case review. This is not legal advice.`;
    expect(editorialDecision(approvedReview, assessEditorialSafety(dense))).toBe("revision_needed");
    expect(editorialDecision(approvedReview, assessEditorialSafety(goodDraft))).toBe("approve");
  });
  it("sends the exact full article and draft audit to Argon and persists non-vision evidence", async () => {
    const p = row(); mocks.selects.push([p], [artifact(p)], [p]);
    await runEditorAgent("cron", "dispatcher", { itemId: 7 });
    const options = mocks.agentLLM.mock.calls[0][0];
    expect(options.modelOverride).toBe("google/gemini-4-argon"); expect(options.agentSlug).toBe("editor");
    expect(options.messages[0].content).toContain("PRESENTATION REVIEW IS REQUIRED");
    expect(options.messages[0].content).toContain("managed asset workflow");
    const submitted = JSON.parse(options.messages[1].content.split("\n").slice(1).join("\n"))[0];
    expect(submitted).toMatchObject({ pipelineId: 7, slug: p.slug, title: p.title, targetKeyword: p.targetKeyword, draft: goodDraft });
    expect(submitted.presentationAudit).toMatchObject({ passed: true, visualRenderVerified: false });
    expect(mocks.writes[0].values).toMatchObject({ stage: "approved", finalContent: goodDraft, approvedBy: null });
    expect(mocks.writes[0].query.sql).toContain("EXISTS"); expect(mocks.writes[0].values).not.toHaveProperty("publishedAt");
    const action = mocks.createAction.mock.calls[0][0];
    expect(JSON.parse(action.payload)).toMatchObject({ fingerprint: draftFingerprint(goodDraft), fullDraftReviewed: true, visualRenderVerified: false });
    expect(JSON.parse(action.result).presentationAudit.evidence).toContain("no screenshot/visual render verified");
    expect(mocks.writes[0].values.editorFeedback).toContain("Missing imagery alone does not block");
  });
  it("the existing engine override contract disables fallback without changing engine or model config", () => {
    const source = readFileSync(new URL("./agents/engine.ts", import.meta.url), "utf8");
    expect(source).toMatch(/invocation\s*\|\|\s*params\.modelOverride\s*\?\s*\{\s*allowFallback:\s*false/);
  });
  it("blocks dense structure without a paid call and routes exact actionable text repairs", async () => {
    const p = row({ draft: `# Cancel Sunrun Contract\n\n${prose(1700)}\n\n## FAQ\n\nRequest a no-obligation case review. This is not legal advice.` });
    mocks.selects.push([p], [artifact(p)], [p]); await runEditorAgent("cron", "dispatcher", { itemId: 7 });
    expect(mocks.agentLLM).not.toHaveBeenCalled(); expect(mocks.writes[0].values.stage).toBe("revision_needed");
    expect(mocks.writes[0].values.editorFeedback).toContain("paragraph 1 (1700 words");
    expect(mocks.sendMessage.mock.calls[0][0]).toMatchObject({ toAgent: "content" });
    expect(mocks.sendMessage.mock.calls[0][0].body).toContain("Revise this exact linked draft");
  });
  it.each([
    { pipelineId: 999 }, { pipelineId: "7" }, { seoScore: 101 }, { eatScore: "90" },
    { hardFails: "malformed" }, { feedback: "revision_needed: verify the exact claim" },
  ])("does not let Argon bypass exact IDs or valid editorial metrics %#", async change => {
    const p = row(); mocks.selects.push([p], [artifact(p)], [p]);
    mocks.agentLLM.mockResolvedValue(JSON.stringify({ reviews: [{ ...approvedReview, ...change }] }));
    await runEditorAgent("cron", "dispatcher", { itemId: 7 });
    expect(mocks.writes[0].values.stage).toBe("revision_needed"); expect(mocks.writes[0].values.finalContent).toBeNull();
    expect(mocks.writes[0].query.params).not.toContain(999);
  });
  it("fails duplicate Argon IDs and provider failures closed without an approval", async () => {
    const p = row(); mocks.selects.push([p], [artifact(p)], [p]);
    mocks.agentLLM.mockResolvedValue(JSON.stringify({ reviews: [approvedReview, approvedReview] }));
    await runEditorAgent("cron", "dispatcher", { itemId: 7 });
    expect(mocks.writes[0].values.stage).toBe("revision_needed"); expect(mocks.writes[0].values.editorFeedback).toContain("conflicting duplicate");
    mocks.writes = []; mocks.createAction.mockClear(); mocks.selects.push([p], [artifact(p)]);
    mocks.agentLLM.mockRejectedValue(new Error("Argon unavailable; fallback disabled"));
    await expect(runEditorAgent("cron", "dispatcher", { itemId: 7 })).rejects.toThrow("fallback disabled");
    expect(mocks.writes).toHaveLength(0); expect(mocks.createAction).not.toHaveBeenCalled();
  });
  it.each(["obsolete phone", "law firm claim", "guarantee", "missing disclaimer"])("preserves rejection for %s", failure => {
    const draft = failure === "missing disclaimer" ? goodDraft.replace("This is not legal advice.", "")
      : `${goodDraft}\n\n${failure === "obsolete phone" ? "Call 214-529-1631." : failure === "law firm claim" ? "We are a law firm." : "You will win your case."}`;
    expect(editorialDecision(approvedReview, assessEditorialSafety(draft))).toBe("reject");
  });
  it("discards changed exact artifacts and lost compare-and-set races", async () => {
    const p = row(); mocks.selects.push([p], [artifact(p)], [row({ draft: `${goodDraft} Changed.` })]);
    await runEditorAgent("cron", "dispatcher", { itemId: 7 }); expect(mocks.writes).toHaveLength(0);
    mocks.selects.push([p], [artifact(p)], [p]); mocks.affectedRows = 0;
    await runEditorAgent("cron", "dispatcher", { itemId: 7 }); expect(mocks.createAction).not.toHaveBeenCalled(); expect(mocks.sendMessage).not.toHaveBeenCalled();
  });
});

describe("bounded autonomous exact-article presentation repair", () => {
  const setup = () => { mocks.getDb.mockResolvedValue(contentDb); mocks.row = row({ stage: "revision_needed", draft: goodDraft,
    editorFeedback: "Split the dense legal paragraph in this exact article." }); };
  it("adds presentation evidence and repair context without changing the Content model/budgets", async () => {
    setup(); const result = await runContentDraftStep(7, 11); const options = mocks.callAgentLLM.mock.calls[0][0];
    expect(result.sectionsCompleted).toBe(1); expect(mocks.callAgentLLM).toHaveBeenCalledTimes(1);
    expect(options).toMatchObject({ agentSlug: "content", modelOverride: "unchanged-content-model", allowFallback: false, maxTokens: 1000, executionMode: "scheduled" });
    expect(options.totalTimeoutMs).toBeLessThanOrEqual(16000); expect(options.messages[0].content).toContain("repair this EXACT article");
    const input = JSON.parse(options.messages[1].content);
    expect(input).toMatchObject({ pipelineId: 7, title: mocks.row.title, slug: mocks.row.slug, originalDraft: goodDraft });
    expect(input.feedback).toContain("Split the dense legal paragraph"); expect(input.presentationAudit.visualRenderVerified).toBe(false);
    expect(input.existingImageUrls).toEqual([]);
  });
  it("finalizes a structured image-free draft in six calls, without another revision round or publication", async () => {
    setup(); let final: any;
    for (let i = 0; i < 6; i++) final = await runContentDraftStep(7, 11);
    expect(final).toMatchObject({ done: true, stage: "draft_complete", issues: [] });
    expect(mocks.row.revisionCount).toBe(1); expect(mocks.callAgentLLM).toHaveBeenCalledTimes(6);
    expect(mocks.row.draft).toBe(mocks.artifact.content); expect(mocks.row.finalContent).toBeNull(); expect(mocks.row.approvedBy).toBeNull();
    expect(mocks.row.wordCount).toBe(actualDraftWordCount(mocks.row.draft));
    expect(JSON.parse(mocks.actions[0].result).presentationAudit).toMatchObject({ passed: true, visualRenderVerified: false, images: [] });
    const replay = await runContentDraftStep(7, 11); expect(replay.done).toBe(true); expect(mocks.callAgentLLM).toHaveBeenCalledTimes(6);
  });
  it("retains the finite section flow but puts a dense completed draft into revision_needed", async () => {
    setup(); mocks.callAgentLLM.mockImplementation(async (opts: any) => {
      const index = JSON.parse(opts.messages[1].content).sectionIndex;
      return { content: sectionResponse(index, section(index, true)), modelId: "unchanged-content-model", costSource: "unverified" };
    });
    let final: any; for (let i = 0; i < 6; i++) final = await runContentDraftStep(7, 11);
    expect(final.stage).toBe("revision_needed"); expect(mocks.row.editorFeedback).toContain("dense paragraph");
    expect(mocks.row.editorFeedback).toContain("no screenshot/visual render verified"); expect(mocks.callAgentLLM).toHaveBeenCalledTimes(6);
    expect(JSON.parse(mocks.actions[0].payload).preflightPassed).toBe(false);
  });
  it("does not invent an image even when the exact URL was supplied as a source", () => {
    const url = "https://cdn.owner.test/source.webp";
    const text = `${section(0)}\n\n![Helpful document](${url})\n\nRead the records.`;
    expect(() => validateContentDraftSection(sectionResponse(0, text), 0, [], [url])).toThrow("image reference");
    expect(validateContentDraftSection(sectionResponse(0, text), 0, [], [url], [url])).toBe(text);
    const managedPath = "/managed/document-checklist.webp";
    const existing = `${section(0)}\n\n![Records checklist](${managedPath})\n\nRead the records.`;
    expect(validateContentDraftSection(sectionResponse(0, existing), 0, [], [], [managedPath])).toBe(existing);
    expect(() => validateContentDraftSection(sectionResponse(0, existing), 0, [], [])).toThrow("image reference");
    const fake = `${section(0)}\n\n<img src="javascript:alert(1)" alt="Records">\n\nRead the records.`;
    expect(() => validateContentDraftSection(sectionResponse(0, fake), 0, [], [], ["javascript:alert(1)"])).toThrow("image reference");
  });
});
