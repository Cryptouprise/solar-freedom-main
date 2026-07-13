import { and, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { blogPosts, companies, exitIntentCaptures, InsertBlogPost, InsertExitIntentCapture, InsertLead, InsertUser, leads, siteConfig, users } from "../drizzle/schema";
import {
  type BlogEditorialReviewFields,
  getBlogEditorialReviewIssues,
} from "../shared/blogEditorialReview";
import {
  hasUnsupportedFirstPartyClaims,
  isBlogPostPublishable,
} from "../client/src/data/publication-governance";
import { sanitizeStoredHtml } from "./security/html";
import { ENV } from './_core/env';
import { logSafeError } from "./_core/safeLog";
import { normalizeLeadSourceUrl } from "./security/leadSourceUrl";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      logSafeError("database.connect_failed", error);
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
    logSafeError("database.user_upsert_failed", error);
    throw new Error("Database operation failed");
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
    const result = await db.insert(leads).values({
      ...lead,
      sourceUrl: normalizeLeadSourceUrl(lead.sourceUrl),
    });
    return (result as unknown as { insertId: number }[])[0]?.insertId ?? null;
  } catch (error) {
    logSafeError("database.lead_insert_failed", error);
    throw new Error("Database operation failed");
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

export class BlogEditorialReviewError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super("Published blog posts require a complete evidence-first editorial review");
    this.name = "BlogEditorialReviewError";
    this.issues = [...issues];
  }
}

/**
 * The final server-side publication boundary. Every database write that can
 * leave a post published must pass through this assertion.
 */
export function assertPublishableBlogPostReview(
  value: BlogEditorialReviewFields & { published?: unknown },
  now = new Date(),
) {
  if (value.published !== 1) return;
  const issues = getBlogEditorialReviewIssues(value, now);
  if (hasUnsupportedFirstPartyClaims(value)) {
    issues.push("unsupported_first_party_claims");
  }
  if (issues.length > 0) throw new BlogEditorialReviewError(issues);
}

/**
 * Apply the public evidence and unsupported-claim boundary before pagination.
 * The input must contain full stored rows rather than lightweight card fields.
 */
export function filterPublishableBlogPostPage<T>(
  rows: readonly T[],
  limit = 50,
  offset = 0,
): T[] {
  const safeLimit = Math.max(0, Math.trunc(limit));
  const safeOffset = Math.max(0, Math.trunc(offset));
  return rows
    .filter(isBlogPostPublishable)
    .slice(safeOffset, safeOffset + safeLimit);
}

/**
 * List public, evidence-approved blog posts as lightweight cards. Filtering is
 * performed against full stored rows because unsafe copy can live outside the
 * card fields. Only approved card fields cross the public API.
 */
export async function getDbBlogPosts(limit = 50, offset = 0) {
  const rows = await getDbBlogPostsForPublication(5000, 0);

  return filterPublishableBlogPostPage(rows, limit, offset).map(row => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    heroImage: row.heroImage,
    category: row.category,
    tags: row.tags,
    excerpt: row.excerpt,
    readTime: row.readTime,
    relatedSlugs: row.relatedSlugs,
    editorialReviewerName: row.editorialReviewerName,
    editorialReviewerRole: row.editorialReviewerRole,
    editorialReviewedAt: row.editorialReviewedAt,
    editorialPrimarySources: row.editorialPrimarySources,
    editorialUniqueValueSummary: row.editorialUniqueValueSummary,
    editorialFunnelOnlyDuplicate: row.editorialFunnelOnlyDuplicate,
    published: row.published,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
  }));
}

/**
 * Internal-only published-post inventory including every public copy surface.
 * SEO publication gates must inspect the body, FAQs, and media copy rather than
 * deciding from the lightweight card fields returned by getDbBlogPosts().
 */
export async function getDbBlogPostsForPublication(limit = 5000, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.published, 1))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(limit)
    .offset(offset);

  return rows.map(row => ({
    ...row,
    tags: safeJson(row.tags, []),
    relatedSlugs: safeJson(row.relatedSlugs, []),
    faqItems: safeJson(row.faqItems, []),
    galleryImages: safeJson(row.galleryImages, []),
    editorialPrimarySources: safeJson(row.editorialPrimarySources, []),
  }));
}

/**
 * Get a single published blog post by slug (includes full content).
 */
export async function getDbBlogPostStatus(slug: string) {
  const db = await getDb();
  if (!db) return { available: false as const, post: null };

  const [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);

  if (!post || !post.published) return { available: true as const, post: null };

  return { available: true as const, post: {
    ...post,
    content: sanitizeStoredHtml(post.content),
    tags: safeJson(post.tags, []),
    relatedSlugs: safeJson(post.relatedSlugs, []),
    faqItems: safeJson(post.faqItems, []),
    editorialPrimarySources: safeJson(post.editorialPrimarySources, []),
  } };
}

export async function getDbBlogPost(slug: string) {
  const post = (await getDbBlogPostStatus(slug)).post;
  return post && isBlogPostPublishable(post) ? post : null;
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
export async function insertExitIntentCapture(data: InsertExitIntentCapture): Promise<number | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot insert exit intent capture: database not available");
    return null;
  }

  try {
    const result = await db.insert(exitIntentCaptures).values(data);
    return (result as unknown as { insertId: number }[])[0]?.insertId ?? null;
  } catch (error) {
    logSafeError("database.exit_intent_insert_failed", error);
    throw new Error("Database operation failed");
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
    .select()
    .from(blogPosts)
    .orderBy(desc(blogPosts.updatedAt))
    .limit(limit)
    .offset(offset);

  return rows.map(row => {
    const normalized = {
      ...row,
      content: sanitizeStoredHtml(row.content),
      tags: safeJson(row.tags, []),
      relatedSlugs: safeJson(row.relatedSlugs, []),
      faqItems: safeJson(row.faqItems, []),
      galleryImages: safeJson(row.galleryImages, []),
      editorialPrimarySources: safeJson(row.editorialPrimarySources, []),
    };
    return {
      id: normalized.id,
      slug: normalized.slug,
      title: normalized.title,
      metaTitle: normalized.metaTitle,
      metaDescription: normalized.metaDescription,
      heroImage: normalized.heroImage,
      category: normalized.category,
      tags: normalized.tags,
      excerpt: normalized.excerpt,
      readTime: normalized.readTime,
      relatedSlugs: normalized.relatedSlugs,
      published: normalized.published,
      editorialReviewerName: normalized.editorialReviewerName,
      editorialReviewerRole: normalized.editorialReviewerRole,
      editorialReviewedAt: normalized.editorialReviewedAt,
      editorialPrimarySources: normalized.editorialPrimarySources,
      editorialUniqueValueSummary: normalized.editorialUniqueValueSummary,
      editorialFunnelOnlyDuplicate: normalized.editorialFunnelOnlyDuplicate,
      updatedAt: normalized.updatedAt,
      publishedAt: normalized.publishedAt,
      publiclyEligible: normalized.published === 1 && isBlogPostPublishable(normalized),
    };
  });
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

  return post ? {
    ...post,
    content: sanitizeStoredHtml(post.content),
    tags: safeJson(post.tags, []),
    relatedSlugs: safeJson(post.relatedSlugs, []),
    faqItems: safeJson(post.faqItems, []),
    galleryImages: safeJson(post.galleryImages, []),
    editorialPrimarySources: safeJson(post.editorialPrimarySources, []),
  } : null;
}

/**
 * Create a database-backed blog post. New rows default to draft even though the
 * legacy schema default is published; publication is always explicit.
 */
export async function createBlogPost(data: InsertBlogPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const values: InsertBlogPost = {
    ...data,
    content: sanitizeStoredHtml(data.content),
    published: data.published ?? 0,
  };
  if (values.published === 1 && values.publishedAt === undefined) {
    values.publishedAt = new Date();
  }
  assertPublishableBlogPostReview(values);
  await db.insert(blogPosts).values(values);
  return { success: true };
}

/**
 * Update a blog post by slug. The current row is merged before validation so a
 * partial update cannot bypass the review gate or accidentally publish legacy
 * content without evidence.
 */
export async function updateBlogPost(
  slug: string,
  data: Partial<InsertBlogPost>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [existing] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);
  if (!existing) throw new Error("Blog post not found");

  const merged = { ...existing, ...data };
  assertPublishableBlogPostReview(merged);

  const safeData = data.content === undefined
    ? data
    : { ...data, content: sanitizeStoredHtml(data.content) };

  const publishTimestamp = data.published === 1
    && existing.published !== 1
    && data.publishedAt === undefined
      ? { publishedAt: new Date() }
      : {};

  await db
    .update(blogPosts)
    .set({ ...safeData, ...publishTimestamp, updatedAt: new Date() })
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
