/**
 * SEO Indexing Agent
 *
 * Turns sitemap inventory, GSC performance exports, and prior indexing
 * submission records into a prioritized indexing and refresh queue.
 *
 * This script does not submit URLs to Google. It writes the safest next-action
 * queue for GSC URL Inspection/manual requests, sitemap resubmission, and
 * content refreshes. Bing/IndexNow submission remains in submit-indexnow.mjs.
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
const DEFAULT_INDEXING_RESULTS = path.resolve(ROOT, "indexing-results-full.json");
const DEFAULT_INDEXING_STATUS = path.resolve(ROOT, "indexing-status.txt");
const DEFAULT_OUT_JSON = path.resolve(ROOT, "reports/seo-agent/latest-indexing-queue.json");
const DEFAULT_OUT_MD = path.resolve(ROOT, "reports/seo-agent/INDEXING_QUEUE.md");

function parseArgs(argv) {
  const args = {
    base: process.env.SEO_INDEXING_BASE_URL || DEFAULT_BASE_URL,
    sitemap: process.env.SEO_INDEXING_SITEMAP || DEFAULT_SITEMAP,
    gscJson: process.env.SEO_INDEXING_GSC_JSON || DEFAULT_GSC_JSON,
    gscCsv: process.env.SEO_INDEXING_GSC_CSV || DEFAULT_GSC_CSV,
    indexingResults: process.env.SEO_INDEXING_RESULTS || DEFAULT_INDEXING_RESULTS,
    indexingStatus: process.env.SEO_INDEXING_STATUS || DEFAULT_INDEXING_STATUS,
    outJson: process.env.SEO_INDEXING_OUT_JSON || DEFAULT_OUT_JSON,
    outMd: process.env.SEO_INDEXING_OUT_MD || DEFAULT_OUT_MD,
    limit: Number(process.env.SEO_INDEXING_LIMIT || 50),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--base" && next) args.base = next;
    if (arg === "--sitemap" && next) args.sitemap = path.resolve(ROOT, next);
    if (arg === "--gsc-json" && next) args.gscJson = path.resolve(ROOT, next);
    if (arg === "--gsc-csv" && next) args.gscCsv = path.resolve(ROOT, next);
    if (arg === "--indexing-results" && next) args.indexingResults = path.resolve(ROOT, next);
    if (arg === "--indexing-status" && next) args.indexingStatus = path.resolve(ROOT, next);
    if (arg === "--out-json" && next) args.outJson = path.resolve(ROOT, next);
    if (arg === "--out-md" && next) args.outMd = path.resolve(ROOT, next);
    if (arg === "--limit" && next) args.limit = Number(next);
  }

  args.base = args.base.replace(/\/$/, "");
  args.limit = Math.max(1, args.limit || 50);
  return args;
}

async function readText(filePath, fallback = "") {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return fallback;
  }
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

function normalizeUrl(url, baseUrl = DEFAULT_BASE_URL) {
  const parsed = new URL(url, baseUrl);
  parsed.protocol = "https:";
  parsed.hostname = new URL(baseUrl).hostname;
  parsed.hash = "";
  parsed.search = "";
  if (parsed.pathname.length > 1) parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  return parsed.toString();
}

function pathFromUrl(url) {
  return new URL(url).pathname;
}

function classifyPath(pathname) {
  if (pathname === "/") return "home";
  if (pathname === "/blog") return "blog_index";
  if (pathname.startsWith("/blog/")) return "blog_post";
  if (pathname.startsWith("/cancel-solar-contract/")) return "city_page";
  if (pathname.startsWith("/solar-contract-laws/")) return "state_law";
  if (pathname.startsWith("/cancel-") && pathname.endsWith("-solar-contract")) return "company_page";
  return "static";
}

async function readSitemapUrls(sitemapPath, baseUrl) {
  const xml = await readText(sitemapPath);
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => normalizeUrl(match[1], baseUrl));
}

function parseCsv(text) {
  const rows = text.trim().split(/\r?\n/).filter(Boolean);
  if (rows.length < 2) return [];
  const headers = rows.shift().split(",").map((header) => header.trim());
  return rows.map((row) => {
    const values = row.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""]));
  });
}

async function readGscPerformance(args) {
  const rows = new Map();
  const jsonRows = await readJson(args.gscJson, null);

  if (Array.isArray(jsonRows)) {
    for (const row of jsonRows) {
      const url = row.keys?.[0];
      if (!url) continue;
      rows.set(normalizeUrl(url, args.base), {
        clicks: Number(row.clicks || 0),
        impressions: Number(row.impressions || 0),
        ctr: Number(row.ctr || 0),
        position: Number(row.position || 0),
        source: "gsc_json",
      });
    }
  }

  if (rows.size === 0) {
    const csv = await readText(args.gscCsv);
    for (const row of parseCsv(csv)) {
      if (!row.page) continue;
      rows.set(normalizeUrl(row.page, args.base), {
        clicks: Number(row.clicks || 0),
        impressions: Number(row.impressions || 0),
        ctr: Number(row.ctr || 0) / 100,
        position: Number(row.position || 0),
        source: "gsc_csv",
      });
    }
  }

  return rows;
}

async function readSubmittedUrls(args) {
  const submitted = new Set();
  const data = await readJson(args.indexingResults, null);
  for (const key of ["success", "queued", "alreadyIndexed"]) {
    if (!Array.isArray(data?.[key])) continue;
    for (const url of data[key]) submitted.add(normalizeUrl(url, args.base));
  }
  return submitted;
}

async function readCoverageHints(args) {
  const text = await readText(args.indexingStatus);
  const hints = new Map();
  const blocks = text.split(/\r?\n(?=\[\d+\/\d+\])/g);
  for (const block of blocks) {
    const url = block.match(/https?:\/\/\S+/)?.[0];
    const coverage = block.match(/Coverage:\s*(.+)$/m)?.[1]?.trim();
    if (url && coverage) hints.set(normalizeUrl(url, args.base), coverage);
  }
  return hints;
}

function typeWeight(type) {
  return {
    home: 90,
    company_page: 85,
    static: 75,
    blog_index: 70,
    city_page: 65,
    blog_post: 60,
    state_law: 50,
  }[type] || 40;
}

function isLowCtr(performance) {
  if (!performance?.impressions) return false;
  return performance.impressions >= 100 && performance.ctr < 0.01;
}

function scorePage({ url, type, performance, submitted, coverage }) {
  let score = typeWeight(type);
  const reasons = [];
  const actionTags = [];

  if (!performance) {
    score += 45;
    reasons.push("In sitemap but absent from available GSC performance export.");
    actionTags.push("request_indexing");
  } else {
    if (performance.impressions >= 500) {
      score += 40;
      reasons.push(`${performance.impressions} impressions already show demand.`);
    } else if (performance.impressions >= 100) {
      score += 25;
      reasons.push(`${performance.impressions} impressions show early demand.`);
    }

    if (performance.position > 4 && performance.position <= 12) {
      score += 30;
      reasons.push(`Average position ${performance.position.toFixed(1)} is close to high-value traffic.`);
      actionTags.push("refresh_serp_snippet");
    } else if (performance.position > 12 && performance.position <= 30) {
      score += 20;
      reasons.push(`Average position ${performance.position.toFixed(1)} can improve with on-page refresh/internal links.`);
      actionTags.push("refresh_content");
    }

    if (isLowCtr(performance)) {
      score += 35;
      reasons.push(`CTR ${(performance.ctr * 100).toFixed(2)}% is weak for current impressions.`);
      actionTags.push("rewrite_title_description");
    }
  }

  if (!submitted) {
    score += 15;
    reasons.push("Not found in prior indexing submission results.");
    actionTags.push("submit_to_indexnow");
  }

  if (coverage) {
    if (/not indexed|unknown|discovered/i.test(coverage)) {
      score += 50;
      reasons.push(`Coverage hint: ${coverage}.`);
      actionTags.push("request_indexing");
    } else if (/indexed/i.test(coverage)) {
      score -= 20;
      reasons.push(`Coverage hint: ${coverage}.`);
    }
  }

  if (url.endsWith("/blog") || url.endsWith("/how-it-works")) {
    score += 25;
    reasons.push("Core navigation/education page should be visible in Google.");
  }

  return {
    url,
    path: pathFromUrl(url),
    type,
    score,
    actionTags: [...new Set(actionTags)],
    reasons,
    performance: performance || null,
    submittedBefore: submitted,
    coverage: coverage || null,
  };
}

function buildQueues({ sitemapUrls, performance, submittedUrls, coverageHints, limit }) {
  const pages = sitemapUrls.map((url) => {
    const type = classifyPath(pathFromUrl(url));
    return scorePage({
      url,
      type,
      performance: performance.get(url),
      submitted: submittedUrls.has(url),
      coverage: coverageHints.get(url),
    });
  }).sort((a, b) => b.score - a.score);

  const requestIndexing = pages
    .filter((page) => page.actionTags.includes("request_indexing") || !page.performance)
    .slice(0, limit);

  const refresh = pages
    .filter((page) => page.performance && (
      page.actionTags.includes("rewrite_title_description") ||
      page.actionTags.includes("refresh_serp_snippet") ||
      page.actionTags.includes("refresh_content")
    ))
    .slice(0, Math.min(limit, 25));

  const indexNow = pages
    .filter((page) => !page.submittedBefore)
    .slice(0, limit);

  const byType = {};
  for (const page of pages) {
    byType[page.type] ??= { count: 0, withPerformance: 0, missingPerformance: 0 };
    byType[page.type].count += 1;
    if (page.performance) byType[page.type].withPerformance += 1;
    else byType[page.type].missingPerformance += 1;
  }

  return { pages, requestIndexing, refresh, indexNow, byType };
}

function formatPerformance(performance) {
  if (!performance) return "no GSC performance row";
  return `${performance.clicks} clicks, ${performance.impressions} impressions, ${(performance.ctr * 100).toFixed(2)}% CTR, avg pos ${performance.position.toFixed(1)}`;
}

function formatQueue(items) {
  if (!items.length) return "No queued pages.";
  return items.map((item, index) => {
    const reasons = item.reasons.slice(0, 3).map((reason) => `  - ${reason}`).join("\n");
    return `${index + 1}. \`${item.path}\` (${item.type}, score ${item.score})
  - ${formatPerformance(item.performance)}
  - Actions: ${item.actionTags.length ? item.actionTags.map((tag) => `\`${tag}\``).join(", ") : "`monitor`"}
${reasons}`;
  }).join("\n\n");
}

function formatMarkdown({ generatedAt, args, sitemapUrls, performance, submittedUrls, queues }) {
  const performanceUrlCount = [...performance.keys()].filter((url) => sitemapUrls.includes(url)).length;
  const submittedInSitemap = [...submittedUrls].filter((url) => sitemapUrls.includes(url)).length;

  return `# SEO Indexing Queue

Generated: ${generatedAt}
Base URL: ${args.base}

## Summary

- Sitemap URLs: ${sitemapUrls.length}
- URLs with available GSC performance rows: ${performanceUrlCount}
- URLs found in prior indexing submissions: ${submittedInSitemap}
- Priority GSC request queue: ${queues.requestIndexing.length}
- SERP/content refresh queue: ${queues.refresh.length}
- IndexNow queue: ${queues.indexNow.length}

## Page Type Coverage

${Object.entries(queues.byType).map(([type, stats]) => `- \`${type}\`: ${stats.count} total, ${stats.withPerformance} with performance, ${stats.missingPerformance} without performance`).join("\n")}

## GSC Request Indexing Queue

Use this for Google Search Console URL Inspection requests or the equivalent authenticated Manus workflow. Do not spam every URL; start from the top and stop at the daily limit.

${formatQueue(queues.requestIndexing)}

## SERP And Content Refresh Queue

These pages already show demand. Improve titles, descriptions, openings, schema, and internal links before requesting recrawl.

${formatQueue(queues.refresh)}

## IndexNow Queue

These sitemap URLs were not found in prior IndexNow submission results. Use \`pnpm submit:indexnow\` after deployment if the key file is live.

${formatQueue(queues.indexNow)}
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const generatedAt = new Date().toISOString();
  const sitemapUrls = await readSitemapUrls(args.sitemap, args.base);
  const performance = await readGscPerformance(args);
  const submittedUrls = await readSubmittedUrls(args);
  const coverageHints = await readCoverageHints(args);
  const queues = buildQueues({
    sitemapUrls,
    performance,
    submittedUrls,
    coverageHints,
    limit: args.limit,
  });

  const report = {
    generatedAt,
    baseUrl: args.base,
    inputs: {
      sitemap: path.relative(ROOT, args.sitemap),
      gscJson: path.relative(ROOT, args.gscJson),
      gscCsv: path.relative(ROOT, args.gscCsv),
      indexingResults: path.relative(ROOT, args.indexingResults),
      indexingStatus: path.relative(ROOT, args.indexingStatus),
    },
    summary: {
      sitemapUrls: sitemapUrls.length,
      performanceRows: performance.size,
      submittedUrls: submittedUrls.size,
      requestIndexing: queues.requestIndexing.length,
      refresh: queues.refresh.length,
      indexNow: queues.indexNow.length,
      byType: queues.byType,
    },
    requestIndexing: queues.requestIndexing,
    refresh: queues.refresh,
    indexNow: queues.indexNow,
  };

  await fs.mkdir(path.dirname(args.outJson), { recursive: true });
  await fs.writeFile(args.outJson, `${JSON.stringify(report, null, 2)}\n`, "utf-8");
  await fs.writeFile(args.outMd, formatMarkdown({ generatedAt, args, sitemapUrls, performance, submittedUrls, queues }), "utf-8");

  console.log("\nSEO Indexing Agent");
  console.log("==================");
  console.log(`Sitemap URLs: ${sitemapUrls.length}`);
  console.log(`GSC performance rows: ${performance.size}`);
  console.log(`Prior submitted URLs: ${submittedUrls.size}`);
  console.log(`GSC request queue: ${queues.requestIndexing.length}`);
  console.log(`Refresh queue: ${queues.refresh.length}`);
  console.log(`IndexNow queue: ${queues.indexNow.length}`);
  console.log(`Report: ${path.relative(ROOT, args.outMd)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
