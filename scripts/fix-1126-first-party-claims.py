#!/usr/bin/env python3
"""Remove unsourced first-party outcome claims from meta descriptions.

Found 26 Nov 2026 by scanning every INDEXABLE built page for first-party result
claims. Four pages carried them:

  cancel-solar-contract-atlanta-ga  "We've helped 50+ GA homeowners save thousands."
  cancel-solar-contract-boston-ma   "Our firm helped 200+ homeowners cancel."
  bakersfield-solar-not-worth-it    "...cancel your contract and save thousands."
  solar-payment-shock-help          "...legal options to save thousands."

No source exists in the repo for any of the four figures or promises, and the
Boston line compounds the problem by saying "Our firm" on a site whose own
service page states it is not a law firm. A first-party result claim is the
single most damaging thing an attorney or a sharp homeowner can check, because
it is checkable and it is false.

Each replacement keeps the snippet's job -- name the legal mechanism and the
next step -- and drops the promise. Idempotent: keyed on the exact old string.

The Atlanta slug is NOT in INDEXED_BLOG_SLUGS but its built page ships
robots=index, so it is treated as indexable here. That discrepancy is a separate
finding, recorded in the change log.
"""
import io
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

REPLACEMENTS = [
    (
        "client/src/data/blog-articles-batch5.ts",
        "Atlanta homeowners: Use Georgia's Fair Business Practices Act to cancel deceptive solar contracts. We've helped 50+ GA homeowners save thousands. Free case review.",
        "Atlanta homeowners: the Georgia Fair Business Practices Act covers deceptive solar sales, and Georgia Power's avoided-cost rate is among the lowest in the country. See what to review and what records decide a claim.",
    ),
    (
        "client/src/data/blog-articles-batch5.ts",
        "Boston solar contract trap? MA Chapter 93A secures triple damages against deceptive companies. Our firm helped 200+ homeowners cancel. Free case review.",
        "Boston solar contract trap? Massachusetts Chapter 93A allows triple damages for deceptive practices, and its four-year clock is longer than most states. See what the statute requires and which records prove a claim.",
    ),
    (
        "client/src/data/blog-articles-batch3.ts",
        "Bakersfield solar not delivering? NEM 3.0 impacting your bill? Discover powerful legal strategies to cancel your contract and save thousands. Free case review.",
        "Bakersfield solar not delivering? NEM 3.0 changed how exported power is credited in California. See what the numbers on your bill mean, what to check in the agreement, and the records that decide your options.",
    ),
    (
        "client/src/data/blog-articles-batch4.ts",
        "Shocked by your solar bill? Fight back against high payments & escalator clauses. Explore legal options to save thousands. Free case review.",
        "Shocked by your solar bill? Escalator clauses raise lease and PPA payments on a schedule. See how the increase compounds, what the agreement actually allows, and what to review before you act.",
    ),
]


def main() -> int:
    changed = []
    for rel, old, new in REPLACEMENTS:
        path = os.path.join(ROOT, rel)
        text = io.open(path, encoding="utf-8").read()
        if new in text and old not in text:
            print("SKIP (already applied): %s :: %s" % (rel, old[:50]))
            continue
        n = text.count(old)
        if n != 1:
            print("REFUSE: %s found %d occurrences of %r" % (rel, n, old[:60]))
            return 1
        text = text.replace(old, new)
        io.open(path, "w", encoding="utf-8").write(text)
        changed.append(rel)
        print("FIXED: %s" % rel)
    print()
    print("files changed:", len(set(changed)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
