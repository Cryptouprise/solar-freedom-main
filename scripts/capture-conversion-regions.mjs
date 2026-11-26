/**
 * Captures viewport-sized screenshots of the specific conversion regions so a
 * human can judge the design, not just the DOM. Full-page screenshots of a
 * 14,000px article are unusable for review.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:3000';
const OUT = '/home/ubuntu/solar-freedom-deliverables/conversion-2026-11-24/regions';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shot(pageUrl, label, width, height, scrollTo) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const p = await ctx.newPage();
  await p.goto(BASE + pageUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForTimeout(2600);
  if (scrollTo) {
    const el = p.locator(scrollTo).first();
    if (await el.count()) {
      await el.scrollIntoViewIfNeeded();
      await p.waitForTimeout(700);
    }
  }
  await p.screenshot({ path: `${OUT}/${label}-${width}.png` });
  await ctx.close();
  console.log('captured', label, width);
}

const article = '/blog/selling-las-vegas-home-with-solar-lease-or-loan';
const cityGeneric = '/cancel-solar-contract/phoenix-az';
const cityVegas = '/cancel-solar-contract/las-vegas-nv';

// Above the fold
await shot(article, 'article-top', 390, 844);
await shot(article, 'article-top', 1440, 900);
// Mobile lead form
await shot(article, 'article-leadform', 390, 844, '#article-lead-form');
// Mid-article block
await shot(article, 'article-mid', 390, 844, '[data-article-mid-cta]');
await shot(article, 'article-mid', 1440, 900, '[data-article-mid-cta]');
// End block
await shot(article, 'article-end', 390, 844, '[data-article-end-cta]');

// City pages
await shot(cityGeneric, 'city-top', 390, 844);
await shot(cityGeneric, 'city-top', 1440, 900);
await shot(cityGeneric, 'city-form', 390, 844, '#city-form');
await shot(cityGeneric, 'city-mid', 390, 844, '[data-conversion-block="city_mid"]');
await shot(cityVegas, 'vegas-top', 390, 844);
await shot(cityVegas, 'vegas-form', 390, 844, '#city-form');

await browser.close();