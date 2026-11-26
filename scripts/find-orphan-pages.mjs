#!/usr/bin/env node
/**
 * Finds pages that earn impressions but receive no inbound internal links.
 *
 * WHY: the ADT page turned out to hold 1,828 impressions and 4 clicks while
 * being a complete internal orphan — nothing on the site linked to it, so no
 * link equity reached it. That is a systemic risk, not a one-off: a page can
 * have a perfect title and still be stuck at position 12 because it is
 * unreachable. This checks every page that appears in the near-winners report
 * against the built output to find the rest.
 *
 * Reads the built HTML in dist/public and counts inbound links from every
 * other page. Excludes navigation/sitemap boilerplate so a link in a global
 * menu does not count as a contextual link.
 */
import fs from "node:fs";
import path from "node:path";

const DIST = "dist/public";
const NEAR_WINNERS = "/home/ubuntu/solar-freedom-deliverables/seo-2026-11-24/near-winners.json";

// ---------- 1. Collect every built HTML page and its internal links ----------
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.name === "index.html") out.push(p);
  }
  return out;
}

const files = walk(DIST);
const pages = new Map(); // urlPath -> { file, html }
for (const file of files) {
  const rel = path.relative(DIST, path.dirname(file));
  const urlPath = rel === "" || rel === "." ? "/" : "/" + rel.split(path.sep).join("/");
  pages.set(urlPath, { file, html: fs.readFileSync(file, "utf8") });
}

// ---------- 2. Build the inbound-link map ----------
// Only <main> content counts. Global nav/footer links are present on every page
// and would mask a true orphan.
const inbound = new Map();
for (const [urlPath, { html }] of pages) {
  const mainMatch = html.match(/<main[\s\S]*?<\/main>/i);
  const scope = mainMatch ? mainMatch[0] : html;
  const links = new Set();
  const re = /href="(\/[^"#?]*)"/g;
  let m;
  while ((m = re.exec(scope)) !== null) {
    let target = m[1].replace(/\/$/, "") || "/";
    if (target !== urlPath) links.add(target);
  }
  for (const target of links) {
    if (!inbound.has(target)) inbound.set(target, new Set());
    inbound.get(target).add(urlPath);
  }
}

// ---------- 3. Load the pages that actually earn impressions ----------
let nearWinners = { detail: {} };
try {
  nearWinners = JSON.parse(fs.readFileSync(NEAR_WINNERS, "utf8"));
} catch {
  console.error("Could not read near-winners.json; run with the deliverable present.");
  process.exit(1);
}

const rows = [];
for (const [url, payload] of Object.entries(nearWinners.detail || {})) {
  const urlPath = url.replace(/^https?:\/\/[^/]+/, "").replace(/\/$/, "") || "/";
  const qs = Array.isArray(payload) ? payload : payload.queries || [];
  const impressions = qs.reduce((s, q) => s + (q.impressions || 0), 0);
  const clicks = qs.reduce((s, q) => s + (q.clicks || 0), 0);
  const sources = inbound.get(urlPath);
  const count = sources ? sources.size : 0;
  rows.push({ urlPath, impressions, clicks, inbound: count, sources: sources ? [...sources] : [] });
}

// ---------- 4. Report ----------
rows.sort((a, b) => b.impressions - a.impressions);

const orphans = rows.filter((r) => r.inbound === 0);
const thin = rows.filter((r) => r.inbound > 0 && r.inbound <= 1);

console.log(`Checked ${rows.length} pages that earn impressions against ${pages.size} built pages.\n`);

console.log(`ORPHANS (zero contextual inbound links): ${orphans.length}`);
for (const r of orphans) {
  console.log(
    `  ${String(r.impressions).padStart(6)} impr  ${String(r.clicks).padStart(3)} clicks  ${r.urlPath}`
  );
}

console.log(`\nTHIN (exactly one inbound link): ${thin.length}`);
for (const r of thin.slice(0, 25)) {
  console.log(
    `  ${String(r.impressions).padStart(6)} impr  ${String(r.clicks).padStart(3)} clicks  ${r.urlPath}\n         <- ${r.sources[0]}`
  );
}

const orphanImpr = orphans.reduce((s, r) => s + r.impressions, 0);
console.log(
  `\nTotal impressions sitting on orphaned pages: ${orphanImpr.toLocaleString()}`
);
