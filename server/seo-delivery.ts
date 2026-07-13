import type { Express } from "express";
import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";
import { getDbBlogPostStatus, getDbBlogPostsForPublication } from "./db";
import { renderDbBlogPost } from "./seo-meta";
import { rateLimit } from "express-rate-limit";
import { logSafeError } from "./_core/safeLog";
import { isBlogPostPublishable } from "../client/src/data/publication-governance";

const BASE_URL = "https://breakyoursolarcontract.com";

/**
 * Routes that are intentionally client-rendered and therefore do not have a
 * pre-rendered directory. Keeping this list exact prevents `/admin/anything`
 * and lookalike public URLs from inheriting the homepage with a 200 response.
 */
export const CLIENT_ONLY_ROUTES = new Set([
  "/login",
  "/youtube",
  "/yt",
  "/yt2",
  "/yt3",
  "/watch",
  "/seo-command-center",
  "/admin/leads",
  "/admin/analytics",
  "/admin/content",
  "/admin/press-releases",
  "/admin/posts",
  "/admin/blog-studio",
  "/admin/automations",
]);

export function normalizePagePath(originalUrl: string): string | null {
  try {
    if (!originalUrl.startsWith("/") || originalUrl.startsWith("//")) return null;
    const url = new URL(originalUrl, BASE_URL);
    if (url.origin !== BASE_URL) return null;
    const pathname = url.pathname;
    const decoded = decodeURIComponent(pathname);
    if (decoded.includes("\0") || decoded.includes("\\")) return null;
    if (decoded.split("/").some(segment => segment === "." || segment === "..")) return null;
    const normalized = decoded.replace(/\/{2,}/g, "/");
    return normalized === "/" ? "/" : normalized.replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function canonicalPageRedirect(originalUrl: string): string | null {
  const pagePath = normalizePagePath(originalUrl);
  if (!pagePath) return null;
  const url = new URL(originalUrl, BASE_URL);
  if (pagePath === "/privacy") return `/privacy-policy${url.search}`;
  const pathNeedsRedirect = url.pathname !== pagePath;
  return pathNeedsRedirect ? `${pagePath}${url.search}` : null;
}

export function prerenderedFileFor(
  publicDir: string,
  pagePath: string
): string | null {
  if (pagePath === "/") {
    const root = path.resolve(publicDir, "index.html");
    return fs.existsSync(root) ? root : null;
  }

  const relative = pagePath.replace(/^\/+/, "");
  const candidate = path.resolve(publicDir, relative, "index.html");
  const publicRoot = `${path.resolve(publicDir)}${path.sep}`;
  if (!candidate.startsWith(publicRoot)) return null;
  return fs.existsSync(candidate) ? candidate : null;
}

export function renderNotFoundDocument(pagePath: string): string {
  const safePath = pagePath.replace(/[&<>"']/g, character => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Page Not Found | Solar Freedom</title>
  <style>body{margin:0;background:#0a0a0a;color:#f4f4f5;font:16px/1.6 system-ui,sans-serif}main{max-width:720px;margin:12vh auto;padding:2rem}strong{color:#f59e0b;font-size:4rem}a{color:#f59e0b}</style>
</head>
<body><main><strong>404</strong><h1>Page not found</h1><p>No Solar Freedom page exists at <code>${safePath}</code>.</p><p><a href="/">Return home</a> or <a href="/blog">browse the solar contract library</a>.</p></main></body>
</html>`;
}

export function renderQuarantinedBlogDocument(pagePath: string): string {
  const canonical = `${BASE_URL}${pagePath}`.replace(/[&<>'"]/g, character => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character] ?? character;
  });

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex, follow">
  <link rel="canonical" href="${canonical}">
  <title>Article Under Editorial Review | Solar Freedom</title>
  <meta name="description" content="This article is withheld while service, outcome, fee, and timing statements are checked against source records and editorial standards.">
  <style>body{margin:0;background:#0a0a0a;color:#f4f4f5;font:16px/1.6 system-ui,sans-serif}main{max-width:720px;margin:12vh auto;padding:2rem}a{color:#f59e0b}</style>
</head>
<body><main><p>Editorial review pending</p><h1>This article is temporarily withheld.</h1><p>This article is withheld while service, outcome, fee, and timing statements are checked against source records and editorial standards.</p><p><a href="/blog">Return to reviewed articles</a></p></main></body>
</html>`;
}

export function renderClientOnlyDocument(html: string, pagePath: string): string {
  const $ = cheerio.load(html);
  const isAdmin = pagePath.startsWith("/admin/");
  const title = isAdmin ? "Solar Freedom Admin" : "Solar Freedom";
  $("title").text(title);
  $('link[rel="canonical"]').remove();
  $('meta[name="robots"]').remove();
  $("head").append('<meta name="robots" content="noindex, nofollow">');
  $("#root").replaceWith(
    `<div id="root"><main><h1>${title}</h1><p>${
      isAdmin ? "Sign in to access this private workspace." : "Loading Solar Freedom."
    }</p></main></div>`
  );
  return $.html();
}

function xmlEscape(value: unknown): string {
  return String(value ?? "").replace(/[<>&"']/g, character => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return entities[character] ?? character;
  });
}

function publishedDate(value: unknown): string | null {
  if (!value) return null;
  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

export function mergeDynamicPostsIntoSitemap(
  staticSitemap: string,
  posts: Array<{ slug: string; updatedAt?: unknown; publishedAt?: unknown }>
): string {
  const $ = cheerio.load(staticSitemap, { xmlMode: true });
  const urlset = $("urlset");
  if (!urlset.length) return staticSitemap;

  const existing = new Set(
    $("url > loc")
      .map((_, element) => $(element).text().trim())
      .get()
  );

  for (const post of posts) {
    const location = `${BASE_URL}/blog/${encodeURIComponent(post.slug)}`;
    if (!post.slug || !isBlogPostPublishable(post) || existing.has(location)) continue;
    const lastmod = publishedDate(post.updatedAt ?? post.publishedAt);
    urlset.append(
      `<url><loc>${xmlEscape(location)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>monthly</changefreq><priority>0.7</priority></url>`
    );
  }

  return $.xml();
}

export function appendDynamicPostsToLlms(
  staticInventory: string,
  posts: Array<{
    slug: string;
    title: string;
    excerpt?: string | null;
    metaDescription?: string | null;
  }>
): string {
  const existing = new Set(
    Array.from(staticInventory.matchAll(/https:\/\/breakyoursolarcontract\.com\/blog\/([^\s)]+)/g)).map(
      match => decodeURIComponent(match[1])
    )
  );
  const additions = posts.filter(
    post => post.slug && isBlogPostPublishable(post) && !existing.has(post.slug)
  );
  if (!additions.length) return staticInventory;

  const lines = additions.map(post => {
    const summary = (post.excerpt || post.metaDescription || "Published Solar Freedom article")
      .replace(/\s+/g, " ")
      .trim();
    return `- [${post.title.replace(/[\[\]]/g, "")}](${BASE_URL}/blog/${encodeURIComponent(post.slug)}): ${summary}`;
  });
  return `${staticInventory.trimEnd()}\n\n## Dynamically published articles\n\n${lines.join("\n")}\n`;
}

function seoHeaders(response: import("express").Response) {
  response
    .type("html")
    .set("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=600")
    .set("Vary", "Accept-Encoding");
}

/**
 * Register runtime SEO inventory before express.static so database-published
 * posts cannot be hidden behind the build-time sitemap/llms.txt files.
 */
export function registerDynamicSeoInventory(app: Express, publicDir: string) {
  const inventoryRateLimit = rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false });
  app.get("/sitemap.xml", inventoryRateLimit, async (_request, response) => {
    const sitemapPath = path.resolve(publicDir, "sitemap.xml");
    if (!fs.existsSync(sitemapPath)) {
      response.status(404).type("text").send("Sitemap not found");
      return;
    }
    const base = fs.readFileSync(sitemapPath, "utf8");
    try {
      const posts = await getDbBlogPostsForPublication(5000, 0);
      response
        .type("application/xml")
        .set("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=600")
        .send(mergeDynamicPostsIntoSitemap(base, posts));
    } catch (error) {
      logSafeError("seo.inventory_failed", error);
      response.type("application/xml").send(base);
    }
  });

  for (const filename of ["llms.txt", "llms-full.txt"]) {
    app.get(`/${filename}`, inventoryRateLimit, async (_request, response) => {
      const inventoryPath = path.resolve(publicDir, filename);
      if (!fs.existsSync(inventoryPath)) {
        response.status(404).type("text").send("Inventory not found");
        return;
      }
      const base = fs.readFileSync(inventoryPath, "utf8");
      try {
        const posts = await getDbBlogPostsForPublication(5000, 0);
        response
          .type("text/plain")
          .set("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=600")
          .send(appendDynamicPostsToLlms(base, posts));
      } catch (error) {
        logSafeError("seo.inventory_failed", error);
        response.type("text/plain").send(base);
      }
    });
  }
}

/**
 * Serve a valid page or a truthful 404. This is deliberately the final
 * middleware after APIs, redirects, and assets.
 */
export function registerSeoPageDelivery(app: Express, publicDir: string) {
  const rootIndex = path.resolve(publicDir, "index.html");
  const pageRateLimit = rateLimit({ windowMs: 60_000, limit: 600, standardHeaders: true, legacyHeaders: false });

  app.get("*", pageRateLimit, async (request, response) => {
    const pagePath = normalizePagePath(request.originalUrl);
    if (!pagePath) {
      response.status(400).type("text").send("Invalid URL");
      return;
    }
    const canonicalRedirect = canonicalPageRedirect(request.originalUrl);
    if (canonicalRedirect) {
      response.redirect(301, canonicalRedirect);
      return;
    }

    const prerendered = prerenderedFileFor(publicDir, pagePath);
    if (prerendered) {
      seoHeaders(response);
      response.status(200).send(fs.readFileSync(prerendered, "utf8"));
      return;
    }

    if (CLIENT_ONLY_ROUTES.has(pagePath) && fs.existsSync(rootIndex)) {
      seoHeaders(response);
      response
        .set("X-Robots-Tag", "noindex, nofollow")
        .status(200)
        .send(renderClientOnlyDocument(fs.readFileSync(rootIndex, "utf8"), pagePath));
      return;
    }

    if (pagePath.startsWith("/blog/") && fs.existsSync(rootIndex)) {
      const slug = pagePath.slice("/blog/".length);
      if (slug && !slug.includes("/")) {
        try {
          const lookup = await getDbBlogPostStatus(slug);
          if (!lookup.available) {
            response
              .status(503)
              .type("html")
              .set("Cache-Control", "no-store")
              .set("Retry-After", "60")
              .set("X-Robots-Tag", "noindex, nofollow")
              .send("<!doctype html><title>Temporarily unavailable</title><h1>Temporarily unavailable</h1><p>Please try again shortly.</p>");
            return;
          }
          if (lookup.post) {
            if (!isBlogPostPublishable(lookup.post)) {
              seoHeaders(response);
              response
                .set("X-Robots-Tag", "noindex, follow")
                .status(200)
                .send(renderQuarantinedBlogDocument(pagePath));
              return;
            }
            const html = fs.readFileSync(rootIndex, "utf8");
            seoHeaders(response);
            response.status(200).send(renderDbBlogPost(html, pagePath, lookup.post));
            return;
          }
        } catch (error) {
          logSafeError("seo.db_lookup_failed", error);
        }
      }
    }

    response
      .status(404)
      .type("html")
      .set("Cache-Control", "public, max-age=60, s-maxage=300")
      .set("X-Robots-Tag", "noindex, nofollow")
      .send(renderNotFoundDocument(pagePath));
  });
}
