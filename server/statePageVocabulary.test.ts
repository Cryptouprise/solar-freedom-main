/**
 * Regression test: an indexable page ranking for a query it never names.
 *
 * Why this exists (found and fixed 26 Nov 2026): /solar-contract-laws/california
 * is INDEXABLE and held position 10.4 on two queries worth 18 impressions each —
 * "cancel solar lease california" and "cancel sunrun contract california" — while
 * its rendered text contained ZERO occurrences of "lease" and ZERO of "Sunrun".
 * It had 3 occurrences of "PPA", which is why the gap was easy to miss: the page
 * did discuss third-party ownership, just never in the words the searcher used.
 *
 * This is the same class already recorded for the rescission page (ranked for
 * "TILA", never used the word), Blue Raven (ranked for "customer service" and
 * "phone number", description named neither) and Sunrun (ranked for
 * "appointment", page had zero occurrences). Four instances makes it a class,
 * so it gets a test rather than another correction.
 *
 * The check is deliberately narrow. It asserts only that the pages this site
 * has MEASURED demand for name the words carrying that demand. It does not try
 * to score keyword density, because that would flag good writing for being
 * varied, and it does not run on every page, because most pages have no
 * measured query behind them yet.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const PUB = path.join(ROOT, 'dist', 'public');

/**
 * Pages with MEASURED query demand, and the vocabulary that demand requires.
 * Every entry must cite the impressions and position that justify it, so this
 * list cannot grow into a wish list.
 */
const MEASURED = [
  {
    page: 'solar-contract-laws/california',
    // Search Console, 1 Sep - 22 Nov 2026:
    //   'cancel solar lease california'      18 impressions, position 10.4
    //   'cancel sunrun contract california'  18 impressions, position 10.4
    required: ['lease', 'Sunrun', 'PPA', 'power purchase agreement'],
    why: 'holds position 10.4 on lease and Sunrun cancellation queries',
  },
];

function pageText(rel: string): string | null {
  const f = path.join(PUB, rel, 'index.html');
  if (!fs.existsSync(f)) return null;
  const html = fs.readFileSync(f, 'utf8');
  const b = html.indexOf('<body');
  const e = html.indexOf('<script', b);
  const slice = b >= 0 ? html.slice(b, e > b ? e : undefined) : html;
  return slice.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

function isIndexable(rel: string): boolean {
  const f = path.join(PUB, rel, 'index.html');
  if (!fs.existsSync(f)) return false;
  const html = fs.readFileSync(f, 'utf8');
  const m = html.match(/<meta\s+name="robots"\s+content="([^"]*)"/i);
  return !m || !/noindex/i.test(m[1]);
}

describe('pages with measured demand name the words carrying it', () => {
  for (const entry of MEASURED) {
    it(`${entry.page} uses the vocabulary its queries require (${entry.why})`, () => {
      const text = pageText(entry.page);
      if (text === null) return; // no build present

      const missing: string[] = [];
      for (const term of entry.required) {
        if (!new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(text)) {
          missing.push(term);
        }
      }
      expect(missing, `${entry.page} is missing: ${missing.join(', ')}`).toEqual([]);
    });
  }

  it('the California state page is still indexable, so the vocabulary matters', () => {
    const f = path.join(PUB, 'solar-contract-laws', 'california', 'index.html');
    if (!fs.existsSync(f)) return;
    expect(isIndexable('solar-contract-laws/california')).toBe(true);
  });

  it('the California page links only INDEXABLE deeper guides on this topic', () => {
    const f = path.join(PUB, 'solar-contract-laws', 'california', 'index.html');
    if (!fs.existsSync(f)) return;
    const html = fs.readFileSync(f, 'utf8');
    // Two anchors were added with this fix. Both were checked indexable before
    // shipping, because linking a noindex page spends crawl equity on a page
    // that cannot rank. The two lease-exit guides are noindex and deliberately
    // not linked.
    for (const slug of [
      'blog/sunrun-solar-contract-cancellation-2026',
      'blog/selling-home-with-solar-ppa-panels-transfer-or-cancel',
    ]) {
      expect(html, `expected a link to /${slug}`).toContain(`/${slug}`);
      expect(isIndexable(slug), `/${slug} must be indexable to be worth linking`).toBe(true);
    }
  });

  it('the two noindex lease guides are not linked from the state page', () => {
    const f = path.join(PUB, 'solar-contract-laws', 'california', 'index.html');
    if (!fs.existsSync(f)) return;
    const html = fs.readFileSync(f, 'utf8');
    for (const slug of [
      'blog/how-to-get-out-of-solar-lease-2026',
      'blog/how-to-get-out-of-solar-lease-2026-complete-guide',
    ]) {
      if (!fs.existsSync(path.join(PUB, slug, 'index.html'))) continue;
      expect(isIndexable(slug)).toBe(false); // still noindex
      expect(html).not.toContain(`/${slug}`);
    }
  });
});
