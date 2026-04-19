import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import fs from "fs";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

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

  // Debug endpoint: check what pre-rendered files exist on the server
  // TODO: Remove after debugging is complete
  app.get('/api/debug-prerender', (_req, res) => {
    const dirname = import.meta.dirname;
    const distPath = path.resolve(dirname, 'public');
    const cwdPath = path.resolve(process.cwd(), 'dist', 'public');
    const sunrunPath = path.resolve(distPath, 'cancel-sunrun-solar-contract', 'index.html');
    const sunrunCwdPath = path.resolve(cwdPath, 'cancel-sunrun-solar-contract', 'index.html');
    let distContents: string[] = [];
    let cwdContents: string[] = [];
    try { distContents = fs.readdirSync(distPath).slice(0, 25); } catch(e: unknown) { distContents = ['ERROR: ' + e]; }
    try { cwdContents = fs.readdirSync(cwdPath).slice(0, 25); } catch(e: unknown) { cwdContents = ['ERROR: ' + e]; }
    res.json({
      dirname,
      cwd: process.cwd(),
      distPath,
      cwdPath,
      distPathExists: fs.existsSync(distPath),
      cwdPathExists: fs.existsSync(cwdPath),
      sunrunExists: fs.existsSync(sunrunPath),
      sunrunCwdExists: fs.existsSync(sunrunCwdPath),
      distContents,
      cwdContents,
    });
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
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
  });
}

startServer().catch(console.error);
