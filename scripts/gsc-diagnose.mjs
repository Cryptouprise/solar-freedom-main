/**
 * Diagnoses why clicks fell while impressions held.
 *
 * Tests three hypotheses:
 *  1. July 2026 is a data gap, not a real collapse.
 *  2. Rankings are flat — content is being added at the same mediocre position.
 *  3. CTR fell because the mix shifted toward deeper-page queries.
 */
import { createSign } from 'crypto';

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
  if (d.error) throw new Error(JSON.stringify(d.error).slice(0, 200));
  return d.rows ?? [];
}

const iso = (d) => d.toISOString().slice(0, 10);
const token = await getToken();

// 1. July anomaly — daily view
console.log('=== JULY 2026 DAILY (is this a real collapse or a data gap?) ===');
const july = await q(token, { startDate: '2026-06-20', endDate: '2026-08-10', dimensions: ['date'], rowLimit: 100 });
for (const r of july.sort((a, b) => a.keys[0].localeCompare(b.keys[0]))) {
  const bar = '#'.repeat(Math.min(60, Math.round(r.impressions / 60)));
  console.log(`  ${r.keys[0]}  ${String(r.impressions).padStart(6)} impr  ${String(r.clicks).padStart(4)} clicks  ${bar}`);
}

// 2. Position bands — where does the site actually rank?
console.log('\n=== WHERE WE RANK (impressions by position band) ===');
for (const [label, start, end] of [['Q2 2026', '2026-04-01', '2026-06-30'], ['Q3 2026', '2026-07-01', '2026-09-30'], ['Q4 to date', '2026-10-01', '2026-11-22']]) {
  const rows = await q(token, { startDate: start, endDate: end, dimensions: ['query'], rowLimit: 25000 });
  const bands = { '1-3 (page 1 top)': 0, '4-10 (page 1)': 0, '11-20 (page 2)': 0, '21+ (page 3+)': 0 };
  let total = 0;
  for (const r of rows) {
    total += r.impressions;
    if (r.position <= 3) bands['1-3 (page 1 top)'] += r.impressions;
    else if (r.position <= 10) bands['4-10 (page 1)'] += r.impressions;
    else if (r.position <= 20) bands['11-20 (page 2)'] += r.impressions;
    else bands['21+ (page 3+)'] += r.impressions;
  }
  console.log(`  ${label} (${total.toLocaleString()} impr, ${rows.length} queries)`);
  for (const [k, v] of Object.entries(bands)) {
    console.log(`     ${k.padEnd(20)} ${String(v).padStart(7)}  ${((v / total) * 100).toFixed(1)}%`);
  }
}

// 3. Query-level winners and losers, Q2 vs Q4
console.log('\n=== BIGGEST IMPRESSION GAINS (Q4 vs Q2, per query) ===');
const [q2, q4] = await Promise.all([
  q(token, { startDate: '2026-04-01', endDate: '2026-06-30', dimensions: ['query'], rowLimit: 25000 }),
  q(token, { startDate: '2026-10-01', endDate: '2026-11-22', dimensions: ['query'], rowLimit: 25000 }),
]);
const m2 = new Map(q2.map((r) => [r.keys[0], r]));
const m4 = new Map(q4.map((r) => [r.keys[0], r]));
const deltas = [];
for (const [k, v] of m4) {
  const before = m2.get(k)?.impressions ?? 0;
  deltas.push({ q: k, before, after: v.impressions, delta: v.impressions - before, pos: v.position });
}
deltas.sort((a, b) => b.delta - a.delta);
for (const d of deltas.slice(0, 12)) {
  console.log(`  +${String(d.delta).padStart(5)}  pos ${d.pos.toFixed(1).padStart(5)}  ${d.q.slice(0, 60)}`);
}
console.log('\n=== BIGGEST IMPRESSION LOSSES ===');
for (const d of deltas.slice(-8).reverse()) {
  console.log(`  ${String(d.delta).padStart(6)}  pos ${d.pos.toFixed(1).padStart(5)}  ${d.q.slice(0, 60)}`);
}

// 4. How many queries have any data at all?
console.log(`\n=== QUERY COVERAGE ===`);
console.log(`  Q2 2026: ${m2.size} distinct queries with impressions`);
console.log(`  Q4 2026: ${m4.size} distinct queries with impressions`);
const newQueries = [...m4.keys()].filter((k) => !m2.has(k));
console.log(`  Queries appearing only in Q4: ${newQueries.length}`);
console.log(`  Total impressions from those new queries: ${newQueries.reduce((s, k) => s + m4.get(k).impressions, 0).toLocaleString()}`);