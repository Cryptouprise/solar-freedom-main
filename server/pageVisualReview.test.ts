import { describe, it, expect, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({ call: vi.fn(), create: vi.fn(), query: vi.fn() }));
vi.mock("./db", () => ({ getDb: vi.fn(async () => ({ select: () => ({ from: () => ({ where: () => ({ limit: async () => [], orderBy: () => ({ limit: mocks.query }) }) }) }) })) }));
vi.mock("./agents/agentLLM", () => ({ callAgentLLM: mocks.call }));
vi.mock("./agents/engine", () => ({ createAction: mocks.create }));
import { pageVisualReviewSchema, reviewPageAppearance, publicReviewPath } from "./pageVisualReview";
const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6l8sAAAAASUVORK5CYII=";
const input = () => ({ path: "/cancel-solar-contract/houston-tx", capturedAt: new Date().toISOString(), captureMethod: "browser_screenshot" as const, viewport: { width: 390, height: 844 }, captures: [{ position: "top" as const, image }], evidence: { title: "Houston agreement review", headings: ["Houston agreement review"], paragraphWords: [30], imageCount: 1, brokenImages: 0, missingAlt: 0, horizontalOverflow: false, ctas: [], limitations: ["Mobile top only; desktop and unseen parts not inspected."] } });
beforeEach(() => { vi.clearAllMocks(); mocks.create.mockResolvedValue(71); mocks.call.mockResolvedValue({ content: JSON.stringify({ verdict: "needs_repair", summary: "The supplied view has a dense opening paragraph and a low-contrast next step.", issues: [{ area: "layout", severity: "high", evidence: "Opening paragraph occupies most of the shown mobile view.", repair: "Separate the opening into short paragraphs and add a clear review button." }], limitations: ["Only the supplied screenshot was inspected; no ranking gain measured."] }), modelId: "google/gemini-4-argon", requestedModelId: "google/gemini-4-argon", costUsd: .003, costSource: "usage", usage: { promptTokens: 500, completionTokens: 200 } }); });
describe("bounded page appearance evidence", () => {
  it("accepts an exact public page and fresh validated image bytes", () => expect(pageVisualReviewSchema.parse(input()).captures).toHaveLength(1));
  it.each(["/admin/leads", "https://evil.example/blog/a", "//evil.example/blog/a", "/blog/../admin", "/blog/a?key=secret", "/api/internal", "/blog/a%2fb"])("rejects untrusted path %s", path => expect(publicReviewPath.safeParse(path).success).toBe(false));
  it("rejects stale captures, remote image URLs and invalid signatures", () => {
    const stale = input(); stale.capturedAt = "2020-01-01T00:00:00.000Z"; expect(pageVisualReviewSchema.safeParse(stale).success).toBe(false);
    const remote = input(); remote.captures[0].image = "https://127.0.0.1/private"; expect(pageVisualReviewSchema.safeParse(remote).success).toBe(false);
    const fake = input(); fake.captures[0].image = "data:image/png;base64,YWJj"; expect(pageVisualReviewSchema.safeParse(fake).success).toBe(false);
  });
  it("sends real multimodal parts to Argon without fallback and stores assessment, not publication", async () => {
    const result = await reviewPageAppearance(input(), "test-owner");
    expect(mocks.call.mock.calls[0][0]).toMatchObject({ agentSlug: "seo_intel", modelOverride: "google/gemini-4-argon", allowFallback: false, totalTimeoutMs: 45000 });
    expect(mocks.call.mock.calls[0][0].messages[1].content).toContainEqual({ type: "image_url", image_url: { url: image, detail: "high" } });
    expect(result).toMatchObject({ actionId: 71, publicChange: false, captureMethod: "browser_screenshot" });
    const record = mocks.create.mock.calls[0][0]; expect(record).toMatchObject({ actionType: "visual_review", status: "completed" });
    expect(record.payload + record.result).not.toContain("base64");
  });
  it("fails closed on malformed model response", async () => { mocks.call.mockResolvedValueOnce({ content: "looks perfect" }); await expect(reviewPageAppearance(input(), "owner")).rejects.toThrow(); expect(mocks.create).not.toHaveBeenCalled(); });
  it("overrides an unsupported pass if broken image evidence was supplied", async () => {
    mocks.call.mockResolvedValueOnce({ content: JSON.stringify({ verdict: "pass", summary: "The displayed layout is readable and clear in this viewport.", issues: [], limitations: ["Only supplied screenshot reviewed."] }), modelId: "google/gemini-4-argon", costSource: "unverified" });
    const data = input(); data.evidence.brokenImages = 1;
    const result = await reviewPageAppearance(data, "owner"); expect(result.assessment.verdict).toBe("needs_repair"); expect(result.costUsd).toBeNull();
  });
});
