import { describe, expect, it } from "vitest";
import { buildGscScorecardAlerts, normalizeGscRows, summarizeGscMetrics } from "./gscRefresh";

describe("Search Console page refresh", () => {
  it("keeps only canonical-domain rows and preserves their metrics", () => {
    expect(normalizeGscRows([
      { keys: ["https://breakyoursolarcontract.com/blog/goodleap-cancel-solar-loan-2026"], clicks: 12, impressions: 345, ctr: 0.034, position: 8.2 },
      { keys: ["https://example.com/ignore"], clicks: 99, impressions: 999, ctr: 0.1, position: 1 },
    ])).toEqual([
      { url: "https://breakyoursolarcontract.com/blog/goodleap-cancel-solar-loan-2026", clicks: 12, impressions: 345, ctr: 0.034, position: 8.2 },
    ]);
  });

  it("alerts only on material loss or an empty Search Console result", () => {
    expect(buildGscScorecardAlerts({
      previousClicks: 100,
      previousImpressions: 1_000,
      clicks: 65,
      impressions: 680,
      rows: 12,
    })).toHaveLength(2);

    expect(buildGscScorecardAlerts({
      previousClicks: 0,
      previousImpressions: 0,
      clicks: 0,
      impressions: 0,
      rows: 0,
    })).toEqual([expect.objectContaining({ severity: "critical", metric: "rows" })]);
  });

  it("calculates an impression-weighted average position and verified CTR", () => {
    const summary = summarizeGscMetrics([
      { url: "https://breakyoursolarcontract.com/blog/a", clicks: 6, impressions: 100, ctr: 0.06, position: 8 },
      { url: "https://breakyoursolarcontract.com/blog/b", clicks: 4, impressions: 300, ctr: 0.0133, position: 18 },
    ]);
    expect(summary.clicks).toBe(10);
    expect(summary.impressions).toBe(400);
    expect(summary.ctrPercent).toBe(2.5);
    expect(summary.avgPosition).toBe(15.5);
  });
});
