import { describe, expect, it } from "vitest";
import { scorecardConversionWindowEnd } from "./seoScorecard";

describe("scorecardConversionWindowEnd", () => {
  it("keeps lead and appointment counting inside the scorecard's inclusive Search Console period end", () => {
    expect(scorecardConversionWindowEnd("2026-09-05").toISOString()).toBe("2026-09-05T23:59:59.999Z");
  });
});
