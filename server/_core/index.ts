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
import { startPressReleaseCron } from "../cron/pressRelease";
import { startBacklinkDiscoveryCron } from "../cron/backlinkDiscovery";

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
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Redirect legacy /city/* paths to /cancel-solar-contract/* (fixes soft 404 in GSC)
  app.get('/city/:slug', (req, res) => {
    res.redirect(301, `/cancel-solar-contract/${req.params.slug}`);
  });

  // Redirect legacy /state-solar-laws to the correct /solar-contract-laws (fixes GSC soft 404)
  app.get('/state-solar-laws', (_req, res) => {
    res.redirect(301, '/solar-contract-laws');
  });

  // IndexNow key verification file for Bing/Yandex URL submission
  app.get('/bysolarcontract2026.txt', (_req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send('bysolarcontract2026');
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

  app.get("/api/capabilities.md", (_req, res) => {
    try {
      const md = fs.readFileSync(CAPABILITIES_PATH, "utf-8");
      res.setHeader("Content-Type", "text/markdown; charset=utf-8");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.send(md);
    } catch {
      res.status(404).json({ error: "CAPABILITIES.md not found" });
    }
  });

  app.get("/api/capabilities", (_req, res) => {
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
        authHeader: "X-API-Key",
        sections: Object.keys(sections),
        markdown: md,
      });
    } catch {
      res.status(404).json({ error: "CAPABILITIES.md not found" });
    }
  });

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
    // Start background cron jobs
    startPressReleaseCron();
    startBacklinkDiscoveryCron();
  });
}

startServer().catch(console.error);
