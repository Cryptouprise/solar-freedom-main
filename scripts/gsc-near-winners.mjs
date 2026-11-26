/**
 * Finds near-winner pages: ranking positions 11-20 (page 2) with real
 * impression volume, plus the exact queries driving each one.
 *
 * These are the cheapest wins available — a page already on page 2 needs a
 * targeted improvement, not a new article.
 *
 * Also captures position 4-10 pages (page 1, lower half) because those are one
 * step from the top 3, where CTR jumps from ~2% to ~15%.
 */
import { createSign } from 'crypto';
import fs from 'node:fs';

const key = JSON.parse(process.env.GA4_SERVICE_ACCOUNT_JSON);
const SITE = 'sc-domain%3Abreakyoursolarcontract.com';
const b64 = (s) => Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  const h = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const p = b64(JSON.stringify({
    iss: key.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
  }));
  const s = createSign('RSA-SHA256'); s.update(`${h}.${p}`);
  const sig = s.sign(key.private_key, 'base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${h}.${p}.${sig}` }),
  });
  const d = await r.json();
  if (!d.access_token) throw new Error(JSON.stringify(d));
  return d.access_token;
}

async function q(token, body) {
  const r = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${SITE}/searchAnalytics/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  if (d.error) throw new Error(JSON.stringify(d.error).slice(0, 250));
  return d.rows ?? [];
}

const START = '2026-09-01';   // 90-day window ending 22 Nov
const END = '2026-11-22';
const token = await getToken();

// Page-level totals
const pages = await q(token, { startDate: START, endDate: END, dimensions: ['page'], rowLimit: 25000 });
console.log(`Pages with any impression in ${START}..${END}: ${pages.length}\n`);

// Page+query detail so we know which queries carry each page
const pq = await q(token, { startDate: START, endDate: END, dimensions: ['page', 'query'], rowLimit: 25000 });
const byPage = new Map();
for (const r of pq) {
  const [page, query] = r.keys;
  if (!byPage.has(page)) byPage.set(page, []);
  byPage.get(page).push({ query, impressions: r.impressions, clicks: r.clicks, position: r.position, ctr: r.ctr });
}
for (const list of byPage.values()) list.sort((a, b) => b.impressions - a.impressions);

const path = (u) => u.replace('https://breakyoursolarcontract.com', '') || '/';

// PAGE 2 (11-20) — the primary target list
const page2 = pages
  .filter((r) => r.position > 10 && r.position <= 20 && r.impressions >= 30)
  .sort((a, b) => b.impressions - a.impressions);

console.log('='.repeat(96));
console.log('PAGE 2 — ONE STEP FROM PAGE 1  (position 11-20, >=30 impressions)');
console.log('='.repeat(96));
for (const r of page2) {
  const queries = byPage.get(r.keys[0]) ?? [];
  const inRange = queries.filter((x) => x.position > 10 && x.position <= 20);
  console.log(`\n${path(r.keys[0])}`);
  console.log(`  ${r.impressions} impr | ${r.clicks} clicks | CTR ${(r.ctr * 100).toFixed(2)}% | avg pos ${r.position.toFixed(1)} | ${queries.length} queries`);
  for (const x of (inRange.length ? inRange : queries).slice(0, 6)) {
    console.log(`     pos ${x.position.toFixed(1).padStart(5)} | ${String(x.impressions).padStart(4)} impr | ${x.clicks} clicks | "${x.query}"`);
  }
}

// PAGE 1 BOTTOM (4-10) — one step from top 3
const page1 = pages
  .filter((r) => r.position > 3 && r.position <= 10 && r.impressions >= 50)
  .sort((a, b) => b.impressions - a.impressions);

console.log('\n' + '='.repeat(96));
console.log('PAGE 1, LOWER HALF — ONE STEP FROM TOP 3  (position 4-10, >=50 impressions)');
console.log('='.repeat(96));
for (const r of page1) {
  const queries = byPage.get(r.keys[0]) ?? [];
  const inRange = queries.filter((x) => x.position > 3 && x.position <= 10);
  console.log(`\n${path(r.keys[0])}`);
  console.log(`  ${r.impressions} impr | ${r.clicks} clicks | CTR ${(r.ctr * 100).toFixed(2)}% | avg pos ${r.position.toFixed(1)} | ${queries.length} queries`);
  for (const x of (inRange.length ? inRange : queries).slice(0, 6)) {
    console.log(`     pos ${x.position.toFixed(1).padStart(5)} | ${String(x.impressions).padStart(4)} impr | ${x.clicks} clicks | "${x.query}"`);
  }
}

// Opportunity size: if these page-2 pages reached position 5, what would that be worth?
console.log('\n' + '='.repeat(96));
console.log('OPPORTUNITY SIZE');
console.log('='.repeat(96));
const totalPage2Impr = page2.reduce((s, r) => s + r.impressions, 0);
const totalPage2Clicks = page2.reduce((s, r) => s + r.clicks, 0);
console.log(`  ${page2.length} pages on page 2: ${totalPage2Impr.toLocaleString()} impressions, ${totalPage2Clicks} clicks (CTR ${((totalPage2Clicks / totalPage2Impr) * 100).toFixed(2)}%)`);
console.log(`  At position 5 (~6% CTR): ${Math.round(totalPage2Impr * 0.06)} clicks  (+${Math.round(totalPage2Impr * 0.06) - totalPage2Clicks})`);
console.log(`  At position 3 (~11% CTR): ${Math.round(totalPage2Impr * 0.11)} clicks  (+${Math.round(totalPage2Impr * 0.11) - totalPage2Clicks})`);
const totalP1Impr = page1.reduce((s, r) => s + r.impressions, 0);
const totalP1Clicks = page1.reduce((s, r) => s + r.clicks, 0);
console.log(`  ${page1.length} pages on page 1 lower half: ${totalP1Impr.toLocaleString()} impressions, ${totalP1Clicks} clicks`);
console.log(`  At position 3 (~11% CTR): ${Math.round(totalP1Impr * 0.11)} clicks  (+${Math.round(totalP1Impr * 0.11) - totalP1Clicks})`);

fs.writeFileSync('/home/ubuntu/solar-freedom-deliverables/seo-2026-11-24/near-winners.json',
  JSON.stringify({ page2, page1, detail: Object.fromEntries(byPage) }, null, 2));
console.log('\nSaved to near-winners.json');