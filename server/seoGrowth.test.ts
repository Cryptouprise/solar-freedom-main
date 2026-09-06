import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
import { buildMetaMap as serverMeta } from "./seo-meta";
import priorityMeta from "../shared/priority-page-meta.json";
import serviceGuidance from "../shared/service-guidance.json";
import blogRouteSlugs from "../shared/blog-route-slugs.json";
import { blogPosts } from "../client/src/data/blog";

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(dirs.splice(0).map(dir => fs.rm(dir, { recursive: true, force: true })));
});

async function snapshot(overrides: Record<string, unknown> = {}) {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "solar-ctr-"));
  dirs.push(rootDir);
  const json = JSON.stringify([
    { keys: ["https://breakyoursolarcontract.com/solar-loan-help"], clicks: 1, impressions: 100, ctr: 0.01, position: 8 },
  ]);
  const csv = "page,clicks,impressions,ctr,position\n";
  const hash = (value: string) => createHash("sha256").update(value).digest("hex");
  const args = {
    gscJson: path.join(rootDir, "pages.json"),
    gscCsv: path.join(rootDir, "pages.csv"),
    gscMetadata: path.join(rootDir, "metadata.json"),
    property: "sc-domain:breakyoursolarcontract.com",
  };
  await Promise.all([
    fs.writeFile(args.gscJson, json),
    fs.writeFile(args.gscCsv, csv),
    fs.writeFile(args.gscMetadata, JSON.stringify({
      fetchedAt: "2026-09-06T00:00:00Z",
      property: args.property,
      rowCount: 1,
      outputs: { json: "pages.json", csv: "pages.csv", jsonSha256: hash(json), csvSha256: hash(csv) },
      ...overrides,
    })),
  ]);
  return { args, options: { rootDir, now: new Date("2026-09-06T02:00:00Z") } };
}

describe("evidence-based CTR opportunities", () => {
  it("uses fresh, property-matched and hash-verified snapshots", async () => {
    const { loadPerformance } = await import("../scripts/seo-ctr-rescue.mjs");
    const { args, options } = await snapshot();
    const result = await loadPerformance(args, options);
    expect(result.gate.usable).toBe(true);
    expect(result.rows[0].ctr).toBe(1);
  });

  it.each([
    [{ fetchedAt: "2026-08-01T00:00:00Z" }, "snapshot_stale"],
    [{ property: "sc-domain:other.example" }, "property_mismatch"],
    [{ truncated: true }, "result_truncated"],
  ])("blocks invalid evidence %j", async (overrides, reason) => {
    const { loadPerformance } = await import("../scripts/seo-ctr-rescue.mjs");
    const { args, options } = await snapshot(overrides);
    const result = await loadPerformance(args, options);
    expect(result.rows).toEqual([]);
    expect(result.gate.reasons).toContain(reason);
  });

  it("rejects modified exports and unrelated input files even with fresh metadata", async () => {
    const { loadPerformance } = await import("../scripts/seo-ctr-rescue.mjs");
    const { args, options } = await snapshot();
    await fs.writeFile(args.gscJson, "[]");
    expect((await loadPerformance(args, options)).gate.reasons).toContain("json_hash_mismatch");
    args.gscJson = path.join(options.rootDir, "other.json");
    expect((await loadPerformance(args, options)).gate.reasons).toContain("snapshot_path_mismatch");
  });

  it("blocks missing metadata instead of inventing opportunities", async () => {
    const { loadPerformance } = await import("../scripts/seo-ctr-rescue.mjs");
    const { args, options } = await snapshot();
    await fs.rm(args.gscMetadata);
    expect((await loadPerformance(args, options)).rows).toEqual([]);
  });

  it("excludes private paths, off-site URLs and invalid metrics", async () => {
    const { selectCandidates } = await import("../scripts/seo-ctr-rescue.mjs");
    const base = "https://breakyoursolarcontract.com";
    const row = { clicks: 1, impressions: 100, ctr: 1, position: 8 };
    const rows = [
      { ...row, url: `${base}/solar-loan-help` },
      ...["https://other.example/", `${base}/admin/leads`, `${base}/api/leads`, `${base}/?phone=123`, "invalid"].map(url => ({ ...row, url })),
      { ...row, url: base, impressions: Infinity },
    ];
    expect(selectCandidates(rows, { base, minImpressions: 20, maxCtr: 1.5, maxPosition: 20, limit: 10 }))
      .toEqual([{ ...rows[0], score: 160 }]);
  });
});

describe("priority service metadata delivery", () => {
  it("keeps server and prerender snippets and canonicals identical", async () => {
    const { buildMetaMap, buildShellHtml } = await import("../scripts/prerender.mjs");
    const prerenderMeta = buildMetaMap([], [], [], {});
    const liveMeta = serverMeta();
    for (const [pathname, meta] of Object.entries(priorityMeta)) {
      expect(liveMeta[pathname]).toMatchObject(meta);
      expect(prerenderMeta[pathname]).toMatchObject(meta);
      expect(liveMeta[pathname].canonical).toBe(`https://breakyoursolarcontract.com${pathname}`);
      expect(liveMeta[pathname].noindex).not.toBe(true);
      expect(meta.title.length).toBeLessThanOrEqual(60);
      const html = buildShellHtml(prerenderMeta[pathname], "/assets/app.js", "/assets/app.css", pathname);
      const $ = cheerio.load(html);
      expect($("h1").text().length).toBeGreaterThan(10);
      expect($("body").text()).toContain("review");
      expect($("body").text()).toContain(serviceGuidance.disclosure);
      expect($("body").text()).toContain("The advertised free initial review");
      expect($('nav[aria-label="Related review resources"] a').length).toBeGreaterThan(0);
    }
  });

  it("registers all blog routes without downloading article bodies on every visit", async () => {
    expect(new Set(blogRouteSlugs)).toEqual(new Set(blogPosts.map(post => post.slug)));
    const entry = await fs.readFile(new URL("../client/src/main.tsx", import.meta.url), "utf-8");
    expect(entry).toContain('import blogRouteSlugs from "@shared/blog-route-slugs.json"');
    expect(entry).not.toContain('import("./data/blog")');
  });
});
