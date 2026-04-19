import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { buildMetaMap, injectMeta } from "../seo-meta";

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

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // Pre-build the meta map at startup so first request is fast
  buildMetaMap();

  // Fall through to index.html — inject page-specific meta tags for Googlebot
  // Without this, every URL serves the same homepage title/description → Soft 404
  // See docs/lessons-learned/01-spa-soft-404-seo.md
  const indexPath = path.resolve(distPath, "index.html");
  app.use("*", (req, res) => {
    try {
      const html = fs.readFileSync(indexPath, "utf-8");
      const injected = injectMeta(html, req.path);
      res
        .set("Content-Type", "text/html")
        .set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
        .set("Surrogate-Control", "no-store")
        .set("CDN-Cache-Control", "no-store")
        .send(injected);
    } catch {
      res.sendFile(indexPath);
    }
  });
}
