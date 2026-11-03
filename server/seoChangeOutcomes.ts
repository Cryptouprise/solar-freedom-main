import { and, asc, eq, isNull } from "drizzle-orm";
import { seoChangeLog, seoPages, type SeoChangeLog } from "../drizzle/schema";

/** No rolling snapshot subtraction, model calls, timers, or import-time I/O. */
export const SEO_OUTCOME_LIMITS = Object.freeze({
  maxChangesPerCycle: 3,
  windowDays: 7,
  finalizationLagDays: 4,
  minimumImpressionsPerWindow: 30,
  maxHistoryDays: 450,
  maxContextRows: 2_000,
  maxMetadataBytes: 60_000,
  requestTimeoutMs: 10_000,
});
export const SEO_OUTCOME_METADATA_KEY = "_seoOutcomeMeasurementV1";
export const SEO_OUTCOME_WARNING = "Observed before/after association, not attributable or causal lift. Seasonality, demand, ranking changes, unlogged edits, and other external factors are uncontrolled. createdAt is the change-log time, not independently verified deployment time. Confound detection covers recorded edits only.";
const PROPERTY = "sc-domain:breakyoursolarcontract.com";
const ORIGIN = "https://breakyoursolarcontract.com";
const TIME_ZONE = "America/Los_Angeles";
const DAY_MS = 86_400_000;

export type OutcomeChange = Pick<SeoChangeLog, "id" | "createdAt" | "updatedAt" | "pagesAffected" | "pageCount" | "impactMeasured" | "afterSnapshot" | "impactSummary">;
export type OutcomePage = { url: string; slug: string };
export type OutcomeWindow = { startDate: string; endDate: string; days: 7 };
export type OutcomeWindows = { before: OutcomeWindow; after: OutcomeWindow; changeDate: string; timeZone: string; finalThrough: string };
export type OutcomeMetrics = { clicks: number; impressions: number; ctr: number | null; position: number | null };
export type OutcomeEvidence = {
  source: "gsc_search_analytics_exact_page_window";
  property: string;
  pageUrl: string;
  window: OutcomeWindow;
  dataState: "final";
  capturedAt: string;
  returnedRows: number;
  metrics: OutcomeMetrics;
};
export type OutcomeDelta = { clicks: number; impressions: number; ctrPercentagePoints: number | null; position: number | null; clicksPercent: number | null; impressionsPercent: number | null };
export type OutcomeMeasurement = {
  version: 1;
  status: "measured";
  experimentId: string;
  changeIds: number[];
  changedAt: string;
  changeTimeSource: "seoChangeLog.createdAt";
  windows: OutcomeWindows;
  before: OutcomeEvidence;
  after: OutcomeEvidence;
  delta: OutcomeDelta;
  confoundingChangeIds: number[];
  attributableLift: null;
  minimumImpressionsPerWindow: number;
  causationWarning: string;
};
export type OutcomePatch = Pick<SeoChangeLog, "impactMeasured" | "impactScore" | "impactSummary" | "impressionsDelta" | "clicksDelta" | "positionDelta" | "measurementDate">;
export type OutcomeStatus = "measured" | "pending" | "unavailable" | "confounded";
export type OutcomeResult = { changeId: number; pageUrl: string | null; status: OutcomeStatus; reason: string; windows?: OutcomeWindows; confoundingChangeIds?: number[]; measurement?: OutcomeMeasurement };
export type OutcomeDependencies = {
  loadContext(): Promise<{ changes: OutcomeChange[]; pages: OutcomePage[]; complete: boolean }>;
  readWindow(pageUrl: string, window: OutcomeWindow): Promise<OutcomeEvidence | null>;
  /** Must recheck same-page edits and original snapshot inside a transaction. */
  saveMeasurement(change: OutcomeChange, pageUrl: string, windows: OutcomeWindows, patch: OutcomePatch): Promise<"saved" | "confounded" | "stale" | "unavailable">;
};
export type OutcomeReport = {
  status: OutcomeStatus | "partial" | "idle";
  source: "gsc_search_analytics_exact_page_window";
  /** Newly persisted this cycle; the read-only report uses total stored verified evidence. */
  measured: number;
  validated: number;
  dryRun: boolean;
  persistedMeasurements: Array<{ changeId: number; measurement: OutcomeMeasurement }>;
  pending: number;
  unavailable: number;
  confounded: number;
  alreadyMeasured: number;
  considered: number;
  attempted: number;
  requestBudget: number;
  refreshedAt: string;
  warning: string;
  results: OutcomeResult[];
};

/** GSC calendar labels use Pacific time; shifting labels avoids DST-length days. */
export function outcomeCalendarDate(date: Date): string {
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid outcome date");
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
function shiftDate(label: string, days: number): string {
  return new Date(Date.parse(`${label}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}
export function buildOutcomeWindows(changedAt: Date, now: Date): OutcomeWindows {
  const changeDate = outcomeCalendarDate(changedAt);
  return {
    before: { startDate: shiftDate(changeDate, -7), endDate: shiftDate(changeDate, -1), days: 7 },
    after: { startDate: shiftDate(changeDate, 1), endDate: shiftDate(changeDate, 7), days: 7 },
    changeDate,
    timeZone: TIME_ZONE,
    finalThrough: shiftDate(outcomeCalendarDate(now), -SEO_OUTCOME_LIMITS.finalizationLagDays),
  };
}

/** Never guess the route for a bare slug; only a unique inventory match resolves it. */
export function resolveOutcomePages(raw: string | null, pages: OutcomePage[]): string[] | null {
  let entries: unknown;
  try { entries = JSON.parse(raw ?? "null"); } catch { return null; }
  if (!Array.isArray(entries) || !entries.length) return null;
  const urls: string[] = [];
  for (const entry of entries) {
    if (typeof entry !== "string" || !entry.trim()) return null;
    const value = entry.trim();
    let url: URL;
    try {
      if (value.startsWith("/") && !value.startsWith("//")) url = new URL(value, ORIGIN);
      else if (value.startsWith("https://")) url = new URL(value);
      else {
        const matches = Array.from(new Set(pages.filter(p => p.slug === value).map(p => p.url)));
        if (matches.length !== 1) return null;
        url = new URL(matches[0]);
      }
    } catch { return null; }
    if (url.origin !== ORIGIN || url.search || url.hash || url.username || url.password) return null;
    urls.push(url.href);
  }
  return Array.from(new Set(urls));
}

/** Unknown affected-page scopes are conservative potential site-wide confounds. */
export function findOutcomeConfounds(change: OutcomeChange, pageUrl: string, windows: OutcomeWindows, changes: OutcomeChange[], pages: OutcomePage[]): number[] {
  return confoundsFromContext(change.id, pageUrl, windows, prepareConfoundContext(changes, pages));
}
function prepareConfoundContext(changes: OutcomeChange[], pages: OutcomePage[]) {
  return changes.map(change => ({
    id: change.id,
    date: Number.isFinite(change.createdAt.getTime()) ? outcomeCalendarDate(change.createdAt) : null,
    affected: resolveOutcomePages(change.pagesAffected, pages),
  }));
}
function confoundsFromContext(changeId: number, pageUrl: string, windows: OutcomeWindows, context: ReturnType<typeof prepareConfoundContext>): number[] {
  return context.filter(other => other.id !== changeId && (
    other.date === null ||
    (other.date >= windows.before.startDate && other.date <= windows.after.endDate && (other.affected === null || other.affected.includes(pageUrl)))
  )).map(other => other.id);
}

export function normalizeOutcomeMetrics(row: { clicks?: unknown; impressions?: unknown; ctr?: unknown; position?: unknown }): OutcomeMetrics | null {
  const { clicks, impressions, position } = row;
  if (typeof clicks !== "number" || typeof impressions !== "number" || !Number.isSafeInteger(clicks) || !Number.isSafeInteger(impressions) || clicks < 0 || impressions < 0 || clicks > impressions || impressions > 2_147_483_647) return null;
  if (impressions === 0) return { clicks, impressions, ctr: null, position: null };
  if (typeof position !== "number" || !Number.isFinite(position) || position < 1) return null;
  // Recompute CTR from actual counts, rather than accept missing/rounded CTR.
  return { clicks, impressions, ctr: clicks / impressions, position };
}
export function calculateOutcomeDelta(before: OutcomeMetrics, after: OutcomeMetrics): OutcomeDelta {
  return {
    clicks: after.clicks - before.clicks,
    impressions: after.impressions - before.impressions,
    ctrPercentagePoints: before.ctr === null || after.ctr === null ? null : (after.ctr - before.ctr) * 100,
    // Negative means a better (lower) average position, not a positive lift score.
    position: before.position === null || after.position === null ? null : after.position - before.position,
    clicksPercent: before.clicks > 0 ? (after.clicks - before.clicks) / before.clicks * 100 : null,
    impressionsPercent: before.impressions > 0 ? (after.impressions - before.impressions) / before.impressions * 100 : null,
  };
}

/** JSON envelope in the existing TEXT summary, preserving the old summary verbatim. */
export function mergeOutcomeMetadata(raw: string | null, measurement: OutcomeMeasurement): string | null {
  const merged = JSON.stringify({
    summary: `Observed 7-day before/after: ${measurement.delta.clicks >= 0 ? "+" : ""}${measurement.delta.clicks} clicks; ${measurement.delta.impressions >= 0 ? "+" : ""}${measurement.delta.impressions} impressions. ${SEO_OUTCOME_WARNING}`,
    previousImpactSummary: raw,
    [SEO_OUTCOME_METADATA_KEY]: measurement,
  });
  return Buffer.byteLength(merged, "utf8") <= SEO_OUTCOME_LIMITS.maxMetadataBytes ? merged : null;
}

export type OutcomeGscRequest = {
  url: string;
  method: "POST";
  timeout: number;
  retry: false;
  data: { startDate: string; endDate: string; dimensions: ["page"]; type: "web"; aggregationType: "byPage"; dataState: "final"; rowLimit: 1; dimensionFilterGroups: Array<{ groupType: "and"; filters: Array<{ dimension: "page"; operator: "equals"; expression: string }> }> };
};
type GscRow = { keys?: string[]; clicks?: unknown; impressions?: unknown; ctr?: unknown; position?: unknown };
export type OutcomeGscRequester = (request: OutcomeGscRequest) => Promise<{ data?: { rows?: GscRow[]; responseAggregationType?: string } }>;

/** Only successful, explicit exact-page rows count as evidence. Empty rows are unknown. */
export async function readExactGscOutcomeWindow(request: OutcomeGscRequester, pageUrl: string, window: OutcomeWindow, capturedAt: () => Date = () => new Date()): Promise<OutcomeEvidence | null> {
  const response = await request({
    url: `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(PROPERTY)}/searchAnalytics/query`,
    method: "POST", timeout: SEO_OUTCOME_LIMITS.requestTimeoutMs, retry: false,
    data: {
      startDate: window.startDate, endDate: window.endDate,
      dimensions: ["page"], type: "web", aggregationType: "byPage", dataState: "final", rowLimit: 1,
      dimensionFilterGroups: [{ groupType: "and", filters: [{ dimension: "page", operator: "equals", expression: pageUrl }] }],
    },
  });
  const rows = response.data?.rows;
  if (!Array.isArray(rows) || rows.length !== 1 || rows[0].keys?.length !== 1 || rows[0].keys[0] !== pageUrl) return null;
  if (response.data?.responseAggregationType && response.data.responseAggregationType !== "byPage") return null;
  const metrics = normalizeOutcomeMetrics(rows[0]);
  if (!metrics) return null;
  return { source: "gsc_search_analytics_exact_page_window", property: PROPERTY, pageUrl, window, dataState: "final", capturedAt: capturedAt().toISOString(), returnedRows: 1, metrics };
}
function validEvidence(evidence: OutcomeEvidence | null, pageUrl: string, window: OutcomeWindow): evidence is OutcomeEvidence {
  if (!evidence || evidence.source !== "gsc_search_analytics_exact_page_window" || evidence.property !== PROPERTY || evidence.pageUrl !== pageUrl || evidence.dataState !== "final" || evidence.returnedRows !== 1 || evidence.window.days !== 7 || evidence.window.startDate !== window.startDate || evidence.window.endDate !== window.endDate || !Number.isFinite(Date.parse(evidence.capturedAt))) return false;
  if (window.endDate > shiftDate(outcomeCalendarDate(new Date(evidence.capturedAt)), -SEO_OUTCOME_LIMITS.finalizationLagDays)) return false;
  const metrics = normalizeOutcomeMetrics(evidence.metrics);
  return metrics !== null && evidence.metrics.ctr === metrics.ctr && evidence.metrics.position === metrics.position;
}

async function defaultDependencies(): Promise<OutcomeDependencies> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) throw new Error("Outcome database unavailable");
  let requester: OutcomeGscRequester | undefined;
  return {
    async loadContext() {
      const [changes, pages] = await Promise.all([
        db.select().from(seoChangeLog).orderBy(asc(seoChangeLog.createdAt), asc(seoChangeLog.id)).limit(SEO_OUTCOME_LIMITS.maxContextRows + 1),
        db.select({ url: seoPages.url, slug: seoPages.slug }).from(seoPages),
      ]);
      return { changes, pages, complete: changes.length <= SEO_OUTCOME_LIMITS.maxContextRows };
    },
    async readWindow(pageUrl, window) {
      if (!requester) {
        // Reuse the same secure environment credential precedence as gscRefresh.
        const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GSC_SERVICE_ACCOUNT_JSON || process.env.GA4_SERVICE_ACCOUNT_JSON;
        if (!raw) throw new Error("Outcome GSC credentials unavailable");
        const { GoogleAuth } = await import("google-auth-library");
        const auth = new GoogleAuth({ credentials: JSON.parse(raw), scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
        const client = await auth.getClient();
        requester = request => client.request<{ rows?: GscRow[]; responseAggregationType?: string }>(request);
      }
      return readExactGscOutcomeWindow(requester, pageUrl, window);
    },
    async saveMeasurement(change, pageUrl, windows, patch) {
      return db.transaction(async tx => {
        // No network calls under locks. Recheck ALL recorded edits, including measured rows.
        const current = await tx.select().from(seoChangeLog).orderBy(asc(seoChangeLog.id)).limit(SEO_OUTCOME_LIMITS.maxContextRows + 1).for("update");
        if (current.length > SEO_OUTCOME_LIMITS.maxContextRows) return "unavailable";
        const row = current.find(r => r.id === change.id);
        if (!row || row.impactMeasured !== 0 || row.afterSnapshot !== change.afterSnapshot || row.impactSummary !== change.impactSummary || row.pagesAffected !== change.pagesAffected || row.createdAt.getTime() !== change.createdAt.getTime() || row.updatedAt.getTime() !== change.updatedAt.getTime()) return "stale";
        const pages = await tx.select({ url: seoPages.url, slug: seoPages.slug }).from(seoPages);
        if (findOutcomeConfounds(row, pageUrl, windows, current, pages).length) return "confounded";
        const [updated] = await tx.update(seoChangeLog).set(patch).where(and(eq(seoChangeLog.id, change.id), eq(seoChangeLog.impactMeasured, 0), eq(seoChangeLog.updatedAt, change.updatedAt), change.afterSnapshot === null ? isNull(seoChangeLog.afterSnapshot) : eq(seoChangeLog.afterSnapshot, change.afterSnapshot)));
        return updated.affectedRows === 1 ? "saved" : "stale";
      });
    },
  };
}

function report(now: Date, results: OutcomeResult[], alreadyMeasured: number, attempted: number, limit: number, dryRun = false, persistedMeasurements: OutcomeReport["persistedMeasurements"] = []): OutcomeReport {
  const counts = { measured: 0, pending: 0, unavailable: 0, confounded: 0 };
  results.forEach(r => counts[r.status]++);
  const statuses = (Object.keys(counts) as OutcomeStatus[]).filter(key => counts[key] > 0);
  return { status: statuses.length === 0 ? persistedMeasurements.length ? "measured" : "idle" : statuses.length === 1 ? statuses[0] : "partial", source: "gsc_search_analytics_exact_page_window", ...counts, validated: results.filter(r => r.measurement !== undefined).length, dryRun, persistedMeasurements, alreadyMeasured, considered: results.length, attempted, requestBudget: limit * 2, refreshedAt: now.toISOString(), warning: SEO_OUTCOME_WARNING, results };
}

/** Integration: await measureSeoChangeOutcomes({ now, limit: 3 }); No new cron required. */
export async function measureSeoChangeOutcomes(options: { now?: Date; limit?: number; dryRun?: boolean; changeId?: number; dependencies?: OutcomeDependencies } = {}): Promise<OutcomeReport> {
  const now = options.now ?? new Date();
  const requested = options.limit ?? SEO_OUTCOME_LIMITS.maxChangesPerCycle;
  const limit = Number.isFinite(requested) ? Math.max(0, Math.min(3, Math.floor(requested))) : 0;
  let deps: OutcomeDependencies;
  let context: Awaited<ReturnType<OutcomeDependencies["loadContext"]>>;
  try { deps = options.dependencies ?? await defaultDependencies(); context = await deps.loadContext(); }
  catch { return report(now, [{ changeId: 0, pageUrl: null, status: "unavailable", reason: "context_unavailable" }], 0, 0, limit, options.dryRun ?? false); }
  if (!context.complete || context.changes.length > SEO_OUTCOME_LIMITS.maxContextRows) return report(now, [{ changeId: 0, pageUrl: null, status: "unavailable", reason: "confound_context_truncated" }], 0, 0, limit, options.dryRun ?? false);
  const { changes, pages } = context;
  const candidates = changes.filter(c => c.impactMeasured === 0);
  const persistedMeasurements: OutcomeReport["persistedMeasurements"] = [];
  for (const change of changes.filter(c => c.impactMeasured === 1)) {
    try {
      const measurement = JSON.parse(change.impactSummary ?? "null")?.[SEO_OUTCOME_METADATA_KEY] as OutcomeMeasurement | undefined;
      if (measurement?.version === 1 && measurement.status === "measured" && measurement.attributableLift === null && measurement.changeIds.includes(change.id) && measurement.windows.before.endDate < measurement.windows.after.startDate && validEvidence(measurement.before, measurement.before.pageUrl, measurement.windows.before) && validEvidence(measurement.after, measurement.before.pageUrl, measurement.windows.after) && measurement.before.metrics.impressions >= SEO_OUTCOME_LIMITS.minimumImpressionsPerWindow && measurement.after.metrics.impressions >= SEO_OUTCOME_LIMITS.minimumImpressionsPerWindow) persistedMeasurements.push({ changeId: change.id, measurement });
    } catch { /* Legacy human summaries are not verified window evidence. */ }
  }
  const confoundContext = prepareConfoundContext(changes, pages);
  const results: OutcomeResult[] = [];
  const eligible: Array<{ change: OutcomeChange; result: OutcomeResult }> = [];
  for (const change of candidates) {
    const result: OutcomeResult = { changeId: change.id, pageUrl: null, status: "unavailable", reason: "page_scope_unavailable" };
    results.push(result);
    const urls = resolveOutcomePages(change.pagesAffected, pages);
    if (!urls || urls.length !== 1 || (change.pageCount !== null && change.pageCount !== 1)) continue;
    result.pageUrl = urls[0];
    if (!Number.isFinite(change.createdAt.getTime())) { result.reason = "change_time_unavailable"; continue; }
    const windows = buildOutcomeWindows(change.createdAt, now);
    result.windows = windows;
    const confounds = confoundsFromContext(change.id, urls[0], windows, confoundContext);
    if (confounds.length) { result.status = "confounded"; result.reason = "other_recorded_edits_in_windows"; result.confoundingChangeIds = confounds; continue; }
    if (windows.after.endDate > windows.finalThrough) { result.status = "pending"; result.reason = "awaiting_completed_final_windows"; continue; }
    if (windows.before.startDate < shiftDate(outcomeCalendarDate(now), -SEO_OUTCOME_LIMITS.maxHistoryDays)) { result.reason = "outside_conservative_gsc_history_limit"; continue; }
    if (Buffer.byteLength(change.impactSummary ?? "", "utf8") > SEO_OUTCOME_LIMITS.maxMetadataBytes - 5_000) { result.reason = "metadata_cannot_merge_preserving_payload"; continue; }
    result.status = "pending"; result.reason = "cycle_budget_or_same_page_group_deferred";
    if (options.changeId === undefined || options.changeId === change.id) eligible.push({ change, result });
  }
  // One experiment per exact URL per cycle. Rotate daily so unavailable old rows
  // cannot permanently starve newer pages; group IDs remain in the report.
  eligible.sort((a, b) => a.change.createdAt.getTime() - b.change.createdAt.getTime() || a.change.id - b.change.id);
  const groups = new Map<string, typeof eligible>();
  for (const item of eligible) groups.set(item.result.pageUrl!, [...(groups.get(item.result.pageUrl!) ?? []), item]);
  const grouped = Array.from(groups.values());
  const day = Math.floor(Date.parse(`${outcomeCalendarDate(now)}T00:00:00Z`) / DAY_MS);
  const start = grouped.length ? day % grouped.length : 0;
  const selected = [...grouped.slice(start), ...grouped.slice(0, start)].slice(0, limit).map(group => group[day % group.length]);
  let attempted = 0;
  for (const { change, result } of selected) {
    attempted++;
    const pageUrl = result.pageUrl!;
    const windows = result.windows!;
    try {
      const before = await deps.readWindow(pageUrl, windows.before);
      if (!validEvidence(before, pageUrl, windows.before)) { result.status = "unavailable"; result.reason = "before_window_no_valid_gsc_evidence"; continue; }
      const after = await deps.readWindow(pageUrl, windows.after);
      if (!validEvidence(after, pageUrl, windows.after)) { result.status = "unavailable"; result.reason = "after_window_no_valid_gsc_evidence"; continue; }
      if (before.metrics.impressions < SEO_OUTCOME_LIMITS.minimumImpressionsPerWindow || after.metrics.impressions < SEO_OUTCOME_LIMITS.minimumImpressionsPerWindow) { result.status = "unavailable"; result.reason = "insufficient_impressions_unknown_not_zero"; continue; }
      const delta = calculateOutcomeDelta(before.metrics, after.metrics);
      const measurement: OutcomeMeasurement = {
        version: 1, status: "measured", experimentId: `seo-change-${change.id}:${pageUrl}:${windows.changeDate}`,
        changeIds: [change.id], changedAt: change.createdAt.toISOString(), changeTimeSource: "seoChangeLog.createdAt", windows,
        before, after, delta, confoundingChangeIds: [], attributableLift: null,
        minimumImpressionsPerWindow: SEO_OUTCOME_LIMITS.minimumImpressionsPerWindow, causationWarning: SEO_OUTCOME_WARNING,
      };
      const impactSummary = mergeOutcomeMetadata(change.impactSummary, measurement);
      if (!impactSummary) { result.status = "unavailable"; result.reason = "metadata_cannot_merge_preserving_payload"; continue; }
      if (options.dryRun) { result.status = "pending"; result.reason = "valid_measurement_dry_run_not_persisted"; result.measurement = measurement; continue; }
      const saved = await deps.saveMeasurement(change, pageUrl, windows, {
        impactMeasured: 1, impactScore: null, impactSummary,
        clicksDelta: delta.clicks, impressionsDelta: delta.impressions,
        positionDelta: delta.position === null ? null : delta.position.toFixed(2), measurementDate: new Date(Math.max(Date.parse(before.capturedAt), Date.parse(after.capturedAt))),
      });
      if (saved !== "saved") { result.status = saved === "confounded" ? "confounded" : "unavailable"; result.reason = `save_recheck_${saved}`; continue; }
      result.status = "measured"; result.reason = "valid_nonoverlapping_final_gsc_windows"; result.measurement = measurement;
    } catch {
      // Never serialize provider errors, request configs, tokens, or credentials.
      result.status = "unavailable"; result.reason = "gsc_or_persistence_failed";
    }
  }
  return report(now, results, changes.length - candidates.length, attempted, limit, options.dryRun ?? false, persistedMeasurements);
}

/** Read-only configuration health. No credential values, DB access, or API request. */
export function readSeoOutcomeSourceHealth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GSC_SERVICE_ACCOUNT_JSON || process.env.GA4_SERVICE_ACCOUNT_JSON;
  let credentialShapeValid = false;
  try {
    const value: unknown = raw ? JSON.parse(raw) : null;
    credentialShapeValid = !!value && typeof value === "object" && "client_email" in value && "private_key" in value && typeof value.client_email === "string" && typeof value.private_key === "string" && value.client_email.length > 0 && value.private_key.length > 0;
  } catch { /* No secrets or parse errors returned. */ }
  return { status: credentialShapeValid ? "configured_unverified" : "unavailable", source: "gsc_search_analytics_exact_page_window", property: PROPERTY, timeZone: TIME_ZONE, credentialsConfigured: !!raw, credentialShapeValid, providerAccessVerified: false, databaseConfigured: !!process.env.DATABASE_URL, limits: SEO_OUTCOME_LIMITS };
}

/** Existing Outcomes UI may call this: DB reads only, no GSC calls or writes. */
export async function readSeoChangeOutcomeReport(options: { now?: Date; dependencies?: OutcomeDependencies } = {}) {
  const result = await measureSeoChangeOutcomes({ ...options, limit: 0, dryRun: true });
  const measured = result.persistedMeasurements.length;
  return { ...result, measured, status: measured && result.considered > 0 ? "partial" as const : measured ? "measured" as const : result.status };
}

export const calculateOutcomeWindows = buildOutcomeWindows;
