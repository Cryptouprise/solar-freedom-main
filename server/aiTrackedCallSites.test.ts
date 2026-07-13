import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..");

describe("active writing calls use the provider-cost boundary", () => {
  it("routes Blog Studio generation through callLLM with a stable feature label", () => {
    const source = fs.readFileSync(path.join(ROOT, "server/routers.ts"), "utf8");
    const start = source.indexOf("generateContent: protectedProcedure");
    const end = source.indexOf("generateImage: protectedProcedure", start);
    const generateContent = source.slice(start, end);

    expect(generateContent).toContain("callLLM({");
    expect(generateContent).toContain('feature: "blog_studio"');
    expect(generateContent).not.toContain("api/v1/chat/completions");
  });

  it("routes press-release drafts through JSON-mode callLLM with topic attribution", () => {
    const source = fs.readFileSync(path.join(ROOT, "server/cron/pressRelease.ts"), "utf8");
    const start = source.indexOf("async function generatePressRelease");
    const end = source.indexOf("export interface PressRunResult", start);
    const generateDraft = source.slice(start, end);

    expect(generateDraft).toContain("callLLM({");
    expect(generateDraft).toContain('feature: "press_release_draft"');
    expect(generateDraft).toContain('referenceType: "press_release_topic"');
    expect(generateDraft).toContain('responseFormat: { type: "json_object" }');
    expect(generateDraft).not.toContain("api/v1/chat/completions");
  });
});
