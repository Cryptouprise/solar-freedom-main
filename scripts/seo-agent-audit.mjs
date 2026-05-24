/**
 * SEO Agent Audit
 *
 * Crawls sitemap URLs against a target base URL and reports technical/on-page
 * issues that can feed the SEO command center or a recurring automation.
 *
 * Examples:
 *   pnpm seo:audit
 *   pnpm seo:audit -- --base http://localhost:3000 --limit 50
 *   pnpm seo:audit -- --out reports/seo-agent/latest.json
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEFAULT_BASE_URL = "http://localhost:3000";
const DEFAULT_SITEMAP = path.resolve(ROOT, "client/public/sitemap.xml");

const ISSUE_WEIGHTS = {
  status_error: 100,
  noindex: 95,
  missing_title: 90,
  missing_description: 80,
  missing_canonical: 75,
  canonical_mismatch: 55,
  canonical_origin_mismatch: 50,
  missing_h1: 70,
  multiple_h1: 35,
  missing_json_ld: 45,
  invalid_json_ld: 45,
  thin_content: 55,
  short_title: 25,
  long_title: 20,
  short_description: 25,
  long_description: 20,
  low_internal_links: 30,
  low_image_alt_coverage: 20,
  duplicate_title: 65,
  duplicate_description: 50,
};

function parseArgs(argv) {
  const args = {
    base: process.env.SEO_AUDIT_BASE_URL || DEFAULT_BASE_URL,
    sitemap: process.env.SEO_AUDIT_SITEMAP || DEFAULT_SITEMAP,
    limit: Number(process.env.SEO_AUDIT_LIMIT || 0),
    concurrency: Number(process.env.SEO_AUDIT_CONCURRENCY || 8),
    timeoutMs: Number(process.env.SEO_AUDIT_TIMEOUT_MS || 15000),
    out: process.env.SEO_AUDIT_OUT || "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--base" && next) args.base = next;
    if (arg === "--sitemap" && next) args.sitemap = path.resolve(ROOT, next);
    if (arg === "--limit" && next) args.limit = Number(next);
    if (arg === "--concurrency" && next) args.concurrency = Number(next);
    if (arg === "--timeout-ms" && next) args.timeoutMs = Number(next);
    if (arg === "--out" && next) args.out = path.resolve(ROOT, next);
  }

  args.base = args.base.replace(/\/$/, "");
  args.concurrency = Math.max(1, args.concurrency || 1);
  return args;
}

async function readSitemapUrls(sitemapPath) {
  const xml = await fs.readFile(sitemapPath, "utf-8");
  const $ = load(xml, { xmlMode: true });
  return $("url loc")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
}

function localizeUrl(publicUrl, baseUrl) {
  const publicParsed = new URL(publicUrl);
  return `${baseUrl}${publicParsed.pathname}${publicParsed.search}`;
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = performance.now();
  try {
    const response = await fetch(url, {
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "user-agent": "SolarFreedomSEOAgent/1.0 (+local-audit)",
      },
    });
    const text = await response.text();
    return {
      ok: true,
      status: response.status,
      location: response.headers.get("location"),
      html: text,
      elapsedMs: Math.round(performance.now() - started),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : String(error),
      html: "",
      elapsedMs: Math.round(performance.now() - started),
    };
  } finally {
    clearTimeout(timer);
  }
}

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function classifyUrl(pathname) {
  if (pathname === "/") return "home";
  if (pathname === "/blog") return "blog_index";
  if (pathname.startsWith("/blog/")) return "blog_post";
  if (pathname.startsWith("/cancel-solar-contract/")) return "city_page";
  if (pathname.startsWith("/solar-contract-laws/")) return "state_law";
  if (pathname.startsWith("/cancel-") && pathname.endsWith("-solar-contract")) return "company_page";
  return "static";
}

function addIssue(issues, code, message, evidence = {}) {
  issues.push({
    code,
    impact: ISSUE_WEIGHTS[code] || 10,
    message,
    evidence,
  });
}

function analyzeHtml({ publicUrl, localUrl, fetchResult }) {
  const parsed = new URL(publicUrl);
  const issues = [];

  if (!fetchResult.ok || fetchResult.status >= 400 || fetchResult.status === 0) {
    addIssue(issues, "status_error", `Page did not return a crawlable success response`, {
      status: fetchResult.status,
      error: fetchResult.error,
    });
    return buildPageResult({ publicUrl, localUrl, parsed, fetchResult, issues });
  }

  if (fetchResult.status >= 300) {
    addIssue(issues, "status_error", `Sitemap URL redirects instead of serving a final page`, {
      status: fetchResult.status,
      location: fetchResult.location,
    });
  }

  const $ = load(fetchResult.html);
  const title = normalizeText($("head > title").first().text());
  const description = normalizeText($('meta[name="description"]').attr("content") || "");
  const canonical = normalizeText($('link[rel="canonical"]').attr("href") || "");
  const robots = normalizeText($('meta[name="robots"]').attr("content") || "");
  const h1s = $("h1").map((_, el) => normalizeText($(el).text())).get().filter(Boolean);
  const jsonLdScripts = $('script[type="application/ld+json"]').map((_, el) => $(el).text()).get();
  const internalLinks = new Set(
    $("a[href]")
      .map((_, el) => $(el).attr("href") || "")
      .get()
      .filter((href) => href.startsWith("/") && !href.startsWith("//"))
      .map((href) => href.split("#")[0])
      .filter(Boolean)
  );
  const images = $("img").length;
  const imagesWithAlt = $("img[alt]").filter((_, el) => normalizeText($(el).attr("alt") || "").length > 0).length;
  const bodyText = normalizeText($("body").text());
  const wordCount = bodyText ? bodyText.split(/\s+/).length : 0;

  const schemaTypes = [];
  let invalidJsonLd = 0;
  for (const scriptText of jsonLdScripts) {
    try {
      const parsedJson = JSON.parse(scriptText);
      const blocks = Array.isArray(parsedJson) ? parsedJson : [parsedJson];
      for (const block of blocks) {
        if (block && typeof block === "object" && block["@type"]) schemaTypes.push(block["@type"]);
      }
    } catch {
      invalidJsonLd += 1;
    }
  }

  if (robots.toLowerCase().includes("noindex")) addIssue(issues, "noindex", "Page has a noindex directive", { robots });
  if (!title) addIssue(issues, "missing_title", "Missing title tag");
  if (title && title.length < 30) addIssue(issues, "short_title", "Title is likely too short", { length: title.length, title });
  if (title && title.length > 65) addIssue(issues, "long_title", "Title may truncate in search results", { length: title.length, title });
  if (!description) addIssue(issues, "missing_description", "Missing meta description");
  if (description && description.length < 110) addIssue(issues, "short_description", "Meta description is likely too short", { length: description.length });
  if (description && description.length > 165) addIssue(issues, "long_description", "Meta description may truncate in search results", { length: description.length });
  if (!canonical) addIssue(issues, "missing_canonical", "Missing canonical URL");
  if (canonical) {
    const canonicalUrl = new URL(canonical, publicUrl);
    if (canonicalUrl.origin !== parsed.origin) {
      addIssue(issues, "canonical_origin_mismatch", "Canonical origin does not match sitemap URL origin", {
        canonical,
        expectedOrigin: parsed.origin,
      });
    }
    if (canonicalUrl.pathname.replace(/\/$/, "") !== parsed.pathname.replace(/\/$/, "")) {
      addIssue(issues, "canonical_mismatch", "Canonical path does not match sitemap URL path", { canonical });
    }
  }
  if (h1s.length === 0) addIssue(issues, "missing_h1", "Missing H1");
  if (h1s.length > 1) addIssue(issues, "multiple_h1", "Multiple H1 elements found", { h1s });
  if (jsonLdScripts.length === 0) addIssue(issues, "missing_json_ld", "Missing JSON-LD structured data");
  if (invalidJsonLd > 0) addIssue(issues, "invalid_json_ld", "Invalid JSON-LD block found", { invalidJsonLd });
  if (wordCount < 350) addIssue(issues, "thin_content", "Page body appears thin for an SEO landing page", { wordCount });
  if (internalLinks.size < 5) addIssue(issues, "low_internal_links", "Low internal link count", { internalLinks: internalLinks.size });
  if (images > 0 && imagesWithAlt / images < 0.8) {
    addIssue(issues, "low_image_alt_coverage", "Less than 80% of images have useful alt text", { images, imagesWithAlt });
  }

  return buildPageResult({
    publicUrl,
    localUrl,
    parsed,
    fetchResult,
    issues,
    metrics: {
      title,
      description,
      canonical,
      h1s,
      schemaTypes: [...new Set(schemaTypes)].flat(),
      wordCount,
      internalLinks: internalLinks.size,
      images,
      imagesWithAlt,
    },
  });
}

function buildPageResult({ publicUrl, localUrl, parsed, fetchResult, issues, metrics = {} }) {
  const issueImpact = issues.reduce((sum, issue) => sum + issue.impact, 0);
  const score = Math.max(0, Math.min(100, 100 - Math.round(issueImpact / 8)));
  return {
    url: publicUrl,
    localUrl,
    path: parsed.pathname,
    type: classifyUrl(parsed.pathname),
    status: fetchResult.status,
    elapsedMs: fetchResult.elapsedMs,
    score,
    issueCount: issues.length,
    issues,
    metrics,
  };
}

async function mapConcurrent(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

function addDuplicateIssues(pages, field, code, label) {
  const groups = new Map();
  for (const page of pages) {
    const value = normalizeText(page.metrics?.[field] || "");
    if (!value) continue;
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(page);
  }

  for (const [value, group] of groups.entries()) {
    if (group.length < 2) continue;
    for (const page of group) {
      addIssue(page.issues, code, `${label} is duplicated across ${group.length} pages`, {
        value,
        examples: group.slice(0, 5).map((item) => item.path),
      });
      page.issueCount = page.issues.length;
      const issueImpact = page.issues.reduce((sum, issue) => sum + issue.impact, 0);
      page.score = Math.max(0, Math.min(100, 100 - Math.round(issueImpact / 8)));
    }
  }
}

function summarize(pages, args) {
  const issueCounts = new Map();
  for (const page of pages) {
    for (const issue of page.issues) {
      issueCounts.set(issue.code, (issueCounts.get(issue.code) || 0) + 1);
    }
  }

  const topIssues = [...issueCounts.entries()]
    .map(([code, count]) => ({ code, count, impact: ISSUE_WEIGHTS[code] || 10 }))
    .sort((a, b) => b.count * b.impact - a.count * a.impact)
    .slice(0, 12);

  const priorityPages = [...pages]
    .filter((page) => page.issues.length > 0)
    .sort((a, b) => {
      const aImpact = a.issues.reduce((sum, issue) => sum + issue.impact, 0);
      const bImpact = b.issues.reduce((sum, issue) => sum + issue.impact, 0);
      return bImpact - aImpact;
    })
    .slice(0, 15);

  const avgScore = pages.length
    ? Math.round(pages.reduce((sum, page) => sum + page.score, 0) / pages.length)
    : 0;

  const byType = pages.reduce((acc, page) => {
    if (!acc[page.type]) acc[page.type] = { count: 0, avgScore: 0, issueCount: 0 };
    acc[page.type].count += 1;
    acc[page.type].avgScore += page.score;
    acc[page.type].issueCount += page.issues.length;
    return acc;
  }, {});

  for (const type of Object.keys(byType)) {
    byType[type].avgScore = Math.round(byType[type].avgScore / byType[type].count);
  }

  return {
    generatedAt: new Date().toISOString(),
    baseUrl: args.base,
    sitemap: path.relative(ROOT, args.sitemap),
    pageCount: pages.length,
    avgScore,
    pagesWithIssues: pages.filter((page) => page.issues.length > 0).length,
    topIssues,
    byType,
    priorityPages,
  };
}

function printReport(summary) {
  console.log("\nSEO Agent Audit");
  console.log("===============");
  console.log(`Base URL: ${summary.baseUrl}`);
  console.log(`Pages audited: ${summary.pageCount}`);
  console.log(`Average score: ${summary.avgScore}/100`);
  console.log(`Pages with issues: ${summary.pagesWithIssues}`);

  console.log("\nTop issue patterns:");
  if (summary.topIssues.length === 0) {
    console.log("  No issues found.");
  } else {
    for (const issue of summary.topIssues) {
      console.log(`  - ${issue.code}: ${issue.count} page(s)`);
    }
  }

  console.log("\nPriority pages:");
  if (summary.priorityPages.length === 0) {
    console.log("  No priority pages.");
  } else {
    for (const page of summary.priorityPages.slice(0, 10)) {
      const issueList = page.issues.slice(0, 3).map((issue) => issue.code).join(", ");
      console.log(`  - ${page.score}/100 ${page.path} (${issueList})`);
    }
  }

  console.log("\nPage groups:");
  for (const [type, group] of Object.entries(summary.byType)) {
    console.log(`  - ${type}: ${group.count} page(s), avg ${group.avgScore}/100, ${group.issueCount} issue(s)`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sitemapUrls = await readSitemapUrls(args.sitemap);
  const urls = args.limit > 0 ? sitemapUrls.slice(0, args.limit) : sitemapUrls;

  console.log(`Auditing ${urls.length} sitemap URL(s) from ${args.sitemap}`);

  const pages = await mapConcurrent(urls, args.concurrency, async (publicUrl) => {
    const localUrl = localizeUrl(publicUrl, args.base);
    const fetchResult = await fetchWithTimeout(localUrl, args.timeoutMs);
    return analyzeHtml({ publicUrl, localUrl, fetchResult });
  });

  addDuplicateIssues(pages, "title", "duplicate_title", "Title");
  addDuplicateIssues(pages, "description", "duplicate_description", "Meta description");

  const summary = summarize(pages, args);
  const report = { ...summary, pages };
  printReport(summary);

  if (args.out) {
    await fs.mkdir(path.dirname(args.out), { recursive: true });
    await fs.writeFile(args.out, `${JSON.stringify(report, null, 2)}\n`, "utf-8");
    console.log(`\nWrote full report: ${path.relative(ROOT, args.out)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
