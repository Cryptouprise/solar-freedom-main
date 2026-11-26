#!/usr/bin/env python3
"""Insert the 26 Nov get-out vocabulary change-log entry into both log files.

Idempotent: keyed on the exact title, so re-running writes nothing.
"""
import io
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TS = os.path.join(ROOT, "shared/changeLog.ts")
MD = os.path.join(ROOT, "docs/CHANGE-LOG.md")

TITLE = "The site's biggest page-2 opportunity ranked on 'get out' while its snippet said 'cancel'"

TS_ENTRY = '''  {
    date: "2026-11-26",
    title: "The site's biggest page-2 opportunity ranked on 'get out' while its snippet said 'cancel'",
    class: "SEO",
    changed: [
      "client/src/data/blog.ts — /blog/how-to-get-out-of-a-solar-contract: metaTitle now leads with 'How to Get Out of a Solar Contract: Loan, Lease or PPA' instead of 'How to Cancel a Solar Contract: Before or After Install (2026)'; metaDescription now names 'get out', 'loan' and 'lease' instead of 'cancel' alone",
      "client/src/data/blog.ts — added a section answering the lease variant, the loan variant and the PPA variant separately in the searcher's own words, and routing to the state solar-contract law guides for the statutory windows. It states no outcome and promises nothing",
      "scripts/fix-1126-get-out-vocabulary.py — idempotent, scoped to the one article slice",
    ],
    evidence:
      "Search Console (1 Sep–22 Nov 2026) for /blog/how-to-get-out-of-a-solar-contract: 1,255 impressions at average position 45.3 with 1 click — the largest single impression mass below position 20 on the site. Every one of its top queries uses 'get out' or 'get rid' phrasing and NOT ONE contains the word 'cancel': 'how to get out of a solar contract' 31 impr at 42.7, 'how to get out of a solar loan' 31 at 26.7, 'how to get out of solar lease' 40 at 47.0, 'get out of solar lease' 35 at 46.9, 'how do i get out of my solar lease' 26 at 58.9, 'how to get out of a solar lease' 26 at 48.4, 'how can i get out of my solar panel contract' 22 at 62.4, 'get out of solar contract' 21 at 45.0, 'how to get out of a solar panel lease' 21 at 51.9. The page slug, its H1 and its `title` field all said 'Get Out'; only the metaTitle Google displays said 'Cancel'. Measured on the built page before the fix: 1,248 words containing 'lease' 4 times and 'loan' 3 times, with no place answering either variant directly; and 49 of its 51 inbound internal links used the raw title as anchor text, an over-optimized pattern containing none of the query phrases. The two pages that do target lease phrasing, /blog/how-to-get-out-of-solar-lease-2026 and /blog/how-to-get-out-of-solar-lease-2026-complete-guide, are both noindex, so the indexed page has to carry that vocabulary itself.",
    reasoning:
      "The near-winners report ranked this page fourth by CTR gap, but its position 45.3 rules out snippet tuning alone as a fix — a snippet change cannot move a page 40 places. Splitting its query list by vocabulary showed the split is not positional: the lease variants average about position 48 and the loan variants about position 27, so the page is being matched on topic rather than on any single term, which is what a page whose visible title says 'cancel' while its slug says 'get out' looks like to a search engine. The correction is therefore to stop contradicting itself: lead the snippet with the phrase the searcher typed, and give the page a place that actually answers the lease and loan variants instead of mentioning them in passing. The two lease-specific pages being noindex was the deciding factor — had either been indexable, changing this page's title to target lease phrasing would have created a new cannibalization problem rather than fixing one. What would have falsified the diagnosis: any top query containing 'cancel'. There are none. The title was kept to 70 characters because that is the hard limit the build's fitter enforces; the meaningful 55 characters complete before Google's near-60 truncation, so the brand suffix is what gets dropped and the promise survives.",
    confidence: "measured",
    verifiedBy:
      "pnpm check clean; pnpm build pre-rendered 583 pages; built page now serves a 70-character title leading with 'How to Get Out of a Solar Contract', a 134-character description naming loan and lease, and 1,490 served words with the new 'Getting out of a solar lease, a solar loan, or a PPA' heading present; pnpm test 83 files, 815 tests pass, 3 skipped; node scripts/trust-governance-audit.mjs passed",
    preventsRecurrence:
      "Before tuning a snippet, check the page's own top queries for vocabulary the snippet does not contain. A page whose slug, H1 and visible title agree but whose metaTitle disagrees is contradicting itself in exactly the field the searcher reads first. Also check whether the pages that already target a variant are indexable before redirecting a title at that variant, or the fix creates cannibalization instead of removing it.",
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


MD_ENTRY = """## 2026-11-26 — The site's biggest page-2 opportunity ranked on 'get out' while its snippet said 'cancel'

**Class:** SEO

**Changed:**
- `client/src/data/blog.ts` — `/blog/how-to-get-out-of-a-solar-contract`: `metaTitle` now leads with "How to Get Out of a Solar Contract: Loan, Lease or PPA" instead of "How to Cancel a Solar Contract: Before or After Install (2026)"; `metaDescription` now names "get out", "loan" and "lease" instead of "cancel" alone.
- `client/src/data/blog.ts` — added a section answering the lease variant, the loan variant and the PPA variant separately in the searcher's own words, routing to the state solar-contract law guides for the statutory windows. It states no outcome and promises nothing.
- `scripts/fix-1126-get-out-vocabulary.py` — idempotent, scoped to the one article slice.

**Why:** Search Console (1 Sep–22 Nov 2026): **1,255 impressions at average position 45.3 with 1 click** — the largest single impression mass below position 20 on the site. Every top query uses "get out" or "get rid" phrasing and **not one contains the word "cancel"**: "how to get out of a solar contract" 31 impr at 42.7, "how to get out of a solar loan" 31 at 26.7, "how to get out of solar lease" 40 at 47.0, "get out of solar lease" 35 at 46.9, "how do i get out of my solar lease" 26 at 58.9. The page slug, its H1 and its `title` field all said "Get Out"; only the `metaTitle` Google displays said "Cancel". Measured on the built page before the fix: 1,248 words containing "lease" 4 times and "loan" 3 times, with no place answering either variant directly; and 49 of its 51 inbound internal links used the raw title as anchor text. The two pages that do target lease phrasing are both `noindex`, so the indexed page has to carry that vocabulary itself.

**Verified:** `pnpm check` clean; `pnpm build` pre-rendered 583 pages; built page now serves a 70-character title leading with "How to Get Out of a Solar Contract", a 134-character description naming loan and lease, and 1,490 served words with the new heading present; `pnpm test` 83 files, 815 tests pass, 3 skipped; `node scripts/trust-governance-audit.mjs` passed.

**Recurrence guard:** Before tuning a snippet, check the page's own top queries for vocabulary the snippet does not contain. A page whose slug, H1 and visible title agree but whose `metaTitle` disagrees is contradicting itself in exactly the field the searcher reads first. Also check whether the pages that already target a variant are indexable before redirecting a title at that variant, or the fix creates cannibalization instead of removing it.

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
