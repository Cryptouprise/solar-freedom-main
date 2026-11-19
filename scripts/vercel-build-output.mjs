#!/usr/bin/env node
/**
 * Packages the normal production build (dist/) into Vercel's Build Output API
 * format (.vercel/output) so Vercel runs the same Express server as a single
 * Node.js function. Run after `pnpm build` (see `pnpm build:vercel`).
 *
 * - static/assets: hashed JS/CSS served straight from Vercel's CDN
 * - functions/index.func: the Express app (server/_core/vercel.ts) bundled into one
 *   file with esbuild, plus dist/public and the few packages that cannot be bundled
 * - config.json: every other request goes to the function, so redirects, noindex
 *   rules and DB blog posts behave exactly like the Manus server.
 */
import { build } from "esbuild";
import fs from "fs";
import path from "path";

const root = process.cwd();
const out = path.join(root, ".vercel", "output");
const funcDir = path.join(out, "functions", "index.func");
const distPublic = path.join(root, "dist", "public");

if (!fs.existsSync(path.join(distPublic, "index.html"))) {
  throw new Error("dist/public/index.html missing — run `pnpm build` first");
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(funcDir, { recursive: true });

// 1. Bundle the serverless entry into a single file. Packages that cannot be
// bundled (playwright, only used by the press-release browser crons) are copied below.
const UNBUNDLED = ["playwright", "playwright-core"];
const entryOut = path.join(funcDir, "index.mjs");
await build({
  entryPoints: [path.join(root, "server/_core/vercel.ts")],
  platform: "node",
  format: "esm",
  bundle: true,
  outfile: entryOut,
  external: [...UNBUNDLED, "vite", "lightningcss", "fsevents"],
  banner: {
    js: "import { createRequire as __vercelCreateRequire } from 'module'; const require = __vercelCreateRequire(import.meta.url);",
  },
  logLevel: "warning",
});

// 2. Copy the unbundled packages (pnpm keeps them side by side in .pnpm).
const playwrightReal = fs.realpathSync(path.join(root, "node_modules", "playwright"));
const pnpmSiblings = path.dirname(playwrightReal);
for (const name of UNBUNDLED) {
  const src = name === "playwright" ? playwrightReal : path.join(pnpmSiblings, name);
  if (!fs.existsSync(src)) throw new Error(`missing ${name} at ${src}`);
  fs.cpSync(src, path.join(funcDir, "node_modules", name), { recursive: true, dereference: true });
}

// 3. Files the server reads at runtime via process.cwd().
fs.cpSync(distPublic, path.join(funcDir, "dist", "public"), { recursive: true });
for (const extra of ["CAPABILITIES.md", "server/prompts"]) {
  const src = path.join(root, extra);
  if (fs.existsSync(src)) fs.cpSync(src, path.join(funcDir, extra), { recursive: true });
}

fs.writeFileSync(
  path.join(funcDir, ".vc-config.json"),
  JSON.stringify(
    {
      runtime: "nodejs22.x",
      handler: "index.mjs",
      launcherType: "Nodejs",
      shouldAddHelpers: false,
      maxDuration: 60,
      environment: { NODE_ENV: "production" },
    },
    null,
    2
  )
);

// 4. Hashed assets from the CDN.
fs.mkdirSync(path.join(out, "static"), { recursive: true });
fs.cpSync(path.join(distPublic, "assets"), path.join(out, "static", "assets"), { recursive: true });

// 5. Routing: assets from the filesystem, everything else through Express.
const canonical = "^(www\\.)?breakyoursolarcontract\\.com$";
fs.writeFileSync(
  path.join(out, "config.json"),
  JSON.stringify(
    {
      version: 3,
      routes: [
        // Belt-and-braces: non-canonical hosts are noindex even for CDN assets.
        {
          src: "/(.*)",
          missing: [{ type: "host", value: { re: canonical } }],
          headers: { "X-Robots-Tag": "noindex, nofollow" },
          continue: true,
        },
        {
          src: "^/assets/(.*)$",
          headers: { "Cache-Control": "public, max-age=31536000, immutable" },
          continue: true,
        },
        { handle: "filesystem" },
        { src: "^/(.*)$", dest: "/index" },
      ],
    },
    null,
    2
  )
);

console.log("[vercel-build-output] wrote .vercel/output (function index + static assets)");
