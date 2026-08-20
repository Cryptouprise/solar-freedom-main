export type LeadScorecard = {
  priorLeads: number;
  currentLeads: number;
  priorCrmSynced: number;
  currentCrmSynced: number;
  priorPartnerDelivered: number;
  currentPartnerDelivered: number;
  activePartnerCount: number;
  priorAppointments: number;
  currentAppointments: number;
};

export type LeadScorecardAlert = {
  severity: "warning" | "critical";
  metric: "leads" | "crm_sync" | "partner_delivery" | "partner_availability" | "appointments" | "authority";
  message: string;
};

export function buildLeadScorecardAlerts(scorecard: LeadScorecard): LeadScorecardAlert[] {
  const alerts: LeadScorecardAlert[] = [];
  if (scorecard.priorLeads >= 3 && scorecard.currentLeads < scorecard.priorLeads * 0.5) {
    alerts.push({
      severity: "critical",
      metric: "leads",
      message: `28-day durable leads fell ${(100 * (1 - scorecard.currentLeads / scorecard.priorLeads)).toFixed(0)}% versus the preceding 28-day period.`,
    });
  }
  if (scorecard.currentLeads >= 3 && scorecard.currentCrmSynced / scorecard.currentLeads < 0.8) {
    alerts.push({
      severity: "warning",
      metric: "crm_sync",
      message: `Only ${scorecard.currentCrmSynced}/${scorecard.currentLeads} durable leads reached HighLevel in the current 28-day period.`,
    });
  }
  if (scorecard.activePartnerCount > 0 && scorecard.currentLeads >= 3 && scorecard.currentPartnerDelivered / scorecard.currentLeads < 0.8) {
    alerts.push({
      severity: "warning",
      metric: "partner_delivery",
      message: `Only ${scorecard.currentPartnerDelivered}/${scorecard.currentLeads} durable leads reached an active law-firm partner in the current 28-day period.`,
    });
  }
  if (scorecard.activePartnerCount === 0 && scorecard.currentLeads >= 1) {
    alerts.push({
      severity: "warning",
      metric: "partner_availability",
      message: `No active law-firm partner is configured for routing. ${scorecard.currentCrmSynced}/${scorecard.currentLeads} durable leads reached HighLevel; partner delivery remains intentionally inactive until a verified partner endpoint is onboarded.`,
    });
  }
  if (scorecard.priorAppointments >= 3 && scorecard.currentAppointments < scorecard.priorAppointments * 0.5) {
    alerts.push({
      severity: "critical",
      metric: "appointments",
      message: `Booked appointments fell ${(100 * (1 - scorecard.currentAppointments / scorecard.priorAppointments)).toFixed(0)}% versus the preceding 28-day period.`,
    });
  }
  if (scorecard.currentLeads >= 5 && scorecard.currentAppointments === 0) {
    alerts.push({
      severity: "critical",
      metric: "appointments",
      message: "Website leads were recorded but no booked appointments were received in the current 28-day window. Verify the GoHighLevel lifecycle webhook and booking workflow.",
    });
  }
  return alerts;
}

export function buildAuthorityScorecardAlerts(verifiedBacklinks: number): LeadScorecardAlert[] {
  if (verifiedBacklinks > 0) return [];
  return [{
    severity: "warning",
    metric: "authority",
    message: "No active verified backlinks are recorded. Resource outreach should target the priority loan and contract pages; do not count a placement until the live canonical link is verified.",
  }];
}
