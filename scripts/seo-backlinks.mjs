/**
 * SEO Backlink Tracker / Verifier
 *
 * The May 2026 audit flagged the off-site backlink effort (34 Medium articles
 * plus other placements) as the one growth lever with no measurement: links are
 * assumed to exist and point at the right pages, but nothing checks. This agent
 * closes that gap.
 *
 * It reads `references/backlinks.json` — the single source of truth for every
 * backlink we have placed — and (optionally) fetches each source URL to verify:
 *   1. the page is reachable,
 *   2. it links to the canonical domain (breakyoursolarcontract.com),
 *   3. it links to the specific `target` path we intended (deep links pass more
 *      relevant authority than a bare homepage link).
 *
 * It emits a deterministic status report. It never edits source files, never
 * publishes, and never places links — a human still does the outreach.
 *
 * Output:
 *   reports/seo-agent/latest-backlinks.json
 *   reports/seo-agent/BACKLINKS.md
 *
 * Run:
 *   node scripts/seo-backlinks.mjs            # fetch + verify
 *   node scripts/seo-backlinks.mjs --no-fetch # validate the registry offline
 *   node scripts/seo-backlinks.mjs --timeout 15000
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEFAULT_DOMAIN = "breakyoursolarcontract.com";
const DEFAULT_REGISTRY = path.resolve(ROOT, "references/backlinks.json");
const DEFAULT_OUT_JSON = path.resolve(ROOT, "reports/seo-agent/latest-backlinks.json");
const DEFAULT_OUT_MD = path.resolve(ROOT, "reports/seo-agent/BACKLINKS.md");

function parseArgs(argv) {
  const args = {
    domain: (process.env.SEO_BACKLINKS_DOMAIN || DEFAULT_DOMAIN).replace(/^https?:\/\//, "").replace(/\/$/, ""),
    registry: process.env.SEO_BACKLINKS_REGISTRY || DEFAULT_REGISTRY,
    outJson: process.env.SEO_BACKLINKS_OUT_JSON || DEFAULT_OUT_JSON,
    outMd: process.env.SEO_BACKLINKS_OUT_MD || DEFAULT_OUT_MD,
    fetch: process.env.SEO_BACKLINKS_NO_FETCH ? false : true,
    timeout: Number(process.env.SEO_BACKLINKS_TIMEOUT || 15000),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--domain" && next) args.domain = next.replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (arg === "--registry" && next) args.registry = path.resolve(ROOT, next);
    if (arg === "--out-json" && next) args.outJson = path.resolve(ROOT, next);
    if (arg === "--out-md" && next) args.outMd = path.resolve(ROOT, next);
    if (arg === "--no-fetch") args.fetch = false;
    if (arg === "--fetch") args.fetch = true;
    if (arg === "--timeout" && next) args.timeout = Number(next);
  }

  return args;
}

async function readJson(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function normalizeTarget(target) {
  if (!target) return null;
  try {
    // Accept either a bare path or a full URL.
    const p = target.startsWith("http") ? new URL(target).pathname : target;
    return p.replace(/\/+$/, "") || "/";
  } catch {
    return target;
  }
}

// Does the fetched HTML link to our domain, and to the specific target path?
function inspectHtml(html, domain, target) {
  const result = { linksDomain: false, linksTarget: false };
  if (!html) return result;
  // Collect every href that points at our domain.
  const hrefs = [...html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
  const domainEscaped = domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const domainRe = new RegExp(`https?://(?:www\\.)?${domainEscaped}`, "i");
  for (const href of hrefs) {
    if (!domainRe.test(href)) continue;
    result.linksDomain = true;
    if (!target) continue;
    try {
      const p = new URL(href).pathname.replace(/\/+$/, "") || "/";
      if (p === target) result.linksTarget = true;
    } catch {
      /* ignore malformed href */
    }
  }
  return result;
}

async function fetchHtml(url, timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SolarFreedomBacklinkBot/1.0; +https://breakyoursolarcontract.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    const html = await response.text();
    return { ok: response.ok, status: response.status, html };
  } catch (error) {
    return { ok: false, status: 0, html: "", error: String(error?.message || error) };
  } finally {
    clearTimeout(timer);
  }
}

function classifyTargetType(target) {
  if (!target || target === "/") return "homepage";
  if (target.startsWith("/blog/")) return "blog";
  if (target.startsWith("/cancel-solar-contract/")) return "city";
  if (target.startsWith("/solar-contract-laws/")) return "state";
  return "other";
}

async function evaluate(entry, args) {
  const url = entry.url;
  const target = normalizeTarget(entry.target);
  const base = {
    source: entry.source || "unknown",
    url: url || null,
    target,
    targetType: classifyTargetType(target),
    anchorHint: entry.anchorHint || null,
    notes: entry.notes || null,
  };

  if ((entry.status || "").toLowerCase() === "example" || !url || /example/i.test(url)) {
    return { ...base, status: "example", ok: false, detail: "Placeholder entry — fill in a real URL." };
  }

  if (!target) {
    return { ...base, status: "invalid", ok: false, detail: "Missing `target` path." };
  }

  if (!args.fetch) {
    return { ...base, status: "pending", ok: false, detail: "Registered; not verified (--no-fetch)." };
  }

  const fetched = await fetchHtml(url, args.timeout);
  if (!fetched.ok) {
    return {
      ...base,
      status: "unreachable",
      ok: false,
      httpStatus: fetched.status,
      detail: fetched.error ? `Fetch failed: ${fetched.error}` : `HTTP ${fetched.status}.`,
    };
  }

  const { linksDomain, linksTarget } = inspectHtml(fetched.html, args.domain, target);
  if (linksTarget) {
    return { ...base, status: "verified", ok: true, httpStatus: fetched.status, detail: "Links to the intended target." };
  }
  if (linksDomain) {
    return {
      ...base,
      status: "domain-only",
      ok: false,
      httpStatus: fetched.status,
      detail: "Links to the domain but not to the intended target path — update the deep link.",
    };
  }
  return {
    ...base,
    status: "missing",
    ok: false,
    httpStatus: fetched.status,
    detail: "No link to breakyoursolarcontract.com found on the page.",
  };
}

function summarize(results) {
  const counts = {};
  for (const r of results) counts[r.status] = (counts[r.status] || 0) + 1;
  return {
    total: results.length,
    verified: counts.verified || 0,
    domainOnly: counts["domain-only"] || 0,
    missing: counts.missing || 0,
    unreachable: counts.unreachable || 0,
    pending: counts.pending || 0,
    invalid: counts.invalid || 0,
    example: counts.example || 0,
  };
}

const STATUS_LABEL = {
  verified: "✅ verified",
  "domain-only": "🟡 domain-only",
  missing: "🔴 missing",
  unreachable: "🔴 unreachable",
  pending: "⏳ pending",
  invalid: "⚠️ invalid",
  example: "➖ example",
};

function formatMarkdown(report) {
  const lines = [];
  lines.push("# Backlink Tracker");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Domain: ${report.domain} | Fetch: ${report.fetched ? "yes" : "no (registry-only)"}`);
  lines.push("");
  lines.push(
    "Backlinks are only worth what they actually point at. This report verifies " +
      "each placement in `references/backlinks.json` still links to the intended " +
      "deep page. Fix `domain-only` rows by deep-linking, and re-place `missing` ones."
  );
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  const s = report.summary;
  lines.push(`- Registered backlinks: ${s.total}`);
  lines.push(`- ✅ Verified (links to intended target): ${s.verified}`);
  lines.push(`- 🟡 Domain-only (links home/other page, not target): ${s.domainOnly}`);
  lines.push(`- 🔴 Missing (no link to our domain): ${s.missing}`);
  lines.push(`- 🔴 Unreachable: ${s.unreachable}`);
  lines.push(`- ⏳ Pending (not fetched): ${s.pending}`);
  lines.push(`- ⚠️ Invalid registry rows: ${s.invalid}`);
  lines.push(`- ➖ Example placeholders: ${s.example}`);
  lines.push("");
  lines.push("## Backlinks");
  lines.push("");
  if (!report.results.length) {
    lines.push("- None registered. Add your placed backlinks to `references/backlinks.json`.");
  }
  report.results.forEach((r, index) => {
    lines.push(`${index + 1}. ${STATUS_LABEL[r.status] || r.status} — ${r.source}`);
    lines.push(`   - URL: ${r.url || "(none)"}`);
    lines.push(`   - Target: \`${r.target || "(none)"}\` (${r.targetType})`);
    lines.push(`   - ${r.detail}`);
  });
  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const registry = await readJson(args.registry);
  const entries = Array.isArray(registry?.backlinks) ? registry.backlinks : [];

  const results = [];
  for (const entry of entries) {
    // Sequential to stay polite to the third-party hosts (e.g. Medium).
    results.push(await evaluate(entry, args));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    domain: args.domain,
    registry: path.relative(ROOT, args.registry),
    fetched: args.fetch,
    summary: summarize(results),
    results,
  };

  await fs.mkdir(path.dirname(args.outJson), { recursive: true });
  await fs.writeFile(args.outJson, `${JSON.stringify(report, null, 2)}\n`, "utf-8");
  await fs.writeFile(args.outMd, formatMarkdown(report), "utf-8");

  console.log("\nSEO Backlink Tracker");
  console.log("====================");
  console.log(`Registered: ${report.summary.total} | Verified: ${report.summary.verified} | Domain-only: ${report.summary.domainOnly} | Missing: ${report.summary.missing}`);
  console.log(`Report: ${path.relative(ROOT, args.outMd)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
