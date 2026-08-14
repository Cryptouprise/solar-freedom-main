import { describe, expect, it } from "vitest";
import { buildAuthorityScorecardAlerts, buildLeadScorecardAlerts } from "./scorecardLeadHealth";

describe("lead scorecard alerts", () => {
  it("flags a material lead decline and an unreliable delivery rate", () => {
    expect(buildLeadScorecardAlerts({ priorLeads: 8, currentLeads: 3, priorDelivered: 8, currentDelivered: 1 }))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ metric: "leads", severity: "critical" }),
        expect.objectContaining({ metric: "deliveries", severity: "warning" }),
      ]));
  });

  it("does not alert on a small or insufficient baseline", () => {
    expect(buildLeadScorecardAlerts({ priorLeads: 2, currentLeads: 0, priorDelivered: 2, currentDelivered: 0 })).toEqual([]);
  });

  it("flags an authority deficit without pretending an unverified prospect is a backlink", () => {
    expect(buildAuthorityScorecardAlerts(0)).toEqual([expect.objectContaining({ metric: "authority", severity: "warning" })]);
    expect(buildAuthorityScorecardAlerts(1)).toEqual([]);
  });
});
