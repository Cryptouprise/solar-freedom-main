#!/usr/bin/env python3
"""
Fix 11 (26 Nov 2026) — Sunrun page: the description ignores its two biggest
zero-click clusters.

Evidence (Search Console, 1 Sep–22 Nov 2026) for
/blog/sunrun-solar-contract-cancellation-2026 — 2,007 impressions in the detail
set, 9,343 in the page-level row at average position 8.0 with 79 clicks, a 0.85%
CTR against a site-wide 1.01% at the same position band.

Clustered by theme, the zero-click mass is:
  appointments   332 impr   0 clicks   (cancel sunrun appointment 71, how to
                                        cancel sunrun appointment 85, online 51,
                                        sunrun cancel appointment 49, and more)
  email/contact  122 impr   0 clicks   (sunrun cancellation email 121 at 8.8,
                                        cancellations@sunrun.com 78 at 8.8)
  fee/cost       127 impr   2 clicks   (sunrun cancellation fee 123 at 7.0)
  cancel/get out ~848 impr  ~6 clicks  (how to get out of sunrun contract 235)

The body already answers all of these — the appointment section was added
earlier today and the email answer states plainly that Sunrun publishes no
general cancellation address. But the DESCRIPTION, which is all a searcher sees
before deciding, read:

  "The cancellation window, what Sunrun charges to exit, transfer and buyout
   options when you sell, and how to put it in writing. Free 15-minute review."

It named none of: appointment, email, or the "get out" phrasing that carries
848 impressions. This is the same snippet-gap class as Blue Raven and the
rescission page: the page ranks on body relevance while the snippet answers
nothing the searcher typed.

The replacement names the appointment action (the single largest zero-click
cluster and a genuine differentiator, since most competing pages only discuss
cancelling the contract), the absence of a public cancellation email, the exit
fee, and the "get out" phrasing, while keeping a CTA.
"""
import io
import re
import sys

PATH = 'client/src/data/blog-articles-batch9.ts'
SLUG_ANCHOR = 'slug: "sunrun-solar-contract-cancellation-2026"'

OLD = 'metaDescription: "The cancellation window, what Sunrun charges to exit, transfer and buyout options when you sell, and how to put it in writing. Free 15-minute review.",'

NEW = 'metaDescription: "Cancel or get out of a Sunrun contract: the cancellation window, the exit fee, how to cancel an appointment, and no public cancellation email. Free review.",'


def main():
    t = io.open(PATH, encoding='utf-8').read()

    i = t.find(SLUG_ANCHOR)
    if i < 0:
        print('FAIL: Sunrun slug anchor not found'); return 1
    j = t.find('\n  {\n    slug:', i + 10)
    block = t[i:j if j > 0 else i + 9000]

    if NEW in block:
        print('skip: description already updated')
        return 0

    if OLD not in block:
        print('FAIL: old description not found verbatim')
        m = re.search(r'metaDescription: "[^"]*",', block)
        print('  found instead:', m.group(0) if m else '(none)')
        return 1

    block = block.replace(OLD, NEW, 1)
    t = t[:i] + block + t[j:]
    io.open(PATH, 'w', encoding='utf-8').write(t)

    print('OK: Sunrun description replaced')
    print('  new length: %d chars (limit 160)' % len(NEW.split('"')[1]))
    print('  %s' % NEW.split('"')[1])
    # confirm it names each cluster
    d = NEW.split('"')[1].lower()
    for term, why in [('appointment', '332 impr, 0 clicks'),
                      ('email', '122 impr, 0 clicks'),
                      ('get out', '848 impr cluster'),
                      ('fee', '127 impr cluster')]:
        print('  names %-12s %s  (%s)' % (term, 'YES' if term in d else 'NO ', why))
    return 0


if __name__ == '__main__':
    sys.exit(main())
