import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import express from "express";
import fs from "fs";
import os from "os";
import path from "path";
import { createServer, type Server } from "http";

const { getDbBlogPost, getDbBlogPosts } = vi.hoisted(() => ({
  getDbBlogPost: vi.fn(),
  getDbBlogPosts: vi.fn(),
}));

vi.mock("./db", () => ({ getDbBlogPost, getDbBlogPosts }));

import {
  appendDynamicPostsToLlms,
  mergeDynamicPostsIntoSitemap,
  normalizePagePath,
  registerSeoPageDelivery,
} from "./seo-delivery";

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

    getDbBlogPost.mockImplementation(async (slug: string) =>
      slug === "database-article"
        ? {
            slug,
            title: "Database Article",
            metaTitle: "Database Article Title",
            metaDescription: "A database-published article that is available without rebuilding.",
            excerpt: "Database article excerpt.",
            content: "<h2>Actual database heading</h2><p>Actual database body.</p><script>bad()</script>",
            category: "Legal Guide",
            publishedAt: new Date("2026-06-01T00:00:00Z"),
            updatedAt: new Date("2026-06-02T00:00:00Z"),
            faqItems: [{ q: "Is this discoverable?", a: "Yes, in the initial HTML." }],
          }
        : null
    );

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
    expect(html).not.toContain("<script>bad()</script>");
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
    expect(company).toContain("20-year lease with 2.9% annual payment escalator");
    expect(company.replace(/<[^>]+>/g, " ").split(/\s+/).length).toBeGreaterThan(250);
  });
});
