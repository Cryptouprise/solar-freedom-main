export type ScorecardValues = {
  clicks: number;
  impressions: number;
  durableLeads: number;
  crmDeliveries: number;
  verifiedBacklinks: number;
};

export function comparisonDelta(current: ScorecardValues, baseline?: Partial<ScorecardValues> | null) {
  if (!baseline) return null;
  const metric = (key: keyof ScorecardValues) => {
    const previous = Number(baseline[key] ?? 0);
    const value = current[key] - previous;
    return { value, percent: previous === 0 ? null : Number(((value / previous) * 100).toFixed(1)) };
  };
  return {
    clicks: metric("clicks"),
    impressions: metric("impressions"),
    durableLeads: metric("durableLeads"),
    crmDeliveries: metric("crmDeliveries"),
    verifiedBacklinks: metric("verifiedBacklinks"),
  };
}
