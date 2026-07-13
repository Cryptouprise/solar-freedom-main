/**
 * Fetch page-level Search Analytics data from Google Search Console.
 *
 * Credentials are read from GOOGLE_SERVICE_ACCOUNT_JSON (preferred) or the
 * legacy GSC_SERVICE_ACCOUNT_JSON alias. They are never written or logged.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleAuth } from "google-auth-library";
import {
  normalizeSearchAnalyticsRows,
  parseServiceAccountJson,
  resolveDateRange,
  sha256,
  toLegacyCsv,
} from "./lib/gsc-core.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_URL = "https://searchconsole.googleapis.com/webmasters/v3/sites";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const PAGE_SIZE = 25_000;

function parseArgs(argv) {
  const args = {
    property: process.env.GSC_PROPERTY_URL || "sc-domain:breakyoursolarcontract.com",
    startDate: process.env.GSC_START_DATE,
    endDate: process.env.GSC_END_DATE,
    days: Number(process.env.GSC_DATE_RANGE_DAYS || 28),
    dataLagDays: Number(process.env.GSC_DATA_LAG_DAYS || 3),
    maxRows: Number(process.env.GSC_MAX_ROWS || 100_000),
    outJson: path.resolve(ROOT, process.env.GSC_OUT_JSON || "gsc_all_pages.json"),
    outCsv: path.resolve(ROOT, process.env.GSC_OUT_CSV || "gsc_report.csv"),
    metadata: path.resolve(ROOT, process.env.GSC_METADATA_JSON || "gsc_data_metadata.json"),
    allowEmpty: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--property" && next) args.property = next;
    if (arg === "--start-date" && next) args.startDate = next;
    if (arg === "--end-date" && next) args.endDate = next;
    if (arg === "--days" && next) args.days = Number(next);
    if (arg === "--data-lag-days" && next) args.dataLagDays = Number(next);
    if (arg === "--max-rows" && next) args.maxRows = Number(next);
    if (arg === "--out-json" && next) args.outJson = path.resolve(ROOT, next);
    if (arg === "--out-csv" && next) args.outCsv = path.resolve(ROOT, next);
    if (arg === "--metadata" && next) args.metadata = path.resolve(ROOT, next);
    if (arg === "--allow-empty") args.allowEmpty = true;
  }

  if (!args.property) throw new Error("GSC_PROPERTY_URL is required.");
  args.days = Math.max(1, Math.floor(args.days || 28));
  args.dataLagDays = Math.max(0, Math.floor(args.dataLagDays || 0));
  args.maxRows = Math.max(1, Math.floor(args.maxRows || 100_000));
  return args;
}

export async function fetchSearchAnalytics({ client, property, startDate, endDate, maxRows }) {
  const rows = [];
  const aggregationTypes = new Set();
  let startRow = 0;
  let lastBatchSize = 0;

  while (rows.length < maxRows) {
    const rowLimit = Math.min(PAGE_SIZE, maxRows - rows.length);
    const response = await client.request({
      url: `${API_URL}/${encodeURIComponent(property)}/searchAnalytics/query`,
      method: "POST",
      data: {
        startDate,
        endDate,
        dimensions: ["page"],
        dataState: "final",
        rowLimit,
        startRow,
      },
    });
    const batch = normalizeSearchAnalyticsRows(response.data?.rows || []);
    if (response.data?.responseAggregationType) {
      aggregationTypes.add(response.data.responseAggregationType);
    }
    rows.push(...batch);
    lastBatchSize = batch.length;
    if (batch.length < rowLimit) break;
    startRow += batch.length;
  }

  return {
    rows,
    truncated: rows.length >= maxRows && lastBatchSize === Math.min(PAGE_SIZE, maxRows - (rows.length - lastBatchSize)),
    aggregationTypes: [...aggregationTypes],
  };
}

async function writeAtomic(filePath, contents) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(tempPath, contents, "utf-8");
  await fs.rename(tempPath, filePath);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const range = resolveDateRange(args);
  const rawCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GSC_SERVICE_ACCOUNT_JSON;
  const credentials = parseServiceAccountJson(rawCredentials);
  const auth = new GoogleAuth({ credentials, scopes: [SCOPE] });
  const client = await auth.getClient();
  const result = await fetchSearchAnalytics({
    client,
    property: args.property,
    ...range,
    maxRows: args.maxRows,
  });

  if (!result.rows.length && !args.allowEmpty) {
    throw new Error("GSC returned zero page rows. Check the property, permissions, and date range before replacing the prior snapshot.");
  }

  const json = `${JSON.stringify(result.rows, null, 2)}\n`;
  const csv = toLegacyCsv(result.rows);
  const fetchedAt = new Date().toISOString();
  const metadata = {
    schemaVersion: 1,
    source: "google_search_console_api",
    fetchedAt,
    property: args.property,
    ...range,
    dimensions: ["page"],
    dataState: "final",
    rowCount: result.rows.length,
    truncated: result.truncated,
    aggregationTypes: result.aggregationTypes,
    outputs: {
      json: path.relative(ROOT, args.outJson),
      csv: path.relative(ROOT, args.outCsv),
      jsonSha256: sha256(json),
      csvSha256: sha256(csv),
    },
  };

  await writeAtomic(args.outJson, json);
  await writeAtomic(args.outCsv, csv);
  await writeAtomic(args.metadata, `${JSON.stringify(metadata, null, 2)}\n`);

  console.log("GSC Search Analytics refresh complete.");
  console.log(`Property: ${args.property}`);
  console.log(`Date range: ${range.startDate} through ${range.endDate}`);
  console.log(`Page rows: ${result.rows.length}${result.truncated ? " (truncated)" : ""}`);
  console.log(`Metadata: ${path.relative(ROOT, args.metadata)}`);
}

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`[GSC Refresh] ${error.message}`);
    process.exitCode = 1;
  });
}
