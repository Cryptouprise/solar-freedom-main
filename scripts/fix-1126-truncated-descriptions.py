#!/usr/bin/env python3
"""Fix five indexable descriptions that the 160-character fitter cut mid-phrase.

Found 26 Nov 2026 by scanning every built page for descriptions not ending in
sentence punctuation. 35 pages matched, 5 of them indexable. The source strings
were all complete sentences; they were simply longer than the 160-character
fitSnippet limit, so the fitter cut them at a word boundary and the served
snippet stopped mid-thought -- e.g. "...closing records" with no object.

A description that stops mid-phrase reads as unfinished to the searcher and
wastes the click, which is the same failure mode as the 74 pages of
ellipsis-terminated snippets fixed earlier today. The fix is to write the
description short enough that it survives the limit intact, not to widen the
limit, because Google truncates near 155-160 anyway.

Idempotent: keyed on the exact old string.
"""
import io
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

REPLACEMENTS = [
    (
        "client/src/data/blog-articles-batch10.ts",
        "Tesla Solar and SolarCity accounts: what a UCC-1 fixture filing does and does not mean, how to find your PPA or lease terms, and the records needed for billing, service, or a home sale.",
        "Tesla Solar and SolarCity accounts: what a UCC-1 fixture filing means, how to find your PPA or lease terms, and what to gather for billing or a home sale.",
    ),
    (
        "client/src/data/blog-articles-batch6.ts",
        "Review a New Jersey solar contract safely: written cancellation terms, contractor registration, financing documents, evidence, official complaints, and next steps.",
        "New Jersey solar contracts: the written cancellation terms to check, the contractor registration to verify, and where an official complaint actually goes.",
    ),
    (
        "client/src/data/blog-articles-batch15.ts",
        "Nevada's three solar complaint routes point at each other. Here is which agency does what, the real timelines, the $40,000 Recovery Fund limit, and what it costs you.",
        "Nevada has three solar complaint routes and they point at each other. Which agency does what, the real timelines, and the $40,000 Recovery Fund limit.",
    ),
    (
        "client/src/data/blog-articles-batch19.ts",
        "Selling a Las Vegas home with leased or financed solar? Here is where the UCC filing actually sits in Nevada, what stalls escrow, and what to check before you list.",
        "Selling a Las Vegas home with leased or financed solar? Where the UCC filing sits in Nevada, what stalls escrow, and what to check before you list.",
    ),
    (
        "client/src/data/blog-articles-batch10.ts",
        "Use this solar-loan document checklist to organize your agreement, payment schedule, proposal, statements, closing records, and sales communications before a qualified review.",
        "A solar-loan document checklist: the agreement, payment schedule, proposal, statements, closing records, and sales communications to gather before a review.",
    ),
]

LIMIT = 160


def main() -> int:
    for rel, old, new in REPLACEMENTS:
        if len(new) > LIMIT:
            print("REFUSE: replacement is %d chars, over the %d limit" % (len(new), LIMIT))
            return 1
    changed = []
    for rel, old, new in REPLACEMENTS:
        path = os.path.join(ROOT, rel)
        text = io.open(path, encoding="utf-8").read()
        if new in text and old not in text:
            print("SKIP (already applied): %s" % old[:55])
            continue
        n = text.count(old)
        if n != 1:
            print("REFUSE: %s has %d occurrences of %r" % (rel, n, old[:55]))
            return 1
        text = text.replace(old, new)
        io.open(path, "w", encoding="utf-8").write(text)
        changed.append(rel)
        print("FIXED (%d -> %d chars): %s" % (len(old), len(new), rel))
    print()
    print("files changed:", len(set(changed)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
