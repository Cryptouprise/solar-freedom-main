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
import "dotenv/config";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASE_URL = "https://breakyoursolarcontract.com";
const TODAY = new Date().toISOString().split("T")[0];

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
    const slugRegex = /\bslug:\s*(['"`])((?:\\[\s\S]|(?!\1)[\s\S])*?)\1/g;
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
    { path: "/solar-fraud-report", priority: "0.8", changefreq: "monthly" },
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
  ];
  for (const p of staticPages) {
    entries.push({
      url: `${BASE_URL}${p.path}`,
      priority: p.priority,
      changefreq: p.changefreq,
    });
  }

  // Company pages (highest priority after homepage)
  for (const company of companyEntries) {
    entries.push({
      url: `${BASE_URL}/cancel-${company.slug}-solar-contract`,
      priority: "0.9",
      changefreq: "monthly",
    });
  }

  // City pages
  for (const city of cityEntries) {
    entries.push({
      url: `${BASE_URL}/cancel-solar-contract/${city.slug}`,
      priority: "0.8",
      changefreq: "monthly",
    });
  }

  // State law pages
  for (const state of stateEntries) {
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
    <lastmod>${TODAY}</lastmod>
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

// ─── Fetch Database Blogs ─────────────────────────────────────────────────────
async function fetchDbBlogSlugs() {
  const slugs = [];
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️ DATABASE_URL not set. Skipping dynamic database sitemap generation.");
    return slugs;
  }
  let connection;
  try {
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    const [rows] = await connection.execute(
      "SELECT slug FROM `blogPosts` WHERE published = 1"
    );
    for (const row of rows) {
      if (row.slug) {
        slugs.push(row.slug);
      }
    }
    console.log(`ℹ️ Loaded ${slugs.length} dynamic blog slugs from the database.`);
  } catch (error) {
    console.warn("⚠️ Failed to fetch blog slugs from the database:", error.message);
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (err) {
        // Ignore connection close errors
      }
    }
  }
  return slugs;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const { cityEntries, companyEntries, stateEntries, blogSlugs: staticBlogSlugs } = loadData();
  const dbBlogSlugs = await fetchDbBlogSlugs();
  
  // Combine unique static and dynamic blog slugs
  const allBlogSlugs = Array.from(new Set([...staticBlogSlugs, ...dbBlogSlugs]));

  const entries = buildEntries(
    cityEntries,
    companyEntries,
    stateEntries,
    allBlogSlugs
  );
  const xml = generateXml(entries);

  const outPath = path.resolve(ROOT, "client/public/sitemap.xml");
  fs.writeFileSync(outPath, xml, "utf-8");

  console.log(`✅ Generated sitemap.xml with ${entries.length} URLs`);
  console.log(
    `   Homepage + static: ${entries.length - companyEntries.length - cityEntries.length - stateEntries.length - allBlogSlugs.length} pages`
  );
  console.log(`   Company pages: ${companyEntries.length}`);
  console.log(`   City pages: ${cityEntries.length}`);
  console.log(`   State law pages: ${stateEntries.length}`);
  console.log(`   Blog articles: ${allBlogSlugs.length} (Static: ${staticBlogSlugs.length}, Dynamic: ${allBlogSlugs.length - staticBlogSlugs.length})`);
  console.log(`   Output: ${outPath}`);
}

main().catch(console.error);
