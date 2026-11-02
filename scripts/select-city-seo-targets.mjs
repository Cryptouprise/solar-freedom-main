import fs from 'node:fs/promises';
import { google } from 'googleapis';

const eligibility = JSON.parse(await fs.readFile(new URL('../shared/index-eligibility.json', import.meta.url), 'utf8'));
const now = new Date();
const end = new Date(now); end.setUTCDate(end.getUTCDate() - 3);
const start = new Date(end); start.setUTCDate(start.getUTCDate() - 27);
const day = value => value.toISOString().slice(0, 10);
const window = { startDate: day(start), endDate: day(end) };
let rows = []; let error = null;
try {
  const credentials = JSON.parse(process.env.GA4_SERVICE_ACCOUNT_JSON || '{}');
  if (!credentials.client_email) throw new Error('Configured Search Console credentials unavailable');
  const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
  const sc = google.searchconsole({ version: 'v1', auth });
  const result = await sc.searchanalytics.query({ siteUrl: 'sc-domain:breakyoursolarcontract.com', requestBody: { ...window, dimensions: ['page'], dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'contains', expression: '/cancel-solar-contract/' }] }], rowLimit: 1000, dataState: 'final' } }, { timeout: 30000, retry: false });
  rows = (result.data.rows || []).map(row => ({ path: new URL(row.keys[0]).pathname.replace(/\/$/, ''), clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position }));
} catch (caught) { error = String(caught.message).replace(/Bearer\s+\S+/g, '[redacted]').slice(0, 500); }
const alreadyConfigured = new Set(['houston-tx', 'dallas-tx', 'phoenix-az', 'austin-tx']);
const ordered = eligibility.citySlugs.map((slug, inventoryOrder) => ({ slug, path: `/cancel-solar-contract/${slug}`, inventoryOrder, metrics: rows.find(row => row.path === `/cancel-solar-contract/${slug}`) || null }));
ordered.sort((a,b) => (b.metrics?.impressions || 0) - (a.metrics?.impressions || 0) || a.inventoryOrder - b.inventoryOrder);
const selected = ordered.slice(0,20);
for (const slug of alreadyConfigured) {
  if (!selected.some(city => city.slug === slug)) {
    const replace = selected.findLastIndex(city => !alreadyConfigured.has(city.slug));
    selected[replace] = ordered.find(city => city.slug === slug);
  }
}
const output = { capturedAt: now.toISOString(), source: error ? 'approved-city inventory fallback; GSC unavailable' : 'Google Search Console API, final page rows', property: 'sc-domain:breakyoursolarcontract.com', window, selection: '20 approved city pages by observed impressions, retaining the four already fixed; inventory priority breaks ties and fills rows without demand', error, targets: selected, allApprovedCities: ordered, rawCityRows: rows };
const file = new URL('../docs/city-seo-targets-2026-11-02.json', import.meta.url);
await fs.writeFile(file, JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ source:output.source, window, error, targets:selected.map(city => ({ slug:city.slug, impressions:city.metrics?.impressions ?? null, clicks:city.metrics?.clicks ?? null })) }, null, 2));
