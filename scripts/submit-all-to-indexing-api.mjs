/**
 * Submit all sitemap URLs to Google Indexing API
 * Run from project root: node scripts/submit-all-to-indexing-api.mjs
 */
import { readFileSync } from 'fs';
import { createSign } from 'crypto';

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
const urls = matches.map(m => m.replace(/<\/?loc>/g, ''));
console.log('Total URLs to submit:', urls.length);

async function submitAll() {
  const token = await getAccessToken();
  console.log('Got access token ✓');

  let success = 0, fail = 0, quota = 0;
  const errors = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
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
      } else if (res.status === 429) {
        quota++;
        console.log('Rate limit hit at URL', i + 1, '- stopping');
        break;
      } else {
        const err = await res.text();
        fail++;
        if (errors.length < 5) errors.push(`${res.status}: ${url} — ${err.substring(0, 120)}`);
      }
    } catch (e) {
      fail++;
    }

    // Small delay every 10 URLs to avoid rate limiting
    if ((i + 1) % 10 === 0) {
      await new Promise(r => setTimeout(r, 300));
      process.stdout.write(`\rProgress: ${i + 1}/${urls.length} — ✓${success} ✗${fail}`);
    }
  }

  console.log(`\n\nDONE.`);
  console.log(`✓ Success: ${success}`);
  console.log(`✗ Failed: ${fail}`);
  if (quota) console.log(`⚠ Quota limit hit after ${success + fail} submissions`);
  if (errors.length) {
    console.log('\nSample errors:');
    errors.forEach(e => console.log(' -', e));
  }
}

submitAll().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
