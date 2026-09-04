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
const RETIRED_PUBLIC_PATHS = new Set(indexEligibility.retiredPublicPaths ?? []);
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

/** Hand-curated editorial relatedness already present in the article data. */
function parseRelatedSlugs(chunk) {
  const match = chunk.match(/\brelatedSlugs:\s*\[([^\]]*)\]/s);
  if (!match) return [];
  return (match[1].match(/["']([^"']+)["']/g) || []).map(value => value.replace(/["']/g, ""));
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
  ];
  const blogEntries = {};
  for (const filename of blogFiles) {
    const filePath = path.resolve(ROOT, "client/src/data", filename);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf-8");
    for (const entry of collectSlugChunks(content)) {
      const { slug, chunk } = entry;
      if (!slug || slug.includes("${") || slug.length <= 5 || blogEntries[slug]) continue;
      const title = findStringProp(chunk, "metaTitle")?.value || findStringProp(chunk, "title")?.value || "";
      const description = findStringProp(chunk, "metaDescription")?.value || findStringProp(chunk, "excerpt")?.value || "";
      const cleanTitle = cleanBlogTitle(slug, title);
      const cleanDescription = cleanBlogDescription(slug, description, cleanTitle);
      const faq = parseFaqItems(chunk);
      const publishDate = findStringProp(chunk, "publishDate")?.value || findStringProp(chunk, "datePublished")?.value || "";
      const updatedDate = findStringProp(chunk, "updatedDate")?.value || findStringProp(chunk, "dateModified")?.value || "";
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
        relatedSlugs: parseRelatedSlugs(chunk),
      };
    }
  }
  const seenDescriptions = new Map();
  for (const [slug, data] of Object.entries(blogEntries)) {
    const key = data.description.toLowerCase();
    if (seenDescriptions.has(key)) {
      const plainTitle = data.title.replace(/\s+\|\s+Solar Freedom$/i, "");
      data.description = fitMetaDescription(`${data.description} This ${plainTitle} guide explains the specific documents, risks, and cancellation options to review.`);
    } else {
      seenDescriptions.set(key, slug);
    }
  }
  return blogEntries;
}

function buildMetaMap(cityEntries, companyEntries, stateEntries, blogEntries) {
  const map = {};
  map["/"] = {
    title: "Cancel Your Solar Contract | Solar Freedom",
    description: "Stuck in a solar lease, loan, or PPA? See which records to gather and what options may apply. Individual review. Solar Freedom is not a law firm.",
    canonical: `${BASE_URL}/`,
    faq: HOME_FAQS,
  };
  for (const city of cityEntries) {
    const urlPath = `/cancel-solar-contract/${city.slug}`;
    const cityLabel = city.stateCode ? `${city.name}, ${city.stateCode}` : city.name;
    map[urlPath] = {
      title: `Cancel a Solar Contract in ${cityLabel} | Solar Freedom`,
      description: fitMetaDescription(`Solar contract records and consumer resources for ${cityLabel}. Options and timing depend on the agreement, facts, and jurisdiction.`),
      canonical: `${BASE_URL}${urlPath}`,
      noindex: !INDEXED_CITY_SLUGS.has(city.slug),
      geo: { city: city.name, region: city.stateCode || undefined },
      cityData: { state: city.state, stateCode: city.stateCode, stateLaw: city.stateLaw, population: city.population, solarActivity: city.solarActivity, companies: city.companies },
    };
  }
  for (const company of companyEntries) {
    const urlPath = `/cancel-${company.slug}-solar-contract`;
    map[urlPath] = {
      title: `Cancel ${company.name} Solar Contract | Solar Freedom`,
      description: `Review ${company.name} solar contract terms, complaint resources, and records to gather before requesting an individual case review.`,
      canonical: `${BASE_URL}${urlPath}`,
      noindex: !INDEXED_COMPANY_SLUGS.has(company.slug),
      companyData: { status: company.status, complaintCount: company.complaintCount, bbRating: company.bbRating, summary: company.summary, topComplaints: company.topComplaints, cancellationGrounds: company.cancellationGrounds, knownIssues: company.knownIssues, lawsuits: company.lawsuits },
    };
  }
  for (const state of stateEntries) {
    const urlPath = `/solar-contract-laws/${state.slug}`;
    const title = state.metaTitle ? `${state.metaTitle} | Solar Freedom` : `${state.state} Solar Contract Laws | Your Rights | Solar Freedom`;
    const description = `Review solar-contract consumer information for ${state.state}, including records to gather and official sources to verify. Options depend on facts and current law.`;
    map[urlPath] = {
      title,
      description,
      canonical: `${BASE_URL}${urlPath}`,
      noindex: !INDEXED_STATE_SLUGS.has(state.slug),
      geo: { region: state.state },
      stateData: { state: state.state, heroHook: state.heroHook, heroSubhook: state.heroSubhook, primaryStatute: state.primaryStatute, primaryStatuteTitle: state.primaryStatuteTitle, coolingOffNote: state.coolingOffNote, contentSections: state.contentSections, faq: state.faq },
      faq: state.faq,
    };
  }
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
  const staticPages = [
    { path: "/blog", title: "Solar Contract Guides: Cancel, Dispute, Sell | Solar Freedom", desc: "Expert articles on how to cancel solar contracts, fight solar fraud, and understand your legal rights as a homeowner." },
    { path: "/how-it-works", title: "How Solar Contract Cancellation Works | Solar Freedom", desc: "See how Solar Freedom reviews solar contracts, gathers records, and prepares an individual case review. Not a law firm. Outcomes depend on the documents and facts." },
    { path: "/solar-contract-help", title: "Solar Contract Help | Legal Options to Cancel | Solar Freedom", desc: "Review solar contract terms, rescission information, financing disputes, UCC filings, and records to gather before requesting an individual review." },
    { path: "/solar-panel-scam", title: "Solar Panel Scam Warning Signs | Solar Freedom", desc: "Learn common solar-sales warning signs and which records to keep." },
    { path: "/solar-companies", title: "Solar Company Complaints & Cancellation Guide | Solar Freedom", desc: "Compare complaints and cancellation options for Sunrun, Sunnova, GoodLeap, SunPower, Freedom Forever, Tesla Solar, and more." },
    { path: "/solar-lien-removal", title: "Solar Lien Removal | Remove a UCC-1 Solar Lien | Solar Freedom", desc: "Learn how a UCC-1 fixture filing may affect a home sale or refinance and which records to gather before requesting an individual review." },
    { path: "/solar-loan-help", title: "Solar Loan Help | Fight Predatory Solar Loans | Solar Freedom", desc: "Review solar loan terms, disclosures, dealer fees, and consumer resources. Available options depend on the documents and applicable law." },
    { path: "/selling-house-with-solar", title: "Selling a House With Solar Panels & a Loan | Solar Freedom", desc: "Review transfer, payoff, financing, and UCC-filing questions that may arise when selling a home with solar equipment." },
    { path: "/solar-exit-options", title: "Solar Exit Options | How to Get Out of a Solar Contract", desc: "Compare possible solar-contract paths and the documents, limits, and risks to review before deciding what to do next." },
    { path: "/solar-contract-laws", title: "Solar Contract Laws by State | Your Legal Rights | Solar Freedom", desc: "Every state has different solar contract laws. Find your state's cooling-off period, consumer protection statutes, and cancellation rights." },
    { path: "/sitemap", title: "Site Directory | Solar Freedom", desc: "Browse Solar Freedom resources by topic, solar company, and location.", noindex: true },
    { path: "/free-cancellation-letter", title: "Free Solar Contract Cancellation Letter | Solar Freedom", desc: "Download solar contract cancellation letter templates for cooling-off, pre-installation, and post-installation situations. Review your documents before sending anything." },
    { path: "/calculator", title: "Solar Contract Cancellation Calculator | Solar Freedom", desc: "Estimate remaining payments, escalator growth, and buyout questions on a solar lease, PPA, or loan. Results are informational, not a quote or legal advice." },
    { path: "/compare", title: "Compare Solar Company Contract Issues | Solar Freedom", desc: "Compare cancellation issues, complaint themes, and documents to gather for major solar companies before requesting an individual case review." },
  ];
  for (const p of staticPages) {
    map[p.path] = { title: p.title, description: p.desc, canonical: `${BASE_URL}${p.path}`, noindex: p.noindex };
  }
  return map;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const unsupportedFirstPartyClaimPatterns = [
  /3,000\+/i, /Our attorneys/i, /Success Rate/i, /Homeowners (?:Helped|Freed)/i, /Avg\. Resolution Time/i,
  /Results in 30[–-]90 days/i, /within 24 hours/i, /licensed counsel/i, /nationwide coverage/i,
  /limited number of new cases/i, /Contract cancelled\. No more payments/i,
  /(?:Solar Freedom|\bwe\b|\bour (?:team|attorneys)\b)[^.!?]{0,160}(?:no upfront cost|contingency basis|all 50 states)/i,
];

function suppressUnverifiedFirstPartyClaims(input) {
  const value = String(input ?? "");
  if (!unsupportedFirstPartyClaimPatterns.some(pattern => pattern.test(value))) return value;
  return "This material is withheld pending documented evidence and review. Options depend on the agreement, facts, jurisdiction, and any written engagement terms.";
}

function stripBrand(title) {
  return title.replace(/\s+\|\s+Solar Freedom$/i, "").replace(/\s+—\s+Solar Freedom$/i, "").replace(/\s+â€”\s+Solar Freedom$/i, "").trim();
}

function fitMetaTitle(title) {
  const normalized = String(title ?? "").replace(/\s+/g, " ").trim();
  if (normalized.length <= 70) return normalized;
  const withoutBrand = stripBrand(normalized);
  if (withoutBrand.length <= 70) return withoutBrand;
  const tightened = withoutBrand.replace(/\s+\((?:2026|2026 Guide|Complete Guide)\)/gi, "").replace(/\s+[–—-]\s+(?:Free Case Review|Legal Help|Solar Freedom).*$/i, "").replace(/\s+&(?:amp;)?\s+Your\s+Legal.*$/i, "").replace(/:\s+[A-Z][^,]+,\s+[A-Z][^&]+&.*$/, "").trim();
  if (tightened.length <= 70) return tightened;
  return `${tightened.slice(0, 67).replace(/\s+\S*$/, "")}...`;
}

function classifyPath(urlPath) {
  if (urlPath === "/blog") return "blog_index";
  if (urlPath.startsWith("/blog/")) return "blog_post";
  if (urlPath.startsWith("/cancel-solar-contract/")) return "city_page";
  if (urlPath.startsWith("/solar-contract-laws/")) return "state_law";
  if (urlPath.startsWith("/cancel-") && urlPath.endsWith("-solar-contract")) return "company_page";
  return "service_page";
}

let LINK_INDEX = null;
const QUARANTINED_LINK_PATHS = new Set((indexEligibility.trustQuarantine?.paths ?? []).map(entry => entry.path));
const HUB_LINKS = [
  ["/solar-contract-help", "Solar contract help"],
  ["/solar-exit-options", "Solar exit options"],
  ["/solar-loan-help", "Solar loan help"],
  ["/selling-house-with-solar", "Selling a house with solar"],
  ["/solar-lien-removal", "Solar lien removal"],
  ["/how-it-works", "How it works"],
  ["/solar-contract-laws", "Solar contract laws by state"],
  ["/solar-panel-scam", "Solar sales practices to check"],
  ["/solar-companies", "Solar company profiles"],
  ["/free-cancellation-letter", "Cancellation letter templates"],
  ["/calculator", "Cancellation calculator"],
  ["/compare", "Compare solar companies"],
];

function rotate(items, urlPath, count) {
  if (!items.length || count <= 0) return [];
  let hash = 0;
  for (let index = 0; index < urlPath.length; index += 1) {
    hash = (hash * 31 + urlPath.charCodeAt(index)) % 100000;
  }
  const start = hash % items.length;
  return Array.from({ length: Math.min(count, items.length) }, (_value, offset) =>
    items[(start + offset) % items.length]
  );
}

const HOME_LINK = ["/", "Solar Freedom home"];

/** A destination is linkable only if it is live, indexable and not redirecting. */
function isLinkableTarget(pagePath) {
  if (REDIRECT_SOURCE_PATHS.has(pagePath)) return false;
  if (QUARANTINED_LINK_PATHS.has(pagePath)) return false;
  if (RETIRED_PUBLIC_PATHS.has(pagePath)) return false;
  if (pagePath.startsWith("/blog/")) {
    return INDEXED_BLOG_SLUGS.has(pagePath.slice("/blog/".length));
  }
  if (pagePath.startsWith("/cancel-solar-contract/")) {
    return INDEXED_CITY_SLUGS.has(pagePath.slice("/cancel-solar-contract/".length));
  }
  return true;
}

const STOP_TOKENS = new Set([
  "solar", "contract", "the", "and", "for", "with", "your", "you", "how", "what",
  "can", "get", "out", "of", "to", "a", "in", "is", "it", "2026", "cancel",
]);

function slugTokens(slug) {
  return new Set(slug.split("-").filter(token => token.length > 2 && !STOP_TOKENS.has(token)));
}

/**
 * Build the link graph once, after the content data is loaded. Everything the
 * per-page builder needs is precomputed here so prerendering stays linear.
 */
function buildLinkIndex({ cityEntries, blogEntries }) {
  const blogs = Object.entries(blogEntries)
    .filter(([slug]) => isLinkableTarget(`/blog/${slug}`))
    .map(([slug, data]) => ({
      slug,
      path: `/blog/${slug}`,
      label: stripBrand(data.title),
      tokens: slugTokens(slug),
      related: (data.relatedSlugs || []).filter(related => isLinkableTarget(`/blog/${related}`)),
    }));

  const cities = cityEntries
    .filter(city => isLinkableTarget(`/cancel-solar-contract/${city.slug}`))
    .map(city => ({
      slug: city.slug,
      path: `/cancel-solar-contract/${city.slug}`,
      label: `Cancel a solar contract in ${city.name}, ${city.stateCode || city.state}`,
      state: city.stateCode || city.state,
      tokens: slugTokens(city.slug),
    }));

  const citiesByState = new Map();
  for (const city of cities) {
    if (!citiesByState.has(city.state)) citiesByState.set(city.state, []);
    citiesByState.get(city.state).push(city);
  }

  LINK_INDEX = { blogs, cities, citiesByState };
  return LINK_INDEX;
}

/** Rank other articles by curated relatedness first, then shared slug topic tokens. */
function relatedArticles(article, limit) {
  const others = LINK_INDEX.blogs.filter(candidate => candidate.slug !== article.slug);
  const curated = article.related
    .map(slug => others.find(candidate => candidate.slug === slug))
    .filter(Boolean);

  const scored = others
    .filter(candidate => !curated.includes(candidate))
    .map(candidate => {
      let score = 0;
      for (const token of candidate.tokens) if (article.tokens.has(token)) score += 1;
      return { candidate, score };
    })
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.candidate.slug.localeCompare(b.candidate.slug))
    .map(entry => entry.candidate);

  return [...curated, ...scored].slice(0, limit);
}

/** Cities whose slug shares a place token with the article, e.g. a city guide. */
function citiesForArticle(article, limit) {
  return LINK_INDEX.cities
    .filter(city => [...city.tokens].some(token => article.tokens.has(token)))
    .slice(0, limit);
}

function buildLinkPairs(urlPath) {
  if (!LINK_INDEX) return [];
  const pageType = classifyPath(urlPath);
  const pairs = [];

  if (urlPath === "/") {
    pairs.push(...HUB_LINKS);
    pairs.push(["/blog", "All solar contract guides"]);
    pairs.push(...LINK_INDEX.blogs.slice(0, 6).map(blog => [blog.path, blog.label]));
    pairs.push(...LINK_INDEX.cities.slice(0, 8).map(city => [city.path, city.label]));
    return pairs;
  }

  if (pageType === "blog_index") {
    // The blog hub is the crawl entry point for articles: link to all of them.
    pairs.push(HOME_LINK);
    pairs.push(...LINK_INDEX.blogs.map(blog => [blog.path, blog.label]));
    pairs.push(...HUB_LINKS.slice(0, 3));
    return pairs;
  }

  if (pageType === "blog_post") {
    const slug = urlPath.slice("/blog/".length);
    const article = LINK_INDEX.blogs.find(blog => blog.slug === slug);
    if (article) {
      pairs.push(...relatedArticles(article, 5).map(blog => [blog.path, blog.label]));
      pairs.push(...citiesForArticle(article, 2).map(city => [city.path, city.label]));
    }
    pairs.push(["/blog", "All solar contract guides"]);
    pairs.push(...rotate(HUB_LINKS, urlPath, 3));
    pairs.push(HOME_LINK);
    return pairs;
  }

  if (pageType === "city_page") {
    const slug = urlPath.slice("/cancel-solar-contract/".length);
    const city = LINK_INDEX.cities.find(entry => entry.slug === slug);
    if (city) {
      // Same-state neighbours first — this is what gives city pages inbound links.
      const sameState = (LINK_INDEX.citiesByState.get(city.state) || [])
        .filter(entry => entry.slug !== city.slug)
        .slice(0, 3);
      // Ring selection over the full city list: each city links to the ones
      // following it, wrapping around, so the graph is a cycle and no city is
      // left without inbound links.
      const ordered = LINK_INDEX.cities;
      const position = ordered.findIndex(entry => entry.slug === city.slug);
      const ring = [];
      for (let step = 1; ring.length < 4 - sameState.length && step < ordered.length; step += 1) {
        const candidate = ordered[(position + step) % ordered.length];
        if (candidate.slug !== city.slug && !sameState.includes(candidate)) ring.push(candidate);
      }
      pairs.push(...[...sameState, ...ring].map(entry => [entry.path, entry.label]));
    }
    pairs.push(...rotate(LINK_INDEX.blogs, urlPath, 3).map(blog => [blog.path, blog.label]));
    pairs.push(...rotate(HUB_LINKS, urlPath, 2));
    pairs.push(HOME_LINK);
    return pairs;
  }

  // Static, service, company and state pages: home first so the per-page cap
  // can never trim it, then the hub cluster, guides and cities.
  pairs.push(HOME_LINK);
  pairs.push(...HUB_LINKS.filter(([href]) => href !== urlPath));
  pairs.push(...rotate(LINK_INDEX.blogs, urlPath, 4).map(blog => [blog.path, blog.label]));
  pairs.push(...rotate(LINK_INDEX.cities, urlPath, 2).map(city => [city.path, city.label]));
  pairs.push(["/blog", "All solar contract guides"]);
  return pairs;
}

function buildInternalLinks(urlPath) {
  const seen = new Set([urlPath]);
  const pairs = buildLinkPairs(urlPath)
    .filter(([href]) => isLinkableTarget(href))
    .filter(([href]) => {
      if (seen.has(href)) return false;
      seen.add(href);
      return true;
    });

  // The blog hub carries the whole article index; every other page stays compact.
  const cap = urlPath === "/blog" ? 60 : urlPath === "/" ? 24 : 12;

  return pairs
    .slice(0, cap)
    .map(([href, label]) => `<li><a href="${href}">${escapeHtml(label)}</a></li>`)
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

function buildStateUniqueContent(meta) { if (meta?.stateData) meta = { ...meta, stateData: qualifyTrustTree(meta.stateData) };
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

function buildServiceUniqueContent(urlPath) {
  const pages = {
    "/how-it-works": `      <h2>How a Solar Freedom review actually proceeds</h2>
      <p>Solar Freedom is not a law firm. The process is an intake and document review, not a promise that any agreement will end. After you request an individual review, a specialist collects the files that identify the seller, installer, lender, servicer, and any UCC or title filing. Those names are often different companies, and mixing them up is one of the most common reasons a homeowner spends weeks on the wrong phone tree.</p>
      <p>Intake is a structured questionnaire: contract type (lease, loan, or PPA), install status, billing problems, sales statements, and whether a home sale or refinance is pending. Document collection comes next. Issue spotting is limited to what the papers actually say compared with what was represented. Referral or further review, if it happens, depends on those facts and the jurisdiction. No step predicts cancellation, loan reduction, or lien release.</p>
      <h2>Records to gather before intake</h2>
      <ul>
        <li>The signed agreement, every addendum, and any Notice of Cancellation.</li>
        <li>Loan, lease, or PPA disclosures, current statements, and payoff or buyout quotes in writing.</li>
        <li>The proposal, production estimate, utility bills, and monitoring exports.</li>
        <li>Permit, inspection, interconnection, and permission-to-operate records.</li>
        <li>Emails, texts, ads, and notes describing what was said before signing.</li>
        <li>Service tickets, warranty claims, and any UCC-1 or title documents.</li>
      </ul>
      <p>How-it-works is the map, not the destination. Related topics on this site include solar contract help, exit options, loan questions, lien filings, and selling a house with solar. Company-specific complaint themes live in the blog, including Sunrun, GoodLeap, Sunnova, Freedom Forever, ADT, and Tesla guides. City pages cover only the published allowlist; Florida and Nevada state-law pages are not currently published as indexable resources.</p>
      <p>Outcomes depend on the agreement, the documents, the facts, and current law. Request an individual review if you want a specialist to organize the file with you. Do not stop payments, remove equipment, or sign a release based only on this page.</p>

      <h2>What intake is not</h2>
      <p>Intake does not create an attorney-client relationship and does not start a lawsuit. It is a records conversation. A specialist may flag missing pages, mismatched legal names, or a deadline that appears on a notice you already have. Those flags are questions for you and, if you choose, for a qualified professional you retain separately. Solar Freedom can prepare an individual case review from the documents you provide. It cannot promise how a company, lender, or court will respond. If a referral is discussed, it is because the file appears to need a type of review this site does not perform, not because a result has been predicted.</p>`,
    "/solar-contract-help": `      <h2>Lease, loan, and PPA are different problems</h2>
      <p>Solar contract help starts by naming the product. A lease or PPA usually means a third party owns the equipment. A loan usually means you own the system and owe a lender. Mixing those structures leads people to demand the wrong remedy from the wrong company. Solar Freedom is not a law firm; this page explains records and consumer resources, not a predetermined legal theory.</p>
      <p>Cooling-off rules, if they apply at all, typically concern how and where the sale occurred and whether a required notice was delivered. They are short and fact-specific. Post-install questions look different: performance, billing, transfer on sale, UCC fixture filings, and written termination clauses. None of those automatically unwind an agreement. Whether any path is available depends on the contract, the facts, and the jurisdiction.</p>
      <h2>Records that separate the parties</h2>
      <ul>
        <li>The sales contract versus the financing agreement versus the installation work order.</li>
        <li>Legal names on each document, not just brand names used at the kitchen table.</li>
        <li>UCC-1 fixture filings, PACE assessments, or other title records if any exist.</li>
        <li>Dated cancellation notices, rescission forms, and proof of how they were sent.</li>
        <li>Production data, utility bills, and the original savings or output estimate.</li>
        <li>Correspondence about defects, billing, transfer, or a requested buyout.</li>
      </ul>
      <p>Use this hub together with how it works, exit options, loan help, and lien-removal notes. Company blogs (Sunrun, GoodLeap, Sunnova, Freedom Forever, ADT, Tesla) describe installer- or lender-specific complaint patterns. Do not treat a company hub URL as live; those paths 301 to the blogs.</p>
      <p>If you want a specialist to sort the file, request an individual review. Bring the documents listed above. Options and timing depend on the agreement and current law, and this site does not determine whether any particular homeowner has a claim.</p>

      <h2>UCC filings belong in the same folder as the contract</h2>
      <p>Homeowners often discover a fixture filing only when a title company emails. That filing may track a lease, a PPA, or a loan, and the secured party on the form may not be the salesperson you remember. Keep the UCC printout next to the financing agreement so a reviewer can see whether the collateral description matches the equipment and whether any termination or subordination language exists. Treating the filing as an automatic defect, or ignoring it until the week of closing, both create avoidable delay. An individual review can help sort the stack; it does not by itself terminate a filing.</p>`,
    "/solar-panel-scam": `      <h2>Sales claims that deserve a paper trail</h2>
      <p>Door-to-door solar pitches often mix true program names with statements that never appear in the signed file. Common warning signs include savings figures that are not in the contract, dealer fees that were described as a discount, verbal production guarantees, tax-credit claims that assume facts about your tax situation, and pressure to sign the same day. A warning sign is not a verdict. It is a reason to keep records and compare the pitch with the writing.</p>
      <p>Production guarantees that live only in a slide deck or a text thread are especially important to preserve. So are statements that the panels are free, that a utility or government program is sponsoring the visit, or that a home sale will be simple. Solar Freedom is not a law firm and does not decide whether a statement was deceptive. The work here is to help you assemble what was said, what was signed, and which consumer agencies accept complaints.</p>
      <h2>Records to keep when a pitch felt off</h2>
      <ul>
        <li>The proposal, iPad screenshots, mailers, and any savings or production chart.</li>
        <li>The signed contract, financing disclosures, and every addendum.</li>
        <li>Notes of verbal statements, including dates, names, and who was present.</li>
        <li>Utility bills from before and after activation, plus monitoring exports.</li>
        <li>Proof of how you signed (in home, at an event, online) and any cancellation form.</li>
        <li>Later emails that walk back, restate, or contradict the original pitch.</li>
      </ul>
      <p>Complaint channels such as a state attorney general or the CFPB create a dated record; they do not themselves end a contract. Related reading on this site includes the attorney-general complaint guide, contract help, exit options, and company blogs. Request an individual review if you want help organizing the comparison between the pitch and the papers. Options depend on the agreement, the facts, and the jurisdiction.</p>

      <h2>Verbal versus written is a filing system, not a slogan</h2>
      <p>Keep a two-column note: what was said, and where it appears in the signed set. If a production number, tax-credit story, or dealer-fee explanation exists only in the left column, preserve the source (text, voicemail, witness, screenshot) without editing it. Consumer agencies and any later reviewer will ask for that comparison. Do not inflate the left column with conclusions such as fraud; stick to quotations and dates. Request an individual review when the columns disagree and you want help assembling the packet. Whether a mismatch matters legally depends on the agreement, the facts, and the jurisdiction.</p>`,
    "/solar-exit-options": `      <h2>Possible paths, all qualified</h2>
      <p>People search for a single exit. In practice, several different procedures may be relevant, and none of them applies to every homeowner. A rescission or cooling-off window, if one existed, is usually short and tied to how the sale was made. A contractual buyout or prepayment is a math-and-paper exercise, not a penalty you must accept without reading the schedule. Transfer on sale depends on the company process and the buyer. A complaint to an attorney general or the CFPB may create a record. Negotiation with the named party may or may not change terms. All of those are "may," not "will."</p>
      <p>Solar Freedom is not a law firm. This hub exists so you can see the menu and the documents each item usually requires. Stopping payment, removing equipment, or signing a release because a blog post sounded confident can create separate credit, safety, and contract problems. Individual review looks at which path, if any, is even on the table for your file.</p>
      <h2>Records that match each path</h2>
      <ul>
        <li>Notice of Cancellation, contract date, signing location, and delivery proof.</li>
        <li>Buyout or prepayment schedule, current payoff quote, and who issued it.</li>
        <li>Transfer, assumption, or home-sale addenda and any buyer credit requirements.</li>
        <li>Service, production, and billing disputes with written company responses.</li>
        <li>UCC, title, HOA, and lender letters if a sale or refinance is underway.</li>
        <li>Copies of any AG, CFPB, FTC, or contractor-board filings you already sent.</li>
      </ul>
      <p>Pair this page with how it works, contract help, the letter templates, and the calculator. Company-specific blogs (Sunrun, GoodLeap, Sunnova, Freedom Forever, ADT, Tesla) discuss patterns that may appear in those files. Request an individual review to map your documents to the paths that could apply. Timing and availability depend on the agreement, facts, and jurisdiction.</p>

      <h2>Order of operations matters</h2>
      <p>Collect the contract and the current account status before sending a demand, posting a review, or changing payment behavior. If a short statutory or contractual notice period might still apply, the calendar and the delivery method come first. If the system is already installed, production and billing records usually belong in the same envelope as any buyout quote. Complaint portals can run in parallel with a document review, but they are not a substitute for reading the termination clause. Request an individual review if you need a specialist to sequence those steps against your dates. Sequence and options still depend on the papers you actually signed.</p>`,
    "/solar-lien-removal": `      <h2>UCC-1 fixture filings are not the same as a mortgage</h2>
      <p>Many solar leases and some loans are accompanied by a UCC-1 fixture filing. That filing is a notice that personal property is attached to real estate. It is not automatically a mortgage, and it is not automatically illegal. It can still create friction: a title company flags it, a refinance underwriter asks questions, or a buyer wants it released. Whether a filing can be terminated, subordinated, or left in place depends on the security agreement, the account status, and state filing rules.</p>
      <p>Payoff versus dispute is a separate fork. Paying a quoted amount to obtain a termination statement is one process. Challenging whether the filing was authorized or continues after a transfer is another. Solar Freedom is not a law firm and does not file UCC terminations for you. This page helps you identify the filer, the debtor name, the collateral description, and the documents a reviewer would need.</p>
      <h2>Records for a filing review</h2>
      <ul>
        <li>The UCC-1 itself (file number, office, debtor, secured party, collateral).</li>
        <li>The security agreement, lease, or PPA that supposedly authorized the filing.</li>
        <li>Current account status, payoff quotes, and any promised release language.</li>
        <li>Title commitment, refinance conditions, and HOA or buyer objections.</li>
        <li>Assignment records if the original solar company sold the contract.</li>
        <li>Photos and serial numbers if the equipment description does not match the roof.</li>
      </ul>
      <p>Related hubs include selling a house with solar, loan help, and exit options. Company blogs may note how a particular brand handled transfers after a bankruptcy or acquisition. Request an individual review if a filing is blocking a closing and you need the file organized. Whether a release is available depends on the documents and the facts; this page does not determine that a lien is invalid.</p>

      <h2>Refinance and sale friction is a process problem</h2>
      <p>Underwriters and title desks work from checklists. They typically want a recorded termination, a subordination, or a payoff-through-escrow letter from the secured party named on the filing. A blog post that says solar liens are easy to remove will not satisfy that checklist. Start by confirming the file number and the current assignee, then request the company's written release conditions. If those conditions look inconsistent with the security agreement, that inconsistency is a records issue for review. It is not, by itself, a determination that the filing must be deleted. Request an individual review when a closing date is driving the timeline.</p>`,
    "/solar-loan-help": `      <h2>Dealer fees, TILA paperwork, and who actually holds the loan</h2>
      <p>Point-of-sale solar loans often involve three actors: the installer who sold the system, a lender or platform that funded it, and a servicer who sends the bills. GoodLeap and Sunlight Financial appear in many homeowner files on this site as examples of that split, not as the only lenders in the market. A dealer fee, if one exists, may be built into the amount financed. Whether it was disclosed in a way that matters is a document question under the Truth in Lending Act and the actual forms you signed. This page does not decide that any particular fee is unlawful.</p>
      <p>The installer going quiet does not by itself retire the loan. Servicer vs installer is the first sorting task. Solar Freedom is not a law firm. Loan help here means gathering the note, the disclosure statement, the installer contract, and the current servicer identity so an individual review can see which party controls which issue.</p>
      <h2>Records for a solar-loan file</h2>
      <ul>
        <li>Promissory note, TILA disclosure, itemization of amount financed, and any dealer-fee line.</li>
        <li>Installer contract and the proposal that stated the cash price versus financed price.</li>
        <li>Account statements, payment history, and the current servicer or lender name.</li>
        <li>Notices of assignment, sale of the loan, or a change in billing address.</li>
        <li>Completion certificates, PTO, and any installer warranty that the lender said you still have.</li>
        <li>Credit-report entries if the tradeline name does not match the brand you remember.</li>
      </ul>
      <p>Read this hub with exit options, contract help, and the GoodLeap or Sunlight blog guides already on the site. Request an individual review if the disclosure packet and the sales pitch do not line up and you want the file organized. Options depend on the documents, the facts, and applicable law. Do not withhold payment solely because of a general article.</p>

      <h2>Read the itemization before arguing about the APR</h2>
      <p>Many disputes that sound like interest-rate complaints are actually questions about what was financed. If a dealer fee, add-on product, or prepaid amount sits inside the principal, the APR line and the cash-price conversation can both look wrong without either one being a complete story. Pull the itemization, the installer invoice, and the sales proposal into one packet. GoodLeap and Sunlight files on this site often turn on that packet, which is why they are mentioned only as examples already documented here. Request an individual review if those three documents do not tell the same price story. No review can change a number the servicer has not put in writing.</p>`,
    "/selling-house-with-solar": `      <h2>Transfer, buyer credit, payoff, HOA, and appraisal</h2>
      <p>A home sale with solar is several checklists at once. If the system is leased or on a PPA, the buyer may need to assume the agreement, meet credit requirements, and wait on the solar company. If the system is loan-financed, the question is often payoff versus remaining personal debt. Appraisers and buyers treat owned equipment differently from leased equipment. HOA rules may add architectural or transfer conditions that never appeared in the sales pitch.</p>
      <p>UCC filings and title exceptions can delay closing even when the panels work. Solar Freedom is not a law firm and does not run escrow. This hub exists so sellers can start collecting the packets that listing agents, title companies, and buyers actually request, then request an individual review if the solar file is the thing blocking a date.</p>
      <h2>Records buyers and title usually ask for</h2>
      <ul>
        <li>The full solar contract, financing agreement, and current account statement.</li>
        <li>Written transfer or assumption instructions and any buyer credit criteria.</li>
        <li>A current payoff or buyout quote with an expiration date.</li>
        <li>UCC, PACE, or other title documents and any promised release conditions.</li>
        <li>HOA approval letters, architectural guidelines, and roof-warranty status.</li>
        <li>Production data, remaining warranty, and intercept or monitoring login details.</li>
      </ul>
      <p>Pair this page with lien-removal notes, loan help, and the Tesla or Sunrun blogs if those brands are on the contract. City pages on the allowlist can add local context, but they do not replace the documents. Request an individual review when a listing or closing is pending and the solar file is incomplete. What a buyer will accept, and what a company will transfer, depends on the agreement and the facts.</p>

      <h2>Give listing and title more lead time than the solar company advertised</h2>
      <p>Assumption packages, buyer credit checks, and UCC releases often take longer than a standard inspection period. Start the written transfer or payoff request when you list, not when you are under contract. Tell the listing agent whether the system is owned, leased, or on a PPA so the listing remarks do not overpromise. If an HOA or an appraiser asks for production history, export it before the rush. Request an individual review when the solar company, the lender, and the title desk are each asking for a different packet. Coordination is not the same thing as a legal conclusion that the agreement must be unwound before closing.</p>`,
    "/solar-contract-laws": `      <h2>Published state-law pages versus unpublished states</h2>
      <p>Consumer rules for home-solicitation sales, contractor registration, and financing disclosures vary by state. Solar Freedom currently publishes indexable state-law pages for Texas, California, and Arizona. Other states, including Florida and Nevada, are not currently published as indexable law pages and stay quarantined. This hub is a directory and a records checklist, not a 50-state encyclopedia and not legal advice. Solar Freedom is not a law firm.</p>
      <p>Even on a published state page, statutes change and facts control. A cooling-off period that applies to one in-home sale may not apply to an online signing. A contractor-registration rule may not govern a separate lender. Read the official text and the signed file together. Do not treat a neighboring city's experience as your state's rule, and do not restore thin city templates that are not on the live allowlist.</p>
      <h2>Records to bring to a state-law reading</h2>
      <ul>
        <li>The signed contract, financing disclosures, and Notice of Cancellation if one exists.</li>
        <li>Where and how you signed, and whether a salesperson was in the home.</li>
        <li>Contractor, installer, and lender legal names for registration or licensing lookups.</li>
        <li>Dates of sale, funding, installation, and first billing.</li>
        <li>Any state-agency complaint you already filed and the agency response.</li>
        <li>The current official statute or regulation printout you are relying on, with retrieval date.</li>
      </ul>
      <p>Use the Texas, California, and Arizona law pages when those are your jurisdiction. For other states, start with the contract, official consumer agencies, and an individual review rather than an unpublished template. City pages on the allowlist (including Miami as a city page) are not substitutes for a quarantined state-law URL. Request an individual review if you need help matching documents to the published resources. Options depend on current law and the facts of the agreement.</p>

      <h2>Official sources beat summaries</h2>
      <p>When you use a published Texas, California, or Arizona page on this site, treat it as a map to statutes, agencies, and document lists. Verify the current official text before relying on any summary, including ours. For states that are not published here, use the state attorney general consumer page, contractor licensing lookup, and the federal cooling-off materials if the sale channel might be covered. Do not invent a Florida or Nevada law URL, and do not treat a Miami or Las Vegas city page as a stand-in for a quarantined state-law article. Request an individual review if you want help lining your documents up with the published pages that actually exist.</p>`,
    "/solar-companies": `      <h2>Company research lives on the blogs, not on hub URLs</h2>
      <p>Homeowners often type a brand plus "cancel" and land on a generated company path. On this site, those company hubs 301 to existing blogs. Use the blog guides for Sunrun, GoodLeap, Sunnova, Freedom Forever, ADT, and Tesla rather than /cancel-*-solar-contract URLs. The blogs are where complaint themes, acquisition timelines, and document checklists are maintained. Solar Freedom is not a law firm, and a brand page is not a finding that any company broke the law in your case.</p>
      <p>Status changes (bankruptcy, acquisition, rebrand) are especially easy to mix up. ADT exiting residential solar, Tesla servicing SolarCity-era accounts, or a lender remaining after an installer closes are separate facts. The signed names still control who bills you and who answers warranty tickets. Compare the blog for that brand with your own papers before assuming the public story matches your account.</p>
      <h2>Records that identify the real parties</h2>
      <ul>
        <li>Every legal name on the sales, install, and financing documents.</li>
        <li>Current servicer letters, portal logins, and payment coupon addresses.</li>
        <li>Acquisition, bankruptcy, or assignment notices you received.</li>
        <li>Warranty providers for equipment versus workmanship.</li>
        <li>BBB, CFPB, or AG complaint numbers if you already filed.</li>
        <li>Dates of install, PTO, and any service outage that followed a company change.</li>
      </ul>
      <p>The compare page and this companies hub are indexes. Deep detail is in the named blogs and in how-it-works, contract help, and loan help. Request an individual review if you cannot tell which entity owns the contract versus the equipment. What happens next depends on those documents, the facts, and the jurisdiction.</p>

      <h2>How to read a company blog without over-copying it onto your file</h2>
      <p>A Sunrun, GoodLeap, Sunnova, Freedom Forever, ADT, or Tesla article may describe complaint themes that appear in public records or in documents other homeowners have shared. Your file can differ on contract type, install year, and which entity was assigned the account. Use the blog to learn which questions to ask and which records to pull, then answer those questions from your papers. The compare page can sit beside the blogs if you are trying to tell two brands apart. Request an individual review when the blog's party map does not match the names on your statements. Matching names is a fact task, not a prediction of any company's liability.</p>`,
    "/blog": `      <h2>How to use the solar contract guides</h2>
      <p>The blog is the long-form library: cancellation procedures, company complaint files, document checklists, and consumer-agency walkthroughs. It is not a substitute for reading your own agreement. Articles are educational. Solar Freedom is not a law firm, and a guide that describes a process used in some files does not mean the same process applies to yours. Start with the article that matches the brand or the problem, then gather the records that article lists before requesting an individual review.</p>
      <p>Guides are grouped loosely around getting out of a contract, disputing sales or billing issues, and selling or refinancing with solar still attached. Company pieces (Sunrun, GoodLeap, Sunnova, Freedom Forever, ADT, Tesla, Blue Raven, Complete Solaria) sit beside issue pieces (rescission, installer out of business, attorney-general complaints). City allowlist pages and the Texas, California, and Arizona law pages are linked from relevant posts when those locations are in scope. Thin city URLs and quarantined state-law pages are not restored here.</p>
      <h2>Records that make a guide usable</h2>
      <ul>
        <li>The contract type and the legal names, so you open the matching company guide.</li>
        <li>Install status and dates, so you do not use a cooling-off article on a five-year-old system.</li>
        <li>Billing, production, and service history if the dispute is performance or charges.</li>
        <li>Title, UCC, and listing documents if the issue is a sale or refinance.</li>
        <li>Copies of complaints already filed with an AG, CFPB, FTC, or contractor board.</li>
        <li>A one-page timeline you can set next to any article checklist.</li>
      </ul>
      <p>From the blog index you can move into how it works, exit options, the letter templates, the calculator, and compare. Request an individual review when you have the file together and want a specialist to read it with you. Nothing in these guides predicts a result; options depend on the agreement, the facts, and the jurisdiction.</p>

      <h2>Editorial limits you will see in the articles</h2>
      <p>Posts are checked for source accuracy, for a line between general information and individual advice, and for unsupported first-party claims. If a description was withheld, it is because automated trust filters caught language this site is not allowed to publish without evidence. Prefer articles that list documents and official procedures over articles that sound like a certain outcome. When you finish a guide, the next step is still your file: names, dates, and notices. Request an individual review from the article that most closely matches that file. The library will keep growing, but thin city revival and unpublished state-law pages are not part of that growth.</p>`,
    "/free-cancellation-letter": `      <h2>Templates are starting points, not magic words</h2>
      <p>A cancellation letter is a record of what you asked, when you asked, and which contract you pointed to. It is not a court order and it is not a guarantee that the named company will agree. Solar Freedom offers templates for cooling-off, pre-installation, and post-installation situations so you can see the kinds of facts a letter usually includes. You still have to match the template to the actual notice requirements in your agreement and, if a federal or state cooling-off rule might apply, to that rule's delivery instructions.</p>
      <p>Sending the wrong letter, to the wrong address, without the contract number or without proof of delivery, is a common stall. Filling a template with claims the documents do not support can also create problems later. Solar Freedom is not a law firm. Review the documents before you send anything, and do not treat a downloaded paragraph as legal advice.</p>
      <h2>Records to attach or quote</h2>
      <ul>
        <li>The exact legal names, addresses, and notice clauses from the contract.</li>
        <li>Account numbers, install address, and the dated signature page.</li>
        <li>The Notice of Cancellation form if the sale came with one.</li>
        <li>Proof of how and when you will send the letter (mail, email, portal).</li>
        <li>A short timeline of sale, funding, install, and any prior written requests.</li>
        <li>Copies of the financing agreement if the letter also goes to a lender or servicer.</li>
      </ul>
      <p>Use this page with how it works, exit options, and the attorney-general complaint guide. Request an individual review if you are unsure which template, if any, fits the file. Whether a letter has legal effect depends on the agreement, the facts, the method of delivery, and current law.</p>

      <h2>Delivery proof is part of the letter</h2>
      <p>Keep a complete copy of what you sent, including attachments, and a receipt, tracking record, email header, or portal confirmation. A phone call that is not followed by writing is usually a weak record. If the contract names a specific address or method, follow that method even if a generic template suggests email. If more than one company is on the file, send the correctly addressed version to each named notice party rather than one blended letter. Request an individual review if you cannot tell which notice clause controls. Sending a letter is a documentation step; it does not by itself end billing or a UCC filing.</p>`,
    "/calculator": `      <h2>What the calculator estimates and what it does not</h2>
      <p>The cancellation calculator is an arithmetic helper. It can illustrate remaining payments, how an escalator grows a lease or PPA over time, and how a stated buyout compares with the payment stream. It is not a quote, not an appraisal, and not legal advice. Inputs that are wrong (term, escalator, current payment, buyout schedule) produce numbers that are merely tidy. Solar Freedom is not a law firm, and a calculated figure does not mean a company will accept it.</p>
      <p>Use the tool after you have the actual statement and the contract schedule in hand. Then compare the output with a written payoff or buyout from the named party. If those numbers diverge, that gap is a records issue for an individual review, not a reason to assume the contract is unenforceable.</p>
      <h2>Records that make an estimate honest</h2>
      <ul>
        <li>Current monthly payment, due date, and whether it has already escalated.</li>
        <li>Original term, remaining term, and the escalator percentage if any.</li>
        <li>The buyout or prepayment table from the contract, not a sales verbal.</li>
        <li>A written quote from the company or servicer, with a date.</li>
        <li>Utility bills and production data if you are comparing carrying cost with usage.</li>
        <li>Loan payoff versus lease buyout, clearly labeled so you do not mix them.</li>
      </ul>
      <p>Read the calculator beside exit options, loan help, and selling-a-house notes. Request an individual review if you want a specialist to compare your inputs with the documents. Results are informational. Options and any real payoff amount depend on the agreement and the servicer's written figures.</p>

      <h2>Escalators and remaining term are easy to mistype</h2>
      <p>A 2.9 percent annual escalator, if that is what your lease or PPA actually says, compounds. Entering the first-year payment as if it were still the current payment will understate the remaining stream. Entering a loan as if it had an escalator will overstate it. Check the anniversary date and the current invoice before you trust a chart. Then export or screenshot the calculator inputs so a reviewer can see what you assumed. Request an individual review if the company's written buyout and the calculator disagree by more than rounding. Disagreement is a prompt to re-read the schedule, not a finding that either number is unlawful.</p>`,
    "/compare": `      <h2>Comparing brands without treating hubs as live pages</h2>
      <p>The compare page is for complaint themes, document differences, and the questions that repeat across Sunrun, GoodLeap, Sunnova, Freedom Forever, ADT, Tesla, and similar files. It is not a ranking of which company is easiest to leave. Company hub URLs on this domain 301 to blogs; compare should send readers to those blogs and to the records each brand's file usually requires. Solar Freedom is not a law firm, and a side-by-side layout does not mean two homeowners have the same options.</p>
      <p>Useful comparison dimensions include contract type (lease, loan, PPA), who owns the equipment, who bills you now, whether a UCC filing exists, and whether an acquisition or bankruptcy changed the service path. Those dimensions come from paperwork, not from brand reputation. If a column on this page disagrees with your contract, the contract wins.</p>
      <h2>Records for a brand-to-brand comparison</h2>
      <ul>
        <li>Your contract type and the legal names of seller, installer, lender, and servicer.</li>
        <li>Current billing entity versus the name on the original signature page.</li>
        <li>Warranty, monitoring, and equipment-manufacturer contacts.</li>
        <li>Any UCC, title, or HOA friction you have already been told about.</li>
        <li>Written transfer, buyout, or dispute procedures from your company, not a generic chart.</li>
        <li>The matching blog guide for your brand, printed or saved with your file.</li>
      </ul>
      <p>Move from compare into the relevant blog, then how it works, contract help, or loan help. Request an individual review if you want the comparison done against your documents rather than against a table. What applies to you depends on the agreement, the facts, and the jurisdiction.</p>

      <h2>Do not compare live blogs to redirected hubs</h2>
      <p>If an old bookmark still points at a company hub path, follow the 301 to the blog and compare from there. Linking both the hub and the blog in the same article wastes crawl budget and confuses readers. The same rule applies to city URLs: only the allowlisted city pages should be used, and Florida cities that are not on that list should not be invented for comparison tables. Request an individual review if you are trying to compare your contract to a brand column and the paperwork does not fit any column cleanly. Misfit is common; it is a reason to read the file, not to force a label.</p>`,
  };
  return pages[urlPath] || '';
}

function buildSemanticShellContent(meta, urlPath) { meta = qualifyTrustTree(meta);
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
    uniqueBody = buildServiceUniqueContent(urlPath);
  }

  return `
  <div id="root">
    <main class="seo-prerender" data-page-type="${pageType}" style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 960px; margin: 0 auto; padding: 32px 20px; color: #111827;">
      <p style="font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: #f97316; font-weight: 700;">Solar Freedom ${escapeHtml(contextLabel)}</p>
      <h1>${escapeHtml(h1)}</h1>
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
  buildLinkIndex({ cityEntries, blogEntries });
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

function qualifyVisibleTrustClaims(input) {
  return String(input ?? "")
    .replace(/\bthe contract is void\b/gi, "the agreement may be unenforceable")
    .replace(/if it's missing or invalid, the contract is void/gi, "if it is missing or invalid, California law may treat the agreement as unenforceable")
    .replace(/\bwill eliminate your\b/gi, "would remove your")
    .replace(/claiming panels will eliminate your electric bill/gi, "claiming panels remove the electric bill entirely")
    .replace(/\bprovide(?:s)? grounds for (?:post-install )?cancellation\b/gi, "may be relevant to a post-install dispute")
    .replace(/all provide grounds for post-install cancellation in Texas\./gi, "may be relevant to a post-install dispute in Texas, depending on the documents and facts.")
    .replace(/all provide grounds for post-install cancellation in Arizona\./gi, "may be relevant to a post-install dispute in Arizona, depending on the documents and facts.")
    .replace(/\byou can cancel\b/gi, "cancellation may be possible")
    .replace(/\byou (?:have|retain) (?:a |the )?(?:legal )?right to cancel\b/gi, "cancellation rights depend on the agreement, facts, and jurisdiction")
    .replace(/\ballow(?:s)? (?:you|homeowners|consumers) to (?:cancel|void)\b/gi, "may be relevant to cancellation or rescission")
    .replace(/\bno more payments\b/gi, "payment outcomes depend on the agreement")
    .replace(/\bwindow (?:is|remains) (?:still )?open\b/gi, "timing depends on the documents and jurisdiction")
    .replace(/\bmay still be legally open\b/gi, "timing depends on the documents and jurisdiction")
    .replace(/^Reduction in /i, "Change in ")
    .replace(/\b\d{1,3}% (?:less|reduction|savings)\b/gi, "a documented change");
}
function qualifyTrustTree(value) {
  if (typeof value === "string") return qualifyVisibleTrustClaims(value);
  if (Array.isArray(value)) return value.map(qualifyTrustTree);
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, child] of Object.entries(value)) out[key] = qualifyTrustTree(child);
    return out;
  }
  return value;
}

HUB_LINKS.push(["/compare", "Compare solar company issues"], ["/solar-contract-laws/texas", "Texas solar contract laws"], ["/solar-contract-laws/california", "California solar contract laws"], ["/solar-contract-laws/arizona", "Arizona solar contract laws"]);
export { main };
