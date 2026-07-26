import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, tinyint, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Leads table — stores every form submission from the website.
 * Data is also forwarded to GHL via webhook, but this table provides
 * a persistent, queryable backup and analytics source.
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),

  // Contact info
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),

  // Solar contract details
  solarCompany: varchar("solarCompany", { length: 100 }),
  problemType: varchar("problemType", { length: 200 }),
  contractType: varchar("contractType", { length: 100 }),
  monthlyPayment: varchar("monthlyPayment", { length: 50 }),
  intent: varchar("intent", { length: 100 }),

  // Lead metadata
  formName: varchar("formName", { length: 100 }),
  sourcePage: varchar("sourcePage", { length: 255 }),
  sourceUrl: text("sourceUrl"),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "closed_won", "closed_lost"])
    .default("new")
    .notNull(),

  // GHL sync
  ghlWebhookSent: int("ghlWebhookSent").default(0).notNull(), // 0=no, 1=yes

  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Exit intent captures — email-only captures from the exit popup
 */
export const exitIntentCaptures = mysqlTable("exitIntentCaptures", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  sourcePage: varchar("sourcePage", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExitIntentCapture = typeof exitIntentCaptures.$inferSelect;
export type InsertExitIntentCapture = typeof exitIntentCaptures.$inferInsert;

/**
 * SEO Strategy table — documents every SEO tactic, decision, and action taken.
 * This is the master playbook record. Every change to the site's SEO should
 * be logged here so the strategy can be fully duplicated on any future site.
 *
 * Categories: technical_seo, content, schema, link_building, indexing, analytics, tooling
 * Status: planned, in_progress, completed, skipped
 * Impact: high, medium, low
 */
export const seoStrategy = mysqlTable("seoStrategy", {
  id: int("id").autoincrement().primaryKey(),

  // What was done
  category: mysqlEnum("category", [
    "technical_seo",
    "content",
    "schema",
    "link_building",
    "indexing",
    "analytics",
    "tooling",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(), // Full explanation of what was done and why
  implementation: text("implementation"),     // Exact steps taken — code changes, tools used, commands run
  result: text("result"),                     // What happened after — GSC data, impressions, clicks, etc.
  duplicationNotes: text("duplicationNotes"), // How to replicate this on a new site

  // Metadata
  status: mysqlEnum("status", ["planned", "in_progress", "completed", "skipped"])
    .default("planned")
    .notNull(),
  impact: mysqlEnum("impact", ["high", "medium", "low"]).default("medium").notNull(),
  pagesAffected: int("pagesAffected").default(0), // How many pages this change touched
  completedAt: timestamp("completedAt"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SeoStrategy = typeof seoStrategy.$inferSelect;
export type InsertSeoStrategy = typeof seoStrategy.$inferInsert;

/**
 * SEO Pages table — inventory of every page on the site with its SEO status.
 * Tracks indexing status, canonical, schema coverage, internal links, and GSC data.
 * This is the single source of truth for what's on the site and how it's performing.
 *
 * pageType: homepage, city, state_law, company, blog, service, report
 * indexStatus: indexed, not_indexed, excluded, unknown
 */
export const seoPages = mysqlTable("seoPages", {
  id: int("id").autoincrement().primaryKey(),

  // Page identity
  url: varchar("url", { length: 500 }).notNull().unique(), // Full canonical URL
  slug: varchar("slug", { length: 255 }).notNull(),
  pageType: mysqlEnum("pageType", [
    "homepage",
    "city",
    "state_law",
    "company",
    "blog",
    "service",
    "report",
    "other",
  ]).notNull(),
  title: varchar("title", { length: 255 }),
  metaDescription: text("metaDescription"),

  // SEO coverage flags
  hasCanonical: int("hasCanonical").default(0).notNull(),    // 1=yes
  hasSchema: int("hasSchema").default(0).notNull(),          // 1=yes
  schemaTypes: varchar("schemaTypes", { length: 500 }),      // comma-separated: "LegalService,FAQPage,BreadcrumbList"
  inSitemap: int("inSitemap").default(0).notNull(),          // 1=yes
  inImageSitemap: int("inImageSitemap").default(0).notNull(),// 1=yes
  hasInternalLinksOut: int("hasInternalLinksOut").default(0).notNull(), // links to other pages
  hasInternalLinksIn: int("hasInternalLinksIn").default(0).notNull(),   // other pages link to it

  // GSC data (updated manually or via future API sync)
  gscIndexStatus: mysqlEnum("gscIndexStatus", ["indexed", "not_indexed", "excluded", "unknown"])
    .default("unknown")
    .notNull(),
  gscClicks: int("gscClicks").default(0),
  gscImpressions: int("gscImpressions").default(0),
  gscAvgPosition: varchar("gscAvgPosition", { length: 10 }),
  gscLastChecked: timestamp("gscLastChecked"),

  // Canonicalization
  canonicalUrl: varchar("canonicalUrl", { length: 500 }), // null = self-canonical
  isDuplicate: int("isDuplicate").default(0).notNull(),   // 1 = this page canonicalizes to another
  duplicateOf: varchar("duplicateOf", { length: 500 }),   // URL of the canonical version

  // Notes
  notes: text("notes"), // Any manual observations, issues, or action items

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SeoPage = typeof seoPages.$inferSelect;
export type InsertSeoPage = typeof seoPages.$inferInsert;

/**
 * Blog posts table — dynamic content managed via Admin API.
 * Replaces static TypeScript data files for AI-editable content.
 */
export const blogPosts = mysqlTable("blogPosts", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 500 }).notNull(),
  metaTitle: varchar("metaTitle", { length: 500 }),
  metaDescription: text("metaDescription"),
  heroImage: text("heroImage"),           // CDN URL
  category: varchar("category", { length: 100 }),
  tags: text("tags"),                     // JSON array of strings
  content: text("content").notNull(),     // Full HTML/markdown body
  excerpt: text("excerpt"),               // Short summary for cards
  readTime: varchar("readTime", { length: 20 }),
  relatedSlugs: text("relatedSlugs"),     // JSON array of slugs
  faqItems: text("faqItems"),             // JSON array of {q, a} objects
  canonicalUrl: varchar("canonicalUrl", { length: 500 }),
  // Podcast fields
  podcastAudioUrl: text("podcastAudioUrl"),       // S3 or external URL to MP3/audio
  podcastTitle: varchar("podcastTitle", { length: 500 }),
  podcastDescription: text("podcastDescription"),
  podcastTranscript: text("podcastTranscript"),   // Full transcript text
  podcastDuration: varchar("podcastDuration", { length: 20 }), // e.g. "12:34"
  podcastEmbedUrl: text("podcastEmbedUrl"),       // NotebookLM or Spotify embed URL
  // Video/Vlog fields
  videoUrl: text("videoUrl"),                     // YouTube/Vimeo URL or S3 video URL
  videoTitle: varchar("videoTitle", { length: 500 }),
  videoDescription: text("videoDescription"),
  videoThumbnail: text("videoThumbnail"),         // Thumbnail image URL
  videoDuration: varchar("videoDuration", { length: 20 }),
  // Additional media
  galleryImages: text("galleryImages"),           // JSON array of {url, alt, caption}
  targetKeyword: varchar("targetKeyword", { length: 255 }), // Primary SEO keyword
  seoScore: int("seoScore"),                      // 0-100 SEO score from last analysis
  published: int("published").default(1).notNull(), // 1=live, 0=draft
  publishedAt: timestamp("publishedAt").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

/**
 * Companies table — dynamic company data managed via Admin API.
 * Replaces static companies.ts data file.
 */
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  legalName: varchar("legalName", { length: 200 }),
  status: mysqlEnum("status", ["active", "bankrupt", "acquired", "dissolved"]).default("active").notNull(),
  bbbRating: varchar("bbbRating", { length: 10 }),
  complaintCount: varchar("complaintCount", { length: 50 }),
  avgMonthlyPayment: varchar("avgMonthlyPayment", { length: 50 }),
  avgContractLength: varchar("avgContractLength", { length: 50 }),
  founded: varchar("founded", { length: 10 }),
  headquarters: varchar("headquarters", { length: 200 }),
  contractTypes: text("contractTypes"),   // JSON array
  heroHeadline: varchar("heroHeadline", { length: 500 }),
  heroSubheadline: varchar("heroSubheadline", { length: 500 }),
  problemSummary: text("problemSummary"),
  customerComplaints: text("customerComplaints"), // JSON array of strings
  documentedIssues: text("documentedIssues"),     // JSON array of strings
  legalGrounds: text("legalGrounds"),             // JSON array of strings
  lawsuits: text("lawsuits"),                     // JSON array of strings
  statesCovered: text("statesCovered"),           // JSON array of state codes
  relatedSlugs: text("relatedSlugs"),             // JSON array of blog slugs
  published: int("published").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

/**
 * Site config table — key/value store for dynamic site settings.
 * Allows AI to update CTAs, phone numbers, nav links, etc.
 */
export const siteConfig = mysqlTable("siteConfig", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: varchar("description", { length: 500 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteConfig = typeof siteConfig.$inferSelect;
export type InsertSiteConfig = typeof siteConfig.$inferInsert;

/**
 * API keys table — for external AI tools (Claude, etc.) to authenticate
 * with the Admin API without using Manus OAuth.
 */
export const apiKeys = mysqlTable("apiKeys", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),   // e.g. "Claude Desktop", "Cursor"
  keyHash: varchar("keyHash", { length: 255 }).notNull().unique(), // bcrypt hash of the key
  keyPrefix: varchar("keyPrefix", { length: 10 }).notNull(), // first 8 chars for display
  permissions: text("permissions").notNull(),         // JSON array: ["posts:read","posts:write","companies:write",...]
  lastUsedAt: timestamp("lastUsedAt"),
  active: int("active").default(1).notNull(),         // 1=active, 0=revoked
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * Site events table — lightweight analytics for page views, CTA clicks, form submissions, etc.
 * Lets the admin dashboard show engagement without a third-party analytics dependency.
 */
export const siteEvents = mysqlTable("siteEvents", {
  id: int("id").autoincrement().primaryKey(),
  eventType: varchar("eventType", { length: 100 }).notNull(), // 'page_view' | 'cta_click' | 'form_submit' | 'phone_click' | 'scroll_depth'
  pagePath: varchar("pagePath", { length: 500 }).notNull(),
  formName: varchar("formName", { length: 200 }),             // populated for form_submit events
  ctaLabel: varchar("ctaLabel", { length: 200 }),             // populated for cta_click events
  scrollDepth: int("scrollDepth"),                            // percentage (25/50/75/100) for scroll_depth
  sessionId: varchar("sessionId", { length: 64 }),            // anonymous session identifier
  referrer: varchar("referrer", { length: 500 }),
  userAgent: varchar("userAgent", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SiteEvent = typeof siteEvents.$inferSelect;
export type InsertSiteEvent = typeof siteEvents.$inferInsert;

/**
 * Press release topics queue — each row is a topic waiting to be written and distributed.
 * Topics are pulled in order of sortOrder (ascending), lowest first.
 * Once published, status moves to 'published' and the row stays for history.
 *
 * status: pending → running → published | failed
 */
export const pressReleaseTopics = mysqlTable("pressReleaseTopics", {
  id: int("id").autoincrement().primaryKey(),

  // What to write about
  title: varchar("title", { length: 500 }).notNull(),          // Working title / angle
  angle: text("angle"),                                         // Extra context / talking points for the AI
  targetKeywords: varchar("targetKeywords", { length: 500 }),   // Comma-separated SEO keywords to weave in
  targetUrl: varchar("targetUrl", { length: 500 }),             // Page on site to link back to

  // Queue management
  sortOrder: int("sortOrder").default(0).notNull(),             // Lower = runs first
  status: mysqlEnum("status", ["pending", "running", "published", "failed"])
    .default("pending")
    .notNull(),

  // Scheduling
  scheduledFor: timestamp("scheduledFor"),                      // null = run at next cron tick

  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PressReleaseTopic = typeof pressReleaseTopics.$inferSelect;
export type InsertPressReleaseTopic = typeof pressReleaseTopics.$inferInsert;

/**
 * Press release log — one row per distribution attempt.
 * Records the generated content, which site it was submitted to, and the result.
 *
 * site: prlog | newsbywire | openpr | 1888pressrelease | einpresswire | pressranger
 * status: success | failed | skipped
 */
export const pressReleaseLogs = mysqlTable("pressReleaseLogs", {
  id: int("id").autoincrement().primaryKey(),

  // Link back to the topic
  topicId: int("topicId").notNull(),

  // Generated content
  headline: varchar("headline", { length: 500 }).notNull(),
  body: text("body").notNull(),                                  // Full press release text (plain text)
  boilerplate: text("boilerplate"),                             // About section appended at end
  modelUsed: varchar("modelUsed", { length: 100 }),             // e.g. "qwen/qwen-3-8b"
  tokensUsed: int("tokensUsed"),

  // Distribution
  site: varchar("site", { length: 100 }).notNull(),             // e.g. "prlog"
  siteLabel: varchar("siteLabel", { length: 200 }),             // Human-readable: "PRLog.com"
  submittedAt: timestamp("submittedAt"),
  publishedUrl: varchar("publishedUrl", { length: 1000 }),       // URL of the live press release

  // Result
  status: mysqlEnum("status", ["success", "failed", "skipped"])
    .default("failed")
    .notNull(),
  errorMessage: text("errorMessage"),                           // If failed, what went wrong

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PressReleaseLog = typeof pressReleaseLogs.$inferSelect;
export type InsertPressReleaseLog = typeof pressReleaseLogs.$inferInsert;

/**
 * Press release settings — key/value config for the automation system.
 * Keys: model, schedule_enabled, schedule_cron, boilerplate, sites_enabled
 */
export const pressReleaseSettings = mysqlTable("pressReleaseSettings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PressReleaseSetting = typeof pressReleaseSettings.$inferSelect;
export type InsertPressReleaseSetting = typeof pressReleaseSettings.$inferInsert;

/**
 * Backlink targets — the master list of sites we actively submit to or pursue.
 * Each row is one external site. Tracks submission history and link status.
 *
 * type: press_release | directory | guest_post | resource_page | forum | social
 * status: active | inactive | banned
 */
export const backlinkTargets = mysqlTable("backlinkTargets", {
  id: int("id").autoincrement().primaryKey(),

  // Site info
  name: varchar("name", { length: 200 }).notNull(),
  url: varchar("url", { length: 500 }).notNull().unique(),
  submitUrl: varchar("submitUrl", { length: 500 }),
  type: mysqlEnum("type", [
    "press_release",
    "directory",
    "guest_post",
    "resource_page",
    "forum",
    "social",
    "other",
  ]).notNull(),

  // Quality metrics
  domainAuthority: int("domainAuthority"),
  domainRating: int("domainRating"),
  estimatedTraffic: int("estimatedTraffic"),
  doFollow: int("doFollow").default(1).notNull(),
  requiresAccount: int("requiresAccount").default(0),
  requiresPayment: int("requiresPayment").default(0),
  submissionMethod: mysqlEnum("submissionMethod", ["http_api", "playwright", "manual"])
    .default("playwright")
    .notNull(),

  // Account credentials
  accountEmail: varchar("accountEmail", { length: 320 }),
  accountPassword: varchar("accountPassword", { length: 500 }),
  accountUsername: varchar("accountUsername", { length: 200 }),
  accountNotes: text("accountNotes"),

  // Submission tracking
  lastSubmittedAt: timestamp("lastSubmittedAt"),
  lastPublishedUrl: varchar("lastPublishedUrl", { length: 1000 }),
  totalSubmissions: int("totalSubmissions").default(0).notNull(),
  successfulSubmissions: int("successfulSubmissions").default(0).notNull(),

  // Status
  status: mysqlEnum("status", ["active", "inactive", "banned"])
    .default("active")
    .notNull(),
  notes: text("notes"),
  priority: int("priority").default(50).notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BacklinkTarget = typeof backlinkTargets.$inferSelect;
export type InsertBacklinkTarget = typeof backlinkTargets.$inferInsert;

/**
 * Backlink opportunities — discovered sites not yet submitted to.
 * Populated by the backlink discovery cron. Admin reviews and promotes or discards.
 */
export const backlinkOpportunities = mysqlTable("backlinkOpportunities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }),
  url: varchar("url", { length: 500 }).notNull().unique(),
  type: mysqlEnum("type", [
    "press_release",
    "directory",
    "guest_post",
    "resource_page",
    "forum",
    "social",
    "other",
  ]).notNull(),
  discoveredVia: varchar("discoveredVia", { length: 200 }),
  relevanceScore: int("relevanceScore"),
  relevanceReason: text("relevanceReason"),
  domainAuthority: int("domainAuthority"),
  doFollow: int("doFollow").default(1),
  status: mysqlEnum("status", ["new", "approved", "rejected", "promoted"])
    .default("new")
    .notNull(),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BacklinkOpportunity = typeof backlinkOpportunities.$inferSelect;
export type InsertBacklinkOpportunity = typeof backlinkOpportunities.$inferInsert;

/**
 * AI Cost Log — tracks every LLM, image generation, and embedding call.
 * Used to build the cost dashboard in the admin panel.
 */
export const aiCostLog = mysqlTable("aiCostLog", {
  id: int("id").autoincrement().primaryKey(),
  feature: varchar("feature", { length: 100 }).notNull(), // e.g. 'press_release', 'blog', 'embedding'
  callType: mysqlEnum("callType", ["text", "image", "embedding"]).notNull(),
  model: varchar("model", { length: 200 }).notNull(),
  tokensIn: int("tokensIn").default(0),
  tokensOut: int("tokensOut").default(0),
  imageCount: int("imageCount").default(0),
  costUsd: decimal("costUsd", { precision: 10, scale: 6 }).notNull().default("0"),
  referenceId: int("referenceId"),   // optional FK to press_release_logs.id or blog post id
  referenceType: varchar("referenceType", { length: 50 }), // 'press_release', 'blog', etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiCostLog = typeof aiCostLog.$inferSelect;
export type InsertAiCostLog = typeof aiCostLog.$inferInsert;

/**
 * Blog Drafts — named draft versions per blog post.
 * Supports autosave (name="autosave") and manual named drafts.
 */
export const blogDrafts = mysqlTable("blogDrafts", {
  id: int("id").autoincrement().primaryKey(),
  postSlug: varchar("postSlug", { length: 300 }).notNull(),
  name: varchar("name", { length: 200 }).notNull().default("autosave"),
  title: varchar("title", { length: 500 }),
  content: text("content"),
  metaTitle: varchar("metaTitle", { length: 300 }),
  metaDescription: text("metaDescription"),
  excerpt: text("excerpt"),
  heroImage: varchar("heroImage", { length: 1000 }),
  targetKeyword: varchar("targetKeyword", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BlogDraft = typeof blogDrafts.$inferSelect;
export type InsertBlogDraft = typeof blogDrafts.$inferInsert;

/**
 * Automations — user-defined automation specs with schedules.
 * Each row is one automation job. The schedule is managed via the Heartbeat
 * platform cron system; scheduleCronTaskUid links to the platform cron.
 */
export const automations = mysqlTable("automations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  spec: text("spec").notNull(),                           // the full automation spec / prompt
  cronExpression: varchar("cronExpression", { length: 100 }).notNull(), // 6-field UTC cron
  cronLabel: varchar("cronLabel", { length: 100 }),       // human-readable e.g. "Daily at 9 AM UTC"
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }), // platform cron task uid
  isEnabled: tinyint("isEnabled").default(1).notNull(),
  lastRunAt: timestamp("lastRunAt"),
  lastRunStatus: varchar("lastRunStatus", { length: 50 }), // 'blocked' | 'error' | 'running'; success requires a future typed runner
  lastRunSummary: text("lastRunSummary"),
  runCount: int("runCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Automation = typeof automations.$inferSelect;
export type InsertAutomation = typeof automations.$inferInsert;

/**
 * Automation run logs — history of each execution.
 */
export const automationRuns = mysqlTable("automationRuns", {
  id: int("id").autoincrement().primaryKey(),
  automationId: int("automationId").notNull(),
  status: varchar("status", { length: 50 }).notNull(),    // 'blocked' | 'error' | 'running'; success requires evidence from a typed runner
  summary: text("summary"),
  details: text("details"),                               // full output / error trace
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  durationMs: int("durationMs"),
});
export type AutomationRun = typeof automationRuns.$inferSelect;
export type InsertAutomationRun = typeof automationRuns.$inferInsert;

/**
 * Law Firms table — partner firms that purchase leads from this platform.
 * Each firm has a geographic coverage, pricing tier, and webhook endpoint
 * for real-time lead delivery.
 */
export const lawFirms = mysqlTable("lawFirms", {
  id: int("id").autoincrement().primaryKey(),

  // Firm identity
  name: varchar("name", { length: 200 }).notNull(),
  contactName: varchar("contactName", { length: 200 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  website: varchar("website", { length: 500 }),

  // Geographic coverage
  // JSON array of 2-letter state codes, e.g. ["CA","TX","FL"]. Empty = all states.
  coveredStates: text("coveredStates"),
  // JSON array of city slugs for city-level exclusivity, e.g. ["dallas-tx","houston-tx"]
  coveredCities: text("coveredCities"),
  exclusiveStates: text("exclusiveStates"),  // States where this firm has exclusivity

  // Pricing
  pricePerLead: decimal("pricePerLead", { precision: 8, scale: 2 }).notNull().default("0"),
  billingCycle: mysqlEnum("billingCycle", ["per_lead", "weekly", "monthly"]).default("per_lead").notNull(),

  // Lead delivery
  webhookUrl: varchar("webhookUrl", { length: 1000 }),  // POST endpoint for real-time delivery
  webhookSecret: varchar("webhookSecret", { length: 255 }), // HMAC signing secret
  emailDelivery: int("emailDelivery").default(1).notNull(), // 1=also email leads

  // Quality filters — only send leads matching these criteria
  minLeadScore: int("minLeadScore").default(0),          // 0-10 minimum quality score
  // JSON array of solar companies to include, empty = all
  filterCompanies: text("filterCompanies"),
  // JSON array of problem types to include, empty = all
  filterProblemTypes: text("filterProblemTypes"),

  // Capacity
  maxLeadsPerDay: int("maxLeadsPerDay"),   // null = unlimited
  maxLeadsPerMonth: int("maxLeadsPerMonth"),

  // Status
  status: mysqlEnum("status", ["active", "paused", "inactive"]).default("active").notNull(),
  notes: text("notes"),

  // Stats (denormalized for fast dashboard queries)
  totalLeadsDelivered: int("totalLeadsDelivered").default(0).notNull(),
  totalLeadsAccepted: int("totalLeadsAccepted").default(0).notNull(),
  totalLeadsRejected: int("totalLeadsRejected").default(0).notNull(),
  totalRevenue: decimal("totalRevenue", { precision: 10, scale: 2 }).default("0").notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LawFirm = typeof lawFirms.$inferSelect;
export type InsertLawFirm = typeof lawFirms.$inferInsert;

/**
 * Lead Deliveries — one row per lead-to-firm delivery attempt.
 * Tracks whether the webhook succeeded, whether the firm accepted the lead,
 * and billing status.
 */
export const leadDeliveries = mysqlTable("leadDeliveries", {
  id: int("id").autoincrement().primaryKey(),

  // Relations
  leadId: int("leadId").notNull(),         // FK → leads.id
  firmId: int("firmId").notNull(),          // FK → lawFirms.id

  // Lead quality at time of delivery
  leadScore: int("leadScore").default(0).notNull(),  // 0-10 computed quality score
  scoreBreakdown: text("scoreBreakdown"),             // JSON: {payment: 3, company: 2, issue: 3, intent: 2}

  // Delivery
  deliveryMethod: mysqlEnum("deliveryMethod", ["webhook", "email", "manual"]).default("webhook").notNull(),
  webhookStatusCode: int("webhookStatusCode"),        // HTTP response code from firm's endpoint
  webhookResponse: text("webhookResponse"),           // Raw response body
  deliveredAt: timestamp("deliveredAt"),

  // Acceptance
  accepted: mysqlEnum("accepted", ["pending", "accepted", "rejected", "duplicate"])
    .default("pending")
    .notNull(),
  rejectionReason: varchar("rejectionReason", { length: 500 }),
  acceptedAt: timestamp("acceptedAt"),

  // Billing
  charged: int("charged").default(0).notNull(),       // 1 = billed to firm
  chargeAmount: decimal("chargeAmount", { precision: 8, scale: 2 }),
  chargedAt: timestamp("chargedAt"),
  invoiceRef: varchar("invoiceRef", { length: 200 }),  // External invoice/Stripe ID

  // Status
  status: mysqlEnum("status", ["pending", "delivered", "failed", "retrying"])
    .default("pending")
    .notNull(),
  retryCount: int("retryCount").default(0).notNull(),
  lastError: text("lastError"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeadDelivery = typeof leadDeliveries.$inferSelect;
export type InsertLeadDelivery = typeof leadDeliveries.$inferInsert;


// ═══════════════════════════════════════════════════════════════════════════════
// AGENT ECOSYSTEM — 5-Agent Intelligence System
// Money-Making | SEO Intelligence | Content | Editor | Manager
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Agent Registry — defines each agent's identity, status, and configuration.
 * The 5 agents: money_maker, seo_intel, content, editor, manager
 */
export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(), // money_maker, seo_intel, content, editor, manager
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  role: text("role").notNull(), // System prompt / role definition
  status: mysqlEnum("status", ["active", "paused", "error", "idle"]).default("idle").notNull(),
  lastRunAt: timestamp("lastRunAt"),
  lastRunDurationMs: int("lastRunDurationMs"),
  lastRunSummary: text("lastRunSummary"),
  totalRuns: int("totalRuns").default(0).notNull(),
  totalCostUsd: decimal("totalCostUsd", { precision: 10, scale: 4 }).default("0").notNull(),
  config: text("config"), // JSON: model preferences, temperature, max_tokens, etc.
  cronExpression: varchar("cronExpression", { length: 100 }), // When this agent auto-runs
  isEnabled: tinyint("isEnabled").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

/**
 * Agent Messages — inter-agent communication bus.
 * Agents send directives, reports, and approvals to each other.
 * The Manager agent reviews and approves/rejects actions before execution.
 */
export const agentMessages = mysqlTable("agentMessages", {
  id: int("id").autoincrement().primaryKey(),
  fromAgent: varchar("fromAgent", { length: 50 }).notNull(), // agent slug
  toAgent: varchar("toAgent", { length: 50 }).notNull(),     // agent slug or "all"
  type: mysqlEnum("type", [
    "directive",       // "Write an article about X"
    "report",          // "Here's what I found"
    "approval_request", // "I want to do X, please approve"
    "approved",        // Manager says go
    "rejected",        // Manager says no
    "alert",           // Something needs attention
    "info",            // FYI, no action needed
  ]).notNull(),
  priority: mysqlEnum("priority", ["p1", "p2", "p3", "p4", "p5"]).default("p3").notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(), // Full message content (markdown)
  metadata: text("metadata"),   // JSON: any structured data attached
  status: mysqlEnum("status", ["pending", "read", "acted_on", "expired"])
    .default("pending")
    .notNull(),
  parentMessageId: int("parentMessageId"), // For threading replies
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
  actedAt: timestamp("actedAt"),
});

export type AgentMessage = typeof agentMessages.$inferSelect;
export type InsertAgentMessage = typeof agentMessages.$inferInsert;

/**
 * Agent Action Queue — prioritized actions for agents to execute.
 * Inspired by the Omega "Jarvis Action Queue" pattern.
 * Priority: P1 (money bleeding) → P5 (nice to have)
 */
export const agentActions = mysqlTable("agentActions", {
  id: int("id").autoincrement().primaryKey(),
  agentSlug: varchar("agentSlug", { length: 50 }).notNull(),
  priority: mysqlEnum("priority", ["p1", "p2", "p3", "p4", "p5"]).default("p3").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  actionType: varchar("actionType", { length: 100 }).notNull(), // e.g. "research_firm", "write_article", "check_ranking"
  payload: text("payload"),  // JSON: input data for the action
  status: mysqlEnum("status", ["queued", "running", "completed", "failed", "blocked", "approved", "rejected"])
    .default("queued")
    .notNull(),
  result: text("result"),    // JSON: output from execution
  requiresApproval: tinyint("requiresApproval").default(0).notNull(), // 1 = needs Manager sign-off
  approvedBy: varchar("approvedBy", { length: 50 }), // "manager" or "human"
  approvedAt: timestamp("approvedAt"),
  errorMessage: text("errorMessage"),
  retryCount: int("retryCount").default(0).notNull(),
  scheduledFor: timestamp("scheduledFor"), // null = run immediately
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  durationMs: int("durationMs"),
  costUsd: decimal("costUsd", { precision: 10, scale: 6 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgentAction = typeof agentActions.$inferSelect;
export type InsertAgentAction = typeof agentActions.$inferInsert;

/**
 * Attorney Prospects — firms discovered by the Money-Making Agent.
 * Scored and ranked for outreach potential.
 */
export const attorneyProspects = mysqlTable("attorneyProspects", {
  id: int("id").autoincrement().primaryKey(),

  // Firm identity
  firmName: varchar("firmName", { length: 300 }).notNull(),
  website: varchar("website", { length: 500 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  contactPerson: varchar("contactPerson", { length: 200 }),

  // Location & coverage
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  statesCovered: text("statesCovered"), // JSON array of state codes

  // Practice details
  practiceAreas: text("practiceAreas"),  // JSON array: ["solar_contracts", "consumer_protection", "DTPA"]
  yearsInPractice: int("yearsInPractice"),
  foundedYear: int("foundedYear"),
  firmSize: varchar("firmSize", { length: 50 }), // "solo", "small", "mid", "large"

  // Fee structure
  feeStructure: mysqlEnum("feeStructure", ["contingency", "hourly", "flat_fee", "hybrid", "unknown"])
    .default("unknown")
    .notNull(),
  contingencyPercent: varchar("contingencyPercent", { length: 20 }),
  typicalCaseValue: varchar("typicalCaseValue", { length: 100 }),

  // Performance / success metrics
  casesHandled: int("casesHandled"),
  successRate: varchar("successRate", { length: 20 }),
  totalRecovered: varchar("totalRecovered", { length: 100 }), // e.g. "$1M+"
  notableResults: text("notableResults"), // JSON array of case results
  avgSettlement: varchar("avgSettlement", { length: 100 }),

  // Competitive intel
  advertisingChannels: text("advertisingChannels"), // JSON: ["google_ads", "avvo", "findlaw"]
  seoKeywords: text("seoKeywords"),                // JSON: keywords they rank for
  estimatedAdSpend: varchar("estimatedAdSpend", { length: 50 }),
  competitorOf: text("competitorOf"),              // JSON: other firms they compete with

  // Scoring (0-100)
  overallScore: int("overallScore").default(0).notNull(),
  scoreBreakdown: text("scoreBreakdown"), // JSON: {contingency: 30, experience: 25, coverage: 20, revenue_potential: 25}

  // Outreach status
  outreachStatus: mysqlEnum("outreachStatus", [
    "not_contacted", "researching", "ready_to_pitch",
    "pitched", "in_conversation", "signed", "rejected", "not_interested"
  ]).default("not_contacted").notNull(),
  outreachNotes: text("outreachNotes"),
  lastContactedAt: timestamp("lastContactedAt"),
  pitchAngle: text("pitchAngle"), // Personalized pitch recommendation

  // Source
  discoveredBy: varchar("discoveredBy", { length: 50 }).default("money_maker"), // agent slug
  discoveredVia: varchar("discoveredVia", { length: 200 }), // "google_search", "avvo", "justia", etc.
  verifiedAt: timestamp("verifiedAt"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AttorneyProspect = typeof attorneyProspects.$inferSelect;
export type InsertAttorneyProspect = typeof attorneyProspects.$inferInsert;

/**
 * SEO Change Log — every change made to the site, tracked for impact analysis.
 * The SEO Intelligence Agent correlates changes with GSC performance data.
 */
export const seoChangeLog = mysqlTable("seoChangeLog", {
  id: int("id").autoincrement().primaryKey(),

  // What changed
  changeType: mysqlEnum("changeType", [
    "content_added", "content_updated", "content_removed",
    "image_added", "image_updated", "image_removed",
    "meta_updated", "schema_updated", "link_added", "link_removed",
    "technical_fix", "page_speed", "redirect_added",
    "backlink_acquired", "backlink_lost",
    "design_change", "other"
  ]).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description").notNull(),
  pagesAffected: text("pagesAffected"), // JSON array of URLs/slugs affected
  pageCount: int("pageCount").default(1),

  // Before/after snapshot
  beforeSnapshot: text("beforeSnapshot"), // JSON: relevant metrics before change
  afterSnapshot: text("afterSnapshot"),   // JSON: relevant metrics after change (filled later)

  // Impact measurement (filled by SEO Intel Agent after 7-14 days)
  impactMeasured: tinyint("impactMeasured").default(0).notNull(),
  impactScore: int("impactScore"), // -100 to +100 (negative = hurt, positive = helped)
  impactSummary: text("impactSummary"),
  impressionsDelta: int("impressionsDelta"),
  clicksDelta: int("clicksDelta"),
  positionDelta: varchar("positionDelta", { length: 20 }), // e.g. "+5.2" or "-2.1"
  measurementDate: timestamp("measurementDate"),

  // Attribution
  madeBy: varchar("madeBy", { length: 100 }), // "content_agent", "human", "seo_intel", etc.
  relatedActionId: int("relatedActionId"), // FK to agentActions.id if agent-initiated

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SeoChangeLog = typeof seoChangeLog.$inferSelect;
export type InsertSeoChangeLog = typeof seoChangeLog.$inferInsert;

/**
 * Content Pipeline — articles/content pieces flowing through the agent system.
 * Content Agent drafts → Editor Agent reviews → Manager Agent approves → Published
 */
export const contentPipeline = mysqlTable("contentPipeline", {
  id: int("id").autoincrement().primaryKey(),

  // Content identity
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 300 }),
  contentType: mysqlEnum("contentType", ["blog_article", "city_page", "company_page", "landing_page", "medium_article", "press_release", "social_post"])
    .default("blog_article")
    .notNull(),

  // SEO targeting
  targetKeyword: varchar("targetKeyword", { length: 255 }),
  secondaryKeywords: text("secondaryKeywords"), // JSON array
  searchVolume: int("searchVolume"),
  keywordDifficulty: int("keywordDifficulty"),
  searchIntent: varchar("searchIntent", { length: 100 }), // informational, transactional, navigational

  // Content
  outline: text("outline"),        // Structured outline before writing
  draft: text("draft"),            // Full draft content
  finalContent: text("finalContent"), // Approved final version
  wordCount: int("wordCount"),

  // Pipeline status
  stage: mysqlEnum("stage", [
    "idea", "researching", "outlined", "drafting", "draft_complete",
    "in_review", "revision_needed", "approved", "published", "rejected"
  ]).default("idea").notNull(),

  // Agent assignments
  requestedBy: varchar("requestedBy", { length: 50 }), // Which agent requested this
  assignedTo: varchar("assignedTo", { length: 50 }),   // Which agent is working on it
  reviewedBy: varchar("reviewedBy", { length: 50 }),   // Editor agent
  approvedBy: varchar("approvedBy", { length: 50 }),   // Manager agent

  // Review feedback
  editorFeedback: text("editorFeedback"),
  managerFeedback: text("managerFeedback"),
  revisionCount: int("revisionCount").default(0).notNull(),

  // Quality scores (0-100)
  seoScore: int("seoScore"),
  readabilityScore: int("readabilityScore"),
  eatScore: int("eatScore"),          // E-E-A-T compliance
  duplicateRisk: int("duplicateRisk"), // 0=unique, 100=duplicate

  // Revenue connection
  revenueJustification: text("revenueJustification"), // Why this content makes money
  estimatedMonthlyTraffic: int("estimatedMonthlyTraffic"),
  estimatedLeadsPerMonth: int("estimatedLeadsPerMonth"),

  // Publishing
  publishedUrl: varchar("publishedUrl", { length: 500 }),
  publishedAt: timestamp("publishedAt"),
  blogPostId: int("blogPostId"), // FK to blogPosts.id once published

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContentPipeline = typeof contentPipeline.$inferSelect;
export type InsertContentPipeline = typeof contentPipeline.$inferInsert;

/**
 * Agent Run Log — detailed execution history for every agent run.
 * Tracks what the agent did, what it cost, and what it produced.
 */
export const agentRunLog = mysqlTable("agentRunLog", {
  id: int("id").autoincrement().primaryKey(),
  agentSlug: varchar("agentSlug", { length: 50 }).notNull(),
  triggerType: mysqlEnum("triggerType", ["cron", "manual", "directive", "event"]).default("cron").notNull(),
  triggeredBy: varchar("triggeredBy", { length: 100 }), // Who/what triggered it

  // Execution
  status: mysqlEnum("status", ["running", "completed", "failed", "timeout"]).default("running").notNull(),
  summary: text("summary"),          // Human-readable summary of what happened
  actionsCreated: int("actionsCreated").default(0),
  messagesCreated: int("messagesCreated").default(0),

  // LLM usage
  model: varchar("model", { length: 200 }),
  tokensIn: int("tokensIn").default(0),
  tokensOut: int("tokensOut").default(0),
  costUsd: decimal("costUsd", { precision: 10, scale: 6 }).default("0"),
  llmCalls: int("llmCalls").default(0),

  // Timing
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  durationMs: int("durationMs"),

  // Error handling
  errorMessage: text("errorMessage"),
  errorStack: text("errorStack"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentRunLog = typeof agentRunLog.$inferSelect;
export type InsertAgentRunLog = typeof agentRunLog.$inferInsert;

/**
 * Revenue Tracker — tracks all revenue-generating events.
 * The Money-Making Agent's north star metric.
 */
export const revenueTracker = mysqlTable("revenueTracker", {
  id: int("id").autoincrement().primaryKey(),

  // Source
  source: mysqlEnum("source", [
    "lead_sale", "listing_fee", "pay_per_click", "pay_per_call",
    "exclusive_territory", "consultation", "other"
  ]).notNull(),
  description: varchar("description", { length: 500 }),

  // Money
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  status: mysqlEnum("status", ["pending", "invoiced", "paid", "overdue", "cancelled"])
    .default("pending")
    .notNull(),

  // Relations
  firmId: int("firmId"),     // FK to lawFirms.id or attorneyProspects.id
  leadId: int("leadId"),     // FK to leads.id
  firmName: varchar("firmName", { length: 200 }),

  // Dates
  invoicedAt: timestamp("invoicedAt"),
  paidAt: timestamp("paidAt"),
  dueDate: timestamp("dueDate"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RevenueTracker = typeof revenueTracker.$inferSelect;
export type InsertRevenueTracker = typeof revenueTracker.$inferInsert;
