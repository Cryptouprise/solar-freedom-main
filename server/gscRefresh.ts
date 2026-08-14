import { GoogleAuth } from "google-auth-library";
import { getDb } from "./db";
import { seoPages } from "../drizzle/schema";

const SEARCH_CONSOLE_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const SEARCH_CONSOLE_API = "https://searchconsole.googleapis.com/webmasters/v3/sites";
const PROPERTY = "sc-domain:breakyoursolarcontract.com";

export type GscPageMetric = {
  url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

function isoDate(daysAgo: number, now: Date): string {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

export function normalizeGscRows(rows: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }>): GscPageMetric[] {
  return rows
    .map((row) => ({
      url: row.keys?.[0] ?? "",
      clicks: Number(row.clicks ?? 0),
      impressions: Number(row.impressions ?? 0),
      ctr: Number(row.ctr ?? 0),
      position: Number(row.position ?? 0),
    }))
    .filter((row) => row.url.startsWith("https://breakyoursolarcontract.com/"));
}

function pageTypeForUrl(url: string): "blog" | "company" | "city" | "state_law" | "homepage" | "other" {
  const path = new URL(url).pathname;
  if (path === "/") return "homepage";
  if (path.startsWith("/blog/")) return "blog";
  if (path.startsWith("/cancel-solar-contract/")) return "city";
  if (path.startsWith("/solar-contract-laws/")) return "state_law";
  if (path.startsWith("/cancel-")) return "company";
  return "other";
}

function slugForUrl(url: string): string {
  const path = new URL(url).pathname.replace(/^\/+|\/+$/g, "");
  return path || "home";
}

export async function refreshGscPageMetrics(now = new Date()) {
  const rawCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    || process.env.GSC_SERVICE_ACCOUNT_JSON
    || process.env.GA4_SERVICE_ACCOUNT_JSON;
  if (!rawCredentials) throw new Error("No configured Google service account is available for Search Console refresh.");

  const credentials = JSON.parse(rawCredentials);
  const auth = new GoogleAuth({ credentials, scopes: [SEARCH_CONSOLE_SCOPE] });
  const client = await auth.getClient();
  const response = await client.request<{ rows?: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }> }>({
    url: `${SEARCH_CONSOLE_API}/${encodeURIComponent(PROPERTY)}/searchAnalytics/query`,
    method: "POST",
    data: {
      startDate: isoDate(31, now),
      endDate: isoDate(3, now),
      dimensions: ["page"],
      dataState: "final",
      rowLimit: 25_000,
    },
  });

  const rows = normalizeGscRows(response.data?.rows ?? []);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable for Search Console refresh.");

  for (const row of rows) {
    await db.insert(seoPages).values({
      url: row.url,
      slug: slugForUrl(row.url),
      pageType: pageTypeForUrl(row.url),
      gscClicks: Math.round(row.clicks),
      gscImpressions: Math.round(row.impressions),
      gscAvgPosition: row.position.toFixed(1),
      gscLastChecked: now,
    }).onDuplicateKeyUpdate({
      set: {
        gscClicks: Math.round(row.clicks),
        gscImpressions: Math.round(row.impressions),
        gscAvgPosition: row.position.toFixed(1),
        gscLastChecked: now,
      },
    });
  }

  return {
    property: PROPERTY,
    startDate: isoDate(31, now),
    endDate: isoDate(3, now),
    rows: rows.length,
    clicks: rows.reduce((sum, row) => sum + row.clicks, 0),
    impressions: rows.reduce((sum, row) => sum + row.impressions, 0),
  };
}
