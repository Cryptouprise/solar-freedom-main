/**
 * Site-wide Search Console trend, window against window.
 *
 * Why this exists: every other script here is per-page. When the question is
 * "is the site going up or down", a per-page pull cannot answer it and the
 * owner's standing question is exactly that. This prints daily totals plus a
 * like-for-like window comparison.
 *
 * Usage:
 *   node scripts/gsc-site-trend.mjs [--days 30] [--compare 30]
 *
 * Notes:
 *   Search Console has roughly a 3-day lag, so the default end date is today
 *   minus 3 days. July 2026 is excluded from any trend statement made from this
 *   data — see the change log for why.
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
const g = (n, d) => (args.indexOf(n) >= 0 ? Number(args[args.indexOf(n) + 1]) : d);
const days = g('--days', 30);
const cmp = g('--compare', 30);

const iso = (d) => d.toISOString().slice(0, 10);
const day = 864e5;
const end = iso(new Date(Date.now() - 3 * day));
const recentStart = iso(new Date(new Date(end + 'T00:00:00Z').getTime() - (days - 1) * day));
const priorEnd = iso(new Date(new Date(recentStart + 'T00:00:00Z').getTime() - day));
const priorStart = iso(new Date(new Date(priorEnd + 'T00:00:00Z').getTime() - (cmp - 1) * day));

const token = await getToken();
async function pull(startDate, endDate, dimensions, rowLimit = 25000) {
  const r = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${SITE}/searchAnalytics/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ startDate, endDate, dimensions, rowLimit }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(j));
  return j.rows || [];
}

const sum = (rows) => ({
  impressions: rows.reduce((s, r) => s + r.impressions, 0),
  clicks: rows.reduce((s, r) => s + r.clicks, 0),
});

console.log(`SITE TREND  |  sc-domain:breakyoursolarcontract.com`);
console.log(`recent : ${recentStart} to ${end}  (${days} days)`);
console.log(`prior  : ${priorStart} to ${priorEnd}  (${cmp} days)\n`);

const [rRows, pRows] = await Promise.all([
  pull(recentStart, end, ['date']),
  pull(priorStart, priorEnd, ['date']),
]);
const R = sum(rRows);
const P = sum(pRows);

const pct = (a, b) => (b === 0 ? 'n/a' : `${a >= b ? '+' : ''}${(((a - b) / b) * 100).toFixed(1)}%`);
const rCtr = R.impressions ? (R.clicks / R.impressions) * 100 : 0;
const pCtr = P.impressions ? (P.clicks / P.impressions) * 100 : 0;

const avgPos = (rows) => {
  const i = rows.reduce((s, r) => s + r.impressions, 0);
  return i ? rows.reduce((s, r) => s + r.position * r.impressions, 0) / i : 0;
};
const rPos = avgPos(rRows);
const pPos = avgPos(pRows);

console.log('                        recent        prior       change');
console.log(
  `  impressions      ${String(R.impressions).padStart(10)}  ${String(P.impressions).padStart(10)}   ${pct(R.impressions, P.impressions)}`,
);
console.log(
  `  clicks           ${String(R.clicks).padStart(10)}  ${String(P.clicks).padStart(10)}   ${pct(R.clicks, P.clicks)}`,
);
console.log(
  `  CTR              ${(rCtr.toFixed(2) + '%').padStart(10)}  ${(pCtr.toFixed(2) + '%').padStart(10)}   ${
    pCtr ? `${rCtr >= pCtr ? '+' : ''}${(rCtr - pCtr).toFixed(2)}pp` : 'n/a'
  }`,
);
console.log(
  `  avg position     ${rPos.toFixed(1).padStart(10)}  ${pPos.toFixed(1).padStart(10)}   ${
    pPos ? `${rPos <= pPos ? '' : '+'}${(rPos - pPos).toFixed(1)} (negative is better)` : 'n/a'
  }`,
);

console.log('\n  daily impressions (recent window):');
const rByDate = Object.fromEntries(rRows.map((r) => [r.keys[0], r]));
const pByDate = Object.fromEntries(pRows.map((r) => [r.keys[0], r]));
const dates = [...new Set([...Object.keys(rByDate), ...Object.keys(pByDate)])].sort();
for (const d of dates) {
  const a = rByDate[d]?.impressions ?? 0;
  const b = pByDate[d]?.impressions ?? 0;
  const bar = '#'.repeat(Math.round(a / 15));
  console.log(`    ${d}  recent ${String(a).padStart(5)}   prior ${String(b).padStart(5)}  ${bar}`);
}
