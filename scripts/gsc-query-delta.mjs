/**
 * Query-level Search Console delta between two windows.
 *
 * Why this exists: gsc-page-delta.mjs says WHICH page lost, but not WHY. Two
 * causes look identical at page level and need opposite fixes:
 *
 *   demand loss   the query itself gets fewer searches (seasonality, a news
 *                 cycle ending) — position holds or improves, impressions fall.
 *                 Nothing on the page is wrong; rewriting it changes nothing.
 *
 *   ranking loss  we slipped on the query — position gets worse while the query
 *                 keeps its volume. The page needs work.
 *
 *   click loss    impressions and position hold but clicks collapse. That is a
 *                 SERP-feature problem (AI Overviews, more ads, a richer
 *                 result above us), not a page problem.
 *
 * The three need different responses, so this prints position alongside both
 * impression and click change for each query.
 *
 * Usage:
 *   node scripts/gsc-query-delta.mjs [--days 30] [--compare 30] [--min 20] [--top 40]
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
const minImpr = g('--min', 20);
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
    body: JSON.stringify({ startDate, endDate, dimensions: ['query'], rowLimit: 25000 }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(j));
  return j.rows || [];
}

console.log(`QUERY DELTA  |  sc-domain:breakyoursolarcontract.com`);
console.log(`recent : ${recentStart} to ${end}   (${days} days)`);
console.log(`prior  : ${priorStart} to ${priorEnd}   (${cmp} days)\n`);

const [rRows, pRows] = await Promise.all([pull(recentStart, end), pull(priorStart, priorEnd)]);
const rMap = Object.fromEntries(rRows.map((r) => [r.keys[0], r]));
const pMap = Object.fromEntries(pRows.map((r) => [r.keys[0], r]));
const qs = [...new Set([...Object.keys(rMap), ...Object.keys(pMap)])];

const rows = qs.map((q) => {
  const a = rMap[q] || { impressions: 0, clicks: 0, position: 0 };
  const b = pMap[q] || { impressions: 0, clicks: 0, position: 0 };
  return {
    q,
    ri: a.impressions,
    pi: b.impressions,
    rc: a.clicks,
    pc: b.clicks,
    rp: a.position,
    pp: b.position,
    dImp: a.impressions - b.impressions,
    dClk: a.clicks - b.clicks,
    dPos: b.position && a.position ? a.position - b.position : 0,
  };
});

const R = { i: rRows.reduce((s, r) => s + r.impressions, 0), c: rRows.reduce((s, r) => s + r.clicks, 0) };
const P = { i: pRows.reduce((s, r) => s + r.impressions, 0), c: pRows.reduce((s, r) => s + r.clicks, 0) };
console.log(
  `  named queries: ${qs.length}   recent ${R.i} impr / ${R.c} clk   prior ${P.i} impr / ${P.c} clk`,
);
console.log(
  `  (Search Console anonymises low-volume queries, so these named rows are a floor on the real total)\n`,
);

// Classify every query that had real prior volume.
const big = rows.filter((r) => r.pi >= minImpr);
const demand = big.filter((r) => r.dImp < 0 && r.dPos <= 0.5).sort((a, b) => a.dImp - b.dImp);
const rank = big.filter((r) => r.dImp < 0 && r.dPos > 0.5).sort((a, b) => a.dImp - b.dImp);
const clickLoss = big.filter((r) => r.dClk < 0 && r.dPos <= 1.0 && r.dImp >= -0.1 * r.pi);

const S = (a) => a.reduce((s, r) => s + r.dImp, 0);
console.log(`=== CLASSIFIED (queries with >= ${minImpr} prior impressions) ===`);
console.log(`  DEMAND loss  (impressions fell, position held)     ${demand.length} queries, ${S(demand)} impr`);
console.log(`  RANKING loss (impressions fell AND position slipped) ${rank.length} queries, ${S(rank)} impr`);
console.log(`  CLICK loss   (position held, clicks fell anyway)    ${clickLoss.length} queries, ${clickLoss.reduce((s, r) => s + r.dClk, 0)} clicks\n`);

console.log(`=== BIGGEST DEMAND LOSSES — do NOT rewrite these pages ===`);
console.log('   dImp   dClk   pos change   prior -> recent   query');
for (const r of demand.slice(0, 20)) {
  console.log(
    `  ${String(r.dImp).padStart(5)}  ${String(r.dClk).padStart(4)}   ${r.pp.toFixed(1)} -> ${r.rp.toFixed(1)}   ${String(r.pi).padStart(5)} -> ${String(r.ri).padStart(5)}   ${r.q}`,
  );
}

console.log(`\n=== BIGGEST RANKING LOSSES — these pages need work ===`);
console.log('   dImp   dClk   pos change   prior -> recent   query');
for (const r of rank.slice(0, 20)) {
  console.log(
    `  ${String(r.dImp).padStart(5)}  ${String(r.dClk).padStart(4)}   ${r.pp.toFixed(1)} -> ${r.rp.toFixed(1)}   ${String(r.pi).padStart(5)} -> ${String(r.ri).padStart(5)}   ${r.q}`,
  );
}

console.log(`\n=== BIGGEST CLICK LOSSES AT STABLE POSITION — SERP features, not content ===`);
console.log('   dImp   dClk   pos change   prior -> recent   query');
for (const r of clickLoss.sort((a, b) => a.dClk - b.dClk).slice(0, 20)) {
  console.log(
    `  ${String(r.dImp).padStart(5)}  ${String(r.dClk).padStart(4)}   ${r.pp.toFixed(1)} -> ${r.rp.toFixed(1)}   ${String(r.pi).padStart(5)} -> ${String(r.ri).padStart(5)}   ${r.q}`,
  );
}

console.log(`\n=== BIGGEST QUERY GAINS ===`);
console.log('   dImp   dClk   pos change   prior -> recent   query');
for (const r of rows.sort((a, b) => b.dImp - a.dImp).slice(0, 20)) {
  console.log(
    `  ${String(r.dImp).padStart(5)}  ${String(r.dClk).padStart(4)}   ${r.pp.toFixed(1)} -> ${r.rp.toFixed(1)}   ${String(r.pi).padStart(5)} -> ${String(r.ri).padStart(5)}   ${r.q}`,
  );
}
