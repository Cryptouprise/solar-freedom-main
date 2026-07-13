/**
 * Sitemap Generator
 *
 * Generates sitemap.xml for publication-eligible pages only:
 * - Homepage + approved static pages
 * - City, company, state-law, and blog detail pages only after their
 *   applicable evidence and editorial-review gates pass
 *
 * Run: node scripts/generate-sitemap.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  collectObjectRecords,
  hasPublishableEditorialReview,
  hasUnsupportedFirstPartyClaims,
} from "./publication-governance.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASE_URL = "https://breakyoursolarcontract.com";

function decodeStringLiteralValue(value) {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

function findStringProp(chunk, prop) {
  const match = new RegExp(`(?:["'\`]${prop}["'\`]|\\b${prop})\\s*:\\s*(["'\`])((?:\\\\[\\s\\S]|(?!\\1)[\\s\\S])*?)\\1`).exec(chunk);
  return match ? decodeStringLiteralValue(match[2]).trim() : "";
}

function hasPublishableStateReview(chunk) {
  const reviewerName = chunk.match(/\breviewerName\s*:\s*["'`]([^"'`]+)["'`]/)?.[1]?.trim();
  const reviewerRole = chunk.match(/\breviewerRole\s*:\s*["'`]([^"'`]+)["'`]/)?.[1]?.trim();
  const reviewedAt = chunk.match(/\breviewedAt\s*:\s*["'`](\d{4}-\d{2}-\d{2})["'`]/)?.[1];
  const primarySources = chunk.match(/\bprimarySources\s*:\s*\[([\s\S]*?)\]/)?.[1] || "";
  const officialUrl = /\burl\s*:\s*["'`]https:\/\/[^"'`]+["'`]/.test(primarySources);
  const accessedAt = /\baccessedAt\s*:\s*["'`]\d{4}-\d{2}-\d{2}["'`]/.test(primarySources);
  return Boolean(reviewerName && reviewerRole && reviewedAt && officialUrl && accessedAt);
}

// ─── Load data files ──────────────────────────────────────────────────────────
function loadData() {
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

  const cityEntries = collectObjectRecords(citiesFile)
    .map(chunk => ({
      slug: findStringProp(chunk, "slug"),
      name: findStringProp(chunk, "name"),
      publishable: hasPublishableEditorialReview(chunk),
    }))
    .filter(entry => entry.slug && entry.name);

  const companyEntries = collectObjectRecords(companiesFile)
    .map(chunk => ({
      slug: findStringProp(chunk, "slug"),
      name: findStringProp(chunk, "name"),
      publishable: hasPublishableEditorialReview(chunk),
    }))
    .filter(entry => entry.slug && entry.name);

  // Extract state law slugs
  const stateRegex = /slug:\s*["']([^"']+)["'],[\s\S]*?state:\s*["']([^"']+)["']/g;
  const stateMatches = [...stateLawsFile.matchAll(stateRegex)];
  const stateEntries = stateMatches.map((match, index) => ({
    slug: match[1],
    state: match[2],
    publishable: hasPublishableStateReview(
      stateLawsFile.slice(match.index, stateMatches[index + 1]?.index ?? stateLawsFile.length)
    ),
  }));

  // Extract blog article slugs from all blog data files
  const blogSlugs = new Set();
  const withheldBlogSlugs = new Set();
  const blogFiles = fs
    .readdirSync(path.resolve(ROOT, "client/src/data"))
    .filter(f => f.startsWith("blog"));
  for (const blogFile of blogFiles) {
    const content = fs.readFileSync(
      path.resolve(ROOT, "client/src/data", blogFile),
      "utf-8"
    );
    // Match slug values written with single quotes, double quotes, or backticks.
    const slugRegex = /(?:["'`]slug["'`]|\bslug)\s*:\s*(['"`])((?:\\[\s\S]|(?!\1)[\s\S])*?)\1/g;
    const matches = [...content.matchAll(slugRegex)];
    for (let index = 0; index < matches.length; index += 1) {
      const match = matches[index];
      const slug = decodeStringLiteralValue(match[2]).trim();
      if (!slug || slug.includes("${") || slug.length <= 5) continue;
      const chunk = content.slice(match.index, matches[index + 1]?.index ?? content.length);
      if (
        !hasPublishableEditorialReview(chunk) ||
        hasUnsupportedFirstPartyClaims(chunk)
      ) {
        withheldBlogSlugs.add(slug);
        blogSlugs.delete(slug);
      } else if (!withheldBlogSlugs.has(slug)) {
        blogSlugs.add(slug);
      }
    }
  }

  return {
    cityEntries,
    companyEntries,
    stateEntries,
    blogSlugs: [...blogSlugs],
    withheldBlogCount: withheldBlogSlugs.size,
  };
}

// ─── Build URL entries ────────────────────────────────────────────────────────
function buildEntries(cityEntries, companyEntries, stateEntries, blogSlugs) {
  const entries = [];

  // Homepage
  entries.push({ url: `${BASE_URL}/`, priority: "1.0", changefreq: "weekly" });

  // Static pages
  const staticPages = [
    { path: "/blog", priority: "0.9", changefreq: "weekly" },
    { path: "/how-it-works", priority: "0.9", changefreq: "monthly" },
    { path: "/solar-contract-help", priority: "0.9", changefreq: "monthly" },
    { path: "/solar-panel-scam", priority: "0.9", changefreq: "monthly" },
    { path: "/solar-exit-options", priority: "0.8", changefreq: "monthly" },
    { path: "/solar-lien-removal", priority: "0.8", changefreq: "monthly" },
    { path: "/solar-loan-help", priority: "0.8", changefreq: "monthly" },
    {
      path: "/selling-house-with-solar",
      priority: "0.8",
      changefreq: "monthly",
    },
    { path: "/solar-contract-laws", priority: "0.8", changefreq: "monthly" },
    { path: "/solar-companies", priority: "0.8", changefreq: "monthly" },
    { path: "/media", priority: "0.9", changefreq: "weekly" },
    { path: "/sitemap", priority: "0.8", changefreq: "weekly" },
    { path: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
    { path: "/terms", priority: "0.3", changefreq: "yearly" },
  ];
  for (const p of staticPages) {
    entries.push({
      url: `${BASE_URL}${p.path}`,
      priority: p.priority,
      changefreq: p.changefreq,
    });
  }

  // Company pages require a source/as-of editorial record and unique value.
  for (const company of companyEntries.filter((entry) => entry.publishable)) {
    entries.push({
      url: `${BASE_URL}/cancel-${company.slug}-solar-contract`,
      priority: "0.9",
      changefreq: "monthly",
    });
  }

  // City pages use the same fail-closed publication gate.
  for (const city of cityEntries.filter((entry) => entry.publishable)) {
    entries.push({
      url: `${BASE_URL}/cancel-solar-contract/${city.slug}`,
      priority: "0.8",
      changefreq: "monthly",
    });
  }

  // State law pages
  for (const state of stateEntries.filter((entry) => entry.publishable)) {
    entries.push({
      url: `${BASE_URL}/solar-contract-laws/${state.slug}`,
      priority: "0.7",
      changefreq: "monthly",
    });
  }

  // Blog articles
  for (const slug of blogSlugs) {
    entries.push({
      url: `${BASE_URL}/blog/${slug}`,
      priority: "0.7",
      changefreq: "monthly",
    });
  }

  return entries;
}

// ─── Generate XML ─────────────────────────────────────────────────────────────
function generateXml(entries) {
  const urls = entries
    .map(
      e => `  <url>
    <loc>${e.url}</loc>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const { cityEntries, companyEntries, stateEntries, blogSlugs, withheldBlogCount } = loadData();
const entries = buildEntries(
  cityEntries,
  companyEntries,
  stateEntries,
  blogSlugs
);
const publishableCityEntries = cityEntries.filter((entry) => entry.publishable);
const publishableCompanyEntries = companyEntries.filter((entry) => entry.publishable);
const publishableStateEntries = stateEntries.filter((entry) => entry.publishable);
const xml = generateXml(entries);

const outPath = path.resolve(ROOT, "client/public/sitemap.xml");
fs.writeFileSync(outPath, xml, "utf-8");

console.log(`✅ Generated sitemap.xml with ${entries.length} URLs`);
console.log(
  `   Homepage + static: ${entries.length - publishableCompanyEntries.length - publishableCityEntries.length - publishableStateEntries.length - blogSlugs.length} pages`
);
console.log(`   Company pages: ${publishableCompanyEntries.length} published, ${companyEntries.length - publishableCompanyEntries.length} withheld`);
console.log(`   City pages: ${publishableCityEntries.length} published, ${cityEntries.length - publishableCityEntries.length} withheld`);
console.log(`   State law pages: ${publishableStateEntries.length} published, ${stateEntries.length - publishableStateEntries.length} withheld`);
console.log(`   Blog articles: ${blogSlugs.length} published, ${withheldBlogCount} withheld`);
console.log(`   Output: ${outPath}`);
