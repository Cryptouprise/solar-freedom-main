/**
 * Reconciliation guards.
 *
 * Every SEO defect found in the August 2026 audit was the same shape: two lists
 * that must agree, updated separately, with nothing comparing them.
 *
 *   - An article was added to sitemap.xml by one commit, then the sitemap was
 *     regenerated from shared/index-eligibility.json by a later commit where the
 *     slug was never added. The article shipped noindex and nobody noticed.
 *   - registerCrons registers agent-manager-mountain-8-dst/-standard while
 *     scheduleHealth looked up agent-manager, so the Manager's health was never
 *     actually reported.
 *   - Agents create ~21 action types while the executor registry handled one.
 *   - The eligibility allowlists still name slugs the redirect ledger supersedes.
 *
 * These tests compare the pairs directly. They are cheap, need no build, and
 * each one fails loudly the next time the two halves drift apart.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import indexEligibility from "@shared/index-eligibility.json";
import seoRedirects from "@shared/seo-redirects.json";
import { blogPosts } from "../client/src/data/blog";
import { cities } from "../client/src/data/cities";
import { DESIRED_AGENT_JOBS } from "./agents/registerCrons";
import { MONITORED_JOBS } from "./agents/scheduleHealth";

const ROOT = process.cwd();
const BASE_URL = "https://breakyoursolarcontract.com";

function sitemapPaths(): string[] {
  const xml = fs.readFileSync(path.resolve(ROOT, "client/public/sitemap.xml"), "utf-8");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match =>
    match[1].replace(BASE_URL, "").replace(/\/$/, "") || "/",
  );
}

const REDIRECTED_BLOG_SLUGS = new Set(
  Object.keys(seoRedirects.blog).map(pagePath => pagePath.replace(/^\/blog\//, "")),
);
const REDIRECTED_PUBLIC_PATHS = new Set(Object.keys(seoRedirects.public));
const QUARANTINED_PATHS = new Set(
  (indexEligibility.trustQuarantine?.paths ?? []).map(entry => entry.path),
);

describe("index eligibility reconciles with the sitemap", () => {
  const paths = sitemapPaths();

  it("puts every index-eligible blog slug in the sitemap", () => {
    const inSitemap = new Set(
      paths.filter(p => p.startsWith("/blog/")).map(p => p.slice("/blog/".length)),
    );
    const eligible = indexEligibility.blogSlugs.filter(slug => !REDIRECTED_BLOG_SLUGS.has(slug));
    const missing = eligible.filter(slug => !inSitemap.has(slug));
    // This is the exact failure that hid solar-loan-document-checklist.
    expect(missing).toEqual([]);
  });

  it("puts every index-eligible city slug in the sitemap", () => {
    const inSitemap = new Set(
      paths
        .filter(p => p.startsWith("/cancel-solar-contract/"))
        .map(p => p.slice("/cancel-solar-contract/".length)),
    );
    const eligible = indexEligibility.citySlugs.filter(
      slug => !REDIRECTED_PUBLIC_PATHS.has(`/cancel-solar-contract/${slug}`),
    );
    expect(eligible.filter(slug => !inSitemap.has(slug))).toEqual([]);
  });

  it("lists nothing in the sitemap that is not index-eligible", () => {
    const ineligible = paths.filter(p => {
      if (p.startsWith("/blog/")) return !indexEligibility.blogSlugs.includes(p.slice("/blog/".length));
      if (p.startsWith("/cancel-solar-contract/")) {
        return !indexEligibility.citySlugs.includes(p.slice("/cancel-solar-contract/".length));
      }
      return false;
    });
    expect(ineligible).toEqual([]);
  });

  it("never lists a redirecting or retired URL in the sitemap", () => {
    const retired = new Set(indexEligibility.retiredPublicPaths ?? []);
    for (const pagePath of paths) {
      expect(REDIRECTED_PUBLIC_PATHS.has(pagePath)).toBe(false);
      expect(retired.has(pagePath)).toBe(false);
      if (pagePath.startsWith("/blog/")) {
        expect(REDIRECTED_BLOG_SLUGS.has(pagePath.slice("/blog/".length))).toBe(false);
      }
    }
  });

  it("never lists a quarantined URL in the sitemap", () => {
    for (const pagePath of paths) expect(QUARANTINED_PATHS.has(pagePath)).toBe(false);
  });
});

describe("index eligibility reconciles with the content data", () => {
  it("names only blog slugs that actually exist in the article data", () => {
    const known = new Set(blogPosts.map(post => post.slug));
    expect(indexEligibility.blogSlugs.filter(slug => !known.has(slug))).toEqual([]);
  });

  it("names only city slugs that actually exist in the city data", () => {
    const known = new Set(cities.map(city => city.slug));
    expect(indexEligibility.citySlugs.filter(slug => !known.has(slug))).toEqual([]);
  });

  it("never marks a quarantined page index-eligible", () => {
    for (const pagePath of QUARANTINED_PATHS) {
      if (pagePath.startsWith("/blog/")) {
        expect(indexEligibility.blogSlugs).not.toContain(pagePath.slice("/blog/".length));
      }
      if (pagePath.startsWith("/cancel-solar-contract/")) {
        expect(indexEligibility.citySlugs).not.toContain(
          pagePath.slice("/cancel-solar-contract/".length),
        );
      }
    }
  });
});

describe("scheduled jobs reconcile with schedule monitoring", () => {
  it("monitors every Heartbeat job the project registers", () => {
    const monitored = new Set(MONITORED_JOBS.flatMap(entry => entry.jobNames));
    const unmonitored = DESIRED_AGENT_JOBS.map(job => job.name).filter(name => !monitored.has(name));
    // agent-manager-mountain-8-dst/-standard were unmonitored for weeks, so the
    // Scheduler Truth panel could not tell a healthy Manager from a deleted one.
    expect(unmonitored).toEqual([]);
  });

  it("does not monitor job names nothing registers", () => {
    const registered = new Set(DESIRED_AGENT_JOBS.map(job => job.name));
    const phantom = MONITORED_JOBS.flatMap(entry => entry.jobNames).filter(
      name => !registered.has(name),
    );
    expect(phantom).toEqual([]);
  });

  it("gives every registered job a scheduled endpoint that is mounted", () => {
    const routes = fs.readFileSync(path.resolve(ROOT, "server/_core/index.ts"), "utf-8");
    for (const job of DESIRED_AGENT_JOBS) {
      expect(routes).toContain(`"${job.path}"`);
    }
  });
});
