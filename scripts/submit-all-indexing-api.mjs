/**
 * Submit ALL sitemap URLs to Google Indexing API
 * Quota: 200 URLs/day per project (resets midnight Pacific)
 * 
 * Run from project root: node scripts/submit-all-indexing-api.mjs
 * 
 * This script:
 * 1. Reads all URLs from sitemap.xml
 * 2. Submits up to 200 per day (respects quota)
 * 3. Logs results with timestamps
 * 4. Can be re-run to submit remaining URLs next day
 */
import { createSign } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITEMAP_PATH = join(__dirname, '../client/public/sitemap.xml');
const LOG_PATH = join(__dirname, '../indexing-api-log.json');
const DAILY_LIMIT = 195; // Stay under 200 to be safe
const DELAY_MS = 500; // 500ms between requests

const keyJson = process.env.GA4_SERVICE_ACCOUNT_JSON;
if (!keyJson) {
  console.error('ERROR: No GA4_SERVICE_ACCOUNT_JSON env var');
  process.exit(1);
}

const key = JSON.parse(keyJson);
console.log('Using SA:', key.client_email);

// --- JWT Auth ---
function base64url(str) {
  return Buffer.from(str).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(key.private_key, 'base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const jwt = `${header}.${payload}.${sig}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Token error: ' + JSON.stringify(data));
  return data.access_token;
}

// --- Parse sitemap ---
function extractUrls(xml) {
  const matches = xml.match(/<loc>(https?:\/\/[^<]+)<\/loc>/g) || [];
  return matches.map(m => m.replace(/<\/?loc>/g, '').trim());
}

// --- Load submission log ---
function loadLog() {
  if (!existsSync(LOG_PATH)) return { submitted: [], lastRun: null };
  return JSON.parse(readFileSync(LOG_PATH, 'utf8'));
}

function saveLog(log) {
  writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
}

// --- Submit a single URL ---
async function submitUrl(token, url) {
  const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, type: 'URL_UPDATED' }),
  });
  return { status: res.status, body: await res.json() };
}

// --- Sleep helper ---
const sleep = ms => new Promise(r => setTimeout(r, ms));

// --- Main ---
const sitemapXml = readFileSync(SITEMAP_PATH, 'utf8');
const allUrls = extractUrls(sitemapXml);
console.log(`Total URLs in sitemap: ${allUrls.length}`);

const log = loadLog();
const alreadySubmitted = new Set(log.submitted.map(e => e.url));
const pending = allUrls.filter(u => !alreadySubmitted.has(u));
console.log(`Already submitted: ${alreadySubmitted.size}`);
console.log(`Pending: ${pending.length}`);

if (pending.length === 0) {
  console.log('All URLs already submitted!');
  process.exit(0);
}

const batch = pending.slice(0, DAILY_LIMIT);
console.log(`\nSubmitting ${batch.length} URLs this run...`);

const token = await getAccessToken();
console.log('Auth OK\n');

let success = 0;
let failed = 0;
const results = [];

for (let i = 0; i < batch.length; i++) {
  const url = batch[i];
  try {
    const result = await submitUrl(token, url);
    const ok = result.status === 200;
    if (ok) success++;
    else {
      failed++;
      if (result.status === 429) {
        console.log(`\nQuota exhausted at URL ${i + 1}. Stopping.`);
        break;
      }
    }
    results.push({ url, status: result.status, ts: new Date().toISOString() });
    process.stdout.write(`[${i+1}/${batch.length}] ${result.status} ${url.replace('https://breakyoursolarcontract.com', '')}\n`);
  } catch (e) {
    failed++;
    results.push({ url, status: 'error', error: e.message, ts: new Date().toISOString() });
    console.log(`ERROR: ${url} — ${e.message}`);
  }
  if (i < batch.length - 1) await sleep(DELAY_MS);
}

// Save log
log.submitted.push(...results);
log.lastRun = new Date().toISOString();
saveLog(log);

console.log(`\n=== Done ===`);
console.log(`Success: ${success}`);
console.log(`Failed: ${failed}`);
console.log(`Total submitted (all time): ${log.submitted.length}`);
console.log(`Remaining: ${allUrls.length - log.submitted.length}`);
