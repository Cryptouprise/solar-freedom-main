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
import { isCanonicalBlogIndexed, isCompanyIndexed, isStateIndexed } from "../client/src/data/indexEligibility";
import { sanitizeStoredHtml } from "./security/html";  // server/security/html.ts
import { findDuplicateCityMeta, generateCityMeta } from "./cityMeta";

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
    "/free-cancellation-letter": {
      title: "Free Solar Contract Cancellation Letter | Solar Freedom",
      description:
        "Download solar contract cancellation letter templates for cooling-off, pre-installation, and post-installation situations. Review your documents before sending anything.",
    },
    "/calculator": {
      title: "Solar Contract Cancellation Calculator | Solar Freedom",
      description:
        "Estimate remaining payments, escalator growth, and buyout questions on a solar lease, PPA, or loan. Results are informational, not a quote or legal advice.",
    },
    "/compare": {
      title: "Compare Solar Company Contract Issues | Solar Freedom",
      description:
        "Compare cancellation issues, complaint themes, and documents to gather for major solar companies before requesting an individual case review.",
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
      noindex: !isCompanyIndexed(company.slug),
    };
  }

  // ─── City pages ───────────────────────────────────────────────────────────
  // CTR-optimized meta descriptions for the 25 indexed cities
  const cityMetaOverrides: Record<string, { title: string; description: string }> = {
    'hartford-ct': {
      title: 'Cancel Solar Contract in Hartford, CT | Solar Freedom',
      description: 'Trapped in a Hartford solar contract? Review your cancellation rights under Connecticut law. Free case review — no upfront cost.',
    },
    'phoenix-az': {
      title: 'Cancel Solar Contract in Phoenix, AZ | Solar Freedom',
      description: 'Phoenix homeowners: review your Sunrun, SunPower, or Tesla Solar contract rights. Arizona consumer law may give you an exit. Free case review.',
    },
    'cincinnati-oh': {
      title: 'Cancel Solar Contract in Cincinnati, OH | Solar Freedom',
      description: 'Ohio\'s Consumer Sales Practices Act protects Cincinnati homeowners from deceptive solar sales. Review your cancellation options — free case review.',
    },
    'north-las-vegas-nv': {
      title: 'Cancel Solar Contract in North Las Vegas, NV | Solar Freedom',
      description: 'North Las Vegas homeowners: review your solar contract rights under Nevada law. Rocky Mountain Power rate changes may affect your case. Free review.',
    },
    'houston-tx': {
      title: 'Cancel Solar Contract in Houston, TX | Solar Freedom',
      description: 'Houston has 1,400+ solar complaints. Texas DTPA gives you strong cancellation rights. Review your Sunrun, Freedom Forever, or Sunnova contract — free.',
    },
    'greenville-sc': {
      title: 'Cancel Solar Contract in Greenville, SC | Solar Freedom',
      description: 'Duke Energy\'s Solar Choice tariff changes affect Greenville solar savings. Review your contract rights under SC Unfair Trade Practices Act — free.',
    },
    'denver-co': {
      title: 'Cancel Solar Contract in Denver, CO | Solar Freedom',
      description: 'Denver homeowners: Xcel Energy rate changes may have made your solar contract a bad deal. Review your Colorado cancellation rights — free case review.',
    },
    'san-antonio-tx': {
      title: 'Cancel Solar Contract in San Antonio, TX | Solar Freedom',
      description: 'San Antonio solar homeowners: CPS Energy\'s net metering rules affect your savings. Review your Texas DTPA rights — free case review.',
    },
    'little-rock-ar': {
      title: 'Cancel Solar Contract in Little Rock, AR | Solar Freedom',
      description: 'Little Rock homeowners: review your solar contract rights under Arkansas consumer law. Entergy rate changes may affect your case. Free review.',
    },
    'las-vegas-nv': {
      title: 'Cancel Solar Contract in Las Vegas, NV | Solar Freedom',
      description: 'Las Vegas solar homeowners: NV Energy\'s net metering changes may have cut your savings. Review your Nevada cancellation rights — free case review.',
    },
    'youngstown-oh': {
      title: 'Cancel Solar Contract in Youngstown, OH | Solar Freedom',
      description: 'Youngstown\'s lower solar irradiance means inflated projections are common. Review your Ohio CSPA rights and cancellation options — free.',
    },
    'west-valley-city-ut': {
      title: 'Cancel Solar Contract in West Valley City, UT | Solar Freedom',
      description: 'Rocky Mountain Power\'s reduced net metering hit Utah homeowners hard. Review your West Valley City solar contract rights — free case review.',
    },
    'shreveport-la': {
      title: 'Cancel Solar Contract in Shreveport, LA | Solar Freedom',
      description: 'Shreveport homeowners: SWEPCO and Cleco net metering terms affect solar savings. Review your Louisiana consumer rights — free case review.',
    },
    'santa-ana-ca': {
      title: 'Cancel Solar Contract in Santa Ana, CA | Solar Freedom',
      description: 'Santa Ana solar homeowners: California\'s NEM 3.0 changes may have impacted your savings. Review your cancellation rights — free case review.',
    },
    'new-haven-ct': {
      title: 'Cancel Solar Contract in New Haven, CT | Solar Freedom',
      description: 'New Haven homeowners: review your solar contract rights under Connecticut consumer law. Eversource rate changes may affect your case. Free review.',
    },
    'los-angeles-ca': {
      title: 'Cancel Solar Contract in Los Angeles, CA | Solar Freedom',
      description: 'LA homeowners: NEM 3.0 slashed solar export credits by 75%. Review your Sunrun, Tesla, or SunPower contract rights — free case review.',
    },
    'dallas-tx': {
      title: 'Cancel Solar Contract in Dallas, TX | Solar Freedom',
      description: 'Dallas homeowners: Texas DTPA gives you strong rights against deceptive solar sales. Review your Sunrun or Freedom Forever contract — free.',
    },
    'san-diego-ca': {
      title: 'Cancel Solar Contract in San Diego, CA | Solar Freedom',
      description: 'San Diego solar homeowners: SDG&E\'s NEM 3.0 changes may have made your contract a bad deal. Review your California rights — free case review.',
    },
    'austin-tx': {
      title: 'Cancel Solar Contract in Austin, TX | Solar Freedom',
      description: 'Austin Energy\'s solar program changes affect homeowners. Review your Texas DTPA cancellation rights against Sunrun, Tesla, or SunPower — free.',
    },
    'murfreesboro-tn': {
      title: 'Cancel Solar Contract in Murfreesboro, TN | Solar Freedom',
      description: 'Murfreesboro homeowners: review your solar contract rights under Tennessee consumer law. Middle Tennessee Electric rates affect your case. Free review.',
    },
    'miami-fl': {
      title: 'Cancel Solar Contract in Miami, FL | Solar Freedom',
      description: 'Miami solar homeowners: FPL net metering changes may affect your savings. Review your Florida solar contract cancellation rights — free case review.',
    },
    'nashville-tn': {
      title: 'Cancel Solar Contract in Nashville, TN | Solar Freedom',
      description: 'Nashville homeowners: NES rate changes and aggressive solar sales tactics have left many overpaying. Review your Tennessee rights — free case review.',
    },
    'san-francisco-ca': {
      title: 'Cancel Solar Contract in San Francisco, CA | Solar Freedom',
      description: 'SF homeowners: PG&E\'s NEM 3.0 cut solar export credits dramatically. Review your Sunrun, Tesla, or SunPower contract rights — free.',
    },
    'san-jose-ca': {
      title: 'Cancel Solar Contract in San Jose, CA | Solar Freedom',
      description: 'San Jose solar homeowners: PG&E\'s NEM 3.0 changes may have made your contract a bad deal. Review your California cancellation rights — free.',
    },
    'savannah-ga': {
      title: 'Cancel Solar Contract in Savannah, GA | Solar Freedom',
      description: 'Savannah homeowners: Georgia Power rate changes affect solar savings. Review your solar contract rights under Georgia consumer law — free case review.',
    },
  };

  const cityMetaEntries: Array<{ slug: string; title: string; description: string }> = [];
  for (const city of cities) {
    const path = `/cancel-solar-contract/${city.slug}`;
    const override = cityMetaOverrides[city.slug];
    const generated = generateCityMeta(city);
    const title = override?.title ?? generated.title;
    const description = override?.description ?? generated.description;
    cityMetaEntries.push({ slug: city.slug, title, description });
    map[path] = {
      title,
      description,
      canonical: BASE_URL + path,
      noindex: !INDEXED_CITY_SLUGS.has(city.slug),
    };
  }
  const cityMetaIssues = findDuplicateCityMeta(cityMetaEntries);
  if (cityMetaIssues.length) throw new Error(`[SEO] City metadata uniqueness check failed: ${cityMetaIssues.join("; ")}`);

  // ─── State law pages ──────────────────────────────────────────────────────
  for (const law of stateLaws) {
    const path = `/solar-contract-laws/${law.slug}`;
    const title = law.metaTitle
      ? `${law.metaTitle} | Solar Freedom`
      : `${law.state} Solar Contract Laws | Your Rights | Solar Freedom`;
    const description = `Review solar-contract consumer information for ${law.state}, including records to gather and official sources to verify. Options depend on facts and current law.`;
    map[path] = { title, description, canonical: BASE_URL + path, noindex: !isStateIndexed(law.slug) };
  }

  // ─── Blog posts ───────────────────────────────────────────────────────────
  for (const post of blogPosts) {
    const path = `/blog/${post.slug}`;
    map[path] = {
      title: `${post.metaTitle} | Solar Freedom`,
      description: suppressUnverifiedFirstPartyClaims(post.metaDescription),
      canonical: BASE_URL + path,
      noindex: !isCanonicalBlogIndexed(post.slug),
    };
  }

  _metaMap = map;
  console.log(`[SEO] Meta map built: ${Object.keys(map).length} URLs`);
  return map;
}

export function injectMeta(html: string, path: string): string {
  const map = buildMetaMap();
  const normalizedPath =
    path === "/" ? "/" : path.replace(/\/$/, "").split("?")[0];
  const meta = map[normalizedPath];
  if (!meta) return html;
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

function extractExternalCitations(content: string): string[] {
  const urls: string[] = [];
  const markdownLink = /\[[^\]]+\]\((https?:\/\/[^)]+)\)/g;
  const htmlLink = /href=["'](https?:\/\/[^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = markdownLink.exec(content)) !== null) urls.push(match[1]);
  while ((match = htmlLink.exec(content)) !== null) urls.push(match[1]);
  return Array.from(new Set(urls));
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
  const slug = pagePath.startsWith("/blog/") ? pagePath.slice("/blog/".length) : "";
  const noindex = !isCanonicalBlogIndexed(slug);
  const faq = normalizeFaqItems(post.faqItems);
  const citations = extractExternalCitations(post.content);
  const organizationId = `${BASE_URL}/#organization`;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${canonical}#webpage` },
    url: canonical,
    datePublished: safeIsoDate(post.publishedAt),
    dateModified: safeIsoDate(post.updatedAt ?? post.publishedAt),
    author: { "@type": "Organization", "@id": organizationId, name: "Solar Freedom", url: BASE_URL },
    publisher: { "@type": "Organization", "@id": organizationId, name: "Solar Freedom", url: BASE_URL },
    citation: citations.length ? citations : undefined,
    inLanguage: "en-US",
    isAccessibleForFree: true,
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
  const citationsHtml = citations.length
    ? `<section class="article-sources"><h2>Primary sources and official procedures</h2><ul>${citations
        .map(url => `<li><a href="${escapeHtml(url)}" rel="noopener noreferrer">${escapeHtml(url)}</a></li>`)
        .join("")}</ul></section>`
    : "";
  const editorialHtml = `<section class="editorial-method"><h2>Editorial method</h2><p>Solar Freedom publishes educational contract-navigation content. Articles are checked for source accuracy, clear separation between general information and individual advice, current official procedures, and unsupported outcome claims. We do not claim attorney review unless a named reviewer and review date are displayed. This article is not legal advice.</p></section>`;
  const semanticArticle = `<div id="root"><main class="seo-server-rendered" data-content-source="database"><nav><a href="/">Home</a> / <a href="/blog">Blog</a></nav><article><p>${escapeHtml(post.category || "Solar contract guide")}</p><h1>${escapeHtml(post.title)}</h1>${post.excerpt ? `<p>${escapeHtml(suppressUnverifiedFirstPartyClaims(post.excerpt))}</p>` : ""}<div class="article-body">${body}</div>${citationsHtml}${faqHtml}${editorialHtml}</article></main></div>`;
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
  if (noindex) {
    $('meta[name="robots"]').remove();
    $('head').append('<meta name="robots" content="noindex, follow">');
  }
  $("head").append(
    `<script type="application/ld+json">${JSON.stringify(schemas).replace(/</g, "\\u003c")}</script>`
  );
  $("#root").replaceWith(semanticArticle);
  return $.html();
}

export async function injectMetaDynamic(
  html: string,
  path: string
): Promise<string> {
  const map = buildMetaMap();
  const normalizedPath =
    path === "/" ? "/" : path.replace(/\/$/, "").split("?")[0];
  let meta = map[normalizedPath];
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
  if (!meta) return html;
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
  if (meta.noindex) {
    $('meta[name="robots"]').remove();
    $('head').append('<meta name="robots" content="noindex, follow" />');
  }
  return $.html();
}

export function applyDbOverlayToPrerendered(
  html: string,
  post: {
    metaTitle?: string | null;
    metaDescription?: string | null;
    faqItems?: unknown;
    content?: string | null;
  }
): string {
  const faq = normalizeFaqItems(
    typeof post.faqItems === "string" ? safeJsonParse(post.faqItems) : post.faqItems
  );
  const metaTitle = typeof post.metaTitle === "string" ? post.metaTitle.trim() : "";
  const metaDescription = typeof post.metaDescription === "string" ? post.metaDescription.trim() : "";
  const contentLinks = extractInternalLinks(post.content ?? "");
  if (!metaTitle && !metaDescription && !faq.length && !contentLinks.length) return html;
  const $ = cheerio.load(html);
  const main = $("main.seo-prerender");
  if (!main.length) return html;
  if (metaTitle) {
    const withBrand = /solar freedom/i.test(metaTitle) ? metaTitle : `${metaTitle} | Solar Freedom`;
    $("title").text(withBrand);
    $('meta[property="og:title"]').attr("content", withBrand);
    $('meta[name="twitter:title"]').attr("content", withBrand);
  }
  if (metaDescription) {
    const safeDescription = suppressUnverifiedFirstPartyClaims(metaDescription);
    $('meta[name="description"]').attr("content", safeDescription);
    $('meta[property="og:description"]').attr("content", safeDescription);
    $('meta[name="twitter:description"]').attr("content", safeDescription);
  }
  if (faq.length) {
    const askedAlready = new Set(
      main
        .find("h2, h3")
        .map((_i, element) => normalizeQuestionKey($(element).text()))
        .get()
    );
    const fresh = faq.filter(item => !askedAlready.has(normalizeQuestionKey(item.q)));
    if (fresh.length) {
      const faqHtml = `<section aria-labelledby="db-faq"><h2 id="db-faq">Frequently asked questions</h2>${fresh
        .map(item => `<h3>${escapeHtml(item.q)}</h3><p>${escapeHtml(item.a)}</p>`)
        .join("")}</section>`;
      const nav = main.find("nav").first();
      if (nav.length) nav.before(faqHtml);
      else main.append(faqHtml);
      const merged = [
        ...faq.filter(item => askedAlready.has(normalizeQuestionKey(item.q))),
        ...fresh,
      ];
      $("head").append(
        `<script type="application/ld+json">${JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: merged.map(item => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }).replace(/</g, "\\u003c")}</script>`
      );
    }
  }
  if (contentLinks.length) {
    const linkedAlready = new Set(
      main
        .find("a[href]")
        .map((_i, element) => String($(element).attr("href")))
        .get()
    );
    const freshLinks = contentLinks.filter(link => !linkedAlready.has(link.href));
    if (freshLinks.length) {
      const list = main.find("nav ul").first();
      const items = freshLinks
        .map(link => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.text)}</a></li>`)
        .join("");
      if (list.length) list.append(items);
      else main.append(`<nav aria-label="Related Solar Freedom resources"><ul>${items}</ul></nav>`);
    }
  }
  return $.html();
}

export function applyCityRecoveryOverlay(
  html: string,
  pagePath: string,
  recovery: {
    publishedAt?: Date | string | null;
    payload: {
      title: string;
      metaTitle: string;
      metaDescription: string;
      heroHeading: string;
      heroCopy: string;
      sections: Array<{ heading: string; body: string }>;
      faq: Array<{ question: string; answer: string }>;
      sources: Array<{ label: string; url: string }>;
      internalLinks: Array<{ label: string; url: string }>;
      ctaHeading: string;
      ctaCopy: string;
    };
  },
): string {
  const $ = cheerio.load(html);
  const main = $("main.seo-prerender");
  if (!main.length) return html;

  const { payload } = recovery;
  const canonical = `${BASE_URL}${pagePath}`;
  $("title").text(payload.metaTitle);
  $('meta[name="description"]').attr("content", payload.metaDescription);
  $('meta[property="og:title"], meta[name="twitter:title"]').attr("content", payload.metaTitle);
  $('meta[property="og:description"], meta[name="twitter:description"]').attr("content", payload.metaDescription);
  $('meta[property="og:url"]').attr("content", canonical);
  $('link[rel="canonical"]').attr("href", canonical);

  const body = [
    `<header><p>Source-backed local guide</p><h1>${escapeHtml(payload.heroHeading)}</h1><p>${escapeHtml(payload.heroCopy)}</p></header>`,
    ...payload.sections.map(section =>
      `<section><h2>${escapeHtml(section.heading)}</h2>${section.body
        .split(/\n{2,}/)
        .map(paragraph => `<p>${escapeHtml(paragraph)}</p>`)
        .join("")}</section>`
    ),
    `<section aria-labelledby="city-sources"><h2 id="city-sources">Official sources and verification</h2><p>Rules and procedures can change. Verify current information before acting.</p><ul>${payload.sources
      .map(source => `<li><a href="${escapeHtml(source.url)}" rel="noopener noreferrer">${escapeHtml(source.label)}</a></li>`)
      .join("")}</ul></section>`,
    `<section aria-labelledby="city-faq"><h2 id="city-faq">Frequently asked questions</h2>${payload.faq
      .map(item => `<h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p>`)
      .join("")}</section>`,
    `<nav aria-label="Related solar contract resources"><h2>Related resources</h2><ul>${payload.internalLinks
      .map(link => `<li><a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a></li>`)
      .join("")}</ul></nav>`,
    `<section><h2>${escapeHtml(payload.ctaHeading)}</h2><p>${escapeHtml(payload.ctaCopy)}</p><p><a href="${canonical}#city-review">Request a case review</a></p></section>`,
    "<p>Educational information—not legal advice.</p>",
  ].join("");
  main.html(body).attr("data-recovery-published", "true");

  $('script[type="application/ld+json"]').remove();
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: payload.title,
      description: payload.metaDescription,
      url: canonical,
      dateModified: recovery.publishedAt ? new Date(recovery.publishedAt).toISOString() : undefined,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: payload.faq.map(item => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ];
  $("head").append(
    `<script type="application/ld+json">${JSON.stringify(schemas).replace(/</g, "\\u003c")}</script>`
  );

  return $.html();
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeQuestionKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function extractInternalLinks(content: string): Array<{ href: string; text: string }> {
  if (!content || !content.includes("<a")) return [];
  const $ = cheerio.load(content, undefined, false);
  const seen = new Set<string>();
  const links: Array<{ href: string; text: string }> = [];
  $("a[href]").each((_index, element) => {
    const href = String($(element).attr("href") ?? "").trim();
    const text = $(element).text().trim();
    if (!href.startsWith("/") || href.startsWith("//") || !text) return;
    if (seen.has(href)) return;
    seen.add(href);
    links.push({ href, text });
  });
  return links;
}
