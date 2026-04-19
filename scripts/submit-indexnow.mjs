/**
 * IndexNow Submission Script
 *
 * Submits all URLs to IndexNow API (Bing, Yandex, etc.)
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
const INDEXNOW_KEY = "solarfreedom2026indexnow";

// Read all URLs from the sitemap
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

async function submitToIndexNow(urls) {
  const endpoint = "https://api.indexnow.org/indexnow";
  
  // IndexNow allows up to 10,000 URLs per batch
  const BATCH_SIZE = 10000;
  const batches = [];
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    batches.push(urls.slice(i, i + BATCH_SIZE));
  }

  let totalSuccess = 0;
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const payload = {
      host: "breakyoursolarcontract.com",
      key: INDEXNOW_KEY,
      keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
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
        console.log(`✅ Batch ${i + 1} accepted (HTTP ${response.status})`);
        totalSuccess += batch.length;
      } else {
        const body = await response.text();
        console.log(`⚠️  Batch ${i + 1} returned HTTP ${response.status}: ${body}`);
      }
    } catch (err) {
      console.error(`❌ Batch ${i + 1} failed:`, err.message);
    }
  }

  return totalSuccess;
}

async function submitToBing(urls) {
  // Bing also has its own IndexNow endpoint
  const endpoint = "https://www.bing.com/indexnow";
  
  const payload = {
    host: "breakyoursolarcontract.com",
    key: INDEXNOW_KEY,
    keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urls.slice(0, 10000), // Bing limit
  };

  console.log(`\nSubmitting ${Math.min(urls.length, 10000)} URLs to Bing IndexNow...`);
  
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });

    if (response.ok || response.status === 200 || response.status === 202) {
      console.log(`✅ Bing accepted submission (HTTP ${response.status})`);
      return true;
    } else {
      const body = await response.text();
      console.log(`⚠️  Bing returned HTTP ${response.status}: ${body}`);
      return false;
    }
  } catch (err) {
    console.error(`❌ Bing submission failed:`, err.message);
    return false;
  }
}

// Main
const urls = getUrlsFromSitemap();
console.log(`📋 Found ${urls.length} URLs in sitemap`);
console.log(`🔑 Using IndexNow key: ${INDEXNOW_KEY}`);

// Submit to IndexNow API (covers Bing, Yandex, Seznam, Naver, etc.)
const submitted = await submitToIndexNow(urls);

// Also submit directly to Bing
await submitToBing(urls);

console.log(`\n✅ IndexNow submission complete: ${submitted}/${urls.length} URLs submitted`);
console.log(`\nSearch engines notified:`);
console.log(`  - Bing`);
console.log(`  - Yandex`);
console.log(`  - Seznam`);
console.log(`  - Naver`);
console.log(`  - DuckDuckGo (via Bing)`);
