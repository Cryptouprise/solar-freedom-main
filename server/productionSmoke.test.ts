import { afterEach, describe, expect, it, vi } from "vitest";
import {
  extractJsAssetPaths,
  findSecretMarkerCodes,
  run,
} from "../scripts/production-smoke.mjs";

describe("production smoke safety helpers", () => {
  it("extracts unique same-origin JavaScript asset paths", () => {
    expect(
      extractJsAssetPaths(`
        <script src="/assets/index-abc.js"></script>
        import("assets/AdminContent-def.js");
        import("/assets/index-abc.js");
      `)
    ).toEqual(["/assets/index-abc.js", "/assets/AdminContent-def.js"]);
  });

  describe("priority page indexing smoke checks", () => {
    afterEach(() => vi.unstubAllGlobals());

    const canonicalBase = "https://breakyoursolarcontract.com";
    const routes = [
      "/", "/blog/how-to-get-out-of-a-solar-contract",
      "/solar-panel-scam",
      "/cancel-solar-contract/dallas-tx",
      "/solar-loan-help", "/solar-lien-removal", "/selling-house-with-solar",
    ];
    function mockSite({ noindexLoan = false, missingLoan = false } = {}) {
      vi.stubGlobal("fetch", vi.fn(async (url: URL) => {
        const pathname = url.pathname;
        if (pathname === "/sitemap.xml") {
          return new Response(`<urlset>${routes.filter(route => !missingLoan || route !== "/solar-loan-help")
            .map(route => `<url><loc>${canonicalBase}${route}</loc></url>`).join("")}</urlset>`);
        }
        if (pathname === "/robots.txt") return new Response(`Sitemap: ${canonicalBase}/sitemap.xml`);
        if (pathname === "/api/admin/status") return new Response("", { status: 401 });
        if (pathname === "/blog/solar-panel-scam-signs-what-to-do") {
          return new Response("", { status: 301, headers: { location: "/solar-panel-scam" } });
        }
        const unknown = pathname.startsWith("/__production_smoke_not_found__");
        const noindex = unknown || pathname.startsWith("/admin/") || (noindexLoan && pathname === "/solar-loan-help");
        return new Response(`<html><head>${unknown ? "" : `<link rel="canonical" href="${canonicalBase}${pathname}">`}
          <meta name="robots" content="${noindex ? "noindex" : "index"}, follow"></head>
          <body><h1>Solar records and options</h1><p>${"Useful content ".repeat(100)}</p></body></html>`,
          { status: unknown ? 404 : 200 });
      }));
    }

    it("accepts focused sitemap inventory and verifies production canonicals on a local build", async () => {
      mockSite();
      const report = await run({ baseUrl: "http://localhost:3000", canonicalBase, timeoutMs: 1000, skipAssets: true });
      expect(report.passed).toBe(true);
      expect(report.checks.find((check: { name: string }) => check.name === "loan_help_indexable")?.passed).toBe(true);
    });

    it("fails when a priority page is noindexed or omitted from the sitemap", async () => {
      mockSite({ noindexLoan: true, missingLoan: true });
      const report = await run({ baseUrl: "http://localhost:3000", canonicalBase, timeoutMs: 1000, skipAssets: true });
      expect(report.checks.filter((check: { passed: boolean }) => !check.passed).map((check: { name: string }) => check.name))
        .toEqual(["loan_help_indexable", "sitemap_inventory"]);
    });
  });

  it("reports marker codes without returning matched secret values", () => {
    const source = [
      "sf_" + "a".repeat(64),
      "https://services." + "leadconnectorhq.com/hooks/" + "x".repeat(32),
      "-----BEGIN PRIVATE KEY-----",
    ].join("\n");
    const codes = findSecretMarkerCodes(source);

    expect(codes).toEqual([
      "embedded_admin_api_key",
      "embedded_crm_webhook",
      "embedded_private_key",
    ]);
    expect(JSON.stringify(codes)).not.toContain("sf_");
    expect(JSON.stringify(codes)).not.toContain("leadconnectorhq");
  });

  it("does not flag documented placeholders", () => {
    expect(findSecretMarkerCodes("Authorization: Bearer <scoped-key-from-your-secret-manager>")).toEqual([]);
  });
});
