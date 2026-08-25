import { describe, expect, it } from "vitest";
import { comparisonDelta } from "./scorecardComparisons";

describe("scorecard comparison deltas", () => {
  it("returns numeric changes against a prior snapshot", () => {
    expect(comparisonDelta(
      { clicks: 120, impressions: 1_100, durableLeads: 5, crmDeliveries: 4, verifiedBacklinks: 2, geoReadiness: 96 },
      { clicks: 100, impressions: 1_000, durableLeads: 4, crmDeliveries: 2, verifiedBacklinks: 2, geoReadiness: 95 },
    )).toMatchObject({
      clicks: { value: 20, percent: 20 },
      durableLeads: { value: 1, percent: 25 },
      verifiedBacklinks: { value: 0, percent: 0 },
      geoReadiness: { value: 1, percent: 1.1 },
    });
  });

  it("keeps zero-baseline percentage changes undefined instead of inventing an infinite gain", () => {
    expect(comparisonDelta(
      { clicks: 3, impressions: 20, durableLeads: 1, crmDeliveries: 0, verifiedBacklinks: 0, geoReadiness: 0 },
      { clicks: 0, impressions: 0, durableLeads: 0, crmDeliveries: 0, verifiedBacklinks: 0, geoReadiness: 0 },
    )).toMatchObject({ clicks: { value: 3, percent: null } });
  });
});
