import { chromium, expect } from 'playwright/test';
import fs from 'node:fs/promises';

const base = process.env.RENDERER_BASE_URL || 'http://localhost:3000';
const output = process.env.RENDERER_SCREENSHOT_DIR || '/home/ubuntu/renderer-review';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const results = [];
try {
  for (const [device, viewport] of [['desktop', { width: 1440, height: 1000 }], ['mobile', { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const [kind, path] of [['houston', '/cancel-solar-contract/houston-tx'], ['blog', '/blog/how-to-get-out-of-a-solar-contract']]) {
      await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' });
      await page.locator(kind === 'houston' ? '[data-priority-city-guide]' : '[data-article-hero]').waitFor();
      await page.waitForTimeout(1800);
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow, `${kind} ${device}: no horizontal overflow`).toBe(false);
      const hero = page.locator(kind === 'houston' ? 'main > header' : '[data-article-hero]');
      const heroImage = hero.locator('img');
      expect(await heroImage.evaluate(image => image.complete && image.naturalWidth > 0), `${kind}: loaded hero`).toBe(true);
      const heroAction = hero.locator(kind === 'houston' ? 'a[href="#city-form"]' : 'a[href="/#form"]').first();
      await heroAction.focus();
      expect(await heroAction.evaluate(element => element === document.activeElement)).toBe(true);
      await page.keyboard.press('Tab');
      expect(await heroAction.evaluate(element => element !== document.activeElement)).toBe(true);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `${output}/${kind}-${device}-hero.png` });
      if (kind === 'houston') {
        const intake = await page.locator('#city-form').boundingBox();
        const answer = await page.locator('#city-answer').boundingBox();
        if (device === 'mobile') expect(intake.y < answer.y, 'mobile intake before article').toBe(true);
        else expect(Math.abs(intake.y - answer.y) < 10, 'desktop intake alongside article').toBe(true);
        await page.locator('[data-city-mid-cta]').scrollIntoViewIfNeeded();
        await page.screenshot({ path: `${output}/${kind}-${device}-documents-mid.png` });
        await page.locator('[data-city-end-cta]').scrollIntoViewIfNeeded();
        await page.screenshot({ path: `${output}/${kind}-${device}-end.png` });
        expect(await page.locator('#city-documents li').count()).toBeGreaterThan(2);
      } else {
        expect(await page.locator('[data-article-mid-cta]').count()).toBe(1);
        await page.locator('[data-article-mid-cta]').scrollIntoViewIfNeeded();
        await page.screenshot({ path: `${output}/${kind}-${device}-mid.png` });
        await page.locator('[data-article-end-cta]').scrollIntoViewIfNeeded();
        await page.screenshot({ path: `${output}/${kind}-${device}-end.png` });
      }
      const metrics = await page.evaluate(() => ({ width: window.innerWidth, documentWidth: document.documentElement.scrollWidth, paragraphs: document.querySelectorAll('.article-rich-content p').length, canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'), robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') }));
      results.push({ kind, device, metrics, errors: [...errors] });
    }
    if (device === 'mobile') {
      const checks = await page.evaluate(async () => {
        const { normalizeArticleMarkup, readableArticleMarkup, articleTopLevelBlocks } = await import('/@fs/home/ubuntu/solar-freedom/shared/articlePresentation.ts');
        const text = 'Retain every contract and all evidence before contacting the company. '.repeat(15) + 'Final sentence with an exact amount of $45.67.';
        const input = `<p id="original"><strong>${text.slice(0, 250)}</strong><a href="https://example.com/records">${text.slice(250)}</a></p><section><ul><li><p>Nested list item.</p></li></ul><img src="/manus-storage/original.webp" alt="Original asset"></section>`;
        const original = new DOMParser().parseFromString(input, 'text/html');
        const result = new DOMParser().parseFromString(readableArticleMarkup(normalizeArticleMarkup(input)), 'text/html');
        const markdown = normalizeArticleMarkup('## Actual heading\n\nFirst paragraph.\n\nSecond **emphasized** paragraph.\n\n- Existing item');
        return { textPreserved: original.body.textContent === result.body.textContent, paragraphs: result.querySelectorAll('p').length, originalIdCount: result.querySelectorAll('#original').length, linkDestinations: [...result.querySelectorAll('a')].map(a => a.getAttribute('href')), asset: result.querySelector('img').getAttribute('src'), topLevel: articleTopLevelBlocks(readableArticleMarkup(input)).length, markdownParagraphs: new DOMParser().parseFromString(markdown, 'text/html').querySelectorAll('p').length };
      });
      expect(checks.textPreserved).toBe(true);
      expect(checks.paragraphs).toBeGreaterThan(3);
      expect(checks.originalIdCount).toBe(1);
      expect(checks.linkDestinations.every(href => href === 'https://example.com/records')).toBe(true);
      expect(checks.asset).toBe('/manus-storage/original.webp');
      expect(checks.markdownParagraphs).toBe(2);
      results.push({ domPreservation: checks });
    }
    await page.close();
  }
  await fs.writeFile(`${output}/visual-results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
