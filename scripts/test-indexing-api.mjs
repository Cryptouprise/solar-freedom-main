/**
 * Test Google Indexing API with the analytics-reader service account
 * Run from project root: node scripts/test-indexing-api.mjs
 */
import { createSign } from 'crypto';

const keyJson = process.env.GA4_SERVICE_ACCOUNT_JSON;
if (!keyJson) {
  console.error('No GA4_SERVICE_ACCOUNT_JSON env var');
  process.exit(1);
}

const key = JSON.parse(keyJson);
console.log('Using SA:', key.client_email);
console.log('Project:', key.project_id);

// Create JWT for Google OAuth2
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
  if (!data.access_token) {
    console.error('Token error:', JSON.stringify(data));
    throw new Error('Failed to get access token');
  }
  return data.access_token;
}

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

// Test with a single URL first
const token = await getAccessToken();
console.log('Got access token successfully');

const testUrl = 'https://breakyoursolarcontract.com/';
const result = await submitUrl(token, testUrl);
console.log(`Test URL: ${testUrl}`);
console.log(`Status: ${result.status}`);
console.log('Response:', JSON.stringify(result.body, null, 2));
