/**
 * executors.ts — Typed action executors.
 *
 * The action queue used to be advisory only: agents wrote rows and exactly one
 * action type ("research_firm") had an execution path, so every other
 * recommendation stayed "queued" forever. This module is the single place where
 * a queued action becomes a real, reviewable change to the live site.
 *
 * The safety model is deliberately narrow and matches the site's post-penalty
 * recovery posture:
 *
 *   - Executors only EDIT pages that are already published and index-eligible.
 *     They never create a page, never publish a draft, and never touch anything
 *     off-site. New pages remain a human decision.
 *   - Every target is checked against the index-eligibility allowlist and the
 *     trust quarantine, so a page held noindex for unverified claims is never
 *     optimized.
 *   - Every model-proposed patch is validated against hard structural limits and
 *     a conservative-copy scan before it is applied. A patch that fails
 *     validation blocks the action with a stated reason; it is never silently
 *     downgraded or partially applied.
 *   - Every applied change stores a rollback payload on the action and writes a
 *     seoChangeLog row with before/after snapshots, so SEO Intel can correlate
 *     the change to ranking movement and the owner can revert it in one click.
 *
 * This is the "approved typed adapter with verification and rollback" path that
 * server/automationPolicy.ts points at; it does not widen the generic
 * /api/admin/automation/apply runtime-mutation block.
 */

import { and, asc, eq, inArray, isNull, lte, or } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import * as cheerio from "cheerio";
import { getDb, getAdminBlogPost } from "../db";
import {
  agentActions,
  blogPosts,
  seoChangeLog,
  type AgentAction,
  type SeoChangeLog,
} from "../../drizzle/schema";
import { sanitizeStoredHtml } from "../security/html";
import { callAgentLLM } from "./agentLLM";
import {
  isCanonicalBlogIndexed,
  isQuarantinedPath,
  INDEXABLE_BLOG_SLUGS,
  INDEXABLE_CITY_PATHS,
} from "../../client/src/data/indexEligibility";
import { PUBLIC_PATH_REDIRECTS } from "../seo-redirects";
import { remainingAutonomousBudgetMs } from "../autonomousBudget";
import {
  maintainAutonomousQueue,
  type QueueMaintenanceReport,
} from "../autonomousQueueMaintenance";

// ─── Hard limits ──────────────────────────────────────────────────────────────
// These are structural, not stylistic. A patch outside them is rejected.

export const EXECUTOR_LIMITS = {
  metaTitleMinChars: 20,
  metaTitleMaxChars: 65,
  metaDescriptionMinChars: 70,
  metaDescriptionMaxChars: 165,
  maxInternalLinksPerAction: 3,
  maxFaqItemsPerAction: 3,
  maxFaqItemsTotal: 10,
  faqAnswerMinChars: 60,
  faqAnswerMaxChars: 700,
  /** A full experiment window, never shortened by an action payload or alias. */
  pageChangeCooldownMs: 14 * 24 * 60 * 60 * 1000,
  batchDeadlineMs: 55_000,
  modelCallBudgetMs: 45_000,
  autonomousModelTimeoutMs: 16_000,
  commitReserveMs: 3_000,
  minimumModelTimeoutMs: 1_000,
  /** One provider-backed operation per callback, including reviewed batches. */
  defaultBatchSize: 1,
  maxBatchSize: 1,
} as const;

/**
 * Copy that must never be introduced by an automated edit. The site is a
 * consumer-information property, not a law firm, and it is recovering from a
 * penalty caused by unsupported claims.
 */
const BANNED_COPY_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bguarantee(d|s)?\b/i, label: "guaranteed outcome" },
  { pattern: /\blegal advice\b/i, label: "legal advice claim" },
  {
    pattern: /\bwe are (attorneys|lawyers)\b/i,
    label: "first-party attorney claim",
  },
  {
    pattern: /\bfree legal (review|consultation|advice)\b/i,
    label: "free legal review claim",
  },
  { pattern: /\b(will|can) win\b/i, label: "outcome promise" },
  { pattern: /\b100% (free|success|guaranteed)\b/i, label: "absolute claim" },
  {
    pattern: /\balways\b.{0,24}\bcancel\b/i,
    label: "universal cancellation claim",
  },
  {
    pattern: /\bany (solar )?contract can be (cancel|void)/i,
    label: "universal cancellation claim",
  },
];

export function findBannedCopy(value: string): string[] {
  return BANNED_COPY_PATTERNS.filter(rule => rule.pattern.test(value)).map(
    rule => rule.label
  );
}

// ─── Outcome types ────────────────────────────────────────────────────────────

export type RollbackPlan = {
  kind: "blog_post_fields";
  slug: string;
  /** Exact prior field values. Re-applying these restores the page. */
  fields: Record<string, string | null>;
};

export type ExecutionOutcome =
  | {
      status: "completed";
      summary: string;
      changed: boolean;
      before: Record<string, unknown>;
      after: Record<string, unknown>;
      rollback?: RollbackPlan;
      changeType?: string;
      pagePath?: string;
      /** A proposal only: the queue runner commits page, log and receipt together. */
      mutation?: { target: ResolvedTarget; fields: BlogPatch };
    }
  | { status: "blocked"; reason: string };

export type ExecutorContext = {
  actionId: number;
  actionType: string;
  agentSlug: string;
  title: string;
  description: string;
  payload: Record<string, unknown>;
  deadlineAt?: number;
  /** Explicitly bounded callbacks may use a shorter, genuinely awaited model call. */
  boundedWork?: boolean;
};

export type ActionExecutor = {
  /** Short label shown in the admin queue so the owner knows what will happen. */
  label: string;
  changeType: "meta_updated" | "link_added" | "schema_updated" | "other";
  run: (ctx: ExecutorContext) => Promise<ExecutionOutcome>;
};

function blocked(reason: string): ExecutionOutcome {
  return { status: "blocked", reason };
}

// ─── Target resolution ────────────────────────────────────────────────────────

function canonicalBlogPath(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  let path = value.trim();
  if (/^https?:\/\//i.test(path)) {
    try {
      const url = new URL(path);
      if (
        ![
          "breakyoursolarcontract.com",
          "www.breakyoursolarcontract.com",
        ].includes(url.hostname.toLowerCase()) ||
        url.username ||
        url.password ||
        url.port
      )
        return null;
      path = url.pathname;
    } catch {
      return null;
    }
  }
  if (path.startsWith("//") || /[\\\s%]/.test(path)) return null;
  path = path.split(/[?#]/)[0].replace(/\/$/, "");
  const match = path.match(/^(?:\/?blog\/)?([a-z0-9][a-z0-9-]{0,254})$/i);
  return match ? `/blog/${match[1].toLowerCase()}` : null;
}

/** Explicit invalid/ambiguous targets never fall back to a convenient prose URL. */
export function resolveBlogSlug(ctx: ExecutorContext): string | null {
  const keys = ["pageSlug", "slug", "url", "page", "target"];
  const explicit = keys.filter(key => Object.hasOwn(ctx.payload, key));
  const prose = `${ctx.title}\n${ctx.description}`;
  const absolute = Array.from(prose.matchAll(/https?:\/\/[^\s<>"')]+/gi)).map(
    match => match[0]
  );
  // Do not reinterpret a foreign URL in prose as a path on this website.
  if (
    !explicit.length &&
    absolute.some(url => /\/blog\//i.test(url) && !canonicalBlogPath(url))
  )
    return null;
  const paths = explicit.length
    ? explicit.map(key => canonicalBlogPath(ctx.payload[key]))
    : Array.from(
        prose.matchAll(/\/blog\/[a-z0-9][a-z0-9-]*(?:\/[^\s<>"')]+)?/gi)
      ).map(match => canonicalBlogPath(match[0]));
  if (!paths.length || paths.some(path => !path) || new Set(paths).size !== 1)
    return null;
  return paths[0]!.slice("/blog/".length);
}

type BlogPatch = {
  content?: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  faqItems?: string | null;
};

type ResolvedTarget = {
  slug: string;
  pagePath: string;
  post: NonNullable<Awaited<ReturnType<typeof getAdminBlogPost>>>;
};

/** Alias-independent identity; metadata aliases and FAQ/schema aliases collapse. */
export function pageChangeKey(actionType: string, page: string): string | null {
  const executor = getExecutor(actionType);
  const path = canonicalBlogPath(page);
  return executor && executor.changeType !== "other" && path
    ? `${path}:${executor.changeType}`
    : null;
}

/** Protect all changes on the URL while an experiment is unmeasured, not just aliases. */
export function pageCooldownReason(
  pagePath: string,
  changes: Array<
    Pick<
      SeoChangeLog,
      | "pagesAffected"
      | "createdAt"
      | "measurementDate"
      | "impactMeasured"
      | "changeType"
    >
  >,
  now: number
): string | null {
  if (!canonicalBlogPath(pagePath) || !Number.isFinite(now))
    return "Invalid cooldown target or clock.";
  for (const change of changes) {
    if (!change.pagesAffected) continue;
    let pages: unknown;
    try {
      pages = JSON.parse(change.pagesAffected);
    } catch {
      return "Unusable public-change history; review before another edit.";
    }
    if (!Array.isArray(pages))
      return "Unusable public-change history; review before another edit.";
    if (!pages.some(page => canonicalBlogPath(page) === pagePath)) continue;
    const createdAt =
      change.createdAt instanceof Date ? change.createdAt.getTime() : NaN;
    if (!Number.isFinite(createdAt))
      return `Invalid change timestamp for ${pagePath}; cooldown cannot be verified.`;
    if (now - createdAt < EXECUTOR_LIMITS.pageChangeCooldownMs) {
      return `${pagePath} is in its 14-full-day measurement cooldown after ${change.changeType}; another alias or reviewed actor cannot shorten it.`;
    }
    if (
      change.impactMeasured !== 1 ||
      !(change.measurementDate instanceof Date) ||
      !Number.isFinite(change.measurementDate.getTime()) ||
      change.measurementDate.getTime() < createdAt + 7 * 24 * 60 * 60 * 1000 ||
      change.measurementDate.getTime() > now
    ) {
      return `${pagePath} has an unmeasured public change; record a valid post-change measurement before editing it again.`;
    }
  }
  return null;
}

/**
 * Resolve and gate a target page. Everything an executor is allowed to touch
 * must pass through here.
 */
export async function resolveTarget(
  ctx: ExecutorContext
): Promise<ResolvedTarget | ExecutionOutcome> {
  const slug = resolveBlogSlug(ctx);
  if (!slug) {
    return blocked(
      "No /blog/<slug> target could be resolved from this action. Only published blog pages have a typed executor."
    );
  }

  const pagePath = `/blog/${slug}`;
  if (isQuarantinedPath(pagePath)) {
    return blocked(
      `${pagePath} is in the trust quarantine (held noindex pending a source-backed rewrite). Automated optimization is not applied to quarantined pages.`
    );
  }
  if (!isCanonicalBlogIndexed(slug)) {
    return blocked(
      `${pagePath} is not index-eligible (missing from the canonical blog allowlist, or superseded by a redirect). Optimizing a noindex page cannot move rankings.`
    );
  }

  const db = await getDb();
  if (!db)
    return blocked(
      "Database unavailable; target and cooldown cannot be verified."
    );
  // Keep exact stored values for rollback rather than the admin reader's sanitized copy.
  const [stored] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);
  const post = stored ?? (await getAdminBlogPost(slug));
  if (!post)
    return blocked(`${pagePath} was not found in the blog source of truth.`);
  if (post.published !== 1)
    return blocked(
      `${pagePath} is not published. Executors never publish content.`
    );
  if (post.canonicalUrl && canonicalBlogPath(post.canonicalUrl) !== pagePath)
    return blocked(
      `${pagePath} canonical points elsewhere; no public effect can be verified.`
    );

  const now = Date.now();
  // Include historical measured rows too: a legacy measured flag with a null,
  // future or premature date must not silently bypass experiment protection.
  // Fetch only guard fields, not potentially large before/after HTML snapshots.
  const changes = await db
    .select({
      pagesAffected: seoChangeLog.pagesAffected,
      createdAt: seoChangeLog.createdAt,
      measurementDate: seoChangeLog.measurementDate,
      impactMeasured: seoChangeLog.impactMeasured,
      changeType: seoChangeLog.changeType,
    })
    .from(seoChangeLog);
  const reason = pageCooldownReason(pagePath, changes, now);
  if (reason) return blocked(reason);

  return { slug, pagePath, post };
}

// ─── Model patch helper ───────────────────────────────────────────────────────

/**
 * Providers occasionally emit raw control characters inside JSON strings. Parse
 * strictly first, then retry once with control characters collapsed.
 */
export function parseJsonObject(raw: string): Record<string, unknown> | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  const attempts = [match[0], match[0].replace(/[\u0000-\u001F]+/g, " ")];
  for (const attempt of attempts) {
    try {
      const parsed = JSON.parse(attempt);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // try the next normalization
    }
  }
  return null;
}

const PATCH_SYSTEM_PROMPT = [
  "You produce a small, precise edit to an EXISTING page on a consumer-information website about solar contracts.",
  "The site is not a law firm and is recovering from a search penalty caused by unsupported claims.",
  "Never promise or imply an outcome, never use the words guarantee or guaranteed, never say 'legal advice' or 'free legal review',",
  "never claim the site employs attorneys, and never state that any contract can always be cancelled.",
  "Prefer 'free case review'. Stay factual, specific and conservative.",
  "Return ONLY a single JSON object. No markdown fence, no commentary.",
].join(" ");

async function requestPatch(params: {
  agentSlug: string;
  instruction: string;
  maxTokens?: number;
  deadlineAt?: number;
  boundedWork?: boolean;
}): Promise<Record<string, unknown> | null> {
  const invocationBudget = remainingAutonomousBudgetMs(
    EXECUTOR_LIMITS.commitReserveMs
  );
  const boundedWork = params.boundedWork || invocationBudget !== undefined;
  const remaining = (params.deadlineAt ?? Infinity) - Date.now();
  const totalTimeoutMs = boundedWork
    ? Math.min(
        EXECUTOR_LIMITS.autonomousModelTimeoutMs,
        remaining - EXECUTOR_LIMITS.commitReserveMs,
        invocationBudget ?? Infinity
      )
    : undefined;
  if (
    boundedWork
      ? totalTimeoutMs! < EXECUTOR_LIMITS.minimumModelTimeoutMs
      : remaining < EXECUTOR_LIMITS.modelCallBudgetMs
  ) {
    throw new Error(
      "Callback budget is too small for a safe model call; nothing was changed."
    );
  }
  const response = await callAgentLLM({
    // Page edits are SEO work regardless of which agent created the queue item.
    agentSlug: "seo_intel",
    allowFallback: false,
    executionMode: "scheduled",
    ...(totalTimeoutMs !== undefined ? { totalTimeoutMs } : {}),
    maxTokens: params.maxTokens ?? 900,
    messages: [
      { role: "system", content: PATCH_SYSTEM_PROMPT },
      { role: "user", content: params.instruction },
    ],
  });
  if (params.deadlineAt !== undefined && Date.now() >= params.deadlineAt)
    throw new Error(
      "Callback deadline exceeded; late model output was discarded."
    );
  return parseJsonObject(response.content ?? "");
}

function textOf(html: string): string {
  return cheerio
    .load(html, undefined, false)
    .root()
    .text()
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Executor: metadata rewrite ───────────────────────────────────────────────
// Covers meta_rewrite, meta_fix and title_optimization. Rewrites the title tag
// and meta description of an already-published, index-eligible page.

async function executeMetadataRewrite(
  ctx: ExecutorContext
): Promise<ExecutionOutcome> {
  const target = await resolveTarget(ctx);
  if ("status" in target) return target;
  const { slug, pagePath, post } = target;

  const currentMetaTitle = post.metaTitle || post.title || "";
  const currentMetaDescription = post.metaDescription || post.excerpt || "";

  const patch = await requestPatch({
    agentSlug: ctx.agentSlug,
    deadlineAt: ctx.deadlineAt,
    boundedWork: ctx.boundedWork,
    instruction: [
      `PAGE: ${pagePath}`,
      `REQUESTED CHANGE: ${ctx.title}\n${ctx.description}`.slice(0, 1500),
      `CURRENT TITLE TAG: ${currentMetaTitle}`,
      `CURRENT META DESCRIPTION: ${currentMetaDescription}`,
      `PAGE OPENING: ${textOf(post.content || "").slice(0, 1200)}`,
      "",
      "Rewrite the search snippet so it earns more clicks at its current position without overstating anything.",
      'Return JSON: {"metaTitle": string, "metaDescription": string, "rationale": string}',
      `metaTitle must be ${EXECUTOR_LIMITS.metaTitleMinChars}-${EXECUTOR_LIMITS.metaTitleMaxChars} characters.`,
      `metaDescription must be ${EXECUTOR_LIMITS.metaDescriptionMinChars}-${EXECUTOR_LIMITS.metaDescriptionMaxChars} characters.`,
      "Both must describe what the page actually contains.",
    ].join("\n"),
  });

  if (!patch)
    return blocked("The model did not return a usable JSON metadata patch.");

  const metaTitle =
    typeof patch.metaTitle === "string" ? patch.metaTitle.trim() : "";
  const metaDescription =
    typeof patch.metaDescription === "string"
      ? patch.metaDescription.trim()
      : "";

  if (/[<>]/.test(`${metaTitle}${metaDescription}`))
    return blocked(
      "Metadata must be plain text, not markup. Nothing was changed."
    );
  if (
    metaTitle.length < EXECUTOR_LIMITS.metaTitleMinChars ||
    metaTitle.length > EXECUTOR_LIMITS.metaTitleMaxChars
  ) {
    return blocked(
      `Proposed title tag is ${metaTitle.length} characters; the allowed range is ${EXECUTOR_LIMITS.metaTitleMinChars}-${EXECUTOR_LIMITS.metaTitleMaxChars}.`
    );
  }
  if (
    metaDescription.length < EXECUTOR_LIMITS.metaDescriptionMinChars ||
    metaDescription.length > EXECUTOR_LIMITS.metaDescriptionMaxChars
  ) {
    return blocked(
      `Proposed meta description is ${metaDescription.length} characters; the allowed range is ${EXECUTOR_LIMITS.metaDescriptionMinChars}-${EXECUTOR_LIMITS.metaDescriptionMaxChars}.`
    );
  }
  const banned = findBannedCopy(`${metaTitle} ${metaDescription}`);
  if (banned.length) {
    return blocked(
      `Proposed metadata contains disallowed copy (${banned.join(", ")}). Nothing was changed.`
    );
  }
  if (
    metaTitle === currentMetaTitle &&
    metaDescription === currentMetaDescription
  ) {
    return {
      status: "completed",
      changed: false,
      summary: `${pagePath} metadata already matches the proposed optimization; no change was written.`,
      before: {
        metaTitle: currentMetaTitle,
        metaDescription: currentMetaDescription,
      },
      after: {
        metaTitle: currentMetaTitle,
        metaDescription: currentMetaDescription,
      },
      pagePath,
    };
  }

  return {
    status: "completed",
    changed: true,
    summary: `Rewrote the title tag and meta description on ${pagePath}.`,
    before: {
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
    },
    after: { metaTitle, metaDescription, rationale: patch.rationale },
    rollback: {
      kind: "blog_post_fields",
      slug,
      fields: {
        metaTitle: post.metaTitle ?? null,
        metaDescription: post.metaDescription ?? null,
      },
    },
    changeType: "meta_updated",
    pagePath,
    mutation: { target, fields: { metaTitle, metaDescription } },
  };
}

// ─── Executor: internal links ─────────────────────────────────────────────────
// Covers internal_link and interlink_injection. Wraps phrases that already exist
// in the page body with contextual links to other live, index-eligible pages.

/**
 * Every internal destination an executor is allowed to link to.
 *
 * The eligibility allowlists are not sufficient on their own: four entries in
 * blogSlugs are superseded by blog redirects, and citySlugs still contains
 * houston-tx, which 301s. Inserting a link to either would re-introduce the
 * internal redirect hops the spam recovery removed, so every candidate is
 * checked against the canonical-index rule and the public redirect ledger.
 */
export function allowedInternalTargets(excludeSlug?: string): string[] {
  const blog = Array.from(INDEXABLE_BLOG_SLUGS)
    .filter(slug => slug !== excludeSlug && isCanonicalBlogIndexed(slug))
    .map(slug => `/blog/${slug}`);
  return [...blog, ...INDEXABLE_CITY_PATHS]
    .filter(path => !isQuarantinedPath(path))
    .filter(path => !Object.hasOwn(PUBLIC_PATH_REDIRECTS, path))
    .sort();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function executeInternalLinks(
  ctx: ExecutorContext
): Promise<ExecutionOutcome> {
  const target = await resolveTarget(ctx);
  if ("status" in target) return target;
  const { slug, pagePath, post } = target;

  const originalContent = post.content || "";
  if (!originalContent.trim().startsWith("<")) {
    return blocked(
      `${pagePath} body is not stored as HTML, so links cannot be inserted safely.`
    );
  }

  const allowed = allowedInternalTargets(slug);
  const patch = await requestPatch({
    agentSlug: ctx.agentSlug,
    deadlineAt: ctx.deadlineAt,
    boundedWork: ctx.boundedWork,
    instruction: [
      `PAGE: ${pagePath}`,
      `REQUESTED CHANGE: ${ctx.title}\n${ctx.description}`.slice(0, 1200),
      `PAGE TEXT: ${textOf(originalContent).slice(0, 6000)}`,
      "",
      "ALLOWED LINK DESTINATIONS (you may only use these exact paths):",
      allowed.join("\n"),
      "",
      `Choose at most ${EXECUTOR_LIMITS.maxInternalLinksPerAction} contextual internal links.`,
      "anchorText must be an EXACT phrase that already appears in PAGE TEXT, 2-8 words, and must read naturally as a link to the destination.",
      'Return JSON: {"links":[{"anchorText": string, "href": string, "reason": string}]}',
    ].join("\n"),
    maxTokens: 700,
  });

  if (!patch)
    return blocked("The model did not return a usable JSON link patch.");
  const proposed = Array.isArray(patch.links) ? patch.links : [];
  if (!proposed.length) return blocked("The model proposed no internal links.");

  const allowedSet = new Set(allowed);
  const $ = cheerio.load(originalContent, undefined, false);
  const beforeInternalLinks = $('a[href^="/"]').length;
  const applied: Array<{ anchorText: string; href: string }> = [];
  const rejected: string[] = [];

  for (const raw of proposed.slice(
    0,
    EXECUTOR_LIMITS.maxInternalLinksPerAction
  )) {
    const anchorText =
      typeof (raw as any)?.anchorText === "string"
        ? (raw as any).anchorText.trim()
        : "";
    const href =
      typeof (raw as any)?.href === "string" ? (raw as any).href.trim() : "";
    const words = anchorText ? anchorText.split(/\s+/).length : 0;

    if (!anchorText || words < 2 || words > 8) {
      rejected.push(`"${anchorText}": anchor text must be 2-8 words`);
      continue;
    }
    if (/[<>&]/.test(anchorText)) {
      rejected.push(`"${anchorText}": unsafe markup in anchor text`);
      continue;
    }
    if (!allowedSet.has(href)) {
      rejected.push(
        `"${anchorText}": ${href} is not an allowed live destination`
      );
      continue;
    }
    if (findBannedCopy(anchorText).length) {
      rejected.push(`"${anchorText}": disallowed copy in anchor text`);
      continue;
    }
    if ($(`a[href="${href}"]`).length) {
      rejected.push(
        `"${anchorText}": ${href} is already linked from this page`
      );
      continue;
    }

    // Wrap the first unlinked occurrence of the exact phrase inside a block that
    // contains no anchors. Deterministic — the model never supplies HTML.
    let done = false;
    $("p, li").each((_index, element) => {
      if (done) return;
      const node = $(element);
      if (node.find("a").length || node.closest("a").length) return;
      const html = node.html() ?? "";
      if (!node.text().includes(anchorText)) return;
      const replaced = html.replace(
        new RegExp(escapeRegExp(anchorText)),
        `<a href="${href}">${anchorText}</a>`
      );
      if (replaced === html) return;
      node.html(replaced);
      applied.push({ anchorText, href });
      done = true;
    });
    if (!done)
      rejected.push(
        `"${anchorText}": exact phrase not found as plain text in the page body`
      );
  }

  if (!applied.length) {
    return blocked(
      `No proposed internal link could be applied safely. ${rejected.join("; ") || "No reason recorded."}`
    );
  }

  const nextContent = sanitizeStoredHtml($.html());
  const beforeText = textOf(originalContent);
  const afterText = textOf(nextContent);
  if (afterText.length < beforeText.length) {
    return blocked(
      `Link insertion would have reduced page text from ${beforeText.length} to ${afterText.length} characters. Nothing was changed.`
    );
  }

  return {
    status: "completed",
    changed: true,
    summary: `Added ${applied.length} contextual internal link${applied.length === 1 ? "" : "s"} to ${pagePath}.`,
    before: {
      content: originalContent,
      internalLinkCount: beforeInternalLinks,
      textLength: beforeText.length,
    },
    after: {
      content: nextContent,
      internalLinkCount: beforeInternalLinks + applied.length,
      linksAdded: applied,
      rejected,
      textLength: afterText.length,
    },
    rollback: {
      kind: "blog_post_fields",
      slug,
      fields: { content: originalContent },
    },
    changeType: "link_added",
    pagePath,
    mutation: { target, fields: { content: nextContent } },
  };
}

// ─── Executor: FAQ / schema ───────────────────────────────────────────────────
// Covers faq_addition and schema_markup. Appends FAQ entries, which drive both
// the rendered FAQ section and the FAQPage JSON-LD (server/seo-meta.ts).

export function normalizeQuestion(value: string): string {
  return textOf(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(new RegExp("[^\\p{L}\\p{N}]+", "gu"), " ")
    .trim();
}

export function parseFaqItems(value: unknown): Array<{ q: string; a: string }> {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is { q: string; a: string } =>
        !!item &&
        typeof (item as any).q === "string" &&
        typeof (item as any).a === "string"
    );
  } catch {
    return [];
  }
}

async function executeFaqAddition(
  ctx: ExecutorContext
): Promise<ExecutionOutcome> {
  const target = await resolveTarget(ctx);
  if ("status" in target) return target;
  const { slug, pagePath, post } = target;

  // Never discard malformed existing entries and overwrite them with a smaller list.
  let rawExisting: unknown;
  try {
    rawExisting =
      post.faqItems == null || post.faqItems === ""
        ? []
        : JSON.parse(post.faqItems);
  } catch {
    return blocked(
      `${pagePath} has malformed FAQ storage; manual review is required.`
    );
  }
  if (
    !Array.isArray(rawExisting) ||
    parseFaqItems(rawExisting).length !== rawExisting.length
  )
    return blocked(
      `${pagePath} has invalid FAQ entries; automatic replacement is forbidden.`
    );
  const existing = parseFaqItems(rawExisting);
  if (existing.length >= EXECUTOR_LIMITS.maxFaqItemsTotal)
    return blocked(
      `${pagePath} already has ${existing.length} FAQ entries (total cap ${EXECUTOR_LIMITS.maxFaqItemsTotal}). No model call or deletion was made.`
    );
  const capacity = Math.min(
    EXECUTOR_LIMITS.maxFaqItemsPerAction,
    EXECUTOR_LIMITS.maxFaqItemsTotal - existing.length
  );

  const patch = await requestPatch({
    agentSlug: ctx.agentSlug,
    deadlineAt: ctx.deadlineAt,
    boundedWork: ctx.boundedWork,
    instruction: [
      `PAGE: ${pagePath}`,
      `REQUESTED CHANGE: ${ctx.title}\n${ctx.description}`.slice(0, 1200),
      `PAGE TEXT: ${textOf(post.content || "").slice(0, 5000)}`,
      "",
      "EXISTING QUESTIONS (do not repeat these):",
      existing.map(item => `- ${item.q}`).join("\n") || "- none",
      "",
      `Add at most ${capacity} genuinely new questions a homeowner would search for, each answerable from the page's own subject matter.`,
      `Each answer must be ${EXECUTOR_LIMITS.faqAnswerMinChars}-${EXECUTOR_LIMITS.faqAnswerMaxChars} characters, factual, and hedged where the answer depends on the contract.`,
      'Return JSON: {"faq":[{"q": string, "a": string}]}',
    ].join("\n"),
    maxTokens: 1200,
  });

  if (!patch)
    return blocked("The model did not return a usable JSON FAQ patch.");
  const proposed = Array.isArray(patch.faq) ? patch.faq : [];
  if (!proposed.length)
    return blocked("The model proposed no new FAQ entries.");

  const seen = new Set(existing.map(item => normalizeQuestion(item.q)));
  const additions: Array<{ q: string; a: string }> = [];
  const rejected: string[] = [];

  for (const raw of proposed.slice(0, EXECUTOR_LIMITS.maxFaqItemsPerAction)) {
    const q = typeof (raw as any)?.q === "string" ? (raw as any).q.trim() : "";
    const a = typeof (raw as any)?.a === "string" ? (raw as any).a.trim() : "";
    if (!normalizeQuestion(q) || !q.endsWith("?") || /[<>]/.test(`${q}${a}`)) {
      rejected.push(`"${q}": question must end with a question mark`);
      continue;
    }
    if (
      a.length < EXECUTOR_LIMITS.faqAnswerMinChars ||
      a.length > EXECUTOR_LIMITS.faqAnswerMaxChars
    ) {
      rejected.push(
        `"${q}": answer is ${a.length} characters, outside the allowed range`
      );
      continue;
    }
    if (seen.has(normalizeQuestion(q))) {
      rejected.push(`"${q}": duplicates an existing question`);
      continue;
    }
    const banned = findBannedCopy(`${q} ${a}`);
    if (banned.length) {
      rejected.push(`"${q}": disallowed copy (${banned.join(", ")})`);
      continue;
    }
    if (additions.length >= capacity) {
      rejected.push(`"${q}": total FAQ cap would be exceeded`);
      continue;
    }
    seen.add(normalizeQuestion(q));
    additions.push({ q, a });
  }

  if (!additions.length) {
    return blocked(
      `No proposed FAQ entry passed validation. ${rejected.join("; ") || "No reason recorded."}`
    );
  }

  const nextFaq = [...existing, ...additions];

  return {
    status: "completed",
    changed: true,
    summary: `Added ${additions.length} FAQ entr${additions.length === 1 ? "y" : "ies"} to ${pagePath}, extending its FAQPage schema.`,
    before: { faqItems: post.faqItems, faqCount: existing.length },
    after: {
      faqItems: JSON.stringify(nextFaq),
      faqCount: nextFaq.length,
      added: additions,
      rejected,
    },
    rollback: {
      kind: "blog_post_fields",
      slug,
      fields: { faqItems: post.faqItems ?? null },
    },
    changeType: "schema_updated",
    pagePath,
    mutation: { target, fields: { faqItems: JSON.stringify(nextFaq) } },
  };
}

// ─── Executor: attorney research (pre-existing behaviour) ─────────────────────

async function executeResearchFirm(
  ctx: ExecutorContext
): Promise<ExecutionOutcome> {
  if (ctx.boundedWork && (ctx.deadlineAt ?? 0) - Date.now() < 15_000)
    return blocked(
      "Insufficient callback budget for the bounded attorney provider request; no research or outreach was performed."
    );
  const { executeAttorneyResearch } = await import("./attorneyResearch");
  const { JUSTIA_STATE_ROTATION } = await import("../justiaAttorneyResearch");
  const states = ctx.payload.states === undefined ? [] : ctx.payload.states;
  if (
    !Array.isArray(states) ||
    states.length > 5 ||
    states.some(
      state =>
        typeof state !== "string" ||
        !JUSTIA_STATE_ROTATION.some(valid =>
          [valid.name.toLowerCase(), valid.slug].includes(state.toLowerCase())
        )
    )
  )
    return blocked(
      "Invalid attorney research states; no provider request was made."
    );
  const result = await executeAttorneyResearch(states);
  const isBlocked =
    typeof result === "object" &&
    result !== null &&
    (result as { status?: string }).status === "blocked";
  if (isBlocked) {
    return blocked(
      (result as { reason?: string }).reason ||
        "Attorney research is blocked by its upstream provider."
    );
  }
  return {
    status: "completed",
    changed: result.saved > 0,
    summary: `Reviewed source-backed attorney prospects in ${result.states.join(", ")}; saved ${result.saved} new prospects. No outreach was sent.`,
    before: { states },
    after: result as Record<string, unknown>,
    changeType: "other",
  };
}

// ─── Registry ─────────────────────────────────────────────────────────────────

const META_EXECUTOR: ActionExecutor = {
  label: "Rewrite title tag and meta description",
  changeType: "meta_updated",
  run: executeMetadataRewrite,
};
const LINK_EXECUTOR: ActionExecutor = {
  label: "Add contextual internal links",
  changeType: "link_added",
  run: executeInternalLinks,
};
const FAQ_EXECUTOR: ActionExecutor = {
  label: "Add FAQ entries and FAQPage schema",
  changeType: "schema_updated",
  run: executeFaqAddition,
};

export const ACTION_EXECUTORS: Record<string, ActionExecutor> = {
  meta_rewrite: META_EXECUTOR,
  meta_fix: META_EXECUTOR,
  title_optimization: META_EXECUTOR,
  internal_link: LINK_EXECUTOR,
  interlink_injection: LINK_EXECUTOR,
  faq_addition: FAQ_EXECUTOR,
  schema_markup: FAQ_EXECUTOR,
  research_firm: {
    label: "Research attorney partner firms",
    changeType: "other",
    run: executeResearchFirm,
  },
};

export function getExecutor(actionType: string): ActionExecutor | null {
  return Object.hasOwn(ACTION_EXECUTORS, actionType)
    ? ACTION_EXECUTORS[actionType]
    : null;
}

export function isExecutable(actionType: string): boolean {
  return Object.hasOwn(ACTION_EXECUTORS, actionType);
}

export const EXECUTABLE_ACTION_TYPES = Object.keys(ACTION_EXECUTORS).sort();

/**
 * Action types agents create that intentionally have NO executor. Kept explicit
 * so the admin queue can state why an action is advisory instead of leaving an
 * opaque "queued" row.
 */
export const ADVISORY_ACTION_TYPES: Record<string, string> = {
  publish_content:
    "Publishing a new page is a human decision while the site is in penalty recovery.",
  content_gap:
    "Filling a content gap creates a new page; review and publish it from Blog Studio.",
  backlink_needed:
    "Backlinks are off-site and need outreach a typed adapter cannot perform.",
  technical_fix:
    "Technical fixes touch application code and ship through Git, not the action queue.",
  cta_rewrite:
    "Call-to-action copy lives in the React components, not in stored page content.",
  position_push:
    "This is an analysis directive, not a single concrete page change.",
  revenue_optimization: "Advisory revenue analysis for the owner to act on.",
  system_improvement: "Infrastructure suggestion; ships through Git.",
  error_fix: "Infrastructure repair; ships through Git.",
  gsc_data_sync:
    "Handled by the Search Console refresh job, not the action queue.",
  score_prospect: "Prospect scoring runs inside the Money Maker cycle.",
  recommend_outreach:
    "Outreach stays draft-and-approve only; nothing is sent automatically.",
  content_directive: "A directive to another agent, not a page change.",
  lead_delivery_fix: "Lead routing changes require owner confirmation.",
};

export function describeUnexecutable(actionType: string): string {
  return (
    (Object.hasOwn(ADVISORY_ACTION_TYPES, actionType)
      ? ADVISORY_ACTION_TYPES[actionType]
      : null) ??
    `No typed executor is configured for "${actionType}". It stays a planning task until an adapter is added.`
  );
}

// ─── Single-action execution ──────────────────────────────────────────────────

export type ExecutionReport = {
  actionId: number;
  actionType: string;
  status: "completed" | "blocked" | "failed";
  changed: boolean;
  summary: string;
  pagePath?: string;
};

/** Used in both SELECT-before-LIMIT and UPDATE claim; no terminal/retry reset. */
export function readyActionPredicate(now: Date, typedOnly = true) {
  return and(
    or(
      eq(agentActions.status, "approved"),
      and(
        eq(agentActions.status, "queued"),
        eq(agentActions.requiresApproval, 0)
      )
    ),
    isNull(agentActions.startedAt),
    isNull(agentActions.completedAt),
    or(isNull(agentActions.scheduledFor), lte(agentActions.scheduledFor, now)),
    typedOnly
      ? inArray(agentActions.actionType, EXECUTABLE_ACTION_TYPES)
      : undefined
  );
}

export function isActionReady(action: AgentAction, now: Date): boolean {
  return (
    (action.status === "approved" ||
      (action.status === "queued" && action.requiresApproval === 0)) &&
    action.startedAt === null &&
    action.completedAt === null &&
    (action.scheduledFor === null ||
      action.scheduledFor.getTime() <= now.getTime())
  );
}

function affectedOne(result: unknown): boolean {
  return Array.isArray(result) && result[0]?.affectedRows === 1;
}

type ExecutorDb = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type ExecutorTx = Parameters<Parameters<ExecutorDb["transaction"]>[0]>[0];

/**
 * A short DB-backed mutex using an existing stable row, not an in-process flag
 * or a pool-connection GET_LOCK. Claims are globally serialized; a running typed
 * action prevents another callback (even a different alias) from starting.
 * It is intentionally conservative and never holds a transaction across an LLM.
 */
async function claimAction(
  db: ExecutorDb,
  actionId: number,
  now: Date,
  token: string
) {
  return db.transaction(async tx => {
    await tx
      .select({ id: agentActions.id })
      .from(agentActions)
      .orderBy(asc(agentActions.id))
      .limit(1)
      .for("update");
    const [action] = await tx
      .select()
      .from(agentActions)
      .where(eq(agentActions.id, actionId))
      .limit(1)
      .for("update");
    if (!action) throw new Error("Action not found");
    if (!isActionReady(action, now))
      return {
        action,
        claimed: false,
        reason:
          "Action is not ready: terminal, running, previously attempted, scheduled later, or awaiting approval.",
      };
    const running = await tx
      .select({ id: agentActions.id })
      .from(agentActions)
      .where(
        and(
          eq(agentActions.status, "running"),
          inArray(agentActions.actionType, EXECUTABLE_ACTION_TYPES)
        )
      )
      .limit(1)
      .for("update");
    if (running.length)
      return {
        action,
        claimed: false,
        reason:
          "Another typed action is running; concurrent callback skipped without writes.",
      };
    const result = await tx
      .update(agentActions)
      .set({
        status: "running",
        startedAt: now,
        errorMessage: null,
        result: token,
      })
      .where(
        and(eq(agentActions.id, actionId), readyActionPredicate(now, false))
      );
    return {
      action,
      claimed: affectedOne(result),
      reason: "Action claim was lost; nothing was executed.",
    };
  });
}

function ownedClaim(actionId: number, token: string) {
  return and(
    eq(agentActions.id, actionId),
    eq(agentActions.status, "running"),
    eq(agentActions.result, token)
  );
}

function parseActionPayload(
  value: string | null
): Record<string, unknown> | null {
  if (value === null) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

/** Check source concurrency again, then commit only explicitly proposed fields. */
async function applyPageProposal(
  tx: ExecutorTx,
  outcome: Extract<ExecutionOutcome, { status: "completed" }>
) {
  const proposal = outcome.mutation;
  if (!proposal || !outcome.rollback || !outcome.pagePath)
    throw new Error(
      "Public change has no validated mutation/rollback receipt."
    );
  const { target, fields } = proposal;
  const [current] = await tx
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, target.slug))
    .limit(1)
    .for("update");
  const sourceFields = [
    "title",
    "metaTitle",
    "metaDescription",
    "content",
    "excerpt",
    "faqItems",
    "canonicalUrl",
    "published",
  ] as const;
  if (current) {
    if (
      target.post.id < 0 ||
      sourceFields.some(key => current[key] !== target.post[key])
    )
      throw new Error(
        "Page changed during generation; stale proposal discarded."
      );
    const result = await tx
      .update(blogPosts)
      .set({ ...fields, updatedAt: new Date() })
      .where(and(eq(blogPosts.id, current.id), eq(blogPosts.published, 1)));
    if (!affectedOne(result))
      throw new Error("Published page update was not acknowledged.");
  } else {
    if (target.post.id >= 0)
      throw new Error("Published page disappeared during generation.");
    // An already-public static page may gain a database override. No draft is
    // created or published, and its unchanged public source fields are preserved.
    const post = target.post;
    await tx.insert(blogPosts).values({
      slug: target.slug,
      title: post.title,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      heroImage: post.heroImage,
      category: post.category,
      tags: post.tags,
      content: post.content,
      excerpt: post.excerpt,
      readTime: post.readTime,
      relatedSlugs: post.relatedSlugs,
      faqItems: post.faqItems,
      canonicalUrl: post.canonicalUrl,
      published: 1,
      ...fields,
    });
  }
}

/**
 * Execute one queued action. This is the only path that applies an agent
 * recommendation to the live site, and it is shared by the admin mutation and
 * the scheduled batch runner so both behave identically.
 */
export async function executeQueuedAction(
  actionId: number,
  actor: string,
  options?: {
    deadlineAt?: number;
    workBudgetMs?: number;
    boundedWork?: boolean;
  }
): Promise<ExecutionReport> {
  if (
    !Number.isSafeInteger(actionId) ||
    actionId <= 0 ||
    typeof actor !== "string" ||
    !actor.trim()
  )
    throw new Error("Invalid action ID or actor.");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const startedAt = new Date();
  if (
    options?.workBudgetMs !== undefined &&
    (!Number.isFinite(options.workBudgetMs) || options.workBudgetMs < 0)
  )
    throw new Error("Invalid callback work budget.");
  const invocationBudget = remainingAutonomousBudgetMs();
  const boundedWork =
    options?.boundedWork ||
    options?.workBudgetMs !== undefined ||
    invocationBudget !== undefined;
  const deadlineAt = Math.min(
    options?.deadlineAt ?? Infinity,
    startedAt.getTime() + EXECUTOR_LIMITS.batchDeadlineMs,
    startedAt.getTime() + (options?.workBudgetMs ?? Infinity),
    startedAt.getTime() + (invocationBudget ?? Infinity)
  );
  if (!Number.isFinite(deadlineAt) || deadlineAt <= Date.now())
    throw new Error("Callback deadline already exhausted.");
  const token = JSON.stringify({
    executorClaim: randomUUID(),
    executedBy: actor,
  });
  const claim = await claimAction(db, actionId, startedAt, token);
  const action = claim.action;
  if (!claim.claimed)
    return {
      actionId,
      actionType: action.actionType,
      status: "blocked",
      changed: false,
      summary: claim.reason,
    };
  const executor = getExecutor(action.actionType);
  const payload = parseActionPayload(action.payload);

  try {
    const outcome = !executor
      ? blocked(describeUnexecutable(action.actionType))
      : !payload
        ? blocked(
            "Invalid action payload: expected a JSON object. Nothing was executed."
          )
        : await executor.run({
            actionId,
            actionType: action.actionType,
            agentSlug: action.agentSlug,
            title: action.title,
            description: action.description ?? "",
            payload,
            deadlineAt,
            boundedWork,
          });

    if (outcome.status === "blocked") {
      await db
        .update(agentActions)
        .set({
          status: "blocked",
          result: JSON.stringify({
            reason: outcome.reason,
            changed: false,
            ...(/cooldown|unmeasured public change|change history|change timestamp/i.test(
              outcome.reason
            )
              ? { code: "pending_measurement_hold" }
              : {}),
            executedBy: actor,
          }),
          completedAt: new Date(),
          durationMs: Date.now() - startedAt.getTime(),
        })
        .where(ownedClaim(actionId, token));
      return {
        actionId,
        actionType: action.actionType,
        status: "blocked",
        changed: false,
        summary: outcome.reason,
      };
    }

    await db.transaction(async tx => {
      const [owned] = await tx
        .select({ id: agentActions.id })
        .from(agentActions)
        .where(ownedClaim(actionId, token))
        .limit(1)
        .for("update");
      if (!owned)
        throw new Error(
          "Execution ownership was lost; no public changes were committed."
        );
      if (Date.now() >= deadlineAt)
        throw new Error("Callback deadline exceeded; proposal discarded.");
      if (outcome.changed && outcome.pagePath) {
        await applyPageProposal(tx, outcome);
        await tx.insert(seoChangeLog).values({
          changeType: executor!.changeType,
          title: `${executor!.label} — ${outcome.pagePath}`,
          description: outcome.summary,
          pagesAffected: JSON.stringify([outcome.pagePath]),
          pageCount: 1,
          beforeSnapshot: JSON.stringify(outcome.before),
          afterSnapshot: JSON.stringify(outcome.after),
          madeBy: action.agentSlug,
          relatedActionId: actionId,
        });
      }
      const result = await tx
        .update(agentActions)
        .set({
          status: "completed",
          completedAt: new Date(),
          durationMs: Date.now() - startedAt.getTime(),
          result: JSON.stringify({
            summary: outcome.summary,
            changed: outcome.changed,
            pagePath: outcome.pagePath,
            changeType: outcome.changeType,
            changeKey: outcome.pagePath
              ? pageChangeKey(action.actionType, outcome.pagePath)
              : null,
            before: outcome.before,
            after: outcome.after,
            rollback: outcome.rollback ?? null,
            executedBy: actor,
          }),
        })
        .where(ownedClaim(actionId, token));
      if (!affectedOne(result))
        throw new Error(
          "Completion receipt was not acknowledged; transaction rolled back."
        );
    });

    return {
      actionId,
      actionType: action.actionType,
      status: "completed",
      changed: outcome.changed,
      summary: outcome.summary,
      pagePath: outcome.pagePath,
    };
  } catch (error: any) {
    const message = error?.message || "Execution failed";
    await db
      .update(agentActions)
      .set({
        status: "failed",
        errorMessage: String(message).slice(0, 1000),
        result: JSON.stringify({
          reason: message,
          changed: false,
          executedBy: actor,
        }),
        completedAt: new Date(),
        durationMs: Date.now() - startedAt.getTime(),
      })
      .where(ownedClaim(actionId, token));
    return {
      actionId,
      actionType: action.actionType,
      status: "failed",
      changed: false,
      summary: message,
    };
  }
}

// ─── Batch execution ──────────────────────────────────────────────────────────

export type BatchReport = {
  considered: number;
  executed: number;
  changed: number;
  blocked: number;
  failed: number;
  reports: ExecutionReport[];
  /** Bounded queue transitions are separate from attempted provider operations. */
  maintenance?: QueueMaintenanceReport;
  deferredForBudget?: number;
};

/**
 * Pick up ready actions and execute them. "Ready" means queued (and not gated on
 * approval) or explicitly approved, and of a type that has a typed executor.
 * Runs sequentially so one batch cannot fan out into concurrent site writes.
 */
export async function runQueuedActionExecutions(options?: {
  limit?: number;
  actor?: string;
  deadlineAt?: number;
  /** Cooperative wall-clock admission budget; all started operations are awaited. */
  workBudgetMs?: number;
  /** Defaults off inside a durable invocation; dispatcher schedules it separately. */
  maintenance?: boolean;
}): Promise<BatchReport> {
  const requested = options?.limit ?? EXECUTOR_LIMITS.defaultBatchSize;
  const limit = Number.isFinite(requested)
    ? Math.max(0, Math.min(Math.floor(requested), EXECUTOR_LIMITS.maxBatchSize))
    : 0;
  if (
    options?.workBudgetMs !== undefined &&
    (!Number.isFinite(options.workBudgetMs) || options.workBudgetMs < 0)
  )
    throw new Error("Invalid callback work budget.");
  const invocationBudget = remainingAutonomousBudgetMs();
  const boundedWork =
    options?.workBudgetMs !== undefined || invocationBudget !== undefined;
  const deadlineAt = Math.min(
    options?.deadlineAt ?? Infinity,
    Date.now() + EXECUTOR_LIMITS.batchDeadlineMs,
    Date.now() + (options?.workBudgetMs ?? Infinity),
    Date.now() + (invocationBudget ?? Infinity)
  );
  if (!Number.isFinite(deadlineAt))
    throw new Error("Invalid callback deadline.");
  const actor = options?.actor ?? "scheduled_executor";
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const candidates =
    limit > 0 && Date.now() < deadlineAt
      ? await db
          .select()
          .from(agentActions)
          .where(readyActionPredicate(new Date()))
          .orderBy(
            asc(agentActions.priority),
            asc(agentActions.createdAt),
            asc(agentActions.id)
          )
          .limit(200)
      : [];

  const maintenance =
    (options?.maintenance ?? invocationBudget === undefined)
      ? await maintainAutonomousQueue({ db, candidates, actor, deadlineAt })
      : undefined;
  const transitioned = new Set(maintenance?.transitionedActionIds ?? []);

  const reports: ExecutionReport[] = [];
  const seen = new Set<string>();
  let deferredForBudget = 0;
  for (const action of candidates) {
    if (transitioned.has(action.id)) continue;
    if (reports.length >= limit) break;
    if (
      deadlineAt - Date.now() <
      (boundedWork
        ? EXECUTOR_LIMITS.minimumModelTimeoutMs +
          EXECUTOR_LIMITS.commitReserveMs
        : EXECUTOR_LIMITS.modelCallBudgetMs)
    ) {
      deferredForBudget = candidates.filter(
        row => !transitioned.has(row.id)
      ).length;
      break;
    }
    const payload = parseActionPayload(action.payload);
    const slug = payload
      ? resolveBlogSlug({
          actionId: action.id,
          actionType: action.actionType,
          agentSlug: action.agentSlug,
          title: action.title,
          description: action.description ?? "",
          payload,
        })
      : null;
    const key = slug
      ? pageChangeKey(action.actionType, `/blog/${slug}`)
      : action.actionType === "research_firm"
        ? "research_firm"
        : `invalid:${action.id}`;
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    try {
      reports.push(
        await executeQueuedAction(action.id, actor, { deadlineAt, boundedWork })
      );
    } catch (error: any) {
      reports.push({
        actionId: action.id,
        actionType: action.actionType,
        status: "failed",
        changed: false,
        summary: error?.message || "Execution failed",
      });
    }
  }

  return {
    considered: candidates.length,
    executed: reports.length,
    changed: reports.filter(r => r.changed).length,
    blocked: reports.filter(r => r.status === "blocked").length,
    failed: reports.filter(r => r.status === "failed").length,
    reports,
    maintenance,
    deferredForBudget,
  };
}

// ─── Rollback ─────────────────────────────────────────────────────────────────

/** Restore the exact prior field values stored on a completed action. */
export async function revertExecutedAction(
  actionId: number,
  actor: string
): Promise<{ summary: string }> {
  if (!Number.isSafeInteger(actionId) || actionId <= 0 || !actor?.trim())
    throw new Error("Invalid rollback action or actor.");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async tx => {
    await tx
      .select({ id: agentActions.id })
      .from(agentActions)
      .orderBy(asc(agentActions.id))
      .limit(1)
      .for("update");
    const [action] = await tx
      .select()
      .from(agentActions)
      .where(eq(agentActions.id, actionId))
      .limit(1)
      .for("update");
    if (!action || action.status !== "completed" || !action.result)
      throw new Error(
        "Only a completed action with its original rollback receipt can be reverted."
      );
    const running = await tx
      .select({ id: agentActions.id })
      .from(agentActions)
      .where(
        and(
          eq(agentActions.status, "running"),
          inArray(agentActions.actionType, EXECUTABLE_ACTION_TYPES)
        )
      )
      .limit(1)
      .for("update");
    if (running.length)
      throw new Error(
        "A typed action is running; wait before reverting a public change."
      );
    const parsed = parseActionPayload(action.result);
    const plan = parsed?.rollback as RollbackPlan | undefined;
    const after = parsed?.after;
    if (
      !plan ||
      plan.kind !== "blog_post_fields" ||
      canonicalBlogPath(plan.slug) !== `/blog/${plan.slug}` ||
      !plan.fields ||
      typeof plan.fields !== "object" ||
      Array.isArray(plan.fields) ||
      !after ||
      typeof after !== "object" ||
      Array.isArray(after)
    )
      throw new Error("This action has no valid stored rollback plan.");
    const keys = Object.keys(plan.fields);
    const allowed = ["metaTitle", "metaDescription", "content", "faqItems"];
    if (
      !keys.length ||
      keys.some(
        key =>
          !allowed.includes(key) ||
          (typeof plan.fields[key] !== "string" && plan.fields[key] !== null) ||
          (key === "content" && plan.fields[key] === null)
      )
    )
      throw new Error("Rollback contains unsupported fields or values.");
    const [post] = await tx
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, plan.slug))
      .limit(1)
      .for("update");
    if (!post || post.published !== 1)
      throw new Error("Rollback target is no longer a published stored page.");
    const before: Record<string, unknown> = {};
    for (const key of keys) {
      before[key] = post[key as keyof typeof post];
      if (
        !Object.hasOwn(after, key) ||
        before[key] !== (after as Record<string, unknown>)[key]
      )
        throw new Error(
          "Page changed after execution; rollback would overwrite a later edit. Review manually."
        );
    }
    const patch: BlogPatch = {};
    for (const key of keys) Object.assign(patch, { [key]: plan.fields[key] });
    const updated = await tx
      .update(blogPosts)
      .set({ ...patch, updatedAt: new Date() })
      .where(and(eq(blogPosts.id, post.id), eq(blogPosts.published, 1)));
    if (!affectedOne(updated))
      throw new Error("Rollback page write was not acknowledged.");
    const summary = `Reverted ${keys.join(", ")} on /blog/${plan.slug} to the pre-execution values.`;
    const result = await tx
      .update(agentActions)
      .set({
        status: "rejected",
        result: JSON.stringify({
          ...parsed,
          rollback: null,
          revertedBy: actor,
          revertedAt: new Date().toISOString(),
          revertBefore: before,
          revertAfter: patch,
          note: "Reverted by the owner. This action will not run again automatically.",
        }),
      })
      .where(
        and(
          eq(agentActions.id, actionId),
          eq(agentActions.status, "completed"),
          eq(agentActions.result, action.result)
        )
      );
    if (!affectedOne(result))
      throw new Error("Rollback receipt ownership was lost.");
    await tx.insert(seoChangeLog).values({
      changeType: "other",
      title: `Reverted — /blog/${plan.slug}`,
      description: summary,
      pagesAffected: JSON.stringify([`/blog/${plan.slug}`]),
      pageCount: 1,
      beforeSnapshot: JSON.stringify(before),
      afterSnapshot: JSON.stringify(patch),
      madeBy: actor,
      relatedActionId: actionId,
    });
    return { summary };
  });
}
