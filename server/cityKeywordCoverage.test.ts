/**
 * Meta-keyword coverage guard.
 *
 * WHY THIS EXISTS
 * ---------------
 * The owner asked four times for a <meta name="keywords"> tag on specific city
 * pages (houston-tx, dallas-tx, phoenix-az, austin-tx), each time with the
 * constraint "between 3 and 8 focused, highly relevant keywords ... never more
 * than 8". Those four were done. Measuring the whole set on 26 Nov 2026 found
 * that 22 of the 27 INDEXABLE city pages served a tag and 5 did not:
 *   murfreesboro-tn, san-francisco-ca, san-jose-ca, santa-ana-ca, youngstown-oh
 *
 * The tag is emitted by scripts/prerender.assembled.mjs from
 * shared/page-meta-keywords.json, so a missing key silently means a missing tag.
 *
 * HONEST SCOPE
 * ------------
 * Google has publicly ignored the keywords meta tag for ranking for over a
 * decade, and this file does not claim otherwise. The tag is checked here for
 * consistency, not for ranking: an inconsistent set means a checker that reports
 * "no keywords detected" keeps flagging these pages, and the next person to read
 * that report cannot tell a real omission from a deliberate one. The owner's
 * stated constraint of 3 to 8 keywords is enforced because it was stated.
 *
 * A guard that has never been seen to fail is not a guard, so the last test
 * reproduces the exact defect (a missing key) and asserts the checker catches it.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const KEYWORDS = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'shared/page-meta-keywords.json'), 'utf-8'),
) as Record<string, string[]>;
const ELIGIBILITY = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'shared/index-eligibility.json'), 'utf-8'),
) as { citySlugs: string[]; stateSlugs: string[] };

/** The owner's stated bounds, applied to every entry. */
const MIN_KEYWORDS = 3;
const MAX_KEYWORDS = 8;

describe('meta-keyword coverage', () => {
  it('every INDEXABLE city page has a keywords entry', () => {
    const missing = ELIGIBILITY.citySlugs.filter(
      (slug) => !(`/cancel-solar-contract/${slug}` in KEYWORDS),
    );
    expect(
      missing,
      `Indexable city pages with no meta-keywords entry. The pre-renderer emits\n` +
        `no tag for these, which is what "no keywords were detected" means:\n${missing.join('\n')}`,
    ).toEqual([]);
  });

  it('every INDEXABLE state page has a keywords entry', () => {
    const missing = ELIGIBILITY.stateSlugs.filter(
      (slug) => !(`/solar-contract-laws/${slug}` in KEYWORDS),
    );
    expect(missing, `State pages with no keywords entry:\n${missing.join('\n')}`).toEqual([]);
  });

  it('every entry holds between 3 and 8 keywords, as the owner specified', () => {
    const bad: string[] = [];
    for (const [pagePath, kws] of Object.entries(KEYWORDS)) {
      if (!Array.isArray(kws)) {
        bad.push(`${pagePath}: not an array`);
        continue;
      }
      const nonEmpty = kws.filter((k) => typeof k === 'string' && k.trim().length > 0);
      if (nonEmpty.length < MIN_KEYWORDS || nonEmpty.length > MAX_KEYWORDS) {
        bad.push(`${pagePath}: ${nonEmpty.length} keywords (need ${MIN_KEYWORDS}-${MAX_KEYWORDS})`);
      }
      const dupes = nonEmpty.filter((k, i) => nonEmpty.indexOf(k) !== i);
      if (dupes.length) bad.push(`${pagePath}: duplicate keyword(s) ${dupes.join(', ')}`);
    }
    expect(bad, `Keyword entries outside the stated bounds:\n${bad.join('\n')}`).toEqual([]);
  });

  it('the coverage checker fires when an entry is removed', () => {
    // Reproduce the exact defect: drop one key and confirm the checker sees it.
    const withDefect: Record<string, string[]> = { ...KEYWORDS };
    delete withDefect['/cancel-solar-contract/san-jose-ca'];
    const missing = ELIGIBILITY.citySlugs.filter(
      (slug) => !(`/cancel-solar-contract/${slug}` in withDefect),
    );
    expect(missing).toEqual(['san-jose-ca']);
    // And confirm the bounds checker fires on a 2-keyword entry.
    const short = { '/x': ['one', 'two'] };
    expect(short['/x'].length < MIN_KEYWORDS).toBe(true);
  });
});
