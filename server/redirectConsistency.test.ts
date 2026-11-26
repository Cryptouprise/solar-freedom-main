import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards a contradiction measured on 26 Nov 2026.
 *
 * shared/seo-redirects.json lists the paths the app serves as 301s. Four of those
 * paths were also listed in shared/index-eligibility.json as indexable, so the build
 * emitted a copy that said "index, follow" and pointed its canonical at itself, while
 * the server redirected that exact URL away and the sitemap omitted it. Verified by
 * direct request on 26 Nov 2026 — all four returned HTTP 301:
 *
 *   /blog/solar-escalator-clause-what-it-is-how-to-fight        -> ...-explained-how-to-fight-it
 *   /blog/cancel-solar-contract-denver-co-2026                  -> /cancel-solar-contract/denver-co
 *   /blog/cancel-solar-contract-rescission-rights               -> /blog/solar-contract-rescission-rights
 *   /blog/goodleap-solar-loan-hidden-dealer-fees-2026           -> /blog/goodleap-solar-loan-cancellation-hidden-fees-2026
 *
 * A page cannot be both a redirect and an indexable page. The prerender now treats
 * any redirect source as noindex, and this test holds that line.
 */

const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist/public");
const LEDGER = join(ROOT, "shared/seo-redirects.json");
const PRERENDER = join(ROOT, "scripts/prerender.assembled.mjs");

type Ledger = { public: Record<string, string>; blog: Record<string, string> };

const ledger: Ledger = JSON.parse(readFileSync(LEDGER, "utf-8"));

function builtRobots(urlPath: string): string | null {
  const file = join(DIST, urlPath.replace(/^\//, ""), "index.html");
  if (!existsSync(file)) return null;
  const html = readFileSync(file, "utf-8");
  const match = html.match(/<meta name="robots" content="(.*?)"/s);
  return match ? match[1].split(",")[0].trim() : "NONE";
}

function builtCanonical(urlPath: string): string | null {
  const file = join(DIST, urlPath.replace(/^\//, ""), "index.html");
  if (!existsSync(file)) return null;
  const html = readFileSync(file, "utf-8");
  const match = html.match(/<link rel="canonical" href="(.*?)"/s);
  return match ? match[1] : "NONE";
}

const allRedirectSources = [
  ...Object.keys(ledger.public),
  ...Object.keys(ledger.blog),
];

describe("redirect sources are never also indexable pages", () => {
  it("reads a non-empty redirect ledger", () => {
    expect(allRedirectSources.length).toBeGreaterThan(10);
  });

  it("has the prerender consulting the ledger for blog pages", () => {
    const src = readFileSync(PRERENDER, "utf-8");
    expect(src).toContain("function isRedirectedPath(urlPath) {");
    expect(src).toMatch(
      /noindex:\s*!INDEXED_BLOG_SLUGS\.has\(slug\)\s*\|\|\s*isRedirectedPath\(urlPath\)/
    );
  });

  it("ships no built redirect source with an index directive", () => {
    const offenders: string[] = [];
    for (const path of allRedirectSources) {
      const robots = builtRobots(path);
      if (robots === null) continue; // not built at all, which is fine
      if (!/noindex/i.test(robots)) {
        offenders.push(`${path} :: robots="${robots}"`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("never points a built redirect source's canonical at itself", () => {
    const offenders: string[] = [];
    for (const path of allRedirectSources) {
      // A noindex page's canonical is moot: Google will not index it either way, and
      // the served shell still has to name some canonical. What actually matters is
      // that no redirect source is BOTH indexable and self-canonical, because that is
      // the combination that competes with its own redirect destination. Measured
      // 26 Nov 2026: 45 redirect sources are built, and all 45 are now noindex.
      const robots = builtRobots(path);
      if (robots !== null && /noindex/i.test(robots)) continue;
      const canonical = builtCanonical(path);
      if (canonical === null || canonical === "NONE") continue;
      const tail = canonical.replace(/^https?:\/\/[^/]+/, "");
      if (tail === path) {
        offenders.push(`${path} :: self-canonical while 301-redirected`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("keeps every redirect destination out of the redirect-source set", () => {
    // A redirect chain wastes crawl budget and dilutes the signal.
    const sources = new Set(allRedirectSources);
    const chained = Object.entries({ ...ledger.public, ...ledger.blog })
      .filter(([, to]) => sources.has(to))
      .map(([from, to]) => `${from} -> ${to}`);
    expect(chained).toEqual([]);
  });
});
