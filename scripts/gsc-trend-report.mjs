/**
 * Month-over-month Search Console comparison.
 *
 * Answers one question with real numbers: are impressions, clicks, CTR and
 * position actually improving, and by how much?
 *
 * Search Console carries roughly a 3-day lag, so the current month is compared
 * against the same number of elapsed days in the prior month rather than
 * against a full month. Comparing 24 days against 31 would manufacture a
 * decline that does not exist.
 */
import { createSign } from 'crypto';

const key = JSON.parse(process.env.GA4_SERVICE_ACCOUNT_JSON);
const SITE = 'sc-domain%3Abreakyoursolarcontract.com';
const b64 = (s) => Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64(JSON.stringify({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  }));
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(key.private_key, 'base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${header}.${payload}.${sig}` }),
  });
  const d = await res.json();
  if (!d.access_token) throw new Error(JSON.stringify(d));
  return d.access_token;
}

async function q(token, body) {
  const res = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${SITE}/searchAnalytics/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const d = await res.json();
  if (d.error) throw new Error(JSON.stringify(d.error).slice(0, 300));
  return d.rows ?? [];
}

const iso = (d) => d.toISOString().slice(0, 10);
const token = await getToken();

// Latest date with data
const recent = await q(token, { startDate: iso(new Date(Date.now() - 10 * 864e5)), endDate: iso(new Date()), dimensions: ['date'], rowLimit: 100 });
const dates = recent.map((r) => r.keys[0]).sort();
const latest = dates[dates.length - 1];
console.log('Latest date with data:', latest, '\n');

// Build monthly windows from Jan 2026 through latest
const latestDate = new Date(latest + 'T00:00:00Z');
const months = [];
for (let y = 2026, m = 0; m <= latestDate.getUTCMonth() || y < latestDate.getUTCFullYear(); m++) {
  if (m > 11) { m = 0; y++; }
  if (y > latestDate.getUTCFullYear() || (y === latestDate.getUTCFullYear() && m > latestDate.getUTCMonth())) break;
  months.push({ y, m });
}

console.log('MONTH        IMPRESSIONS   CLICKS   CTR      AVG POS   DAYS');
console.log('-'.repeat(66));
const rows = [];
for (const { y, m } of months) {
  const start = new Date(Date.UTC(y, m, 1));
  const monthEnd = new Date(Date.UTC(y, m + 1, 0));
  const end = monthEnd > latestDate ? latestDate : monthEnd;
  const r = await q(token, { startDate: iso(start), endDate: iso(end), dimensions: [], rowLimit: 1 });
  const days = Math.round((end - start) / 864e5) + 1;
  const x = r[0] ?? { impressions: 0, clicks: 0, ctr: 0, position: 0 };
  const label = `${y}-${String(m + 1).padStart(2, '0')}`;
  rows.push({ label, days, ...x });
  console.log(
    `${label}      ${String(x.impressions).padStart(10)}   ${String(x.clicks).padStart(6)}   ` +
    `${(x.ctr * 100).toFixed(2).padStart(5)}%   ${(x.position || 0).toFixed(1).padStart(6)}   ${String(days).padStart(3)}`
  );
}

// Like-for-like: compare elapsed days of latest month vs same days of prior month
if (rows.length >= 2) {
  const cur = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  const curPerDay = cur.impressions / cur.days;
  const prevPerDay = prev.impressions / prev.days;
  console.log('\nLIKE-FOR-LIKE (per day, removes month-length distortion):');
  console.log(`  ${prev.label}: ${prevPerDay.toFixed(1)} impressions/day, ${(prev.clicks / prev.days).toFixed(2)} clicks/day`);
  console.log(`  ${cur.label}: ${curPerDay.toFixed(1)} impressions/day, ${(cur.clicks / cur.days).toFixed(2)} clicks/day`);
  console.log(`  Change: ${(((curPerDay - prevPerDay) / prevPerDay) * 100).toFixed(1)}% impressions, ${((((cur.clicks / cur.days) - (prev.clicks / prev.days)) / (prev.clicks / prev.days)) * 100).toFixed(1)}% clicks`);
}

// Quarterly view
console.log('\nQUARTERLY (impressions):');
for (const [qs, qe, label] of [
  ['2026-01-01', '2026-03-31', 'Q1 2026'],
  ['2026-04-01', '2026-06-30', 'Q2 2026'],
  ['2026-07-01', '2026-09-30', 'Q3 2026'],
  ['2026-10-01', latest, 'Q4 2026 to date'],
]) {
  if (new Date(qs) > latestDate) continue;
  const end = new Date(qe) > latestDate ? latest : qe;
  const r = await q(token, { startDate: qs, endDate: end, dimensions: [], rowLimit: 1 });
  const x = r[0] ?? { impressions: 0, clicks: 0, ctr: 0, position: 0 };
  console.log(`  ${label.padEnd(20)} ${String(x.impressions).padStart(8)} impr  ${String(x.clicks).padStart(5)} clicks  CTR ${(x.ctr * 100).toFixed(2)}%  pos ${(x.position || 0).toFixed(1)}`);
}