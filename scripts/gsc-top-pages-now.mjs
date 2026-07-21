import { google } from 'googleapis';

const raw = process.env.GA4_SERVICE_ACCOUNT_JSON;
const credentials = JSON.parse(raw);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
});

const client = await auth.getClient();
const sc = google.searchconsole({ version: 'v1', auth: client });

// Get top pages by impressions
const res = await sc.searchanalytics.query({
  siteUrl: 'sc-domain:breakyoursolarcontract.com',
  requestBody: {
    startDate: '2026-06-20',
    endDate: '2026-07-20',
    dimensions: ['page'],
    rowLimit: 50
  }
});

const rows = res.data.rows || [];
rows.sort((a, b) => b.impressions - a.impressions);

console.log('\n=== TOP 25 PAGES BY IMPRESSIONS (last 30 days) ===');
rows.slice(0, 25).forEach((r, i) => {
  const page = r.keys[0].replace('https://breakyoursolarcontract.com', '');
  const ctr = r.ctr ? (r.ctr * 100).toFixed(1) + '%' : '0%';
  console.log(`${i+1}. ${page}`);
  console.log(`   imp: ${r.impressions} | pos: ${r.position?.toFixed(1)} | clicks: ${r.clicks} | CTR: ${ctr}`);
});

// Also get top queries for GoodLeap and Sunrun
const goodleapRes = await sc.searchanalytics.query({
  siteUrl: 'sc-domain:breakyoursolarcontract.com',
  requestBody: {
    startDate: '2026-06-20',
    endDate: '2026-07-20',
    dimensions: ['query'],
    dimensionFilterGroups: [{ filters: [{ dimension: 'query', operator: 'contains', expression: 'goodleap' }] }],
    rowLimit: 10
  }
});
console.log('\n=== GOODLEAP QUERIES ===');
(goodleapRes.data.rows || []).sort((a,b) => b.impressions - a.impressions).forEach(r => {
  console.log(`  "${r.keys[0]}" | imp: ${r.impressions} | pos: ${r.position?.toFixed(1)} | clicks: ${r.clicks}`);
});

const sunrunRes = await sc.searchanalytics.query({
  siteUrl: 'sc-domain:breakyoursolarcontract.com',
  requestBody: {
    startDate: '2026-06-20',
    endDate: '2026-07-20',
    dimensions: ['query'],
    dimensionFilterGroups: [{ filters: [{ dimension: 'query', operator: 'contains', expression: 'sunrun' }] }],
    rowLimit: 10
  }
});
console.log('\n=== SUNRUN QUERIES ===');
(sunrunRes.data.rows || []).sort((a,b) => b.impressions - a.impressions).forEach(r => {
  console.log(`  "${r.keys[0]}" | imp: ${r.impressions} | pos: ${r.position?.toFixed(1)} | clicks: ${r.clicks}`);
});
