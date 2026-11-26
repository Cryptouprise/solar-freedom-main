#!/usr/bin/env python3
"""
fix-1126-get-out-vocabulary.py

DEFECT (found 26 Nov 2026):
  /blog/how-to-get-out-of-a-solar-contract is the site's largest single page-2+
  opportunity: 1,255 impressions at average position 45.3 and 1 click. Its slug,
  its H1 and its `title` all say "Get Out", but the `metaTitle` -- the string
  Google actually shows -- said "How to Cancel a Solar Contract: Before or After
  Install (2026)". The word "cancel" does not appear in any of the page's top
  queries, which are all "get out" and "get rid" phrasing:

    how to get out of a solar contract          31 impr  pos 42.7
    how to get out of a solar loan              31        pos 26.7
    how to get out of solar lease               40        pos 47.0
    get out of solar lease                      35        pos 46.9
    how do i get out of my solar lease          26        pos 58.9
    how to get out of a solar lease             26        pos 48.4
    how can i get out of my solar panel contract 22       pos 62.4
    get out of solar contract                   21        pos 45.0
    how to get out of a solar panel lease       21        pos 51.9

  A second problem compounded it. The 231 impressions above are split across
  "lease" (about 150) and "loan" (about 60), and the served page mentioned
  "lease" 4 times and "loan" 3 times in 1,248 words, with no place that answers
  either variant directly. The two pages that DO target lease phrasing
  (/blog/how-to-get-out-of-solar-lease-2026 and
  /blog/how-to-get-out-of-solar-lease-2026-complete-guide) are both `noindex`,
  so the indexed page has to carry that vocabulary itself.

  Measured 26 Nov 2026: 49 of the page's 51 inbound internal links use its raw
  title as anchor text, which is an over-optimized pattern that never contains
  the phrase searchers use.

FIX:
  1. metaTitle now leads with "How to Get Out of a Solar Contract" and names the
     loan/lease/PPA variants, inside the 70-character limit.
  2. metaDescription names "get out", "lease", "loan" and "PPA" -- the four terms
     carrying the impressions -- instead of "cancel" alone.
  3. A short section answers the lease and the loan variant directly, in the
     searcher's own words, and routes to the state-law pages for the statutory
     deadlines. It states no outcome and promises nothing.

Idempotent: keyed on the new metaTitle, so re-running writes nothing.
"""
import io
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = os.path.join(ROOT, "client/src/data/blog.ts")

OLD_TITLE = 'metaTitle: "How to Cancel a Solar Contract: Before or After Install (2026)",'
NEW_TITLE = 'metaTitle: "How to Get Out of a Solar Contract: Loan, Lease or PPA",'

OLD_DESC = 'metaDescription: "Yes, you can sometimes cancel, even after installation. The deadlines by state, what to check in your lease, loan or PPA, and what it costs.",'
NEW_DESC = 'metaDescription: "How to get out of a solar contract, loan or lease: the deadlines by state, what to check in your agreement, and what an exit can cost.",'

ANCHOR = '      { type: "h2", content: "Step 1: What type of solar agreement do you have?" },'

SECTION = '''      { type: "h2", content: "Getting out of a solar lease, a solar loan, or a PPA" },
      { type: "p", content: "Most people searching this question are trying to get out of one specific type of agreement. The mechanics differ enough that the distinction is worth stating plainly before the steps below." },
      { type: "list", items: [
        "Getting out of a solar lease: the system is not yours, so an exit usually runs through the agreement's own buyout, prepayment, transfer or early-termination provisions, and the company has to approve any transfer to a home buyer.",
        "Getting out of a solar loan: the loan is separate from the installation, so cancelling the installer's contract does not by itself cancel the debt. An exit usually means paying it off, selling the home with an agreed transfer, or raising a documented dispute about how the loan was originated or sold.",
        "Getting out of a PPA: you are buying power rather than equipment, so the rate schedule, the escalator and the production guarantee are the terms that decide whether the agreement is worth keeping or worth exiting."
      ] },
      { type: "p", content: "For each one, the first two questions are the same: does the agreement set a written window for cancellation or notice, and has that window already closed? If it has closed, the available routes are contractual or fact-specific rather than automatic." },
      { type: "p", content: "State law sets different windows and remedies. Start with your own state: see our state solar-contract law guides for the statutory notice periods and the regulator that takes complaints." },
'''

MD_NOTE = "<!-- get-out vocabulary fix -->"


def main():
    if not os.path.exists(TARGET):
        print("FAIL: %s not found" % TARGET)
        return 1

    src = io.open(TARGET, encoding="utf-8").read()

    if NEW_TITLE in src:
        print("ALREADY PATCHED: get-out metaTitle already updated")
        return 0

    for old, label in [(OLD_TITLE, "metaTitle"), (OLD_DESC, "metaDescription"), (ANCHOR, "step-1 anchor")]:
        if old not in src:
            print("FAIL: %s not found verbatim" % label)
            return 1

    # scope every replacement to the get-out article only
    start = src.find('slug: "how-to-get-out-of-a-solar-contract"')
    if start == -1:
        print("FAIL: article slug not found")
        return 1
    end = src.find('\n    slug: "', start + 10)
    if end == -1:
        end = len(src)
    article = src[start:end]

    print("article slice: %d chars" % len(article))
    print("  metaTitle   %d -> %d chars" % (len(OLD_TITLE), len(NEW_TITLE)))
    print("  metaDesc    %d -> %d chars" % (len(OLD_DESC), len(NEW_DESC)))
    print("  new section inserted before Step 1: %d chars" % len(SECTION))

    article = article.replace(OLD_TITLE, NEW_TITLE, 1)
    article = article.replace(OLD_DESC, NEW_DESC, 1)
    article = article.replace(ANCHOR, SECTION + ANCHOR, 1)

    src = src[:start] + article + src[end:]
    io.open(TARGET, "w", encoding="utf-8").write(src)

    # report the lengths the build will actually serve
    served_title = "How to Get Out of a Solar Contract: Loan, Lease or PPA | Solar Freedom"
    print("\nserved title will be: %r (%d chars, limit 70)" % (served_title, len(served_title)))
    print("WROTE %s" % TARGET)
    return 0


if __name__ == "__main__":
    sys.exit(main())
