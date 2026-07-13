/**
 * Deterministic production bundle budget.
 *
 * Vite's manifest is the source of truth for emitted asset names. The check
 * deliberately never guesses content-hashed filenames. Gzip measurements use
 * Node's default zlib settings, matching the size Vite reports during builds.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUTPUT_DIR = path.join(ROOT, "dist", "public");
const DEFAULT_MANIFEST_PATH = path.join(
  DEFAULT_OUTPUT_DIR,
  ".vite",
  "manifest.json"
);

const ENTRY_SOURCE = "index.html";
const HOME_SOURCE = "src/pages/Home.tsx";

// Current production baseline: 177,659 bytes gzip (2026-07-13).
// 195,000 bytes leaves 9.8% headroom for intentional small changes while
// still stopping a return to the previous 217,010-byte entry.
const ENTRY_GZIP_BUDGET_BYTES = 195_000;

function normalizeManifestPath(value) {
  return value.replaceAll("\\", "/").replace(/^\.\//, "");
}

function validateManifest(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error("Vite manifest must be a JSON object.");
  }
  return manifest;
}

function readManifest(manifestPath = DEFAULT_MANIFEST_PATH) {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `Vite manifest not found at ${path.relative(ROOT, manifestPath)}. Run pnpm build first.`
    );
  }

  try {
    return validateManifest(JSON.parse(fs.readFileSync(manifestPath, "utf8")));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Vite manifest is not valid JSON.");
    }
    throw error;
  }
}

function findManifestRecord(manifest, source, predicate = () => true) {
  const normalizedSource = normalizeManifestPath(source);
  const matches = Object.entries(validateManifest(manifest)).filter(
    ([key, record]) =>
      record &&
      typeof record === "object" &&
      normalizeManifestPath(record.src ?? key) === normalizedSource &&
      predicate(record)
  );

  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one Vite manifest record for ${source}; found ${matches.length}.`
    );
  }

  const [key, record] = matches[0];
  return { key, record };
}

function findProductionEntry(manifest) {
  return findManifestRecord(
    manifest,
    ENTRY_SOURCE,
    record => record.isEntry === true
  );
}

function resolveOutputAsset(outputDir, manifestFile) {
  if (typeof manifestFile !== "string" || manifestFile.length === 0) {
    throw new Error("Vite manifest contains an invalid asset path.");
  }

  const normalized = normalizeManifestPath(manifestFile);
  if (path.posix.isAbsolute(normalized)) {
    throw new Error(
      `Vite manifest asset path must be relative: ${manifestFile}`
    );
  }

  const outputRoot = path.resolve(outputDir);
  const absolute = path.resolve(outputRoot, ...normalized.split("/"));
  if (
    absolute !== outputRoot &&
    !absolute.startsWith(`${outputRoot}${path.sep}`)
  ) {
    throw new Error(
      `Vite manifest asset escapes output directory: ${manifestFile}`
    );
  }
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
    throw new Error(`Vite manifest asset is missing: ${manifestFile}`);
  }
  return absolute;
}

function gzipAssetBytes(outputDir, manifestFile) {
  return gzipSync(fs.readFileSync(resolveOutputAsset(outputDir, manifestFile)))
    .length;
}

function isBundleFile(file) {
  return /\.(?:css|js)$/i.test(file);
}

function collectStaticBundleFiles(manifest, rootKeys) {
  validateManifest(manifest);
  const visited = new Set();
  const files = new Set();

  function visit(key) {
    if (visited.has(key)) return;
    const record = manifest[key];
    if (!record || typeof record !== "object") {
      throw new Error(`Vite manifest import is missing: ${key}`);
    }
    visited.add(key);

    if (typeof record.file === "string" && isBundleFile(record.file)) {
      files.add(record.file);
    }
    for (const cssFile of record.css ?? []) {
      if (typeof cssFile !== "string") {
        throw new Error(`Vite manifest CSS path is invalid for ${key}.`);
      }
      files.add(cssFile);
    }
    for (const importedKey of record.imports ?? []) {
      if (typeof importedKey !== "string") {
        throw new Error(`Vite manifest import key is invalid for ${key}.`);
      }
      visit(importedKey);
    }
  }

  for (const key of rootKeys) visit(key);
  return [...files].sort();
}

function measureStaticClosure(manifest, outputDir, rootKeys) {
  const files = collectStaticBundleFiles(manifest, rootKeys);
  const gzipBytes = files.reduce(
    (total, file) => total + gzipAssetBytes(outputDir, file),
    0
  );
  return { files, gzipBytes };
}

function assertEntryBudget(actualBytes, budgetBytes = ENTRY_GZIP_BUDGET_BYTES) {
  if (!Number.isSafeInteger(actualBytes) || actualBytes < 0) {
    throw new Error("Entry gzip measurement must be a non-negative integer.");
  }
  if (!Number.isSafeInteger(budgetBytes) || budgetBytes <= 0) {
    throw new Error("Entry gzip budget must be a positive integer.");
  }
  if (actualBytes > budgetBytes) {
    throw new Error(
      `Production entry is ${actualBytes.toLocaleString("en-US")} bytes gzip; budget is ${budgetBytes.toLocaleString("en-US")} bytes (${(actualBytes - budgetBytes).toLocaleString("en-US")} bytes over).`
    );
  }
}

function inspectBundle({
  manifestPath = DEFAULT_MANIFEST_PATH,
  outputDir = DEFAULT_OUTPUT_DIR,
} = {}) {
  const manifest = readManifest(manifestPath);
  const entry = findProductionEntry(manifest);
  if (typeof entry.record.file !== "string") {
    throw new Error("Production entry record has no emitted file.");
  }

  const entryGzipBytes = gzipAssetBytes(outputDir, entry.record.file);
  assertEntryBudget(entryGzipBytes);

  let homeClosure = null;
  try {
    const home = findManifestRecord(manifest, HOME_SOURCE);
    homeClosure = measureStaticClosure(manifest, outputDir, [
      entry.key,
      home.key,
    ]);
  } catch (error) {
    if (!String(error?.message).includes(`for ${HOME_SOURCE}`)) throw error;
  }

  return {
    entryFile: entry.record.file,
    entryGzipBytes,
    entryBudgetBytes: ENTRY_GZIP_BUDGET_BYTES,
    homeClosure,
  };
}

function main() {
  try {
    const report = inspectBundle();
    const headroom = report.entryBudgetBytes - report.entryGzipBytes;
    console.log(
      `Bundle budget passed: production entry ${report.entryGzipBytes.toLocaleString("en-US")} / ${report.entryBudgetBytes.toLocaleString("en-US")} bytes gzip (${headroom.toLocaleString("en-US")} bytes headroom).`
    );
    if (report.homeClosure) {
      console.log(
        `Informational home static JS/CSS closure: ${report.homeClosure.gzipBytes.toLocaleString("en-US")} bytes gzip across ${report.homeClosure.files.length} manifest-mapped files.`
      );
    } else {
      console.log(
        `Informational home closure unavailable: ${HOME_SOURCE} was not emitted as a distinct manifest entry.`
      );
    }
  } catch (error) {
    console.error(`Bundle budget failed: ${error.message}`);
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) main();

export {
  ENTRY_GZIP_BUDGET_BYTES,
  assertEntryBudget,
  collectStaticBundleFiles,
  findProductionEntry,
  inspectBundle,
  measureStaticClosure,
  resolveOutputAsset,
};
