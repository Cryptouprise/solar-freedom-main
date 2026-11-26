/**
 * Unsourced claim guard.
 *
 * WHY THIS EXISTS (measured 26 Nov 2026)
 * --------------------------------------
 * Four articles published a stat block containing:
 *
 *   "3M+"   U.S. homeowners with solar contracts   -> no source anywhere in the repo
 *   "68%"   Report higher-than-expected costs      -> no source anywhere in the repo
 *   "30-90" Days to resolution with legal help     -> an outcome AND timeline promise
 *
 * A repository-wide grep returned four instances, in
 * solar-contract-escalator-clause-explained-how-to-fight-it,
 * how-to-file-a-complaint-against-solar-company-attorney-general,
 * selling-home-with-solar-ppa-panels-transfer-or-cancel and
 * solar-contract-red-flags-checklist-2026. The only genuine "68%" in the repo is in
 * docs/seo-baseline-2026-09-03.md, describing an unrelated impression decrease.
 *
 * None of them was caught by the trust-governance filter, whose nearest pattern
 * required the literal phrase "Results in 30-90 days" while these read
 * "30-90 Days to resolution".
 *
 * WHY A TEST AND NOT A RUNTIME FILTER
 * -----------------------------------
 * Broadening the runtime filter to every "<number>% of <group>" shape was tried and
 * rejected: a sweep showed it would suppress 87 legitimate lines, including already
 * published city-page stats and correct explanations of the 30% federal tax credit.
 * Runtime suppression DELETES content, so it stays narrow and precise. This test
 * covers the wider class by failing the build, which forces a human decision
 * instead of silently removing published copy.
 *
 * If a claim below becomes sourced, add the source to the article and remove it from
 * the allow-list reasoning -- do not weaken the pattern.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'client/src/data');

/**
 * Claims that promise an outcome or a timeline, or assert a population statistic
 * with no cited study. Each must not appear in customer-facing article copy.
 */
const BANNED = [
  {
    pattern: /\b\d{1,3}\s*[–-]\s*\d{1,3}\s*(?:days?|weeks?|months?)\b[^.!?]{0,30}\b(?:to resolution|with legal help|with our team|with an attorney)\b/i,
    why: 'promises a resolution timeline',
  },
  {
    pattern: /\b(?:typical\s+)?resolution\s+time\b[^.!?]{0,40}\b\d{1,3}\s*[–-]\s*\d{1,3}\s*(?:days?|weeks?|months?)\b/i,
    why: 'promises a resolution timeline',
  },
  {
    pattern: /\b\d{1,3}%\s+(?:of\s+)?(?:homeowners|Americans)\s+(?:report|say|see|experience|face|struggle)\b/i,
    why: 'asserts a population statistic with no cited study',
  },
  {
    pattern: /\b3M\+\b/,
    why: 'unsourced population figure',
  },
  {
    pattern: /\bDays to resolution\b/i,
    why: 'promises a resolution timeline',
  },
];

/**
 * Files excluded from the claim scan, with the reason and the scope of the
 * exclusion. Every entry here is legacy content that does not reach an indexable
 * page, so it cannot mislead a searcher today. Anything reaching an indexed page
 * must be fixed rather than allow-listed.
 */
const ALLOWED: Array<{ file: string; why: string }> = [
  {
    file: 'city-content-depth.ts',
    why: 'Legacy city market stats carrying "Typical Resolution: 30-90 days". The affected cities are all noindex; verified 26 Nov 2026 that none of the 27 indexed city pages ships this string in dist/public. Kept because rewriting 223 legacy strings is a separate, larger change than this session, and a build failure on noindex content would block unrelated work. Tracked as its own item.',
  },
  {
    file: 'city-content-depth-batch-a.ts',
    why: 'Same legacy city market-stat strings; affected cities are noindex.',
  },
  {
    file: 'city-content-depth-batch-b.ts',
    why: 'Same legacy city market-stat strings; affected cities are noindex.',
  },
  {
    file: 'city-content-depth-batch-c.ts',
    why: 'Same legacy city market-stat strings; affected cities are noindex.',
  },
  {
    file: 'city-content-depth-batch-d.ts',
    why: 'Same legacy city market-stat strings; affected cities are noindex.',
  },
  {
    file: 'city-content-depth-batch-g.ts',
    why: 'Same legacy city market-stat strings; affected cities are noindex.',
  },
];

/**
 * Legacy noindex blog files. These slugs are all outside INDEXED_BLOG_SLUGS and
 * absent from the sitemap, so the copy never reaches a searcher. Listed so the
 * guard can stay strict for everything that is indexed.
 */
const LEGACY_NOINDEX_BLOGS = [
  'blog-articles-batch7.ts',
];

function articleFiles(): string[] {
  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => path.join(DATA_DIR, f));
}

describe('unsourced claim guard', () => {
  it('no article copy promises an outcome timeline or an unsourced population statistic', () => {
    const offenders: string[] = [];
    for (const file of articleFiles()) {
      const base = path.basename(file);
      if (ALLOWED.some((a) => a.file === base)) continue;
      if (LEGACY_NOINDEX_BLOGS.includes(base)) continue;
      const lines = fs.readFileSync(file, 'utf-8').split('\n');
      lines.forEach((line, i) => {
        for (const { pattern, why } of BANNED) {
          const m = pattern.exec(line);
          if (m) {
            offenders.push(`${base}:${i + 1}  [${why}]  "${m[0].slice(0, 90)}"`);
            break;
          }
        }
      });
    }
    expect(
      offenders,
      `Article copy contains claims with no supporting source. Either cite a source\n` +
        `or rewrite the claim so it asserts only what the page can defend:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('the specific stat trio that shipped has not returned', () => {
    // Scope: every file that is NOT an allow-listed legacy noindex source. The
    // exact strings that shipped are gone from all of those.
    const scanned = articleFiles()
      .filter((f) => {
        const base = path.basename(f);
        return (
          !ALLOWED.some((a) => a.file === base) &&
          !LEGACY_NOINDEX_BLOGS.includes(base)
        );
      })
      .map((f) => fs.readFileSync(f, 'utf-8'))
      .join('\n');
    expect(scanned).not.toContain("'3M+'");
    expect(scanned).not.toContain('Report higher-than-expected costs');
    expect(scanned).not.toContain('Days to resolution with legal help');
    expect(scanned).not.toContain('Homeowners report hidden fees');
  });

  it('no INDEXABLE built page ships a resolution-time promise', () => {
    // This is the assertion that actually protects a searcher: the string may
    // exist in legacy source, but it must never reach a page Google can index.
    const publicDir = path.join(ROOT, 'dist/public');
    if (!fs.existsSync(publicDir)) return; // build not run in this checkout
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
        const robots = /name="robots" content="([^"]*)"/.exec(html);
        if (!robots || robots[1].includes('noindex')) continue;
        if (/Typical Resolution/i.test(html) || /30[–-]90 days/i.test(html)) {
          offenders.push('/' + path.relative(publicDir, dir));
        }
      }
    };
    walk(publicDir);
    expect(
      offenders,
      `Indexable pages shipping a resolution-time promise:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('the runtime filter stays narrow enough not to delete published city stats', () => {
    // The runtime filter runs over city pages too, so a broad percentage pattern
    // there would silently delete already-published, already-approved content.
    const src = fs.readFileSync(
      path.join(ROOT, 'scripts/prerender.assembled.mjs'),
      'utf-8',
    );
    const filterStart = src.indexOf('const unsupportedFirstPartyClaimPatterns');
    const filterEnd = src.indexOf('];', filterStart);
    const filter = src.slice(filterStart, filterEnd);
    // A bare "<n>% of <group>" pattern would suppress legitimate tax-credit copy.
    expect(filter).not.toMatch(/\\d\{1,3\}%\\s\+\(\?:of\\s\+\)\?\(\?:homeowners\|Americans\|people\|customers\)\\b/);
    // The timeline promise that actually shipped must be caught.
    expect(filter).toContain('with legal help');
  });
});
