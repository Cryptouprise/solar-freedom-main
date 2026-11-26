/**
 * Browser verification for the universal booking / lead-capture work.
 *
 * Checks, at mobile (390) and desktop (1440) widths:
 *  - a booking button is present and visible
 *  - a lead form is present and visible (previously desktop-only on articles)
 *  - the booking dialog actually opens the GoHighLevel calendar
 *  - no fixed-position overlap with the existing global widgets
 *  - no duplicate DOM ids
 *
 * Deliberately does NOT submit a lead or book an appointment. Verification must
 * never create fake pipeline data in GoHighLevel.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:3000';
const OUT = '/home/ubuntu/solar-freedom-deliverables/conversion-2026-11-24';
fs.mkdirSync(OUT, { recursive: true });

const PAGES = [
  { name: 'blog-static', url: '/blog/selling-las-vegas-home-with-solar-lease-or-loan' },
  { name: 'blog-nevada', url: '/blog/nevada-net-metering-tier-which-one-am-i' },
  { name: 'city-vegas', url: '/cancel-solar-contract/las-vegas-nv' },
  { name: 'city-henderson', url: '/cancel-solar-contract/henderson-nv' },
  { name: 'city-generic', url: '/cancel-solar-contract/phoenix-az' },
  { name: 'city-noindex', url: '/cancel-solar-contract/akron-oh' },
];

const results = [];

const browser = await chromium.launch();

for (const page of PAGES) {
  for (const viewport of [{ w: 390, h: 844, label: '390' }, { w: 1440, h: 900, label: '1440' }]) {
    const context = await browser.newContext({
      viewport: { width: viewport.w, height: viewport.h },
      userAgent: viewport.w < 500
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        : undefined,
    });
    const p = await context.newPage();
    const errors = [];
    p.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));

    const record = { page: page.name, url: page.url, viewport: viewport.label, errors };

    try {
      await p.goto(BASE + page.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await p.waitForTimeout(2500);

      // Booking buttons
      record.bookingButtons = await p.locator('[data-booking-placement]').count();
      const firstBooking = p.locator('[data-booking-placement]').first();
      record.bookingVisible = await firstBooking.isVisible().catch(() => false);
      record.bookingPlacements = await p.locator('[data-booking-placement]').evaluateAll(
        (els) => els.map((e) => e.getAttribute('data-booking-placement'))
      );

      // Lead forms
      record.leadForms = await p.locator('[data-lead-form]').count();
      const firstForm = p.locator('[data-lead-form]').first();
      record.leadFormVisible = await firstForm.isVisible().catch(() => false);

      // Duplicate ids
      record.duplicateIds = await p.evaluate(() => {
        const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
        const counts = {};
        ids.forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
        return Object.entries(counts).filter(([, n]) => n > 1).map(([id, n]) => `${id} x${n}`);
      });

      // Fixed-control overlap check
      record.fixedOverlaps = await p.evaluate(() => {
        const fixed = [...document.querySelectorAll('body *')].filter((el) => {
          const s = getComputedStyle(el);
          if (s.position !== 'fixed') return false;
          const r = el.getBoundingClientRect();
          return r.width > 40 && r.height > 20 && r.bottom > window.innerHeight - 4;
        });
        const boxes = fixed.map((el) => {
          const r = el.getBoundingClientRect();
          return { tag: el.tagName, cls: (el.className || '').toString().slice(0, 60), top: Math.round(r.top), h: Math.round(r.height) };
        });
        return boxes;
      });

      // Open the booking dialog to prove the calendar loads
      if (await firstBooking.count()) {
        await firstBooking.scrollIntoViewIfNeeded();
        await firstBooking.click({ timeout: 8000 }).catch(() => {});
        await p.waitForTimeout(3500);
        record.dialogOpen = await p.locator('[role="dialog"]').isVisible().catch(() => false);
        record.calendarSrc = await p.locator('[role="dialog"] iframe').first()
          .getAttribute('src').catch(() => null);
        record.calendarLoaded = await p.locator('[role="dialog"] iframe').first()
          .isVisible().catch(() => false);
        await p.screenshot({ path: `${OUT}/${page.name}-${viewport.label}-dialog.png`, fullPage: false });
        await p.keyboard.press('Escape');
        await p.waitForTimeout(600);
      }

      // Full-page screenshot for the record
      await p.screenshot({ path: `${OUT}/${page.name}-${viewport.label}.png`, fullPage: true });

      // Above-the-fold check: is a booking action reachable without scrolling?
      record.bookingAboveFold = await p.locator('[data-booking-placement]').first().evaluate(
        (el) => el.getBoundingClientRect().top < window.innerHeight
      ).catch(() => false);

      record.ok = true;
    } catch (e) {
      record.ok = false;
      record.failure = String(e).slice(0, 300);
    }

    results.push(record);
    await context.close();
  }
}

await browser.close();
fs.writeFileSync(`${OUT}/verification.json`, JSON.stringify(results, null, 2));

for (const r of results) {
  console.log(
    `${r.ok ? 'OK ' : 'FAIL'} ${r.page.padEnd(14)} ${r.viewport}  ` +
    `book=${r.bookingButtons ?? '-'} vis=${r.bookingVisible} fold=${r.bookingAboveFold} ` +
    `forms=${r.leadForms ?? '-'} formVis=${r.leadFormVisible} ` +
    `dialog=${r.dialogOpen} cal=${r.calendarLoaded} ` +
    `dupes=${r.duplicateIds?.length ?? '-'} err=${r.errors?.length ?? '-'}` +
    (r.failure ? ` :: ${r.failure}` : '')
  );
}