import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeBlogSeo, type BlogSeoInput } from "./blogSeoAnalysis";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

const completeDraft: BlogSeoInput = {
  title: "Solar contract cancellation options for homeowners",
  targetKeyword: "solar contract",
  content: '<h2>Cancellation options</h2><p>A solar contract needs careful review.</p><a href="/blog/cancellation">Read the related guide</a>',
  slug: "solar-contract-options",
  metaTitle: "Solar contract options: a homeowner guide",
  metaDescription: "Review your agreement and seek qualified advice about cancellation options.",
};

function criterion(input: BlogSeoInput, id: string) {
  return analyzeBlogSeo(input).criteria.find(item => item.id === id)!;
}

function context(role: "admin" | "user" | null): TrpcContext {
  return {
    user: role ? {
      id: 1, openId: "draft-checklist-test", email: "admin@example.test", name: "Test",
      loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    } : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

afterEach(() => vi.restoreAllMocks());

describe("BlogStudio deterministic draft checklist", () => {
  it("scores only explicit weighted passes and labels the score as a draft checklist", () => {
    const result = analyzeBlogSeo(completeDraft);
    expect(result.criteria.reduce((sum, item) => sum + item.weight, 0)).toBe(100);
    expect(result.criteria.every(item => item.status === "pass")).toBe(true);
    expect(result.score).toBe(100);
    expect(result.score).toBe(result.criteria.reduce((sum, item) => sum + item.earned, 0));
    expect(result.scoreLabel).toBe("Draft checklist");
    expect(result.publishedHtmlVerified).toBe(false);
    expect(result.limitations.join(" ")).toContain("not a Google or ranking score");
  });

  it("cannot give 100 with a missing body keyword even when six other criteria pass", () => {
    const result = analyzeBlogSeo({ ...completeDraft, content: '<h2>Options</h2><p>Review your agreement.</p><a href="/blog/guide">Guide</a>' });
    expect(result.suggestions.filter(item => item.type === "success")).toHaveLength(6);
    expect(result.criteria.find(item => item.id === "keyword_body")).toMatchObject({ status: "fail", earned: 0, weight: 25 });
    expect(result.keywordCount).toBe(0);
    expect(result.score).toBe(75);
  });

  it.each([
    ["draft_title", { title: "" }],
    ["keyword_title", { title: "Cancellation options for homeowners" }],
    ["headings", { content: '<p>A solar contract needs review.</p><a href="/blog/guide">Guide</a>' }],
    ["internal_links", { content: "<h2>Options</h2><p>A solar contract needs review.</p>" }],
    ["meta_title", { metaTitle: "A guide for homeowners" }],
    ["meta_description", { metaDescription: "" }],
  ] as const)("a failed %s check cannot earn points or yield 100", (id, overrides) => {
    const result = analyzeBlogSeo({ ...completeDraft, ...overrides });
    expect(result.criteria.find(item => item.id === id)).toMatchObject({ status: "fail", earned: 0 });
    expect(result.score).toBeLessThan(100);
  });

  it("does not add points for padding, more headings, extra links or density", () => {
    const baseline = analyzeBlogSeo(completeDraft);
    const padded = analyzeBlogSeo({ ...completeDraft, content: completeDraft.content + `<p>${"filler ".repeat(2500)}</p><h2>More options</h2><a href="/blog/other">Other guide</a>` });
    expect(padded.wordCount).toBeGreaterThan(baseline.wordCount);
    expect(padded.keywordDensity).toBeLessThan(baseline.keywordDensity);
    expect(padded.score).toBe(baseline.score);
    expect(padded.suggestions.some(item => /ideal range|better rankings|aim for .*%/i.test(item.message))).toBe(false);
  });

  it("keeps missing keyword and metadata checks unmeasured with a fixed denominator", () => {
    const { metaTitle: _title, metaDescription: _description, targetKeyword: _keyword, ...draft } = completeDraft;
    const result = analyzeBlogSeo(draft);
    expect(result.score).toBe(30);
    expect(result.criteria.filter(item => item.status === "unmeasured")).toHaveLength(4);
    expect(result.criteria.filter(item => item.status === "unmeasured").every(item => item.earned === 0)).toBe(true);
    expect(result.maxScore).toBe(100);
    expect(result.suggestions.some(item => item.message.includes("no meta description field supplied"))).toBe(true);
  });

  it("distinguishes absent metadata from supplied empty values, without claiming HTML verification", () => {
    const missing = analyzeBlogSeo({ ...completeDraft, metaTitle: undefined, metaDescription: undefined });
    expect(missing.score).toBe(70);
    expect(criterion({ ...completeDraft, metaTitle: undefined }, "meta_title").status).toBe("unmeasured");
    expect(criterion({ ...completeDraft, metaTitle: "" }, "meta_title").status).toBe("fail");
    expect(criterion({ ...completeDraft, metaDescription: "" }, "meta_description").status).toBe("fail");
    expect(missing.publishedHtmlVerified).toBe(false);
    expect(missing.limitations.join(" ")).toContain("Published HTML");
  });

  it("treats meta keywords as optional, unscored audit compliance, not target text", () => {
    const missing = analyzeBlogSeo(completeDraft);
    const present = analyzeBlogSeo({ ...completeDraft, metaKeywords: "solar contract, cancellation" });
    const empty = analyzeBlogSeo({ ...completeDraft, metaKeywords: " " });
    expect(missing.metaKeywordsAudit).toMatchObject({ status: "unmeasured", scored: false });
    expect(present.metaKeywordsAudit).toMatchObject({ status: "present", scored: false });
    expect(empty.metaKeywordsAudit.status).toBe("empty");
    expect(present.metaKeywordsAudit.message).toContain("not a Google ranking factor");
    expect(present.score).toBe(missing.score);
    expect(empty.score).toBe(missing.score);
    const tagOnly = analyzeBlogSeo({ ...completeDraft, metaKeywords: "solar contract", content: '<meta name="keywords" content="solar contract"><h2>Options</h2><p>Review your agreement.</p><a href="/blog/guide">Guide</a>' });
    expect(tagOnly.keywordCount).toBe(0);
    expect(tagOnly.score).toBe(75);
  });

  it.each(["[", "C++", "solar (lease)", "a.*", "solar|lease", "(a+)+$"])("matches regex-like keyword %s literally and safely", keyword => {
    const result = analyzeBlogSeo({ title: keyword, content: `<p>${keyword} ${keyword}</p>`, targetKeyword: keyword });
    expect(result.keywordCount).toBe(2);
    expect(analyzeBlogSeo({ title: "unrelated", content: "<p>aaaa solar lease text</p>", targetKeyword: keyword }).keywordCount).toBe(0);
  });

  it("normalizes case, spaces and entities while excluding substring, script and attribute-only matches", () => {
    const result = analyzeBlogSeo({ title: "Solar contract", targetKeyword: " SOLAR  contract ", content: '<script>solar contract</script><style>solar contract</style><p hidden>solar contract</p><p aria-hidden="true">solar contract</p><p data-keyword="solar contract">presolar contracts</p><p>Solar&nbsp;CONTRACT</p><p>solar <strong>contract</strong></p>' });
    expect(result.keywordCount).toBe(2);
    expect(analyzeBlogSeo({ title: "", content: "<p>solar contract</p>", targetKeyword: " " }).keywordCount).toBe(0);
  });

  it("handles Unicode word boundaries and avoids joining adjacent block words", () => {
    expect(analyzeBlogSeo({ title: "", content: "<p>résiliation</p><p>présiliation résiliations</p>", targetKeyword: "résiliation" }).keywordCount).toBe(1);
    expect(analyzeBlogSeo({ title: "", content: "<p>solar</p><p>contract</p>", targetKeyword: "solar contract" }).keywordCount).toBe(1);
    expect(analyzeBlogSeo({ title: "", content: "<p>solar</p><p>contract</p>" }).wordCount).toBe(2);
  });

  it("counts actual nonempty heading elements and valid internal URL syntax, not protocol-relative links", () => {
    const result = analyzeBlogSeo({ title: "", content: `<h2></h2><h2>Options</h2><h20>Not a heading</h20><h3>Details</h3>
      <a href='/blog/guide'>Guide</a><a href=https://breakyoursolarcontract.com/blog/other>Other</a>
      <a href="//evil.example/path">Protocol relative</a><a href="javascript:alert(1)">Script</a>
      <a href="/\\evil.example">Ambiguous</a><a href="/bad path">Space</a><a href="/empty"></a>
      <a href="/bad%zz">Malformed encoding</a><a href="https://[invalid">Malformed URL</a>
      <a href="https://user:password@breakyoursolarcontract.com/blog/guide">Credentials</a>
      <a href="https://breakyoursolarcontract.com.evil.example/path">External</a><a href="https://www.ftc.gov">FTC</a>` });
    expect(result.h2Count).toBe(1);
    expect(result.h3Count).toBe(1);
    expect(result.internalLinks).toBe(2);
    expect(result.externalLinks).toBe(2);
    expect(result.limitations.join(" ")).toContain("destination existence and HTTP status are unmeasured");
  });

  it("has finite empty-draft statistics and no success points", () => {
    const result = analyzeBlogSeo({ title: "", content: "" });
    expect(result.score).toBe(0);
    expect(result.wordCount).toBe(0);
    expect(result.keywordCount).toBe(0);
    expect(result.keywordDensity).toBe(0);
    expect(result.readingTime).toBe(0);
  });
});

describe("blogStudio.analyzeSeo contract", () => {
  it("returns existing metrics plus actual criteria/score, forwarding supplied metadata without side effects", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("No network allowed"));
    const dbSpy = vi.spyOn(db, "getDb").mockRejectedValue(new Error("No database allowed"));
    const result = await appRouter.createCaller(context("admin")).blogStudio.analyzeSeo(completeDraft);
    expect(result).toEqual(analyzeBlogSeo(completeDraft));
    expect(result).toHaveProperty("keywordCount");
    expect(result).toHaveProperty("externalLinks");
    expect(result.suggestions.every(item => ["warning", "success", "info"].includes(item.type))).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(dbSpy).not.toHaveBeenCalled();
  });

  it("supports legacy input without metadata and exposes those checks as unmeasured", async () => {
    const result = await appRouter.createCaller(context("admin")).blogStudio.analyzeSeo({ title: "solar contract", content: "<p>A solar contract</p>", targetKeyword: "solar contract" });
    expect(result.criteria.find(item => item.id === "meta_title")?.status).toBe("unmeasured");
    expect(result.criteria.find(item => item.id === "meta_description")?.status).toBe("unmeasured");
    expect(result.metaKeywordsAudit.status).toBe("unmeasured");
    expect(result.score).toBeLessThan(100);
  });

  it.each(["user", null] as const)("rejects %s callers", async role => {
    await expect(appRouter.createCaller(context(role)).blogStudio.analyzeSeo(completeDraft)).rejects.toThrow();
  });
});
