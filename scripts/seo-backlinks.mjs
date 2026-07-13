/**
 * SEO Backlink Tracker / Verifier
 *
 * Verifies review-approved external link evidence without assuming placement,
 * authority, endorsement, or search impact.
 *
 * It reads the review-only `references/backlinks.json` registry and
 * (optionally) fetches each approved public source URL to observe:
 *   1. the page is reachable,
 *   2. it links to the canonical domain (breakyoursolarcontract.com),
 *   3. it links to the intended, currently approved `target` path.
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
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEFAULT_DOMAIN = "breakyoursolarcontract.com";
const DEFAULT_REGISTRY = path.resolve(ROOT, "references/backlinks.json");
const DEFAULT_SITEMAP = path.resolve(ROOT, "client/public/sitemap.xml");
const DEFAULT_OUT_JSON = path.resolve(ROOT, "reports/seo-agent/latest-backlinks.json");
const DEFAULT_OUT_MD = path.resolve(ROOT, "reports/seo-agent/BACKLINKS.md");

function parseArgs(argv) {
  const args = {
    domain: (process.env.SEO_BACKLINKS_DOMAIN || DEFAULT_DOMAIN).replace(/^https?:\/\//, "").replace(/\/$/, ""),
    registry: process.env.SEO_BACKLINKS_REGISTRY || DEFAULT_REGISTRY,
    sitemap: process.env.SEO_BACKLINKS_SITEMAP || DEFAULT_SITEMAP,
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
    if (arg === "--sitemap" && next) args.sitemap = path.resolve(ROOT, next);
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

function normalizeTarget(target, domain) {
  if (typeof target !== "string" || !target.trim()) return null;
  try {
    const base = `https://${domain}`;
    const url = new URL(target, base);
    if (url.origin !== base || url.username || url.password || url.search || url.hash) return null;
    return url.pathname.replace(/\/{2,}/g, "/").replace(/\/+$/, "") || "/";
  } catch {
    return null;
  }
}

async function loadApprovedTargets(filePath, domain) {
  let source = "";
  try {
    source = await fs.readFile(filePath, "utf-8");
  } catch {
    return new Set();
  }
  const targets = new Set();
  for (const match of source.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    try {
      const url = new URL(match[1].trim());
      if (url.protocol !== "https:" || url.hostname !== domain) continue;
      targets.add(url.pathname.replace(/\/{2,}/g, "/").replace(/\/+$/, "") || "/");
    } catch {
      // Ignore malformed sitemap rows; an empty/partial set fails the registry closed.
    }
  }
  return targets;
}

function isPublicIpv4(address) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b, c] = parts;
  if (
    a === 0 || a === 10 || a === 127 || a >= 224
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 0 && c === 0)
    || (a === 192 && b === 0 && c === 2)
    || (a === 192 && b === 168)
    || (a === 198 && (b === 18 || b === 19))
    || (a === 198 && b === 51 && c === 100)
    || (a === 203 && b === 0 && c === 113)
  ) return false;
  return true;
}

function isPublicIp(address) {
  const version = isIP(address);
  if (version === 4) return isPublicIpv4(address);
  if (version !== 6) return false;
  const normalized = address.toLowerCase().split("%")[0];
  if (normalized.startsWith("::ffff:")) {
    return isPublicIpv4(normalized.slice("::ffff:".length));
  }
  return !(
    normalized === "::" || normalized === "::1"
    || normalized.startsWith("fc") || normalized.startsWith("fd")
    || /^fe[89ab]/.test(normalized)
    || normalized.startsWith("ff")
    || normalized.startsWith("2001:db8:")
  );
}

async function assertPublicExternalHttpsUrl(value, targetDomain) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" || !url.hostname || url.username || url.password
    || url.port && url.port !== "443"
    || url.hostname === targetDomain || url.hostname.endsWith(`.${targetDomain}`)
    || url.hostname === "localhost" || url.hostname.endsWith(".localhost")
    || url.hostname.endsWith(".local") || url.hostname.endsWith(".internal")
  ) throw new Error("unsafe_source_url");
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(result => !isPublicIp(result.address))) {
    throw new Error("unsafe_source_address");
  }
  return url;
}

async function readLimitedHtml(response, maxBytes = 2_000_000) {
  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > maxBytes) throw new Error("source_too_large");
  const type = response.headers.get("content-type") || "";
  if (!/text\/html|application\/xhtml\+xml/i.test(type)) {
    throw new Error("source_not_html");
  }
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error("source_too_large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
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

async function fetchHtml(url, timeout, targetDomain) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    let current = url;
    for (let redirects = 0; redirects <= 5; redirects += 1) {
      const checked = await assertPublicExternalHttpsUrl(current, targetDomain);
      const response = await fetch(checked, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; SolarFreedomLinkEvidenceBot/1.0; +https://breakyoursolarcontract.com)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || redirects === 5) throw new Error("unsafe_redirect");
        current = new URL(location, checked).href;
        continue;
      }
      const html = await readLimitedHtml(response);
      return { ok: response.ok, status: response.status, html };
    }
    throw new Error("too_many_redirects");
  } catch {
    return { ok: false, status: 0, html: "", errorCode: "source_fetch_failed" };
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

async function evaluate(entry, args, approvedTargets) {
  const url = entry.url;
  const target = normalizeTarget(entry.target, args.domain);
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
  if (!approvedTargets.has(target)) {
    return { ...base, status: "invalid", ok: false, detail: "Target is not present in the approved public sitemap." };
  }

  if (!args.fetch) {
    return { ...base, status: "pending", ok: false, detail: "Registered; not verified (--no-fetch)." };
  }

  const fetched = await fetchHtml(url, args.timeout, args.domain);
  if (!fetched.ok) {
    return {
      ...base,
      status: "unreachable",
      ok: false,
      httpStatus: fetched.status,
      detail: fetched.status ? `HTTP ${fetched.status}.` : "Source fetch failed or was blocked by network policy.",
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
    "This report records whether each approved public source currently contains " +
      "the intended link. It does not measure authority, endorsement, referral " +
      "quality, indexing, or ranking impact."
  );
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  const s = report.summary;
  lines.push(`- Registered backlinks: ${s.total}`);
  lines.push(`- Observed linking to intended target: ${s.verified}`);
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
    lines.push("- None registered. Add an editorially approved public source only after publication.");
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
  const approvedTargets = await loadApprovedTargets(args.sitemap, args.domain);

  if (!approvedTargets.size) {
    console.error("Approved sitemap is missing or empty; backlink verification is blocked.");
    process.exitCode = 1;
    return;
  }

  const results = [];
  for (const entry of entries) {
    // Sequential to stay polite to the third-party hosts (e.g. Medium).
    results.push(await evaluate(entry, args, approvedTargets));
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
