import { and, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { blogPosts, companies, exitIntentCaptures, InsertExitIntentCapture, InsertLead, InsertUser, leads, siteConfig, users } from "../drizzle/schema";
import { sanitizeStoredHtml } from "./security/html";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Lead helpers ──────────────────────────────────────────────────────────────

/**
 * Insert a new lead from a form submission.
 * Returns the inserted lead's auto-incremented id.
 */
export async function insertLead(lead: InsertLead): Promise<number | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot insert lead: database not available");
    return null;
  }

  try {
    const result = await db.insert(leads).values(lead);
    return (result as unknown as { insertId: number }[])[0]?.insertId ?? null;
  } catch (error) {
    console.error("[Database] Failed to insert lead:", error);
    throw error;
  }
}

/**
 * Fetch all leads ordered by most recent first.
 */
export async function getLeads(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(leads)
    .orderBy(desc(leads.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Update the status of a lead.
 */
export async function updateLeadStatus(
  id: number,
  status: "new" | "contacted" | "qualified" | "closed_won" | "closed_lost"
) {
  const db = await getDb();
  if (!db) return;

  await db.update(leads).set({ status }).where(eq(leads.id, id));
}

/**
 * Mark a lead as having had the GHL webhook sent successfully.
 */
export async function markLeadGhlSent(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(leads).set({ ghlWebhookSent: 1 }).where(eq(leads.id, id));
}

// ─── Blog post helpers (DB-backed content) ────────────────────────────────────

function safeJson(val: string | null | undefined, fallback: unknown) {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

/**
 * List published blog posts (lightweight — no content body).
 */
export async function getDbBlogPosts(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      metaTitle: blogPosts.metaTitle,
      metaDescription: blogPosts.metaDescription,
      heroImage: blogPosts.heroImage,
      category: blogPosts.category,
      tags: blogPosts.tags,
      excerpt: blogPosts.excerpt,
      readTime: blogPosts.readTime,
      relatedSlugs: blogPosts.relatedSlugs,
      published: blogPosts.published,
      publishedAt: blogPosts.publishedAt,
      updatedAt: blogPosts.updatedAt,
    })
    .from(blogPosts)
    .where(eq(blogPosts.published, 1))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(limit)
    .offset(offset);

  return rows.map(r => ({
    ...r,
    tags: safeJson(r.tags, []),
    relatedSlugs: safeJson(r.relatedSlugs, []),
  }));
}

/**
 * Get a single published blog post by slug (includes full content).
 */
export async function getDbBlogPost(slug: string) {
  const db = await getDb();
  if (!db) return null;

  const [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);

  if (!post || !post.published) return null;

  return {
    ...post,
    content: sanitizeStoredHtml(post.content),
    tags: safeJson(post.tags, []),
    relatedSlugs: safeJson(post.relatedSlugs, []),
    faqItems: safeJson(post.faqItems, []),
  };
}

// ─── Company helpers (DB-backed content) ──────────────────────────────────────

/**
 * List all published companies.
 */
export async function getDbCompanies() {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select()
    .from(companies)
    .where(eq(companies.published, 1))
    .orderBy(companies.name);

  return rows.map(c => ({
    ...c,
    contractTypes: safeJson(c.contractTypes, []),
    customerComplaints: safeJson(c.customerComplaints, []),
    documentedIssues: safeJson(c.documentedIssues, []),
    legalGrounds: safeJson(c.legalGrounds, []),
    lawsuits: safeJson(c.lawsuits, []),
    statesCovered: safeJson(c.statesCovered, []),
    relatedSlugs: safeJson(c.relatedSlugs, []),
  }));
}

/**
 * Get a single published company by slug.
 */
export async function getDbCompany(slug: string) {
  const db = await getDb();
  if (!db) return null;

  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);

  if (!company || !company.published) return null;

  return {
    ...company,
    contractTypes: safeJson(company.contractTypes, []),
    customerComplaints: safeJson(company.customerComplaints, []),
    documentedIssues: safeJson(company.documentedIssues, []),
    legalGrounds: safeJson(company.legalGrounds, []),
    lawsuits: safeJson(company.lawsuits, []),
    statesCovered: safeJson(company.statesCovered, []),
    relatedSlugs: safeJson(company.relatedSlugs, []),
  };
}

/**
 * Fetch site config key/value entries for runtime website configuration.
 */
export async function getSiteConfigValues(keys?: string[]) {
  const db = await getDb();
  if (!db) return {} as Record<string, string>;

  const selectQuery = db
    .select({
      key: siteConfig.key,
      value: siteConfig.value,
    })
    .from(siteConfig);

  const rows =
    keys && keys.length > 0
      ? await selectQuery.where(inArray(siteConfig.key, keys))
      : await selectQuery;

  return rows.reduce<Record<string, string>>((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}

// ─── Exit intent helpers ───────────────────────────────────────────────────────

/**
 * Insert an exit intent email capture.
 */
export async function insertExitIntentCapture(data: InsertExitIntentCapture): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot insert exit intent capture: database not available");
    return;
  }

  try {
    await db.insert(exitIntentCaptures).values(data);
  } catch (error) {
    console.error("[Database] Failed to insert exit intent capture:", error);
    throw error;
  }
}

// ─── Admin blog post helpers ───────────────────────────────────────────────────

/**
 * List ALL blog posts (including drafts) for the admin editor.
 */
export async function getAllBlogPostsAdmin(limit = 200, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      published: blogPosts.published,
      updatedAt: blogPosts.updatedAt,
      publishedAt: blogPosts.publishedAt,
    })
    .from(blogPosts)
    .orderBy(desc(blogPosts.updatedAt))
    .limit(limit)
    .offset(offset);

  return rows;
}

/**
 * Get a single blog post by slug for admin editing (includes drafts).
 */
export async function getAdminBlogPost(slug: string) {
  const db = await getDb();
  if (!db) return null;

  const [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);

  return post ? { ...post, content: sanitizeStoredHtml(post.content) } : null;
}

/**
 * Update a blog post by slug.
 */
export async function updateBlogPost(
  slug: string,
  data: Partial<{
    title: string;
    metaTitle: string;
    metaDescription: string;
    heroImage: string;
    category: string;
    tags: string;
    content: string;
    excerpt: string;
    readTime: string;
    relatedSlugs: string;
    faqItems: string;
    canonicalUrl: string;
    published: number;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const safeData = data.content === undefined
    ? data
    : { ...data, content: sanitizeStoredHtml(data.content) };

  await db
    .update(blogPosts)
    .set({ ...safeData, updatedAt: new Date() })
    .where(eq(blogPosts.slug, slug));

  return { success: true };
}

// ─── Blog Drafts ──────────────────────────────────────────────────────────────

/**
 * Upsert a draft for a post slug + name.
 * If a draft with the same slug+name already exists, update it.
 * Otherwise insert a new row.
 */
export async function upsertBlogDraft(data: {
  postSlug: string;
  name: string;
  title?: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  excerpt?: string;
  heroImage?: string;
  targetKeyword?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { blogDrafts } = await import("../drizzle/schema");
  const safeData = data.content === undefined
    ? data
    : { ...data, content: sanitizeStoredHtml(data.content) };
  const existing = await db
    .select({ id: blogDrafts.id })
    .from(blogDrafts)
    .where(
      and(
        eq(blogDrafts.postSlug, data.postSlug),
        eq(blogDrafts.name, data.name)
      )
    )
    .limit(1);
  if (existing.length > 0) {
    await db
      .update(blogDrafts)
      .set({ ...safeData, updatedAt: new Date() })
      .where(eq(blogDrafts.id, existing[0].id));
    return { id: existing[0].id };
  } else {
    const result = await db.insert(blogDrafts).values({
      ...safeData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { id: (result as any).insertId };
  }
}

/**
 * List all drafts for a post slug (newest first).
 */
export async function listBlogDrafts(postSlug: string) {
  const db = await getDb();
  if (!db) return [];
  const { blogDrafts } = await import("../drizzle/schema");
  return db
    .select()
    .from(blogDrafts)
    .where(eq(blogDrafts.postSlug, postSlug))
    .orderBy(desc(blogDrafts.updatedAt));
}

/**
 * Get a single draft by id.
 */
export async function getBlogDraft(id: number) {
  const db = await getDb();
  if (!db) return null;
  const { blogDrafts } = await import("../drizzle/schema");
  const rows = await db.select().from(blogDrafts).where(eq(blogDrafts.id, id)).limit(1);
  return rows[0] ?? null;
}

/**
 * Delete a draft by id.
 */
export async function deleteBlogDraft(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { blogDrafts } = await import("../drizzle/schema");
  await db.delete(blogDrafts).where(eq(blogDrafts.id, id));
  return { success: true };
}

// ─── Automation Helpers ────────────────────────────────────────────────────────

export async function listAutomations() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { automations } = await import("../drizzle/schema");
  return db.select().from(automations).orderBy(automations.createdAt);
}

export async function getAutomation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { automations } = await import("../drizzle/schema");
  const rows = await db.select().from(automations).where(eq(automations.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createAutomation(data: {
  name: string;
  description?: string;
  spec: string;
  cronExpression: string;
  cronLabel?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { automations } = await import("../drizzle/schema");
  const result = await db.insert(automations).values({
    name: data.name,
    description: data.description ?? null,
    spec: data.spec,
    cronExpression: data.cronExpression,
    cronLabel: data.cronLabel ?? null,
    isEnabled: 1,
    runCount: 0,
  });
  const id = (result as any).insertId as number;
  return getAutomation(id);
}

export async function updateAutomation(id: number, data: Partial<{
  name: string;
  description: string;
  spec: string;
  cronExpression: string;
  cronLabel: string;
  isEnabled: number;
  scheduleCronTaskUid: string;
  lastRunAt: Date;
  lastRunStatus: string;
  lastRunSummary: string;
  runCount: number;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { automations } = await import("../drizzle/schema");
  await db.update(automations).set(data).where(eq(automations.id, id));
  return getAutomation(id);
}

export async function deleteAutomation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { automations } = await import("../drizzle/schema");
  await db.delete(automations).where(eq(automations.id, id));
  return { success: true };
}

// ─── Automation Run Log Helpers ────────────────────────────────────────────────

export async function createAutomationRun(data: {
  automationId: number;
  status: string;
  summary?: string;
  details?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { automationRuns } = await import("../drizzle/schema");
  const result = await db.insert(automationRuns).values({
    automationId: data.automationId,
    status: data.status,
    summary: data.summary ?? null,
    details: data.details ?? null,
  });
  const id = (result as any).insertId as number;
  const rows = await db.select().from(automationRuns).where(eq(automationRuns.id, id)).limit(1);
  return rows[0];
}

export async function updateAutomationRun(id: number, data: Partial<{
  status: string;
  summary: string;
  details: string;
  completedAt: Date;
  durationMs: number;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { automationRuns } = await import("../drizzle/schema");
  await db.update(automationRuns).set(data).where(eq(automationRuns.id, id));
}

export async function listAutomationRuns(automationId: number, limit = 20) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { automationRuns } = await import("../drizzle/schema");
  return db.select().from(automationRuns)
    .where(eq(automationRuns.automationId, automationId))
    .orderBy(automationRuns.startedAt)
    .limit(limit);
}
