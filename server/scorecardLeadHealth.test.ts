import { describe, expect, it } from "vitest";
import { buildAuthorityScorecardAlerts, buildLeadScorecardAlerts } from "./scorecardLeadHealth";

describe("lead scorecard alerts", () => {
  it("flags a material lead decline and unreliable CRM or active-partner delivery", () => {
    expect(buildLeadScorecardAlerts({
      priorLeads: 8,
      currentLeads: 3,
      priorCrmSynced: 8,
      currentCrmSynced: 1,
      priorPartnerDelivered: 8,
      currentPartnerDelivered: 1,
      activePartnerCount: 1,
    }))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ metric: "leads", severity: "critical" }),
        expect.objectContaining({ metric: "crm_sync", severity: "warning" }),
        expect.objectContaining({ metric: "partner_delivery", severity: "warning" }),
      ]));
  });

  it("surfaces missing partner routing without treating it as a CRM failure", () => {
    expect(buildLeadScorecardAlerts({
      priorLeads: 2,
      currentLeads: 4,
      priorCrmSynced: 2,
      currentCrmSynced: 4,
      priorPartnerDelivered: 0,
      currentPartnerDelivered: 0,
      activePartnerCount: 0,
    })).toEqual([expect.objectContaining({ metric: "partner_availability", severity: "warning" })]);
  });

  it("flags an authority deficit without pretending an unverified prospect is a backlink", () => {
    expect(buildAuthorityScorecardAlerts(0)).toEqual([expect.objectContaining({ metric: "authority", severity: "warning" })]);
    expect(buildAuthorityScorecardAlerts(1)).toEqual([]);
  });
});
