import { writeFile } from "node:fs/promises";
import { callDataApi } from "../server/_core/dataApi.ts";

const domain = "breakyoursolarcontract.com";
const longRange = {
  country: "world",
  granularity: "monthly",
  main_domain_only: "true",
  start_date: "2025-08",
  end_date: "2026-07",
};
const shortRange = {
  country: "world",
  granularity: "monthly",
  main_domain_only: "true",
  start_date: "2026-05",
  end_date: "2026-07",
};

const requests = {
  visits: ["Similarweb/get_visits_total", { query: longRange }],
  uniqueVisits: ["Similarweb/get_unique_visit", { query: { main_domain_only: "true", start_date: "2025-08", end_date: "2026-07" } }],
  bounceRate: ["Similarweb/get_bounce_rate", { query: longRange }],
  globalRank: ["Similarweb/get_global_rank", { query: { main_domain_only: "true", start_date: "2025-08", end_date: "2026-07" } }],
  desktopChannels: ["Similarweb/get_traffic_sources_desktop", { query: shortRange }],
  mobileChannels: ["Similarweb/get_traffic_sources_mobile", { query: shortRange }],
  countries: ["Similarweb/get_total_traffic_by_country", { query: { ...shortRange, limit: "10" } }],
};

const entries = await Promise.all(
  Object.entries(requests).map(async ([name, [apiId, options]]) => {
    try {
      const data = await callDataApi(apiId, { ...options, pathParams: { domain } });
      return [name, { ok: true, data }];
    } catch (error) {
      return [name, { ok: false, error: error instanceof Error ? error.message : String(error) }];
    }
  })
);

const baseline = {
  source: "Similarweb independent estimate",
  domain,
  collectedAt: new Date().toISOString(),
  note: "Monthly third-party traffic estimates are directional and must be reconciled with Search Console, GA4, and durable lead records.",
  results: Object.fromEntries(entries),
};

const destination = "/home/ubuntu/solar_freedom_audit/similarweb_baseline_2026-08-12.json";
await writeFile(destination, `${JSON.stringify(baseline, null, 2)}\n`);
console.log(JSON.stringify({ destination, metrics: Object.keys(baseline.results) }));
