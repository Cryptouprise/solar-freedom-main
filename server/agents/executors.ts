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

import { desc, eq, inArray } from "drizzle-orm";
import * as cheerio from "cheerio";
import { getDb, getAdminBlogPost, updateBlogPost } from "../db";
import { agentActions, seoChangeLog } from "../../drizzle/schema";
import { callAgentLLM } from "./agentLLM";
import { updateAction } from "./engine";
import {
  isCanonicalBlogIndexed,
  isQuarantinedPath,
  INDEXABLE_BLOG_SLUGS,
  INDEXABLE_CITY_PATHS,
} from "../../client/src/data/indexEligibility";
import { PUBLIC_PATH_REDIRECTS } from "../seo-redirects";

// ─── Hard limits ──────────────────────────────────────────────────────────────
// These are structural, not stylistic. A patch outside them is rejected.

export const EXECUTOR_LIMITS = {
  metaTitleMinChars: 20,
  metaTitleMaxChars: 65,
  metaDescriptionMinChars: 70,
  metaDescriptionMaxChars: 165,
  maxInternalLinksPerAction: 3,
  maxFaqItemsPerAction: 3,
  faqAnswerMinChars: 60,
  faqAnswerMaxChars: 700,
  /** Number of actions one scheduled batch will execute. */
  defaultBatchSize: 5,
  maxBatchSize: 20,
} as const;

/**
 * Copy that must never be introduced by an automated edit. The site is a
 * consumer-information property, not a law firm, and it is recovering from a
 * penalty caused by unsupported claims.
 */
const BANNED_COPY_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bguarantee(d|s)?\b/i, label: "guaranteed outcome" },
  { pattern: /\blegal advice\b/i, label: "legal advice claim" },
  { pattern: /\bwe are (attorneys|lawyers)\b/i, label: "first-party attorney claim" },
  { pattern: /\bfree legal (review|consultation|advice)\b/i, label: "free legal review claim" },
  { pattern: /\b(will|can) win\b/i, label: "outcome promise" },
  { pattern: /\b100% (free|success|guaranteed)\b/i, label: "absolute claim" },
  { pattern: /\balways\b.{0,24}\bcancel\b/i, label: "universal cancellation claim" },
  { pattern: /\bany (solar )?contract can be (cancel|void)/i, label: "universal cancellation claim" },
];

export function findBannedCopy(value: string): string[] {
  return BANNED_COPY_PATTERNS.filter((rule) => rule.pattern.test(value)).map((rule) => rule.label);
}

// ─── Outcome types ────────────────────────────────────────────────────────────

export type RollbackPlan = {
  kind: "blog_post_fields";
  slug: string;
  /** Exact prior field values. Re-applying these restores the page. */
  fields: Record<string, string>;
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
    }
  | { status: "blocked"; reason: string };

export type ExecutorContext = {
  actionId: number;
  actionType: string;
  agentSlug: string;
  title: string;
  description: string;
  payload: Record<string, unknown>;
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

/** Pull a /blog/<slug> target out of the action payload or its prose. */
export function resolveBlogSlug(ctx: ExecutorContext): string | null {
  const candidates = [
    ctx.payload.pageSlug,
    ctx.payload.slug,
    ctx.payload.url,
    ctx.payload.page,
    ctx.payload.target,
  ].filter((value): value is string => typeof value === "string" && value.length > 0);

  const fromProse = `${ctx.title}\n${ctx.description}`.match(/\/blog\/([a-z0-9][a-z0-9-]{2,200})/i);
  if (fromProse) candidates.push(fromProse[0]);

  for (const candidate of candidates) {
    const path = candidate
      .replace(/^https?:\/\/[^/]+/i, "")
      .replace(/^\/+/, "")
      .split(/[?#]/)[0]
      .replace(/\/+$/, "");
    const slug = path.startsWith("blog/") ? path.slice("blog/".length) : path.includes("/") ? "" : path;
    if (slug && /^[a-z0-9][a-z0-9-]*$/i.test(slug)) return slug.toLowerCase();
  }
  return null;
}

type ResolvedTarget = {
  slug: string;
  pagePath: string;
  post: NonNullable<Awaited<ReturnType<typeof getAdminBlogPost>>>;
};

/**
 * Resolve and gate a target page. Everything an executor is allowed to touch
 * must pass through here.
 */
export async function resolveTarget(ctx: ExecutorContext): Promise<ResolvedTarget | ExecutionOutcome> {
  const slug = resolveBlogSlug(ctx);
  if (!slug) {
    return blocked(
      "No /blog/<slug> target could be resolved from this action. Only published blog pages have a typed executor.",
    );
  }

  const pagePath = `/blog/${slug}`;
  if (isQuarantinedPath(pagePath)) {
    return blocked(
      `${pagePath} is in the trust quarantine (held noindex pending a source-backed rewrite). Automated optimization is not applied to quarantined pages.`,
    );
  }
  if (!isCanonicalBlogIndexed(slug)) {
    return blocked(
      `${pagePath} is not index-eligible (missing from the canonical blog allowlist, or superseded by a redirect). Optimizing a noindex page cannot move rankings.`,
    );
  }

  const post = await getAdminBlogPost(slug);
  if (!post) return blocked(`${pagePath} was not found in the blog source of truth.`);
  if (post.published !== 1) return blocked(`${pagePath} is not published. Executors never publish content.`);

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
}): Promise<Record<string, unknown> | null> {
  const response = await callAgentLLM({
    agentSlug: params.agentSlug,
    executionMode: "scheduled",
    maxTokens: params.maxTokens ?? 900,
    messages: [
      { role: "system", content: PATCH_SYSTEM_PROMPT },
      { role: "user", content: params.instruction },
    ],
  });
  return parseJsonObject(response.content ?? "");
}

function textOf(html: string): string {
  return cheerio.load(html, undefined, false).root().text().replace(/\s+/g, " ").trim();
}

// ─── Executor: metadata rewrite ───────────────────────────────────────────────
// Covers meta_rewrite, meta_fix and title_optimization. Rewrites the title tag
// and meta description of an already-published, index-eligible page.

async function executeMetadataRewrite(ctx: ExecutorContext): Promise<ExecutionOutcome> {
  const target = await resolveTarget(ctx);
  if ("status" in target) return target;
  const { slug, pagePath, post } = target;

  const currentMetaTitle = post.metaTitle || post.title || "";
  const currentMetaDescription = post.metaDescription || post.excerpt || "";

  const patch = await requestPatch({
    agentSlug: ctx.agentSlug,
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

  if (!patch) return blocked("The model did not return a usable JSON metadata patch.");

  const metaTitle = typeof patch.metaTitle === "string" ? patch.metaTitle.trim() : "";
  const metaDescription = typeof patch.metaDescription === "string" ? patch.metaDescription.trim() : "";

  if (
    metaTitle.length < EXECUTOR_LIMITS.metaTitleMinChars ||
    metaTitle.length > EXECUTOR_LIMITS.metaTitleMaxChars
  ) {
    return blocked(
      `Proposed title tag is ${metaTitle.length} characters; the allowed range is ${EXECUTOR_LIMITS.metaTitleMinChars}-${EXECUTOR_LIMITS.metaTitleMaxChars}.`,
    );
  }
  if (
    metaDescription.length < EXECUTOR_LIMITS.metaDescriptionMinChars ||
    metaDescription.length > EXECUTOR_LIMITS.metaDescriptionMaxChars
  ) {
    return blocked(
      `Proposed meta description is ${metaDescription.length} characters; the allowed range is ${EXECUTOR_LIMITS.metaDescriptionMinChars}-${EXECUTOR_LIMITS.metaDescriptionMaxChars}.`,
    );
  }
  const banned = findBannedCopy(`${metaTitle} ${metaDescription}`);
  if (banned.length) {
    return blocked(`Proposed metadata contains disallowed copy (${banned.join(", ")}). Nothing was changed.`);
  }
  if (metaTitle === currentMetaTitle && metaDescription === currentMetaDescription) {
    return {
      status: "completed",
      changed: false,
      summary: `${pagePath} metadata already matches the proposed optimization; no change was written.`,
      before: { metaTitle: currentMetaTitle, metaDescription: currentMetaDescription },
      after: { metaTitle: currentMetaTitle, metaDescription: currentMetaDescription },
      pagePath,
    };
  }

  await updateBlogPost(slug, { metaTitle, metaDescription });

  return {
    status: "completed",
    changed: true,
    summary: `Rewrote the title tag and meta description on ${pagePath}.`,
    before: { metaTitle: currentMetaTitle, metaDescription: currentMetaDescription },
    after: { metaTitle, metaDescription, rationale: patch.rationale },
    rollback: {
      kind: "blog_post_fields",
      slug,
      fields: { metaTitle: currentMetaTitle, metaDescription: currentMetaDescription },
    },
    changeType: "meta_updated",
    pagePath,
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
    .filter((slug) => slug !== excludeSlug && isCanonicalBlogIndexed(slug))
    .map((slug) => `/blog/${slug}`);
  return [...blog, ...INDEXABLE_CITY_PATHS]
    .filter((path) => !isQuarantinedPath(path))
    .filter((path) => !Object.hasOwn(PUBLIC_PATH_REDIRECTS, path))
    .sort();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function executeInternalLinks(ctx: ExecutorContext): Promise<ExecutionOutcome> {
  const target = await resolveTarget(ctx);
  if ("status" in target) return target;
  const { slug, pagePath, post } = target;

  const originalContent = post.content || "";
  if (!originalContent.trim().startsWith("<")) {
    return blocked(`${pagePath} body is not stored as HTML, so links cannot be inserted safely.`);
  }

  const allowed = allowedInternalTargets(slug);
  const patch = await requestPatch({
    agentSlug: ctx.agentSlug,
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

  if (!patch) return blocked("The model did not return a usable JSON link patch.");
  const proposed = Array.isArray(patch.links) ? patch.links : [];
  if (!proposed.length) return blocked("The model proposed no internal links.");

  const allowedSet = new Set(allowed);
  const $ = cheerio.load(originalContent, undefined, false);
  const beforeInternalLinks = $('a[href^="/"]').length;
  const applied: Array<{ anchorText: string; href: string }> = [];
  const rejected: string[] = [];

  for (const raw of proposed.slice(0, EXECUTOR_LIMITS.maxInternalLinksPerAction)) {
    const anchorText = typeof (raw as any)?.anchorText === "string" ? (raw as any).anchorText.trim() : "";
    const href = typeof (raw as any)?.href === "string" ? (raw as any).href.trim() : "";
    const words = anchorText ? anchorText.split(/\s+/).length : 0;

    if (!anchorText || words < 2 || words > 8) {
      rejected.push(`"${anchorText}": anchor text must be 2-8 words`);
      continue;
    }
    if (!allowedSet.has(href)) {
      rejected.push(`"${anchorText}": ${href} is not an allowed live destination`);
      continue;
    }
    if (findBannedCopy(anchorText).length) {
      rejected.push(`"${anchorText}": disallowed copy in anchor text`);
      continue;
    }
    if ($(`a[href="${href}"]`).length) {
      rejected.push(`"${anchorText}": ${href} is already linked from this page`);
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
        `<a href="${href}">${anchorText}</a>`,
      );
      if (replaced === html) return;
      node.html(replaced);
      applied.push({ anchorText, href });
      done = true;
    });
    if (!done) rejected.push(`"${anchorText}": exact phrase not found as plain text in the page body`);
  }

  if (!applied.length) {
    return blocked(
      `No proposed internal link could be applied safely. ${rejected.join("; ") || "No reason recorded."}`,
    );
  }

  const nextContent = $.html();
  const beforeText = textOf(originalContent);
  const afterText = textOf(nextContent);
  if (afterText.length < beforeText.length) {
    return blocked(
      `Link insertion would have reduced page text from ${beforeText.length} to ${afterText.length} characters. Nothing was changed.`,
    );
  }

  await updateBlogPost(slug, { content: nextContent });

  return {
    status: "completed",
    changed: true,
    summary: `Added ${applied.length} contextual internal link${applied.length === 1 ? "" : "s"} to ${pagePath}.`,
    before: { internalLinkCount: beforeInternalLinks, textLength: beforeText.length },
    after: {
      internalLinkCount: beforeInternalLinks + applied.length,
      linksAdded: applied,
      rejected,
      textLength: afterText.length,
    },
    rollback: { kind: "blog_post_fields", slug, fields: { content: originalContent } },
    changeType: "link_added",
    pagePath,
  };
}

// ─── Executor: FAQ / schema ───────────────────────────────────────────────────
// Covers faq_addition and schema_markup. Appends FAQ entries, which drive both
// the rendered FAQ section and the FAQPage JSON-LD (server/seo-meta.ts).

function normalizeQuestion(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function parseFaqItems(value: unknown): Array<{ q: string; a: string }> {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is { q: string; a: string } =>
        !!item && typeof (item as any).q === "string" && typeof (item as any).a === "string",
    );
  } catch {
    return [];
  }
}

async function executeFaqAddition(ctx: ExecutorContext): Promise<ExecutionOutcome> {
  const target = await resolveTarget(ctx);
  if ("status" in target) return target;
  const { slug, pagePath, post } = target;

  const existing = parseFaqItems(post.faqItems);

  const patch = await requestPatch({
    agentSlug: ctx.agentSlug,
    instruction: [
      `PAGE: ${pagePath}`,
      `REQUESTED CHANGE: ${ctx.title}\n${ctx.description}`.slice(0, 1200),
      `PAGE TEXT: ${textOf(post.content || "").slice(0, 5000)}`,
      "",
      "EXISTING QUESTIONS (do not repeat these):",
      existing.map((item) => `- ${item.q}`).join("\n") || "- none",
      "",
      `Add at most ${EXECUTOR_LIMITS.maxFaqItemsPerAction} genuinely new questions a homeowner would search for, each answerable from the page's own subject matter.`,
      `Each answer must be ${EXECUTOR_LIMITS.faqAnswerMinChars}-${EXECUTOR_LIMITS.faqAnswerMaxChars} characters, factual, and hedged where the answer depends on the contract.`,
      'Return JSON: {"faq":[{"q": string, "a": string}]}',
    ].join("\n"),
    maxTokens: 1200,
  });

  if (!patch) return blocked("The model did not return a usable JSON FAQ patch.");
  const proposed = Array.isArray(patch.faq) ? patch.faq : [];
  if (!proposed.length) return blocked("The model proposed no new FAQ entries.");

  const seen = new Set(existing.map((item) => normalizeQuestion(item.q)));
  const additions: Array<{ q: string; a: string }> = [];
  const rejected: string[] = [];

  for (const raw of proposed.slice(0, EXECUTOR_LIMITS.maxFaqItemsPerAction)) {
    const q = typeof (raw as any)?.q === "string" ? (raw as any).q.trim() : "";
    const a = typeof (raw as any)?.a === "string" ? (raw as any).a.trim() : "";
    if (!q || !q.endsWith("?")) {
      rejected.push(`"${q}": question must end with a question mark`);
      continue;
    }
    if (a.length < EXECUTOR_LIMITS.faqAnswerMinChars || a.length > EXECUTOR_LIMITS.faqAnswerMaxChars) {
      rejected.push(`"${q}": answer is ${a.length} characters, outside the allowed range`);
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
    seen.add(normalizeQuestion(q));
    additions.push({ q, a });
  }

  if (!additions.length) {
    return blocked(`No proposed FAQ entry passed validation. ${rejected.join("; ") || "No reason recorded."}`);
  }

  const nextFaq = [...existing, ...additions];
  await updateBlogPost(slug, { faqItems: JSON.stringify(nextFaq) });

  return {
    status: "completed",
    changed: true,
    summary: `Added ${additions.length} FAQ entr${additions.length === 1 ? "y" : "ies"} to ${pagePath}, extending its FAQPage schema.`,
    before: { faqCount: existing.length },
    after: { faqCount: nextFaq.length, added: additions, rejected },
    rollback: { kind: "blog_post_fields", slug, fields: { faqItems: JSON.stringify(existing) } },
    changeType: "schema_updated",
    pagePath,
  };
}

// ─── Executor: attorney research (pre-existing behaviour) ─────────────────────

async function executeResearchFirm(ctx: ExecutorContext): Promise<ExecutionOutcome> {
  const { executeAttorneyResearch } = await import("./attorneyResearch");
  const states =
    Array.isArray(ctx.payload.states) && ctx.payload.states.length
      ? (ctx.payload.states as string[]).slice(0, 5)
      : ["California", "Texas", "Florida"];
  const result = await executeAttorneyResearch(states);
  const isBlocked =
    typeof result === "object" && result !== null && (result as { status?: string }).status === "blocked";
  if (isBlocked) {
    return blocked(
      (result as { reason?: string }).reason || "Attorney research is blocked by its upstream provider.",
    );
  }
  return {
    status: "completed",
    changed: true,
    summary: `Ran attorney research across ${states.join(", ")}.`,
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
  return ACTION_EXECUTORS[actionType] ?? null;
}

export function isExecutable(actionType: string): boolean {
  return actionType in ACTION_EXECUTORS;
}

export const EXECUTABLE_ACTION_TYPES = Object.keys(ACTION_EXECUTORS).sort();

/**
 * Action types agents create that intentionally have NO executor. Kept explicit
 * so the admin queue can state why an action is advisory instead of leaving an
 * opaque "queued" row.
 */
export const ADVISORY_ACTION_TYPES: Record<string, string> = {
  publish_content: "Publishing a new page is a human decision while the site is in penalty recovery.",
  content_gap: "Filling a content gap creates a new page; review and publish it from Blog Studio.",
  backlink_needed: "Backlinks are off-site and need outreach a typed adapter cannot perform.",
  technical_fix: "Technical fixes touch application code and ship through Git, not the action queue.",
  cta_rewrite: "Call-to-action copy lives in the React components, not in stored page content.",
  position_push: "This is an analysis directive, not a single concrete page change.",
  revenue_optimization: "Advisory revenue analysis for the owner to act on.",
  system_improvement: "Infrastructure suggestion; ships through Git.",
  error_fix: "Infrastructure repair; ships through Git.",
  gsc_data_sync: "Handled by the Search Console refresh job, not the action queue.",
  score_prospect: "Prospect scoring runs inside the Money Maker cycle.",
  recommend_outreach: "Outreach stays draft-and-approve only; nothing is sent automatically.",
  content_directive: "A directive to another agent, not a page change.",
  lead_delivery_fix: "Lead routing changes require owner confirmation.",
};

export function describeUnexecutable(actionType: string): string {
  return (
    ADVISORY_ACTION_TYPES[actionType] ??
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

/**
 * Execute one queued action. This is the only path that applies an agent
 * recommendation to the live site, and it is shared by the admin mutation and
 * the scheduled batch runner so both behave identically.
 */
export async function executeQueuedAction(actionId: number, actor: string): Promise<ExecutionReport> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [action] = await db.select().from(agentActions).where(eq(agentActions.id, actionId)).limit(1);
  if (!action) throw new Error("Action not found");
  if (action.requiresApproval && action.status !== "approved") {
    throw new Error("This action needs approval before it can run");
  }

  const executor = getExecutor(action.actionType);
  if (!executor) {
    const reason = describeUnexecutable(action.actionType);
    await updateAction(actionId, {
      status: "blocked",
      result: JSON.stringify({ reason, advisory: true }),
      completedAt: new Date(),
    });
    return { actionId, actionType: action.actionType, status: "blocked", changed: false, summary: reason };
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = action.payload ? (JSON.parse(action.payload) as Record<string, unknown>) : {};
  } catch {
    payload = {};
  }

  const startedAt = new Date();
  await db
    .update(agentActions)
    .set({ status: "running", startedAt, errorMessage: null })
    .where(eq(agentActions.id, actionId));

  try {
    const outcome = await executor.run({
      actionId,
      actionType: action.actionType,
      agentSlug: action.agentSlug,
      title: action.title,
      description: action.description ?? "",
      payload,
    });

    if (outcome.status === "blocked") {
      await updateAction(actionId, {
        status: "blocked",
        result: JSON.stringify({ reason: outcome.reason }),
        completedAt: new Date(),
        durationMs: Date.now() - startedAt.getTime(),
      });
      return {
        actionId,
        actionType: action.actionType,
        status: "blocked",
        changed: false,
        summary: outcome.reason,
      };
    }

    await updateAction(actionId, {
      status: "completed",
      result: JSON.stringify({
        summary: outcome.summary,
        changed: outcome.changed,
        pagePath: outcome.pagePath,
        before: outcome.before,
        after: outcome.after,
        rollback: outcome.rollback ?? null,
        executedBy: actor,
      }),
      completedAt: new Date(),
      durationMs: Date.now() - startedAt.getTime(),
    });

    // Record the change so SEO Intel can correlate it with ranking movement.
    if (outcome.changed && outcome.pagePath) {
      await db.insert(seoChangeLog).values({
        changeType: (outcome.changeType ?? "other") as any,
        title: `${executor.label} — ${outcome.pagePath}`,
        description: outcome.summary,
        pagesAffected: JSON.stringify([outcome.pagePath]),
        pageCount: 1,
        beforeSnapshot: JSON.stringify(outcome.before),
        afterSnapshot: JSON.stringify(outcome.after),
        madeBy: action.agentSlug,
        relatedActionId: actionId,
      });
    }

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
    await updateAction(actionId, {
      status: "failed",
      errorMessage: String(message).slice(0, 1000),
      completedAt: new Date(),
      durationMs: Date.now() - startedAt.getTime(),
    });
    return { actionId, actionType: action.actionType, status: "failed", changed: false, summary: message };
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
};

/**
 * Pick up ready actions and execute them. "Ready" means queued (and not gated on
 * approval) or explicitly approved, and of a type that has a typed executor.
 * Runs sequentially so one batch cannot fan out into concurrent site writes.
 */
export async function runQueuedActionExecutions(options?: {
  limit?: number;
  actor?: string;
}): Promise<BatchReport> {
  const limit = Math.max(
    1,
    Math.min(options?.limit ?? EXECUTOR_LIMITS.defaultBatchSize, EXECUTOR_LIMITS.maxBatchSize),
  );
  const actor = options?.actor ?? "scheduled_executor";
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const candidates = await db
    .select()
    .from(agentActions)
    .where(inArray(agentActions.status, ["queued", "approved"]))
    .orderBy(agentActions.priority, desc(agentActions.createdAt))
    .limit(200);

  const ready = candidates.filter(
    (action) => isExecutable(action.actionType) && (!action.requiresApproval || action.status === "approved"),
  );

  const reports: ExecutionReport[] = [];
  for (const action of ready.slice(0, limit)) {
    try {
      reports.push(await executeQueuedAction(action.id, actor));
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
    considered: ready.length,
    executed: reports.length,
    changed: reports.filter((r) => r.changed).length,
    blocked: reports.filter((r) => r.status === "blocked").length,
    failed: reports.filter((r) => r.status === "failed").length,
    reports,
  };
}

// ─── Rollback ─────────────────────────────────────────────────────────────────

/** Restore the exact prior field values stored on a completed action. */
export async function revertExecutedAction(actionId: number, actor: string): Promise<{ summary: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [action] = await db.select().from(agentActions).where(eq(agentActions.id, actionId)).limit(1);
  if (!action) throw new Error("Action not found");

  let parsed: { rollback?: RollbackPlan | null; summary?: string } = {};
  try {
    parsed = action.result ? JSON.parse(action.result) : {};
  } catch {
    parsed = {};
  }
  const plan = parsed.rollback;
  if (!plan || plan.kind !== "blog_post_fields" || !plan.slug) {
    throw new Error("This action has no stored rollback plan.");
  }

  await updateBlogPost(plan.slug, plan.fields as any);
  const summary = `Reverted ${Object.keys(plan.fields).join(", ")} on /blog/${plan.slug} to the pre-execution values.`;

  // "rejected" is terminal: the batch runner only picks up queued/approved rows,
  // so a reverted change is never silently re-applied on the next cron tick.
  await updateAction(actionId, {
    status: "rejected",
    result: JSON.stringify({
      ...parsed,
      rollback: null,
      revertedBy: actor,
      revertedAt: new Date().toISOString(),
      note: "Reverted by the owner. This action will not run again automatically.",
    }),
  });

  await db.insert(seoChangeLog).values({
    changeType: "other" as any,
    title: `Reverted — /blog/${plan.slug}`,
    description: summary,
    pagesAffected: JSON.stringify([`/blog/${plan.slug}`]),
    pageCount: 1,
    beforeSnapshot: JSON.stringify(parsed.summary ?? null),
    afterSnapshot: JSON.stringify(plan.fields),
    madeBy: actor,
    relatedActionId: actionId,
  });

  return { summary };
}
