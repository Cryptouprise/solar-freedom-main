import { afterAll, beforeAll, describe, expect, it } from "vitest";
import express from "express";
import { createServer, type Server } from "node:http";
import { gzipSync } from "node:zlib";
import { registerSunrunReliefProxy, isSunrunReliefPath, withoutParentSession } from "./sunrunReliefProxy";
import { PUBLIC_PATH_REDIRECTS } from "./seo-redirects";

let origin: Server;
let proxy: Server;
let base: string;
const requests: Array<{ url: string; method: string; headers: Record<string, unknown>; body: string }> = [];
async function listen(server: Server): Promise<string> {
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No port");
  return `http://127.0.0.1:${address.port}`;
}
async function stop(server: Server) {
  server.closeAllConnections();
  await new Promise<void>(resolve => server.close(() => resolve()));
}
beforeAll(async () => {
  origin = createServer(async (req, res) => {
    let body = ""; for await (const chunk of req) body += chunk;
    requests.push({ url: req.url!, method: req.method!, headers: req.headers, body });
    if (req.url?.includes("unavailable")) { req.socket.destroy(); return; }
    if (req.url?.includes("forbidden")) { res.writeHead(403, { "content-type": "text/plain" }); res.end("Upstream denied Host"); return; }
    if (req.url?.includes("redirect")) { res.writeHead(307, { location: "/sunrun-solar-relief/destination" }); res.end(); return; }
    if (req.url?.includes("gzip")) {
      const bytes = gzipSync("unaltered upstream document");
      res.writeHead(200, { "content-type": "text/html", "content-encoding": "gzip", "content-length": bytes.length }); res.end(bytes); return;
    }
    if (req.url?.includes("cookies")) {
      res.setHeader("set-cookie", ["subsite=ok; Domain=sunrun-relief.vibepreview.app; Path=/; HttpOnly", "app_session_id=must-not-overwrite; Path=/"]);
      res.setHeader("service-worker-allowed", "/");
    }
    const type = req.url?.includes("sitemap.xml") ? "application/xml" : req.url?.includes("robots.txt") ? "text/plain" : "text/html";
    res.writeHead(200, { "content-type": type, "x-upstream-proof": "test-origin" });
    res.end(JSON.stringify({ url: req.url, method: req.method, body }));
  });
  const upstream = await listen(origin);
  const app = express();
  registerSunrunReliefProxy(app, upstream);
  app.use(express.json());
  for (const [from, to] of Object.entries(PUBLIC_PATH_REDIRECTS)) app.get(from, (_req, res) => res.redirect(301, to));
  app.use((_req, res) => res.status(404).send("PARENT FALLTHROUGH"));
  proxy = createServer(app); base = await listen(proxy);
});
afterAll(async () => { await stop(proxy); await stop(origin); });

describe("scoped Sunrun prefix proxy", () => {
  it("only matches the exact prefix, not other Sunrun routes", () => {
    expect(isSunrunReliefPath("/sunrun-solar-relief")).toBe(true);
    expect(isSunrunReliefPath("/sunrun-solar-relief/a")).toBe(true);
    for (const p of ["/sunrun", "/sunrun-solar-relief-other", "/blog/sunrun", "/assets/a.js", "/api/trpc"]) expect(isSunrunReliefPath(p)).toBe(false);
  });
  it.each(["/sunrun-solar-relief", "/sunrun-solar-relief/", "/sunrun-solar-relief/sunrun-contract-cancellation", "/sunrun-solar-relief/resources/find-sunrun-contract", "/sunrun-solar-relief/sitemap.xml", "/sunrun-solar-relief/robots.txt", "/sunrun-solar-relief/assets/app.js?one=a%2Fb&two=1&two=2"]) ("preserves complete path and query: %s", async p => {
    const r = await fetch(base + p); expect(r.status).toBe(200);
    expect(r.headers.get("x-sunrun-relief-proxy")).toBe("prefix-preserved");
    expect((await r.json()).url).toBe(p);
    expect(requests.at(-1)?.url).toBe(p);
    expect(requests.at(-1)?.headers).toMatchObject({ host: "breakyoursolarcontract.com", "x-forwarded-host": "breakyoursolarcontract.com", "x-forwarded-proto": "https" });
  });
  it("proxies the original POST stream before the parent's JSON body parser", async () => {
    const body = '{"content":"same bytes"}';
    const r = await fetch(base + "/sunrun-solar-relief/api/assessment?from=qr", { method: "POST", headers: { "content-type": "application/json" }, body });
    expect((await r.json()).body).toBe(body); expect(requests.at(-1)?.method).toBe("POST");
  });
  it("retains the exact /sunrun legacy redirect without intercepting this prefix", async () => {
    const n = requests.length;
    const r = await fetch(base + "/sunrun", { redirect: "manual" });
    expect(r.status).toBe(301); expect(r.headers.get("location")).toBe(PUBLIC_PATH_REDIRECTS["/sunrun"]); expect(requests.length).toBe(n);
    expect(await (await fetch(base + "/sunrun-solar-relief-other")).text()).toBe("PARENT FALLTHROUGH");
  });
  it("passes an upstream redirect through instead of following or sending a parent blog", async () => {
    const r = await fetch(base + "/sunrun-solar-relief/redirect", { redirect: "manual" });
    expect(r.status).toBe(307); expect(r.headers.get("location")).toBe("/sunrun-solar-relief/destination");
  });
  it("preserves compressed upstream documents", async () => {
    expect(await (await fetch(base + "/sunrun-solar-relief/gzip")).text()).toBe("unaltered upstream document");
  });
  it("does not forward parent login/API credentials to the external app", async () => {
    await fetch(base + "/sunrun-solar-relief/headers", { headers: { cookie: "app_session_id=parent-secret; subsite=allowed", authorization: "Bearer parent-secret", "x-api-key": "parent-secret", "x-forwarded-host": "attacker.invalid" } });
    expect(requests.at(-1)?.headers.cookie).toBe("subsite=allowed"); expect(requests.at(-1)?.headers.authorization).toBeUndefined(); expect(requests.at(-1)?.headers["x-api-key"]).toBeUndefined(); expect(requests.at(-1)?.headers["x-forwarded-host"]).toBe("breakyoursolarcontract.com");
    expect(withoutParentSession("app_session_id=secret")).toBeUndefined();
  });
  it("scopes upstream cookies and prevents replacing parent session or root service-worker scope", async () => {
    const r = await fetch(base + "/sunrun-solar-relief/cookies");
    const cookies = r.headers.getSetCookie(); expect(cookies).toHaveLength(1); expect(cookies[0]).toContain("Path=/sunrun-solar-relief/"); expect(cookies[0]).not.toContain("Domain="); expect(cookies[0]).not.toContain("app_session_id"); expect(r.headers.get("service-worker-allowed")).toBeNull();
  });
  it("returns real upstream failures without pretending the subsite is ready", async () => {
    const r = await fetch(base + "/sunrun-solar-relief/forbidden"); expect(r.status).toBe(403); expect(await r.text()).toBe("Upstream denied Host"); expect(r.headers.get("cache-control")).toBe("no-store");
    const failed = await fetch(base + "/sunrun-solar-relief/unavailable"); expect(failed.status).toBe(502); expect(await failed.text()).not.toContain("PARENT FALLTHROUGH");
  });
});
