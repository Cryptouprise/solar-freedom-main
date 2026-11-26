#!/usr/bin/env python3
"""
Fix the GoodLeap TILA article's meta copy (batch14).

FOUND 26 Nov 2026 by the new STATE_OF_MIND guard in server/unsourcedClaims.test.ts,
which was written for the Sunrun California defect and immediately found this
second instance. The guard earning its keep on its first run is the reason it
scans every data file rather than a hand-written list of known-bad pages.

STATUS: /blog/goodleap-tila-violation-cancel-solar-loan is `noindex, follow`
(verified in dist/public on 26 Nov 2026, and it is absent from
INDEXED_BLOG_SLUGS in shared/index-eligibility.json). So this is lower exposure
than the Sunrun California defect, which was indexable. It is fixed anyway
because a live readable page is still readable, and because the two sentences
below are the most legally exposed sentences on the site.

WHAT WAS WRONG
--------------
1. metaDescription:
     "GoodLeap hid dealer fees in your loan documents — that's a federal TILA
      violation. Attorneys are using it to cancel GoodLeap loans right now."
   "GoodLeap hid" asserts a completed act and a state of mind. "that's a federal
   TILA violation" asserts the legal conclusion as fact. "Attorneys are using it
   to cancel GoodLeap loans right now" asserts a current practice with no source.

2. metaTitle:
     "GoodLeap TILA Violation — Cancel Your Solar Loan Under Federal Law"
   Names a violation in the company's own title, which reads as a finding rather
   than a question to investigate.

WHY IT MATTERS MORE THAN THE BODY
---------------------------------
The body is largely conditional and therefore defensible: its FAQ says "if a
lender fails to make required disclosures, you have the right to rescind", which
states the legal rule rather than a conclusion about this lender. The meta copy
is the part that is unhedged, and it is the part served to every searcher and
repeated in social previews, where the surrounding conditional context is gone.

REWRITES keep the search intent (TILA, dealer fees, rescission, cancellation) and
drop the assertion of fact. The replacement states what TILA requires and what a
review checks, which is what the page can actually defend.

IDEMPOTENT: re-running produces zero further changes.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILE = ROOT / "client/src/data/blog-articles-batch14.ts"

REPLACEMENTS = [
    (
        "metaTitle: 'GoodLeap TILA Violation — Cancel Your Solar Loan Under Federal Law'",
        "metaTitle: 'GoodLeap Solar Loans and TILA: How to Check the Disclosures'",
    ),
    (
        "metaDescription: `GoodLeap hid dealer fees in your loan documents — that's a federal TILA "
        "violation. Attorneys are using it to cancel GoodLeap loans right now. Free case review.`",
        "metaDescription: `TILA requires a solar lender to disclose the true cost of credit. What a "
        "GoodLeap loan review checks, the dealer-fee question, and the rescission window.`",
    ),
]


def main() -> int:
    src = FILE.read_text(encoding="utf-8")
    changed = 0
    for old, new in REPLACEMENTS:
        if new in src:
            print("already applied:", new[:60])
            continue
        if old in src:
            src = src.replace(old, new, 1)
            changed += 1
            print("replaced:", old[:60])
        else:
            print("NOT FOUND (check exact text):", old[:60])
    if changed:
        FILE.write_text(src, encoding="utf-8")
        print(f"wrote {FILE.name} ({changed} change(s))")
    else:
        print("no changes needed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
