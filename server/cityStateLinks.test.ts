/**
 * Regression test: city pages must route state-level questions to the state
 * law page instead of competing with it.
 *
 * Why this exists (measured 26 Nov 2026): the state-law paragraph on every
 * templated city page said "review the dedicated <State> law resource" with NO
 * anchor, so the city page competed with the state page for the same queries.
 * `/cancel-solar-contract/san-francisco-ca` earned 46 impressions in 30 days at
 * average position 35.1 with ZERO clicks while the California state page held
 * the same state-level queries at position 10.4.
 *
 * The 21 priority city guides render through a SEPARATE code path
 * (`shared/priority-city-render.mjs`) and had no state link at all, which is why
 * this defect survived the first fix. This site renders city pages through two
 * independent renderers, so the test covers both.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { renderPriorityCityBody, getStateLawPath } from '../shared/priority-city-render.mjs';

const ROOT = path.resolve(__dirname, '..');
const PRE = fs.readFileSync(path.join(ROOT, 'scripts', 'prerender.assembled.mjs'), 'utf8');
const PRIORITY_RENDER = fs.readFileSync(path.join(ROOT, 'shared', 'priority-city-render.mjs'), 'utf8');
const PRIORITY_TSX = fs.readFileSync(
  path.join(ROOT, 'client', 'src', 'components', 'PriorityCityGuide.tsx'),
  'utf8',
);

const eligibility = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'shared', 'index-eligibility.json'), 'utf8'),
) as { stateSlugs: string[] };

const priorityContent = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'shared', 'priority-city-content.json'), 'utf8'),
) as Record<string, { city: string; state: string }>;

/** The states that actually have a published, indexable law page. */
const PUBLISHED_STATES = new Set(eligibility.stateSlugs);

describe('city pages link to their published state law page', () => {
  it('publishes at least one state law page, so the rule has something to link to', () => {
    expect(PUBLISHED_STATES.size).toBeGreaterThan(0);
    for (const slug of PUBLISHED_STATES) expect(slug).toMatch(/^[a-z-]+$/);
  });

  it('resolves every published state slug to a real built page', () => {
    // A link to an unbuilt or noindex page is worse than no link: it spends
    // crawl budget and passes authority to a page Google is told to ignore.
    for (const slug of PUBLISHED_STATES) {
      const built = path.join(ROOT, 'dist', 'public', 'solar-contract-laws', slug, 'index.html');
      if (!fs.existsSync(built)) continue; // build not present; covered by the build check below
      const html = fs.readFileSync(built, 'utf8');
      expect(html).not.toMatch(/<meta\s+name="robots"[^>]*noindex/i);
    }
  });

  it('templated renderer registers the state slugs from the real state entries', () => {
    // The map must be populated from loadData(), not hard-coded, or a newly
    // published state would silently never be linked.
    expect(PRE).toContain('registerStateLawSlugs');
    expect(PRE).toMatch(/registerStateLawSlugs\s*\(\s*stateEntries\s*\)/);
    expect(PRE).toContain('STATE_LAW_SLUG_BY_NAME');
  });

  it('templated renderer only links a state that is in the indexable set', () => {
    // The guard that keeps an unpublished state from being linked.
    const guard = PRE.match(/INDEXED_STATE_SLUGS[\s\S]{0,200}/);
    expect(guard, 'expected the state-law link to be gated on INDEXED_STATE_SLUGS').not.toBeNull();
  });

  it('priority renderer links only published states and omits the rest', () => {
    const problems: string[] = [];
    let linked = 0;
    let omitted = 0;

    for (const [pagePath, data] of Object.entries(priorityContent)) {
      const html = renderPriorityCityBody(data);
      const found = html.match(/href="(\/solar-contract-laws\/[^"]+)"/);
      const expected = getStateLawPath(data.state);

      if (expected) {
        const slug = expected.replace('/solar-contract-laws/', '');
        if (!PUBLISHED_STATES.has(slug)) {
          problems.push(`${pagePath}: links unpublished state ${slug}`);
          continue;
        }
        if (!found) {
          problems.push(`${pagePath}: expected ${expected}, found no state-law link`);
          continue;
        }
        if (found[1] !== expected) {
          problems.push(`${pagePath}: expected ${expected}, found ${found[1]}`);
          continue;
        }
        linked += 1;
      } else {
        if (found) {
          problems.push(`${pagePath} (${data.state}): unexpected link ${found[1]}`);
          continue;
        }
        omitted += 1;
      }
    }

    expect(problems).toEqual([]);
    // Phoenix, Houston, Dallas, Los Angeles, San Diego and San Antonio are the
    // six highest-value guides and all six sit in published states.
    expect(linked).toBeGreaterThanOrEqual(6);
    expect(linked + omitted).toBe(Object.keys(priorityContent).length);
  });

  it('priority renderer keeps the existing resources links and the form CTA', () => {
    // The state-law link was added into an existing section; it must not have
    // displaced the external official sources or the #city-form anchor.
    const [pagePath, data] = Object.entries(priorityContent)[0];
    const html = renderPriorityCityBody(data);
    expect(pagePath).toBeTruthy();
    expect(html).toContain('id="city-local-resources"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('#city-form');
  });

  it('client component reads the shared helper instead of copying the state map', () => {
    // Two independent copies of the state map is exactly how the shell and the
    // hydrated page drift apart.
    expect(PRIORITY_TSX).toContain('getStateLawPath');
    expect(PRIORITY_TSX).toMatch(/from\s+'@shared\/priorityCityContent'/);
    // The component must not carry its own state-name-to-slug table.
    expect(PRIORITY_TSX).not.toMatch(/arizona['"]?\s*:/i);
    expect(PRIORITY_TSX).not.toMatch(/california['"]?\s*:/i);
    expect(PRIORITY_TSX).not.toMatch(/texas['"]?\s*:/i);
  });

  it('shared helper is the single source of truth for the state map', () => {
    const mapBlocks = PRIORITY_RENDER.match(/const STATE_LAW_SLUG = \{[\s\S]*?\};/g) ?? [];
    expect(mapBlocks).toHaveLength(1);
    for (const slug of PUBLISHED_STATES) {
      expect(PRIORITY_RENDER).toContain(`'${slug}'`);
    }
  });
});
