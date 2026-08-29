/**
 * Verify the crawlable internal link graph in the built output.
 *
 * The pre-JavaScript HTML is what a first-pass crawler and every AI crawler
 * reads. Before this check existed the whole indexable site emitted the same
 * hardcoded 8 links: no page linked to the homepage, no page linked to any city
 * page, and /blog linked to 8 of its own 33 articles — so deep pages were
 * discoverable only through sitemap.xml.
 *
 * Fails the build if any of those regressions return.
 *
 * Run: node scripts/verify-link-graph.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.resolve(ROOT, "dist/public");
const SITEMAP = path.resolve(ROOT, "client/public/sitemap.xml");
const BASE_URL = "https://breakyoursolarcontract.com";

/** Minimum crawlable internal links a page must expose. */
const MIN_LINKS_PER_PAGE = 4;

function sitemapPaths() {
  const xml = fs.readFileSync(SITEMAP, "utf-8");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    match => match[1].replace(BASE_URL, "").replace(/\/$/, "") || "/",
  );
}

function artifactFor(pagePath) {
  return pagePath === "/"
    ? path.join(DIST, "index.html")
    : path.join(DIST, pagePath.replace(/^\//, ""), "index.html");
}

function crawlableLinks(html) {
  const main = html.match(/<main class="seo-prerender"[\s\S]*?<\/main>/);
  if (!main) return null;
  return [...main[0].matchAll(/href="(\/[^"]*)"/g)].map(match => match[1]);
}

function main() {
  if (!fs.existsSync(DIST)) {
    console.error("✖ dist/public not found. Run `npm run build` before verifying the link graph.");
    process.exit(1);
  }

  const paths = sitemapPaths();
  const known = new Set(paths);
  const inbound = new Map(paths.map(pagePath => [pagePath, 0]));
  const failures = [];

  for (const pagePath of paths) {
    const file = artifactFor(pagePath);
    if (!fs.existsSync(file)) {
      failures.push(`${pagePath}: no prerendered artifact at ${path.relative(ROOT, file)}`);
      continue;
    }

    const links = crawlableLinks(fs.readFileSync(file, "utf-8"));
    if (links === null) {
      failures.push(`${pagePath}: no <main class="seo-prerender"> block in the served HTML`);
      continue;
    }

    const unique = [...new Set(links)];
    if (unique.length < MIN_LINKS_PER_PAGE) {
      failures.push(`${pagePath}: only ${unique.length} crawlable internal links (minimum ${MIN_LINKS_PER_PAGE})`);
    }
    if (pagePath !== "/" && !unique.includes("/")) {
      failures.push(`${pagePath}: does not link to the homepage`);
    }

    for (const href of unique) {
      if (href === pagePath) {
        failures.push(`${pagePath}: links to itself`);
        continue;
      }
      if (!known.has(href)) {
        // Linking to a noindex or redirecting URL wastes the link and sends a
        // crawler to a dead end.
        failures.push(`${pagePath}: links to ${href}, which is not an indexable sitemap URL`);
        continue;
      }
      inbound.set(href, inbound.get(href) + 1);
    }
  }

  const orphans = paths.filter(pagePath => pagePath !== "/" && inbound.get(pagePath) === 0);
  for (const orphan of orphans) {
    failures.push(`${orphan}: orphan — no indexable page links to it`);
  }

  const summary = {
    pages: paths.length,
    uniqueTargets: [...inbound.values()].filter(count => count > 0).length,
    orphans: orphans.length,
    homepageInbound: inbound.get("/") ?? 0,
  };

  if (failures.length) {
    console.error(`✖ Internal link graph has ${failures.length} problem(s):`);
    for (const failure of failures.slice(0, 40)) console.error(`   - ${failure}`);
    if (failures.length > 40) console.error(`   ...and ${failures.length - 40} more`);
    process.exit(1);
  }

  console.log("✅ Internal link graph verified");
  console.log(`   Indexable pages:      ${summary.pages}`);
  console.log(`   Pages receiving links: ${summary.uniqueTargets}`);
  console.log(`   Orphans:              ${summary.orphans}`);
  console.log(`   Homepage inbound:     ${summary.homepageInbound}`);
}

main();
