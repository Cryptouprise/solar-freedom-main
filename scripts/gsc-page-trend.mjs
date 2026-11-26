/**
 * Compare a page's Search Console performance across two recent windows.
 *
 * Why this exists: the near-winners dataset spans 1 Sep – 22 Nov 2026, so a page
 * showing 214 impressions there could be earning them now or could have stopped
 * earning them weeks ago. Before changing a page's index status — which is the
 * strongest signal the site can send — the recent window has to be checked
 * separately from the older one. This does that for a list of pages in one pass.
 *
 * Usage:
 *   node scripts/gsc-page-trend.mjs <url-substring> [<url-substring> ...]
 *   node scripts/gsc-page-trend.mjs --recent 14 --older 45 <substring>
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
  const d = await r.json();
  if (!d.access_token) throw new Error(JSON.stringify(d));
  return d.access_token;
}

async function q(token, body) {
  const r = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${SITE}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  const d = await r.json();
  if (d.error) throw new Error(JSON.stringify(d.error).slice(0, 300));
  return d.rows ?? [];
}

const args = process.argv.slice(2);
const readNum = (flag, dflt) => {
  const i = args.indexOf(flag);
  return i !== -1 ? Number(args[i + 1]) : dflt;
};
const recentDays = readNum('--recent', 14);
const olderDays = readNum('--older', 45);

const endDate = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
const day = 86400000;
const recentStart = new Date(new Date(`${endDate}T00:00:00Z`).getTime() - (recentDays - 1) * day)
  .toISOString()
  .slice(0, 10);
const olderEnd = new Date(new Date(`${recentStart}T00:00:00Z`).getTime() - day)
  .toISOString()
  .slice(0, 10);
const olderStart = new Date(new Date(`${olderEnd}T00:00:00Z`).getTime() - (olderDays - 1) * day)
  .toISOString()
  .slice(0, 10);

const needles = args.filter(
  (a) => !a.startsWith('--') && !/^\d+$/.test(a) && !/^\d{4}-\d{2}-\d{2}$/.test(a),
);
if (!needles.length) {
  console.error('Usage: node scripts/gsc-page-trend.mjs <url-substring> [...]');
  process.exit(1);
}

const token = await getToken();
console.log(`RECENT ${recentStart} .. ${endDate}  (${recentDays}d)`);
console.log(`OLDER  ${olderStart} .. ${olderEnd}  (${olderDays}d)`);
console.log();

async function pull(start, end) {
  const rows = [];
  for (let startRow = 0; startRow < 250000; startRow += 25000) {
    const chunk = await q(token, { startDate: start, endDate: end, dimensions: ['page'], rowLimit: 25000, startRow });
    rows.push(...chunk);
    if (chunk.length < 25000) break;
  }
  return rows;
}

const recent = await pull(recentStart, endDate);
const older = await pull(olderStart, olderEnd);
console.log(`  pages in RECENT: ${recent.length}   pages in OLDER: ${older.length}\n`);

const fmt = (r) =>
  r
    ? `${String(r.impressions).padStart(6)} impr ${String(r.clicks).padStart(4)} clk  pos ${Number(r.position).toFixed(1).padStart(5)}`
    : '     0 impr    0 clk  pos     -';

for (const n of needles) {
  const lower = n.toLowerCase();
  const r = recent.find((x) => String(x.keys[0]).toLowerCase().includes(lower));
  const o = older.find((x) => String(x.keys[0]).toLowerCase().includes(lower));
  console.log(`### ${n}`);
  console.log(`  RECENT ${fmt(r)}`);
  console.log(`  OLDER  ${fmt(o)}`);
  if (r && o && o.impressions > 0) {
    const delta = ((r.impressions - o.impressions) / o.impressions) * 100;
    console.log(`  change: ${delta >= 0 ? '+' : ''}${delta.toFixed(0)}% impressions`);
  }
  console.log();
}
