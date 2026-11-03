import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import crypto from "node:crypto";
const mocks = vi.hoisted(() => ({ source: vi.fn(), save: vi.fn(), create: vi.fn(), visual: vi.fn(), latest: vi.fn(), status: vi.fn() }));
vi.mock("./db", () => ({ getAdminBlogPost: mocks.source, upsertBlogDraft: mocks.save, getDb: vi.fn() }));
vi.mock("./agents/engine", () => ({ createAction: mocks.create }));
vi.mock("./pageVisualReview", async importOriginal => { const actual = await importOriginal<typeof import("./pageVisualReview")>(); return { ...actual, reviewPageAppearance: mocks.visual, readLatestVisualReviews: mocks.latest }; });
vi.mock("./autonomousStatus", () => ({ readAutonomousStatus: mocks.status }));
import router from "./externalSeoRouter";
const post = { id: 3, slug: "sunrun-options", title: "Sunrun options", content: "<h2>Options</h2><p>Keep these original claims.</p>", updatedAt: new Date("2026-11-01T10:00:00Z") };
const hash = crypto.createHash("sha256").update(JSON.stringify({ title: post.title, content: post.content, updatedAt: post.updatedAt })).digest("hex");
async function request(path: string, permission: string, body?: unknown) {
  const app = express(); app.use(express.json()); app.use((req, _res, next) => { (req as any).apiKey = { name: "test-external", permissions: permission ? [permission] : [] }; next(); }); app.use(router);
  const server = app.listen(0); await new Promise<void>(resolve => server.on("listening", () => resolve()));
  const address = server.address() as { port: number };
  try { const response = await fetch(`http://localhost:${address.port}${path}`, { method: body ? "POST" : "GET", headers: { "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) }); return { status: response.status, body: await response.json() }; }
  finally { await new Promise<void>(resolve => server.close(() => resolve())); }
}
beforeEach(() => { vi.clearAllMocks(); mocks.source.mockResolvedValue(post); mocks.save.mockResolvedValue({ id: 19 }); mocks.create.mockResolvedValue(77); mocks.latest.mockResolvedValue([]); });
describe("external SEO least-privilege routes", () => {
  it("does not call paid vision or save drafts when permission is absent", async () => { expect((await request("/presentation/review", "posts:read", {})).status).toBe(403); expect((await request("/drafts", "posts:read", {})).status).toBe(403); expect(mocks.visual).not.toHaveBeenCalled(); expect(mocks.save).not.toHaveBeenCalled(); });
  it("returns exact editable source and a source fingerprint", async () => { const response = await request("/posts/source/sunrun-options", "posts:read"); expect(response.status).toBe(200); expect(response.body.sourceFingerprint).toBe(hash); });
  it("rejects stale source without saving", async () => { const response = await request("/drafts", "drafts:write", { postSlug: "sunrun-options", expectedSourceFingerprint: "0".repeat(64), name: "readable repair", title: post.title, content: post.content }); expect(response.status).toBe(409); expect(mocks.save).not.toHaveBeenCalled(); });
  it("saves only a sanitized owner-review draft with its actual ID", async () => { const response = await request("/drafts", "drafts:write", { postSlug: "sunrun-options", expectedSourceFingerprint: hash, name: "readable repair", title: post.title, content: post.content + '<script>alert(1)</script>' }); expect(response.status).toBe(201); expect(response.body).toMatchObject({ draftId: 19, saved: true, published: false }); expect(response.body.reviewPath).toContain("draftId=19"); expect(mocks.save.mock.calls[0][0].content).not.toContain("<script>"); expect(mocks.create.mock.calls[0][0].actionType).toBe("external_repair_draft"); });
  it("rejects attempts to smuggle publication or exceed title limits", async () => { const input = { postSlug: "sunrun-options", expectedSourceFingerprint: hash, name: "repair", title: post.title, content: post.content }; expect((await request("/drafts", "drafts:write", { ...input, published: true })).status).toBe(400); expect((await request("/drafts", "drafts:write", { ...input, metaTitle: "a".repeat(61) })).status).toBe(400); expect(mocks.save).not.toHaveBeenCalled(); });
  it("returns a minimal work projection without source payloads, secrets or customer records", async () => { mocks.status.mockResolvedValue({ configured: true, lastTickAt: new Date(), jobs: [{ id: 1, kind: "content", role: "content", pipelineId: 7, status: "queued", steps: 1, failures: 0, nextRunAt: new Date(), updatedAt: new Date(), error: "private error", summary: "private summary", stateJson: "secret" }] }); const response = await request("/agents/work", "agents:read"); expect(response.status).toBe(200); expect(response.body.jobs[0]).not.toHaveProperty("stateJson"); expect(JSON.stringify(response.body.jobs)).not.toContain("private"); });
});
