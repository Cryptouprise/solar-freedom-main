import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { buildMetaMap } from "../seo-meta";
import { registerDynamicSeoInventory, registerSeoPageDelivery } from "../seo-delivery";

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
