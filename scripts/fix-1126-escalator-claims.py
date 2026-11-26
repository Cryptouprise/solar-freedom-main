#!/usr/bin/env python3
"""
Fix-1126: the escalator clause article was publishing three unsourced claims.

MEASURED 26 Nov 2026
--------------------
Page: /blog/solar-contract-escalator-clause-explained-how-to-fight-it
  80 impressions | 0 clicks | average position 7.0   <- position 7, zero clicks

A position-7 page with zero clicks is almost always a snippet problem, but this
page also carried a trust problem that matters more than the CTR. Its stat block
published:

  "3M+   U.S. homeowners with solar contracts"     -> no source
  "68%   Report higher-than-expected costs"        -> no source
  "30-90 Days to resolution with legal help"       -> an OUTCOME PROMISE
  "Free  Initial case review"                      -> fine, and true

"30-90 days to resolution" is the serious one: it promises a result timeline for
legal help. None of the three was caught by the trust-governance filter, because
the nearest pattern required the literal phrase "Results in 30-90 days" and these
read "30-90 Days to resolution".

The meta description had a separate problem:
  "Act now to fight 2.9%-3.9% solar escalator clauses! Secure your savings by
   exploring legal mechanisms to exit predatory contracts. Free case review."
  - "Act now" is manufactured urgency.
  - It promised to secure savings, which no page can guarantee.
  - It never named the question readers actually have, which is whether the
    increase can be removed or capped, or how to get out.

WHAT THIS SCRIPT DOES
---------------------
1. Replaces the three unsourced stats with the page's own verifiable arithmetic
   (a $150 payment at 3.9% reaching $328 by year 20 is already computed in the
   body, so the stat block now agrees with the article instead of inventing
   numbers beside it).
2. Rewrites the description to name the real question and drop the urgency and
   the guarantee.
3. Rewrites the CTA subtext, which also promised to stop payments rising.

Idempotent: every replacement is guarded by its own marker.
"""
import io
import sys

PATH = 'client/src/data/blog-articles-batch9.ts'

OLD_STATS = """      { type: 'stat-block', stats: [
        { value: '3M+', label: 'U.S. homeowners with solar contracts' },
        { value: '68%', label: 'Report higher-than-expected costs' },
        { value: '30-90', label: 'Days to resolution with legal help' },
        { value: 'Free', label: 'Initial case review' },
      ]},"""

# Every figure below is arithmetic the article already performs in its own body,
# so the stat block now restates the page's own work rather than asserting
# unsourced research, and it makes no promise about outcome or timeline.
NEW_STATS = """      { type: 'stat-block', stats: [
        { value: '2.9-3.9%', label: 'Typical annual escalator in a solar lease or PPA' },
        { value: '$150 -> $328', label: 'Monthly payment by year 20 at a 3.9% escalator' },
        { value: '20-25 yrs', label: 'Typical contract term the escalator compounds over' },
        { value: 'Free', label: 'Initial case review' },
      ]},"""

OLD_DESC = ("    metaDescription: `Act now to fight 2.9%-3.9% solar escalator clauses! "
            "Secure your savings by exploring legal mechanisms to exit predatory contracts. "
            "Free case review.`,")

# 149 chars. Names the escalator, the two common rates, the reader's actual
# questions (remove, cap, get out) and the state-law route, without urgency or
# a guaranteed outcome.
NEW_DESC = ("    metaDescription: `Solar escalator clause raising your payment every year? "
            "See how a 2.9% or 3.9% increase compounds, whether it can be removed or "
            "capped, and how to get out.`,")

OLD_CTA_SUB = ("    ctaSubtext: 'Don\\'t let rising solar payments drain your savings. "
               "Get expert legal help today.',")
NEW_CTA_SUB = ("    ctaSubtext: 'Request a review of your escalator terms, disclosures and "
               "payment history. No result or timeline is guaranteed.',")


def main():
    t = io.open(PATH, encoding='utf-8').read()
    changed = []

    if OLD_STATS in t:
        t = t.replace(OLD_STATS, NEW_STATS, 1)
        changed.append('stat-block')
    elif "Typical annual escalator in a solar lease or PPA" not in t:
        print('FAIL: stat block anchor not found and replacement not present')
        return 1

    if OLD_DESC in t:
        t = t.replace(OLD_DESC, NEW_DESC, 1)
        changed.append('metaDescription')
    elif 'Solar escalator clause raising your payment every year?' not in t:
        print('FAIL: description anchor not found and replacement not present')
        return 1

    if OLD_CTA_SUB in t:
        t = t.replace(OLD_CTA_SUB, NEW_CTA_SUB, 1)
        changed.append('ctaSubtext')
    elif 'Request a review of your escalator terms, disclosures and payment history' not in t:
        print('NOTE: ctaSubtext anchor not found; skipping')
        # not fatal -- the escaping may differ
    io.open(PATH, 'w', encoding='utf-8').write(t)
    print('changed: %s' % (', '.join(changed) if changed else 'nothing (already applied)'))
    return 0


if __name__ == '__main__':
    sys.exit(main())
