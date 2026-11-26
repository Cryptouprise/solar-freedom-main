/**
 * Finds queries where more than one of our own pages appears.
 *
 * When two pages compete for the same query, Google splits authority between
 * them and neither ranks as well as one consolidated page would. This is the
 * most common cause of a page stalling at position 11-15.
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

const path = (u) => u.replace('https://breakyoursolarcontract.com', '') || '/';
const token = await getToken();
const START = '2026-09-01', END = '2026-11-22';

const rows = await q(token, { startDate: START, endDate: END, dimensions: ['query', 'page'], rowLimit: 25000 });

const byQuery = new Map();
for (const r of rows) {
  const [query, page] = r.keys;
  if (!byQuery.has(query)) byQuery.set(query, []);
  byQuery.get(query).push({ page: path(page), impressions: r.impressions, clicks: r.clicks, position: r.position });
}

const conflicts = [];
for (const [query, pages] of byQuery) {
  if (pages.length < 2) continue;
  const total = pages.reduce((s, p) => s + p.impressions, 0);
  if (total < 20) continue;
  pages.sort((a, b) => b.impressions - a.impressions);
  conflicts.push({ query, total, pages });
}
conflicts.sort((a, b) => b.total - a.total);

console.log(`Queries where 2+ of our pages appear (>=20 total impressions): ${conflicts.length}\n`);
console.log('='.repeat(100));
for (const c of conflicts.slice(0, 25)) {
  console.log(`\n"${c.query}"  — ${c.total} total impressions, split across ${c.pages.length} pages`);
  for (const p of c.pages) {
    console.log(`    pos ${p.position.toFixed(1).padStart(5)} | ${String(p.impressions).padStart(4)} impr | ${p.clicks} clicks | ${p.page}`);
  }
  // Quantify the cost: the weaker page's impressions are effectively wasted
  const wasted = c.total - c.pages[0].impressions;
  console.log(`    -> ${wasted} impressions (${((wasted / c.total) * 100).toFixed(0)}%) go to the weaker duplicate`);
}

// Aggregate by page pair to find the worst duplicating pairs
const pairs = new Map();
for (const c of conflicts) {
  for (let i = 0; i < c.pages.length; i++) {
    for (let j = i + 1; j < c.pages.length; j++) {
      const k = [c.pages[i].page, c.pages[j].page].sort().join('  ||  ');
      if (!pairs.has(k)) pairs.set(k, { queries: 0, impressions: 0 });
      const v = pairs.get(k);
      v.queries += 1;
      v.impressions += c.pages[j].impressions;
    }
  }
}
const worst = [...pairs.entries()].sort((a, b) => b[1].impressions - a[1].impressions);
console.log('\n' + '='.repeat(100));
console.log('WORST DUPLICATING PAGE PAIRS');
console.log('='.repeat(100));
for (const [pair, v] of worst.slice(0, 10)) {
  console.log(`\n  ${v.queries} shared queries | ${v.impressions} impressions on the weaker page`);
  for (const p of pair.split('  ||  ')) console.log(`     ${p}`);
}

fs.writeFileSync('/home/ubuntu/solar-freedom-deliverables/seo-2026-11-24/cannibalization.json',
  JSON.stringify({ conflicts, worstPairs: worst.slice(0, 20) }, null, 2));
console.log('\nSaved to cannibalization.json');