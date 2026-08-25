import { describe, expect, it } from "vitest";
import { buildAuthorityScorecardAlerts, buildLeadScorecardAlerts } from "./scorecardLeadHealth";

const baseline = {
  priorLeads: 8,
  currentLeads: 8,
  priorCrmSynced: 8,
  currentCrmSynced: 8,
  priorPartnerDelivered: 8,
  currentPartnerDelivered: 8,
  activePartnerCount: 1,
  priorAppointments: 6,
  currentAppointments: 6,
};

describe("lead scorecard alerts", () => {
  it("flags a material lead decline and unreliable CRM or active-partner delivery", () => {
    expect(buildLeadScorecardAlerts({
      ...baseline,
      currentLeads: 3,
      currentCrmSynced: 1,
      currentPartnerDelivered: 1,
      currentAppointments: 2,
    })).toEqual(expect.arrayContaining([
      expect.objectContaining({ metric: "leads", severity: "critical" }),
      expect.objectContaining({ metric: "crm_sync", severity: "warning" }),
      expect.objectContaining({ metric: "partner_delivery", severity: "warning" }),
      expect.objectContaining({ metric: "appointments", severity: "critical" }),
    ]));
  });

  it("surfaces missing partner routing without treating it as a CRM failure", () => {
    expect(buildLeadScorecardAlerts({
      ...baseline,
      currentLeads: 4,
      currentCrmSynced: 4,
      priorPartnerDelivered: 0,
      currentPartnerDelivered: 0,
      activePartnerCount: 0,
      currentAppointments: 4,
    })).toEqual([expect.objectContaining({ metric: "partner_availability", severity: "warning" })]);
  });

  it("flags a material booked-appointment decline", () => {
    expect(buildLeadScorecardAlerts({
      ...baseline,
      currentAppointments: 2,
    })).toEqual([expect.objectContaining({ metric: "appointments", severity: "critical" })]);
  });

  it("does not alert on a small or insufficient baseline", () => {
    expect(buildLeadScorecardAlerts({
      priorLeads: 2,
      currentLeads: 0,
      priorCrmSynced: 2,
      currentCrmSynced: 0,
      priorPartnerDelivered: 2,
      currentPartnerDelivered: 0,
      activePartnerCount: 1,
      priorAppointments: 2,
      currentAppointments: 0,
    })).toEqual([]);
  });

  it("flags an authority deficit without pretending an unverified prospect is a backlink", () => {
    expect(buildAuthorityScorecardAlerts(0)).toEqual([expect.objectContaining({ metric: "authority", severity: "warning" })]);
    expect(buildAuthorityScorecardAlerts(1)).toEqual([]);
  });
});
