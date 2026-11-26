/**
 * Which pages rank for one query.
 *
 * Why this exists: gsc-page-queries.mjs goes page -> queries and
 * gsc-exact-page-queries.mjs goes exact page -> queries. Neither answers the
 * cannibalization question, which is whether MORE THAN ONE of our pages is
 * competing for the same query. When two do, they split the signal and neither
 * ranks as well as one would alone, and no amount of snippet work fixes it.
 *
 * Usage:
 *   node scripts/gsc-query-pages.mjs "blue raven solar reviews" [--days 90]
 *
 * Read-only. Writes nothing.
 */
import { createSign } from 'crypto';
const key = JSON.parse(process.env.GA4_SERVICE_ACCOUNT_JSON);
const SITE = 'sc-domain%3Abreakyoursolarcontract.com';
const b64 = (s) =>
  Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  const h = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const p = b64(
    JSON.stringify({
      iss: key.client_email,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  );
  const s = createSign('RSA-SHA256');
  s.update(`${h}.${p}`);
  const sig = s.sign(key.private_key, 'base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${h}.${p}.${sig}`,
    }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(JSON.stringify(j));
  return j.access_token;
}

const args = process.argv.slice(2);
const query = args.find((a) => !a.startsWith('--'));
if (!query) {
  console.error('usage: node scripts/gsc-query-pages.mjs "<query>" [--days 90]');
  process.exit(1);
}
const di = args.indexOf('--days');
const days = di >= 0 ? Number(args[di + 1]) : 90;

const end = new Date(Date.now() - 3 * 86400000);
const start = new Date(end.getTime() - (days - 1) * 86400000);
const fmt = (d) => d.toISOString().slice(0, 10);

const token = await getToken();
const res = await fetch(
  `https://www.googleapis.com/webmasters/v3/sites/${SITE}/searchAnalytics/query`,
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startDate: fmt(start),
      endDate: fmt(end),
      dimensions: ['page'],
      dimensionFilterGroups: [
        { filters: [{ dimension: 'query', operator: 'equals', expression: query }] },
      ],
      rowLimit: 50,
    }),
  },
);
const data = await res.json();
if (data.error) throw new Error(JSON.stringify(data.error));

const rows = (data.rows ?? []).map((r) => ({
  page: r.keys[0].replace('https://breakyoursolarcontract.com', '') || '/',
  clicks: r.clicks,
  impressions: r.impressions,
  ctr: r.ctr,
  position: r.position,
}));
rows.sort((a, b) => b.impressions - a.impressions);

console.log(`QUERY -> PAGES  |  "${query}"`);
console.log(`window ${fmt(start)} to ${fmt(end)}  |  ${days} days`);
console.log(`  ${rows.length} page(s) ranked\n`);
console.log('  impr   clk    pos   ctr      page');
for (const r of rows) {
  console.log(
    `  ${String(r.impressions).padStart(5)}  ${String(r.clicks).padStart(3)}  ${r.position
      .toFixed(1)
      .padStart(5)}  ${(r.ctr * 100).toFixed(1).padStart(4)}%   ${r.page}`,
  );
}
if (rows.length > 1) {
  const total = rows.reduce((s, r) => s + r.impressions, 0);
  console.log(
    `\n  CANNIBALIZATION: ${rows.length} of our pages compete for this query, ${total} impressions split between them.`,
  );
} else if (rows.length === 1) {
  console.log('\n  No cannibalization: one page holds this query.');
}
