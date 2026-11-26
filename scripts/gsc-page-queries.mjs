/**
 * Pull the exact queries a page ranks for, straight from Search Console.
 *
 * Why this exists: near-winners.json caches query detail for only some pages,
 * so when a page's cached detail is empty there was no way to see what it
 * actually ranks for without re-running the whole near-winners job. This asks
 * Search Console directly for one page.
 *
 * Usage:
 *   node scripts/gsc-page-queries.mjs <url-substring> [--days 90] [--end YYYY-MM-DD]
 *   node scripts/gsc-page-queries.mjs --urls a,b,c
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
const daysIdx = args.indexOf('--days');
const days = daysIdx !== -1 ? Number(args[daysIdx + 1]) : 90;
const endIdx = args.indexOf('--end');
const endDate =
  endIdx !== -1
    ? args[endIdx + 1]
    : new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
const startDate = new Date(new Date(`${endDate}T00:00:00Z`).getTime() - (days - 1) * 86400000)
  .toISOString()
  .slice(0, 10);

const urlsIdx = args.indexOf('--urls');
let needles = [];
if (urlsIdx !== -1) {
  needles = (args[urlsIdx + 1] || '').split(',').map((s) => s.trim()).filter(Boolean);
} else {
  needles = args.filter((a) => !a.startsWith('--') && !/^\d+$/.test(a) && !/^\d{4}-/.test(a));
}
if (!needles.length) {
  console.error('Usage: node scripts/gsc-page-queries.mjs <url-substring> [--days 90]');
  process.exit(1);
}

const token = await getToken();
console.log(`GSC query detail  |  window ${startDate} to ${endDate}  |  ${days} days\n`);

/*
 * Fetch page+query pairs in one pass and filter locally.
 *
 * The obvious approach -- dimensions:['query'] with a dimensionFilterGroups
 * filter on page -- returned zero rows for pages that demonstrably have
 * impressions, so it is not trustworthy here. Pulling the pairs and filtering
 * in this process is slower but correct.
 */
const pairs = [];
for (let startRow = 0; startRow < 250000; startRow += 25000) {
  const chunk = await q(token, {
    startDate,
    endDate,
    dimensions: ['page', 'query'],
    rowLimit: 25000,
    startRow,
  });
  pairs.push(...chunk);
  if (chunk.length < 25000) break;
}
console.log(`  (scanned ${pairs.length} page/query rows site-wide)\n`);

for (const needle of needles) {
  const lower = needle.toLowerCase();
  const matching = pairs.filter((r) => String(r.keys[0]).toLowerCase().includes(lower));

  if (!matching.length) {
    console.log(`### ${needle}\n  no page/query rows in Search Console match this substring\n`);
    continue;
  }

  const byPage = new Map();
  for (const r of matching) {
    const page = r.keys[0];
    if (!byPage.has(page)) byPage.set(page, []);
    byPage.get(page).push({ query: r.keys[1], ...r });
  }

  for (const [page, rows] of byPage) {
    const imp = rows.reduce((a, r) => a + r.impressions, 0);
    const clk = rows.reduce((a, r) => a + r.clicks, 0);
    const weighted = rows.reduce((a, r) => a + r.position * r.impressions, 0);
    const pos = imp ? weighted / imp : 0;
    console.log(`### ${page}`);
    console.log(
      `  ${rows.length} queries | ${Math.round(imp)} impressions | ${Math.round(clk)} clicks | ` +
        `CTR ${imp ? ((clk / imp) * 100).toFixed(2) : '0.00'}% | avg pos ${pos.toFixed(1)}\n`,
    );
    rows
      .sort((a, b) => b.impressions - a.impressions)
      .forEach((r) => {
        console.log(
          `    ${String(Math.round(r.impressions)).padStart(5)} impr  pos ${r.position.toFixed(1).padStart(5)}  ` +
            `${String(Math.round(r.clicks)).padStart(3)} clk   ${r.query}`,
        );
      });
    console.log('');
  }
}
