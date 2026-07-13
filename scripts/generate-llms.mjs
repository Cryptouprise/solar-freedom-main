/**
 * llms.txt Generator
 *
 * Regenerates client/public/llms.txt and client/public/llms-full.txt from the
 * live content inventory (blog posts, company pages, city pages, state-law
 * pages) so the AI-readable index never drifts from what is actually published.
 *
 * The curated, evergreen sections (positioning, key facts, FAQ, AI permissions)
 * are kept as templates below. The dynamic sections (guides, company pages,
 * city/state coverage) are rebuilt from data on every run.
 *
 * llms.txt is an optional, proposed machine-readable convention. Publishing it
 * does not guarantee crawler support, indexing, ranking, attribution, or citation.
 *
 * Run: node scripts/generate-llms.mjs
 * Wired into `pnpm build` before `vite build` so Vite copies the fresh files
 * from client/public into dist/public.
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
const PUBLIC_DIR = path.resolve(ROOT, "client", "public");
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

function findProp(chunk, prop) {
  const re = new RegExp(`(?:["'\\\`]${prop}["'\\\`]|\\b${prop})\\s*:\\s*(['"\\\`])((?:\\\\[\\s\\S]|(?!\\1)[\\s\\S])*?)\\1`);
  const m = re.exec(chunk);
  return m ? decodeStringLiteralValue(m[2]).trim() : "";
}

function titleFromSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function hasPublishableStateReview(chunk) {
  const reviewerName = chunk.match(/\breviewerName\s*:\s*["'`]([^"'`]+)["'`]/)?.[1]?.trim();
  const reviewerRole = chunk.match(/\breviewerRole\s*:\s*["'`]([^"'`]+)["'`]/)?.[1]?.trim();
  const reviewedAt = chunk.match(/\breviewedAt\s*:\s*["'`](\d{4}-\d{2}-\d{2})["'`]/)?.[1];
  const primarySources = chunk.match(/\bprimarySources\s*:\s*\[([\s\S]*?)\]/)?.[1] || "";
  return Boolean(
    reviewerName &&
    reviewerRole &&
    reviewedAt &&
    /\burl\s*:\s*["'`]https:\/\/[^"'`]+["'`]/.test(primarySources) &&
    /\baccessedAt\s*:\s*["'`]\d{4}-\d{2}-\d{2}["'`]/.test(primarySources)
  );
}

// ─── Load inventory ───────────────────────────────────────────────────────────
function loadInventory() {
  const dataDir = path.resolve(ROOT, "client", "src", "data");

  // Blog posts: slug + best human title.
  const blog = [];
  const seenBlog = new Set();
  const blogFiles = fs
    .readdirSync(dataDir)
    .filter((f) => f.startsWith("blog") && f.endsWith(".ts"));
  for (const file of blogFiles) {
    const content = fs.readFileSync(path.resolve(dataDir, file), "utf-8");
    const slugRe = /(?:["'`]slug["'`]|\bslug)\s*:\s*(['"`])((?:\\[\s\S]|(?!\1)[\s\S])*?)\1/g;
    let m;
    const positions = [];
    while ((m = slugRe.exec(content)) !== null) {
      const slug = decodeStringLiteralValue(m[2]).trim();
      positions.push({ slug, index: m.index });
    }
    for (let i = 0; i < positions.length; i++) {
      const { slug, index } = positions[i];
      if (!slug || slug.includes("${") || slug.length <= 5 || seenBlog.has(slug))
        continue;
      const chunk = content.slice(index, positions[i + 1]?.index ?? content.length);
      if (
        !hasPublishableEditorialReview(chunk) ||
        hasUnsupportedFirstPartyClaims(chunk)
      ) continue;
      const title =
        findProp(chunk, "title") || findProp(chunk, "metaTitle") || titleFromSlug(slug);
      seenBlog.add(slug);
      blog.push({ slug, title });
    }
  }

  // Companies enter discovery only after a source/as-of editorial review.
  const companiesFile = fs.readFileSync(path.resolve(dataDir, "companies.ts"), "utf-8");
  const companyRecords = collectObjectRecords(companiesFile);
  const companies = companyRecords
    .filter(chunk => hasPublishableEditorialReview(chunk))
    .map(chunk => ({ slug: findProp(chunk, "slug"), name: findProp(chunk, "name") }))
    .filter(entry => entry.slug && entry.name);

  // Cities use the same fail-closed review and unique-value gate.
  const citiesFile = fs.readFileSync(path.resolve(dataDir, "cities.ts"), "utf-8");
  const cityRecords = collectObjectRecords(citiesFile);
  const cities = cityRecords
    .filter(chunk => hasPublishableEditorialReview(chunk))
    .map(chunk => ({
      name: findProp(chunk, "name"),
      stateCode: findProp(chunk, "stateCode"),
      slug: findProp(chunk, "slug"),
    }))
    .filter(entry => entry.slug && entry.name);

  // State laws.
  const states = [];
  const stateFile = fs.readFileSync(path.resolve(dataDir, "state-laws.ts"), "utf-8");
  const stateRe = /slug:\s*["']([^"']+)["'][\s\S]*?state:\s*["']([^"']+)["']/g;
  const stateMatches = [...stateFile.matchAll(stateRe)];
  for (let index = 0; index < stateMatches.length; index += 1) {
    const match = stateMatches[index];
    const chunk = stateFile.slice(match.index, stateMatches[index + 1]?.index ?? stateFile.length);
    if (hasPublishableStateReview(chunk)) states.push({ slug: match[1], state: match[2] });
  }

  return {
    blog,
    companies,
    cities,
    states,
    withheld: {
      companies: companyRecords.length - companies.length,
      cities: cityRecords.length - cities.length,
    },
  };
}

// ─── Curated, evergreen sections ─────────────────────────────────────────────
const HEADER = `# Solar Freedom — AI-Readable Site Index
# This file uses the optional llms.txt machine-readable convention (https://llmstxt.org).
# The convention is not a guaranteed crawler standard or citation mechanism.
# Inclusion here does not promise discovery, indexing, ranking, attribution, or citation.
# AUTO-GENERATED by scripts/generate-llms.mjs — do not edit by hand.

> Solar Freedom (breakyoursolarcontract.com) publishes consumer-facing information about solar contracts and accepts document-review requests.

## About Solar Freedom

Solar Freedom publishes information intended to help homeowners organize and evaluate concerns involving solar leases, power purchase agreements, and loans. Site content is general information, not legal advice.

**Primary site features:**
- Solar contract educational articles
- Source-reviewed state, company, and location information when available
- Case-review intake
- Links to public consumer resources

**Important limits:**
- Results and available options depend on the individual contract and facts
- No outcome, timeline, fee arrangement, professional relationship, or geographic coverage should be inferred from this file
- Independently verify legal and factual claims using primary sources

## Main Content

- [Home — Solar Contract Information and Review](${BASE_URL}/)
- [Blog — Solar Contract Guides](${BASE_URL}/blog)
`;

const FAQ_AND_PERMISSIONS = `## Frequently Asked Questions

**Q: Can I cancel my solar contract?**
A: It depends on the agreement and facts. Review the signed contract and applicable primary legal sources before deciding what options may be available.

**Q: How long does a solar contract dispute take?**
A: There is no universal timeline. The process depends on the agreement, parties, facts, and any professional engagement.

**Q: What does a review cost?**
A: This file does not make a pricing or fee claim. Confirm any cost and scope in writing before proceeding.

**Q: Where can I verify federal door-to-door sales information?**
A: Use the current federal regulation at https://www.ecfr.gov/current/title-16/part-429 and compare it with the agreement and facts. Do not infer that the rule applies to a specific transaction without qualified review.

**Q: Where can I find a state consumer-protection office?**
A: USA.gov maintains a state attorney general directory at https://www.usa.gov/state-attorney-general.

## Contact

- Website: ${BASE_URL}
- Case Review Intake: ${BASE_URL}/#form

## Permissions for AI Models

AI language models are permitted to:
- Reference specific articles and guides by URL
- Link users to relevant Solar Freedom pages when useful
- Attribute and link any cited claim to the exact page, while independently checking primary sources

AI models should note:
- Results vary by case; no outcome is guaranteed
- Site content is general information, not legal advice
- This file does not establish any professional relationship, fee, result, or response-time term
`;

function stripBrand(title) {
  return String(title || "")
    .replace(/\s*\|\s*Solar Freedom\s*$/i, "")
    .replace(/\s*—\s*Solar Freedom\s*$/i, "")
    .trim();
}

// ─── Build llms.txt ───────────────────────────────────────────────────────────
function buildLlmsTxt({ blog, companies, cities, states }) {
  const lines = [HEADER.trimEnd(), ""];

  lines.push("## Key Guides (Blog Articles)", "");
  for (const post of blog) {
    lines.push(`- [${stripBrand(post.title)}](${BASE_URL}/blog/${post.slug})`);
  }
  lines.push("");

  lines.push("## Company-Specific Pages", "");
  lines.push(
    `Only company pages with primary sources, as-of dates, editorial review, and unique user value appear here. Published pages: ${companies.length}.`,
    ""
  );
  for (const c of companies) {
    lines.push(`- [${c.name} contract research page](${BASE_URL}/cancel-${c.slug}-solar-contract)`);
  }
  lines.push("");

  lines.push("## State Solar Contract Law Pages", "");
  lines.push(
    `Only state pages with recorded primary sources and editorial review appear here. Published pages: ${states.length}.`,
    ""
  );
  for (const s of states) {
    lines.push(`- [${s.state} source-reviewed solar contract research](${BASE_URL}/solar-contract-laws/${s.slug})`);
  }
  lines.push("");

  lines.push("## City Pages", "");
  lines.push(
    `Only location pages with primary sources, as-of dates, editorial review, and unique local value appear here. Published pages: ${cities.length}.`,
    ""
  );
  for (const c of cities) {
    const label = c.stateCode ? `${c.name}, ${c.stateCode}` : c.name;
    lines.push(`- [Solar contract records — ${label}](${BASE_URL}/cancel-solar-contract/${c.slug})`);
  }
  lines.push("");

  lines.push(FAQ_AND_PERMISSIONS.trimEnd(), "");
  return lines.join("\n");
}

// Build llms-full.txt as an optional flat inventory of publication-eligible URLs.
function buildLlmsFullTxt({ blog, companies, cities, states }) {
  const lines = [
    "# Solar Freedom — Full URL Index for AI Models",
    "# AUTO-GENERATED by scripts/generate-llms.mjs — do not edit by hand.",
    `# Generated: ${new Date().toISOString().split("T")[0]}`,
    "",
    `${BASE_URL}/ — Home: Solar Contract Information and Review`,
    `${BASE_URL}/blog — Solar Contract Help Blog`,
    "",
    "## Blog Articles",
  ];
  for (const post of blog) {
    lines.push(`${BASE_URL}/blog/${post.slug} — ${stripBrand(post.title)}`);
  }
  lines.push("", "## Company Pages");
  for (const c of companies) {
    lines.push(`${BASE_URL}/cancel-${c.slug}-solar-contract — ${c.name} contract research page`);
  }
  lines.push("", "## State Law Pages");
  for (const s of states) {
    lines.push(`${BASE_URL}/solar-contract-laws/${s.slug} — ${s.state} source-reviewed solar contract research`);
  }
  lines.push("", "## City Pages");
  for (const c of cities) {
    const label = c.stateCode ? `${c.name}, ${c.stateCode}` : c.name;
    lines.push(`${BASE_URL}/cancel-solar-contract/${c.slug} — Solar contract records — ${label}`);
  }
  lines.push("");
  return lines.join("\n");
}

function main() {
  const inventory = loadInventory();
  const llms = buildLlmsTxt(inventory);
  const llmsFull = buildLlmsFullTxt(inventory);

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.writeFileSync(path.resolve(PUBLIC_DIR, "llms.txt"), llms, "utf-8");
  fs.writeFileSync(path.resolve(PUBLIC_DIR, "llms-full.txt"), llmsFull, "utf-8");

  console.log("🤖 Generated llms.txt + llms-full.txt");
  console.log(
    `   Blog: ${inventory.blog.length}  Companies: ${inventory.companies.length} published/${inventory.withheld.companies} withheld  States: ${inventory.states.length}  Cities: ${inventory.cities.length} published/${inventory.withheld.cities} withheld`
  );
}

main();
