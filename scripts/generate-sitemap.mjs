/**
 * Sitemap Generator
 *
 * Generates sitemap.xml covering ALL pages:
 * - Homepage + static pages
 * - 301 city pages (/cancel-solar-contract/{slug})
 * - 13 company pages (/cancel-{slug}-solar-contract)
 * - 51 state law pages (/solar-contract-laws/{slug})
 * - All blog articles
 *
 * Run: node scripts/generate-sitemap.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASE_URL = "https://breakyoursolarcontract.com";
const SEO_POLICY = JSON.parse(
  fs.readFileSync(path.resolve(ROOT, "shared/seo-policy.json"), "utf-8")
);
const INDEXABLE_STATIC_PATHS = new Set(SEO_POLICY.indexableStaticPaths);
const INDEXED_CITY_SLUGS = new Set(SEO_POLICY.retainedCitySlugs);
const INDEXED_COMPANY_SLUGS = new Set(SEO_POLICY.retainedCompanySlugs);
const INDEXED_STATE_SLUGS = new Set(SEO_POLICY.retainedStateSlugs);
const INDEXED_BLOG_SLUGS = new Set(SEO_POLICY.retainedBlogSlugs);

function decodeStringLiteralValue(value) {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
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

  // Extract city slugs
  const cityEntries = [];
  const cityRegex =
    /\{\s*name:\s*["']([^"']+)["'][^}]*slug:\s*["']([^"']+)["']/g;
  let m;
  while ((m = cityRegex.exec(citiesFile)) !== null) {
    cityEntries.push({ slug: m[2], name: m[1] });
  }

  // Extract company slugs
  const companyEntries = [];
  const companyRegex =
    /slug:\s*["']([^"']+)["'],[\s\S]*?name:\s*["']([^"']+)["']/g;
  while ((m = companyRegex.exec(companiesFile)) !== null) {
    companyEntries.push({ slug: m[1], name: m[2] });
  }

  // Extract state law slugs
  const stateEntries = [];
  const stateRegex =
    /slug:\s*["']([^"']+)["'],[\s\S]*?state:\s*["']([^"']+)["']/g;
  while ((m = stateRegex.exec(stateLawsFile)) !== null) {
    stateEntries.push({ slug: m[1], state: m[2] });
  }

  // Extract blog article slugs from all blog data files
  const blogSlugs = new Set();
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
    while ((m = slugRegex.exec(content)) !== null) {
      const slug = decodeStringLiteralValue(m[2]).trim();
      if (slug && !slug.includes("${") && slug.length > 5) {
        blogSlugs.add(slug);
      }
    }
  }

  return {
    cityEntries,
    companyEntries,
    stateEntries,
    blogSlugs: [...blogSlugs],
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
    { path: "/sunrun", priority: "0.9", changefreq: "monthly" },
    { path: "/media", priority: "0.9", changefreq: "weekly" },
    { path: "/sitemap", priority: "0.8", changefreq: "weekly" },
    { path: "/about", priority: "0.5", changefreq: "yearly" },
    { path: "/contact", priority: "0.5", changefreq: "yearly" },
    { path: "/editorial-policy", priority: "0.5", changefreq: "yearly" },
    { path: "/corrections", priority: "0.4", changefreq: "yearly" },
    { path: "/privacy", priority: "0.3", changefreq: "yearly" },
    { path: "/terms", priority: "0.3", changefreq: "yearly" },
    { path: "/disclaimer", priority: "0.4", changefreq: "yearly" },
  ];
  for (const p of staticPages) {
    if (!INDEXABLE_STATIC_PATHS.has(p.path)) continue;
    entries.push({
      url: `${BASE_URL}${p.path}`,
      priority: p.priority,
      changefreq: p.changefreq,
    });
  }

  // Company pages (highest priority after homepage)
  for (const company of companyEntries) {
    if (!INDEXED_COMPANY_SLUGS.has(company.slug)) continue;
    entries.push({
      url: `${BASE_URL}/cancel-${company.slug}-solar-contract`,
      priority: "0.9",
      changefreq: "monthly",
    });
  }

  // City pages — ONLY indexed cities (spam penalty recovery)
  let cityCount = 0;
  for (const city of cityEntries) {
    if (!INDEXED_CITY_SLUGS.has(city.slug)) continue; // skip noindexed cities
    entries.push({
      url: `${BASE_URL}/cancel-solar-contract/${city.slug}`,
      priority: "0.8",
      changefreq: "monthly",
    });
    cityCount++;
  }

  // State law pages
  for (const state of stateEntries) {
    if (!INDEXED_STATE_SLUGS.has(state.slug)) continue;
    entries.push({
      url: `${BASE_URL}/solar-contract-laws/${state.slug}`,
      priority: "0.7",
      changefreq: "monthly",
    });
  }

  // Blog articles
  for (const slug of blogSlugs) {
    if (!INDEXED_BLOG_SLUGS.has(slug)) continue;
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
const { cityEntries, companyEntries, stateEntries, blogSlugs } = loadData();
const entries = buildEntries(
  cityEntries,
  companyEntries,
  stateEntries,
  blogSlugs
);
const xml = generateXml(entries);

const outPath = path.resolve(ROOT, "client/public/sitemap.xml");
fs.writeFileSync(outPath, xml, "utf-8");

const indexedCityCount = cityEntries.filter(c => INDEXED_CITY_SLUGS.has(c.slug)).length;
const indexedCompanyCount = companyEntries.filter(company => INDEXED_COMPANY_SLUGS.has(company.slug)).length;
const indexedStateCount = stateEntries.filter(state => INDEXED_STATE_SLUGS.has(state.slug)).length;
const indexedBlogCount = blogSlugs.filter(slug => INDEXED_BLOG_SLUGS.has(slug)).length;
console.log(`\u2705 Generated sitemap.xml with ${entries.length} URLs`);
console.log(
  `   Homepage + static: ${entries.length - indexedCompanyCount - indexedCityCount - indexedStateCount - indexedBlogCount} pages`
);
console.log(`   Company pages: ${indexedCompanyCount}`);
console.log(`   City pages: ${indexedCityCount} (of ${cityEntries.length} total, ${cityEntries.length - indexedCityCount} noindexed)`);
console.log(`   State law pages: ${indexedStateCount}`);
console.log(`   Blog articles: ${indexedBlogCount}`);
console.log(`   Output: ${outPath}`);
