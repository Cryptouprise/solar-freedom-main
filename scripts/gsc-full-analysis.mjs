/**
 * Pull comprehensive GSC data: top queries + pages by impressions
 * Run from project root: node scripts/gsc-full-analysis.mjs
 */
import { createSign } from 'crypto';

const keyJson = process.env.GA4_SERVICE_ACCOUNT_JSON;
const key = JSON.parse(keyJson);

function base64url(str) {
  return Buffer.from(str).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function getToken(scope) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: key.client_email, scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  }));
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(key.private_key, 'base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const jwt = `${header}.${payload}.${sig}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(JSON.stringify(data));
  return data.access_token;
}

async function gscQuery(token, body) {
  const res = await fetch(
    'https://searchconsole.googleapis.com/webmasters/v3/sites/sc-domain%3Abreakysolarcontract.com/searchAnalytics/query',
    { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  return res.json();
}

async function gscQueryDomain(token, body) {
  const res = await fetch(
    'https://searchconsole.googleapis.com/webmasters/v3/sites/sc-domain%3Abreakysolarcontract.com/searchAnalytics/query',
    { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  if (!res.ok) {
    // Try www version
    const res2 = await fetch(
      'https://searchconsole.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fwww.breakyoursolarcontract.com%2F/searchAnalytics/query',
      { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );
    return res2.json();
  }
  return res.json();
}

const token = await getToken('https://www.googleapis.com/auth/webmasters.readonly');

// Try both property formats
async function tryBothProperties(token, body) {
  const properties = [
    'sc-domain:breakyoursolarcontract.com',
    'https://www.breakyoursolarcontract.com/',
    'https://breakyoursolarcontract.com/',
  ];
  for (const prop of properties) {
    const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(prop)}/searchAnalytics/query`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.rows) {
      console.log(`Using property: ${prop}`);
      return data;
    }
  }
  return null;
}

const endDate = new Date().toISOString().split('T')[0];
const startDate = new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0];

console.log(`\n=== GSC Analysis: ${startDate} to ${endDate} ===\n`);

// Top queries by impressions
console.log('--- TOP QUERIES BY IMPRESSIONS (positions 1-50) ---');
const queries = await tryBothProperties(token, {
  startDate, endDate,
  dimensions: ['query'],
  rowLimit: 50,
  orderBy: [{ fieldName: 'impressions', sortOrder: 'DESCENDING' }],
});

if (queries?.rows) {
  queries.rows.forEach((r, i) => {
    const ctr = (r.ctr * 100).toFixed(1);
    console.log(`${String(i+1).padStart(2)}. [pos ${r.position.toFixed(1)}] [${r.impressions} imp] [${r.clicks} clicks] [${ctr}% CTR] "${r.keys[0]}"`);
  });
}

// Top pages by impressions
console.log('\n--- TOP PAGES BY IMPRESSIONS ---');
const pages = await tryBothProperties(token, {
  startDate, endDate,
  dimensions: ['page'],
  rowLimit: 30,
  orderBy: [{ fieldName: 'impressions', sortOrder: 'DESCENDING' }],
});

if (pages?.rows) {
  pages.rows.forEach((r, i) => {
    const ctr = (r.ctr * 100).toFixed(1);
    const path = r.keys[0].replace('https://breakyoursolarcontract.com', '').replace('https://www.breakyoursolarcontract.com', '');
    console.log(`${String(i+1).padStart(2)}. [pos ${r.position.toFixed(1)}] [${r.impressions} imp] [${r.clicks} clicks] [${ctr}% CTR] ${path || '/'}`);
  });
}

// Near-ranking queries (positions 4-20) with high impressions
console.log('\n--- NEAR-RANKING QUERIES (pos 4-20, sorted by impressions) ---');
if (queries?.rows) {
  const nearRanking = queries.rows
    .filter(r => r.position >= 4 && r.position <= 20 && r.impressions >= 5)
    .sort((a, b) => b.impressions - a.impressions);
  nearRanking.forEach((r, i) => {
    const ctr = (r.ctr * 100).toFixed(1);
    console.log(`${String(i+1).padStart(2)}. [pos ${r.position.toFixed(1)}] [${r.impressions} imp] [${r.clicks} clicks] "${r.keys[0]}"`);
  });
}

// Zero-click queries with impressions
console.log('\n--- ZERO-CLICK QUERIES WITH IMPRESSIONS (opportunity list) ---');
if (queries?.rows) {
  const zeroClick = queries.rows
    .filter(r => r.clicks === 0 && r.impressions >= 3)
    .sort((a, b) => b.impressions - a.impressions);
  zeroClick.slice(0, 20).forEach((r, i) => {
    console.log(`${String(i+1).padStart(2)}. [pos ${r.position.toFixed(1)}] [${r.impressions} imp] "${r.keys[0]}"`);
  });
}
