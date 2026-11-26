/**
 * Exact-URL variant of gsc-page-queries.mjs.
 *
 * Why this exists: gsc-page-queries.mjs filters with String.includes(), so the
 * substring "/" matches EVERY page on the site and the homepage query detail is
 * impossible to isolate. This one requires an exact page-URL equality match, and
 * also prints the page's own totals so the query rows can be sanity-checked
 * against the page-level figure.
 *
 * Usage:
 *   node scripts/gsc-exact-page-queries.mjs <exact-url-or-path> [--days 90] [--end YYYY-MM-DD]
 *   node scripts/gsc-exact-page-queries.mjs https://breakyoursolarcontract.com/ --days 90
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
  if (!j.access_token) throw new Error('token failed: ' + JSON.stringify(j));
  return j.access_token;
}

const args = process.argv.slice(2);
const daysIdx = args.indexOf('--days');
const endIdx = args.indexOf('--end');
const days = daysIdx >= 0 ? Number(args[daysIdx + 1]) : 90;

function iso(d) {
  return d.toISOString().slice(0, 10);
}
const end = endIdx >= 0 ? args[endIdx + 1] : iso(new Date(Date.now() - 3 * 864e5));
const start = iso(new Date(new Date(end + 'T00:00:00Z').getTime() - (days - 1) * 864e5));

const needle = args.find((a) => !a.startsWith('--') && !/^\d+$/.test(a) && !/^\d{4}-/.test(a));
if (!needle) {
  console.error('Usage: node scripts/gsc-exact-page-queries.mjs <exact-url-or-path> [--days 90]');
  process.exit(1);
}
const target = needle.startsWith('http')
  ? needle
  : 'https://breakyoursolarcontract.com' + (needle.startsWith('/') ? needle : '/' + needle);

const token = await getToken();

async function pull(dimensions, rowLimit) {
  const r = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${SITE}/searchAnalytics/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ startDate: start, endDate: end, dimensions, rowLimit }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(j));
  return j.rows || [];
}

console.log(`GSC exact page  |  ${target}`);
console.log(`window ${start} to ${end}  |  ${days} days\n`);

// Page-level totals, so the query rows can be reconciled against them.
const pageRows = await pull(['page'], 5000);
const pageRow = pageRows.find((r) => r.keys[0] === target);
if (!pageRow) {
  console.log('  no page-level row for this exact URL in the window');
} else {
  const [impr, clk] = [pageRow.impressions, pageRow.clicks];
  console.log(
    `  PAGE TOTAL  ${impr} impressions | ${clk} clicks | CTR ${((clk / impr) * 100).toFixed(2)}% | avg pos ${pageRow.position.toFixed(1)}\n`,
  );
}

const pairs = await pull(['page', 'query'], 25000);
const rows = pairs.filter((r) => r.keys[0] === target);
if (!rows.length) {
  console.log('  no page/query rows for this exact URL');
  process.exit(0);
}
rows.sort((a, b) => b.impressions - a.impressions);

const qImpr = rows.reduce((s, r) => s + r.impressions, 0);
const qClk = rows.reduce((s, r) => s + r.clicks, 0);
console.log(`  ${rows.length} query rows | ${qImpr} impressions | ${qClk} clicks`);
if (pageRow) {
  const share = ((qImpr / pageRow.impressions) * 100).toFixed(0);
  console.log(
    `  (${share}% of the page total — Search Console anonymises the rest, so this list is a floor, not the whole picture)\n`,
  );
}

console.log('  impr    clk   pos    query');
for (const r of rows) {
  console.log(
    `  ${String(r.impressions).padStart(4)}  ${String(r.clicks).padStart(5)}  ${r.position.toFixed(1).padStart(5)}    ${r.keys[1]}`,
  );
}
