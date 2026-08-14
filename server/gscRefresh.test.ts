import { describe, expect, it } from "vitest";
import { normalizeGscRows } from "./gscRefresh";

describe("Search Console page refresh", () => {
  it("keeps only canonical-domain rows and preserves their metrics", () => {
    expect(normalizeGscRows([
      { keys: ["https://breakyoursolarcontract.com/blog/goodleap-cancel-solar-loan-2026"], clicks: 12, impressions: 345, ctr: 0.034, position: 8.2 },
      { keys: ["https://example.com/ignore"], clicks: 99, impressions: 999, ctr: 0.1, position: 1 },
    ])).toEqual([
      { url: "https://breakyoursolarcontract.com/blog/goodleap-cancel-solar-loan-2026", clicks: 12, impressions: 345, ctr: 0.034, position: 8.2 },
    ]);
  });
});
