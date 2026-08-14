export type LeadScorecard = {
  priorLeads: number;
  currentLeads: number;
  priorDelivered: number;
  currentDelivered: number;
};

export type LeadScorecardAlert = {
  severity: "warning" | "critical";
  metric: "leads" | "deliveries";
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
  if (scorecard.currentLeads >= 3 && scorecard.currentDelivered / scorecard.currentLeads < 0.8) {
    alerts.push({
      severity: "warning",
      metric: "deliveries",
      message: `Only ${scorecard.currentDelivered}/${scorecard.currentLeads} durable leads were delivered to CRM or a partner in the current 28-day period.`,
    });
  }
  return alerts;
}
