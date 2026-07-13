import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const DAY_MS = 24 * 60 * 60 * 1000;

export function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

export function resolveDateRange({
  startDate,
  endDate,
  days = 28,
  dataLagDays = 3,
  now = new Date(),
} = {}) {
  const resolvedEnd = endDate
    ? new Date(`${endDate}T00:00:00.000Z`)
    : new Date(now.getTime() - Math.max(0, dataLagDays) * DAY_MS);
  const resolvedStart = startDate
    ? new Date(`${startDate}T00:00:00.000Z`)
    : new Date(resolvedEnd.getTime() - (Math.max(1, days) - 1) * DAY_MS);

  if (Number.isNaN(resolvedStart.getTime()) || Number.isNaN(resolvedEnd.getTime())) {
    throw new Error("GSC start/end dates must use YYYY-MM-DD.");
  }
  if (resolvedStart > resolvedEnd) {
    throw new Error("GSC start date must not be after the end date.");
  }

  return { startDate: isoDate(resolvedStart), endDate: isoDate(resolvedEnd) };
}

export function parseServiceAccountJson(raw) {
  if (!raw?.trim()) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_JSON (or legacy GSC_SERVICE_ACCOUNT_JSON). Store a rotated key in the runtime secret manager."
    );
  }

  let credentials;
  try {
    credentials = JSON.parse(raw);
  } catch {
    throw new Error("The GSC service-account secret is not valid JSON.");
  }

  if (credentials.type !== "service_account" || !credentials.client_email || !credentials.private_key) {
    throw new Error("The GSC credential must be a complete Google service-account JSON object.");
  }
  return credentials;
}

export function normalizeSearchAnalyticsRows(rows = []) {
  return rows
    .filter((row) => Array.isArray(row?.keys) && row.keys[0])
    .map((row) => ({
      keys: [String(row.keys[0])],
      clicks: Number(row.clicks || 0),
      impressions: Number(row.impressions || 0),
      ctr: Number(row.ctr || 0),
      position: Number(row.position || 0),
    }));
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toLegacyCsv(rows) {
  const lines = ["page,clicks,impressions,ctr,position"];
  for (const row of rows) {
    lines.push([
      row.keys[0],
      row.clicks,
      row.impressions,
      (row.ctr * 100).toFixed(4),
      row.position.toFixed(4),
    ].map(csvCell).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function verifyGscOutputHashes(metadata, { rootDir = process.cwd() } = {}) {
  const outputs = metadata?.outputs;
  if (!outputs?.json || !outputs?.csv || !outputs?.jsonSha256 || !outputs?.csvSha256) {
    return ["output_hashes_missing"];
  }

  const root = path.resolve(rootDir);
  const resolveInsideRoot = (relativePath) => {
    const resolved = path.resolve(root, String(relativePath));
    if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
      throw new Error("output_path_invalid");
    }
    return resolved;
  };

  try {
    const [json, csv] = await Promise.all([
      fs.readFile(resolveInsideRoot(outputs.json)),
      fs.readFile(resolveInsideRoot(outputs.csv)),
    ]);
    const reasons = [];
    if (sha256(json) !== outputs.jsonSha256) reasons.push("json_hash_mismatch");
    if (sha256(csv) !== outputs.csvSha256) reasons.push("csv_hash_mismatch");
    return reasons;
  } catch (error) {
    return [error?.message === "output_path_invalid" ? "output_path_invalid" : "output_file_missing"];
  }
}

export function evaluateGscFreshness(metadata, {
  now = new Date(),
  maxAgeHours = 36,
} = {}) {
  const reasons = [];
  const fetchedAt = metadata?.fetchedAt ? new Date(metadata.fetchedAt) : null;
  const ageHours = fetchedAt && !Number.isNaN(fetchedAt.getTime())
    ? (now.getTime() - fetchedAt.getTime()) / (60 * 60 * 1000)
    : null;

  if (!metadata) reasons.push("metadata_missing");
  if (!fetchedAt || Number.isNaN(fetchedAt.getTime())) reasons.push("fetched_at_missing_or_invalid");
  if (ageHours !== null && ageHours > maxAgeHours) reasons.push("snapshot_stale");
  if (ageHours !== null && ageHours < -1) reasons.push("fetched_at_in_future");
  if (!metadata?.property) reasons.push("property_missing");
  if (!Number.isInteger(metadata?.rowCount) || metadata.rowCount < 0) reasons.push("row_count_invalid");
  if (metadata?.truncated) reasons.push("result_truncated");

  return {
    usable: reasons.length === 0,
    state: reasons.length === 0 ? "fresh" : reasons.includes("snapshot_stale") ? "stale" : "unavailable",
    checkedAt: now.toISOString(),
    maxAgeHours,
    ageHours: ageHours === null ? null : Number(ageHours.toFixed(2)),
    source: metadata?.source || null,
    fetchedAt: metadata?.fetchedAt || null,
    property: metadata?.property || null,
    startDate: metadata?.startDate || null,
    endDate: metadata?.endDate || null,
    rowCount: Number.isInteger(metadata?.rowCount) ? metadata.rowCount : null,
    reasons,
  };
}

export async function readGscMeasurementGate({ statusPath, requireFresh = false }) {
  let status = null;
  try {
    status = JSON.parse(await fs.readFile(statusPath, "utf-8"));
  } catch {
    // Missing status is reported below when freshness is required.
  }

  if (!requireFresh) {
    return {
      usable: true,
      state: status?.state || "unchecked",
      checked: Boolean(status),
      reasons: status?.reasons || [],
    };
  }

  return {
    usable: status?.usable === true,
    state: status?.state || "unavailable",
    checked: Boolean(status),
    reasons: status?.reasons || ["freshness_status_missing"],
  };
}
