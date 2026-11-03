import type { Express, Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { Agent as HttpsAgent } from "node:https";
import { COOKIE_NAME } from "../shared/const";

export const SUNRUN_RELIEF_PREFIX = "/sunrun-solar-relief";
export const SUNRUN_RELIEF_ORIGIN = "https://sunrun-relief.vibepreview.app";
export const SUNRUN_RELIEF_PUBLIC_HOST = "breakyoursolarcontract.com";

export function isSunrunReliefPath(pathname: string): boolean {
  return pathname === SUNRUN_RELIEF_PREFIX || pathname.startsWith(`${SUNRUN_RELIEF_PREFIX}/`);
}

export function withoutParentSession(cookie: string | undefined): string | undefined {
  if (!cookie) return undefined;
  const kept = cookie.split(";").map(part => part.trim()).filter(part => {
    const name = part.slice(0, part.indexOf("=")).trim();
    return part.includes("=") && name !== COOKIE_NAME && !/^(__Host-|__Secure-)?manus[_-]/i.test(name);
  });
  return kept.length ? kept.join("; ") : undefined;
}

// The optional fixed target exists for local integration tests only. Never read it
// from a request/header/query: visitors cannot turn this into an open proxy.
export function registerSunrunReliefProxy(app: Express, target = SUNRUN_RELIEF_ORIGIN): void {
  app.use(createProxyMiddleware<Request, Response>({
    target,
    ...(target.startsWith("https:") ? { agent: new HttpsAgent({ keepAlive: true, servername: new URL(target).hostname }) } : {}),
    pathFilter: pathname => isSunrunReliefPath(pathname),
    // Mounted at app root: req.url retains the entire prefix and raw query.
    // No pathRewrite, no trailing-slash normalizer, no body parser, no HTML edits.
    changeOrigin: false,
    headers: {
      host: SUNRUN_RELIEF_PUBLIC_HOST,
      "x-forwarded-host": SUNRUN_RELIEF_PUBLIC_HOST,
      "x-forwarded-proto": "https",
    },
    secure: true,
    followRedirects: false,
    ws: false,
    proxyTimeout: 20_000,
    timeout: 25_000,
    // Upstream cookies must not acquire parent-wide scope or override its login.
    cookieDomainRewrite: "",
    cookiePathRewrite: `${SUNRUN_RELIEF_PREFIX}/`,
    on: {
      proxyReq(proxyReq, req) {
        const cookie = withoutParentSession(req.headers.cookie);
        if (cookie) proxyReq.setHeader("cookie", cookie);
        else proxyReq.removeHeader("cookie");
        for (const header of ["authorization", "proxy-authorization", "x-api-key", "x-admin-api-key"]) proxyReq.removeHeader(header);
      },
      proxyRes(proxyRes) {
        proxyRes.headers["x-sunrun-relief-proxy"] = "prefix-preserved";
        // A temporarily unconfigured origin must not cache a readiness failure.
        if ((proxyRes.statusCode ?? 502) >= 400) proxyRes.headers["cache-control"] = "no-store";
        delete proxyRes.headers["service-worker-allowed"];
        const cookies = proxyRes.headers["set-cookie"];
        if (cookies) proxyRes.headers["set-cookie"] = cookies.filter(cookie => !cookie.trimStart().startsWith(`${COOKIE_NAME}=`));
      },
      error(_error, _req, res) {
        // Never fall through into the parent's React app/blog/error HTML.
        if (!("writeHead" in res)) { res.destroy(); return; }
        if (res.headersSent) { res.destroy(); return; }
        res.writeHead(502, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-sunrun-relief-proxy": "upstream-error" });
        res.end("Sunrun Solar Relief upstream is unavailable. The parent website is unchanged.\n");
      },
    },
  }));
}
