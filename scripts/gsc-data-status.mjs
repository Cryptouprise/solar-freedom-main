import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateGscFreshness, verifyGscOutputHashes } from "./lib/gsc-core.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const args = {
    metadata: path.resolve(ROOT, process.env.GSC_METADATA_JSON || "gsc_data_metadata.json"),
    out: path.resolve(ROOT, process.env.SEO_GSC_STATUS_JSON || "reports/seo-agent/gsc-status.json"),
    maxAgeHours: Number(process.env.GSC_MAX_AGE_HOURS || 36),
    failOnStale: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--metadata" && next) args.metadata = path.resolve(ROOT, next);
    if (arg === "--out" && next) args.out = path.resolve(ROOT, next);
    if (arg === "--max-age-hours" && next) args.maxAgeHours = Number(next);
    if (arg === "--fail-on-stale") args.failOnStale = true;
  }
  args.maxAgeHours = Math.max(1, args.maxAgeHours || 36);
  return args;
}

async function readMetadata(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf-8"));
  } catch {
    return null;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const metadata = await readMetadata(args.metadata);
  const freshness = evaluateGscFreshness(metadata, { maxAgeHours: args.maxAgeHours });
  const integrityReasons = await verifyGscOutputHashes(metadata, { rootDir: ROOT });
  const reasons = [...freshness.reasons, ...integrityReasons];
  const status = {
    schemaVersion: 1,
    metadataFile: path.relative(ROOT, args.metadata),
    ...freshness,
    usable: freshness.usable && integrityReasons.length === 0,
    state: freshness.usable && integrityReasons.length > 0 ? "unavailable" : freshness.state,
    reasons,
  };
  await fs.mkdir(path.dirname(args.out), { recursive: true });
  await fs.writeFile(args.out, `${JSON.stringify(status, null, 2)}\n`, "utf-8");

  console.log(`GSC data state: ${status.state}`);
  console.log(`Usable for measurement: ${status.usable ? "yes" : "no"}`);
  console.log(`Reasons: ${status.reasons.length ? status.reasons.join(", ") : "none"}`);
  console.log(`Status: ${path.relative(ROOT, args.out)}`);
  if (args.failOnStale && !status.usable) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`[GSC Status] ${error.message}`);
  process.exitCode = 1;
});
