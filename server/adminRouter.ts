/**
 * Admin Content API Router
 * 
 * REST API for external AI tools (Claude, Cursor, etc.) to manage site content.
 * All endpoints require a valid API key in the Authorization header.
 * 
 * Base path: /api/admin
 * Auth: Authorization: Bearer sf_<your-key>
 * 
 * Endpoints:
 *   GET    /api/admin/posts              - List all blog posts
 *   GET    /api/admin/posts/:slug        - Get single post
 *   POST   /api/admin/posts              - Create new post
 *   PUT    /api/admin/posts/:slug        - Update post
 *   DELETE /api/admin/posts/:slug        - Delete post
 * 
 *   GET    /api/admin/companies          - List all companies
 *   GET    /api/admin/companies/:slug    - Get single company
 *   POST   /api/admin/companies          - Create company
 *   PUT    /api/admin/companies/:slug    - Update company
 * 
 *   GET    /api/admin/config             - Get all site config
 *   PUT    /api/admin/config/:key        - Set config value
 * 
 *   GET    /api/admin/keys               - List API keys (names/prefixes only)
 *   POST   /api/admin/keys               - Generate new API key
 *   DELETE /api/admin/keys/:id           - Revoke API key
 * 
 *   GET    /api/admin/status             - Health check + site stats
 */

import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq, desc, like, and } from "drizzle-orm";
import { getDb } from "./db";
import { blogPosts, companies, siteConfig, apiKeys } from "../drizzle/schema";
import { adminAuthMiddleware, requirePermission, AdminRequest } from "./adminAuth";

const router = Router();

// ─── Apply auth to all admin routes ────────────────────────────────────────
router.use(adminAuthMiddleware);

// ─── STATUS / HEALTH CHECK ──────────────────────────────────────────────────
router.get("/status", async (req: AdminRequest, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const [postCount] = await db.select({ count: blogPosts.id }).from(blogPosts);
    const [companyCount] = await db.select({ count: companies.id }).from(companies);

    res.json({
      status: "ok",
      site: "breakyoursolarcontract.com",
      apiKey: req.apiKey?.name,
      permissions: req.apiKey?.permissions,
      stats: {
        blogPosts: postCount?.count ?? 0,
        companies: companyCount?.count ?? 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── BLOG POSTS ─────────────────────────────────────────────────────────────

// GET /api/admin/posts?published=1&search=sunrun&limit=20&offset=0
router.get("/posts", requirePermission("posts:read"), async (req: AdminRequest, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;

    const rows = await db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        category: blogPosts.category,
        excerpt: blogPosts.excerpt,
        readTime: blogPosts.readTime,
        published: blogPosts.published,
        publishedAt: blogPosts.publishedAt,
        updatedAt: blogPosts.updatedAt,
      })
      .from(blogPosts)
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit)
      .offset(offset);

    res.json({ posts: rows, count: rows.length, limit, offset });
  } catch (err) {
    res.status(500).json({ error: "Internal server error", details: String(err) });
  }
});

// GET /api/admin/posts/all — returns EVERY post: static files + DB posts combined
// Claude should use this to find existing articles for interlinking
router.get("/posts/all", requirePermission("posts:read"), async (req: AdminRequest, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const { blogPosts: staticPosts } = await import("../client/src/data/blog.js").catch(() =>
      import("../client/src/data/blog")
    ) as { blogPosts: Array<{ slug: string; title: string; category?: string; excerpt?: string; tags?: string[]; readTime?: string }> };

    const dbRows = await db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        category: blogPosts.category,
        excerpt: blogPosts.excerpt,
        readTime: blogPosts.readTime,
        tags: blogPosts.tags,
        published: blogPosts.published,
        publishedAt: blogPosts.publishedAt,
      })
      .from(blogPosts)
      .orderBy(desc(blogPosts.publishedAt));

    const staticMapped = staticPosts.map(p => ({
      source: "static" as const,
      slug: p.slug,
      title: p.title,
      category: p.category ?? null,
      excerpt: p.excerpt ?? null,
      readTime: p.readTime ?? null,
      tags: Array.isArray(p.tags) ? p.tags : [],
      url: `/blog/${p.slug}`,
    }));

    const dbMapped = dbRows.map(p => ({
      source: "database" as const,
      slug: p.slug,
      title: p.title,
      category: p.category ?? null,
      excerpt: p.excerpt ?? null,
      readTime: p.readTime ?? null,
      tags: safeParseJson(p.tags, []) as string[],
      published: p.published === 1,
      url: `/blog/${p.slug}`,
    }));

    const dbSlugs = new Set(dbMapped.map(p => p.slug));
    const merged = [
      ...dbMapped,
      ...staticMapped.filter(p => !dbSlugs.has(p.slug)),
    ];

    res.json({
      total: merged.length,
      staticCount: staticMapped.length,
      dbCount: dbMapped.length,
      posts: merged,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error", details: String(err) });
  }
});

// GET /api/admin/posts/slugs — lightweight list of all slugs + titles for interlinking
router.get("/posts/slugs", requirePermission("posts:read"), async (req: AdminRequest, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const { blogPosts: staticPosts } = await import("../client/src/data/blog.js").catch(() =>
      import("../client/src/data/blog")
    ) as { blogPosts: Array<{ slug: string; title: string; category?: string }> };

    const dbRows = await db
      .select({ slug: blogPosts.slug, title: blogPosts.title, category: blogPosts.category })
      .from(blogPosts);

    const dbSlugs = new Set(dbRows.map(p => p.slug));
    const all = [
      ...dbRows.map(p => ({ slug: p.slug, title: p.title, category: p.category, source: "database", url: `/blog/${p.slug}` })),
      ...staticPosts.filter(p => !dbSlugs.has(p.slug)).map(p => ({ slug: p.slug, title: p.title, category: p.category, source: "static", url: `/blog/${p.slug}` })),
    ];

    res.json({ total: all.length, slugs: all });
  } catch (err) {
    res.status(500).json({ error: "Internal server error", details: String(err) });
  }
});

// GET /api/admin/posts/:slug
router.get("/posts/:slug", requirePermission("posts:read"), async (req: AdminRequest, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, req.params.slug));
    if (!post) return res.status(404).json({ error: "Post not found" });

    // Parse JSON fields
    res.json({
      ...post,
      tags: safeParseJson(post.tags, []),
      relatedSlugs: safeParseJson(post.relatedSlugs, []),
      faqItems: safeParseJson(post.faqItems, []),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error", details: String(err) });
  }
});

// POST /api/admin/posts
router.post("/posts", requirePermission("posts:write"), async (req: AdminRequest, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const { slug, title, content, metaTitle, metaDescription, heroImage, category,
            tags, excerpt, readTime, relatedSlugs, faqItems, canonicalUrl, published } = req.body;

    if (!slug || !title || !content) {
      return res.status(400).json({ error: "slug, title, and content are required" });
    }

    // Check for duplicate slug
    const [existing] = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, slug));
    if (existing) return res.status(409).json({ error: `Post with slug '${slug}' already exists` });

    await db.insert(blogPosts).values({
      slug,
      title,
      content,
      metaTitle: metaTitle || title,
      metaDescription,
      heroImage,
      category,
      tags: Array.isArray(tags) ? JSON.stringify(tags) : tags,
      excerpt,
      readTime,
      relatedSlugs: Array.isArray(relatedSlugs) ? JSON.stringify(relatedSlugs) : relatedSlugs,
      faqItems: Array.isArray(faqItems) ? JSON.stringify(faqItems) : faqItems,
      canonicalUrl,
      published: published !== undefined ? (published ? 1 : 0) : 1,
      publishedAt: new Date(),
    });

    const [created] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    res.status(201).json({ success: true, post: created });
  } catch (err) {
    res.status(500).json({ error: "Internal server error", details: String(err) });
  }
});

// PUT /api/admin/posts/:slug
router.put("/posts/:slug", requirePermission("posts:write"), async (req: AdminRequest, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const [existing] = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, req.params.slug));
    if (!existing) return res.status(404).json({ error: "Post not found" });

    const updates: Record<string, unknown> = {};
    const fields = ["title", "content", "metaTitle", "metaDescription", "heroImage",
                    "category", "excerpt", "readTime", "canonicalUrl", "published"];
    for (const f of fields) {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    }
    // JSON fields
    if (req.body.tags !== undefined) updates.tags = JSON.stringify(req.body.tags);
    if (req.body.relatedSlugs !== undefined) updates.relatedSlugs = JSON.stringify(req.body.relatedSlugs);
    if (req.body.faqItems !== undefined) updates.faqItems = JSON.stringify(req.body.faqItems);
    if (req.body.published !== undefined) updates.published = req.body.published ? 1 : 0;

    await db.update(blogPosts).set(updates).where(eq(blogPosts.slug, req.params.slug));
    const [updated] = await db.select().from(blogPosts).where(eq(blogPosts.slug, req.params.slug));
    res.json({ success: true, post: updated });
  } catch (err) {
    res.status(500).json({ error: "Internal server error", details: String(err) });
  }
});

// DELETE /api/admin/posts/:slug
router.delete("/posts/:slug", requirePermission("posts:delete"), async (req: AdminRequest, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const [existing] = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, req.params.slug));
    if (!existing) return res.status(404).json({ error: "Post not found" });

    await db.delete(blogPosts).where(eq(blogPosts.slug, req.params.slug));
    res.json({ success: true, message: `Post '${req.params.slug}' deleted` });
  } catch (err) {
    res.status(500).json({ error: "Internal server error", details: String(err) });
  }
});

// ─── COMPANIES ──────────────────────────────────────────────────────────────

// GET /api/admin/companies
router.get("/companies", requirePermission("companies:read"), async (req: AdminRequest, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const rows = await db.select().from(companies).orderBy(companies.name);
    res.json({ companies: rows.map(c => ({ ...c, contractTypes: safeParseJson(c.contractTypes, []), customerComplaints: safeParseJson(c.customerComplaints, []), documentedIssues: safeParseJson(c.documentedIssues, []), legalGrounds: safeParseJson(c.legalGrounds, []), lawsuits: safeParseJson(c.lawsuits, []), statesCovered: safeParseJson(c.statesCovered, []), relatedSlugs: safeParseJson(c.relatedSlugs, []) })), count: rows.length });
  } catch (err) {
    res.status(500).json({ error: "Internal server error", details: String(err) });
  }
});

// GET /api/admin/companies/:slug
router.get("/companies/:slug", requirePermission("companies:read"), async (req: AdminRequest, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const [company] = await db.select().from(companies).where(eq(companies.slug, req.params.slug));
    if (!company) return res.status(404).json({ error: "Company not found" });

    res.json({
      ...company,
      contractTypes: safeParseJson(company.contractTypes, []),
      customerComplaints: safeParseJson(company.customerComplaints, []),
      documentedIssues: safeParseJson(company.documentedIssues, []),
      legalGrounds: safeParseJson(company.legalGrounds, []),
      lawsuits: safeParseJson(company.lawsuits, []),
      statesCovered: safeParseJson(company.statesCovered, []),
      relatedSlugs: safeParseJson(company.relatedSlugs, []),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error", details: String(err) });
  }
});

// POST /api/admin/companies
router.post("/companies", requirePermission("companies:write"), async (req: AdminRequest, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const { slug, name } = req.body;
    if (!slug || !name) return res.status(400).json({ error: "slug and name are required" });

    const [existing] = await db.select({ id: companies.id }).from(companies).where(eq(companies.slug, slug));
    if (existing) return res.status(409).json({ error: `Company with slug '${slug}' already exists` });

    const jsonFields = ["contractTypes", "customerComplaints", "documentedIssues", "legalGrounds", "lawsuits", "statesCovered", "relatedSlugs"];
    const values: Record<string, unknown> = { ...req.body };
    for (const f of jsonFields) {
      if (Array.isArray(values[f])) values[f] = JSON.stringify(values[f]);
    }

    await db.insert(companies).values(values as any);
    const [created] = await db.select().from(companies).where(eq(companies.slug, slug));
    res.status(201).json({ success: true, company: created });
  } catch (err) {
    res.status(500).json({ error: "Internal server error", details: String(err) });
  }
});

// PUT /api/admin/companies/:slug
router.put("/companies/:slug", requirePermission("companies:write"), async (req: AdminRequest, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const [existing] = await db.select({ id: companies.id }).from(companies).where(eq(companies.slug, req.params.slug));
    if (!existing) return res.status(404).json({ error: "Company not found" });

    const updates: Record<string, unknown> = { ...req.body };
    const jsonFields = ["contractTypes", "customerComplaints", "documentedIssues", "legalGrounds", "lawsuits", "statesCovered", "relatedSlugs"];
    for (const f of jsonFields) {
      if (Array.isArray(updates[f])) updates[f] = JSON.stringify(updates[f]);
    }
    delete updates.id; delete updates.slug; delete updates.createdAt;

    await db.update(companies).set(updates).where(eq(companies.slug, req.params.slug));
    const [updated] = await db.select().from(companies).where(eq(companies.slug, req.params.slug));
    res.json({ success: true, company: updated });
  } catch (err) {
    res.status(500).json({ error: "Internal server error", details: String(err) });
  }
});

// ─── SITE CONFIG ─────────────────────────────────────────────────────────────

// GET /api/admin/config
router.get("/config", requirePermission("config:read"), async (req: AdminRequest, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const rows = await db.select().from(siteConfig).orderBy(siteConfig.key);
    const config: Record<string, string> = {};
    for (const row of rows) config[row.key] = row.value;
    res.json({ config, raw: rows });
  } catch (err) {
    res.status(500).json({ error: "Internal server error", details: String(err) });
  }
});

// PUT /api/admin/config/:key
router.put("/config/:key", requirePermission("config:write"), async (req: AdminRequest, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const { value, description } = req.body;
    if (value === undefined) return res.status(400).json({ error: "value is required" });

    const [existing] = await db.select({ id: siteConfig.id }).from(siteConfig).where(eq(siteConfig.key, req.params.key));

    if (existing) {
      await db.update(siteConfig).set({ value: String(value), description }).where(eq(siteConfig.key, req.params.key));
    } else {
      await db.insert(siteConfig).values({ key: req.params.key, value: String(value), description });
    }

    const [updated] = await db.select().from(siteConfig).where(eq(siteConfig.key, req.params.key));
    res.json({ success: true, config: updated });
  } catch (err) {
    res.status(500).json({ error: "Internal server error", details: String(err) });
  }
});

// ─── API KEY MANAGEMENT ──────────────────────────────────────────────────────

// GET /api/admin/keys — list keys (no hashes exposed)
router.get("/keys", requirePermission("keys:manage"), async (req: AdminRequest, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const rows = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        permissions: apiKeys.permissions,
        active: apiKeys.active,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .orderBy(desc(apiKeys.createdAt));

    res.json({ keys: rows.map(k => ({ ...k, permissions: safeParseJson(k.permissions, []) })) });
  } catch (err) {
    res.status(500).json({ error: "Internal server error", details: String(err) });
  }
});

// POST /api/admin/keys — generate new API key
router.post("/keys", requirePermission("keys:manage"), async (req: AdminRequest, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const { name, permissions } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const perms = Array.isArray(permissions) ? permissions : ["posts:read", "posts:write", "companies:read", "companies:write", "config:read", "config:write"];

    // Generate a secure random key
    const rawKey = `sf_${crypto.randomBytes(32).toString("hex")}`;
    const keyPrefix = rawKey.slice(0, 10); // "sf_" + 7 chars
    const keyHash = await bcrypt.hash(rawKey, 12);

    await db.insert(apiKeys).values({
      name,
      keyHash,
      keyPrefix,
      permissions: JSON.stringify(perms),
      active: 1,
    });

    res.status(201).json({
      success: true,
      message: "Save this key — it will NOT be shown again",
      key: rawKey,
      keyPrefix,
      name,
      permissions: perms,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error", details: String(err) });
  }
});

// DELETE /api/admin/keys/:id — revoke key
router.delete("/keys/:id", requirePermission("keys:manage"), async (req: AdminRequest, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid key ID" });

    await db.update(apiKeys).set({ active: 0 }).where(eq(apiKeys.id, id));
    res.json({ success: true, message: `API key ${id} revoked` });
  } catch (err) {
    res.status(500).json({ error: "Internal server error", details: String(err) });
  }
});

/// ─── IMAGE UPLOAD ───────────────────────────────────────────────────────────
// POST /api/admin/upload
// Accepts: base64 image data OR a URL to fetch
// Returns: { url: "https://cdn.../image.png", key: "images/..." }
router.post("/upload", requirePermission("posts:write"), async (req: AdminRequest, res) => {
  try {
    const { storagePut } = await import("./storage");
    const { data, url: sourceUrl, filename, contentType: ct } = req.body;

    let buffer: Buffer;
    let mimeType = ct || "image/png";
    let name = filename || `image-${Date.now()}`;

    if (data) {
      // Base64 encoded image data
      const base64 = data.replace(/^data:[^;]+;base64,/, "");
      buffer = Buffer.from(base64, "base64");
      // Detect mime from data URI prefix if present
      const mimeMatch = data.match(/^data:([^;]+);base64,/);
      if (mimeMatch) mimeType = mimeMatch[1];
    } else if (sourceUrl) {
      // Fetch image from URL
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        return res.status(400).json({ error: `Failed to fetch image from URL: ${response.status}` });
      }
      const arrayBuf = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuf);
      mimeType = response.headers.get("content-type") || mimeType;
      // Extract filename from URL if not provided
      if (!filename) {
        const urlPath = new URL(sourceUrl).pathname;
        name = urlPath.split("/").pop()?.split("?")[0] || name;
      }
    } else {
      return res.status(400).json({ 
        error: "Provide either 'data' (base64) or 'url' (image URL to fetch)",
        example: {
          option1: { data: "base64-encoded-image-data", filename: "hero.png", contentType: "image/png" },
          option2: { url: "https://example.com/image.png", filename: "hero.png" }
        }
      });
    }

    // Ensure filename has extension
    const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "png";
    if (!name.includes(".")) name = `${name}.${ext}`;

    // Generate unique path to prevent enumeration
    const randomSuffix = crypto.randomBytes(8).toString("hex");
    const fileKey = `blog-images/${name.replace(/\.[^.]+$/, "")}-${randomSuffix}.${ext}`;

    const result = await storagePut(fileKey, buffer, mimeType);

    res.status(201).json({
      success: true,
      url: result.url,
      key: result.key,
      mimeType,
      size: buffer.length,
      filename: name
    });
  } catch (err) {
    res.status(500).json({ error: "Upload failed", details: String(err) });
  }
});

// POST /api/admin/upload/batch
// Upload multiple images at once
router.post("/upload/batch", requirePermission("posts:write"), async (req: AdminRequest, res) => {
  try {
    const { storagePut } = await import("./storage");
    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ 
        error: "Provide 'images' array with objects containing 'data' or 'url'",
        example: { images: [{ url: "https://...", filename: "hero.png" }] }
      });
    }

    if (images.length > 10) {
      return res.status(400).json({ error: "Maximum 10 images per batch" });
    }

    const results = [];
    for (const img of images) {
      try {
        let buffer: Buffer;
        let mimeType = img.contentType || "image/png";
        let name = img.filename || `image-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        if (img.data) {
          const base64 = img.data.replace(/^data:[^;]+;base64,/, "");
          buffer = Buffer.from(base64, "base64");
          const mimeMatch = img.data.match(/^data:([^;]+);base64,/);
          if (mimeMatch) mimeType = mimeMatch[1];
        } else if (img.url) {
          const response = await fetch(img.url);
          if (!response.ok) {
            results.push({ error: `Failed to fetch: ${img.url}`, status: response.status });
            continue;
          }
          buffer = Buffer.from(await response.arrayBuffer());
          mimeType = response.headers.get("content-type") || mimeType;
        } else {
          results.push({ error: "Each image needs 'data' or 'url'" });
          continue;
        }

        const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "png";
        if (!name.includes(".")) name = `${name}.${ext}`;
        const randomSuffix = crypto.randomBytes(8).toString("hex");
        const fileKey = `blog-images/${name.replace(/\.[^.]+$/, "")}-${randomSuffix}.${ext}`;

        const result = await storagePut(fileKey, buffer, mimeType);
        results.push({ success: true, url: result.url, key: result.key, filename: name });
      } catch (imgErr) {
        results.push({ error: String(imgErr) });
      }
    }

    res.status(201).json({ success: true, uploaded: results.filter(r => r.success).length, results });
  } catch (err) {
    res.status(500).json({ error: "Batch upload failed", details: String(err) });
  }
});

// ─── HELPERS ────────────────────────────────────────────────────────────────
function safeParseJson(val: string | null | undefined, fallback: unknown) {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}
export default router;
