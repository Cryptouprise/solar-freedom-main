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
import { createConnection } from "mysql2/promise";

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
  const cityRegex = /\{\s*name:\s*["']([^"']+)["'][\s\S]*?stateCode:\s*["']([^"']+)["'][\s\S]*?slug:\s*["']([^"']+)["']/g;
  let m;
  while ((m = cityRegex.exec(citiesFile)) !== null) {
    cityEntries.push({ name: m[1], stateCode: m[2], slug: m[3] });
  }
  // Fallback: simpler regex if stateCode not found
  if (cityEntries.length === 0) {
    const cityNameRegex = /\{\s*name:\s*["']([^"']+)["'][^}]*slug:\s*["']([^"']+)["']/g;
    while ((m = cityNameRegex.exec(citiesFile)) !== null) {
      cityEntries.push({ name: m[1], stateCode: '', slug: m[2] });
    }
  }

  const companyEntries = [];
  const companyRegex = /slug:\s*["']([^"']+)["'],[\s\S]*?name:\s*["']([^"']+)["']/g;
  while ((m = companyRegex.exec(companiesFile)) !== null) {
    companyEntries.push({ slug: m[1], name: m[2] });
  }

  const stateEntries = [];
  const stateRegex = /slug:\s*["']([^"']+)["'],[\s\S]*?state:\s*["']([^"']+)["']/g;
  while ((m = stateRegex.exec(stateLawsFile)) !== null) {
    stateEntries.push({ slug: m[1], state: m[2] });
  }

  return { cityEntries, companyEntries, stateEntries };
}

// ─── Load ALL blog posts from all batch files ─────────────────────────────────
// IMPORTANT: When adding new blog batch files, add them to this list.
function loadBlogData() {
  const blogFiles = [
    'blog.ts',
    'blog-extra.ts',
    'blog-articles-batch2.ts',
    'blog-articles-batch3.ts',
    'blog-articles-batch4.ts',
    'blog-articles-batch5.ts',
    'blog-articles-batch6.ts',
    'blog-articles-batch7.ts',
    'blog-articles-batch8.ts',
    'blog-articles-batch9.ts',
    // ADD NEW BATCH FILES HERE when created
  ];

  const blogEntries = {};

  for (const filename of blogFiles) {
    const filePath = path.resolve(ROOT, 'client/src/data', filename);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract slug + metaTitle + metaDescription (batch files)
    const batchRegex = /slug:\s*['"]([^'"]+)['"][\s\S]*?metaTitle:\s*['"]([^'"]+)['"][\s\S]*?metaDescription:\s*['"]([^'"]+)['"]/g;
    let m;
    while ((m = batchRegex.exec(content)) !== null) {
      const [, slug, metaTitle, metaDesc] = m;
      if (slug && !slug.includes('${') && slug.length > 5) {
        blogEntries[slug] = {
          title: `${metaTitle} | Solar Freedom`,
          description: metaDesc,
        };
      }
    }

    // Extract slug + title (core blog.ts format — no metaTitle)
    const coreRegex = /slug:\s*['"]([^'"]+)['"][\s\S]*?title:\s*['"]([^'"]+)['"][\s\S]*?excerpt:\s*['"]([^'"]+)['"]/g;
    while ((m = coreRegex.exec(content)) !== null) {
      const [, slug, title, excerpt] = m;
      if (slug && !slug.includes('${') && slug.length > 5 && !blogEntries[slug]) {
        blogEntries[slug] = {
          title: `${title} | Solar Freedom`,
          description: excerpt.length > 155 ? excerpt.slice(0, 152) + '...' : excerpt,
        };
      }
    }
  }

  return blogEntries;
}

// ─── City-specific meta overrides for high-opportunity pages ─────────────────
const CITY_OVERRIDES = {
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
  'san-diego-ca': {
    title: 'Cancel Solar Contract in San Diego, CA | NEM 3.0 Legal Help',
    description: 'San Diego homeowners: SDG&E NEM 3.0 cut solar export credits by 75%. If your savings projections were based on NEM 2.0, you have legal grounds to cancel. Free review.',
  },
  'las-vegas-nv': {
    title: 'Cancel Solar Contract in Las Vegas, NV | Nevada Solar Rights',
    description: 'Las Vegas homeowners: Nevada net metering changes may have invalidated your solar contract\'s savings promises. Our attorneys cancel solar leases and loans. Free review.',
  },
  'houston-tx': {
    title: 'Cancel Solar Contract in Houston, TX | Texas Solar Rights',
    description: 'Houston homeowners: Texas has strong consumer protection laws for solar contracts. Our attorneys cancel solar leases and loans across the Houston metro. Free case review.',
  },
  'dallas-tx': {
    title: 'Cancel Solar Contract in Dallas, TX | Texas Solar Rights',
    description: 'Dallas homeowners trapped in solar contracts: Texas consumer protection laws give you real options. Our attorneys cancel solar leases and loans. Free case review.',
  },
  'orlando-fl': {
    title: 'Cancel Solar Contract in Orlando, FL | Florida Solar Rights',
    description: 'Orlando homeowners: Florida\'s solar contract laws include a 3-day rescission right. Our attorneys cancel solar leases and loans across Central Florida. Free case review.',
  },
  'tampa-fl': {
    title: 'Cancel Solar Contract in Tampa, FL | Florida Solar Rights',
    description: 'Tampa homeowners trapped in solar contracts: Florida consumer protection laws give you real options. Our attorneys cancel solar leases and loans. Free case review.',
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
    const cityLabel = city.stateCode ? `${city.name}, ${city.stateCode}` : city.name;
    map[urlPath] = {
      title: override?.title ?? `Cancel Solar Contract in ${cityLabel} | Solar Freedom`,
      description: override?.description ?? `Trapped in a solar contract in ${city.name}? Our attorneys have helped 3,000+ homeowners cancel solar agreements. Free case review — results in 30–90 days.`,
      canonical: `${BASE_URL}${urlPath}`,
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

  // State law pages — 51 pages
  for (const state of stateEntries) {
    const urlPath = `/solar-contract-laws/${state.slug}`;
    map[urlPath] = {
      title: `${state.state} Solar Contract Laws | Your Rights | Solar Freedom`,
      description: `Learn your legal rights under ${state.state} solar contract law — cooling-off periods, consumer protection statutes, and how to cancel. Free case review.`,
      canonical: `${BASE_URL}${urlPath}`,
    };
  }

  // Blog posts — ALL 100+ posts
  for (const [slug, data] of Object.entries(blogEntries)) {
    const urlPath = `/blog/${slug}`;
    map[urlPath] = {
      title: data.title,
      description: data.description,
      canonical: `${BASE_URL}${urlPath}`,
    };
  }

  // Static pages
  const staticPages = [
    { path: "/blog", title: "Solar Contract Help Blog | Solar Freedom", desc: "Expert articles on how to cancel solar contracts, fight solar fraud, and understand your legal rights as a homeowner." },
    { path: "/how-it-works", title: "How It Works | Solar Freedom", desc: "Learn how Solar Freedom helps homeowners cancel solar contracts through consumer protection law. Free case review." },
    { path: "/solar-lien-removal", title: "Solar Lien Removal | Remove a UCC-1 Solar Lien | Solar Freedom", desc: "A solar lien (UCC-1 fixture filing) on your home can block a sale or refinance. Our attorneys remove solar liens. Free review." },
    { path: "/solar-loan-help", title: "Solar Loan Help | Fight Predatory Solar Loans | Solar Freedom", desc: "Trapped in a high-interest solar loan with hidden dealer fees? Our attorneys challenge solar loans under TILA and consumer protection law." },
    { path: "/solar-exit-options", title: "Solar Exit Options | How to Get Out of a Solar Contract", desc: "Explore every legal path to exit your solar contract — rescission, fraud claims, lender disputes, and more. Free case review." },
    { path: "/solar-fraud-report", title: "Report Solar Fraud | File a Solar Complaint | Solar Freedom", desc: "Were you misled by a solar salesperson? Report solar fraud to the right agencies and explore your legal options. Free case review." },
    { path: "/solar-contract-laws", title: "Solar Contract Laws by State | Your Legal Rights | Solar Freedom", desc: "Every state has different solar contract laws. Find your state's cooling-off period, consumer protection statutes, and cancellation rights." },
  ];
  for (const p of staticPages) {
    map[p.path] = { title: p.title, description: p.desc, canonical: `${BASE_URL}${p.path}` };
  }

  return map;
}

// ─── Inject meta into HTML ────────────────────────────────────────────────────
// CRITICAL: Must REMOVE existing canonical and APPEND new one.
// Using .attr() fails if the element doesn't exist; using remove()+append() is bulletproof.
function injectMeta(html, meta) {
  const $ = cheerio.load(html, { decodeEntities: false });

  // Title
  $("title").text(meta.title);

  // Meta description
  $('meta[name="description"]').attr("content", meta.description);

  // Canonical — REMOVE ALL EXISTING, then APPEND correct one
  // This prevents duplicate canonicals (the #1 indexing killer)
  $('link[rel="canonical"]').remove();
  $('head').append(`<link rel="canonical" href="${meta.canonical}" />`);

  // Open Graph
  $('meta[property="og:title"]').attr("content", meta.title);
  $('meta[property="og:description"]').attr("content", meta.description);
  $('meta[property="og:url"]').attr("content", meta.canonical);

  // Twitter
  $('meta[name="twitter:title"]').attr("content", meta.title);
  $('meta[name="twitter:description"]').attr("content", meta.description);

  return $.html();
}

// ─── Load DB blog posts from database ────────────────────────────────────────
async function loadDbBlogPosts() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log("  ⚠️  DATABASE_URL not set — skipping DB blog posts");
    return {};
  }
  try {
    const conn = await createConnection(dbUrl);
    const [rows] = await conn.execute(
      "SELECT slug, metaTitle, metaDescription FROM blog_posts WHERE published = 1"
    );
    await conn.end();
    const entries = {};
    for (const row of rows) {
      if (row.slug && row.metaTitle) {
        entries[row.slug] = {
          title: `${row.metaTitle} | Solar Freedom`,
          description: row.metaDescription || `Learn how to cancel your solar contract. Free case review from Solar Freedom attorneys.`,
        };
      }
    }
    console.log(`  📦 Loaded ${Object.keys(entries).length} DB blog posts for pre-rendering`);
    return entries;
  } catch (err) {
    console.warn(`  ⚠️  Could not load DB blog posts: ${err.message}`);
    return {};
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🔧 Pre-rendering static HTML files...");
  const indexHtml = fs.readFileSync(path.resolve(DIST, "index.html"), "utf-8");
  const { cityEntries, companyEntries, stateEntries } = await loadData();
  const blogEntries = loadBlogData();
  // Merge DB posts into blog entries (DB posts take precedence over static)
  const dbBlogEntries = await loadDbBlogPosts();
  const allBlogEntries = { ...blogEntries, ...dbBlogEntries };
  const metaMap = buildMetaMap(cityEntries, companyEntries, stateEntries, allBlogEntries);

  let count = 0;
  for (const [urlPath, meta] of Object.entries(metaMap)) {
    if (urlPath === "/") {
      // Fix the homepage index.html canonical too (it has the hardcoded one)
      const injected = injectMeta(indexHtml, meta);
      fs.writeFileSync(path.resolve(DIST, "index.html"), injected, "utf-8");
      continue;
    }

    const injected = injectMeta(indexHtml, meta);

    // Create directory and write index.html
    const dir = path.resolve(DIST, urlPath.slice(1)); // remove leading /
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.resolve(dir, "index.html"), injected, "utf-8");
    count++;
  }

  console.log(`✅ Pre-rendered ${count + 1} pages (including homepage)`);
  console.log(`   City pages: ${cityEntries.length}`);
  console.log(`   Company pages: ${companyEntries.length}`);
  console.log(`   State law pages: ${stateEntries.length}`);
  console.log(`   Blog posts: ${Object.keys(blogEntries).length}`);
}

main().catch((err) => {
  console.error("Pre-render failed:", err);
  process.exit(1);
});
