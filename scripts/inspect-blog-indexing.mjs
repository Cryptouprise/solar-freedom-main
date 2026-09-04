import { GoogleAuth } from "google-auth-library";
import mysql from "mysql2/promise";

const propertyUrl = "sc-domain:breakyoursolarcontract.com";
const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  || process.env.GSC_SERVICE_ACCOUNT_JSON
  || process.env.GA4_SERVICE_ACCOUNT_JSON;

if (!credentialsJson || !process.env.DATABASE_URL) {
  throw new Error("Google service-account credentials and DATABASE_URL are required.");
}

const db = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await db.execute(
  `SELECT url FROM seoPages WHERE pageType = 'blog' ORDER BY url`,
);

const auth = new GoogleAuth({
  credentials: JSON.parse(credentialsJson),
  scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
});
const client = await auth.getClient();
const results = [];

for (const { url } of rows) {
  const response = await client.request({
    url: "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
    method: "POST",
    data: { inspectionUrl: url, siteUrl: propertyUrl },
  });
  const status = response.data?.inspectionResult?.indexStatus ?? {};
  results.push({
    url,
    verdict: status.verdict ?? "UNKNOWN",
    coverageState: status.coverageState ?? "Unknown",
    indexingState: status.indexingState ?? "Unknown",
    lastCrawlTime: status.lastCrawlTime ?? null,
  });
}

const counts = results.reduce((acc, item) => {
  acc[item.verdict] = (acc[item.verdict] || 0) + 1;
  return acc;
}, {});

console.log(JSON.stringify({ propertyUrl, inspected: results.length, counts, results }, null, 2));
await db.end();
