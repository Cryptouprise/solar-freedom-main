/**
 * Vercel serverless entry. Builds the same Express app as server/_core/index.ts
 * (shared via registerAppRoutes) and serves the prerendered dist/public output,
 * but never calls listen() and never starts the setInterval crons, which cannot
 * run on serverless. Bundled by scripts/vercel-build-output.mjs.
 */
import express from "express";
import { registerAppRoutes } from "./app";
import { serveStatic } from "./static";

// Only the real domain may be indexed. Every other hostname (preview URLs,
// *.vercel.app, branch aliases) is a duplicate copy of the site and must stay
// out of search results — see the July 2026 spam penalty history.
const CANONICAL_HOSTS = new Set(
  (process.env.CANONICAL_HOSTS ?? "breakyoursolarcontract.com,www.breakyoursolarcontract.com")
    .split(",")
    .map(h => h.trim().toLowerCase())
    .filter(Boolean)
);

export function isCanonicalHost(hostHeader: string | undefined): boolean {
  const host = String(hostHeader ?? "").split(":")[0].trim().toLowerCase();
  return CANONICAL_HOSTS.has(host);
}

const app = express();
app.use((req, res, next) => {
  const host = (req.headers["x-forwarded-host"] as string | undefined) ?? req.headers.host;
  if (!isCanonicalHost(host)) {
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    const originalSetHeader = res.setHeader.bind(res);
    // Keep later route handlers from weakening the noindex on duplicate hosts.
    res.setHeader = ((name: string, value: any) => {
      if (String(name).toLowerCase() === "x-robots-tag") return res;
      return originalSetHeader(name, value);
    }) as typeof res.setHeader;
    if (req.path === "/robots.txt") {
      res.type("text/plain").send("User-agent: *\nDisallow:\n# Non-canonical host: every response carries X-Robots-Tag: noindex.\n");
      return;
    }
  }
  next();
});
registerAppRoutes(app);
serveStatic(app);

export default app;
