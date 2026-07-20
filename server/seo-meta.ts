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
import { stateLaws } from "../client/src/data/state-laws";
import { blogPosts } from "../client/src/data/blog";
import { INDEXED_CITY_SLUGS } from "../client/src/data/indexed-cities";
import { sanitizeStoredHtml } from "./security/html";  // server/security/html.ts

const BASE_URL = "https://breakyoursolarcontract.com";

interface MetaEntry {
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
      title: "Cancel Your Solar Contract | Solar Freedom",
      description:
        "Trapped in a solar contract? Solar Freedom helps homeowners review their options, understand their rights, and connect with consumer protection attorneys. Free case review.",
    },
    "/blog": {
      title: "Solar Contract Cancellation Blog | Guides & Legal Tips | Solar Freedom",
      description:
        "In-depth guides on canceling solar contracts with Sunrun, GoodLeap, SunPower, Tesla Solar & more. Learn your rights, cancellation grounds, and next steps.",
    },
    "/how-it-works": {
      title: "How to Cancel a Solar Contract | Step-by-Step Process | Solar Freedom",
      description:
        "Learn how Solar Freedom reviews solar contracts, identifies legal grounds for cancellation, and connects homeowners with consumer protection attorneys. Free case review.",
    },
    "/solar-contract-help": {
      title: "Solar Contract Help | Legal Options to Cancel | Solar Freedom",
      description:
        "Review solar contract terms, rescission information, financing disputes, UCC filings, and records to gather before requesting an individual review.",
    },
    "/solar-panel-scam": {
      title: "Solar Panel Scam Warning Signs | Solar Freedom",
      description:
        "Learn the solar panel scam warning signs, from fake tax credit promises to hidden loan fees and liens. Free solar contract review.",
    },
    "/sunrun": {
      title:
        "Sunrun Solar Contract Review | Solar Freedom",
      description:
        "Review Sunrun contract terms, escalator provisions, complaint resources, and records to gather before requesting an individual case review.",
    },
    "/solar-exit-options": {
      title: "Solar Exit Options | How to Get Out of a Solar Contract",
      description:
        "Compare possible solar-contract paths and the documents, limits, and risks to review before deciding what to do next.",
    },
    "/solar-lien-removal": {
      title: "Solar Lien Removal | Remove a UCC-1 Solar Lien From Your Home",
      description:
        "Learn how a UCC-1 fixture filing may affect a home sale or refinance and which records to gather before requesting an individual review.",
    },
    "/solar-loan-help": {
      title: "Solar Loan Help | Fight Back Against Predatory Solar Loans",
      description:
        "Review solar loan terms, disclosures, dealer fees, and consumer resources. Available options depend on the documents and applicable law.",
    },
    "/selling-house-with-solar": {
      title: "Selling a House With Solar Panels & a Loan | Solar Freedom",
      description:
        "Review transfer, payoff, financing, and UCC-filing questions that may arise when selling a home with solar equipment.",
    },
    "/solar-contract-laws": {
      title: "Solar Contract Laws by State | Your Legal Rights",
      description:
        "Every state has different solar contract laws. Find your state's cooling-off period, consumer protection statutes, and cancellation rights.",
    },
    "/solar-companies": {
      title: "Solar Company Cancellation Guides 2026 | Sunrun, GoodLeap, SunPower & More",
      description:
        "How to cancel contracts with Sunrun, SunPower, Vivint Solar, Freedom Forever, GoodLeap, Sunnova, Tesla Solar & more. BBB ratings, complaint data, and legal grounds explained.",
    },
    "/media": {
      title: "Solar Contract Truth Hub — Watch & Listen | Solar Freedom",
      description:
        "Watch explainer videos and listen to the Elite Solar Recovery Podcast. Real cases, real outcomes — Sunrun, SunPower, GoodLeap, Pink Energy cancellations. Free 15-min case audit.",
    },
    "/watch": {
      title: "Solar Contract Videos & Podcast | Solar Freedom",
      description:
        "Explainer videos and podcast episodes on solar contract cancellation, loan reduction, and credit restoration. Learn your rights and get a free case audit.",
    },
    "/sitemap": {
      title: "Site Map — All Pages | Solar Freedom",
      description:
        "Browse the Solar Freedom website directory, including service, company, city, state-law, and blog pages.",
    },
  };

  for (const [path, meta] of Object.entries(staticPages)) {
    map[path] = { ...meta, canonical: BASE_URL + path };
  }

  // ─── Company cancel pages ─────────────────────────────────────────────────
  for (const company of companies) {
    const path = `/cancel-${company.slug}-solar-contract`;
    const desc = `Review ${company.name} solar contract terms, complaint resources, and records to gather before requesting an individual case review.`;
    map[path] = {
      title: `Cancel ${company.name} Solar Contract | Solar Freedom`,
      description: desc,
      canonical: BASE_URL + path,
    };
  }

  // ─── City pages ───────────────────────────────────────────────────────────
  for (const city of cities) {
    const path = `/cancel-solar-contract/${city.slug}`;
    map[path] = {
      title: `Cancel Solar Contract in ${city.name}, ${city.stateCode} | Solar Freedom`,
      description: `Review solar contract terms and consumer resources for ${city.name}, ${city.stateCode}. Options and timing depend on your agreement, facts, and jurisdiction.`,
      canonical: BASE_URL + path,
      noindex: !INDEXED_CITY_SLUGS.has(city.slug),
    };
  }

  // ─── State law pages ──────────────────────────────────────────────────────
  for (const law of stateLaws) {
    const path = `/solar-contract-laws/${law.slug}`;
    // Use the data file's metaTitle/metaDescription (they are specific and compelling)
    const title = law.metaTitle
      ? `${law.metaTitle} | Solar Freedom`
      : `${law.state} Solar Contract Laws | Your Rights | Solar Freedom`;
    const description = `Review solar-contract consumer information for ${law.state}, including records to gather and official sources to verify. Options depend on facts and current law.`;
    map[path] = { title, description, canonical: BASE_URL + path };
  }

  // ─── Blog posts ───────────────────────────────────────────────────────────
  for (const post of blogPosts) {
    const path = `/blog/${post.slug}`;
    map[path] = {
      title: `${post.metaTitle} | Solar Freedom`,
      description: suppressUnverifiedFirstPartyClaims(post.metaDescription),
      canonical: BASE_URL + path,
    };
  }

  _metaMap = map;
  console.log(`[SEO] Meta map built: ${Object.keys(map).length} URLs`);
  return map;
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

  const $ = cheerio.load(html);

  // <title>
  $("title").text(meta.title);

  // meta description
  $('meta[name="description"]').attr("content", meta.description);

  // canonical — remove all existing canonicals first, then set one
  $('link[rel="canonical"]').remove();
  $("head").append(`<link rel="canonical" href="${meta.canonical}" />`);

  // og:url
  $('meta[property="og:url"]').attr("content", meta.canonical);

  // og:title
  $('meta[property="og:title"]').attr("content", meta.title);

  // og:description
  $('meta[property="og:description"]').attr("content", meta.description);

  // twitter:title
  $('meta[name="twitter:title"]').attr("content", meta.title);

  // twitter:description
  $('meta[name="twitter:description"]').attr("content", meta.description);

  // robots noindex — critical for spam penalty recovery
  if (meta.noindex) {
    $('meta[name="robots"]').remove();
    $('head').append('<meta name="robots" content="noindex, follow" />');
  }

  return $.html();
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
      if (post) return renderDbBlogPost(html, normalizedPath, post);
    } catch (err) {
      console.warn(`[SEO] DB lookup failed for ${normalizedPath}:`, err);
    }
  }

  if (!meta) return html; // Unknown path — serve as-is

  const $ = cheerio.load(html);

  // <title>
  $("title").text(meta.title);

  // meta description
  $('meta[name="description"]').attr("content", meta.description);

  // canonical — remove all existing canonicals first, then set one
  $('link[rel="canonical"]').remove();
  $("head").append(`<link rel="canonical" href="${meta.canonical}" />`);

  // og:url
  $('meta[property="og:url"]').attr("content", meta.canonical);

  // og:title
  $('meta[property="og:title"]').attr("content", meta.title);

  // og:description
  $('meta[property="og:description"]').attr("content", meta.description);

  // twitter:title
  $('meta[name="twitter:title"]').attr("content", meta.title);

  // twitter:description
  $('meta[name="twitter:description"]').attr("content", meta.description);

  // robots noindex — critical for spam penalty recovery
  if (meta.noindex) {
    $('meta[name="robots"]').remove();
    $('head').append('<meta name="robots" content="noindex, follow" />');
  }

  return $.html();
}
