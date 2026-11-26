/**
 * FAQ parity — structured data must describe content the page actually shows.
 *
 * WHAT WENT WRONG (measured 26 Nov 2026)
 * --------------------------------------
 * GitHub PR #58 (18 Nov 2026) capped the client FAQ renderer at five items
 * ("long FAQ walls bury the call to action"). It did not touch the pre-render
 * shell, which emitted every faq item as visible <h3>/<p> rows AND as FAQPage
 * JSON-LD for crawlers that do not run JavaScript.
 *
 * Result: 23 pages shipped 153 marked-up Q&As while the client rendered 115.
 * Thirty-eight questions were described in structured data and served to
 * crawlers but were invisible to a reader with JavaScript enabled. Google's
 * structured-data policy requires FAQPage markup to describe content visible
 * on the page, so this was a live violation rather than a style preference.
 *
 * THE FIX
 * -------
 * shared/faq-policy.json now holds the single number. The client reads it
 * (client/src/pages/BlogPost.tsx) and the shell reads it
 * (scripts/prerender.assembled.mjs), so neither can move without the other.
 * The section renders as collapsed <details> accordions, so raising the cap
 * does not create the wall of text the original cap was guarding against.
 *
 * These tests fail the build if the two sides drift apart again.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

const policy = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'shared/faq-policy.json'), 'utf-8'),
) as { maxRenderedItems: number };

const blogPostSource = fs.readFileSync(
  path.join(ROOT, 'client/src/pages/BlogPost.tsx'),
  'utf-8',
);

const prerenderSource = fs.readFileSync(
  path.join(ROOT, 'scripts/prerender.assembled.mjs'),
  'utf-8',
);

/** Largest `faq: [...]` array across every article data file. */
function largestFaqArray(): { count: number; slug: string; file: string } {
  const dataDir = path.join(ROOT, 'client/src/data');
  let best = { count: 0, slug: '', file: '' };
  for (const file of fs.readdirSync(dataDir)) {
    if (!file.endsWith('.ts')) continue;
    const text = fs.readFileSync(path.join(dataDir, file), 'utf-8');
    // Scope each faq block to the article that owns it.
    const parts = text.split(/\n\s*slug:\s*['"]/).slice(1);
    for (const part of parts) {
      const slugMatch = /^([a-z0-9-]+)/.exec(part);
      if (!slugMatch) continue;
      const start = part.indexOf('faq: [');
      if (start === -1) continue;
      let end = part.indexOf('\n    ],', start);
      if (end === -1) end = part.indexOf('\n  ],', start);
      if (end === -1) continue;
      const count = (part.slice(start, end).match(/\{\s*q:/g) || []).length;
      if (count > best.count) best = { count, slug: slugMatch[1], file };
    }
  }
  return best;
}

describe('FAQ parity between the client renderer and the pre-render shell', () => {
  it('has a positive integer cap in the shared policy file', () => {
    expect(Number.isInteger(policy.maxRenderedItems)).toBe(true);
    expect(policy.maxRenderedItems).toBeGreaterThan(0);
  });

  it('client reads the cap from the shared policy instead of hard-coding it', () => {
    expect(blogPostSource).toContain("import FAQ_POLICY from '@shared/faq-policy.json'");
    expect(blogPostSource).toContain('const MAX_FAQ_ITEMS = FAQ_POLICY.maxRenderedItems;');
    // A hard-coded literal is how this drifted the first time.
    expect(blogPostSource).not.toMatch(/const MAX_FAQ_ITEMS = \d+;/);
  });

  it('pre-render shell reads the cap from the shared policy instead of hard-coding it', () => {
    expect(prerenderSource).toContain('shared/faq-policy.json');
    expect(prerenderSource).toContain('const MAX_FAQ_ITEMS = FAQ_POLICY.maxRenderedItems;');
  });

  it('shell caps the FAQ HTML it emits at the shared number', () => {
    // The HTML emitter must slice; without it every item ships regardless of cap.
    expect(prerenderSource).toMatch(
      /const faq = \(meta\.faq \|\| \[\]\)\s*\n\s*\.slice\(0, MAX_FAQ_ITEMS\)/,
    );
  });

  it('shell caps the FAQPage JSON-LD it emits at the shared number', () => {
    expect(prerenderSource).toContain('mainEntity: meta.faq.slice(0, MAX_FAQ_ITEMS)');
    // The old hard-coded 10 is what let the shell outrun the client.
    expect(prerenderSource).not.toContain('meta.faq.slice(0, 10)');
  });

  it('client renders every FAQ the shell marks up', () => {
    const largest = largestFaqArray();
    expect(largest.count).toBeGreaterThan(0);
    expect(
      policy.maxRenderedItems,
      `Largest faq array is ${largest.count} items (${largest.slug} in ${largest.file}) ` +
        `but the cap is ${policy.maxRenderedItems}. Raise maxRenderedItems in ` +
        `shared/faq-policy.json so no marked-up question is invisible on the rendered page.`,
    ).toBeGreaterThanOrEqual(largest.count);
  });

  it('every FAQ page in the built output marks up no more questions than the cap', () => {
    const publicDir = path.join(ROOT, 'dist/public');
    if (!fs.existsSync(publicDir)) return; // build not run yet in this checkout
    const offenders: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (entry.name !== 'index.html') continue;
        const html = fs.readFileSync(full, 'utf-8');
        const section = /<section class="faq-section">([\s\S]*?)<\/section>/.exec(html);
        if (!section) continue;
        const rows = (section[1].match(/<h3>/g) || []).length;
        if (rows > policy.maxRenderedItems) {
          offenders.push(`${path.relative(publicDir, dir)}: ${rows} rows`);
        }
      }
    };
    walk(publicDir);
    expect(offenders, `Pages marking up more FAQs than the cap:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('records the drift history so the next reader knows why the cap exists', () => {
    const raw = fs.readFileSync(path.join(ROOT, 'shared/faq-policy.json'), 'utf-8');
    expect(raw).toContain('_history');
    expect(raw).toContain('2026-11-18');
    expect(raw).toContain('2026-11-26');
  });
});
