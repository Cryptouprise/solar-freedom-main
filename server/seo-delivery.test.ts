import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import express from "express";
import fs from "fs";
import os from "os";
import path from "path";
import { createServer, type Server } from "http";
import * as cheerio from "cheerio";
import { blogPosts as clientBlogPosts } from "../client/src/data/blog";

const { getDbBlogPostStatus, getDbBlogPosts } = vi.hoisted(() => ({
  getDbBlogPostStatus: vi.fn(),
  getDbBlogPosts: vi.fn(),
}));

vi.mock("./db", () => ({ getDbBlogPostStatus, getDbBlogPosts }));

import {
  CLIENT_ONLY_ROUTES,
  appendDynamicPostsToLlms,
  mergeDynamicPostsIntoSitemap,
  normalizePagePath,
  registerSeoPageDelivery,
} from "./seo-delivery";
import { buildMetaMap as buildServerMetaMap } from "./seo-meta";

const rootTemplate = `<!doctype html><html><head><title>Home</title><meta name="description" content="home"><link rel="canonical" href="https://breakyoursolarcontract.com/"><meta property="og:url"><meta property="og:title"><meta property="og:description"><meta name="twitter:title"><meta name="twitter:description"></head><body><div id="root">home</div></body></html>`;

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
  });
});

describe("dynamic published-content inventory", () => {
  const posts = [
    {
      slug: "database-article",
      title: "Database Article",
      excerpt: "A runtime-published article.",
      updatedAt: new Date("2026-06-02T00:00:00Z"),
    },
  ];

  it("merges DB posts into sitemap XML without duplicates", () => {
    const base = `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://breakyoursolarcontract.com/</loc></url></urlset>`;
    const merged = mergeDynamicPostsIntoSitemap(base, posts);
    expect(merged).toContain("/blog/database-article");
    expect(merged).toContain("2026-06-02");
    expect(mergeDynamicPostsIntoSitemap(merged, posts).match(/database-article/g)).toHaveLength(1);
  });

  it("merges DB posts into the LLM inventory without duplicates", () => {
    const merged = appendDynamicPostsToLlms("# Solar Freedom\n", posts);
    expect(merged).toContain("## Dynamically published articles");
    expect(merged).toContain("A runtime-published article.");
    expect(appendDynamicPostsToLlms(merged, posts).match(/database-article/g)).toHaveLength(1);
  });
});

describe("pre-render source parity", () => {
  it("places real blog, state, and company data into initial HTML", async () => {
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
    expect(blog).toContain("Step 1: Understand Your Solar Contract Type");
    expect(blog).toContain("Thousands of homeowners across the U.S.");

    const state = prerender.buildShellHtml(
      meta["/solar-contract-laws/texas"],
      "app.js",
      "app.css",
      "/solar-contract-laws/texas"
    );
    expect(state).toContain("Texas Deceptive Trade Practices Act");
    expect(state).toContain("The Texas Net Metering Reality Nobody Told You About");

    const company = prerender.buildShellHtml(
      meta["/cancel-sunrun-solar-contract"],
      "app.js",
      "app.css",
      "/cancel-sunrun-solar-contract"
    );
    const sunrun = companyEntries.find((entry: { slug: string }) => entry.slug === "sunrun");
    if (!sunrun) throw new Error("Sunrun fixture not found");
    const companyText = cheerio.load(company).text();
    expect(companyText).toContain(sunrun.summary);
    expect(companyText).toContain(sunrun.topComplaints[0]);
    expect(companyText).toContain(sunrun.knownIssues[0]);
    expect(companyText).toContain(sunrun.cancellationGrounds[0]);
    expect(companyText).not.toContain("contact you within 24 hours");
    expect(companyText).not.toContain("Our attorneys handle these situations regularly");
    expect(companyText).not.toContain("lending-disclosure rules may provide additional grounds");

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
    expect(cityText).toContain(phoenix.name);
    expect(cityText).toContain(phoenix.state);
    for (const listedCompany of phoenix.companies) {
      expect(cityText).toContain(listedCompany);
    }
    expect(cityText).not.toContain("highest solar-complaint markets");
    expect(cityText).not.toContain("Homeowners in Phoenix are protected");
    expect(cityText).not.toContain("Most cases resolve in 30 to 90 days");
  });

  it("keeps every client blog route in the static pre-render inventory", async () => {
    // @ts-expect-error The build-time module intentionally remains plain ESM.
    const prerender = await import("../scripts/prerender.mjs");
    const parsedSlugs = Object.keys(prerender.loadBlogData()).sort();
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
    for (const slug of clientSlugs) {
      const url = `https://breakyoursolarcontract.com/blog/${slug}`;
      expect(sitemap, `${url} is missing from sitemap.xml`).toContain(url);
      expect(llmsFull, `${url} is missing from llms-full.txt`).toContain(url);
    }
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
