/**
 * GA4 Analytics Helper
 * Uses the Google Analytics Data API v1beta with service account credentials.
 * Property: breakyoursolarcontract.com (530239045)
 *
 * DOCUMENTATION:
 * - Service account: analytics-reader@solar-freedom-analytics.iam.gserviceaccount.com
 * - GCP Project: solar-freedom-analytics (810047935902)
 * - GA4 Property ID: 530239045
 * - APIs enabled: Google Analytics Data API, Google Analytics Admin API
 * - To replicate: create a service account in GCP, enable analyticsdata.googleapis.com,
 *   grant the service account Viewer access in GA4 Property Access Management,
 *   download the JSON key, store as GA4_SERVICE_ACCOUNT_JSON env var.
 */

import { GoogleAuth } from "google-auth-library";

const GA4_API_BASE = "https://analyticsdata.googleapis.com/v1beta";
const PROPERTY_ID = process.env.GA4_PROPERTY_ID ?? "530239045";

async function getAuthToken(): Promise<string> {
  const keyJson = process.env.GA4_SERVICE_ACCOUNT_JSON;
  if (!keyJson) throw new Error("GA4_SERVICE_ACCOUNT_JSON env var not set");

  const auth = new GoogleAuth({
    credentials: JSON.parse(keyJson),
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error("Failed to get GA4 access token");
  return token.token;
}

async function runReport(body: object) {
  const token = await getAuthToken();
  const res = await fetch(
    `${GA4_API_BASE}/properties/${PROPERTY_ID}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    throw new Error(`GA4 API request failed (HTTP ${res.status})`);
  }
  return res.json() as Promise<GA4ReportResponse>;
}

interface GA4ReportResponse {
  rows?: Array<{
    dimensionValues: Array<{ value: string }>;
    metricValues: Array<{ value: string }>;
  }>;
  rowCount?: number;
}

export interface GA4Summary {
  sessions: number;
  users: number;
  newUsers: number;
  pageViews: number;
  eventCount: number;
  ctaClicks: number;
  formSubmits: number;
  generateLeads: number;
  phoneClicks: number;
}

export interface GA4DailyRow {
  date: string;
  sessions: number;
  users: number;
  pageViews: number;
}

export interface GA4ChannelRow {
  channel: string;
  sessions: number;
  users: number;
}

export interface GA4PageRow {
  path: string;
  views: number;
  sessions: number;
}

export interface GA4EventRow {
  name: string;
  count: number;
}

export interface GA4FullReport {
  summary: GA4Summary;
  daily: GA4DailyRow[];
  channels: GA4ChannelRow[];
  topPages: GA4PageRow[];
  events: GA4EventRow[];
  dateRange: string;
}

/**
 * Pull a full GA4 analytics report for the given date range.
 * @param startDate e.g. "7daysAgo", "30daysAgo", "2026-03-01"
 * @param endDate   e.g. "today", "2026-03-30"
 */
export async function getGA4Report(
  startDate = "7daysAgo",
  endDate = "today"
): Promise<GA4FullReport> {
  const dateRange = [{ startDate, endDate }];

  // Run all 4 queries in parallel
  const [summaryRes, dailyRes, channelRes, pagesRes, eventsRes] =
    await Promise.all([
      // Overall summary metrics
      runReport({
        dateRanges: dateRange,
        metrics: [
          { name: "sessions" },
          { name: "activeUsers" },
          { name: "newUsers" },
          { name: "screenPageViews" },
          { name: "eventCount" },
        ],
      }),
      // Daily breakdown
      runReport({
        dateRanges: dateRange,
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "sessions" },
          { name: "activeUsers" },
          { name: "screenPageViews" },
        ],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
      // Traffic sources
      runReport({
        dateRanges: dateRange,
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      }),
      // Top pages
      runReport({
        dateRanges: dateRange,
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }, { name: "sessions" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 15,
      }),
      // Events
      runReport({
        dateRanges: dateRange,
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      }),
    ]);

  // Parse summary
  const summaryRow = summaryRes.rows?.[0];
  const mv = (i: number) => parseInt(summaryRow?.metricValues[i]?.value ?? "0");

  // Parse conversion events from events response
  const eventsMap: Record<string, number> = {};
  for (const row of eventsRes.rows ?? []) {
    eventsMap[row.dimensionValues[0].value] = parseInt(
      row.metricValues[0].value
    );
  }

  const summary: GA4Summary = {
    sessions: mv(0),
    users: mv(1),
    newUsers: mv(2),
    pageViews: mv(3),
    eventCount: mv(4),
    ctaClicks: eventsMap["cta_click"] ?? 0,
    formSubmits: eventsMap["form_submit"] ?? 0,
    generateLeads: eventsMap["generate_lead"] ?? 0,
    phoneClicks: eventsMap["phone_click"] ?? 0,
  };

  const daily: GA4DailyRow[] = (dailyRes.rows ?? []).map((row) => ({
    date: row.dimensionValues[0].value,
    sessions: parseInt(row.metricValues[0].value),
    users: parseInt(row.metricValues[1].value),
    pageViews: parseInt(row.metricValues[2].value),
  }));

  const channels: GA4ChannelRow[] = (channelRes.rows ?? []).map((row) => ({
    channel: row.dimensionValues[0].value,
    sessions: parseInt(row.metricValues[0].value),
    users: parseInt(row.metricValues[1].value),
  }));

  const topPages: GA4PageRow[] = (pagesRes.rows ?? []).map((row) => ({
    path: row.dimensionValues[0].value,
    views: parseInt(row.metricValues[0].value),
    sessions: parseInt(row.metricValues[1].value),
  }));

  const events: GA4EventRow[] = (eventsRes.rows ?? []).map((row) => ({
    name: row.dimensionValues[0].value,
    count: parseInt(row.metricValues[0].value),
  }));

  return {
    summary,
    daily,
    channels,
    topPages,
    events,
    dateRange: `${startDate} → ${endDate}`,
  };
}
