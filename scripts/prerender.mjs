/**
 * Static Pre-rendering Script
 *
 * Runs after `vite build` to generate individual HTML files for every URL.
 * Each file gets the correct title, description, and canonical tag baked in.
 *
 * WHY: Cloudflare (used by Manus hosting) caches HTML at the edge and ignores
 * server-side Cache-Control headers. By generating static HTML files at build
 * time, we ensure every page has the correct meta tags without needing server
 * injection at runtime.
 *
 * CRITICAL LESSONS LEARNED (do not remove this comment):
 * 1. The injectMeta function MUST remove all existing canonical tags and append
 *    a new one — NOT use .attr() which fails silently if the element is missing.
 * 2. Blog posts MUST be included in the meta map — the prerender script must
 *    read all batch files and extract slugs/metaTitle/metaDescription.
 * 3. The index.html template has a hardcoded canonical pointing to / — this
 *    MUST be replaced for every non-homepage URL or Google will treat all pages
 *    as duplicates of the homepage (causing "Duplicate without user-selected canonical"
 *    in GSC and preventing indexing of 300+ pages).
 * 4. When adding new blog batch files, MUST update loadBlogData() to include them.
 * 5. City pages need state codes in titles for geo-targeting (e.g., "Phoenix, AZ").
 *
 * OUTPUT: dist/public/cancel-solar-contract/phoenix-az/index.html, etc.
 *
 * See docs/lessons-learned/01-spa-soft-404-seo.md for full context.
 */

import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.resolve(ROOT, "dist", "public");
const BASE_URL = "https://breakyoursolarcontract.com";

// ─── Load city/company/state data ────────────────────────────────────────────
async function loadData() {
  const citiesFile = fs.readFileSync(
    path.resolve(ROOT, "client/src/data/cities.ts"),
    "utf-8"
  );
  const companiesFile = fs.readFileSync(
    path.resolve(ROOT, "client/src/data/companies.ts"),
    "utf-8"
  );
  const stateLawsFile = fs.readFileSync(
    path.resolve(ROOT, "client/src/data/state-laws.ts"),
    "utf-8"
  );

  const cityEntries = [];
  // Match: { name: "Dallas", state: "Texas", stateCode: "TX", slug: "dallas-tx", ... }
  const cityRegex =
    /\{\s*name:\s*["']([^"']+)["'][\s\S]*?stateCode:\s*["']([^"']+)["'][\s\S]*?slug:\s*["']([^"']+)["']/g;
  let m;
  while ((m = cityRegex.exec(citiesFile)) !== null) {
    cityEntries.push({ name: m[1], stateCode: m[2], slug: m[3] });
  }
  // Fallback: simpler regex if stateCode not found
  if (cityEntries.length === 0) {
    const cityNameRegex =
      /\{\s*name:\s*["']([^"']+)["'][^}]*slug:\s*["']([^"']+)["']/g;
    while ((m = cityNameRegex.exec(citiesFile)) !== null) {
      cityEntries.push({ name: m[1], stateCode: "", slug: m[2] });
    }
  }

  const companyEntries = [];
  const companyRegex =
    /slug:\s*["']([^"']+)["'],[\s\S]*?name:\s*["']([^"']+)["']/g;
  while ((m = companyRegex.exec(companiesFile)) !== null) {
    companyEntries.push({ slug: m[1], name: m[2] });
  }

  const stateEntries = collectSlugChunks(stateLawsFile)
    .map(({ slug, chunk }) => ({
      slug,
      state: findStringProp(chunk, "state")?.value || titleFromSlug(slug),
      metaTitle: findStringProp(chunk, "metaTitle")?.value || null,
      metaDescription: findStringProp(chunk, "metaDescription")?.value || null,
    }))
    .filter((entry) => entry.slug && entry.state);

  return { cityEntries, companyEntries, stateEntries };
}

// ─── Load ALL blog posts from all batch files ─────────────────────────────────
// IMPORTANT: When adding new blog batch files, add them to this list.
function readStringLiteralAt(content, startIndex) {
  const quote = content[startIndex];
  if (!["'", '"', "`"].includes(quote)) return null;

  let value = "";
  for (let i = startIndex + 1; i < content.length; i++) {
    const ch = content[i];
    if (ch === "\\") {
      const next = content[i + 1] ?? "";
      switch (next) {
        case "n":
          value += "\n";
          break;
        case "r":
          value += "\r";
          break;
        case "t":
          value += "\t";
          break;
        default:
          value += next;
      }
      i++;
      continue;
    }

    if (ch === quote) {
      return { value, end: i + 1 };
    }

    value += ch;
  }

  return null;
}

function readStringAfterColon(content, colonEndIndex) {
  let i = colonEndIndex;
  while (i < content.length && /\s/.test(content[i])) i++;
  return readStringLiteralAt(content, i);
}

function findStringProp(content, prop) {
  const propRegex = new RegExp(`\\b${prop}\\s*:`, "g");
  const match = propRegex.exec(content);
  if (!match) return null;
  return readStringAfterColon(content, propRegex.lastIndex);
}

function collectSlugChunks(content) {
  const slugRegex = /\bslug\s*:/g;
  const slugs = [];
  let match;

  while ((match = slugRegex.exec(content)) !== null) {
    const literal = readStringAfterColon(content, slugRegex.lastIndex);
    if (!literal) continue;
    slugs.push({
      slug: literal.value,
      start: match.index,
      end: literal.end,
    });
  }

  return slugs.map((entry, index) => ({
    ...entry,
    chunk: content.slice(
      entry.start,
      slugs[index + 1]?.start ?? content.length
    ),
  }));
}

// ─── FAQ + date extraction for richer structured data ────────────────────────
// Pull the `faq: [ { q: '...', a: '...' }, ... ]` array out of a single article
// chunk so it can be emitted as FAQPage JSON-LD (a strong AEO signal).
function parseFaqItems(chunk) {
  const faqKey = /\bfaq\s*:/g;
  const match = faqKey.exec(chunk);
  if (!match) return [];

  // Find the opening bracket of the faq array.
  let i = faqKey.lastIndex;
  while (i < chunk.length && /\s/.test(chunk[i])) i++;
  if (chunk[i] !== "[") return [];

  // Scan to the matching closing bracket, skipping string literals.
  let depth = 0;
  let end = -1;
  for (let j = i; j < chunk.length; j++) {
    const ch = chunk[j];
    if (ch === '"' || ch === "'" || ch === "`") {
      const literal = readStringLiteralAt(chunk, j);
      if (literal) {
        j = literal.end - 1;
        continue;
      }
    }
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) {
        end = j;
        break;
      }
    }
  }
  if (end === -1) return [];

  const block = chunk.slice(i, end + 1);
  const items = [];
  const qKey = /\bq\s*:/g;
  let qMatch;
  while ((qMatch = qKey.exec(block)) !== null) {
    const question = readStringAfterColon(block, qKey.lastIndex);
    if (!question) continue;
    const aKey = /\ba\s*:/g;
    aKey.lastIndex = question.end;
    const aMatch = aKey.exec(block);
    if (!aMatch) continue;
    const answer = readStringAfterColon(block, aKey.lastIndex);
    if (!answer) continue;
    const q = question.value.trim();
    const a = answer.value.trim();
    if (q && a) items.push({ q, a });
    qKey.lastIndex = answer.end;
  }
  return items;
}

const MONTH_INDEX = {
  january: "01", february: "02", march: "03", april: "04",
  may: "05", june: "06", july: "07", august: "08",
  september: "09", october: "10", november: "11", december: "12",
};

// Convert loose `publishDate` strings (e.g. "March 2026", "2026-03-15") into an
// ISO date for datePublished/dateModified. Returns null when unparseable.
function toIsoDate(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const monthYear = raw.match(/([A-Za-z]+)\s+(\d{4})/);
  if (monthYear) {
    const month = MONTH_INDEX[monthYear[1].toLowerCase()];
    if (month) return `${monthYear[2]}-${month}-01`;
  }
  const yearOnly = raw.match(/^(\d{4})$/);
  if (yearOnly) return `${yearOnly[1]}-01-01`;
  return null;
}

function titleFromSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function cleanBlogTitle(slug, title) {
  const normalized = (title || "").trim();
  if (!normalized || normalized.toLowerCase() === "solar contract help") {
    return titleFromSlug(slug);
  }
  return normalized;
}

function cleanBlogDescription(slug, description, title) {
  const normalized = (description || "").trim();
  const base =
    normalized ||
    `${cleanBlogTitle(slug, title)}: learn the solar contract risks, cancellation options, and documents homeowners should review before requesting a free legal case review.`;
  const expanded =
    base.length >= 110
      ? base
      : `${base} Review warning signs, legal options, and next steps before requesting a free solar contract case review.`;
  return fitMetaDescription(expanded);
}

function fitMetaDescription(description) {
  const normalized = String(description ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (normalized.length <= 165) return normalized;
  return `${normalized.slice(0, 162).replace(/\s+\S*$/, "")}...`;
}

function loadBlogData() {
  const blogFiles = [
    "blog.ts",
    "blog-extra.ts",
    "blog-articles-batch2.ts",
    "blog-articles-batch3.ts",
    "blog-articles-batch4.ts",
    "blog-articles-batch5.ts",
    "blog-articles-batch6.ts",
    "blog-articles-batch7.ts",
    "blog-articles-batch8.ts",
    "blog-articles-batch9.ts",
    "blog-articles-batch10.ts",
    // ADD NEW BATCH FILES HERE when created
  ];

  const blogEntries = {};

  for (const filename of blogFiles) {
    const filePath = path.resolve(ROOT, "client/src/data", filename);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf-8");

    for (const entry of collectSlugChunks(content)) {
      const { slug, chunk } = entry;
      if (!slug || slug.includes("${") || slug.length <= 5 || blogEntries[slug])
        continue;

      const title =
        findStringProp(chunk, "metaTitle")?.value ||
        findStringProp(chunk, "title")?.value ||
        "";
      const description =
        findStringProp(chunk, "metaDescription")?.value ||
        findStringProp(chunk, "excerpt")?.value ||
        "";

      const cleanTitle = cleanBlogTitle(slug, title);
      const cleanDescription = cleanBlogDescription(
        slug,
        description,
        cleanTitle
      );
      const faq = parseFaqItems(chunk);
      const publishDate =
        findStringProp(chunk, "publishDate")?.value ||
        findStringProp(chunk, "datePublished")?.value ||
        "";
      const updatedDate =
        findStringProp(chunk, "updatedDate")?.value ||
        findStringProp(chunk, "dateModified")?.value ||
        "";
      blogEntries[slug] = {
        title: `${cleanTitle} | Solar Freedom`,
        description: cleanDescription,
        faq,
        datePublished: toIsoDate(publishDate),
        dateModified: toIsoDate(updatedDate) || toIsoDate(publishDate),
      };
    }
  }

  const seenDescriptions = new Map();
  for (const [slug, data] of Object.entries(blogEntries)) {
    const key = data.description.toLowerCase();
    if (seenDescriptions.has(key)) {
      const plainTitle = data.title.replace(/\s+\|\s+Solar Freedom$/i, "");
      data.description = fitMetaDescription(
        `${data.description} This ${plainTitle} guide explains the specific documents, risks, and cancellation options to review.`
      );
    } else {
      seenDescriptions.set(key, slug);
    }
  }

  return blogEntries;
}

// ─── City-specific meta overrides for high-opportunity pages ─────────────────
const CITY_OVERRIDES = {
  "phoenix-az": {
    title: "Cancel Solar Contract in Phoenix, AZ | Get Out of Your Solar Lease",
    description:
      "Phoenix homeowners: APS net metering changes may have voided your solar contract's savings promises. Our attorneys cancel solar leases and loans. Free case review.",
  },
  "los-angeles-ca": {
    title: "Cancel Solar Contract in Los Angeles, CA | NEM 3.0 Rights",
    description:
      "Los Angeles homeowners: NEM 3.0 cut solar export credits by 75%. If your savings projections were based on NEM 2.0, you may have grounds to cancel. Free legal review.",
  },
  "north-las-vegas-nv": {
    title: "Cancel Solar Contract in North Las Vegas, NV | NV Energy Rights",
    description:
      "North Las Vegas homeowners: NV Energy net metering changes may have invalidated your solar contract. Nevada law requires specific disclosures. Free case review.",
  },
  "denver-co": {
    title: "Cancel Solar Contract in Denver, CO | Colorado Solar Rights",
    description:
      "Denver homeowners trapped in solar contracts: Colorado consumer protection laws give you real options. Our attorneys cancel solar leases and loans. Free case review.",
  },
  "san-diego-ca": {
    title: "Cancel Solar Contract in San Diego, CA | NEM 3.0 Legal Help",
    description:
      "San Diego homeowners: SDG&E NEM 3.0 cut solar export credits by 75%. If your savings projections were based on NEM 2.0, you have legal grounds to cancel. Free review.",
  },
  "las-vegas-nv": {
    title: "Cancel Solar Contract in Las Vegas, NV | Nevada Solar Rights",
    description:
      "Las Vegas homeowners: Nevada net metering changes may have invalidated your solar contract's savings promises. Our attorneys cancel solar leases and loans. Free review.",
  },
  "houston-tx": {
    title: "Cancel Solar Contract in Houston, TX | Texas Solar Rights",
    description:
      "Houston homeowners: Texas has strong consumer protection laws for solar contracts. Our attorneys cancel solar leases and loans across the Houston metro. Free case review.",
  },
  "dallas-tx": {
    title: "Cancel Solar Contract in Dallas, TX | Texas Solar Rights",
    description:
      "Dallas homeowners trapped in solar contracts: Texas consumer protection laws give you real options. Our attorneys cancel solar leases and loans. Free case review.",
  },
  "orlando-fl": {
    title: "Cancel Solar Contract in Orlando, FL | Florida Solar Rights",
    description:
      "Orlando homeowners: Florida's solar contract laws include a 3-day rescission right. Our attorneys cancel solar leases and loans across Central Florida. Free case review.",
  },
  "tampa-fl": {
    title: "Cancel Solar Contract in Tampa, FL | Florida Solar Rights",
    description:
      "Tampa homeowners trapped in solar contracts: Florida consumer protection laws give you real options. Our attorneys cancel solar leases and loans. Free case review.",
  },
};

// ─── Build meta map ───────────────────────────────────────────────────────────
function buildMetaMap(cityEntries, companyEntries, stateEntries, blogEntries) {
  const map = {};

  // Homepage
  map["/"] = {
    title: "Solar Freedom — Get Out of Your Solar Contract Today",
    description:
      "Trapped in a solar contract? Our attorneys have helped 3,000+ homeowners cancel solar contracts from Sunrun, SunPower, Tesla Solar & more. Free case review.",
    canonical: `${BASE_URL}/`,
  };

  // City pages — 303 pages
  for (const city of cityEntries) {
    const urlPath = `/cancel-solar-contract/${city.slug}`;
    const override = CITY_OVERRIDES[city.slug];
    const cityLabel = city.stateCode
      ? `${city.name}, ${city.stateCode}`
      : city.name;
    map[urlPath] = {
      title:
        override?.title ??
        `Cancel Solar Contract in ${cityLabel} | Solar Freedom`,
      description: fitMetaDescription(
        override?.description ??
          `Trapped in a solar contract in ${cityLabel}? Our attorneys have helped 3,000+ homeowners cancel solar agreements. Free case review — results in 30–90 days.`
      ),
      canonical: `${BASE_URL}${urlPath}`,
      geo: { city: city.name, region: city.stateCode || undefined },
    };
  }

  // Company pages
  for (const company of companyEntries) {
    const urlPath = `/cancel-${company.slug}-solar-contract`;
    map[urlPath] = {
      title: `Cancel ${company.name} Solar Contract | Solar Freedom`,
      description: `Trapped in a ${company.name} solar contract? Our attorneys specialize in ${company.name} cancellations. Free case review — no obligation.`,
      canonical: `${BASE_URL}${urlPath}`,
    };
  }

  // State law pages — 51 pages (use per-state metaTitle/metaDescription if available)
  for (const state of stateEntries) {
    const urlPath = `/solar-contract-laws/${state.slug}`;
    const title = state.metaTitle
      ? `${state.metaTitle} | Solar Freedom`
      : `${state.state} Solar Contract Laws | Your Rights | Solar Freedom`;
    const description = state.metaDescription
      ? state.metaDescription
      : `Learn your legal rights under ${state.state} solar contract law — cooling-off periods, consumer protection statutes, and how to cancel. Free case review.`;
    map[urlPath] = { title, description, canonical: `${BASE_URL}${urlPath}`, geo: { region: state.state } };
  }

  // Blog posts — ALL 100+ posts
  for (const [slug, data] of Object.entries(blogEntries)) {
    const urlPath = `/blog/${slug}`;
    map[urlPath] = {
      title: data.title,
      description: data.description,
      canonical: `${BASE_URL}${urlPath}`,
      faq: data.faq,
      datePublished: data.datePublished,
      dateModified: data.dateModified,
    };
  }

  // Static pages
  const staticPages = [
    {
      path: "/blog",
      title: "Solar Contract Help Blog | Solar Freedom",
      desc: "Expert articles on how to cancel solar contracts, fight solar fraud, and understand your legal rights as a homeowner.",
    },
    {
      path: "/how-it-works",
      title: "How Solar Contract Cancellation Works | Solar Freedom",
      desc: "Learn how Solar Freedom reviews solar contracts, finds legal issues, and helps homeowners pursue cancellation, loan reduction, or lien release.",
    },
    {
      path: "/solar-contract-help",
      title: "Solar Contract Help | Legal Options to Cancel | Solar Freedom",
      desc: "Need solar contract help? Compare rescission, fraud claims, lender disputes, lien removal, and other legal options. Free case review.",
    },
    {
      path: "/solar-panel-scam",
      title: "Solar Panel Scam Warning Signs | Solar Freedom",
      desc: "Learn the solar panel scam warning signs, from fake tax credit promises to hidden loan fees and liens. Free solar contract review.",
    },
    {
      path: "/solar-companies",
      title: "Solar Company Complaints & Cancellation Guide | Solar Freedom",
      desc: "Compare complaints and cancellation options for Sunrun, Sunnova, GoodLeap, SunPower, Freedom Forever, Tesla Solar, and more.",
    },
    {
      path: "/sunrun",
      title: "Sunrun Solar Contract Cancellation | Solar Freedom",
      desc: "Sunrun contract problems, lease escalators, solar loan disputes, and cancellation options for homeowners who need a free legal review.",
    },
    {
      path: "/solar-lien-removal",
      title: "Solar Lien Removal | Remove a UCC-1 Solar Lien | Solar Freedom",
      desc: "A solar lien (UCC-1 fixture filing) on your home can block a sale or refinance. Our attorneys remove solar liens. Free review.",
    },
    {
      path: "/solar-loan-help",
      title: "Solar Loan Help | Fight Predatory Solar Loans | Solar Freedom",
      desc: "Trapped in a high-interest solar loan with hidden dealer fees? Our attorneys challenge solar loans under TILA and consumer protection law.",
    },
    {
      path: "/selling-house-with-solar",
      title: "Selling a House With Solar Panels & a Loan | Solar Freedom",
      desc: "Solar loan blocking your home sale? We help homeowners pay off, negotiate, or legally challenge solar loans and liens so you can close. Free case review.",
    },
    {
      path: "/solar-exit-options",
      title: "Solar Exit Options | How to Get Out of a Solar Contract",
      desc: "Explore every legal path to exit your solar contract — rescission, fraud claims, lender disputes, and more. Free case review.",
    },
    {
      path: "/solar-fraud-report",
      title: "Report Solar Fraud | File a Solar Complaint | Solar Freedom",
      desc: "Were you misled by a solar salesperson? Report solar fraud to the right agencies and explore your legal options. Free case review.",
    },
    {
      path: "/solar-contract-laws",
      title: "Solar Contract Laws by State | Your Legal Rights | Solar Freedom",
      desc: "Every state has different solar contract laws. Find your state's cooling-off period, consumer protection statutes, and cancellation rights.",
    },
    {
      path: "/media",
      title: "Solar Contract Truth Hub \u2014 Watch & Listen | Solar Freedom",
      desc: "Watch solar contract videos and the Elite Solar Recovery Podcast. Real Sunrun, SunPower, GoodLeap, and Pink Energy cases. Free case audit.",
    },
    {
      path: "/sitemap",
      title: "Site Map — All Pages | Break Your Solar Contract",
      desc: "Complete directory of all pages on breakyoursolarcontract.com — 300 city pages, 13 company pages, 51 state law pages, and 95+ blog articles about solar contract cancellation.",
    },
  ];
  for (const p of staticPages) {
    map[p.path] = {
      title: p.title,
      description: p.desc,
      canonical: `${BASE_URL}${p.path}`,
    };
  }

  return map;
}

// ─── Build lightweight shell HTML ────────────────────────────────────────────
// Instead of copying the full 381 KB index.html into every directory,
// generate a minimal shell that has the correct meta tags + references to
// the hashed JS/CSS assets. This keeps each file ~3 KB instead of 381 KB,
// reducing the total dist from 121 MB to under 6 MB so deployment doesn't time out.
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripBrand(title) {
  return title
    .replace(/\s+\|\s+Solar Freedom$/i, "")
    .replace(/\s+—\s+Solar Freedom$/i, "")
    .replace(/\s+â€”\s+Solar Freedom$/i, "")
    .trim();
}

function fitMetaTitle(title) {
  const normalized = String(title ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (normalized.length <= 65) return normalized;

  const withoutBrand = stripBrand(normalized);
  if (withoutBrand.length <= 65) return withoutBrand;

  const tightened = withoutBrand
    .replace(/\s+\((?:2026|2026 Guide|Complete Guide)\)/gi, "")
    .replace(/\s+â€”\s+(?:Free Case Review|Legal Help|Solar Freedom).*$/i, "")
    .trim();
  if (tightened.length <= 65) return tightened;

  return `${tightened.slice(0, 62).replace(/\s+\S*$/, "")}...`;
}

function classifyPath(urlPath) {
  if (urlPath === "/blog") return "blog_index";
  if (urlPath.startsWith("/blog/")) return "blog_post";
  if (urlPath.startsWith("/cancel-solar-contract/")) return "city_page";
  if (urlPath.startsWith("/solar-contract-laws/")) return "state_law";
  if (urlPath.startsWith("/cancel-") && urlPath.endsWith("-solar-contract"))
    return "company_page";
  return "service_page";
}

function buildInternalLinks(urlPath) {
  const defaultLinks = [
    ["/", "Solar Freedom home"],
    ["/blog", "Solar contract help blog"],
    ["/solar-contract-laws", "Solar contract laws by state"],
    ["/solar-lien-removal", "Solar lien removal"],
    ["/solar-loan-help", "Solar loan help"],
    ["/selling-house-with-solar", "Selling a home with solar"],
    ["/cancel-sunrun-solar-contract", "Cancel Sunrun solar contract"],
    ["/cancel-sunnova-solar-contract", "Cancel Sunnova solar contract"],
    ["/cancel-goodleap-solar-contract", "GoodLeap solar loan help"],
    ["/blog/solar-contract-red-flags", "Solar contract red flags"],
    ["/blog/solar-fraud-warning-signs", "Solar fraud warning signs"],
    [
      "/blog/how-to-get-out-of-a-solar-contract",
      "How to get out of a solar contract",
    ],
  ];

  const contextualLinks = {
    "/blog/sunrun-solar-contract-cancellation-2026": [
      ["/blog/cancel-sunrun-solar-contract-before-installation", "Cancel Sunrun before installation"],
      ["/blog/sunrun-complaints-california", "Sunrun complaints in California"],
      ["/blog/solar-contract-rescission-rights", "Solar contract rescission rights"],
      ["/blog/how-to-file-a-complaint-against-solar-company-attorney-general", "File a solar company AG complaint"],
      ["/cancel-sunrun-solar-contract", "Cancel Sunrun solar contract"],
    ],
    "/blog/solar-contract-rescission-rights": [
      ["/blog/how-to-file-a-complaint-against-solar-company-attorney-general", "File a solar company AG complaint"],
      ["/blog/new-jersey-solar-contract-rights", "New Jersey solar contract rights"],
      ["/blog/cancel-solar-contract-rescission-rights", "Cancel solar contract rescission"],
      ["/blog/sunrun-solar-contract-cancellation-2026", "Sunrun solar contract cancellation"],
    ],
    "/blog/new-jersey-solar-contract-rights": [
      ["/blog/solar-contract-rescission-rights", "Solar contract rescission rights"],
      ["/blog/how-to-file-a-complaint-against-solar-company-attorney-general", "File a solar company AG complaint"],
      ["/blog/how-to-get-out-of-a-solar-contract", "How to get out of a solar contract"],
      ["/solar-contract-laws", "Solar contract laws by state"],
    ],
    "/blog/how-to-file-a-complaint-against-solar-company-attorney-general": [
      ["/blog/solar-contract-rescission-rights", "Solar contract rescission rights"],
      ["/blog/sunrun-solar-contract-cancellation-2026", "Sunrun solar contract cancellation"],
      ["/blog/how-to-get-out-of-a-solar-contract", "How to get out of a solar contract"],
      ["/blog/solar-fraud-warning-signs", "Solar fraud warning signs"],
    ],
    "/blog/sunrun-complaints-california": [
      ["/blog/sunrun-solar-contract-cancellation-2026", "Sunrun solar contract cancellation"],
      ["/blog/cancel-sunrun-solar-contract-before-installation", "Cancel Sunrun before installation"],
      ["/blog/solar-contract-rescission-rights", "Solar contract rescission rights"],
      ["/cancel-sunrun-solar-contract", "Cancel Sunrun solar contract"],
    ],
  };

  const links = [
    ...(contextualLinks[urlPath] || []),
    ...defaultLinks,
  ];
  const seen = new Set();

  return links
    .filter(([href]) => href !== urlPath)
    .filter(([href]) => {
      if (seen.has(href)) return false;
      seen.add(href);
      return true;
    })
    .slice(0, 8)
    .map(
      ([href, label]) => `<li><a href="${href}">${escapeHtml(label)}</a></li>`
    )
    .join("\n");
}

function buildSchemaBlocks(meta, urlPath, pageType) {
  const pageName = stripBrand(meta.title);
  const blocks = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${meta.canonical}#webpage`,
      url: meta.canonical,
      name: pageName,
      description: meta.description,
      isPartOf: {
        "@type": "WebSite",
        name: "Solar Freedom",
        url: BASE_URL,
      },
      about: [
        "solar contract cancellation",
        "solar lease problems",
        "solar loan disputes",
        "consumer protection law",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${BASE_URL}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: pageType === "blog_post" ? "Blog" : pageName,
          item: pageType === "blog_post" ? `${BASE_URL}/blog` : meta.canonical,
        },
        ...(pageType === "blog_post"
          ? [
              {
                "@type": "ListItem",
                position: 3,
                name: pageName,
                item: meta.canonical,
              },
            ]
          : []),
      ],
    },
  ];

  if (
    pageType === "city_page" ||
    pageType === "company_page" ||
    pageType === "service_page" ||
    pageType === "state_law"
  ) {
    const legalService = {
      "@context": "https://schema.org",
      "@type": "LegalService",
      name: "Solar Freedom",
      url: meta.canonical,
      description: meta.description,
      areaServed:
        meta.geo && (meta.geo.city || meta.geo.region)
          ? {
              "@type": "Place",
              address: {
                "@type": "PostalAddress",
                ...(meta.geo.city ? { addressLocality: meta.geo.city } : {}),
                ...(meta.geo.region ? { addressRegion: meta.geo.region } : {}),
                addressCountry: "US",
              },
            }
          : "United States",
      serviceType:
        pageType === "company_page"
          ? "Solar company contract cancellation"
          : "Solar contract cancellation",
    };
    blocks.push(legalService);
  }

  if (pageType === "blog_post") {
    const article = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: pageName,
      description: meta.description,
      mainEntityOfPage: meta.canonical,
      author: {
        "@type": "Organization",
        name: "Solar Freedom",
        url: BASE_URL,
      },
      publisher: {
        "@type": "Organization",
        name: "Solar Freedom",
        url: BASE_URL,
      },
    };
    if (meta.datePublished) article.datePublished = meta.datePublished;
    if (meta.dateModified) article.dateModified = meta.dateModified;
    blocks.push(article);
  }

  // FAQPage — strong answer-engine (AEO) signal. Only emitted when the page
  // ships real question/answer pairs from the blog data.
  if (Array.isArray(meta.faq) && meta.faq.length > 0) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: meta.faq.slice(0, 10).map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    });
  }

  return JSON.stringify(blocks).replace(/</g, "\\u003c");
}

function buildSemanticShellContent(meta, urlPath) {
  const pageType = classifyPath(urlPath);
  const h1 = stripBrand(meta.title);
  const contextLabel = pageType
    .replace(/_/g, " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());

  return `
  <div id="root">
    <main class="seo-prerender" data-page-type="${pageType}" style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 960px; margin: 0 auto; padding: 32px 20px; color: #111827;">
      <p style="font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: #f97316; font-weight: 700;">Solar Freedom ${escapeHtml(contextLabel)}</p>
      ${urlPath === "/" ? `<h2>${escapeHtml(h1)}</h2>` : `<h1>${escapeHtml(h1)}</h1>`}
      <p>${escapeHtml(meta.description)}</p>
      <p>Solar Freedom helps homeowners understand whether a solar lease, solar loan, power purchase agreement, UCC-1 fixture filing, or installer dispute may create a legal path out of a bad solar agreement. This page is part of a broader solar contract cancellation resource library built for homeowners who were promised savings, tax credits, home value increases, or easy contract transfers and later discovered that the paperwork told a different story.</p>
      <p>Many solar contract problems start with the same pattern: rushed door-to-door sales, confusing financing documents, inflated dealer fees, underperforming systems, unclear utility assumptions, or pressure to sign before the homeowner can compare options. When those facts appear in the sales record, consumer protection statutes, rescission rules, lending disclosures, warranty obligations, and state unfair-trade-practice laws may all matter.</p>
      <p>For ranking and answer-engine visibility, this source-visible summary gives crawlers a concise version of the same topic the React application expands for users. It identifies the core entity, the homeowner problem, the legal service category, and the related site resources before client-side JavaScript runs. That matters because search systems often compare the raw HTML, canonical URL, structured data, heading, and internal links before evaluating richer browser-rendered content.</p>
      <p>Homeowners researching this topic usually need three things: a plain-English explanation of what went wrong, a way to compare their issue against common legal grounds, and a direct path to request a free case review. Solar Freedom focuses on solar contract cancellation, solar loan disputes, solar lien removal, misleading savings claims, company bankruptcy problems, and sales practices involving companies such as Sunrun, Sunnova, GoodLeap, SunPower, Freedom Forever, Tesla Solar, and related finance providers.</p>
      <p>If you are reviewing this page because your solar payment is higher than expected, the system underperforms, the installer disappeared, the financing company will not help, or a solar lien is blocking a home sale or refinance, the next step is to gather the contract, financing paperwork, utility bills, sales proposal, text messages, and any production reports. Those documents help determine whether cancellation, balance reduction, lien removal, or another remedy is realistic.</p>
      <nav aria-label="Related Solar Freedom resources">
        <h2>Related Solar Contract Resources</h2>
        <ul>
          ${buildInternalLinks(urlPath)}
        </ul>
      </nav>
    </main>
  </div>`;
}

function buildShellHtml(meta, jsFile, cssFile, urlPath) {
  const title = escapeHtml(fitMetaTitle(meta.title));
  const desc = escapeHtml(meta.description);
  const canonical = meta.canonical;
  const pageType = classifyPath(urlPath);
  const semanticContent = buildSemanticShellContent(meta, urlPath);
  const schemaBlocks = buildSchemaBlocks(meta, urlPath, pageType);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="https://d2xsxph8kpxj0f.cloudfront.net/310519663287718525/46qo2AwgwNWJ4wJwr8EnH8/hero-bg-FmKRyibRwC4JGhU5naV2R2.webp">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <meta name="theme-color" content="#1a1a2e">
  <script type="application/ld+json">${schemaBlocks}</script>
  ${cssFile ? `<link rel="stylesheet" crossorigin href="/assets/${cssFile}">` : ""}
</head>
<body>
  ${semanticContent}
  ${jsFile ? `<script type="module" crossorigin src="/assets/${jsFile}"></script>` : ""}
</body>
</html>`;
}

// Keep injectMeta for homepage (which already exists as index.html and needs full content)
function injectMeta(html, meta) {
  const $ = cheerio.load(html, { decodeEntities: false });
  $("title").text(meta.title);
  $('meta[name="description"]').attr("content", meta.description);
  $('link[rel="canonical"]').remove();
  $("head").append(`<link rel="canonical" href="${meta.canonical}" />`);
  $('meta[property="og:title"]').attr("content", meta.title);
  $('meta[property="og:description"]').attr("content", meta.description);
  $('meta[property="og:url"]').attr("content", meta.canonical);
  $('meta[name="twitter:title"]').attr("content", meta.title);
  $('meta[name="twitter:description"]').attr("content", meta.description);
  $("#root").replaceWith(buildSemanticShellContent(meta, "/"));
  return $.html();
}

// DB blog posts are intentionally NOT loaded at build time.
// The deployment environment has no DB access, and any connection attempt
// (even with a timeout) leaves the mysql2 socket open and hangs the build.
// DB-published posts get their SEO meta at runtime via injectMetaDynamic()
// in server/_core/vite.ts, which does a live DB lookup on first request.
async function loadDbBlogPosts() {
  return {};
}

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  console.log("🔧 Pre-rendering static HTML files...");
  const indexHtml = fs.readFileSync(path.resolve(DIST, "index.html"), "utf-8");

  // Extract hashed asset filenames from the built index.html
  // These are needed so shell pages can reference the correct versioned JS/CSS
  const jsMatch = indexHtml.match(/assets\/(index-[^"']+\.js)/);
  const cssMatch = indexHtml.match(/assets\/(index-[^"']+\.css)/);
  const jsFile = jsMatch ? jsMatch[1] : null;
  const cssFile = cssMatch ? cssMatch[1] : null;
  console.log(`  📦 Assets: JS=${jsFile} CSS=${cssFile}`);

  const { cityEntries, companyEntries, stateEntries } = await loadData();
  const blogEntries = loadBlogData();
  // DB posts are handled at runtime by injectMetaDynamic() — not at build time.
  const allBlogEntries = { ...blogEntries };
  const metaMap = buildMetaMap(
    cityEntries,
    companyEntries,
    stateEntries,
    allBlogEntries
  );

  let count = 0;
  for (const [urlPath, meta] of Object.entries(metaMap)) {
    if (urlPath === "/") {
      // Fix the homepage index.html canonical too (it has the hardcoded one)
      const injected = injectMeta(indexHtml, meta);
      fs.writeFileSync(path.resolve(DIST, "index.html"), injected, "utf-8");
      continue;
    }

    // Use lightweight shell HTML for all non-homepage pages.
    // This keeps each file ~3 KB instead of 381 KB, reducing total dist
    // from 121 MB to under 6 MB so the deployment image builder doesn't time out.
    const shellHtml = buildShellHtml(meta, jsFile, cssFile, urlPath);

    // Create directory and write index.html
    const dir = path.resolve(DIST, urlPath.slice(1)); // remove leading /
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.resolve(dir, "index.html"), shellHtml, "utf-8");
    count++;
  }

  console.log(`✅ Pre-rendered ${count + 1} pages (including homepage)`);
  console.log(`   City pages: ${cityEntries.length}`);
  console.log(`   Company pages: ${companyEntries.length}`);
  console.log(`   State law pages: ${stateEntries.length}`);
  console.log(`   Blog posts: ${Object.keys(blogEntries).length}`);
  // Report final dist size
  try {
    const totalBytes = fs
      .readdirSync(DIST, { recursive: true, withFileTypes: true })
      .reduce((sum, entry) => {
        if (!entry.isFile()) return sum;
        return (
          sum + fs.statSync(path.resolve(entry.parentPath, entry.name)).size
        );
      }, 0);
    const size =
      totalBytes >= 1024 * 1024
        ? `${(totalBytes / 1024 / 1024).toFixed(1)} MB`
        : `${(totalBytes / 1024).toFixed(1)} KB`;
    console.log(`   📁 dist/public size: ${size}`);
  } catch (_) {}
}

main().catch(err => {
  console.error("Pre-render failed:", err);
  process.exit(1);
});
