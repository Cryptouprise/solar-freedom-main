/**
 * Heading-structure guard.
 *
 * Why this exists: the homepage shipped TWO <h1> elements for an unknown length
 * of time. client/index.html carried a screen-reader-only <h1> with the
 * homepage title, and scripts/prerender.assembled.mjs injects a real <h1> into
 * every built page, so the built homepage had one visible and one hidden
 * heading with near-identical text.
 *
 * Two <h1> elements is not a penalty in itself. It is a problem because the
 * hidden one duplicates the visible one, which is the classic signal a search
 * engine treats as manipulation, and because the hidden element was there for
 * crawlers that do not run JavaScript — precisely the crawlers a hidden
 * duplicate is most likely to be judged by.
 *
 * A scan of all 584 built pages on 26 Nov 2026 found this was the ONLY page
 * with more than one <h1>, and that the only other page without any <h1> is
 * Google's own site-verification file, which is correct and is excluded below.
 *
 * The guard reads the BUILT OUTPUT rather than the source, because the defect
 * was created by the interaction of two files — neither one alone is wrong.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(__dirname, '..', 'dist', 'public');

/** Google Search Console verification files are not pages and have no headings. */
const NOT_A_PAGE = /^\/google[0-9a-f]+\.html$/;

function builtPages(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) out.push(p);
    }
  };
  walk(DIST);
  return out;
}

/** Body only, with script/style removed, so nothing in a widget is counted. */
function bodyOf(file: string): string {
  const raw = fs.readFileSync(file, 'utf-8');
  const start = raw.indexOf('<body');
  const end = raw.lastIndexOf('</body>');
  let body = start >= 0 && end > start ? raw.slice(start, end) : raw;
  body = body.replace(/<script[\s\S]*?<\/script>/gi, '');
  body = body.replace(/<style[\s\S]*?<\/style>/gi, '');
  return body;
}

function headings(body: string, level: number): string[] {
  // The capture group deliberately starts after the opening tag's ">" so
  // attributes are never counted as heading text — an early version captured
  // the style attribute and reported it as part of the heading.
  const re = new RegExp(`<h${level}\\b[^>]*>([\\s\\S]*?)</h${level}>`, 'gi');
  return [...body.matchAll(re)]
    .map((m) => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

const pages = builtPages().filter((f) => !NOT_A_PAGE.test('/' + path.relative(DIST, f).replace(/\\/g, '/')));

describe('heading structure in the built output', () => {
  it('has built pages to check', () => {
    expect(pages.length).toBeGreaterThan(500);
  });

  it('every built page has exactly one <h1>', () => {
    const offenders: string[] = [];
    for (const f of pages) {
      const url = '/' + path.relative(DIST, f).replace(/\\/g, '/').replace(/index\.html$/, '');
      const h1s = headings(bodyOf(f), 1);
      if (h1s.length !== 1) offenders.push(`${url} has ${h1s.length}: ${JSON.stringify(h1s)}`);
    }
    expect(offenders).toEqual([]);
  });

  it('no built page repeats the same heading text twice', () => {
    const offenders: string[] = [];
    for (const f of pages) {
      const url = '/' + path.relative(DIST, f).replace(/\\/g, '/').replace(/index\.html$/, '');
      const h1s = headings(bodyOf(f), 1);
      if (h1s.length > 1 && new Set(h1s).size < h1s.length) {
        offenders.push(`${url}: ${JSON.stringify(h1s)}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the homepage template ships no <h1> of its own, because the pre-render injects one', () => {
    // This is the exact regression that produced the duplicate. Asserting it at
    // the template level makes the cause obvious in the failure message, rather
    // than only reporting that the built homepage has two headings.
    const tpl = fs.readFileSync(path.resolve(__dirname, '..', 'client', 'index.html'), 'utf-8');
    const withoutComments = tpl.replace(/<!--[\s\S]*?-->/g, '');
    const h1s = [...withoutComments.matchAll(/<h1[\s>][\s\S]*?<\/h1>/gi)].map((m) => m[0]);
    expect(h1s).toEqual([]);
  });

  it('the homepage template still carries its semantic heading text, as a <p>', () => {
    const tpl = fs.readFileSync(path.resolve(__dirname, '..', 'client', 'index.html'), 'utf-8');
    expect(tpl).toContain('visually-hidden-heading');
    expect(tpl).toContain('Cancel Your Solar Contract | Solar Freedom');
  });
});
