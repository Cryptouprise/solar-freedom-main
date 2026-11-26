#!/usr/bin/env python3
"""Insert the 26 Nov redirect-vs-index contradiction entry into both log files.

Idempotent: keyed on the exact title, so re-running writes nothing.
"""
import io
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TS = os.path.join(ROOT, "shared/changeLog.ts")
MD = os.path.join(ROOT, "docs/CHANGE-LOG.md")

TITLE = "Four URLs were 301-redirects and indexable pages at the same time"

TS_ENTRY = '''  {
    date: "2026-11-26",
    title: "Four URLs were 301-redirects and indexable pages at the same time",
    class: "defect",
    changed: [
      "scripts/prerender.assembled.mjs — added isRedirectedPath() and made the blog noindex decision respect shared/seo-redirects.json, so a path the server 301s can no longer be emitted as an indexable page",
      "server/redirectConsistency.test.ts — new, 5 tests asserting no built redirect source carries an index directive, none is both indexable and self-canonical, and no redirect points at another redirect source",
    ],
    evidence:
      "Comparing shared/index-eligibility.json against shared/seo-redirects.json found four slugs declared indexable that the app also serves as 301s. Confirmed by direct request on 26 Nov 2026 — all four returned HTTP 301: /blog/solar-escalator-clause-what-it-is-how-to-fight to the -explained-how-to-fight-it variant, /blog/cancel-solar-contract-denver-co-2026 to /cancel-solar-contract/denver-co, /blog/cancel-solar-contract-rescission-rights to /blog/solar-contract-rescission-rights, and /blog/goodleap-solar-loan-hidden-dealer-fees-2026 to /blog/goodleap-solar-loan-cancellation-hidden-fees-2026. The built copies of all four said 'index, follow' and pointed their canonical at themselves. The sitemap generator already excluded all four, so the site was publishing three mutually contradictory signals for the same URL. The escalator pair is the clearest case: 80 impressions at average position 6.95 with ZERO clicks on the source URL that redirects, while the indexed destination holds the content.",
    reasoning:
      "The contradiction surfaced while investigating why the escalator source had 80 impressions at position 6.95 and no clicks: two near-identical articles existed, both flagged index, both in INDEXED_BLOG_SLUGS, but only one in the sitemap. The cause is that two independent lists decide the same question — index-eligibility.json decides what the build marks indexable, and seo-redirects.json decides what the server redirects — and nothing forced them to agree. The sitemap generator consulted both, which is why it was correct while the HTML was not. The fix makes the build consult both, so the redirect wins. The alternative of deleting the four entries from index-eligibility.json was rejected because that list also governs whether the page is retained at all, and removing a slug from it would have dropped the page from the build rather than simply de-indexing it. What would have falsified the diagnosis: a request to one of the four returning HTTP 200. All four returned 301.",
    confidence: "measured",
    verifiedBy:
      "curl against all four live URLs on 26 Nov 2026 returned 301 with the expected Location; pnpm build pre-rendered 583 pages; the four slugs now ship noindex while their four canonical destinations ship index; sitemap still carries 41 blog articles and excludes all four sources; npx vitest run server/redirectConsistency.test.ts — 5 tests pass; pnpm test — 84 files, 820 tests pass, 3 skipped; node scripts/trust-governance-audit.mjs passed",
    preventsRecurrence:
      "server/redirectConsistency.test.ts fails the build if any path in shared/seo-redirects.json is also emitted with an index directive, if any redirect source is both indexable and self-canonical, or if a redirect points at another redirect source. Two lists deciding the same question must be checked against each other, not maintained by memory.",
    measureAfter: "2026-12-05",
  },
'''


def insert_ts():
    src = io.open(TS, encoding="utf-8").read()
    if TITLE in src:
        print("TS: entry already present, skipping")
        return False
    anchor = "export const CHANGE_LOG: ChangeEntry[] = [\n"
    if anchor not in src:
        raise SystemExit("TS anchor not found")
    src = src.replace(anchor, anchor + TS_ENTRY, 1)
    io.open(TS, "w", encoding="utf-8").write(src)
    print("TS: entry inserted")
    return True


MD_ENTRY = """## 2026-11-26 — Four URLs were 301-redirects and indexable pages at the same time

**Class:** defect

**Changed:**
- `scripts/prerender.assembled.mjs` — added `isRedirectedPath()` and made the blog `noindex` decision respect `shared/seo-redirects.json`, so a path the server 301s can no longer be emitted as an indexable page.
- `server/redirectConsistency.test.ts` — new, 5 tests asserting no built redirect source carries an index directive, none is both indexable and self-canonical, and no redirect points at another redirect source.

**Why:** Comparing `shared/index-eligibility.json` against `shared/seo-redirects.json` found **four slugs declared indexable that the app also serves as 301s**. Confirmed by direct request on 26 Nov 2026 — all four returned HTTP 301: `/blog/solar-escalator-clause-what-it-is-how-to-fight` → the `-explained-how-to-fight-it` variant, `/blog/cancel-solar-contract-denver-co-2026` → `/cancel-solar-contract/denver-co`, `/blog/cancel-solar-contract-rescission-rights` → `/blog/solar-contract-rescission-rights`, `/blog/goodleap-solar-loan-hidden-dealer-fees-2026` → `/blog/goodleap-solar-loan-cancellation-hidden-fees-2026`. The built copies of all four said "index, follow" and pointed their canonical at themselves, while the sitemap generator already excluded all four — three mutually contradictory signals for the same URL. The escalator pair is the clearest case: 80 impressions at average position 6.95 with **zero clicks** on the source URL that redirects. Two independent lists decided the same question and nothing forced them to agree; the sitemap generator consulted both, which is why it was right while the HTML was wrong.

**Verified:** `curl` against all four live URLs on 26 Nov 2026 returned 301 with the expected `Location`; `pnpm build` pre-rendered 583 pages; the four slugs now ship `noindex` while their four canonical destinations ship `index`; sitemap still carries 41 blog articles and excludes all four sources; `npx vitest run server/redirectConsistency.test.ts` — 5 tests pass; `pnpm test` — 84 files, 820 tests pass, 3 skipped; `node scripts/trust-governance-audit.mjs` passed.

**Recurrence guard:** `server/redirectConsistency.test.ts` fails the build if any path in `shared/seo-redirects.json` is also emitted with an index directive, if any redirect source is both indexable and self-canonical, or if a redirect points at another redirect source. Two lists deciding the same question must be checked against each other, not maintained by memory.

**Measure after:** 2026-12-05
"""


def insert_md():
    src = io.open(MD, encoding="utf-8").read()
    if TITLE in src:
        print("MD: entry already present, skipping")
        return False
    lines = src.split("\n")
    idx = None
    for i, ln in enumerate(lines):
        if ln.startswith("## "):
            idx = i
            break
    if idx is None:
        raise SystemExit("MD: no '## ' heading found")
    lines[idx:idx] = MD_ENTRY.split("\n")
    io.open(MD, "w", encoding="utf-8").write("\n".join(lines))
    print("MD: entry inserted before line %d" % (idx + 1))
    return True


if __name__ == "__main__":
    insert_ts()
    insert_md()
    sys.exit(0)
