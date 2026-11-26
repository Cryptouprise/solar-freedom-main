/**
 * Per-page Search Console delta between two windows.
 *
 * Why this exists: gsc-site-trend.mjs shows the site total moved, but not where.
 * A total can fall while nine pages rise, and fixing the wrong page wastes the
 * whole session. This ranks pages by absolute change in impressions and clicks
 * so the loss is attributed to specific URLs before any content is touched.
 *
 * Usage:
 *   node scripts/gsc-page-delta.mjs [--days 30] [--compare 30] [--min 50] [--top 40]
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
const minImpr = g('--min', 30);
const top = g('--top', 40);

const iso = (d) => d.toISOString().slice(0, 10);
const day = 864e5;
const end = iso(new Date(Date.now() - 3 * day));
const recentStart = iso(new Date(new Date(end + 'T00:00:00Z').getTime() - (days - 1) * day));
const priorEnd = iso(new Date(new Date(recentStart + 'T00:00:00Z').getTime() - day));
const priorStart = iso(new Date(new Date(priorEnd + 'T00:00:00Z').getTime() - (cmp - 1) * day));

const token = await getToken();
async function pull(startDate, endDate) {
  const r = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${SITE}/searchAnalytics/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ startDate, endDate, dimensions: ['page'], rowLimit: 25000 }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(j));
  return j.rows || [];
}

console.log(`PAGE DELTA  |  sc-domain:breakyoursolarcontract.com`);
console.log(`recent : ${recentStart} to ${end}   (${days} days)`);
console.log(`prior  : ${priorStart} to ${priorEnd}   (${cmp} days)\n`);

const [rRows, pRows] = await Promise.all([pull(recentStart, end), pull(priorStart, priorEnd)]);
const rMap = Object.fromEntries(rRows.map((r) => [r.keys[0], r]));
const pMap = Object.fromEntries(pRows.map((r) => [r.keys[0], r]));
const urls = [...new Set([...Object.keys(rMap), ...Object.keys(pMap)])];

const short = (u) => u.replace('https://breakyoursolarcontract.com', '') || '/';

const rows = urls.map((u) => {
  const a = rMap[u] || { impressions: 0, clicks: 0, position: 0 };
  const b = pMap[u] || { impressions: 0, clicks: 0, position: 0 };
  return {
    url: u,
    ri: a.impressions,
    pi: b.impressions,
    rc: a.clicks,
    pc: b.clicks,
    rp: a.position,
    pp: b.position,
    dImp: a.impressions - b.impressions,
    dClk: a.clicks - b.clicks,
  };
});

const losers = rows.filter((r) => r.pi >= minImpr && r.dImp < 0).sort((a, b) => a.dImp - b.dImp);
const winners = rows.filter((r) => r.dImp > 0).sort((a, b) => b.dImp - a.dImp);

const totalLoss = losers.reduce((s, r) => s + r.dImp, 0);
const totalGain = winners.reduce((s, r) => s + r.dImp, 0);
console.log(`  total impressions LOST across ${losers.length} pages : ${totalLoss}`);
console.log(`  total impressions GAINED across ${winners.length} pages : +${totalGain}`);
console.log(`  net : ${totalLoss + totalGain}\n`);

console.log(`=== TOP ${top} LOSERS (prior >= ${minImpr} impressions) ===`);
console.log('   dImp   dClk    prior -> recent   position        page');
for (const r of losers.slice(0, top)) {
  console.log(
    `  ${String(r.dImp).padStart(5)}  ${String(r.dClk).padStart(4)}   ${String(r.pi).padStart(5)} -> ${String(r.ri).padStart(5)}   ${r.pp.toFixed(1)} -> ${r.rp.toFixed(1)}   ${short(r.url)}`,
  );
}

console.log(`\n=== TOP 25 GAINERS ===`);
console.log('   dImp   dClk    prior -> recent   position        page');
for (const r of winners.slice(0, 25)) {
  console.log(
    `  ${String(r.dImp).padStart(5)}  ${String(r.dClk).padStart(4)}   ${String(r.pi).padStart(5)} -> ${String(r.ri).padStart(5)}   ${r.pp.toFixed(1)} -> ${r.rp.toFixed(1)}   ${short(r.url)}`,
  );
}
