import { describe, expect, it } from "vitest";
import { scorecardConversionWindow, scorecardConversionWindowEnd } from "./seoScorecard";

describe("scorecardConversionWindowEnd", () => {
  it("keeps lead and appointment counting inside the scorecard's inclusive Search Console period end", () => {
    expect(scorecardConversionWindowEnd("2026-09-05").toISOString()).toBe("2026-09-05T23:59:59.999Z");
  });

  it("creates a half-open conversion interval matching the displayed inclusive GSC period", () => {
    const window = scorecardConversionWindow("2026-08-08", "2026-09-05");
    expect(window.currentStart.toISOString()).toBe("2026-08-08T00:00:00.000Z");
    expect(window.currentEndExclusive.toISOString()).toBe("2026-09-06T00:00:00.000Z");
  });
});
