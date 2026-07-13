/**
 * Server-Side SEO Meta Injection
 *
 * This module builds a lookup map of all site URLs → {title, description, canonical}
 * and injects the correct meta tags into index.html before serving it to Googlebot.
 *
 * WHY THIS EXISTS:
 * This is a React SPA. Without this module, every URL returns the same index.html
 * with the homepage title/description. Googlebot can't run JavaScript, so it sees
 * every page as a duplicate of the homepage — causing "Soft 404" errors in GSC
 * and preventing 283+ pages from being indexed.
 *
 * HOW IT WORKS:
 * 1. At server startup, buildMetaMap() creates a Record<path, MetaEntry> from all data files
 * 2. serveWithMeta() intercepts every request, looks up the path, and injects correct meta
 * 3. Googlebot receives unique, meaningful content for each URL
 *
 * LESSON LEARNED: Always implement this from day one on any React SPA that needs SEO.
 * See docs/lessons-learned/01-spa-soft-404-seo.md for full details.
 */

import * as cheerio from "cheerio";
import { suppressUnverifiedFirstPartyClaims, suppressUnverifiedQuoteMarkup } from "@shared/contentGovernance";
import { cities } from "../client/src/data/cities";
import { companies } from "../client/src/data/companies";
import { hasPublishableStateLawEvidence, stateLaws } from "../client/src/data/state-laws";
import { blogPosts } from "../client/src/data/blog";
import {
  hasPublishableEditorialReview,
  isBlogPostPublishable,
  PUBLICATION_PENDING_COPY,
} from "../client/src/data/publication-governance";
import { sanitizeStoredHtml } from "./security/html";
import { logSafeError } from "./_core/safeLog";

const BASE_URL = "https://breakyoursolarcontract.com";

export interface MetaEntry {
  title: string;
  description: string;
  canonical: string;
  noindex?: boolean;
}

let _metaMap: Record<string, MetaEntry> | null = null;

export function buildMetaMap(): Record<string, MetaEntry> {
  if (_metaMap) return _metaMap;

  const map: Record<string, MetaEntry> = {};

  // ─── Static pages ────────────────────────────────────────────────────────────
  const staticPages: Record<string, { title: string; description: string }> = {
    "/": {
      title: "Solar Contract Record Review & Consumer Resources | Solar Freedom",
      description:
        "Review solar contract terms, gather the right records, and explore possible next steps. Options depend on your agreement, facts, and jurisdiction.",
    },
    "/blog": {
      title: "Solar Contract Editorial Library | Solar Freedom",
      description:
        "Source-reviewed solar agreement guides, document checklists, and official consumer resources.",
    },
    "/how-it-works": {
      title: "How Solar Contract Document Review Works | Solar Freedom",
      description:
        "Learn how to organize an agreement, disclosures, financing records, and communications for an individual document review.",
    },
    "/solar-contract-help": {
      title: "Solar Contract Help: Records and Questions to Review | Solar Freedom",
      description:
        "Review solar contract terms, rescission information, financing disputes, UCC filings, and records to gather before requesting an individual review.",
    },
    "/solar-panel-scam": {
      title: "Solar Sales & Financing Record Checklist | Solar Freedom",
      description:
        "Review warning signs involving solar sales representations, financing terms, tax-credit statements, fees, and property filings.",
    },
    "/sunrun": {
      title:
        "Sunrun Solar Contract Review | Solar Freedom",
      description:
        "Review Sunrun contract terms, escalator provisions, complaint resources, and records to gather before requesting an individual case review.",
    },
    "/solar-exit-options": {
      title: "Solar Exit Options: Documents and Questions to Review | Solar Freedom",
      description:
        "Compare possible solar-contract paths and the documents, limits, and risks to review before deciding what to do next.",
    },
    "/solar-lien-removal": {
      title: "Solar Lien Record Review | PACE Assessments & UCC Filings",
      description:
        "Learn how a UCC-1 fixture filing may affect a home sale or refinance and which records to gather before requesting an individual review.",
    },
    "/solar-loan-help": {
      title: "Solar Loan Document Review | Payment, Disclosure & Payoff Records",
      description:
        "Review solar loan terms, disclosures, dealer fees, and consumer resources. Available options depend on the documents and applicable law.",
    },
    "/selling-house-with-solar": {
      title: "Selling a House With Solar Panels & a Loan | Solar Freedom",
      description:
        "Review transfer, payoff, financing, and UCC-filing questions that may arise when selling a home with solar equipment.",
    },
    "/solar-contract-laws": {
      title: "Solar Contract Research by State | Solar Freedom",
      description:
        "Use official federal and state consumer resources and view state detail pages only after their source and editorial-review records are complete.",
    },
    "/solar-companies": {
      title:
        "Solar Company Agreement Research Hub | Solar Freedom",
      description:
        "Organize company agreement records and locate official consumer resources. Company-specific claims remain withheld until source-reviewed.",
    },
    "/media": {
      title: "Solar Contract Truth Hub — Watch & Listen | Solar Freedom",
      description:
        "Watch solar agreement explainers and podcast discussions covering educational scenarios, records to gather, and questions to investigate.",
    },
    "/watch": {
      title: "Solar Contract Videos & Podcast | Solar Freedom",
      description:
        "Watch educational videos and podcast episodes about solar agreements, financing documents, consumer resources, and review questions.",
    },
    "/sitemap": {
      title: "Site Map — Publication-Eligible Pages | Solar Freedom",
      description:
        "Browse search-publication-eligible Solar Freedom resources. Unreviewed research backlogs are intentionally omitted.",
    },
    "/privacy-policy": {
      title: "Privacy Policy | Solar Freedom",
      description:
        "How Solar Freedom collects, uses, shares, and protects information submitted through this website.",
    },
    "/terms": {
      title: "Terms of Use | Solar Freedom",
      description:
        "Rules and important limitations for using the Solar Freedom website, educational content, intake forms, and scheduling tools.",
    },
  };

  for (const [path, meta] of Object.entries(staticPages)) {
    map[path] = { ...meta, canonical: BASE_URL + path };
  }

  // ─── Company cancel pages ─────────────────────────────────────────────────
  for (const company of companies) {
    const path = `/cancel-${company.slug}-solar-contract`;
    const publishable = hasPublishableEditorialReview(company);
    map[path] = {
      title: publishable
        ? `Cancel ${company.name} Solar Contract | Solar Freedom`
        : `${company.name} Solar Contract Research Status | Solar Freedom`,
      description: publishable
        ? `Review ${company.name} solar contract terms, complaint resources, and records to gather before requesting an individual case review.`
        : `This ${company.name} research page is withheld from search until primary sources, as-of dates, an editorial reviewer, and unique user value are recorded.`,
      canonical: BASE_URL + path,
      noindex: !publishable,
    };
  }

  // ─── City pages ───────────────────────────────────────────────────────────
  for (const city of cities) {
    const path = `/cancel-solar-contract/${city.slug}`;
    const publishable = hasPublishableEditorialReview(city);
    map[path] = {
      title: publishable
        ? `Cancel Solar Contract in ${city.name}, ${city.stateCode} | Solar Freedom`
        : `${city.name}, ${city.stateCode} Solar Contract Research Status | Solar Freedom`,
      description: publishable
        ? `Review solar contract terms and consumer resources for ${city.name}, ${city.stateCode}. Options and timing depend on your agreement, facts, and jurisdiction.`
        : `This ${city.name}, ${city.stateCode} research page is withheld from search until primary sources, as-of dates, an editorial reviewer, and unique local value are recorded.`,
      canonical: BASE_URL + path,
      noindex: !publishable,
    };
  }

  // ─── State law pages ──────────────────────────────────────────────────────
  for (const law of stateLaws) {
    const path = `/solar-contract-laws/${law.slug}`;
    const publishable = hasPublishableStateLawEvidence(law);
    const title = publishable && law.metaTitle
      ? `${law.metaTitle} | Solar Freedom`
      : `${law.state} Solar Contract Research Status | Solar Freedom`;
    const description = publishable
      ? `Review source-checked solar-contract consumer information for ${law.state}. Options depend on the agreement, facts, jurisdiction, and current law.`
      : `This ${law.state} research page is withheld from search until official primary sources and an editorial reviewer are recorded.`;
    map[path] = { title, description, canonical: BASE_URL + path, noindex: !publishable };
  }

  // ─── Blog posts ───────────────────────────────────────────────────────────
  for (const post of blogPosts) {
    const path = `/blog/${post.slug}`;
    const publishable = isBlogPostPublishable(post);
    map[path] = {
      title: publishable
        ? `${post.metaTitle} | Solar Freedom`
        : "Article Under Editorial Review | Solar Freedom",
      description: publishable
        ? suppressUnverifiedFirstPartyClaims(post.metaDescription)
        : PUBLICATION_PENDING_COPY,
      canonical: BASE_URL + path,
      noindex: !publishable,
    };
  }

  _metaMap = map;
  console.log(`[SEO] Meta map built: ${Object.keys(map).length} URLs`);
  return map;
}

function applyMetaEntry(html: string, meta: MetaEntry): string {
  const $ = cheerio.load(html);
  $("title").text(meta.title);
  $('meta[name="description"]').attr("content", meta.description);
  $('link[rel="canonical"]').remove();
  $("head").append(`<link rel="canonical" href="${meta.canonical}" />`);
  $('meta[property="og:url"]').attr("content", meta.canonical);
  $('meta[property="og:title"]').attr("content", meta.title);
  $('meta[property="og:description"]').attr("content", meta.description);
  $('meta[name="twitter:title"]').attr("content", meta.title);
  $('meta[name="twitter:description"]').attr("content", meta.description);
  $('meta[name="robots"]').remove();
  $("head").append(
    `<meta name="robots" content="${meta.noindex ? "noindex, follow" : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"}">`
  );
  return $.html();
}

/**
 * Inject page-specific meta tags into the index.html string.
 * Uses cheerio (server-side DOM parser) instead of regex for robust handling
 * of Vite-built HTML which may have different attribute ordering/whitespace.
 *
 * Replaces: <title>, meta description, canonical, og:url, og:title, og:description,
 *           twitter:title, twitter:description
 */
export function injectMeta(html: string, path: string): string {
  const map = buildMetaMap();

  // Normalize path: strip trailing slash (except root), strip query string
  const normalizedPath =
    path === "/" ? "/" : path.replace(/\/$/, "").split("?")[0];

  const meta = map[normalizedPath];
  if (!meta) return html; // Unknown path — serve as-is (homepage meta is fine)
  return applyMetaEntry(html, meta);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

type DynamicBlogPost = {
  slug: string;
  title: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  excerpt?: string | null;
  content: string;
  category?: string | null;
  canonicalUrl?: string | null;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  faqItems?: unknown;
};

function safeIsoDate(value: unknown): string | undefined {
  if (!value) return undefined;
  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function renderDbPostContent(rawContent: string): string {
  const content = rawContent.trim();
  if (!content) return "<p>This article is being prepared for publication.</p>";

  if (content.startsWith("<")) {
    return suppressUnverifiedFirstPartyClaims(suppressUnverifiedQuoteMarkup(sanitizeStoredHtml(content)));
  }

  // Preserve useful source-visible structure for the occasional Markdown/plain
  // post without introducing a second Markdown runtime into the request path.
  return content
    .split(/\n{2,}/)
    .map(block => {
      const normalized = block.trim();
      if (!normalized) return "";
      const heading = normalized.match(/^(#{2,3})\s+([\s\S]+)$/);
      if (heading) {
        const level = heading[1].length;
        return `<h${level}>${escapeHtml(heading[2].trim())}</h${level}>`;
      }
       return `<p>${escapeHtml(suppressUnverifiedFirstPartyClaims(normalized)).replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");
}

function normalizeFaqItems(value: unknown): Array<{ q: string; a: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => {
      const candidate = item as Record<string, unknown>;
      return {
        q: String(candidate.q ?? candidate.question ?? "").trim(),
        a: suppressUnverifiedFirstPartyClaims(String(candidate.a ?? candidate.answer ?? "").trim()),
      };
    })
    .filter(item => item.q && item.a);
}

/**
 * Render a database-published article into the initial response. The React app
 * still takes over for interaction, but crawlers and no-JS readers receive the
 * same title, article body, FAQs, and Article schema immediately.
 */
export function renderDbBlogPost(
  html: string,
  pagePath: string,
  post: DynamicBlogPost
): string {
  const title = post.metaTitle || post.title;
  const description = suppressUnverifiedFirstPartyClaims(
    post.metaDescription ||
    post.excerpt ||
    "Solar contract information from Solar Freedom."
  );
  const canonical =
    post.canonicalUrl?.startsWith(`${BASE_URL}/`)
      ? post.canonicalUrl
      : `${BASE_URL}${pagePath}`;
  const faq = normalizeFaqItems(post.faqItems);
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description,
    mainEntityOfPage: canonical,
    datePublished: safeIsoDate(post.publishedAt),
    dateModified: safeIsoDate(post.updatedAt ?? post.publishedAt),
    publisher: { "@type": "Organization", name: "Solar Freedom", url: BASE_URL },
  };
  const schemas: object[] = [articleSchema];
  if (faq.length) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map(item => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    });
  }

  const body = renderDbPostContent(post.content);
  const faqHtml = faq.length
    ? `<section aria-labelledby="dynamic-faq"><h2 id="dynamic-faq">Frequently asked questions</h2>${faq
        .map(item => `<h3>${escapeHtml(item.q)}</h3><p>${escapeHtml(item.a)}</p>`)
        .join("")}</section>`
    : "";
  const semanticArticle = `<div id="root"><main class="seo-server-rendered" data-content-source="database"><nav><a href="/">Home</a> / <a href="/blog">Blog</a></nav><article><p>${escapeHtml(post.category || "Solar contract guide")}</p><h1>${escapeHtml(post.title)}</h1>${post.excerpt ? `<p>${escapeHtml(suppressUnverifiedFirstPartyClaims(post.excerpt))}</p>` : ""}<div class="article-body">${body}</div>${faqHtml}</article></main></div>`;

  const $ = cheerio.load(html);
  $("title").text(`${title} | Solar Freedom`);
  $('meta[name="description"]').attr("content", description);
  $('link[rel="canonical"]').remove();
  $("head").append(`<link rel="canonical" href="${escapeHtml(canonical)}">`);
  $('meta[property="og:url"]').attr("content", canonical);
  $('meta[property="og:title"]').attr("content", title);
  $('meta[property="og:description"]').attr("content", description);
  $('meta[name="twitter:title"]').attr("content", title);
  $('meta[name="twitter:description"]').attr("content", description);
  $("head").append(
    `<script type="application/ld+json">${JSON.stringify(schemas).replace(/</g, "\\u003c")}</script>`
  );
  $("#root").replaceWith(semanticArticle);
  return $.html();
}

/**
 * Async version of injectMeta that also handles DB-published blog posts.
 *
 * DB posts are created after the build, so they don't have pre-rendered HTML files
 * and aren't in the static meta map. This function does a live DB lookup for
 * /blog/* paths that aren't in the static map, ensuring Googlebot always gets
 * the correct title and meta description even for newly published DB posts.
 */
export async function injectMetaDynamic(
  html: string,
  path: string
): Promise<string> {
  const map = buildMetaMap();

  // Normalize path: strip trailing slash (except root), strip query string
  const normalizedPath =
    path === "/" ? "/" : path.replace(/\/$/, "").split("?")[0];

  let meta = map[normalizedPath];

  // If not in static map and it's a blog path, try DB lookup
  if (!meta && normalizedPath.startsWith("/blog/")) {
    try {
      const { getDbBlogPost } = await import("./db");
      const slug = normalizedPath.replace("/blog/", "");
      const post = await getDbBlogPost(slug);
      if (post && isBlogPostPublishable(post)) {
        return renderDbBlogPost(html, normalizedPath, post);
      }
      if (post) {
        meta = {
          title: "Article Under Editorial Review | Solar Freedom",
          description: PUBLICATION_PENDING_COPY,
          canonical: `${BASE_URL}${normalizedPath}`,
          noindex: true,
        };
      }
    } catch (err) {
      logSafeError("seo.db_lookup_failed", err);
    }
  }

  if (!meta) return html; // Unknown path — serve as-is
  return applyMetaEntry(html, meta);
}
