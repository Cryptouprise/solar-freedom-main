import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SEO_OUTCOME_LIMITS, SEO_OUTCOME_METADATA_KEY, SEO_OUTCOME_WARNING,
  buildOutcomeWindows, calculateOutcomeDelta, findOutcomeConfounds,
  measureSeoChangeOutcomes, mergeOutcomeMetadata, normalizeOutcomeMetrics,
  outcomeCalendarDate, readExactGscOutcomeWindow, readSeoChangeOutcomeReport, readSeoOutcomeSourceHealth, resolveOutcomePages,
  type OutcomeChange, type OutcomeDependencies, type OutcomeEvidence,
  type OutcomeGscRequester, type OutcomeMeasurement, type OutcomeWindow,
} from "./seoChangeOutcomes";

const productionMocks = vi.hoisted(() => ({ getDb: vi.fn(), request: vi.fn() }));
vi.mock("./db", () => ({ getDb: productionMocks.getDb }));
vi.mock("google-auth-library", () => ({
  GoogleAuth: class {
    async getClient() { return { request: productionMocks.request }; }
  },
}));
afterEach(() => vi.unstubAllEnvs());

const NOW = new Date("2026-11-03T12:00:00Z");
const CHANGED = new Date("2026-10-15T18:00:00Z");
const URL = "https://breakyoursolarcontract.com/blog/test";
const pages = [{ url: URL, slug: "test" }];
const change = (id = 1, overrides: Partial<OutcomeChange> = {}): OutcomeChange => ({
  id, createdAt: CHANGED, updatedAt: CHANGED,
  pagesAffected: JSON.stringify(["/blog/test"]), pageCount: 1,
  impactMeasured: 0, afterSnapshot: JSON.stringify({ title: "New title", rollback: { title: "Old title" } }), impactSummary: "Existing analysis",
  ...overrides,
});
function evidence(pageUrl: string, window: OutcomeWindow, overrides: Partial<OutcomeEvidence> = {}): OutcomeEvidence {
  return {
    source: "gsc_search_analytics_exact_page_window", property: "sc-domain:breakyoursolarcontract.com",
    pageUrl, window, dataState: "final", capturedAt: NOW.toISOString(), returnedRows: 1,
    metrics: { clicks: window.startDate === "2026-10-08" ? 5 : 10, impressions: 100, ctr: window.startDate === "2026-10-08" ? 0.05 : 0.1, position: 8 }, ...overrides,
  };
}
function mocks(changes: OutcomeChange[] = [change()]) {
  const loadContext = vi.fn(async () => ({ changes, pages, complete: true }));
  const readWindow = vi.fn(async (url: string, window: OutcomeWindow) => evidence(url, window));
  const saveMeasurement = vi.fn<OutcomeDependencies["saveMeasurement"]>(async () => "saved");
  return { loadContext, readWindow, saveMeasurement } satisfies OutcomeDependencies;
}
async function run(dependencies: OutcomeDependencies, now = NOW, limit = 3) {
  return measureSeoChangeOutcomes({ dependencies, now, limit });
}

describe("conservative SEO outcome calendar and page resolution", () => {
  it("creates equal, nonoverlapping inclusive windows, excluding the change day", () => {
    const windows = buildOutcomeWindows(CHANGED, NOW);
    expect(windows).toEqual({
      before: { startDate: "2026-10-08", endDate: "2026-10-14", days: 7 },
      after: { startDate: "2026-10-16", endDate: "2026-10-22", days: 7 },
      changeDate: "2026-10-15", timeZone: "America/Los_Angeles", finalThrough: "2026-10-30",
    });
    for (const window of [windows.before, windows.after]) {
      expect((Date.parse(window.endDate) - Date.parse(window.startDate)) / 86_400_000 + 1).toBe(7);
    }
  });
  it("uses GSC Pacific calendar dates and handles DST transitions", () => {
    expect(outcomeCalendarDate(new Date("2026-11-03T02:00:00Z"))).toBe("2026-11-02");
    expect(buildOutcomeWindows(new Date("2026-11-01T08:30:00Z"), NOW).after).toEqual({ startDate: "2026-11-02", endDate: "2026-11-08", days: 7 });
    expect(() => outcomeCalendarDate(new Date("invalid"))).toThrow();
  });
  it("resolves real inventory slugs without guessing unknown routes", () => {
    expect(resolveOutcomePages(JSON.stringify(["test", URL, "/blog/test"]), pages)).toEqual([URL]);
    expect(resolveOutcomePages(JSON.stringify(["unknown"]), pages)).toBeNull();
    expect(resolveOutcomePages(JSON.stringify(["test"]), [...pages, { url: "https://breakyoursolarcontract.com/cancel-test", slug: "test" }])).toBeNull();
    for (const value of ["not json", "null", "[]", JSON.stringify(["//example.com/path"]), JSON.stringify(["https://example.com/path"]), JSON.stringify(["/blog/test?q=1"]), JSON.stringify(["/blog/test#part"]), JSON.stringify([42])]) {
      expect(resolveOutcomePages(value, pages)).toBeNull();
    }
  });
});

describe("actual metric calculations", () => {
  it("keeps zero-impression CTR and position unknown, not fake zero", () => {
    expect(normalizeOutcomeMetrics({ clicks: 0, impressions: 0, position: 0, ctr: 0 })).toEqual({ clicks: 0, impressions: 0, ctr: null, position: null });
    expect(calculateOutcomeDelta({ clicks: 0, impressions: 0, ctr: null, position: null }, { clicks: 0, impressions: 0, ctr: null, position: null })).toEqual({ clicks: 0, impressions: 0, ctrPercentagePoints: null, position: null, clicksPercent: null, impressionsPercent: null });
  });
  it("derives CTR from counts and keeps position sign explicit", () => {
    const before = normalizeOutcomeMetrics({ clicks: 5, impressions: 100, position: 12, ctr: 0.999 })!;
    const after = normalizeOutcomeMetrics({ clicks: 12, impressions: 200, position: 8 })!;
    expect(before.ctr).toBe(0.05);
    expect(calculateOutcomeDelta(before, after)).toMatchObject({ clicks: 7, impressions: 100, position: -4, clicksPercent: 140, impressionsPercent: 100 });
    expect(calculateOutcomeDelta(before, after).ctrPercentagePoints).toBeCloseTo(1);
  });
  it("rejects missing, negative, impossible, fractional or nonfinite counts and invalid position", () => {
    for (const metrics of [{}, { clicks: "1", impressions: 100, position: 4 }, { clicks: -1, impressions: 100, position: 4 }, { clicks: 3, impressions: 2, position: 4 }, { clicks: 0.5, impressions: 100, position: 4 }, { clicks: 0, impressions: NaN, position: 4 }, { clicks: 0, impressions: 100 }, { clicks: 0, impressions: 100, position: 0 }, { clicks: 0, impressions: 100, position: Infinity }]) {
      expect(normalizeOutcomeMetrics(metrics)).toBeNull();
    }
  });
});

describe("read-only exact GSC queries (mocked)", () => {
  it("uses exact page equality, completed dates, final state and bounded no-retry request", async () => {
    const request = vi.fn<OutcomeGscRequester>(async () => ({ data: { rows: [{ keys: [URL], clicks: 10, impressions: 100, position: 5 }], responseAggregationType: "byPage" } }));
    const window = buildOutcomeWindows(CHANGED, NOW).before;
    const result = await readExactGscOutcomeWindow(request, URL, window, () => NOW);
    expect(result).toMatchObject({ source: "gsc_search_analytics_exact_page_window", capturedAt: NOW.toISOString(), metrics: { clicks: 10, impressions: 100, ctr: 0.1, position: 5 } });
    expect(request.mock.calls[0][0]).toMatchObject({ method: "POST", retry: false, timeout: 10_000, data: { startDate: "2026-10-08", endDate: "2026-10-14", dimensions: ["page"], type: "web", aggregationType: "byPage", dataState: "final", rowLimit: 1, dimensionFilterGroups: [{ groupType: "and", filters: [{ dimension: "page", operator: "equals", expression: URL }] }] } });
  });
  it("never interprets absent or malformed page rows as zero traffic", async () => {
    const window = buildOutcomeWindows(CHANGED, NOW).before;
    for (const data of [{}, { rows: [] }, { rows: [{ keys: ["https://example.com"], clicks: 3, impressions: 100, position: 5 }] }, { rows: [{ keys: [URL] }] }, { rows: [{ keys: [URL], clicks: 3, impressions: 100, position: 5 }], responseAggregationType: "byProperty" }]) {
      expect(await readExactGscOutcomeWindow(async () => ({ data }), URL, window)).toBeNull();
    }
  });
  it("preserves an explicit zero row with undefined derived rates", async () => {
    expect(await readExactGscOutcomeWindow(async () => ({ data: { rows: [{ keys: [URL], clicks: 0, impressions: 0, position: 0 }] } }), URL, buildOutcomeWindows(CHANGED, NOW).before)).toMatchObject({ metrics: { clicks: 0, impressions: 0, ctr: null, position: null } });
  });
});

describe("recorded confounds and experiment grouping", () => {
  it("detects same-page edits in both windows and on the change day, including measured edits", () => {
    const windows = buildOutcomeWindows(CHANGED, NOW);
    const context = [change(), change(2, { createdAt: new Date("2026-10-08T18:00:00Z"), impactMeasured: 1 }), change(3, { createdAt: new Date("2026-10-22T18:00:00Z") }), change(4), change(5, { createdAt: new Date("2026-10-23T18:00:00Z") }), change(6, { pagesAffected: JSON.stringify(["/blog/other"]) })];
    expect(findOutcomeConfounds(change(), URL, windows, context, pages)).toEqual([2, 3, 4]);
  });
  it("treats unknown-scope edits during the windows as potential confounds", () => {
    expect(findOutcomeConfounds(change(), URL, buildOutcomeWindows(CHANGED, NOW), [change(), change(2, { pagesAffected: null })], pages)).toEqual([2]);
  });
  it("keeps repeat edits confounded, unmeasured and makes no API/persistence calls", async () => {
    const deps = mocks([change(), change(2)]);
    const result = await run(deps);
    expect(result).toMatchObject({ status: "confounded", measured: 0, confounded: 2, attempted: 0 });
    expect(deps.readWindow).not.toHaveBeenCalled();
    expect(deps.saveMeasurement).not.toHaveBeenCalled();
  });
  it("only selects one independent experiment for the same URL in a cycle", async () => {
    const deps = mocks([change(), change(2, { createdAt: new Date("2026-09-01T18:00:00Z") })]);
    const result = await run(deps);
    expect(result).toMatchObject({ attempted: 1, measured: 1, pending: 1 });
    expect(deps.readWindow).toHaveBeenCalledTimes(2);
  });
});

describe("bounded outcome worker", () => {
  it("persists only valid measurements, with original payload and causal warning intact", async () => {
    const deps = mocks();
    const result = await run(deps);
    expect(result).toMatchObject({ status: "measured", measured: 1, pending: 0, unavailable: 0, confounded: 0 });
    const patch = deps.saveMeasurement.mock.calls[0][3];
    expect(patch).toMatchObject({ impactMeasured: 1, impactScore: null, clicksDelta: 5, impressionsDelta: 0, positionDelta: "0.00", measurementDate: NOW });
    const merged = JSON.parse(patch.impactSummary!);
    expect(merged.previousImpactSummary).toBe("Existing analysis");
    expect(merged[SEO_OUTCOME_METADATA_KEY]).toMatchObject({ attributableLift: null, changeIds: [1], before: { metrics: { clicks: 5, impressions: 100 } }, after: { metrics: { clicks: 10, impressions: 100 } }, causationWarning: SEO_OUTCOME_WARNING });
    expect(Object.keys(patch)).not.toContain("beforeSnapshot");
    expect(Object.keys(patch)).not.toContain("afterSnapshot");
  });
  it("waits for seven complete post-change days and the four-day finalization cutoff", async () => {
    const deps = mocks();
    expect(await run(deps, new Date("2026-10-25T18:00:00Z"))).toMatchObject({ pending: 1, attempted: 0 });
    expect(deps.readWindow).not.toHaveBeenCalled();
    expect(await run(deps, new Date("2026-10-26T18:00:00Z"))).toMatchObject({ measured: 1, attempted: 1 });
  });
  it("does not mark empty or insufficient windows measured", async () => {
    const deps = mocks();
    deps.readWindow.mockResolvedValue(null as unknown as OutcomeEvidence);
    expect(await run(deps)).toMatchObject({ unavailable: 1, measured: 0 });
    expect(deps.saveMeasurement).not.toHaveBeenCalled();
    for (const count of [0, SEO_OUTCOME_LIMITS.minimumImpressionsPerWindow - 1]) {
      deps.readWindow.mockImplementation(async (url, window) => evidence(url, window, { metrics: { clicks: 0, impressions: count, ctr: count ? 0 : null, position: count ? 8 : null } }));
      expect(await run(deps)).toMatchObject({ unavailable: 1, measured: 0 });
    }
    expect(deps.saveMeasurement).not.toHaveBeenCalled();
  });
  it("accepts real zero clicks with adequate impressions; no invented percentage from zero baseline", async () => {
    const deps = mocks();
    deps.readWindow.mockImplementation(async (url, window) => evidence(url, window, { metrics: { clicks: 0, impressions: 100, ctr: 0, position: 8 } }));
    const result = await run(deps);
    expect(result.measured).toBe(1);
    expect(result.results[0].measurement?.delta.clicksPercent).toBeNull();
  });
  it("keeps unknown after windows and premature capture dates unmeasured", async () => {
    const deps = mocks();
    deps.readWindow.mockResolvedValueOnce(evidence(URL, buildOutcomeWindows(CHANGED, NOW).before));
    deps.readWindow.mockResolvedValueOnce(null as unknown as OutcomeEvidence);
    expect(await run(deps)).toMatchObject({ unavailable: 1, measured: 0 });
    expect(deps.saveMeasurement).not.toHaveBeenCalled();
    deps.readWindow.mockImplementation(async (url, window) => evidence(url, window, { capturedAt: "2026-10-10T12:00:00Z" }));
    expect(await run(deps)).toMatchObject({ unavailable: 1, measured: 0 });
    expect(deps.saveMeasurement).not.toHaveBeenCalled();
  });
  it("rejects overlapping rolling snapshot evidence even if its counts look valid", async () => {
    const deps = mocks();
    deps.readWindow.mockImplementation(async (url, window) => evidence(url, { ...window, startDate: "2026-09-20", endDate: "2026-10-18" }));
    expect(await run(deps)).toMatchObject({ unavailable: 1, measured: 0 });
    expect(deps.saveMeasurement).not.toHaveBeenCalled();
  });
  it("sanitizes API and persistence failures; failed saves never increment measured", async () => {
    const deps = mocks();
    deps.readWindow.mockRejectedValue(new Error("private_key SECRET token=TOKEN"));
    const failed = await run(deps);
    expect(failed).toMatchObject({ unavailable: 1, measured: 0 });
    expect(JSON.stringify(failed)).not.toMatch(/SECRET|TOKEN|private_key/);
    deps.readWindow.mockImplementation(async (url, window) => evidence(url, window));
    deps.saveMeasurement.mockRejectedValue(new Error("database credential"));
    expect(await run(deps)).toMatchObject({ unavailable: 1, measured: 0 });
  });
  it("honors persistence recheck of new edits and concurrent measurements", async () => {
    for (const status of ["confounded", "stale", "unavailable"] as const) {
      const deps = mocks();
      deps.saveMeasurement.mockResolvedValue(status);
      const result = await run(deps);
      expect(result.measured).toBe(0);
      expect(result.results[0].status).toBe(status === "confounded" ? "confounded" : "unavailable");
    }
  });
  it("fails closed when confound context is unavailable or incomplete", async () => {
    const deps = mocks();
    deps.loadContext.mockRejectedValue(new Error("secret database URL"));
    expect(await run(deps)).toMatchObject({ unavailable: 1, attempted: 0 });
    deps.loadContext.mockResolvedValue({ changes: [change()], pages, complete: false });
    expect(await run(deps)).toMatchObject({ unavailable: 1, attempted: 0 });
    expect(deps.readWindow).not.toHaveBeenCalled();
  });
  it("skips already-measured changes, old out-of-retention changes and ambiguous multi-page changes", async () => {
    const deps = mocks([change(1, { impactMeasured: 1 }), change(2, { createdAt: new Date("2024-01-01T18:00:00Z") }), change(3, { pageCount: 2, pagesAffected: JSON.stringify(["/blog/a", "/blog/b"]) })]);
    expect(await run(deps)).toMatchObject({ alreadyMeasured: 1, unavailable: 2, attempted: 0, measured: 0 });
    expect(deps.readWindow).not.toHaveBeenCalled();
  });
  it("caps three changes/six exact queries and supports a lower or disabled budget", async () => {
    const changes = Array.from({ length: 8 }, (_, index) => change(index + 1, { pagesAffected: JSON.stringify([`/blog/item-${index}`]) }));
    const deps = mocks(changes);
    expect(await run(deps, NOW, 99)).toMatchObject({ attempted: 3, measured: 3, pending: 5, requestBudget: 6 });
    expect(deps.readWindow).toHaveBeenCalledTimes(6);
    deps.readWindow.mockClear();
    expect(await run(deps, NOW, 1)).toMatchObject({ attempted: 1, requestBudget: 2 });
    expect(deps.readWindow).toHaveBeenCalledTimes(2);
    deps.readWindow.mockClear();
    expect(await run(deps, NOW, 0)).toMatchObject({ attempted: 0, pending: 8 });
    expect(deps.readWindow).not.toHaveBeenCalled();
  });
  it("does not let repeated unavailable old changes permanently starve other pages", async () => {
    const changes = Array.from({ length: 5 }, (_, index) => change(index + 1, { pagesAffected: JSON.stringify([`/blog/item-${index}`]) }));
    const selected = new Set<number>();
    for (let day = 0; day < 5; day++) {
      const deps = mocks(changes);
      deps.readWindow.mockRejectedValue(new Error("unavailable"));
      const result = await run(deps, new Date(NOW.getTime() + day * 86_400_000), 1);
      result.results.filter(row => row.reason === "gsc_or_persistence_failed").forEach(row => selected.add(row.changeId));
    }
    expect(selected.size).toBe(5);
  });
});

describe("existing impactSummary JSON metadata safety", () => {
  it("preserves prior summaries verbatim and refuses oversized TEXT storage", async () => {
    const deps = mocks();
    const measurement = (await run(deps)).results[0].measurement as OutcomeMeasurement;
    expect(JSON.parse(mergeOutcomeMetadata(null, measurement)!)[SEO_OUTCOME_METADATA_KEY]).toMatchObject({ status: "measured" });
    for (const raw of ["null", "[]", "\"text\"", "invalid", JSON.stringify({ [SEO_OUTCOME_METADATA_KEY]: { legacy: true } })]) {
      expect(JSON.parse(mergeOutcomeMetadata(raw, measurement)!).previousImpactSummary).toBe(raw);
      const preserved = mocks([change(1, { afterSnapshot: raw })]);
      expect(await run(preserved)).toMatchObject({ measured: 1 });
      expect(preserved.saveMeasurement.mock.calls[0][3]).not.toHaveProperty("afterSnapshot");
    }
    const raw = "x".repeat(60_000);
    expect(mergeOutcomeMetadata(raw, measurement)).toBeNull();
    const blocked = mocks([change(1, { impactSummary: raw })]);
    expect(await run(blocked)).toMatchObject({ unavailable: 1, measured: 0, attempted: 0 });
    expect(blocked.saveMeasurement).not.toHaveBeenCalled();
  });
});

describe("production adapter with only mock database and GSC client", () => {
  function database(current: OutcomeChange[] = [change()], affectedRows = 1) {
    const where = vi.fn(async () => [{ affectedRows }]);
    const set = vi.fn(() => ({ where }));
    let selection = 0;
    const select = vi.fn(() => {
      const rows = [ [change()], pages, current, pages ][selection++];
      const builder = {
        from: () => builder,
        orderBy: () => builder,
        limit: () => builder,
        for: vi.fn(async () => rows),
        then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(rows).then(resolve, reject),
      };
      return builder;
    });
    const db = { select, update: vi.fn(() => ({ set })), transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback(db)) };
    productionMocks.getDb.mockResolvedValue(db);
    productionMocks.request.mockResolvedValue({ data: { rows: [{ keys: [URL], clicks: 5, impressions: 100, position: 8 }], responseAggregationType: "byPage" } });
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_JSON", "{\"client_email\":\"mock@example.test\",\"private_key\":\"mock-only\"}");
    return { db, set, where };
  }
  it("uses a transaction and verifies exactly one affected row before reporting saved", async () => {
    const mock = database();
    expect(await measureSeoChangeOutcomes({ now: NOW })).toMatchObject({ measured: 1 });
    expect(mock.db.transaction).toHaveBeenCalledTimes(1);
    expect(mock.where).toHaveBeenCalledTimes(1);
    expect(mock.set.mock.calls[0][0]).toMatchObject({ impactMeasured: 1, impactScore: null });
  });
  it("does not report a zero-row persistence update as measured", async () => {
    const mock = database([change()], 0);
    expect(await measureSeoChangeOutcomes({ now: NOW })).toMatchObject({ measured: 0, unavailable: 1 });
    expect(mock.where).toHaveBeenCalledTimes(1);
  });
  it("rechecks same-page edits and original payload under the transaction lock", async () => {
    let mock = database([change(), change(2)]);
    expect(await measureSeoChangeOutcomes({ now: NOW })).toMatchObject({ confounded: 1, measured: 0 });
    expect(mock.where).not.toHaveBeenCalled();
    mock = database([change(1, { afterSnapshot: JSON.stringify({ title: "Concurrent edit" }) })]);
    expect(await measureSeoChangeOutcomes({ now: NOW })).toMatchObject({ unavailable: 1, measured: 0 });
    expect(mock.where).not.toHaveBeenCalled();
  });
});

describe("read-only operational integration", () => {
  it("dry-runs one finished measurement without any persistence call", async () => {
    const deps = mocks();
    const result = await measureSeoChangeOutcomes({ now: NOW, limit: 1, dryRun: true, dependencies: deps });
    expect(result).toMatchObject({ dryRun: true, measured: 0, validated: 1, pending: 1, requestBudget: 2 });
    expect(result.results[0].measurement).toMatchObject({ attributableLift: null });
    expect(deps.saveMeasurement).not.toHaveBeenCalled();
  });
  it("reads current status without GSC API calls or database writes", async () => {
    const deps = mocks([change(), change(2)]);
    expect(await readSeoChangeOutcomeReport({ now: NOW, dependencies: deps })).toMatchObject({ confounded: 2, attempted: 0, dryRun: true });
    expect(deps.readWindow).not.toHaveBeenCalled();
    expect(deps.saveMeasurement).not.toHaveBeenCalled();
  });
  it("recovers verified stored JSON for the Outcomes panel, without counting legacy summaries", async () => {
    const writer = mocks();
    await run(writer);
    const impactSummary = writer.saveMeasurement.mock.calls[0][3].impactSummary;
    const deps = mocks([change(1, { impactMeasured: 1, impactSummary }), change(2, { impactMeasured: 1, impactSummary: "Old unverified summary" })]);
    const result = await readSeoChangeOutcomeReport({ now: NOW, dependencies: deps });
    expect(result).toMatchObject({ measured: 1, alreadyMeasured: 2, status: "measured" });
    expect(result.persistedMeasurements).toHaveLength(1);
    expect(deps.readWindow).not.toHaveBeenCalled();
    expect(deps.saveMeasurement).not.toHaveBeenCalled();
  });
  it("can target one historical change without bypassing confound checks or writing", async () => {
    const deps = mocks([change(), change(2, { pagesAffected: JSON.stringify(["/blog/other"]) })]);
    const result = await measureSeoChangeOutcomes({ now: NOW, limit: 1, dryRun: true, changeId: 2, dependencies: deps });
    expect(result).toMatchObject({ measured: 0, validated: 1, attempted: 1 });
    expect(result.results.find(row => row.measurement)?.changeId).toBe(2);
    expect(deps.saveMeasurement).not.toHaveBeenCalled();
  });
  it("reports config health without secrets or pretending provider access was verified", () => {
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_JSON", "{\"client_email\":\"private@example.test\",\"private_key\":\"DO-NOT-DISCLOSE\"}");
    const health = readSeoOutcomeSourceHealth();
    expect(health).toMatchObject({ status: "configured_unverified", credentialShapeValid: true, providerAccessVerified: false, timeZone: "America/Los_Angeles" });
    expect(JSON.stringify(health)).not.toMatch(/DO-NOT-DISCLOSE|private@example/);
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_JSON", "invalid-secret-json");
    expect(readSeoOutcomeSourceHealth()).toMatchObject({ status: "unavailable", credentialShapeValid: false });
  });
});
