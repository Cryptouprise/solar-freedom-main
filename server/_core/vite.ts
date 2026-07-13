import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { buildMetaMap, renderDbBlogPost } from "../seo-meta";
import { getDbBlogPostStatus } from "../db";
import {
  CLIENT_ONLY_ROUTES,
  normalizePagePath,
  registerDynamicSeoInventory,
  registerSeoPageDelivery,
  renderClientOnlyDocument,
  renderNotFoundDocument,
} from "../seo-delivery";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );

      const pagePath = normalizePagePath(url);
      if (!pagePath) {
        res.status(400).type("text").send("Invalid URL");
        return;
      }

      const knownPublicPage = Boolean(buildMetaMap()[pagePath]);
      const dynamicCandidate =
        pagePath.startsWith("/blog/") &&
        !pagePath.slice("/blog/".length).includes("/");
      let page = await vite.transformIndexHtml(url, template);

      if (!knownPublicPage && !CLIENT_ONLY_ROUTES.has(pagePath) && dynamicCandidate) {
        const lookup = await getDbBlogPostStatus(pagePath.slice("/blog/".length));
        if (!lookup.available) {
          res
            .status(503)
            .type("html")
            .set("Cache-Control", "no-store")
            .set("Retry-After", "60")
            .set("X-Robots-Tag", "noindex, nofollow")
            .end("<!doctype html><title>Temporarily unavailable</title><h1>Temporarily unavailable</h1><p>Please try again shortly.</p>");
          return;
        }
        if (lookup.post) {
          res.status(200).type("html").end(renderDbBlogPost(page, pagePath, lookup.post));
          return;
        }
      }

      if (!knownPublicPage && !CLIENT_ONLY_ROUTES.has(pagePath)) {
        res
          .status(404)
          .type("html")
          .set("X-Robots-Tag", "noindex, nofollow")
          .end(renderNotFoundDocument(pagePath));
        return;
      }

      if (CLIENT_ONLY_ROUTES.has(pagePath)) {
        page = renderClientOnlyDocument(page, pagePath);
        res.set("X-Robots-Tag", "noindex, nofollow");
      }

      res.status(200).type("html").end(page);
    } catch (error) {
      vite.ssrFixStacktrace(error as Error);
      next(error);
    }
  });
}

/** Resolve dist/public robustly across local and bundled deployments. */
export function resolveDistPath(): string {
  if (process.env.NODE_ENV === "development") {
    return path.resolve(import.meta.dirname, "../..", "dist", "public");
  }

  const cwdBased = path.resolve(process.cwd(), "dist", "public");
  if (fs.existsSync(cwdBased)) {
    console.log(`[serveStatic] distPath (cwd-based): ${cwdBased}`);
    return cwdBased;
  }

  const dirnameBased = path.resolve(import.meta.dirname, "public");
  if (fs.existsSync(dirnameBased)) {
    console.log(`[serveStatic] distPath (dirname-based): ${dirnameBased}`);
    return dirnameBased;
  }

  console.error(
    `[serveStatic] Could not find dist/public. Tried:\n  ${cwdBased}\n  ${dirnameBased}`
  );
  return cwdBased;
}

export function serveStatic(app: Express) {
  const distPath = resolveDistPath();

  // Runtime inventories must win over build-time files so published DB posts
  // become discoverable without a new deployment.
  registerDynamicSeoInventory(app, distPath);

  // HTML directory indexes are handled explicitly by the final route resolver.
  app.use(express.static(distPath, { index: false, redirect: false }));

  buildMetaMap();
  registerSeoPageDelivery(app, distPath);
}
