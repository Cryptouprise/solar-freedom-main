import { Router } from "express";
import { z } from "zod";
import { desc } from "drizzle-orm";
import crypto from "node:crypto";
import { rateLimit } from "express-rate-limit";
import { requirePermission, type AdminRequest } from "./adminAuth";
import { getAdminBlogPost, getDb, upsertBlogDraft } from "./db";
import { seoScorecardSnapshots } from "../drizzle/schema";
import { readAutonomousStatus } from "./autonomousStatus";
import { pageVisualReviewSchema, readLatestVisualReviews, reviewPageAppearance } from "./pageVisualReview";
import { sanitizeStoredHtml } from "./security/html";
import { createAction } from "./agents/engine";
import { decodeBase64Image, safeImageStem, ImageValidationError } from "./security/imageUpload";

const router = Router();
const slugSchema = z.string().max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const fingerprint = (post: { title: string; content: string; updatedAt?: unknown }) => crypto.createHash("sha256").update(JSON.stringify({ title: post.title, content: post.content, updatedAt: post.updatedAt })).digest("hex");
export const externalDraftSchema = z.object({
  postSlug: slugSchema, expectedSourceFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  name: z.string().min(1).max(100), title: z.string().min(1).max(300), content: z.string().min(1).max(100_000),
  metaTitle: z.string().max(60).optional(), metaDescription: z.string().max(160).optional(),
  heroImage: z.string().url().max(1000).optional(), excerpt: z.string().max(1000).optional(), targetKeyword: z.string().max(200).optional(),
}).strict();

router.post("/media/upload", requirePermission("media:write"), async (req, res) => {
  try {
    const input = z.object({ data: z.string().max(11_200_000), contentType: z.string().max(40).optional(), filename: z.string().max(100).optional() }).strict().parse(req.body);
    const image = decodeBase64Image(input.data, input.contentType);
    const { storagePut } = await import("./storage");
    const key = `blog-images/${safeImageStem(input.filename)}-${crypto.randomBytes(8).toString("hex")}.${image.extension}`;
    const saved = await storagePut(key, image.buffer, image.mimeType);
    return res.status(201).json({ url: saved.url, key, mimeType: image.mimeType, size: image.buffer.length, published: false, nextStep: "Use this managed URL in an owner-review draft. Uploading it does not change any public page." });
  } catch (error) { return res.status(error instanceof z.ZodError || error instanceof ImageValidationError ? 400 : 503).json({ error: "Invalid image bytes or managed upload unavailable. Remote URL imports are not supported." }); }
});

router.get("/posts/source/:slug", requirePermission("posts:read"), async (req, res) => {
  try {
    const slug = slugSchema.parse(req.params.slug); const post = await getAdminBlogPost(slug);
    if (!post) return res.status(404).json({ error: "Exact editable blog source not found; use City Recovery for city pages." });
    return res.json({ post, sourceFingerprint: fingerprint(post), source: post.id < 0 ? "static article adapted to editable HTML" : "database article", nextStep: "Save reviewed changes to /drafts; this read does not publish anything." });
  } catch (error) { return res.status(error instanceof z.ZodError ? 400 : 503).json({ error: error instanceof z.ZodError ? "Invalid article slug" : "Source database unavailable" }); }
});

router.post("/drafts", requirePermission("drafts:write"), async (req: AdminRequest, res) => {
  try {
    const input = externalDraftSchema.parse(req.body);
    const post = await getAdminBlogPost(input.postSlug); if (!post) return res.status(404).json({ error: "Exact existing blog not found; new-page/city publication is not part of this draft endpoint." });
    if (fingerprint(post) !== input.expectedSourceFingerprint) return res.status(409).json({ error: "Source changed; re-read before saving your repair draft." });
    const content = sanitizeStoredHtml(input.content); if (!content.trim()) return res.status(400).json({ error: "Draft must contain safe article HTML" });
    const { expectedSourceFingerprint, ...draft } = input;
    const saved = await upsertBlogDraft({ ...draft, content, name: `External review: ${draft.name}`.slice(0, 200) });
    const actionId = await createAction({ agentSlug: "seo_intel", actionType: "external_repair_draft", requiresApproval: 0, status: "completed",
      title: `[EXTERNAL DRAFT] /blog/${input.postSlug}`, description: "An external AI saved an owner-review repair draft. No live article, indexing, canonical, or analytics change was performed.",
      payload: JSON.stringify({ postSlug: input.postSlug, sourceFingerprint: expectedSourceFingerprint, actor: req.apiKey?.name }),
      result: JSON.stringify({ draftId: saved.id, postSlug: input.postSlug, saved: true, published: false, reviewPath: `/admin/blog-studio?postSlug=${input.postSlug}&draftId=${saved.id}` }) });
    return res.status(201).json({ saved: true, published: false, draftId: saved.id, actionId, reviewPath: `/admin/blog-studio?postSlug=${input.postSlug}&draftId=${saved.id}`, nextStep: "Owner must inspect the saved draft and approve publication. Saving it never modifies the public article." });
  } catch (error) { console.error("External repair draft failed", error instanceof z.ZodError ? "validation" : error instanceof Error ? error.message : "unknown"); return res.status(error instanceof z.ZodError ? 400 : 503).json({ error: error instanceof z.ZodError ? "Invalid draft payload or exceeded field bounds" : "Draft save unavailable; no publication claimed" }); }
});

router.post("/presentation/review", requirePermission("visual:review"), rateLimit({ windowMs: 60_000, limit: 3, standardHeaders: true, legacyHeaders: false }), async (req: AdminRequest, res) => {
  try { const input = pageVisualReviewSchema.parse(req.body); return res.json(await reviewPageAppearance(input, req.apiKey?.name || "external-api")); }
  catch (error) { const message = error instanceof Error ? error.message : "Review failed"; console.error("Page review failed", message); return res.status(error instanceof z.ZodError ? 400 : message.includes("ten minutes") ? 429 : 503).json({ error: error instanceof z.ZodError ? "Invalid, stale or oversized screenshot evidence" : message.includes("ten minutes") ? message : "Argon review unavailable; no success or public fix claimed" }); }
});
router.get("/presentation/reviews", requirePermission("posts:read"), async (_req, res) => {
  try { return res.json({ reviews: await readLatestVisualReviews() }); } catch { return res.status(503).json({ error: "Review receipts unavailable" }); }
});
router.get("/seo/outcomes", requirePermission("seo:read"), async (_req, res) => {
  try {
    const db = await getDb(); if (!db) return res.status(503).json({ error: "Measurement database unavailable" });
    const rows = await db.select().from(seoScorecardSnapshots).orderBy(desc(seoScorecardSnapshots.capturedAt)).limit(30);
    return res.json({ capturedAt: new Date().toISOString(), source: "Persisted Google Search Console scorecards and first-party lead records—not a fresh Google query", snapshots: rows.map(row => ({ id: row.id, measuredAt: row.capturedAt, periodStart: row.periodStart, periodEnd: row.periodEnd, clicks: row.clicks, impressions: row.impressions, ctrPercent: Number(row.ctrPercent), averagePosition: Number(row.avgPosition), durableLeads: row.durableLeads, appointments: null, appointmentStatus: "Unverified feed—no zero substituted" })), definitions: "Snapshot totals cover the stated rolling GSC period; snapshot dates are run dates, not daily lead counts. Overlapping windows are not independent daily improvements." });
  } catch { return res.status(503).json({ error: "Measured outcome snapshots unavailable" }); }
});
router.get("/agents/work", requirePermission("agents:read"), async (_req, res) => {
  try { const status = await readAutonomousStatus(); return res.json({ capturedAt: new Date().toISOString(), configured: status.configured, lastTickAt: status.lastTickAt, jobs: status.jobs.map(job => ({ id: job.id, kind: job.kind, role: job.role, pipelineId: job.pipelineId, status: job.status, steps: job.steps, failures: job.failures, nextRunAt: job.nextRunAt, updatedAt: job.updatedAt })), note: "Work-state evidence only. No provider secrets, customer records, contact details, model overrides, schedule mutations or unapproved sending are exposed." }); }
  catch { return res.status(503).json({ error: "Durable worker status unavailable" }); }
});
export default router;
