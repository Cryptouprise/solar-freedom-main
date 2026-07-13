import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

// @ts-expect-error The build-time budget script intentionally remains plain ESM.
import {
  assertEntryBudget,
  collectStaticBundleFiles,
  findProductionEntry,
  measureStaticClosure,
  resolveOutputAsset,
} from "../scripts/check-bundle-budget.mjs";

const temporaryDirectories: string[] = [];

function makeOutputDirectory() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "bundle-budget-"));
  temporaryDirectories.push(directory);
  fs.mkdirSync(path.join(directory, "assets"));
  return directory;
}

function fixtureManifest() {
  return {
    "index.html": {
      file: "assets/app-arbitrary-hash.js",
      src: "index.html",
      isEntry: true,
      imports: ["_shared.js"],
      dynamicImports: ["src/pages/Home.tsx", "src/pages/Blog.tsx"],
      css: ["assets/app-arbitrary-hash.css"],
    },
    "_shared.js": {
      file: "assets/shared-another-hash.js",
    },
    "src/pages/Home.tsx": {
      file: "assets/home-unpredictable-hash.js",
      src: "src/pages/Home.tsx",
      isDynamicEntry: true,
      imports: ["_shared.js"],
      css: ["assets/home-unpredictable-hash.css"],
    },
    "src/pages/Blog.tsx": {
      file: "assets/blog-must-not-be-counted.js",
      src: "src/pages/Blog.tsx",
      isDynamicEntry: true,
    },
  };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("production bundle budget", () => {
  it("identifies the entry from manifest metadata instead of its hashed filename", () => {
    const entry = findProductionEntry(fixtureManifest());

    expect(entry.key).toBe("index.html");
    expect(entry.record.file).toBe("assets/app-arbitrary-hash.js");
  });

  it("counts the home static closure once and excludes unrelated dynamic routes", () => {
    const manifest = fixtureManifest();
    const files = collectStaticBundleFiles(manifest, [
      "index.html",
      "src/pages/Home.tsx",
    ]);

    expect(files).toEqual([
      "assets/app-arbitrary-hash.css",
      "assets/app-arbitrary-hash.js",
      "assets/home-unpredictable-hash.css",
      "assets/home-unpredictable-hash.js",
      "assets/shared-another-hash.js",
    ]);
    expect(files).not.toContain("assets/blog-must-not-be-counted.js");
  });

  it("measures gzip bytes from the manifest-mapped files", () => {
    const outputDir = makeOutputDirectory();
    const manifest = fixtureManifest();
    const files = collectStaticBundleFiles(manifest, [
      "index.html",
      "src/pages/Home.tsx",
    ]);
    for (const [index, file] of files.entries()) {
      fs.writeFileSync(
        path.join(outputDir, file),
        `fixture-${index}`.repeat(50)
      );
    }

    const report = measureStaticClosure(manifest, outputDir, [
      "index.html",
      "src/pages/Home.tsx",
    ]);

    expect(report.files).toEqual(files);
    expect(report.gzipBytes).toBeGreaterThan(0);
  });

  it("fails closed when the entry exceeds its budget", () => {
    expect(() => assertEntryBudget(195_000, 195_000)).not.toThrow();
    expect(() => assertEntryBudget(195_001, 195_000)).toThrow(/1 bytes over/);
  });

  it("rejects manifest assets that escape the build output", () => {
    const outputDir = makeOutputDirectory();

    expect(() => resolveOutputAsset(outputDir, "../outside.js")).toThrow(
      /escapes output directory/
    );
  });
});
