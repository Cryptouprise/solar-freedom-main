export type DatedAnalyticsRow = { date: string };

function toIsoDate(value: string | undefined): string | null {
  if (!value || !/^\d{8}$/.test(value)) return null;
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

/** Resolves the actual GA4 dates returned by the API instead of exposing a relative request such as "7daysAgo". */
export function resolveGa4DateWindow(rows: DatedAnalyticsRow[]) {
  return {
    start: toIsoDate(rows[0]?.date),
    end: toIsoDate(rows[rows.length - 1]?.date),
  };
}
