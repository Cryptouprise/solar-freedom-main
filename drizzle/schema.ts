import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  status: mysqlEnum("status", ["active", "inactive", "archived", "bankrupt", "acquired", "dissolved"]).default("active").notNull(),
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
 * Site config v2 table — key/value store for runtime website settings.
 */
export const siteConfigValues = mysqlTable("site_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SiteConfigValue = typeof siteConfigValues.$inferSelect;
export type InsertSiteConfigValue = typeof siteConfigValues.$inferInsert;

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
