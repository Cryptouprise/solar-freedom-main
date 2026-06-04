/**
 * SEO Internal-Link Opportunity Finder
 *
 * The May 2026 audit found the site's biggest structural weakness is that the
 * 301 city pages (`/cancel-solar-contract/[city]`) and 51 state-law pages
 * (`/solar-contract-laws/[state]`) are thin and near-duplicate, so Google
 * indexes them slowly and ranks them poorly. The fastest, fully-in-our-control
 * lever is internal links: pointing the blog posts Google already trusts at the
 * city/state pages that need discovery and authority.
 *
 * This agent:
 *   1. Reads the sitemap inventory and splits it into authority "sources"
 *      (blog posts) and "targets" (city + state-law pages).
 *   2. Reads Google Search Console performance (gsc_all_pages.json or
 *      gsc_report.csv) to rank sources by the authority they can pass and to
 *      flag targets that are unindexed (absent from GSC) or under-performing.
 *   3. Emits a deterministic, prioritized queue of internal links to add:
 *      for each target, the highest-authority, most topically-relevant blog
 *      posts that should link to it, plus a suggested anchor text.
 *
 * The deterministic queue is the source of truth. This script never edits
 * source files or publishes anything — it only tells a human which contextual
 * internal links to add for the biggest indexing/ranking lift.
 *
 * Output:
 *   reports/seo-agent/latest-internal-links.json
 *   reports/seo-agent/INTERNAL_LINKS.md
 *
 * Run:
 *   node scripts/seo-internal-links.mjs
 *   node scripts/seo-internal-links.mjs --limit 40 --sources-per-target 3
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEFAULT_BASE_URL = "https://breakyoursolarcontract.com";
const DEFAULT_SITEMAP = path.resolve(ROOT, "client/public/sitemap.xml");
const DEFAULT_GSC_JSON = path.resolve(ROOT, "gsc_all_pages.json");
const DEFAULT_GSC_CSV = path.resolve(ROOT, "gsc_report.csv");
const DEFAULT_OUT_JSON = path.resolve(ROOT, "reports/seo-agent/latest-internal-links.json");
const DEFAULT_OUT_MD = path.resolve(ROOT, "reports/seo-agent/INTERNAL_LINKS.md");

// Two-letter US state codes used by city slugs (e.g. `dallas-tx`).
const STATE_CODES = new Set([
  "al", "ak", "az", "ar", "ca", "co", "ct", "de", "fl", "ga", "hi", "id", "il",
  "in", "ia", "ks", "ky", "la", "me", "md", "ma", "mi", "mn", "ms", "mo", "mt",
  "ne", "nv", "nh", "nj", "nm", "ny", "nc", "nd", "oh", "ok", "or", "pa", "ri",
  "sc", "sd", "tn", "tx", "ut", "vt", "va", "wa", "wv", "wi", "wy", "dc",
]);

const STATE_NAME_BY_CODE = {
  al: "alabama", ak: "alaska", az: "arizona", ar: "arkansas", ca: "california",
  co: "colorado", ct: "connecticut", de: "delaware", fl: "florida", ga: "georgia",
  hi: "hawaii", id: "idaho", il: "illinois", in: "indiana", ia: "iowa",
  ks: "kansas", ky: "kentucky", la: "louisiana", me: "maine", md: "maryland",
  ma: "massachusetts", mi: "michigan", mn: "minnesota", ms: "mississippi",
  mo: "missouri", mt: "montana", ne: "nebraska", nv: "nevada", nh: "new-hampshire",
  nj: "new-jersey", nm: "new-mexico", ny: "new-york", nc: "north-carolina",
  nd: "north-dakota", oh: "ohio", ok: "oklahoma", or: "oregon", pa: "pennsylvania",
  ri: "rhode-island", sc: "south-carolina", sd: "south-dakota", tn: "tennessee",
  tx: "texas", ut: "utah", vt: "vermont", va: "virginia", wa: "washington",
  wv: "west-virginia", wi: "wisconsin", wy: "wyoming", dc: "district-of-columbia",
};

function parseArgs(argv) {
  const args = {
    base: (process.env.SEO_LINKS_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, ""),
    sitemap: process.env.SEO_LINKS_SITEMAP || DEFAULT_SITEMAP,
    gscJson: process.env.SEO_LINKS_GSC_JSON || DEFAULT_GSC_JSON,
    gscCsv: process.env.SEO_LINKS_GSC_CSV || DEFAULT_GSC_CSV,
    outJson: process.env.SEO_LINKS_OUT_JSON || DEFAULT_OUT_JSON,
    outMd: process.env.SEO_LINKS_OUT_MD || DEFAULT_OUT_MD,
    limit: Number(process.env.SEO_LINKS_LIMIT || 40),
    sourcesPerTarget: Number(process.env.SEO_LINKS_SOURCES_PER_TARGET || 3),
    // Targets with more impressions than this are already getting discovered, so
    // they are lower priority than unindexed/near-silent pages.
    maxTargetImpressions: Number(process.env.SEO_LINKS_MAX_TARGET_IMPRESSIONS || 150),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--base" && next) args.base = next.replace(/\/$/, "");
    if (arg === "--sitemap" && next) args.sitemap = path.resolve(ROOT, next);
    if (arg === "--gsc-json" && next) args.gscJson = path.resolve(ROOT, next);
    if (arg === "--gsc-csv" && next) args.gscCsv = path.resolve(ROOT, next);
    if (arg === "--out-json" && next) args.outJson = path.resolve(ROOT, next);
    if (arg === "--out-md" && next) args.outMd = path.resolve(ROOT, next);
    if (arg === "--limit" && next) args.limit = Number(next);
    if (arg === "--sources-per-target" && next) args.sourcesPerTarget = Number(next);
    if (arg === "--max-target-impressions" && next) args.maxTargetImpressions = Number(next);
  }

  args.limit = Math.max(1, args.limit || 40);
  args.sourcesPerTarget = Math.max(1, args.sourcesPerTarget || 3);
  return args;
}

async function readText(filePath) {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return "";
  }
}

async function readJson(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function pathFromUrl(url) {
  try {
    return new URL(url).pathname.replace(/\/+$/, "") || "/";
  } catch {
    return null;
  }
}

async function loadSitemapPaths(args) {
  const xml = await readText(args.sitemap);
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  const seen = new Set();
  const paths = [];
  for (const loc of locs) {
    const p = pathFromUrl(loc);
    if (!p || seen.has(p)) continue;
    seen.add(p);
    paths.push(p);
  }
  return paths;
}

// Normalize GSC rows from either the JSON export or the CSV export, keyed by
// path so we can join them with the sitemap inventory.
async function loadPerformanceByPath(args) {
  const byPath = new Map();
  const add = (url, clicks, impressions, ctr, position) => {
    const p = pathFromUrl(url);
    if (!p) return;
    byPath.set(p, {
      clicks: Number(clicks || 0),
      impressions: Number(impressions || 0),
      ctr: Number(ctr || 0),
      position: Number(position || 0),
    });
  };

  const json = await readJson(args.gscJson);
  if (Array.isArray(json)) {
    for (const row of json) {
      const url = Array.isArray(row.keys) ? row.keys[0] : row.page || row.url;
      if (!url) continue;
      // GSC JSON ctr is a 0..1 fraction; convert to percent.
      add(url, row.clicks, row.impressions, Number(row.ctr || 0) * 100, row.position);
    }
  }

  if (byPath.size === 0) {
    const csv = await readText(args.gscCsv);
    const lines = csv.split(/\r?\n/).filter(Boolean);
    if (lines.length > 1) {
      const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const idx = (name) => header.indexOf(name);
      for (const line of lines.slice(1)) {
        const cols = line.split(",");
        const url = cols[idx("page")] || cols[idx("url")];
        if (!url) continue;
        // CSV ctr is already a percent value in this repo's export.
        add(url, cols[idx("clicks")], cols[idx("impressions")], cols[idx("ctr")], cols[idx("position")]);
      }
    }
  }

  return byPath;
}

function slugFromPath(p) {
  return p.replace(/\/+$/, "").split("/").pop() || "";
}

function titleize(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function classify(p) {
  if (p.startsWith("/blog/")) return "blog";
  if (p.startsWith("/cancel-solar-contract/")) return "city";
  if (p.startsWith("/solar-contract-laws/")) return "state";
  return "other";
}

// City slugs look like `los-angeles-ca`; split into the city words and the
// trailing state code so we can match relevant sources.
function describeTarget(p, type) {
  const slug = slugFromPath(p);
  if (type === "city") {
    const parts = slug.split("-");
    const stateCode = parts[parts.length - 1];
    if (STATE_CODES.has(stateCode)) {
      const cityWords = parts.slice(0, -1);
      return {
        label: `${titleize(cityWords.join("-"))}, ${stateCode.toUpperCase()}`,
        keywords: new Set([...cityWords, stateCode, STATE_NAME_BY_CODE[stateCode]].filter(Boolean)),
      };
    }
    return { label: titleize(slug), keywords: new Set(parts) };
  }
  // state-law page: slug is the state name (e.g. `new-jersey`).
  return { label: titleize(slug), keywords: new Set(slug.split("-").filter(Boolean)) };
}

// A source can pass authority it has actually earned. Rank by clicks first
// (proven engagement) then impressions (proven reach); both gate on indexed.
function sourceAuthority(perf) {
  if (!perf) return 0;
  return perf.clicks * 50 + perf.impressions;
}

// Relevance: does this blog post topically relate to the target city/state?
// Match on whole slug segments (split by `-`) rather than raw substrings so a
// 2-letter state code like `ny` does not falsely match inside "attorney".
function relevanceScore(sourceSlug, targetKeywords) {
  const segments = new Set(sourceSlug.split("-").filter(Boolean));
  let score = 0;
  for (const kw of targetKeywords) {
    if (!kw) continue;
    if (kw.includes("-")) {
      // Multi-word keyword (e.g. "new-york"): all parts must appear as segments.
      const parts = kw.split("-").filter(Boolean);
      if (parts.length && parts.every((part) => segments.has(part))) {
        score += parts.join("").length >= 4 ? 3 : 2;
      }
    } else if (segments.has(kw)) {
      score += kw.length >= 4 ? 3 : 2;
    }
  }
  return score;
}

function suggestAnchor(target) {
  if (target.type === "city") return `cancel your solar contract in ${target.label}`;
  return `${target.label} solar contract cancellation laws`;
}

function build(args, sitemapPaths, perfByPath) {
  const sources = [];
  const targets = [];

  for (const p of sitemapPaths) {
    const type = classify(p);
    const perf = perfByPath.get(p) || null;
    if (type === "blog") {
      sources.push({ path: p, slug: slugFromPath(p), perf, authority: sourceAuthority(perf) });
    } else if (type === "city" || type === "state") {
      targets.push({ path: p, type, perf, ...describeTarget(p, type) });
    }
  }

  // Indexed, authoritative blog posts only — a source with no GSC footprint
  // cannot pass authority it does not yet have.
  const rankedSources = sources
    .filter((s) => s.authority > 0)
    .sort((a, b) => b.authority - a.authority);

  // Globally strongest "pillar" posts: the fallback linkers when no topical
  // match exists for a target.
  const pillars = rankedSources.slice(0, 8);

  // Prioritize targets that need discovery the most:
  //   1. unindexed (absent from GSC),
  //   2. indexed but under the impressions ceiling (near-silent),
  // and within each bucket, surface the ones with the most latent demand.
  const scoredTargets = targets
    .map((t) => {
      const impressions = t.perf?.impressions || 0;
      const indexed = Boolean(t.perf);
      const needsLinks = !indexed || impressions <= args.maxTargetImpressions;
      // Lower priorityScore = more urgent.
      const bucket = !indexed ? 0 : 1;
      return { ...t, impressions, indexed, needsLinks, bucket };
    })
    .filter((t) => t.needsLinks)
    .sort((a, b) => {
      if (a.bucket !== b.bucket) return a.bucket - b.bucket;
      // Within unindexed, prefer city pages (more of them, higher intent) then
      // alphabetical for stable output. Within indexed, most impressions first.
      if (a.bucket === 1) return b.impressions - a.impressions;
      if (a.type !== b.type) return a.type === "city" ? -1 : 1;
      return a.path.localeCompare(b.path);
    })
    .slice(0, args.limit);

  const queue = scoredTargets.map((t) => {
    const ranked = rankedSources
      .map((s) => ({ s, rel: relevanceScore(s.slug, t.keywords) }))
      .filter((x) => x.rel > 0)
      .sort((a, b) => b.rel - a.rel || b.s.authority - a.s.authority)
      .map((x) => x.s);

    // Fill with topically-relevant sources first, then pillars, de-duplicated.
    const chosen = [];
    const used = new Set();
    for (const s of [...ranked, ...pillars]) {
      if (used.has(s.path)) continue;
      used.add(s.path);
      chosen.push({
        path: s.path,
        title: titleize(s.slug),
        clicks: s.perf?.clicks || 0,
        impressions: s.perf?.impressions || 0,
        relevant: relevanceScore(s.slug, t.keywords) > 0,
      });
      if (chosen.length >= args.sourcesPerTarget) break;
    }

    return {
      target: t.path,
      type: t.type,
      label: t.label,
      indexed: t.indexed,
      impressions: t.impressions,
      reason: t.indexed
        ? `Indexed but only ${t.impressions} impressions — needs internal authority to climb.`
        : "Not found in GSC — likely unindexed; needs internal links so Google can discover and trust it.",
      anchor: suggestAnchor(t),
      sources: chosen,
    };
  });

  const unindexed = scoredTargets.filter((t) => !t.indexed).length;
  return {
    generatedAt: new Date().toISOString(),
    baseUrl: args.base,
    summary: {
      sitemapPaths: sitemapPaths.length,
      blogSources: sources.length,
      authoritativeSources: rankedSources.length,
      cityTargets: targets.filter((t) => t.type === "city").length,
      stateTargets: targets.filter((t) => t.type === "state").length,
      queued: queue.length,
      unindexedQueued: unindexed,
    },
    pillars: pillars.map((p) => ({
      path: p.path,
      title: titleize(p.slug),
      clicks: p.perf?.clicks || 0,
      impressions: p.perf?.impressions || 0,
    })),
    queue,
  };
}

function formatMarkdown(report) {
  const lines = [];
  lines.push("# Internal-Link Opportunities");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Base URL: ${report.baseUrl}`);
  lines.push("");
  lines.push(
    "The fastest in-our-control lever for the thin city/state pages is internal " +
      "links from blog posts Google already trusts. Add the contextual links below " +
      "(natural placement in body copy), then resubmit the target in GSC."
  );
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Sitemap paths scanned: ${report.summary.sitemapPaths}`);
  lines.push(`- Blog posts (potential sources): ${report.summary.blogSources}`);
  lines.push(`- Authoritative sources (have GSC footprint): ${report.summary.authoritativeSources}`);
  lines.push(`- City targets: ${report.summary.cityTargets} | State-law targets: ${report.summary.stateTargets}`);
  lines.push(`- Link opportunities queued: ${report.summary.queued} (unindexed: ${report.summary.unindexedQueued})`);
  lines.push("");

  if (report.pillars.length) {
    lines.push("## Pillar sources (highest authority, safe to link from anywhere)");
    lines.push("");
    for (const p of report.pillars) {
      lines.push(`- \`${p.path}\` — ${p.clicks} clicks, ${p.impressions} impressions`);
    }
    lines.push("");
  }

  lines.push("## Queue");
  lines.push("");
  if (!report.queue.length) {
    lines.push("- None. Every city/state page is already indexed and above the impressions ceiling.");
  }
  report.queue.forEach((item, index) => {
    lines.push(`### ${index + 1}. \`${item.target}\` — ${item.label}`);
    lines.push("");
    lines.push(`- Type: ${item.type} | Indexed: ${item.indexed ? "yes" : "no"} | Impressions: ${item.impressions}`);
    lines.push(`- Why: ${item.reason}`);
    lines.push(`- Suggested anchor: "${item.anchor}"`);
    lines.push("- Add a contextual link from:");
    for (const s of item.sources) {
      const tag = s.relevant ? "topical match" : "pillar";
      lines.push(`  - \`${s.path}\` (${tag}; ${s.clicks} clicks, ${s.impressions} impressions)`);
    }
    lines.push("");
  });

  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sitemapPaths = await loadSitemapPaths(args);
  const perfByPath = await loadPerformanceByPath(args);

  if (!sitemapPaths.length) {
    console.error(`No sitemap URLs found at ${args.sitemap}. Run \`pnpm build\` or point --sitemap at a generated sitemap.xml.`);
    process.exitCode = 1;
    return;
  }

  const report = build(args, sitemapPaths, perfByPath);

  await fs.mkdir(path.dirname(args.outJson), { recursive: true });
  await fs.writeFile(args.outJson, `${JSON.stringify(report, null, 2)}\n`, "utf-8");
  await fs.writeFile(args.outMd, formatMarkdown(report), "utf-8");

  console.log("\nSEO Internal-Link Opportunities");
  console.log("===============================");
  console.log(`Authoritative sources: ${report.summary.authoritativeSources}`);
  console.log(`Targets queued: ${report.summary.queued} (unindexed: ${report.summary.unindexedQueued})`);
  console.log(`Queue: ${path.relative(ROOT, args.outMd)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
