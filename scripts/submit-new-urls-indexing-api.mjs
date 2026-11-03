/**
 * Submit only the newest high-priority URLs to the Google Indexing API.
 *
 * Why this exists: the full-sitemap submitter is quota-bound at ~195 URLs/day
 * and re-submits the whole site. When a small batch of new pages matters most,
 * spending the daily quota on them first is the better use of the limit.
 *
 * Run from the project root:
 *   node scripts/submit-new-urls-indexing-api.mjs
 */
import { createSign } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_PATH = join(__dirname, '../indexing-api-new-urls-log.json');
const BASE_URL = 'https://breakyoursolarcontract.com';

const NEW_URLS = [
  `${BASE_URL}/blog/nevada-solar-survey-price-increase-new-cancellation-window`,
  `${BASE_URL}/blog/nevada-solar-payment-before-permission-to-operate`,
  `${BASE_URL}/blog/selling-las-vegas-home-with-solar-lease-or-loan`,
  `${BASE_URL}/blog/nevada-net-metering-tier-which-one-am-i`,
  `${BASE_URL}/blog/nv-energy-demand-charge-solar-savings-2027`,
  `${BASE_URL}/blog/titan-solar-nevada-out-of-business-contract-help`,
  `${BASE_URL}/blog/nevada-solar-contract-10-day-cancellation-seniors`,
  `${BASE_URL}/blog/nevada-solar-complaint-timeline-and-cost`,
  `${BASE_URL}/cancel-solar-contract/henderson-nv`,
  `${BASE_URL}/cancel-solar-contract/summerlin-nv`,
];

const keyJson = process.env.GA4_SERVICE_ACCOUNT_JSON;
if (!keyJson) {
  console.error('ERROR: No GA4_SERVICE_ACCOUNT_JSON env var');
  process.exit(1);
}
const key = JSON.parse(keyJson);

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(JSON.stringify({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${claim}`);
  const signature = signer.sign(key.private_key);
  const jwt = `${header}.${claim}.${base64url(signature)}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function submitUrl(token, url) {
  const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, type: 'URL_UPDATED' }),
  });
  const body = await res.text();
  return { status: res.status, body };
}

const token = await getAccessToken();
const results = [];
console.log(`Submitting ${NEW_URLS.length} new URLs to the Google Indexing API...\n`);

for (const url of NEW_URLS) {
  const r = await submitUrl(token, url);
  const ok = r.status === 200;
  results.push({ url, status: r.status, ok, response: r.body.slice(0, 300) });
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${r.status}  ${url}`);
  if (!ok) console.log(`      ${r.body.slice(0, 200)}`);
  await new Promise(res => setTimeout(res, 600));
}

const accepted = results.filter(r => r.ok).length;
console.log(`\n${accepted}/${NEW_URLS.length} URLs accepted.`);

const log = existsSync(LOG_PATH) ? JSON.parse(readFileSync(LOG_PATH, 'utf8')) : [];
log.push({ submittedAt: new Date().toISOString(), accepted, total: NEW_URLS.length, results });
writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
console.log(`Log written to ${LOG_PATH}`);
