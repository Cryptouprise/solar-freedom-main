import "dotenv/config";
import express from "express";
import { createServer } from "http";
import fs from "fs";
import path from "path";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import adminRouter from "../adminRouter";
import { automationRunHandler } from "../scheduled/automationRun";
import { rateLimit } from "express-rate-limit";
import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { applyHttpSecurityHeaders, getReleaseIdentity } from "./httpSecurity";
import { logSafeError } from "./safeLog";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const trustedProxies = process.env.TRUST_PROXY
    ?.split(",")
    .map(value => value.trim())
    .filter(Boolean);
  if (trustedProxies?.length) app.set("trust proxy", trustedProxies);
  const server = createServer(app);
  app.disable("x-powered-by");
  app.use(applyHttpSecurityHeaders);

  const healthRateLimit = rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.get("/healthz", healthRateLimit, (_req, res) => {
    res.status(200).json({ status: "ok", ...getReleaseIdentity() });
  });
  app.get("/readyz", healthRateLimit, async (_req, res) => {
    try {
      const db = await getDb();
      if (!db) {
        res.status(503).json({ status: "not_ready", ...getReleaseIdentity() });
        return;
      }
      await db.execute(sql`SELECT 1`);
      res.status(200).json({ status: "ready", ...getReleaseIdentity() });
    } catch (error) {
      logSafeError("server.readiness_failed", error);
      res.status(503).json({ status: "not_ready", ...getReleaseIdentity() });
    }
  });
  // Keep unauthenticated request bodies small. Admin uploads are parsed only
  // after authentication inside adminRouter, with a separate bounded limit.
  const publicJsonParser = express.json({ limit: "1mb" });
  const publicFormParser = express.urlencoded({ limit: "256kb", extended: true });
  app.use((req, res, next) =>
    req.path.startsWith("/api/admin") ? next() : publicJsonParser(req, res, next)
  );
  app.use((req, res, next) =>
    req.path.startsWith("/api/admin") ? next() : publicFormParser(req, res, next)
  );
  // Some browsers still request the legacy icon path even when favicon.svg is
  // declared. Keep that request successful without duplicating a binary asset.
  app.get("/favicon.ico", (_req, res) => {
    res.redirect(308, "/favicon.svg");
  });
  // Redirect legacy /city/* paths to /cancel-solar-contract/* (fixes soft 404 in GSC)
  app.get('/city/:slug', (req, res) => {
    res.redirect(301, `/cancel-solar-contract/${req.params.slug}`);
  });

  // Redirect legacy /state-solar-laws to the correct /solar-contract-laws (fixes GSC soft 404)
  app.get('/state-solar-laws', (_req, res) => {
    res.redirect(301, '/solar-contract-laws');
  });

  // Redirect legacy wording to the canonical route used by the React app and sitemap
  app.get('/selling-home-with-solar', (_req, res) => {
    res.redirect(301, '/selling-house-with-solar');
  });

  // ─── Blog slug redirects — short/old slugs → canonical long slugs ────────────
  // These URLs were crawled by Google but have no content, causing them to return
  // the homepage canonical (duplicate content signal). 301 redirects fix this.
  const BLOG_SLUG_REDIRECTS: Record<string, string> = {
    '/blog/freedom-forever-solar-bankruptcy': '/blog/freedom-forever-solar-bankruptcy-what-homeowners-can-do-2026',
    '/blog/how-to-cancel-sunnova-solar-contract': '/blog/how-to-cancel-sunnova-solar-contract-2026',
    '/blog/solar-contract-escalator-clause-what-it-means': '/blog/solar-contract-escalator-clause-explained-how-to-fight-it',
    '/blog/solar-contract-red-flags-and-scams': '/blog/solar-contract-red-flags',
    '/blog/solar-lease-vs-loan-vs-ppa': '/blog/solar-loan-vs-lease-problems',
  };
  for (const [from, to] of Object.entries(BLOG_SLUG_REDIRECTS)) {
    app.get(from, (_req, res) => res.redirect(301, to));
  }

  // IndexNow key verification file for Bing/Yandex URL submission
  app.get('/bysolarcontract2026.txt', (_req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send('bysolarcontract2026');
  });

  app.get('/solarfreedom2026indexnow.txt', (_req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send('solarfreedom2026indexnow');
  });

  // Google Search Console ownership verification file for service account
  app.get('/google8d9f2c5b033c587b.html', (_req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send('google-site-verification: google8d9f2c5b033c587b.html');
  });

  // Storage proxy — serves /manus-storage/* assets via signed URLs
  registerStorageProxy(app);
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Admin Content API (for external AI tools like Claude)
  app.use("/api/admin", adminRouter);

  // ─── Capabilities Manifest (public — for AI agent discovery) ─────────────────
  const CAPABILITIES_PATH = path.resolve(process.cwd(), "CAPABILITIES.md");
  const capabilitiesRateLimit = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false });

  app.get("/api/capabilities.md", capabilitiesRateLimit, (_req, res) => {
    try {
      const md = fs.readFileSync(CAPABILITIES_PATH, "utf-8");
      res.setHeader("Content-Type", "text/markdown; charset=utf-8");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.send(md);
    } catch {
      res.status(404).json({ error: "CAPABILITIES.md not found" });
    }
  });

  app.get("/api/capabilities", capabilitiesRateLimit, (_req, res) => {
    try {
      const md = fs.readFileSync(CAPABILITIES_PATH, "utf-8");
      // Parse sections for structured JSON
      const sections: Record<string, string> = {};
      let currentSection = "overview";
      for (const line of md.split("\n")) {
        if (line.startsWith("## ")) {
          currentSection = line.replace("## ", "").toLowerCase().replace(/[^a-z0-9]+/g, "_");
          sections[currentSection] = "";
        } else if (sections[currentSection] !== undefined) {
          sections[currentSection] += line + "\n";
        }
      }
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.json({
        name: "Solar Freedom — breakyoursolarcontract.com",
        version: "1.0",
        manifestUrl: "https://breakyoursolarcontract.com/api/capabilities",
        markdownUrl: "https://breakyoursolarcontract.com/api/capabilities.md",
        adminApiBase: "https://breakyoursolarcontract.com/api/admin",
        trpcBase: "https://breakyoursolarcontract.com/api/trpc",
        authHeader: "Authorization: Bearer <ADMIN_API_KEY>",
        sections: Object.keys(sections),
        markdown: md,
      });
    } catch {
      res.status(404).json({ error: "CAPABILITIES.md not found" });
    }
  });

  // ─── Scheduled / Heartbeat handlers ─────────────────────────────────────────
  // MUST be registered before the tRPC middleware and Vite fallthrough
  app.post("/api/scheduled/automation-run", rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false }), automationRunHandler);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // External publication is deliberately not started from the web process.
    // Drafting and publication require an approval-bound, idempotent adapter.
    // Discovery/publishing jobs run only in a leased, idempotent worker. The
    // web process never starts external automation on boot.
  });
}

startServer().catch(error => {
  logSafeError("server.start_failed", error);
  process.exitCode = 1;
});
