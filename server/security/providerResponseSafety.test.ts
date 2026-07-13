import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "../..");

describe("upstream provider error sanitization", () => {
  it("does not place provider response bodies in active server error messages", () => {
    const files = [
      "server/ga4.ts",
      "server/storage.ts",
      "server/cron/aiCostTracker.ts",
      "server/cron/backlinkDiscovery.ts",
      "server/_core/dataApi.ts",
      "server/_core/heartbeat.ts",
      "server/_core/imageGeneration.ts",
      "server/_core/llm.ts",
      "server/_core/map.ts",
    ];

    for (const relativePath of files) {
      const source = fs.readFileSync(path.join(ROOT, relativePath), "utf8");
      expect(source, relativePath).not.toMatch(/await\s+(?:res|response)\.text\s*\(/);
    }
  });

  it("keeps OpenRouter failure output in public scripts status-only", () => {
    const source = fs.readFileSync(path.join(ROOT, "scripts/seo-growth-agent.mjs"), "utf8");
    const failureBranch = source.slice(
      source.indexOf("if (!response.ok)"),
      source.indexOf("const payload = await response.json()"),
    );
    expect(failureBranch).toContain("HTTP ${response.status}");
    expect(failureBranch).not.toContain("response.text");
  });

  it("keeps disabled legacy submission errors free of provider bodies", () => {
    const source = fs.readFileSync(path.join(ROOT, "server/cron/pressRelease.ts"), "utf8");
    expect(source).not.toContain("PRLog returned: ${text");
    expect(source).not.toContain("NewsByWire returned ${response.status}: ${text");
    expect(source).not.toMatch(/errorMessage:\s*String\(err\)/);
  });

  it("keeps unreachable browser publishers and voice proxy code out of the runtime", () => {
    for (const relativePath of [
      "server/cron/highDaSubmitters.ts",
      "server/cron/prSubmitter.ts",
      "server/cron/prWireSubmitters.ts",
      "server/_core/voiceTranscription.ts",
    ]) {
      expect(fs.existsSync(path.join(ROOT, relativePath)), relativePath).toBe(false);
    }
  });
});
