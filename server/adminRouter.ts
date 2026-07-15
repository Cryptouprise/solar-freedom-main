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
 *   POST   /api/admin/automation/apply   - Validate and hash a dry-run change plan
 * 
 *   GET    /api/admin/status             - Health check + site stats
 */

import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import path from "path";
import { readFile } from "fs/promises";
import { eq, desc, like, and } from "drizzle-orm";
import { getDb } from "./db";
import { blogPosts, companies, siteConfig, apiKeys } from "../drizzle/schema";
import { adminAuthMiddleware, requirePermission, AdminRequest } from "./adminAuth";
import { sanitizeStoredHtml } from "./security/html";
import { isAllowedPublicConfigKey, PUBLIC_SITE_CONFIG_KEYS } from "./security/configPolicy";
import {
  decodeBase64Image,
  ImageValidationError,
  safeImageStem,
} from "./security/imageUpload";
import { evaluateAdminAutomationRequest } from "./automationPolicy";
import { rateLimit } from "express-rate-limit";

const router = Router();

function sendInternalError(res: Response, error: unknown, publicMessage = "Internal server error") {
  const errorId = crypto.randomUUID();
  console.error(`[AdminAPI:${errorId}]`, error);
  return res.status(500).json({ error: publicMessage, errorId });
}

const REPO_ROOT = process.cwd();
const MAX_AUTOMATION_OPERATIONS = 20;
const MAX_AUTOMATION_FILE_BYTES = 300_000;
const MAX_SQL_MIGRATION_LENGTH = 8_000;
const ALLOWED_AUTOMATION_PATH_PREFIXES = ["client/src/", "server/", "shared/", "drizzle/", "docs/"];
const ALLOWED_AUTOMATION_FILE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".sql", ".css"]);
const SQL_MIGRATION_ALLOWED_PREFIXES = ["CREATE TABLE", "ALTER TABLE", "CREATE INDEX", "DROP INDEX"];
const SQL_MIGRATION_BLOCKLIST = /(^|;)\s*(DROP\s+TABLE|TRUNCATE|DELETE\s+FROM|UPDATE\s+\w+|INSERT\s+INTO|REPLACE\s+INTO)\b/i;
const SQL_COMMENT_PATTERN = /(--|\/\*|\*\/)/;
const SQL_CREATE_AS_SELECT_PATTERN = /\bCREATE\s+TABLE\b[\s\S]*\bAS\s+SELECT\b/i;
const COMPANY_MUTABLE_FIELDS = [
  "name", "legalName", "status", "bbbRating", "complaintCount", "avgMonthlyPayment",
  "avgContractLength", "founded", "headquarters", "contractTypes", "heroHeadline",
  "heroSubheadline", "problemSummary", "customerComplaints", "documentedIssues",
  "legalGrounds", "lawsuits", "statesCovered", "relatedSlugs",
] as const;

// ─── Apply auth to all admin routes ────────────────────────────────────────
router.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }), adminAuthMiddleware);

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
    sendInternalError(res, err);
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
    sendInternalError(res, err);
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
    sendInternalError(res, err);
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
      content: sanitizeStoredHtml(post.content),
      tags: safeParseJson(post.tags, []),
      relatedSlugs: safeParseJson(post.relatedSlugs, []),
      faqItems: safeParseJson(post.faqItems, []),
    });
  } catch (err) {
    sendInternalError(res, err);
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
    if (published !== undefined && typeof published !== "boolean") {
      return res.status(400).json({ error: "published must be a boolean" });
    }

    // Check for duplicate slug
    const [existing] = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, slug));
    if (existing) return res.status(409).json({ error: `Post with slug '${slug}' already exists` });

    const publishRequested = published === true;
    if (publishRequested && !hasPermission(req, "posts:publish")) {
      return res.status(403).json({ error: "Publishing requires 'posts:publish'; content was not created" });
    }
    const safeContent = sanitizeStoredHtml(content);

    await db.insert(blogPosts).values({
      slug,
      title,
      content: safeContent,
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
      published: publishRequested ? 1 : 0,
      publishedAt: publishRequested ? new Date() : null,
    });

    const [created] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    res.status(201).json({ success: true, post: created });
  } catch (err) {
    sendInternalError(res, err);
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
    if (req.body.published !== undefined && typeof req.body.published !== "boolean") {
      return res.status(400).json({ error: "published must be a boolean" });
    }
    if (req.body.published === true && !hasPermission(req, "posts:publish")) {
      return res.status(403).json({ error: "Publishing requires 'posts:publish'" });
    }
    const fields = ["title", "metaTitle", "metaDescription", "heroImage",
                    "category", "excerpt", "readTime", "canonicalUrl"];
    for (const f of fields) {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    }
    if (req.body.content !== undefined) updates.content = sanitizeStoredHtml(req.body.content);
    // JSON fields
    if (req.body.tags !== undefined) updates.tags = JSON.stringify(req.body.tags);
    if (req.body.relatedSlugs !== undefined) updates.relatedSlugs = JSON.stringify(req.body.relatedSlugs);
    if (req.body.faqItems !== undefined) updates.faqItems = JSON.stringify(req.body.faqItems);
    if (req.body.published !== undefined) {
      updates.published = req.body.published ? 1 : 0;
      if (req.body.published) updates.publishedAt = new Date();
    }

    await db.update(blogPosts).set(updates).where(eq(blogPosts.slug, req.params.slug));
    const [updated] = await db.select().from(blogPosts).where(eq(blogPosts.slug, req.params.slug));
    res.json({ success: true, post: updated });
  } catch (err) {
    sendInternalError(res, err);
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
    sendInternalError(res, err);
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
    sendInternalError(res, err);
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
    sendInternalError(res, err);
  }
});

// POST /api/admin/companies
router.post("/companies", requirePermission("companies:write"), async (req: AdminRequest, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const { slug, name } = req.body;
    if (!slug || !name) return res.status(400).json({ error: "slug and name are required" });
    if (req.body.published !== undefined && typeof req.body.published !== "boolean") {
      return res.status(400).json({ error: "published must be a boolean" });
    }

    const [existing] = await db.select({ id: companies.id }).from(companies).where(eq(companies.slug, slug));
    if (existing) return res.status(409).json({ error: `Company with slug '${slug}' already exists` });

    const publishRequested = req.body.published === true;
    if (publishRequested && !hasPermission(req, "companies:publish")) {
      return res.status(403).json({ error: "Publishing requires 'companies:publish'; company was not created" });
    }
    const jsonFields = ["contractTypes", "customerComplaints", "documentedIssues", "legalGrounds", "lawsuits", "statesCovered", "relatedSlugs"];
    const values: Record<string, unknown> = { slug, published: publishRequested ? 1 : 0 };
    for (const field of COMPANY_MUTABLE_FIELDS) {
      if (req.body[field] !== undefined) values[field] = req.body[field];
    }
    for (const f of jsonFields) {
      if (Array.isArray(values[f])) values[f] = JSON.stringify(values[f]);
    }

    await db.insert(companies).values(values as any);
    const [created] = await db.select().from(companies).where(eq(companies.slug, slug));
    res.status(201).json({ success: true, company: created });
  } catch (err) {
    sendInternalError(res, err);
  }
});

// PUT /api/admin/companies/:slug
router.put("/companies/:slug", requirePermission("companies:write"), async (req: AdminRequest, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const [existing] = await db.select({ id: companies.id }).from(companies).where(eq(companies.slug, req.params.slug));
    if (!existing) return res.status(404).json({ error: "Company not found" });

    if (req.body.published !== undefined && typeof req.body.published !== "boolean") {
      return res.status(400).json({ error: "published must be a boolean" });
    }
    if (req.body.published === true && !hasPermission(req, "companies:publish")) {
      return res.status(403).json({ error: "Publishing requires 'companies:publish'" });
    }
    const updates: Record<string, unknown> = {};
    for (const field of COMPANY_MUTABLE_FIELDS) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    if (req.body.published !== undefined) updates.published = req.body.published ? 1 : 0;
    const jsonFields = ["contractTypes", "customerComplaints", "documentedIssues", "legalGrounds", "lawsuits", "statesCovered", "relatedSlugs"];
    for (const f of jsonFields) {
      if (Array.isArray(updates[f])) updates[f] = JSON.stringify(updates[f]);
    }
    await db.update(companies).set(updates).where(eq(companies.slug, req.params.slug));
    const [updated] = await db.select().from(companies).where(eq(companies.slug, req.params.slug));
    res.json({ success: true, company: updated });
  } catch (err) {
    sendInternalError(res, err);
  }
});

// ─── SITE CONFIG ─────────────────────────────────────────────────────────────

// GET /api/admin/config
router.get("/config", requirePermission("config:read"), async (req: AdminRequest, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const rows = await db.select().from(siteConfig).orderBy(siteConfig.key);
    const visibleRows = rows.filter((row) => PUBLIC_SITE_CONFIG_KEYS.has(row.key));
    const config: Record<string, string> = {};
    for (const row of visibleRows) config[row.key] = row.value;
    res.json({ config, raw: visibleRows });
  } catch (err) {
    sendInternalError(res, err);
  }
});

// PUT /api/admin/config/:key
router.put("/config/:key", requirePermission("config:write"), async (req: AdminRequest, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const { value, description } = req.body;
    if (value === undefined) return res.status(400).json({ error: "value is required" });
    if (!isAllowedPublicConfigKey(req.params.key)) {
      return res.status(400).json({ error: "Config key is not in the public runtime allowlist" });
    }
    if (String(value).length > 500 || (description !== undefined && String(description).length > 500)) {
      return res.status(400).json({ error: "Config value or description is too long" });
    }

    const [existing] = await db.select({ id: siteConfig.id }).from(siteConfig).where(eq(siteConfig.key, req.params.key));

    if (existing) {
      await db.update(siteConfig).set({ value: String(value), description }).where(eq(siteConfig.key, req.params.key));
    } else {
      await db.insert(siteConfig).values({ key: req.params.key, value: String(value), description });
    }

    const [updated] = await db.select().from(siteConfig).where(eq(siteConfig.key, req.params.key));
    res.json({ success: true, config: updated });
  } catch (err) {
    sendInternalError(res, err);
  }
});

// ─── AUTOMATION (ALLOWLISTED EDITS + MIGRATIONS) ──────────────────────────────
type AutomationWriteFileOperation = {
  type: "write_file";
  path: string;
  content: string;
  expectedSha256?: string;
};

type AutomationSqlMigrationOperation = {
  type: "sql_migration";
  statement: string;
};

type AutomationOperation = AutomationWriteFileOperation | AutomationSqlMigrationOperation;

router.post("/automation/apply", requirePermission("automation:execute"), async (req: AdminRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const { operations, dryRun } = req.body ?? {};
    const executionPolicy = evaluateAdminAutomationRequest(dryRun);
    if (!executionPolicy.planningAllowed) {
      return res.status(409).json({
        error: "Direct runtime automation is disabled",
        ...executionPolicy,
        requiredFlow: "Submit dryRun:true, review the hashed plan, then use Git or an approved typed adapter with verification and rollback.",
      });
    }
    if (!Array.isArray(operations) || operations.length === 0) {
      return res.status(400).json({ error: "operations array is required" });
    }
    if (operations.length > MAX_AUTOMATION_OPERATIONS) {
      return res.status(400).json({ error: `Maximum ${MAX_AUTOMATION_OPERATIONS} operations per request` });
    }

    const applyDryRun = true;
    const results: Array<Record<string, unknown>> = [];
    const auditOperations: Array<Record<string, unknown>> = [];

    for (let i = 0; i < operations.length; i++) {
      const op = operations[i] as AutomationOperation;

      if (op?.type === "write_file") {
        if (typeof op.path !== "string" || typeof op.content !== "string") {
          return res.status(400).json({ error: `write_file operation ${i} requires path and content` });
        }

        let targetPath: string;
        try {
          targetPath = resolveAllowlistedAutomationPath(op.path);
        } catch (pathErr) {
          console.warn(`[AdminAPI] Rejected automation path at operation ${i}:`, pathErr);
          return res.status(400).json({ error: `write_file operation ${i} has invalid path` });
        }
        const contentBytes = Buffer.byteLength(op.content, "utf8");
        if (contentBytes > MAX_AUTOMATION_FILE_BYTES) {
          return res.status(400).json({ error: `write_file operation ${i} exceeds ${MAX_AUTOMATION_FILE_BYTES} bytes` });
        }

        const existingContents = await readFileIfExists(targetPath);
        const beforeSha256 = existingContents ? sha256(existingContents) : null;
        if (op.expectedSha256 && beforeSha256 && op.expectedSha256 !== beforeSha256) {
          return res.status(409).json({
            error: `write_file operation ${i} failed optimistic lock`,
            path: op.path,
            expectedSha256: op.expectedSha256,
            actualSha256: beforeSha256,
          });
        }

        results.push({
          index: i,
          type: op.type,
          path: op.path,
          dryRun: applyDryRun,
          beforeSha256,
          afterSha256: sha256(op.content),
          bytes: contentBytes,
        });
        auditOperations.push({
          index: i,
          type: op.type,
          path: op.path,
          bytes: contentBytes,
          expectedSha256: op.expectedSha256 ?? null,
        });
        continue;
      }

      if (op?.type === "sql_migration") {
        if (typeof op.statement !== "string" || op.statement.trim().length === 0) {
          return res.status(400).json({ error: `sql_migration operation ${i} requires statement` });
        }

        const statement = op.statement.trim();
        if (statement.length > MAX_SQL_MIGRATION_LENGTH) {
          return res.status(400).json({ error: `sql_migration operation ${i} exceeds ${MAX_SQL_MIGRATION_LENGTH} chars` });
        }
        if (SQL_COMMENT_PATTERN.test(statement)) {
          return res.status(400).json({ error: `sql_migration operation ${i} cannot include SQL comments` });
        }
        if (SQL_CREATE_AS_SELECT_PATTERN.test(statement)) {
          return res.status(400).json({ error: `sql_migration operation ${i} cannot use CREATE TABLE ... AS SELECT` });
        }

        const normalized = statement.replace(/\s+/g, " ").toUpperCase();
        if (!SQL_MIGRATION_ALLOWED_PREFIXES.some(prefix => normalized.startsWith(prefix))) {
          return res.status(400).json({
            error: `sql_migration operation ${i} must start with one of: ${SQL_MIGRATION_ALLOWED_PREFIXES.join(", ")}`,
          });
        }
        if (SQL_MIGRATION_BLOCKLIST.test(normalized)) {
          return res.status(400).json({ error: `sql_migration operation ${i} contains a blocked SQL command` });
        }

        results.push({
          index: i,
          type: op.type,
          dryRun: applyDryRun,
          statementSha256: sha256(statement),
          statementPreview: statement.slice(0, 160),
        });
        auditOperations.push({
          index: i,
          type: op.type,
          statementSha256: sha256(statement),
          statementPreview: statement.slice(0, 160),
        });
        continue;
      }

      return res.status(400).json({ error: `Unsupported operation type at index ${i}` });
    }

    const auditPayload = {
      apiKeyName: req.apiKey?.name ?? null,
      apiKeyId: req.apiKey?.id ?? null,
      dryRun: applyDryRun,
      operationCount: operations.length,
      operations: auditOperations,
      results,
      createdAt: new Date().toISOString(),
    };

    const auditKey = await writeAutomationAuditLog(db, auditPayload);
    res.status(200).json({
      success: true,
      dryRun: true,
      executionEnabled: false,
      applied: 0,
      planned: results.length,
      results,
      auditKey,
      policy: executionPolicy,
    });
  } catch (err) {
    sendInternalError(res, err, "Automation planning failed");
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
    sendInternalError(res, err);
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
    sendInternalError(res, err);
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
    sendInternalError(res, err);
  }
});

/// ─── IMAGE UPLOAD ───────────────────────────────────────────────────────────
// POST /api/admin/upload
// Accepts base64 image data only. Remote URL imports are disabled to prevent
// DNS-rebinding/server-side request-forgery paths.
// Returns: { url: "https://cdn.../image.png", key: "images/..." }
router.post("/upload", requirePermission("posts:write"), async (req: AdminRequest, res) => {
  try {
    const { storagePut } = await import("./storage");
    const { data, url: sourceUrl, filename, contentType: ct } = req.body;

    if (sourceUrl) {
      return res.status(400).json({ error: "Remote URL imports are disabled; upload image bytes as base64 data" });
    }
    if (!data) {
      return res.status(400).json({ 
        error: "Provide 'data' with base64-encoded image bytes",
        example: {
          data: "base64-encoded-image-data", filename: "hero.png", contentType: "image/png"
        }
      });
    }

    const image = decodeBase64Image(data, ct);
    const name = `${safeImageStem(filename)}.${image.extension}`;

    // Generate unique path to prevent enumeration
    const randomSuffix = crypto.randomBytes(8).toString("hex");
    const fileKey = `blog-images/${safeImageStem(name)}-${randomSuffix}.${image.extension}`;

    const result = await storagePut(fileKey, image.buffer, image.mimeType);

    res.status(201).json({
      success: true,
      url: result.url,
      key: result.key,
      mimeType: image.mimeType,
      size: image.buffer.length,
      filename: name
    });
  } catch (err) {
    if (err instanceof ImageValidationError) return res.status(400).json({ error: err.message });
    res.status(500).json({ error: "Upload failed" });
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
        error: "Provide 'images' array with base64 data objects",
        example: { images: [{ data: "base64-encoded-image-data", filename: "hero.png", contentType: "image/png" }] }
      });
    }

    if (images.length > 10) {
      return res.status(400).json({ error: "Maximum 10 images per batch" });
    }

    const results = [];
    for (const img of images) {
      try {
        if (img.url) {
          results.push({ error: "Remote URL imports are disabled" });
          continue;
        }
        if (!img.data) {
          results.push({ error: "Each image needs base64 'data'" });
          continue;
        }
        const image = decodeBase64Image(img.data, img.contentType);
        const name = `${safeImageStem(img.filename)}.${image.extension}`;
        const randomSuffix = crypto.randomBytes(8).toString("hex");
        const fileKey = `blog-images/${safeImageStem(name)}-${randomSuffix}.${image.extension}`;

        const result = await storagePut(fileKey, image.buffer, image.mimeType);
        results.push({ success: true, url: result.url, key: result.key, filename: name });
      } catch (imgErr) {
        results.push({ error: imgErr instanceof ImageValidationError ? imgErr.message : "Upload failed" });
      }
    }

    res.status(201).json({ success: true, uploaded: results.filter(r => r.success).length, results });
  } catch (err) {
    sendInternalError(res, err, "Batch upload failed");
  }
});

// ─── HELPERS ────────────────────────────────────────────────────────────────
function safeParseJson(val: string | null | undefined, fallback: unknown) {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

function hasPermission(req: AdminRequest, permission: string): boolean {
  return Boolean(req.apiKey?.permissions.includes("*") || req.apiKey?.permissions.includes(permission));
}

function resolveAllowlistedAutomationPath(relativePath: string) {
  const trimmed = relativePath.trim();
  if (!trimmed || path.isAbsolute(trimmed)) {
    throw new Error("Path must be a non-empty relative path");
  }

  const absolutePath = path.resolve(REPO_ROOT, trimmed);
  const repoRootWithSep = REPO_ROOT.endsWith(path.sep) ? REPO_ROOT : `${REPO_ROOT}${path.sep}`;
  if (!absolutePath.startsWith(repoRootWithSep)) {
    throw new Error("Path traversal is not allowed");
  }

  const normalizedRelative = path.relative(REPO_ROOT, absolutePath).split("\\").join("/");
  if (!ALLOWED_AUTOMATION_PATH_PREFIXES.some(prefix => normalizedRelative.startsWith(prefix))) {
    throw new Error(`Path is outside allowlist: ${normalizedRelative}`);
  }

  const ext = path.extname(normalizedRelative).toLowerCase();
  if (!ALLOWED_AUTOMATION_FILE_EXTENSIONS.has(ext)) {
    throw new Error(`File extension '${ext}' is not allowed`);
  }

  return absolutePath;
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function readFileIfExists(filePath: string) {
  try {
    return await readFile(filePath, "utf8");
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "ENOENT") {
      return null;
    }
    throw err;
  }
}

async function writeAutomationAuditLog(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, payload: Record<string, unknown>) {
  const auditKey = `automation_audit_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  await db.insert(siteConfig).values({
    key: auditKey,
    value: JSON.stringify(payload),
    description: "Admin automation audit log",
  });
  return auditKey;
}

export default router;
