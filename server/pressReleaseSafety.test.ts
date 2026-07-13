import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runPressReleaseCycle, startPressReleaseCron, stopPressReleaseCron } from "./cron/pressRelease";

const ROOT = path.resolve(import.meta.dirname, "..");

describe("press release execution boundary", () => {
  afterEach(() => {
    stopPressReleaseCron();
    vi.useRealTimers();
  });

  it("rejects every live-publication request before network or database work", async () => {
    await expect(runPressReleaseCycle({ dryRun: false })).rejects.toThrow(
      /External publication is disabled/
    );
  });

  it("does not schedule an in-process publisher", () => {
    vi.useFakeTimers();
    startPressReleaseCron();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not compile legacy distribution or browser-login implementations", () => {
    const source = fs.readFileSync(
      path.join(ROOT, "server/cron/pressRelease.ts"),
      "utf8",
    );

    expect(source).not.toMatch(/submitTo(?:PRLog|NewsByWire)/);
    expect(source).not.toContain("prlog.org");
    expect(source).not.toContain("newsbywire.com");
    expect(source).not.toContain("import('playwright')");
    expect(source).not.toContain("setInterval(");
    expect(source).not.toContain("pressReleaseLogs");
  });

  it("treats generated press-release copy as an unverified draft", () => {
    const prompt = fs.readFileSync(
      path.join(ROOT, "server/prompts/press-release.md"),
      "utf8",
    );

    expect(prompt).toContain("no live web access and no independent evidence");
    expect(prompt).toContain("[SOURCE NEEDED]");
    expect(prompt).toContain("[NEWS HOOK NOT VERIFIED]");
    expect(prompt).toContain("unverified internal draft");
    expect(prompt).not.toContain("Key facts to weave into press releases");
    expect(prompt).not.toContain("City: Jacksonville, FL");
  });
});
