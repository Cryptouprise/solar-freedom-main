/**
 * Read-only Las Vegas market pull from Google Search Console.
 * Compares the latest available 28-day window against the prior 28 days,
 * then separates page performance from the actual queries people search.
 * Credentials come from the environment and are never printed.
 */
import { google } from 'googleapis';

const raw = process.env.GA4_SERVICE_ACCOUNT_JSON;
if (!raw) throw new Error('GA4_SERVICE_ACCOUNT_JSON is not configured');
const auth = new google.auth.GoogleAuth({ credentials: JSON.parse(raw), scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
const client = await auth.getClient();
const sc = google.searchconsole({ version: 'v1', auth: client });
const siteUrl = 'sc-domain:breakyoursolarcontract.com';

const iso = (d) => d.toISOString().slice(0, 10);
const shift = (days) => { const d = new Date(); d.setUTCDate(d.getUTCDate() - days); return d; };
const LAG = 3;
const currentEnd = iso(shift(LAG));
const currentStart = iso(shift(LAG + 27));
const priorEnd = iso(shift(LAG + 28));
const priorStart = iso(shift(LAG + 55));

const query = async (body) => {
  const res = await sc.searchanalytics.query({ siteUrl, requestBody: { rowLimit: 25000, ...body } });
  return res.data.rows || [];
};

const summarize = (rows) => {
  const impressions = rows.reduce((n, r) => n + r.impressions, 0);
  const clicks = rows.reduce((n, r) => n + r.clicks, 0);
  const weighted = rows.reduce((n, r) => n + r.position * r.impressions, 0);
  return {
    clicks,
    impressions,
    ctr: impressions ? +(clicks / impressions * 100).toFixed(2) : 0,
    avgPosition: impressions ? +(weighted / impressions).toFixed(2) : null,
  };
};

const VEGAS_PATTERN = /las vegas|north las vegas|henderson|summerlin|spring valley|enterprise nv|paradise nv|sunrise manor|boulder city|mesquite|nevada|clark county|nv\b/i;
const VEGAS_PAGE = /nevada|las-vegas|henderson|paradise-nv|sunrise-manor|sparks-nv|carson-city/i;

const [curPages, priorPages, curQueries, priorQueries] = await Promise.all([
  query({ startDate: currentStart, endDate: currentEnd, dimensions: ['page'] }),
  query({ startDate: priorStart, endDate: priorEnd, dimensions: ['page'] }),
  query({ startDate: currentStart, endDate: currentEnd, dimensions: ['query'] }),
  query({ startDate: priorStart, endDate: priorEnd, dimensions: ['query'] }),
]);

const clean = (u) => u.replace(/^https?:\/\/(www\.)?breakyoursolarcontract\.com/, '') || '/';
const byPage = (rows) => Object.fromEntries(rows.map((r) => [clean(r.keys[0]), r]));

const curP = byPage(curPages); const priP = byPage(priorPages);
const vegasPages = [...new Set([...Object.keys(curP), ...Object.keys(priP)])].filter((p) => VEGAS_PAGE.test(p));
const pageRows = vegasPages.map((page) => {
  const c = curP[page]; const p = priP[page];
  return {
    page,
    clicks: c?.clicks ?? 0, impressions: c?.impressions ?? 0,
    ctr: c ? +(c.ctr * 100).toFixed(2) : 0, position: c ? +c.position.toFixed(2) : null,
    priorClicks: p?.clicks ?? 0, priorImpressions: p?.impressions ?? 0,
  };
}).sort((a, b) => b.impressions - a.impressions);

const vegasQueries = curQueries
  .filter((r) => VEGAS_PATTERN.test(r.keys[0]))
  .map((r) => ({ query: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: +(r.ctr * 100).toFixed(2), position: +r.position.toFixed(2) }))
  .sort((a, b) => b.impressions - a.impressions);

const priorQueryMap = Object.fromEntries(priorQueries.map((r) => [r.keys[0], r]));
const vegasDemand = curQueries
  .filter((r) => VEGAS_PATTERN.test(r.keys[0]))
  .map((r) => ({ query: r.keys[0], impressions: r.impressions, clicks: r.clicks, position: +r.position.toFixed(2), priorImpressions: priorQueryMap[r.keys[0]]?.impressions ?? 0 }))
  .sort((a, b) => (b.impressions - b.priorImpressions) - (a.impressions - a.priorImpressions));

const report = {
  property: siteUrl,
  currentWindow: { start: currentStart, end: currentEnd },
  priorWindow: { start: priorStart, end: priorEnd },
  siteTotals: { current: summarize(curPages), prior: summarize(priorPages) },
  vegasTotals: {
    current: summarize(curPages.filter((r) => VEGAS_PAGE.test(clean(r.keys[0])))),
    prior: summarize(priorPages.filter((r) => VEGAS_PAGE.test(clean(r.keys[0])))),
  },
  vegasQueryTotals: {
    current: summarize(curQueries.filter((r) => VEGAS_PATTERN.test(r.keys[0]))),
    prior: summarize(priorQueries.filter((r) => VEGAS_PATTERN.test(r.keys[0]))),
  },
  vegasPages: pageRows,
  vegasQueries,
  fastestGrowingVegasDemand: vegasDemand.slice(0, 40),
};

const out = new URL('../docs/vegas-opportunity-report.json', import.meta.url);
const { writeFile } = await import('node:fs/promises');
await writeFile(out, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, vegasQueries: report.vegasQueries.slice(0, 25), fastestGrowingVegasDemand: report.fastestGrowingVegasDemand.slice(0, 20) }, null, 2));
