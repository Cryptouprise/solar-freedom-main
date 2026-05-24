/**
 * IndexNow Submission Script
 *
 * Submits all URLs to IndexNow API (Bing, Yandex, etc.).
 * IndexNow allows up to 10,000 URLs per batch submission.
 *
 * Run: node scripts/submit-indexnow.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASE_URL = "https://breakyoursolarcontract.com";
const HOST = "breakyoursolarcontract.com";
const INDEXNOW_KEYS = [
  {
    key: "bysolarcontract2026",
    keyLocation: `${BASE_URL}/bysolarcontract2026.txt`,
    label: "verified Bing key",
  },
  {
    key: "solarfreedom2026indexnow",
    keyLocation: `${BASE_URL}/solarfreedom2026indexnow.txt`,
    label: "fallback site key",
  },
];

function getUrlsFromSitemap() {
  const sitemapPath = path.resolve(ROOT, "client/public/sitemap.xml");
  const content = fs.readFileSync(sitemapPath, "utf-8");
  const urls = [];
  const regex = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    urls.push(m[1].trim());
  }
  return urls;
}

async function submitToIndexNow(urls, keyConfig) {
  const endpoint = "https://api.indexnow.org/indexnow";
  const BATCH_SIZE = 10000;
  const batches = [];
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    batches.push(urls.slice(i, i + BATCH_SIZE));
  }

  let totalSuccess = 0;
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const payload = {
      host: HOST,
      key: keyConfig.key,
      keyLocation: keyConfig.keyLocation,
      urlList: batch,
    };

    console.log(`\nSubmitting batch ${i + 1}/${batches.length} (${batch.length} URLs)...`);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
      });

      if (response.ok || response.status === 200 || response.status === 202) {
        console.log(`Batch ${i + 1} accepted (HTTP ${response.status})`);
        totalSuccess += batch.length;
      } else {
        const body = await response.text();
        console.log(`Batch ${i + 1} returned HTTP ${response.status}: ${body}`);
      }
    } catch (err) {
      console.error(`Batch ${i + 1} failed:`, err.message);
    }
  }

  return totalSuccess;
}

async function submitToBing(urls, keyConfig) {
  const endpoint = "https://www.bing.com/indexnow";
  const payload = {
    host: HOST,
    key: keyConfig.key,
    keyLocation: keyConfig.keyLocation,
    urlList: urls.slice(0, 10000),
  };

  console.log(`\nSubmitting ${Math.min(urls.length, 10000)} URLs to Bing IndexNow...`);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });

    if (response.ok || response.status === 200 || response.status === 202) {
      console.log(`Bing accepted submission (HTTP ${response.status})`);
      return true;
    }

    const body = await response.text();
    console.log(`Bing returned HTTP ${response.status}: ${body}`);
    return false;
  } catch (err) {
    console.error("Bing submission failed:", err.message);
    return false;
  }
}

const urls = getUrlsFromSitemap();
console.log(`Found ${urls.length} URLs in sitemap`);
console.log(`Trying ${INDEXNOW_KEYS.length} IndexNow key(s)`);

let acceptedSubmission = null;
const attempts = [];

for (const keyConfig of INDEXNOW_KEYS) {
  console.log(`\nUsing ${keyConfig.label}: ${keyConfig.key}`);

  const submitted = await submitToIndexNow(urls, keyConfig);
  const bingAccepted = await submitToBing(urls, keyConfig);

  const attempt = { keyConfig, submitted, bingAccepted };
  attempts.push(attempt);

  if (submitted > 0 || bingAccepted) {
    acceptedSubmission = attempt;
    break;
  }
}

if (!acceptedSubmission) {
  console.log("\nIndexNow attempts:");
  for (const attempt of attempts) {
    console.log(
      `  - ${attempt.keyConfig.key}: ${attempt.submitted}/${urls.length} URLs, Bing accepted: ${attempt.bingAccepted}`,
    );
  }
  console.error("\nIndexNow rejected every submission. Verify the key file is live before retrying.");
  process.exitCode = 1;
} else {
  const { keyConfig, submitted } = acceptedSubmission;
  console.log(`\nIndexNow submission complete with ${keyConfig.key}: ${submitted}/${urls.length} URLs submitted`);
  console.log("\nSearch engines notified:");
  console.log("  - Bing");
  console.log("  - Yandex");
  console.log("  - Seznam");
  console.log("  - Naver");
  console.log("  - DuckDuckGo (via Bing)");
}
