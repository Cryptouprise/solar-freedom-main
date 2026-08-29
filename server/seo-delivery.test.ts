import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import express from "express";
import fs from "fs";
import os from "os";
import path from "path";
import { createServer, type Server } from "http";
import * as cheerio from "cheerio";
import { blogPosts as clientBlogPosts } from "../client/src/data/blog";
import indexEligibility from "../shared/index-eligibility.json";
import redirectLedger from "../shared/seo-redirects.json";
import { PUBLIC_PATH_REDIRECTS } from "./seo-redirects";

const { getDbBlogPost, getDbBlogPostStatus, getDbBlogPosts } = vi.hoisted(() => ({
  getDbBlogPost: vi.fn(),
  getDbBlogPostStatus: vi.fn(),
  getDbBlogPosts: vi.fn(),
}));

vi.mock("./db", () => ({ getDbBlogPost, getDbBlogPostStatus, getDbBlogPosts }));

import {
  CLIENT_ONLY_ROUTES,
  appendDynamicPostsToLlms,
  mergeDynamicPostsIntoSitemap,
  normalizePagePath,
  registerSeoPageDelivery,
} from "./seo-delivery";
import { buildMetaMap as buildServerMetaMap } from "./seo-meta";

const rootTemplate = `<!doctype html><html><head><title>Home</title><meta name="description" content="home"><link rel="canonical" href="https://breakyoursolarcontract.com/"><meta property="og:url"><meta property="og:title"><meta property="og:description"><meta name="twitter:title"><meta name="twitter:description"></head><body><div id="root">home</div></body></html>`;

/** Mirrors the shape scripts/prerender.mjs emits: a seo-prerender main with a related-links nav. */
const prerenderedTemplate = `<!doctype html><html><head><title>Static Title | Solar Freedom</title><meta name="description" content="static description"><meta property="og:title" content="Static Title"><meta property="og:description" content="static description"><meta name="twitter:title" content="Static Title"><meta name="twitter:description" content="static description"></head><body><div id="root"><main class="seo-prerender" data-page-type="blog_post"><h1>Known static article</h1><h3>Existing prerendered question?</h3><p>Already answered here.</p><p>Static body copy.</p><nav aria-label="Related Solar Freedom resources"><h2>Related Solar Contract Resources</h2><ul><li><a href="/blog/solar-fraud-warning-signs">Solar fraud warning signs</a></li></ul></nav></main></div></body></html>`;

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
      prerenderedTemplate
    );
    fs.mkdirSync(path.join(publicDir, "blog", "overlaid"), { recursive: true });
    fs.writeFileSync(path.join(publicDir, "blog", "overlaid", "index.html"), prerenderedTemplate);
    fs.mkdirSync(path.join(publicDir, "blog", "db-down"), { recursive: true });
    fs.writeFileSync(path.join(publicDir, "blog", "db-down", "index.html"), prerenderedTemplate);
    fs.mkdirSync(path.join(publicDir, "admin", "blog-studio"), { recursive: true });
    fs.writeFileSync(path.join(publicDir, "admin", "blog-studio", "index.html"), rootTemplate);

    getDbBlogPost.mockImplementation(async (slug: string) => {
      if (slug === "db-down") throw new Error("Database unavailable");
      if (slug !== "overlaid") return null;
      return {
        slug,
        title: "Overlaid Article",
        metaTitle: "Executor rewrote this title tag",
        metaDescription:
          "An executor rewrote this meta description so the snippet earns more clicks at its current position.",
        content:
          '<p>Body text with an executor link to <a href="/blog/known">the known article</a> and <a href="/cancel-solar-contract/phoenix-az">Phoenix solar contract help</a>.</p>',
        faqItems: [
          { q: "Does an executor FAQ reach the crawler?", a: "Yes, it is appended to the prerendered HTML." },
          { q: "Existing prerendered question?", a: "This duplicate must not be added twice." },
        ],
      };
    });

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

  describe("database overlay on prerendered pages", () => {
    it("puts an executor's rewritten title tag and meta description into the crawler HTML", async () => {
      const html = await (await fetch(`${baseUrl}/blog/overlaid`)).text();
      const $ = cheerio.load(html);
      expect($("title").text()).toBe("Executor rewrote this title tag | Solar Freedom");
      expect($('meta[name="description"]').attr("content")).toContain("earns more clicks");
      expect($('meta[property="og:title"]').attr("content")).toContain("Executor rewrote");
      expect($('meta[name="twitter:description"]').attr("content")).toContain("earns more clicks");
    });

    it("appends executor FAQ entries to the body and to FAQPage schema, without duplicating existing questions", async () => {
      const html = await (await fetch(`${baseUrl}/blog/overlaid`)).text();
      const $ = cheerio.load(html);
      expect($("main.seo-prerender").text()).toContain("Does an executor FAQ reach the crawler?");

      const faqSchema = $('script[type="application/ld+json"]')
        .map((_i, el) => JSON.parse($(el).text()))
        .get()
        .find((entry: any) => entry["@type"] === "FAQPage");
      expect(faqSchema).toBeTruthy();
      expect(faqSchema.mainEntity).toHaveLength(2);

      // The question the prerendered page already asks must not be repeated in the body.
      const bodyOccurrences = $("main.seo-prerender").text().split("Existing prerendered question?").length - 1;
      expect(bodyOccurrences).toBe(1);
    });

    it("surfaces internal links an executor added to the stored body", async () => {
      const html = await (await fetch(`${baseUrl}/blog/overlaid`)).text();
      const $ = cheerio.load(html);
      const hrefs = $("main.seo-prerender a[href]").map((_i, el) => $(el).attr("href")).get();
      expect(hrefs).toContain("/blog/known");
      expect(hrefs).toContain("/cancel-solar-contract/phoenix-az");
    });

    it("is strictly additive — it never drops a link the prerendered page already had", async () => {
      const html = await (await fetch(`${baseUrl}/blog/overlaid`)).text();
      const $ = cheerio.load(html);
      const hrefs = $("main.seo-prerender a[href]").map((_i, el) => $(el).attr("href")).get();
      expect(hrefs).toContain("/blog/solar-fraud-warning-signs");
      expect($("main.seo-prerender h1").text()).toBe("Known static article");
      expect($("main.seo-prerender").text()).toContain("Static body copy.");
    });

    it("serves the prerendered file unchanged when the page has no database row", async () => {
      const html = await (await fetch(`${baseUrl}/blog/known`)).text();
      const $ = cheerio.load(html);
      expect($("title").text()).toBe("Static Title | Solar Freedom");
      expect($("main.seo-prerender a[href]")).toHaveLength(1);
    });

    it("still serves the prerendered page when the database lookup throws", async () => {
      const response = await fetch(`${baseUrl}/blog/db-down`);
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain("Known static article");
      expect(cheerio.load(html)("title").text()).toBe("Static Title | Solar Freedom");
    });
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
    expect(html).toContain('"author":{"@type":"Organization","@id":"https://breakyoursolarcontract.com/#organization","name":"Solar Freedom","url":"https://breakyoursolarcontract.com"}');
    expect(html).toContain('"publisher":{"@type":"Organization","@id":"https://breakyoursolarcontract.com/#organization","name":"Solar Freedom","url":"https://breakyoursolarcontract.com"}');
    expect(html).toContain('class="editorial-method"');
    expect(html).toContain("Frequently asked questions");
    expect(html).not.toContain("Solar Freedom Legal Team");
    expect(html).not.toContain("Solar Freedom Legal Research Team");
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
      slug: "solar-payment-shock-help",
      title: "Solar Payment Shock Help",
      excerpt: "A runtime-published article in the verified eligibility ledger.",
      updatedAt: new Date("2026-06-02T00:00:00Z"),
    },
  ];

  it("merges DB posts into sitemap XML without duplicates", () => {
    const base = `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://breakyoursolarcontract.com/</loc></url></urlset>`;
    const merged = mergeDynamicPostsIntoSitemap(base, posts);
    expect(merged).toContain("/blog/solar-payment-shock-help");
    expect(merged).toContain("2026-06-02");
    expect(mergeDynamicPostsIntoSitemap(merged, posts).match(/solar-payment-shock-help/g)).toHaveLength(1);
  });

  it("excludes database rows whose blog slugs are legacy redirects", () => {
    const base = `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
    const merged = mergeDynamicPostsIntoSitemap(base, [
      { slug: "solar-panel-scam-signs-what-to-do", updatedAt: new Date("2026-06-02T00:00:00Z") },
      { slug: "how-to-get-out-of-a-solar-contract", updatedAt: new Date("2026-06-03T00:00:00Z") },
      { slug: "unapproved-database-article", updatedAt: new Date("2026-06-04T00:00:00Z") },
    ]);
    expect(merged).not.toContain("solar-panel-scam-signs-what-to-do");
    expect(merged).toContain("how-to-get-out-of-a-solar-contract");
    expect(merged).not.toContain("unapproved-database-article");
  });

  it("merges DB posts into the LLM inventory without duplicates", () => {
    const merged = appendDynamicPostsToLlms("# Solar Freedom\n", posts);
    expect(merged).toContain("## Dynamically published articles");
    expect(merged).toContain("A runtime-published article in the verified eligibility ledger.");
    expect(appendDynamicPostsToLlms(merged, posts).match(/solar-payment-shock-help/g)).toHaveLength(1);
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
    expect(blog).toContain("Step 1: What type of solar agreement do you have?");
    expect(blog).toContain("Direct answer: you may have an exit, cancellation, payoff, transfer, purchase, or dispute option");

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
    const redirectedSitemapSlugs = new Set(
      Object.keys(redirectLedger.blog).map(pagePath => pagePath.replace(/^\/blog\//, ""))
    );
    const eligibleBlogSlugs = new Set(indexEligibility.blogSlugs);
    for (const slug of clientSlugs) {
      const url = `https://breakyoursolarcontract.com/blog/${slug}`;
      const shouldBeDiscoverable = eligibleBlogSlugs.has(slug) && !redirectedSitemapSlugs.has(slug);
      if (shouldBeDiscoverable) {
        expect(sitemap, `${url} is missing from sitemap.xml`).toContain(url);
        expect(llmsFull, `${url} is missing from llms-full.txt`).toContain(url);
      } else {
        expect(sitemap, `${url} should not be in sitemap.xml`).not.toContain(url);
        expect(llmsFull, `${url} should not be in llms-full.txt`).not.toContain(url);
      }
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
        Boolean(prerenderMap[route]) || CLIENT_ONLY_ROUTES.has(route) || Boolean(PUBLIC_PATH_REDIRECTS[route]),
        `${route} is missing from production page delivery`
      ).toBe(true);
      expect(
        Boolean(serverMap[route]) || CLIENT_ONLY_ROUTES.has(route) || Boolean(PUBLIC_PATH_REDIRECTS[route]),
        `${route} is missing from development page delivery`
      ).toBe(true);
    }
  });
});
