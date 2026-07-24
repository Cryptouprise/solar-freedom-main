/**
 * Submit all sitemap URLs to Google Indexing API
 * - Tracks which URLs have already been submitted in indexing-api-log.json
 * - Skips already-submitted URLs (only submits new/unsubmitted ones)
 * - Saves progress after every successful submission so quota stops never lose progress
 * Run from project root: node scripts/submit-all-to-indexing-api.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createSign } from 'crypto';

const LOG_FILE = 'indexing-api-log.json';

// Load existing log
let log = { submitted: [] };
if (existsSync(LOG_FILE)) {
  try {
    log = JSON.parse(readFileSync(LOG_FILE, 'utf8'));
    if (!Array.isArray(log.submitted)) log.submitted = [];
  } catch (e) {
    console.warn('Could not parse log file, starting fresh');
    log = { submitted: [] };
  }
}

const alreadySubmitted = new Set(log.submitted.map(e => e.url));

// Parse service account key
const key = JSON.parse(process.env.GA4_SERVICE_ACCOUNT_JSON);
console.log('Service account:', key.client_email);

// Create JWT for Google OAuth2
function createJWT() {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  })).toString('base64url');
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(key.private_key, 'base64url');
  return `${header}.${payload}.${sig}`;
}

async function getAccessToken() {
  const jwt = createJWT();
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

// Read all URLs from sitemap
const xml = readFileSync('client/public/sitemap.xml', 'utf8');
const matches = xml.match(/<loc>(https:\/\/breakyoursolarcontract\.com[^<]*)<\/loc>/g) || [];
const allUrls = matches.map(m => m.replace(/<\/?loc>/g, ''));

// Filter to only unsubmitted URLs
const pendingUrls = allUrls.filter(url => !alreadySubmitted.has(url));

console.log(`Total URLs in sitemap:     ${allUrls.length}`);
console.log(`Already submitted:         ${alreadySubmitted.size}`);
console.log(`Pending (to submit now):   ${pendingUrls.length}`);

if (pendingUrls.length === 0) {
  console.log('\nAll URLs already submitted! Nothing to do.');
  process.exit(0);
}

function saveLog() {
  log.lastRun = new Date().toISOString();
  log.totalUrls = allUrls.length;
  writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

async function submitPending() {
  const token = await getAccessToken();
  console.log('Got access token\n');

  let success = 0, fail = 0;
  const errors = [];

  for (let i = 0; i < pendingUrls.length; i++) {
    const url = pendingUrls[i];
    try {
      const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, type: 'URL_UPDATED' }),
      });

      if (res.ok) {
        success++;
        log.submitted.push({ url, status: 200, ts: new Date().toISOString() });
        // Save after every submission so quota stops never lose progress
        saveLog();
      } else if (res.status === 429) {
        console.log(`\nDaily quota hit at URL ${i + 1}/${pendingUrls.length}`);
        console.log(`Submitted ${success} new URLs today. ${pendingUrls.length - i} remain for tomorrow.`);
        saveLog();
        break;
      } else {
        const err = await res.text();
        fail++;
        if (errors.length < 5) errors.push(`${res.status}: ${url} — ${err.substring(0, 120)}`);
      }
    } catch (e) {
      fail++;
    }

    // Progress update every 10 URLs
    if ((i + 1) % 10 === 0) {
      await new Promise(r => setTimeout(r, 300));
      process.stdout.write(`\rProgress: ${i + 1}/${pendingUrls.length} new URLs — success:${success} failed:${fail}`);
    }
  }

  console.log(`\n\n=== DONE ===`);
  console.log(`Submitted this run:      ${success}`);
  console.log(`Failed:                  ${fail}`);
  console.log(`Total ever submitted:    ${log.submitted.length} / ${allUrls.length}`);
  console.log(`Remaining:               ${allUrls.length - log.submitted.length}`);

  if (errors.length) {
    console.log('\nSample errors:');
    errors.forEach(e => console.log(' -', e));
  }

  saveLog();
}

submitPending().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
