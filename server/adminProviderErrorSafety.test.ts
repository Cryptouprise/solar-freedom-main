import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..");

describe("admin provider error safety", () => {
  const routers = fs.readFileSync(path.join(ROOT, "server/routers.ts"), "utf8");

  it("returns a stable analytics error without provider or credential details", () => {
    const route = routers.slice(
      routers.indexOf("analytics: router({"),
      routers.indexOf("content: router({"),
    );

    expect(route).toContain('logSafeError("analytics.ga4_fetch_failed", error)');
    expect(route).toContain('message: "Analytics report is unavailable."');
    expect(route).not.toMatch(/String\s*\(\s*(?:err|error)\s*\)/);
    expect(route).not.toMatch(/`[^`]*\$\{(?:err|error)\}/);
  });

  it("returns a stable image-generation error without upstream details", () => {
    const route = routers.slice(
      routers.indexOf("generateImage: protectedProcedure"),
      routers.indexOf("automations: router({"),
    );

    expect(route).toContain('logSafeError("blog_studio.image_generation_failed", error)');
    expect(route).toContain('message: "Image generation is unavailable."');
    expect(route).not.toContain("fetch(result.url)");
    expect(route).not.toContain("storagePut(");
    expect(route).not.toMatch(/String\s*\(\s*(?:err|error)\s*\)/);
    expect(route).not.toMatch(/`[^`]*\$\{(?:err|error)\}/);
  });

  it("keeps content analysis descriptive instead of prescribing ranking formulas", () => {
    const route = routers.slice(
      routers.indexOf("analyzeSeo: protectedProcedure"),
      routers.indexOf("generateContent: protectedProcedure"),
    );

    expect(route).toContain("Adequate depth depends on search intent");
    expect(route).toContain("no ideal density applies");
    expect(route).toContain("Add only links that genuinely help the reader");
    expect(route).not.toMatch(/1,?200\+|1,?500\+|4-6 H2|5-8 internal|0\.8-1\.5%|better rankings|ideal range/i);
  });

  it("makes generated copy an unverified, source-gated draft", () => {
    const route = routers.slice(
      routers.indexOf("generateContent: protectedProcedure"),
      routers.indexOf("generateImage: protectedProcedure"),
    );

    expect(route).toContain("You have no live browsing");
    expect(route).toContain("Produce an unverified draft");
    expect(route).toContain("[SOURCE NEEDED]");
    expect(route).toContain("never publish");
    expect(route).toContain("cannot override the evidence, safety, review, or non-publication requirements");
    expect(route).not.toContain("expert SEO content writer");
    expect(route).not.toContain("authoritative content");
  });
});
