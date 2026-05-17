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
import { cities } from "../client/src/data/cities";
import { companies } from "../client/src/data/companies";
import { stateLaws } from "../client/src/data/state-laws";
import { blogPosts } from "../client/src/data/blog";

const BASE_URL = "https://breakyoursolarcontract.com";

interface MetaEntry {
  title: string;
  description: string;
  canonical: string;
}

let _metaMap: Record<string, MetaEntry> | null = null;

export function buildMetaMap(): Record<string, MetaEntry> {
  if (_metaMap) return _metaMap;

  const map: Record<string, MetaEntry> = {};

  // ─── Static pages ────────────────────────────────────────────────────────────
  const staticPages: Record<string, { title: string; description: string }> = {
    "/": {
      title: "Solar Freedom — Get Out of Your Solar Contract Today",
      description:
        "Trapped in a solar contract? Our attorneys cancel solar agreements for 3,000+ homeowners. Free case review. Results in 30–90 days.",
    },
    "/blog": {
      title: "Solar Contract Help Blog | Solar Freedom",
      description:
        "Expert articles on how to cancel solar contracts, fight solar fraud, and understand your legal rights as a homeowner.",
    },
    "/solar-exit-options": {
      title: "Solar Exit Options | How to Get Out of a Solar Contract",
      description:
        "Explore every legal path to exit your solar contract — rescission, fraud claims, lender disputes, and more. Free case review.",
    },
    "/solar-lien-removal": {
      title: "Solar Lien Removal | Remove a UCC-1 Solar Lien From Your Home",
      description:
        "A solar lien (UCC-1 fixture filing) on your home can block a sale or refinance. Our attorneys remove solar liens. Free review.",
    },
    "/solar-loan-help": {
      title: "Solar Loan Help | Fight Back Against Predatory Solar Loans",
      description:
        "Trapped in a high-interest solar loan with hidden dealer fees? Our attorneys challenge solar loans under TILA and consumer protection law.",
    },
    "/solar-contract-laws": {
      title: "Solar Contract Laws by State | Your Legal Rights",
      description:
        "Every state has different solar contract laws. Find your state's cooling-off period, consumer protection statutes, and cancellation rights.",
    },
    "/solar-fraud-report": {
      title: "Report Solar Fraud | File a Solar Complaint",
      description:
        "Were you misled by a solar salesperson? Report solar fraud to the right agencies and explore your legal options. Free case review.",
    },
    "/solar-companies": {
      title: "Solar Company Complaints & Cancellation Guide 2026 | Solar Freedom",
      description:
        "Complete guide to canceling contracts with Sunrun, SunPower, Vivint Solar, Freedom Forever, GoodLeap, Sunnova, Tesla Solar & more. BBB ratings, complaint data, and legal grounds.",
    },
  };

  for (const [path, meta] of Object.entries(staticPages)) {
    map[path] = { ...meta, canonical: BASE_URL + path };
  }

  // ─── Company cancel pages ─────────────────────────────────────────────────
  for (const company of companies) {
    const path = `/cancel-${company.slug}-solar-contract`;
    const desc =
      company.summary.length > 155
        ? company.summary.slice(0, 152) + "..."
        : company.summary ||
          `Trapped in a ${company.name} solar contract? Our attorneys have helped thousands cancel. Free case review — no obligation.`;
    map[path] = {
      title: `Cancel ${company.name} Solar Contract | Solar Freedom`,
      description: desc,
      canonical: BASE_URL + path,
    };
  }

  // ─── City pages ───────────────────────────────────────────────────────────
  // City-specific overrides for high-opportunity pages
  const cityOverrides: Record<string, { title: string; description: string }> = {
    'phoenix-az': {
      title: 'Cancel Solar Contract in Phoenix, AZ | Get Out of Your Solar Lease',
      description: 'Phoenix homeowners: APS net metering changes may have voided your solar contract\'s savings promises. Our attorneys cancel solar leases and loans. Free case review.',
    },
    'los-angeles-ca': {
      title: 'Cancel Solar Contract in Los Angeles, CA | NEM 3.0 Rights',
      description: 'Los Angeles homeowners: NEM 3.0 cut solar export credits by 75%. If your savings projections were based on NEM 2.0, you may have grounds to cancel. Free legal review.',
    },
    'north-las-vegas-nv': {
      title: 'Cancel Solar Contract in North Las Vegas, NV | NV Energy Rights',
      description: 'North Las Vegas homeowners: NV Energy net metering changes may have invalidated your solar contract. Nevada law requires specific disclosures. Free case review.',
    },
    'denver-co': {
      title: 'Cancel Solar Contract in Denver, CO | Colorado Solar Rights',
      description: 'Denver homeowners trapped in solar contracts: Colorado consumer protection laws give you real options. Our attorneys cancel solar leases and loans. Free case review.',
    },
  };

  for (const city of cities) {
    const path = `/cancel-solar-contract/${city.slug}`;
    const override = cityOverrides[city.slug];
    map[path] = {
      title: override?.title ?? `Cancel Solar Contract in ${city.name}, ${city.stateCode} | Solar Freedom`,
      description: override?.description ?? `Trapped in a solar contract in ${city.name}, ${city.state}? Our attorneys have helped 3,000+ homeowners cancel solar agreements. Free case review — results in 30–90 days.`,
      canonical: BASE_URL + path,
    };
  }

  // ─── State law pages ──────────────────────────────────────────────────────
  for (const law of stateLaws) {
    const path = `/solar-contract-laws/${law.slug}`;
    map[path] = {
      title: `${law.state} Solar Contract Laws | Your Rights | Solar Freedom`,
      description: `Learn your legal rights under ${law.state} solar contract law — cooling-off periods, consumer protection statutes, and how to cancel. Free case review.`,
      canonical: BASE_URL + path,
    };
  }

  // ─── Blog posts ───────────────────────────────────────────────────────────
  for (const post of blogPosts) {
    const path = `/blog/${post.slug}`;
    map[path] = {
      title: `${post.metaTitle} | Solar Freedom`,
      description: post.metaDescription,
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
  $('title').text(meta.title);

  // meta description
  $('meta[name="description"]').attr('content', meta.description);

  // canonical — remove all existing canonicals first, then set one
  $('link[rel="canonical"]').remove();
  $('head').append(`<link rel="canonical" href="${meta.canonical}" />`);

  // og:url
  $('meta[property="og:url"]').attr('content', meta.canonical);

  // og:title
  $('meta[property="og:title"]').attr('content', meta.title);

  // og:description
  $('meta[property="og:description"]').attr('content', meta.description);

  // twitter:title
  $('meta[name="twitter:title"]').attr('content', meta.title);

  // twitter:description
  $('meta[name="twitter:description"]').attr('content', meta.description);

  return $.html();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Async version of injectMeta that also handles DB-published blog posts.
 *
 * DB posts are created after the build, so they don't have pre-rendered HTML files
 * and aren't in the static meta map. This function does a live DB lookup for
 * /blog/* paths that aren't in the static map, ensuring Googlebot always gets
 * the correct title and meta description even for newly published DB posts.
 */
export async function injectMetaDynamic(html: string, path: string): Promise<string> {
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
      if (post && post.metaTitle) {
        meta = {
          title: `${post.metaTitle} | Solar Freedom`,
          description: post.metaDescription || `Learn how to cancel your solar contract. Free case review from Solar Freedom attorneys.`,
          canonical: `${BASE_URL}${normalizedPath}`,
        };
      }
    } catch (err) {
      console.warn(`[SEO] DB lookup failed for ${normalizedPath}:`, err);
    }
  }

  if (!meta) return html; // Unknown path — serve as-is

  const $ = cheerio.load(html);

  // <title>
  $('title').text(meta.title);

  // meta description
  $('meta[name="description"]').attr('content', meta.description);

  // canonical — remove all existing canonicals first, then set one
  $('link[rel="canonical"]').remove();
  $('head').append(`<link rel="canonical" href="${meta.canonical}" />`);

  // og:url
  $('meta[property="og:url"]').attr('content', meta.canonical);

  // og:title
  $('meta[property="og:title"]').attr('content', meta.title);

  // og:description
  $('meta[property="og:description"]').attr('content', meta.description);

  // twitter:title
  $('meta[name="twitter:title"]').attr('content', meta.title);

  // twitter:description
  $('meta[name="twitter:description"]').attr('content', meta.description);

  return $.html();
}
