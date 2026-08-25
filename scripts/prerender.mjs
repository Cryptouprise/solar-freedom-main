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
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.resolve(ROOT, "dist", "public");
const BASE_URL = "https://breakyoursolarcontract.com";
const indexEligibility = JSON.parse(
  fs.readFileSync(path.resolve(ROOT, "shared/index-eligibility.json"), "utf-8")
);
const INDEXED_CITY_SLUGS = new Set(indexEligibility.citySlugs);
const INDEXED_STATE_SLUGS = new Set(indexEligibility.stateSlugs);
const INDEXED_COMPANY_SLUGS = new Set(indexEligibility.companySlugs);
const INDEXED_BLOG_SLUGS = new Set(indexEligibility.blogSlugs);
const redirectLedger = JSON.parse(
  fs.readFileSync(path.resolve(ROOT, "shared/seo-redirects.json"), "utf-8")
);
const REDIRECT_SOURCE_PATHS = new Set([
  ...Object.keys(redirectLedger.public),
  ...Object.keys(redirectLedger.blog),
]);
const HOME_FAQS = JSON.parse(
  fs.readFileSync(path.resolve(ROOT, "shared/home-faq.json"), "utf-8")
);

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

  // Parse city entries with rich fields — split on object boundaries { ... }
  // IMPORTANT: name: comes BEFORE slug: in each city object, so we must split
  // on the opening brace of each object, not on the slug: field.
  const cityEntries = [];
  const cityObjectRegex = /\{\s*name:\s*["']([^"']+)["'][^}]*slug:\s*["']([^"']+)["'][^}]*\}/gs;
  let cityMatch;
  while ((cityMatch = cityObjectRegex.exec(citiesFile)) !== null) {
    const objText = cityMatch[0];
    const nameM = objText.match(/\bname:\s*["']([^"']+)["']/);
    const stateM = objText.match(/\bstate:\s*["']([^"']+)["']/);
    const stateCodeM = objText.match(/\bstateCode:\s*["']([^"']+)["']/);
    const slugM = objText.match(/\bslug:\s*["']([^"']+)["']/);
    const stateLawM = objText.match(/\bstateLaw:\s*["']([^"']+)["']/);
    const populationM = objText.match(/\bpopulation:\s*["']([^"']+)["']/);
    const solarActivityM = objText.match(/\bsolarActivity:\s*["']([^"']+)["']/);
    const companiesM = objText.match(/\bcompanies:\s*\[([^\]]+)\]/);
    const companiesList = companiesM
      ? companiesM[1].match(/["']([^"']+)["']/g)?.map(s => s.replace(/["']/g, '')) || []
      : [];
    if (!nameM || !slugM) continue;
    cityEntries.push({
      name: nameM[1],
      state: stateM?.[1] || '',
      stateCode: stateCodeM?.[1] || '',
      slug: slugM[1],
      stateLaw: stateLawM?.[1] || '',
      population: populationM?.[1] || '',
      solarActivity: solarActivityM?.[1] || '',
      companies: companiesList,
    });
  }

  // Parse company entries with rich fields — split on object boundaries
  const companyEntries = [];
  // Companies have slug: before name: so use a broader object match
  const companyObjectRegex = /\{[^}]*slug:\s*["']([^"']+)["'][\s\S]*?(?=\n\s*\{|$)/g;
  // Use collectSlugChunks approach but read the FULL object by tracking braces
  const companyChunks = [];
  let braceDepth = 0;
  let objStart = -1;
  for (let ci = 0; ci < companiesFile.length; ci++) {
    const ch = companiesFile[ci];
    if (ch === '{') {
      if (braceDepth === 0) objStart = ci;
      braceDepth++;
    } else if (ch === '}') {
      braceDepth--;
      if (braceDepth === 0 && objStart >= 0) {
        companyChunks.push(companiesFile.slice(objStart, ci + 1));
        objStart = -1;
      }
    }
  }
  for (const chunk of companyChunks) {
    const slugM2 = chunk.match(/\bslug:\s*["']([^"']+)["']/);
    if (!slugM2) continue;
    const nameM = chunk.match(/\bname:\s*["']([^"']+)["']/);
    const status = findStringProp(chunk, "status")?.value;
    const complaintCount = findStringProp(chunk, "complaintCount")?.value;
    const bbRating = findStringProp(chunk, "bbRating")?.value;
    const summary = findStringProp(chunk, "summary")?.value;
    const topComplaints = parseStringArray(chunk, "topComplaints");
    const cancellationGrounds = parseStringArray(chunk, "cancellationGrounds");
    const knownIssues = parseStringArray(chunk, "knownIssues");
    const lawsuits = parseStringArray(chunk, "lawsuits");
    if (!nameM) continue;
    companyEntries.push({
      slug: slugM2[1],
      name: nameM[1],
      status: status || 'Active',
      complaintCount: complaintCount || '',
      bbRating: bbRating || '',
      summary: summary || '',
      topComplaints,
      cancellationGrounds,
      knownIssues,
      lawsuits,
    });
  }

  const stateEntries = collectSlugChunks(stateLawsFile)
    .map(({ slug, chunk }) => ({
      slug,
      state: findStringProp(chunk, "state")?.value || titleFromSlug(slug),
      metaTitle: findStringProp(chunk, "metaTitle")?.value || null,
      metaDescription: findStringProp(chunk, "metaDescription")?.value || null,
      heroHook: findStringProp(chunk, "heroHook")?.value || null,
      heroSubhook: findStringProp(chunk, "heroSubhook")?.value || null,
      primaryStatute: findStringProp(chunk, "primaryStatute")?.value || null,
      primaryStatuteTitle: findStringProp(chunk, "primaryStatuteTitle")?.value || null,
      coolingOffNote: findStringProp(chunk, "coolingOffNote")?.value || null,
      contentSections: parseContentSections(chunk),
      faq: parseFaqItems(chunk),
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
  const propRegex = new RegExp(`(?:["'\`]${prop}["'\`]|\\b${prop})\\s*:`, "g");
  const match = propRegex.exec(content);
  if (!match) return null;
  return readStringAfterColon(content, propRegex.lastIndex);
}

function collectSlugChunks(content) {
  const slugRegex = /(?:["'`]slug["'`]|\bslug)\s*:/g;
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

function readBalanced(content, startIndex, openChar, closeChar) {
  if (content[startIndex] !== openChar) return null;
  let depth = 0;
  for (let index = startIndex; index < content.length; index++) {
    const character = content[index];
    if (["'", '"', "`"].includes(character)) {
      const literal = readStringLiteralAt(content, index);
      if (literal) {
        index = literal.end - 1;
        continue;
      }
    }
    if (character === openChar) depth += 1;
    if (character === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return { value: content.slice(startIndex, index + 1), end: index + 1 };
      }
    }
  }
  return null;
}

function findArrayProp(content, prop) {
  const property = new RegExp(`\\b${prop}\\s*:`).exec(content);
  if (!property) return null;
  let index = property.index + property[0].length;
  while (index < content.length && /\s/.test(content[index])) index += 1;
  return readBalanced(content, index, "[", "]");
}

function topLevelObjects(arraySource) {
  const objects = [];
  for (let index = 1; index < arraySource.length - 1; index++) {
    if (["'", '"', "`"].includes(arraySource[index])) {
      const literal = readStringLiteralAt(arraySource, index);
      if (literal) index = literal.end - 1;
      continue;
    }
    if (arraySource[index] !== "{") continue;
    const object = readBalanced(arraySource, index, "{", "}");
    if (!object) continue;
    objects.push(object.value);
    index = object.end - 1;
  }
  return objects;
}

function parseStringArray(content, prop) {
  const array = findArrayProp(content, prop);
  if (!array) return [];
  const values = [];
  for (let index = 1; index < array.value.length - 1; index++) {
    if (!["'", '"', "`"].includes(array.value[index])) continue;
    const literal = readStringLiteralAt(array.value, index);
    if (!literal) continue;
    values.push(literal.value);
    index = literal.end - 1;
  }
  return values;
}

function parseContentSections(content) {
  const array = findArrayProp(content, "content");
  if (!array) return [];
  return topLevelObjects(array.value)
    .map(object => ({
      type: findStringProp(object, "type")?.value || "p",
      content: findStringProp(object, "content")?.value || "",
      items: parseStringArray(object, "items"),
      stats: (findArrayProp(object, "stats")
        ? topLevelObjects(findArrayProp(object, "stats").value)
        : []
      ).map(stat => ({
        value: findStringProp(stat, "value")?.value || "",
        label: findStringProp(stat, "label")?.value || "",
      })),
    }))
    .filter(section => section.content || section.items.length || section.stats.length);
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

function parseExternalCitations(chunk) {
  const urls = [];
  const markdownLink = /\[[^\]]+\]\((https?:\/\/[^)]+)\)/g;
  let match;
  while ((match = markdownLink.exec(chunk)) !== null) urls.push(match[1]);

  const htmlLink = /href=["'](https?:\/\/[^"']+)["']/gi;
  while ((match = htmlLink.exec(chunk)) !== null) urls.push(match[1]);
  return Array.from(new Set(urls));
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
    "blog-articles-batch11.ts",
    "blog-articles-batch12.ts",
    "blog-articles-batch13.ts",
    "blog-articles-batch14.ts",
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
        contentSections: parseContentSections(chunk),
        excerpt: findStringProp(chunk, "excerpt")?.value || "",
        category: findStringProp(chunk, "category")?.value || "Solar contract guide",
        datePublished: toIsoDate(publishDate),
        dateModified: toIsoDate(updatedDate) || toIsoDate(publishDate),
        citations: parseExternalCitations(chunk),
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
// ─── Build meta map ───────────────────────────────────────────────────────────
function buildMetaMap(cityEntries, companyEntries, stateEntries, blogEntries) {
  const map = {};

  // Homepage
  map["/"] = {
    title: "Solar Contract Review and Document Help | Solar Freedom",
    description:
      "Organize your solar agreement, financing records, notices, bills, production data, service history, company status, and home-sale requirements for individual review.",
    canonical: `${BASE_URL}/`,
    faq: HOME_FAQS,
  };

  // City pages — 303 pages
  for (const city of cityEntries) {
    const urlPath = `/cancel-solar-contract/${city.slug}`;
    const cityLabel = city.stateCode
      ? `${city.name}, ${city.stateCode}`
      : city.name;
    map[urlPath] = {
      title: `Cancel Solar Contract in ${cityLabel} | Solar Freedom`,
      description: fitMetaDescription(
        `Review solar contract terms and consumer resources for ${cityLabel}. Options and timing depend on your agreement, facts, and jurisdiction.`
      ),
      canonical: `${BASE_URL}${urlPath}`,
      noindex: !INDEXED_CITY_SLUGS.has(city.slug),
      geo: { city: city.name, region: city.stateCode || undefined },
      // Rich fields for unique prerender content
      cityData: {
        state: city.state,
        stateCode: city.stateCode,
        stateLaw: city.stateLaw,
        population: city.population,
        solarActivity: city.solarActivity,
        companies: city.companies,
      },
    };
  }

  // Company pages
  for (const company of companyEntries) {
    const urlPath = `/cancel-${company.slug}-solar-contract`;
    map[urlPath] = {
      title: `Cancel ${company.name} Solar Contract | Solar Freedom`,
      description: `Review ${company.name} solar contract terms, complaint resources, and records to gather before requesting an individual case review.`,
      canonical: `${BASE_URL}${urlPath}`,
      noindex: !INDEXED_COMPANY_SLUGS.has(company.slug),
      // Rich fields for unique prerender content
      companyData: {
        status: company.status,
        complaintCount: company.complaintCount,
        bbRating: company.bbRating,
        summary: company.summary,
        topComplaints: company.topComplaints,
        cancellationGrounds: company.cancellationGrounds,
        knownIssues: company.knownIssues,
        lawsuits: company.lawsuits,
      },
    };
  }

  // State law pages — 51 pages (use per-state metaTitle/metaDescription if available)
  for (const state of stateEntries) {
    const urlPath = `/solar-contract-laws/${state.slug}`;
    const title = state.metaTitle
      ? `${state.metaTitle} | Solar Freedom`
      : `${state.state} Solar Contract Laws | Your Rights | Solar Freedom`;
    const description = `Review solar-contract consumer information for ${state.state}, including records to gather and official sources to verify. Options depend on facts and current law.`;
    map[urlPath] = {
      title,
      description,
      canonical: `${BASE_URL}${urlPath}`,
      noindex: !INDEXED_STATE_SLUGS.has(state.slug),
      geo: { region: state.state },
      stateData: {
        state: state.state,
        heroHook: state.heroHook,
        heroSubhook: state.heroSubhook,
        primaryStatute: state.primaryStatute,
        primaryStatuteTitle: state.primaryStatuteTitle,
        coolingOffNote: state.coolingOffNote,
        contentSections: state.contentSections,
        faq: state.faq,
      },
      faq: state.faq,
    };
  }

  // Blog posts — ALL 100+ posts
  for (const [slug, data] of Object.entries(blogEntries)) {
    const urlPath = `/blog/${slug}`;
    map[urlPath] = {
      title: data.title,
      description: suppressUnverifiedFirstPartyClaims(data.description),
      canonical: `${BASE_URL}${urlPath}`,
      noindex: !INDEXED_BLOG_SLUGS.has(slug),
      faq: data.faq?.map(item => ({ ...item, a: suppressUnverifiedFirstPartyClaims(item.a) })),
      datePublished: data.datePublished,
      dateModified: data.dateModified,
      citations: data.citations,
      contentSections: data.contentSections,
      excerpt: suppressUnverifiedFirstPartyClaims(data.excerpt),
      category: data.category,
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
      desc: "Review solar contract terms, rescission information, financing disputes, UCC filings, and records to gather before requesting an individual review.",
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
      path: "/solar-lien-removal",
      title: "Solar Lien Removal | Remove a UCC-1 Solar Lien | Solar Freedom",
      desc: "Learn how a UCC-1 fixture filing may affect a home sale or refinance and which records to gather before requesting an individual review.",
    },
    {
      path: "/solar-loan-help",
      title: "Solar Loan Help | Fight Predatory Solar Loans | Solar Freedom",
      desc: "Review solar loan terms, disclosures, dealer fees, and consumer resources. Available options depend on the documents and applicable law.",
    },
    {
      path: "/selling-house-with-solar",
      title: "Selling a House With Solar Panels & a Loan | Solar Freedom",
      desc: "Review transfer, payoff, financing, and UCC-filing questions that may arise when selling a home with solar equipment.",
    },
    {
      path: "/solar-exit-options",
      title: "Solar Exit Options | How to Get Out of a Solar Contract",
      desc: "Compare possible solar-contract paths and the documents, limits, and risks to review before deciding what to do next.",
    },
    {
      path: "/solar-contract-laws",
      title: "Solar Contract Laws by State | Your Legal Rights | Solar Freedom",
      desc: "Every state has different solar contract laws. Find your state's cooling-off period, consumer protection statutes, and cancellation rights.",
    },
    {
      path: "/sitemap",
      title: "Site Directory | Solar Freedom",
      desc: "Browse Solar Freedom resources by topic, solar company, and location.",
      noindex: true,
    },
  ];
  for (const p of staticPages) {
    map[p.path] = {
      title: p.title,
      description: p.desc,
      canonical: `${BASE_URL}${p.path}`,
      noindex: p.noindex,
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

const unsupportedFirstPartyClaimPatterns = [
  /3,000\+/i,
  /Our attorneys/i,
  /Success Rate/i,
  /Homeowners (?:Helped|Freed)/i,
  /Avg\. Resolution Time/i,
  /Results in 30[–-]90 days/i,
  /within 24 hours/i,
  /licensed counsel/i,
  /nationwide coverage/i,
  /limited number of new cases/i,
  /Contract cancelled\. No more payments/i,
  /(?:Solar Freedom|\bwe\b|\bour (?:team|attorneys)\b)[^.!?]{0,160}(?:no upfront cost|contingency basis|all 50 states)/i,
];

function suppressUnverifiedFirstPartyClaims(input) {
  const value = String(input ?? "");
  if (!unsupportedFirstPartyClaimPatterns.some(pattern => pattern.test(value))) return value;
  return "This material is withheld pending documented evidence and review. Options depend on the agreement, facts, jurisdiction, and any written engagement terms.";
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
  if (normalized.length <= 70) return normalized;

  const withoutBrand = stripBrand(normalized);
  if (withoutBrand.length <= 70) return withoutBrand;

  const tightened = withoutBrand
    .replace(/\s+\((?:2026|2026 Guide|Complete Guide)\)/gi, "")
    .replace(/\s+[\u2013\u2014-]\s+(?:Free Case Review|Legal Help|Solar Freedom).*$/i, "")
    // For state law pages: trim '& Your Legal...' and similar suffixes
    .replace(/\s+&(?:amp;)?\s+Your\s+Legal.*$/i, "")
    .replace(/:\s+[A-Z][^,]+,\s+[A-Z][^&]+&.*$/, "")
    .trim();
  if (tightened.length <= 70) return tightened;

  // Hard truncate at word boundary at 67 chars
  return `${tightened.slice(0, 67).replace(/\s+\S*$/, "")}...`;
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
    ["/blog/how-to-get-out-of-a-solar-contract", "How to get out of a solar contract"],
    ["/blog/sunrun-solar-contract-cancellation-2026", "Sunrun contract cancellation options"],
    ["/blog/goodleap-solar-loan-cancellation-hidden-fees-2026", "GoodLeap loan payoff and cancellation guide"],
    ["/blog/blue-raven-solar-complaints", "Blue Raven Solar status and support"],
    ["/blog/adt-solar-complaints", "ADT Solar shutdown and support"],
    ["/blog/new-jersey-solar-contract-rights", "New Jersey solar contract rights"],
    ["/blog/solar-contract-rescission-rights", "Solar contract rescission rights"],
    ["/blog/how-to-file-a-complaint-against-solar-company-attorney-general", "File a solar company complaint"],
  ];

  const contextualLinks = {
    "/blog/how-to-get-out-of-a-solar-contract": [
      ["/blog/solar-contract-rescission-rights", "Check solar contract rescission terms"],
      ["/solar-loan-help", "Review a solar loan"],
      ["/selling-house-with-solar", "Selling a home with solar"],
    ],
    "/blog/sunrun-solar-contract-cancellation-2026": [
      ["/blog/cancel-sunrun-solar-contract-before-installation", "Cancel Sunrun before installation"],
      ["/blog/sunrun-complaints-california", "Sunrun complaints in California"],
      ["/blog/solar-contract-rescission-rights", "Solar contract rescission rights"],
      ["/blog/how-to-file-a-complaint-against-solar-company-attorney-general", "File a solar company complaint"],
    ],
    "/blog/goodleap-solar-loan-cancellation-hidden-fees-2026": [
      ["/solar-loan-help", "Solar loan document review"],
      ["/blog/solar-payments-too-high-help", "What to review when solar payments are too high"],
      ["/selling-house-with-solar", "Selling a home with a solar loan"],
      ["/blog/how-to-file-a-complaint-against-solar-company-attorney-general", "Solar loan complaint options"],
    ],
    "/blog/blue-raven-solar-complaints": [
      ["/blog/solar-installer-out-of-business", "When a solar installer changes or closes"],
      ["/blog/how-to-file-a-complaint-against-solar-company-attorney-general", "File a solar company complaint"],
      ["/blog/how-to-get-out-of-a-solar-contract", "Review solar contract exit options"],
    ],
    "/blog/adt-solar-complaints": [
      ["/blog/solar-installer-out-of-business", "When a solar installer exits the market"],
      ["/blog/how-to-file-a-complaint-against-solar-company-attorney-general", "File a solar company complaint"],
      ["/blog/how-to-get-out-of-a-solar-contract", "Review solar contract exit options"],
    ],
    "/blog/solar-contract-rescission-rights": [
      ["/blog/how-to-file-a-complaint-against-solar-company-attorney-general", "File a solar company complaint"],
      ["/blog/new-jersey-solar-contract-rights", "New Jersey solar contract rights"],
      ["/blog/sunrun-solar-contract-cancellation-2026", "Sunrun contract cancellation options"],
      ["/blog/how-to-get-out-of-a-solar-contract", "How to get out of a solar contract"],
    ],
    "/blog/new-jersey-solar-contract-rights": [
      ["/blog/solar-contract-rescission-rights", "Solar contract rescission rights"],
      ["/blog/how-to-file-a-complaint-against-solar-company-attorney-general", "File a solar company complaint"],
      ["/blog/how-to-get-out-of-a-solar-contract", "How to get out of a solar contract"],
      ["/solar-contract-laws", "Solar contract laws by state"],
    ],
    "/blog/how-to-file-a-complaint-against-solar-company-attorney-general": [
      ["/blog/solar-contract-rescission-rights", "Solar contract rescission rights"],
      ["/blog/sunrun-solar-contract-cancellation-2026", "Sunrun contract cancellation options"],
      ["/blog/goodleap-solar-loan-cancellation-hidden-fees-2026", "GoodLeap loan complaint and payoff guide"],
      ["/blog/how-to-get-out-of-a-solar-contract", "How to get out of a solar contract"],
    ],
    "/blog/sunrun-complaints-california": [
      ["/blog/sunrun-solar-contract-cancellation-2026", "Sunrun contract cancellation options"],
      ["/blog/cancel-sunrun-solar-contract-before-installation", "Cancel Sunrun before installation"],
      ["/blog/solar-contract-rescission-rights", "Solar contract rescission rights"],
      ["/blog/how-to-get-out-of-a-solar-contract", "How to get out of a solar contract"],
    ],
  };

  const links = [
    ...(contextualLinks[urlPath] || []),
    ...defaultLinks,
  ];
  const seen = new Set();

  return links
    .filter(([href]) => href !== urlPath)
    .filter(([href]) => !REDIRECT_SOURCE_PATHS.has(href))
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
  const organizationId = `${BASE_URL}/#organization`;
  const websiteId = `${BASE_URL}/#website`;
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
        "@id": websiteId,
        name: "Solar Freedom",
        url: BASE_URL,
        publisher: { "@id": organizationId },
      },
      inLanguage: "en-US",
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

  if (urlPath === "/") {
    blocks.push(
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": organizationId,
        name: "Solar Freedom",
        url: BASE_URL,
        logo: { "@type": "ImageObject", url: `${BASE_URL}/favicon.ico` },
        description: "Solar Freedom publishes educational solar-contract guides and provides intake for fact-specific document reviews.",
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": websiteId,
        name: "Solar Freedom",
        url: BASE_URL,
        publisher: { "@id": organizationId },
        inLanguage: "en-US",
      },
      {
        "@context": "https://schema.org",
        "@type": "Service",
        "@id": `${BASE_URL}/#contract-review-service`,
        name: "Solar Contract Document Review",
        provider: { "@id": organizationId },
        description: "Fact-specific intake and document review for solar agreements, financing records, notices, bills, production records, service history, and home-sale requirements.",
        serviceType: "Solar contract document review",
        areaServed: { "@type": "Country", name: "United States" },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Initial intake review offered at no charge",
        },
      }
    );
  }

  if (pageType === "blog_post") {
    const article = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: pageName,
      description: meta.description,
      mainEntityOfPage: { "@type": "WebPage", "@id": `${meta.canonical}#webpage` },
      url: meta.canonical,
      author: {
        "@type": "Organization",
        "@id": organizationId,
        name: "Solar Freedom",
        url: BASE_URL,
      },
      publisher: {
        "@type": "Organization",
        "@id": organizationId,
        name: "Solar Freedom",
        url: BASE_URL,
      },
      citation: Array.isArray(meta.citations) && meta.citations.length ? meta.citations : undefined,
      inLanguage: "en-US",
      isAccessibleForFree: true,
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

function buildCityUniqueContent(meta, urlPath) {
  const cd = meta.cityData;
  if (!cd) return '';
  const cityName = meta.geo?.city || urlPath.split('/').pop()?.split('-').slice(0, -1).map(w => w[0].toUpperCase() + w.slice(1)).join(' ') || 'this city';
  const stateName = cd.state || cd.stateCode || 'your state';
  const population = cd.population ? `${cd.population} residents` : 'a local homeowner population';
  const solarActivity = cd.solarActivity || 'active';
  const stateLaw = cd.stateLaw ? escapeHtml(cd.stateLaw) : '';
  const companies = (cd.companies || [])
    .map(company => `<li>${escapeHtml(company)}</li>`)
    .join('');

  return `
      <h2>Solar contract questions in ${escapeHtml(cityName)}</h2>
      <p>${escapeHtml(cityName)} is a ${escapeHtml(solarActivity.toLowerCase())} solar market in ${escapeHtml(stateName)}, with an estimated ${escapeHtml(population)}. If a solar agreement, production promise, billing issue, or transfer requirement is causing concern, start with the signed documents and the facts specific to the installation rather than relying on a general online answer.</p>
      <p>Solar Freedom’s ${escapeHtml(cityName)} resource is designed to help homeowners organize the information that may matter in a contract review. It does not determine whether a company, lender, salesperson, or agreement violated any law, and it does not replace advice from a qualified professional.</p>

      <h2>What to gather before requesting help</h2>
      <ul>
        <li>The signed contract, financing agreement, lease, PPA, and all addenda or change orders.</li>
        <li>Sales proposals, promised-production estimates, utility bills, monitoring records, and any relevant inspection or permit documents.</li>
        <li>Emails, text messages, advertisements, and notes describing what was represented before the agreement was signed.</li>
        <li>Any correspondence about cancellation, system performance, billing, repair, a lien, a home sale, or a proposed transfer.</li>
      </ul>

      <h2>${escapeHtml(stateName)} consumer-law reference</h2>
      ${stateLaw ? `<p>The state-law reference associated with this location is <strong>${stateLaw}</strong>. Whether a statute applies, whether a deadline exists, and what options may be available depend on the actual agreement and facts. Review the official statutory text and seek appropriate professional guidance before acting.</p>` : `<p>Consumer-protection rules and contract remedies vary by state and by the facts of the transaction. Review the dedicated ${escapeHtml(stateName)} law resource for a starting point.</p>`}

      <h2>Companies researched in this location</h2>
      <p>The following names are included in Solar Freedom’s research library for ${escapeHtml(cityName)}. Their appearance here is not a statement that they currently operate in the city or that any individual has a claim against them.</p>
      <dl>
        <dt>City</dt><dd>${escapeHtml(cityName)}</dd>
        <dt>State</dt><dd>${escapeHtml(stateName)}</dd>
        <dt>Market activity</dt><dd>${escapeHtml(solarActivity)}</dd>
      </dl>
      ${companies ? `<ul>${companies}</ul>` : ''}

      <h2>Practical next step</h2>
      <p>Keep a written timeline of the sale, installation, billing, and service events. A fact-specific review can help identify which questions to raise, what documents are missing, and whether a local or state-level resource may be relevant.</p>`;
}

function buildCompanyUniqueContent(meta) {
  const cd = meta.companyData;
  if (!cd) return '';
  const companyName = meta.title.replace(/Cancel\s+|\s+Solar Contract.*/gi, '').trim() || 'this company';
  const complaintsText = (cd.topComplaints || [])
    .map(complaint => `<li>${escapeHtml(complaint)}</li>`)
    .join('');
  const groundsText = (cd.cancellationGrounds || [])
    .map(ground => `<li>${escapeHtml(ground)}</li>`)
    .join('');
  const knownIssuesText = cd.knownIssues?.length
    ? cd.knownIssues.map(issue => `<li>${escapeHtml(issue)}</li>`).join('')
    : "";
  const lawsuitsText = cd.lawsuits?.length
    ? cd.lawsuits.map(issue => `<li>${escapeHtml(issue)}</li>`).join('')
    : "";

  return `
      <h2>About ${escapeHtml(companyName)}</h2>
      ${cd.summary ? `<p>${escapeHtml(suppressUnverifiedFirstPartyClaims(cd.summary))}</p>` : ''}
      ${complaintsText ? `<h2>Complaints listed on this page</h2><ul>${complaintsText}</ul>` : ''}
      ${knownIssuesText ? `<h2>Issues listed on this page</h2><ul>${knownIssuesText}</ul>` : ''}
      ${groundsText ? `<h2>Cancellation grounds listed on this page</h2><ul>${groundsText}</ul>` : ''}
      ${lawsuitsText ? `<h2>Legal matters listed on this page</h2><ul>${lawsuitsText}</ul>` : ''}`;
}

function hasVerifiedQuoteEvidence(value) {
  const evidence = value?.verification;
  if (!evidence || evidence.consentConfirmed !== true) return false;
  if (typeof evidence.sourceLabel !== "string" || !evidence.sourceLabel.trim()) return false;
  if (Number.isNaN(Date.parse(evidence.verifiedAt))) return false;
  try {
    return new URL(evidence.sourceUrl).protocol === "https:";
  } catch {
    return false;
  }
}

function renderContentSections(sections) {
  return (sections || [])
    .map(section => {
      const content = escapeHtml(suppressUnverifiedFirstPartyClaims(section.content || ""));
      if (section.type === "h2") return `<h2>${content}</h2>`;
      if (section.type === "h3") return `<h3>${content}</h3>`;
      if (section.type === "quote") {
        if (!content || !hasVerifiedQuoteEvidence(section)) return "";
        return `<blockquote cite="${escapeHtml(section.verification.sourceUrl)}"><p>${content}</p><cite>${escapeHtml(section.verification.sourceLabel)}</cite></blockquote>`;
      }
      if (["p", "callout", "warning"].includes(section.type) && content) {
        return `<p${section.type !== "p" ? ` data-content-type="${section.type}"` : ""}>${content}</p>`;
      }
      if (section.type === "list" && section.items?.length) {
        return `<ul>${section.items.map(item => `<li>${escapeHtml(suppressUnverifiedFirstPartyClaims(item))}</li>`).join("")}</ul>`;
      }
      if (section.type === "stat-block" && section.stats?.length) {
        return `<dl>${section.stats
          .filter(stat => suppressUnverifiedFirstPartyClaims(stat.value) === String(stat.value) && suppressUnverifiedFirstPartyClaims(stat.label) === String(stat.label))
          .map(stat => `<dt>${escapeHtml(stat.value)}</dt><dd>${escapeHtml(stat.label)}</dd>`)
          .join("")}</dl>`;
      }
      return "";
    })
    .join("\n");
}

function buildStateUniqueContent(meta) {
  const state = meta.stateData;
  if (!state) return "";
  const faq = (state.faq || [])
    .map(item => `<h3>${escapeHtml(item.q)}</h3><p>${escapeHtml(suppressUnverifiedFirstPartyClaims(item.a))}</p>`)
    .join("");
  return `
    ${state.heroHook ? `<p>${escapeHtml(suppressUnverifiedFirstPartyClaims(state.heroHook))}</p>` : ""}
    ${state.heroSubhook ? `<p>${escapeHtml(suppressUnverifiedFirstPartyClaims(state.heroSubhook))}</p>` : ""}
    ${state.primaryStatuteTitle ? `<h2>${escapeHtml(state.primaryStatuteTitle)}</h2>` : ""}
    ${state.primaryStatute ? `<p>${escapeHtml(state.primaryStatute)}</p>` : ""}
    ${state.coolingOffNote ? `<p>${escapeHtml(state.coolingOffNote)}</p>` : ""}
    ${renderContentSections(state.contentSections)}
    ${faq ? `<section><h2>${escapeHtml(state.state)} solar contract FAQ</h2>${faq}</section>` : ""}`;
}

function buildHomeUniqueContent() {
  const faq = HOME_FAQS
    .map(item => `<h3>${escapeHtml(item.q)}</h3><p>${escapeHtml(item.a)}</p>`)
    .join("");
  return `<section class="faq-section"><h2>Common solar contract questions</h2>${faq}</section>`;
}

function buildBlogUniqueContent(meta) {
  const sections = renderContentSections(meta.contentSections);
  const faq = (meta.faq || [])
    .map(item => `<h3>${escapeHtml(item.q)}</h3><p>${escapeHtml(suppressUnverifiedFirstPartyClaims(item.a))}</p>`)
    .join("");
  const sources = (meta.citations || [])
    .map(url => `<li><a href="${escapeHtml(url)}" rel="noopener noreferrer">${escapeHtml(url)}</a></li>`)
    .join("");
  return `
    ${meta.category ? `<p>${escapeHtml(meta.category)}</p>` : ""}
    ${meta.excerpt ? `<p>${escapeHtml(meta.excerpt)}</p>` : ""}
    ${sections}
    ${sources ? `<section class="article-sources"><h2>Primary sources and official procedures</h2><ul>${sources}</ul></section>` : ""}
    ${faq ? `<section class="faq-section"><h2>Frequently asked questions</h2>${faq}</section>` : ""}
    <section class="editorial-method"><h2>Editorial method</h2><p>Solar Freedom publishes educational contract-navigation content. Articles are checked for source accuracy, clear separation between general information and individual advice, current official procedures, and unsupported outcome claims. We do not claim attorney review unless a named reviewer and review date are displayed. This article is not legal advice.</p></section>`;
}

function buildSemanticShellContent(meta, urlPath) {
  const pageType = classifyPath(urlPath);
  const h1 = stripBrand(meta.title);
  const contextLabel = pageType
    .replace(/_/g, " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());
  const sourceDescription = ["city_page", "company_page"].includes(pageType)
    ? ""
    : `<p>${escapeHtml(meta.description)}</p>`;

  // Build page-type-specific unique body content
  let uniqueBody = '';
  if (urlPath === '/') {
    uniqueBody = buildHomeUniqueContent();
  } else if (pageType === 'city_page') {
    uniqueBody = buildCityUniqueContent(meta, urlPath);
  } else if (pageType === 'company_page') {
    uniqueBody = buildCompanyUniqueContent(meta, urlPath);
  } else if (pageType === 'blog_post') {
    uniqueBody = buildBlogUniqueContent(meta);
  } else if (pageType === 'state_law') {
    uniqueBody = buildStateUniqueContent(meta);
  } else {
    // Service pages: brief unique intro
    uniqueBody = '';
  }

  return `
  <div id="root">
    <main class="seo-prerender" data-page-type="${pageType}" style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 960px; margin: 0 auto; padding: 32px 20px; color: #111827;">
      <p style="font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: #f97316; font-weight: 700;">Solar Freedom ${escapeHtml(contextLabel)}</p>
      ${urlPath === "/" ? `<h2>${escapeHtml(h1)}</h2>` : `<h1>${escapeHtml(h1)}</h1>`}
      ${sourceDescription}
      ${uniqueBody}
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
  <meta name="robots" content="${meta.noindex ? 'noindex, follow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'}">
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
  const schemaBlocks = buildSchemaBlocks(meta, "/", classifyPath("/"));
  $("title").text(meta.title);
  $('meta[name="description"]').attr("content", meta.description);
  $('link[rel="canonical"]').remove();
  $("head").append(`<link rel="canonical" href="${meta.canonical}" />`);
  $('meta[property="og:title"]').attr("content", meta.title);
  $('meta[property="og:description"]').attr("content", meta.description);
  $('meta[property="og:url"]').attr("content", meta.canonical);
  $('meta[name="twitter:title"]').attr("content", meta.title);
  $('meta[name="twitter:description"]').attr("content", meta.description);
  $('script[type="application/ld+json"]').remove();
  $("head").append(`<script type="application/ld+json">${schemaBlocks}</script>`);
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

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  main().catch(err => {
    console.error("Pre-render failed:", err);
    process.exit(1);
  });
}

export {
  buildMetaMap,
  buildShellHtml,
  loadBlogData,
  loadData,
  renderContentSections,
};
