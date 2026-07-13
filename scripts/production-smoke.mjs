/**
 * Read-only production cutover smoke test.
 *
 * This script sends GET requests without cookies, credentials, or mutations. It
 * reports secret-pattern codes and asset paths only; matched values are never
 * printed. A non-zero exit means production is not ready to approve.
 */
import * as cheerio from "cheerio";
import { pathToFileURL } from "node:url";

const DEFAULT_BASE_URL = "https://breakyoursolarcontract.com";
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_ASSETS = 120;

const SECRET_MARKERS = [
  ["embedded_admin_api_key", /\bsf_[a-f0-9]{32,}\b/i],
  ["embedded_crm_webhook", /https:\/\/services\.leadconnectorhq\.com\/hooks\/[a-z0-9/_-]{20,}/i],
  ["embedded_private_key", /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/i],
  ["embedded_service_account_key", /["']private_key["']\s*:\s*["']-----BEGIN PRIVATE KEY-----/i],
];

function parseArgs(argv) {
  const args = {
    baseUrl: process.env.PRODUCTION_SMOKE_BASE_URL || DEFAULT_BASE_URL,
    timeoutMs: Number(process.env.PRODUCTION_SMOKE_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
    skipAssets: false,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const next = argv[index + 1];
    if (argument === "--base" && next) args.baseUrl = next;
    if (argument === "--timeout-ms" && next) args.timeoutMs = Number(next);
    if (argument === "--skip-assets") args.skipAssets = true;
    if (argument === "--json") args.json = true;
  }

  const base = new URL(args.baseUrl);
  if (!/^https?:$/.test(base.protocol)) throw new Error("Smoke-test base must use HTTP(S).");
  base.pathname = base.pathname.replace(/\/+$/, "");
  base.search = "";
  base.hash = "";
  args.baseUrl = base.toString().replace(/\/$/, "");
  args.timeoutMs = Math.max(1_000, Math.floor(args.timeoutMs || DEFAULT_TIMEOUT_MS));
  return args;
}

export function findSecretMarkerCodes(source) {
  return SECRET_MARKERS.filter(([, expression]) => expression.test(source)).map(([code]) => code);
}

export function extractJsAssetPaths(source) {
  const paths = new Set();
  const expression = /(?:https?:\/\/[^\s"'`]+)?\/?assets\/[a-zA-Z0-9_.-]+\.js/g;
  for (const match of source.matchAll(expression)) {
    try {
      const parsed = new URL(match[0], DEFAULT_BASE_URL);
      paths.add(parsed.pathname);
    } catch {
      // Ignore malformed build strings; actual entry assets are checked below.
    }
  }
  return [...paths];
}

function htmlFacts(html) {
  const $ = cheerio.load(html);
  return {
    canonical: $('link[rel="canonical"]').first().attr("href") || null,
    robots: $('meta[name="robots"]').first().attr("content") || null,
    h1: $("h1").first().text().replace(/\s+/g, " ").trim(),
    words: $("body").text().replace(/\s+/g, " ").trim().split(/\s+/).filter(Boolean).length,
    assets: extractJsAssetPaths(html),
  };
}

async function fetchText(baseUrl, pathname, timeoutMs) {
  const url = new URL(pathname, `${baseUrl}/`);
  if (url.origin !== new URL(baseUrl).origin) throw new Error("Smoke request escaped the configured origin.");
  const response = await fetch(url, {
    method: "GET",
    redirect: "manual",
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      Accept: "text/html,application/xml,text/plain;q=0.9,*/*;q=0.1",
      "User-Agent": "SolarFreedom-Production-Smoke/1.0 (read-only)",
    },
  });
  return {
    url: url.toString(),
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: await response.text(),
  };
}

function check(checks, name, passed, detail) {
  checks.push({ name, passed: Boolean(passed), detail });
}

async function scanAssets(baseUrl, entrySources, timeoutMs) {
  const discovered = new Set(entrySources.flatMap(extractJsAssetPaths));
  const scanned = new Set();
  const findings = [];
  const errors = [];

  while (scanned.size < discovered.size && scanned.size < MAX_ASSETS) {
    const batch = [...discovered].filter(path => !scanned.has(path)).slice(0, 10);
    if (!batch.length) break;
    const results = await Promise.all(batch.map(async assetPath => {
      scanned.add(assetPath);
      try {
        return { assetPath, response: await fetchText(baseUrl, assetPath, timeoutMs) };
      } catch (error) {
        return { assetPath, error };
      }
    }));

    for (const result of results) {
      if (result.error) {
        errors.push({ asset: result.assetPath, reason: result.error.name || "fetch_failed" });
        continue;
      }
      if (result.response.status !== 200) {
        errors.push({ asset: result.assetPath, reason: `http_${result.response.status}` });
        continue;
      }
      for (const code of findSecretMarkerCodes(result.response.body)) {
        findings.push({ asset: result.assetPath, code });
      }
      for (const nested of extractJsAssetPaths(result.response.body)) discovered.add(nested);
    }
  }

  if (discovered.size > MAX_ASSETS) {
    errors.push({ asset: "asset_graph", reason: `limit_exceeded_${MAX_ASSETS}` });
  }
  return { scanned: scanned.size, discovered: discovered.size, findings, errors };
}

async function run(args) {
  const checks = [];
  const responses = {};
  const get = async (name, pathname) => {
    try {
      const response = await fetchText(args.baseUrl, pathname, args.timeoutMs);
      responses[name] = response;
      return response;
    } catch (error) {
      check(checks, name, false, `request_failed:${error.name || "error"}`);
      return null;
    }
  };

  const home = await get("home_request", "/");
  if (home) {
    const facts = htmlFacts(home.body);
    check(checks, "home_http_200", home.status === 200, `HTTP ${home.status}`);
    check(checks, "home_canonical", facts.canonical === `${args.baseUrl}/`, facts.canonical || "missing");
    check(checks, "home_indexable", !/noindex/i.test(facts.robots || ""), facts.robots || "robots meta absent");
    check(checks, "home_source_content", facts.words >= 100, `${facts.words} source-visible words`);
  }

  const knownRoutes = [
    ["known_blog", "/blog/how-to-get-out-of-a-solar-contract"],
    ["restored_blog", "/blog/solar-panel-scam-signs-what-to-do"],
    ["known_city", "/cancel-solar-contract/dallas-tx"],
  ];
  for (const [name, pathname] of knownRoutes) {
    const response = await get(`${name}_request`, pathname);
    if (!response) continue;
    const facts = htmlFacts(response.body);
    check(checks, `${name}_http_200`, response.status === 200, `HTTP ${response.status}`);
    check(checks, `${name}_canonical`, facts.canonical === `${args.baseUrl}${pathname}`, facts.canonical || "missing");
    check(checks, `${name}_h1`, Boolean(facts.h1), facts.h1 ? "present" : "missing");
    check(checks, `${name}_source_content`, facts.words >= 100, `${facts.words} source-visible words`);
  }

  const notFoundPath = `/__production_smoke_not_found__-${Date.now().toString(36)}`;
  const notFound = await get("not_found_request", notFoundPath);
  if (notFound) {
    const facts = htmlFacts(notFound.body);
    const xRobots = notFound.headers["x-robots-tag"] || "";
    check(checks, "unknown_route_http_404", notFound.status === 404, `HTTP ${notFound.status}`);
    check(checks, "unknown_route_noindex", /noindex/i.test(`${xRobots} ${facts.robots || ""}`), xRobots || facts.robots || "missing");
    check(checks, "unknown_route_no_canonical", !facts.canonical, facts.canonical || "absent");
  }

  const admin = await get("admin_request", "/admin/content");
  if (admin) {
    const facts = htmlFacts(admin.body);
    const xRobots = admin.headers["x-robots-tag"] || "";
    check(checks, "admin_http_200", admin.status === 200, `HTTP ${admin.status}`);
    check(checks, "admin_noindex", /noindex/i.test(`${xRobots} ${facts.robots || ""}`), xRobots || facts.robots || "missing");
    check(checks, "admin_no_canonical", !facts.canonical, facts.canonical || "absent");
  }

  const adminApi = await get("admin_api_request", "/api/admin/status");
  if (adminApi) {
    check(checks, "admin_api_requires_auth", adminApi.status === 401, `HTTP ${adminApi.status}`);
  }

  const robots = await get("robots_request", "/robots.txt");
  if (robots) {
    check(checks, "robots_http_200", robots.status === 200, `HTTP ${robots.status}`);
    check(checks, "robots_sitemap", new RegExp(`Sitemap:\\s*${args.baseUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\/sitemap\\.xml`, "i").test(robots.body), "canonical sitemap directive");
  }

  const sitemap = await get("sitemap_request", "/sitemap.xml");
  if (sitemap) {
    const urlCount = (sitemap.body.match(/<url>/g) || []).length;
    check(checks, "sitemap_http_200", sitemap.status === 200, `HTTP ${sitemap.status}`);
    check(checks, "sitemap_inventory", urlCount >= 500, `${urlCount} URLs`);
    check(checks, "sitemap_restored_blog", sitemap.body.includes(`${args.baseUrl}/blog/solar-panel-scam-signs-what-to-do`), "restored blog URL present");
  }

  let assets = null;
  if (!args.skipAssets && home && admin) {
    assets = await scanAssets(args.baseUrl, [home.body, admin.body], args.timeoutMs);
    const markerSummary = assets.findings.map(finding => `${finding.code}@${finding.asset}`).join(", ");
    check(checks, "asset_graph_complete", assets.errors.length === 0, assets.errors.length ? `${assets.errors.length} asset error(s)` : `${assets.scanned} assets scanned`);
    check(checks, "public_bundles_secret_free", assets.findings.length === 0, markerSummary || `${assets.scanned} assets scanned; no credential patterns`);
  }

  const failed = checks.filter(item => !item.passed);
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    baseUrl: args.baseUrl,
    readOnly: true,
    passed: failed.length === 0,
    summary: { passed: checks.length - failed.length, failed: failed.length, total: checks.length },
    checks,
    assets: assets ? { scanned: assets.scanned, discovered: assets.discovered, findings: assets.findings, errors: assets.errors } : null,
  };
}

function printReport(report, json) {
  if (json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  console.log(`Production smoke: ${report.passed ? "PASS" : "FAIL"}`);
  console.log(`Base: ${report.baseUrl}`);
  console.log(`Checks: ${report.summary.passed}/${report.summary.total} passed`);
  for (const item of report.checks) {
    console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name} - ${item.detail}`);
  }
  console.log("No mutations, credentials, or authenticated requests were used.");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const report = await run(args);
  printReport(report, args.json);
  if (!report.passed) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(`Production smoke failed safely: ${error.message}`);
    process.exitCode = 1;
  });
}

export { parseArgs, run };
