import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import express from "express";
import fs from "fs";
import os from "os";
import path from "path";
import { createServer, type Server } from "http";
import * as cheerio from "cheerio";
import { blogPosts as clientBlogPosts } from "../client/src/data/blog";
import { cities as clientCities } from "../client/src/data/cities";
import { companies as clientCompanies } from "../client/src/data/companies";
import { isBlogPostPublishable } from "../client/src/data/publication-governance";

const { getDbBlogPostStatus, getDbBlogPosts, getDbBlogPostsForPublication } = vi.hoisted(() => ({
  getDbBlogPostStatus: vi.fn(),
  getDbBlogPosts: vi.fn(),
  getDbBlogPostsForPublication: vi.fn(),
}));

vi.mock("./db", () => ({ getDbBlogPostStatus, getDbBlogPosts, getDbBlogPostsForPublication }));

import {
  CLIENT_ONLY_ROUTES,
  appendDynamicPostsToLlms,
  canonicalPageRedirect,
  mergeDynamicPostsIntoSitemap,
  registerDynamicSeoInventory,
  normalizePagePath,
  registerSeoPageDelivery,
} from "./seo-delivery";
import {
  buildMetaMap as buildServerMetaMap,
  injectMeta,
  injectMetaDynamic,
} from "./seo-meta";

const rootTemplate = `<!doctype html><html><head><title>Home</title><meta name="description" content="home"><link rel="canonical" href="https://breakyoursolarcontract.com/"><meta property="og:url"><meta property="og:title"><meta property="og:description"><meta name="twitter:title"><meta name="twitter:description"></head><body><div id="root">home</div></body></html>`;

const validDbEditorialReview = {
  editorialReviewerName: "Casey Morgan",
  editorialReviewerRole: "Senior Consumer Content Editor",
  editorialReviewedAt: new Date("2026-06-15T00:00:00Z"),
  editorialPrimarySources: [{
    title: "Federal Cooling-Off Rule",
    url: "https://www.ecfr.gov/current/title-16/part-429",
    accessedAt: "2026-06-14",
  }],
  editorialUniqueValueSummary: "This reviewed article adds a specific document workflow, current primary sources, and substantive questions that are not duplicated on another intake page.",
  editorialFunnelOnlyDuplicate: 0,
};

describe("truthful SEO page delivery", () => {
  let server: Server;
  let baseUrl: string;
  let publicDir: string;

  beforeAll(async () => {
    publicDir = fs.mkdtempSync(path.join(os.tmpdir(), "solar-seo-delivery-"));
    fs.writeFileSync(path.join(publicDir, "index.html"), rootTemplate);
    fs.mkdirSync(path.join(publicDir, "blog", "known"), { recursive: true });
    fs.writeFileSync(
      path.join(publicDir, "blog", "known", "index.html"),
      "<!doctype html><h1>Known static article</h1>"
    );

    getDbBlogPostStatus.mockImplementation(async (slug: string) => ({
      available: true,
      post:
      slug === "database-article"
        ? {
            ...validDbEditorialReview,
            slug,
            title: "Database Article",
            metaTitle: "Database Article Title",
            metaDescription: "A database-published article that is available without rebuilding.",
            excerpt: "Database article excerpt.",
            content: '<h2 style="color:red">Actual database heading</h2><p>Actual database body.</p><blockquote>Unverified testimonial</blockquote><a href="/safe" xlink:href="javascript:bad()">Safe link</a><svg><a xlink:href="javascript:bad()">SVG payload</a></svg><script>bad()</script>',
            category: "Legal Guide",
            publishedAt: new Date("2026-06-01T00:00:00Z"),
            updatedAt: new Date("2026-06-02T00:00:00Z"),
            faqItems: [{ q: "Is this discoverable?", a: "Yes, in the initial HTML." }],
          }
        : slug === "database-unsafe"
          ? {
              ...validDbEditorialReview,
              slug,
              title: "Guaranteed Contract Exit",
              metaTitle: "Guaranteed Contract Exit",
              metaDescription: "A document checklist for reviewing a solar agreement.",
              excerpt: "Gather the signed agreement and written communications.",
              content: "<p>Our legal team gets results in 30 days.</p>",
              category: "Legal Guide",
              publishedAt: new Date("2026-06-01T00:00:00Z"),
              updatedAt: new Date("2026-06-02T00:00:00Z"),
              faqItems: [{ q: "Is the result guaranteed?", a: "Our attorneys won these cases." }],
            }
          : null,
    }));

    const app = express();
    registerSeoPageDelivery(app, publicDir);
    server = createServer(app);
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("No test port");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close(error => (error ? reject(error) : resolve()))
    );
    fs.rmSync(publicDir, { recursive: true, force: true });
  });

  it("serves a pre-rendered page with 200", async () => {
    const response = await fetch(`${baseUrl}/blog/known`);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Known static article");
  });

  it.each([
    "/not-a-real-page",
    "/cancel-solar-contract/not-a-city",
    "/cancel-not-a-company-solar-contract",
    "/solar-contract-laws/not-a-state",
    "/blog/not-an-article",
    "/admin/not-an-admin-page",
    "/solar-fraud-report",
  ])("returns a noindex HTTP 404 for %s", async page => {
    const response = await fetch(`${baseUrl}${page}`);
    expect(response.status).toBe(404);
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    const html = await response.text();
    expect(html).toContain("Page not found");
    expect(html).not.toContain("home</div>");
  });

  it("serves an exact admin SPA route as noindex without homepage SEO content", async () => {
    const response = await fetch(`${baseUrl}/admin/blog-studio`);
    expect(response.status).toBe(200);
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    const html = await response.text();
    expect(html).toContain("Solar Freedom Admin");
    expect(html).not.toContain('rel="canonical"');
    expect(html).not.toContain("home</div>");
  });

  it("renders a published DB article into source HTML with body and schema", async () => {
    const response = await fetch(`${baseUrl}/blog/database-article`);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("<h1>Database Article</h1>");
    expect(html).toContain("Actual database heading");
    expect(html).toContain("Actual database body");
    expect(html).toContain('"@type":"Article"');
    expect(html).toContain('"@type":"FAQPage"');
    expect(html).not.toContain('"author":');
    expect(html).toContain('"publisher":{"@type":"Organization","name":"Solar Freedom","url":"https://breakyoursolarcontract.com"}');
    expect(html).not.toContain("Solar Freedom Legal Team");
    expect(html).not.toContain("Unverified testimonial");
    expect(html).not.toContain("<script>bad()</script>");
    expect(html).not.toContain("style=");
    expect(html).not.toContain("<svg");
    expect(html).not.toContain("xlink:");
    expect(html).not.toContain("SVG payload");
    expect(html).toContain('href="/safe"');
  });

  it("returns a no-store 503 when dynamic post availability is unknown", async () => {
    getDbBlogPostStatus.mockResolvedValueOnce({ available: false, post: null });
    const response = await fetch(`${baseUrl}/blog/database-outage`);
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("retry-after")).toBe("60");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("normalizes query strings and trailing slashes without accepting traversal", () => {
    expect(normalizePagePath("/blog/known/?ref=test")).toBe("/blog/known");
    expect(normalizePagePath("/%5Cwindows")).toBeNull();
    expect(normalizePagePath("//attacker.example/blog/known")).toBeNull();
    expect(normalizePagePath("https://attacker.example/blog/known")).toBeNull();
    expect(canonicalPageRedirect("/blog/known/?ref=test")).toBe("/blog/known?ref=test");
    expect(canonicalPageRedirect("/blog/known?ref=test")).toBeNull();
    expect(canonicalPageRedirect("/privacy?ref=footer")).toBe("/privacy-policy?ref=footer");
  });

  it("serves an unsafe DB article as a noindex editorial hold without claims or schema", async () => {
    const response = await fetch(`${baseUrl}/blog/database-unsafe`);
    expect(response.status).toBe(200);
    expect(response.headers.get("x-robots-tag")).toBe("noindex, follow");
    const html = await response.text();
    expect(html).toContain("Article Under Editorial Review");
    expect(html).toContain('content="noindex, follow"');
    expect(html).not.toContain("Guaranteed Contract Exit");
    expect(html).not.toContain("Our attorneys");
    expect(html).not.toContain("free case review");
    expect(html).not.toContain('application/ld+json');
  });

  it("redirects duplicate slash variants to one canonical path", async () => {
    const response = await fetch(`${baseUrl}/blog/known/`, { redirect: "manual" });
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("/blog/known");
  });
});

describe("dynamic published-content inventory", () => {
  const posts = [
    {
      ...validDbEditorialReview,
      slug: "database-article",
      title: "Database Article",
      excerpt: "A runtime-published article.",
      updatedAt: new Date("2026-06-02T00:00:00Z"),
    },
    {
      ...validDbEditorialReview,
      slug: "database-unsafe",
      title: "Guaranteed Contract Exit",
      excerpt: "Gather the signed agreement and written communications.",
      content: "Our legal team gets results in 30 days.",
      updatedAt: new Date("2026-06-02T00:00:00Z"),
    },
  ];

  it("merges DB posts into sitemap XML without duplicates", () => {
    const base = `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://breakyoursolarcontract.com/</loc></url></urlset>`;
    const merged = mergeDynamicPostsIntoSitemap(base, posts);
    expect(merged).toContain("/blog/database-article");
    expect(merged).toContain("2026-06-02");
    expect(mergeDynamicPostsIntoSitemap(merged, posts).match(/database-article/g)).toHaveLength(1);
    expect(merged).not.toContain("database-unsafe");
  });

  it("merges DB posts into the LLM inventory without duplicates", () => {
    const merged = appendDynamicPostsToLlms("# Solar Freedom\n", posts);
    expect(merged).toContain("## Dynamically published articles");
    expect(merged).toContain("A runtime-published article.");
    expect(appendDynamicPostsToLlms(merged, posts).match(/database-article/g)).toHaveLength(1);
    expect(merged).not.toContain("database-unsafe");
  });

  it("applies the full-copy publication gate to the live sitemap and LLM routes", async () => {
    const publicDir = fs.mkdtempSync(path.join(os.tmpdir(), "solar-dynamic-inventory-"));
    fs.writeFileSync(
      path.join(publicDir, "sitemap.xml"),
      `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://breakyoursolarcontract.com/</loc></url></urlset>`
    );
    fs.writeFileSync(path.join(publicDir, "llms.txt"), "# Solar Freedom\n");
    fs.writeFileSync(path.join(publicDir, "llms-full.txt"), "# Solar Freedom full inventory\n");
    getDbBlogPostsForPublication.mockResolvedValue(posts);

    const app = express();
    registerDynamicSeoInventory(app, publicDir);
    const inventoryServer = createServer(app);
    await new Promise<void>(resolve => inventoryServer.listen(0, "127.0.0.1", resolve));
    const address = inventoryServer.address();
    if (!address || typeof address === "string") throw new Error("No test port");

    try {
      const sitemap = await (await fetch(`http://127.0.0.1:${address.port}/sitemap.xml`)).text();
      const llms = await (await fetch(`http://127.0.0.1:${address.port}/llms.txt`)).text();
      expect(sitemap).toContain("/blog/database-article");
      expect(sitemap).not.toContain("database-unsafe");
      expect(llms).toContain("/blog/database-article");
      expect(llms).not.toContain("database-unsafe");
      expect(getDbBlogPostsForPublication).toHaveBeenCalledTimes(2);
      expect(getDbBlogPosts).not.toHaveBeenCalled();
    } finally {
      await new Promise<void>((resolve, reject) =>
        inventoryServer.close(error => (error ? reject(error) : resolve()))
      );
      fs.rmSync(publicDir, { recursive: true, force: true });
      getDbBlogPostsForPublication.mockReset();
    }
  });
});

describe("pre-render source governance", () => {
  it("applies server-side noindex parity through both metadata injection paths", async () => {
    const serverMap = buildServerMetaMap();
    for (const pagePath of [
      "/cancel-solar-contract/phoenix-az",
      "/cancel-sunrun-solar-contract",
      "/solar-contract-laws/texas",
      "/blog/how-to-get-out-of-a-solar-contract",
    ]) {
      expect(serverMap[pagePath]?.noindex, `${pagePath} must fail closed`).toBe(true);
      const syncHtml = injectMeta(rootTemplate, pagePath);
      const asyncHtml = await injectMetaDynamic(rootTemplate, pagePath);
      for (const html of [syncHtml, asyncHtml]) {
        expect(html).toContain('name="robots" content="noindex, follow"');
        expect(html.match(/name="robots"/g)).toHaveLength(1);
      }
    }

    const staticMeta = JSON.stringify(serverMap);
    expect(staticMeta).not.toMatch(/free (?:case )?(?:review|audit)/i);
    expect(staticMeta).not.toMatch(/real cases, real outcomes/i);
    expect(staticMeta).not.toContain("helps homeowners pursue cancellation");
  });

  it("fails closed for unsupported blog, state, and company claims", async () => {
    // @ts-expect-error The build-time module intentionally remains plain ESM.
    const prerender = await import("../scripts/prerender.mjs");
    const { cityEntries, companyEntries, stateEntries } = await prerender.loadData();
    const blogEntries = prerender.loadBlogData();
    const meta = prerender.buildMetaMap(
      cityEntries,
      companyEntries,
      stateEntries,
      blogEntries
    );

    const blog = prerender.buildShellHtml(
      meta["/blog/how-to-get-out-of-a-solar-contract"],
      "app.js",
      "app.css",
      "/blog/how-to-get-out-of-a-solar-contract"
    );
    expect(blog).toContain('content="noindex, follow"');
    expect(blog).toContain("Article Under Editorial Review");
    expect(blog).not.toContain("Step 1: Understand Your Solar Contract Type");
    expect(blog).not.toContain('"@type":"Article"');
    expect(blog).not.toContain('"@type":"FAQPage"');

    const state = prerender.buildShellHtml(
      meta["/solar-contract-laws/texas"],
      "app.js",
      "app.css",
      "/solar-contract-laws/texas"
    );
    expect(state).toContain('content="noindex, follow"');
    expect(state).toContain("Texas research page is withheld from search");
    expect(state).toContain("https://www.ecfr.gov/current/title-16/part-429");
    expect(state).toContain("https://www.usa.gov/state-attorney-general");
    expect(state).toContain("https://breakyoursolarcontract.com/solar-contract-laws");
    expect(state).not.toContain("Texas Deceptive Trade Practices Act");
    expect(state).not.toContain('"@type":"FAQPage"');

    const company = prerender.buildShellHtml(
      meta["/cancel-sunrun-solar-contract"],
      "app.js",
      "app.css",
      "/cancel-sunrun-solar-contract"
    );
    const companyText = cheerio.load(company).text();
    expect(company).toContain('content="noindex, follow"');
    expect(companyText).toContain("Sunrun research status");
    expect(companyText).toContain("allegations, ratings, legal matters, and outcome claims are withheld");
    expect(companyText).not.toContain("BBB Rating");
    expect(companyText).not.toContain("Cancellation grounds listed on this page");

    const cityPath = "/cancel-solar-contract/phoenix-az";
    const city = prerender.buildShellHtml(
      meta[cityPath],
      "app.js",
      "app.css",
      cityPath
    );
    const phoenix = cityEntries.find((entry: { slug: string }) => entry.slug === "phoenix-az");
    if (!phoenix) throw new Error("Phoenix fixture not found");
    const cityText = cheerio.load(city).text();
    expect(city).toContain('content="noindex, follow"');
    expect(cityText).toContain(phoenix.name);
    expect(cityText).toContain("research status");
    expect(city).toContain("https://www.usa.gov/state-attorney-general");
    expect(city).toContain("https://www.ecfr.gov/current/title-16/part-429");
    for (const listedCompany of phoenix.companies) {
      expect(cityText).not.toContain(listedCompany);
    }
    expect(cityText).not.toContain("highest solar-complaint markets");
    expect(cityText).not.toContain("Homeowners in Phoenix are protected");
    expect(cityText).not.toContain("Most cases resolve in 30 to 90 days");
  });

  it("keeps every client blog route in prerender while excluding quarantined posts from discovery", async () => {
    // @ts-expect-error The build-time module intentionally remains plain ESM.
    const prerender = await import("../scripts/prerender.mjs");
    const parsedBlog = prerender.loadBlogData();
    const parsedSlugs = Object.keys(parsedBlog).sort();
    const clientSlugs = clientBlogPosts.map(post => post.slug).sort();
    expect(parsedSlugs).toEqual(clientSlugs);
    expect(parsedSlugs).toContain("solar-panel-scam-signs-what-to-do");
    expect(parsedSlugs).toContain("goodleap-solar-loan-problems-contract-cancellation");

    const sitemap = fs.readFileSync(
      path.resolve(process.cwd(), "client/public/sitemap.xml"),
      "utf8"
    );
    const llmsFull = fs.readFileSync(
      path.resolve(process.cwd(), "client/public/llms-full.txt"),
      "utf8"
    );
    const llms = fs.readFileSync(
      path.resolve(process.cwd(), "client/public/llms.txt"),
      "utf8"
    );
    for (const post of clientBlogPosts) {
      const url = `https://breakyoursolarcontract.com/blog/${post.slug}`;
      if (isBlogPostPublishable(post)) {
        expect(sitemap, `${url} is missing from sitemap.xml`).toContain(url);
        expect(llmsFull, `${url} is missing from llms-full.txt`).toContain(url);
      } else {
        expect(sitemap, `${url} must be quarantined from sitemap.xml`).not.toContain(url);
        expect(llmsFull, `${url} must be quarantined from llms-full.txt`).not.toContain(url);
        expect(parsedBlog[post.slug].publishable).toBe(false);
      }
    }
    expect(clientBlogPosts.some(isBlogPostPublishable)).toBe(false);
    for (const city of clientCities) {
      const url = `https://breakyoursolarcontract.com/cancel-solar-contract/${city.slug}`;
      expect(sitemap).not.toContain(url);
      expect(llms).not.toContain(url);
      expect(llmsFull).not.toContain(url);
    }
    for (const company of clientCompanies) {
      const url = `https://breakyoursolarcontract.com/cancel-${company.slug}-solar-contract`;
      expect(sitemap).not.toContain(url);
      expect(llms).not.toContain(url);
      expect(llmsFull).not.toContain(url);
    }
    expect(llms).toContain("optional llms.txt machine-readable convention");
    expect(llms).toContain("not a guaranteed crawler standard or citation mechanism");
  });

  it("covers every exact App route with pre-rendered or explicit client-only delivery", async () => {
    // @ts-expect-error The build-time module intentionally remains plain ESM.
    const prerender = await import("../scripts/prerender.mjs");
    const { cityEntries, companyEntries, stateEntries } = await prerender.loadData();
    const prerenderMap = prerender.buildMetaMap(
      cityEntries,
      companyEntries,
      stateEntries,
      prerender.loadBlogData()
    );
    const serverMap = buildServerMetaMap();
    const appSource = fs.readFileSync(
      path.resolve(process.cwd(), "client/src/App.tsx"),
      "utf8"
    );
    const exactRoutes = Array.from(
      appSource.matchAll(/<Route\s+path=\{["']([^"']+)["']\}/g),
      match => match[1]
    ).filter(route => !route.includes(":") && route !== "/404");

    for (const route of exactRoutes) {
      expect(
        Boolean(prerenderMap[route]) || CLIENT_ONLY_ROUTES.has(route),
        `${route} is missing from production page delivery`
      ).toBe(true);
      expect(
        Boolean(serverMap[route]) || CLIENT_ONLY_ROUTES.has(route),
        `${route} is missing from development page delivery`
      ).toBe(true);
    }
  });
});
