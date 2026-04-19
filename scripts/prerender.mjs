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
 * OUTPUT: dist/public/cancel-sunrun-solar-contract/index.html, etc.
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

// ─── Load data files ──────────────────────────────────────────────────────────
// We use dynamic import with tsx to handle TypeScript data files
async function loadData() {
  // Read the compiled data by requiring the source TypeScript files via tsx
  // Since this script runs after build, we read from source files directly
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

  // Extract slugs/names using regex since we can't import TS directly in .mjs
  const cityEntries = [];
  // Cities are inline objects: { name: "Dallas", ..., slug: "dallas-tx", ... }
  const cityNameRegex = /\{\s*name:\s*["']([^"']+)["'][^}]*slug:\s*["']([^"']+)["']/g;
  let m;
  while ((m = cityNameRegex.exec(citiesFile)) !== null) {
    cityEntries.push({ slug: m[2], name: m[1] });
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

// ─── Build meta map ───────────────────────────────────────────────────────────
function buildMetaMap(cityEntries, companyEntries, stateEntries) {
  const map = {};

  // Homepage
  map["/"] = {
    title: "Solar Freedom — Get Out of Your Solar Contract Today",
    description:
      "Trapped in a solar contract? Our attorneys have helped 3,000+ homeowners cancel solar contracts from Sunrun, SunPower, Tesla Solar & more. Free case review.",
    canonical: `${BASE_URL}/`,
  };

  // City pages
  for (const city of cityEntries) {
    const urlPath = `/cancel-solar-contract/${city.slug}`;
    map[urlPath] = {
      title: `Cancel Solar Contract in ${city.name} | Solar Freedom`,
      description: `Trapped in a solar contract in ${city.name}? Our attorneys can help you cancel. Free case review — no obligation.`,
      canonical: `${BASE_URL}${urlPath}`,
    };
  }

  // Company pages
  for (const company of companyEntries) {
    const urlPath = `/cancel-${company.slug}-solar-contract`;
    const displayName = company.name;
    map[urlPath] = {
      title: `Cancel ${displayName} Solar Contract | Solar Freedom`,
      description: `Trapped in a ${displayName} solar contract? Our attorneys specialize in ${displayName} cancellations. Free case review — no obligation.`,
      canonical: `${BASE_URL}${urlPath}`,
    };
  }

  // State law pages
  for (const state of stateEntries) {
    const urlPath = `/solar-contract-laws/${state.slug}`;
    map[urlPath] = {
      title: `${state.state} Solar Contract Laws | Solar Freedom`,
      description: `Learn about ${state.state} solar contract laws and your rights. Find out if you can cancel your solar contract under ${state.state} law.`,
      canonical: `${BASE_URL}${urlPath}`,
    };
  }

  // Static pages
  const staticPages = [
    { path: "/blog", title: "Solar Contract Blog | Solar Freedom", desc: "Expert articles on solar contracts, cancellations, and homeowner rights." },
    { path: "/how-it-works", title: "How It Works | Solar Freedom", desc: "Learn how Solar Freedom helps homeowners cancel solar contracts." },
    { path: "/solar-lien-removal", title: "Solar Lien Removal | Solar Freedom", desc: "Remove solar liens from your property title. Free consultation." },
    { path: "/solar-loan-help", title: "Solar Loan Help | Solar Freedom", desc: "Struggling with solar loan payments? We can help. Free case review." },
    { path: "/selling-home-with-solar", title: "Selling Home With Solar | Solar Freedom", desc: "Learn how to sell your home with a solar contract. Free consultation." },
    { path: "/state-solar-laws", title: "State Solar Contract Laws | Solar Freedom", desc: "Solar contract laws by state. Know your rights as a homeowner." },
  ];
  for (const p of staticPages) {
    map[p.path] = { title: p.title, description: p.desc, canonical: `${BASE_URL}${p.path}` };
  }

  return map;
}

// ─── Inject meta into HTML ────────────────────────────────────────────────────
function injectMeta(html, meta) {
  const $ = cheerio.load(html, { decodeEntities: false });

  $("title").text(meta.title);
  $('meta[name="description"]').attr("content", meta.description);
  $('link[rel="canonical"]').attr("href", meta.canonical);
  $('meta[property="og:title"]').attr("content", meta.title);
  $('meta[property="og:description"]').attr("content", meta.description);
  $('meta[property="og:url"]').attr("content", meta.canonical);
  $('meta[name="twitter:title"]').attr("content", meta.title);
  $('meta[name="twitter:description"]').attr("content", meta.description);

  return $.html();
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🔧 Pre-rendering static HTML files...");

  const indexHtml = fs.readFileSync(path.resolve(DIST, "index.html"), "utf-8");
  const { cityEntries, companyEntries, stateEntries } = await loadData();
  const metaMap = buildMetaMap(cityEntries, companyEntries, stateEntries);

  let count = 0;
  for (const [urlPath, meta] of Object.entries(metaMap)) {
    if (urlPath === "/") continue; // index.html already handles homepage

    const injected = injectMeta(indexHtml, meta);

    // Create directory and write index.html
    const dir = path.resolve(DIST, urlPath.slice(1)); // remove leading /
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.resolve(dir, "index.html"), injected, "utf-8");
    count++;
  }

  console.log(`✅ Pre-rendered ${count} pages`);
  console.log(`   City pages: ${cityEntries.length}`);
  console.log(`   Company pages: ${companyEntries.length}`);
  console.log(`   State law pages: ${stateEntries.length}`);
}

main().catch((err) => {
  console.error("Pre-render failed:", err);
  process.exit(1);
});
