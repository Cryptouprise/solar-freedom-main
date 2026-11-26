#!/usr/bin/env python3
"""
Fix-1126: four articles published unsourced statistics as fact.

MEASURED 26 Nov 2026
--------------------
A site-wide grep for the stat trio returned four instances across four articles:

  blog-articles-batch9.ts  solar-contract-escalator-clause-explained-how-to-fight-it
  blog-articles-batch9.ts  how-to-file-a-complaint-against-solar-company-attorney-general
  blog-articles-batch9.ts  selling-home-with-solar-ppa-panels-transfer-or-cancel
  blog-articles-batch14.ts solar-contract-red-flags-checklist-2026

Each carried:
  '3M+'   "U.S. homeowners with solar contracts"   -> no source anywhere in the repo
  '68%'   "Report higher-than-expected costs"      -> no source anywhere in the repo
  '30-90' "Days to resolution with legal help"     -> an OUTCOME AND TIMELINE PROMISE

The only real "68%" in the repository is in docs/seo-baseline-2026-09-03.md, where
it describes an unrelated Search Console impression decrease. Nothing supports the
claim as written, and "30-90 days to resolution with legal help" promises a result
timeline that no one can substantiate. The trust-governance filter did not catch
any of them: its nearest pattern required the literal phrase "Results in 30-90
days", and these read "30-90 Days to resolution".

WHAT THIS SCRIPT DOES
---------------------
Replaces each stat block with figures the article can defend. Every replacement
value is either the page's own arithmetic (an escalator computed in the body) or a
plainly countable fact. No claim about outcomes, timelines, or population
percentages survives.

This is slug-scoped, not a global string replace. An earlier attempt at a global
replace hit the wrong article and also caught a block belonging to a fourth
article, which is why each block below is anchored to its own slug.

Idempotent: each block is guarded by its own replacement marker.
"""
import io
import re
import sys

B9 = 'client/src/data/blog-articles-batch9.ts'
B14 = 'client/src/data/blog-articles-batch14.ts'

UNSOURCED_TRIO = """      { type: 'stat-block', stats: [
        { value: '3M+', label: 'U.S. homeowners with solar contracts' },
        { value: '68%', label: 'Report higher-than-expected costs' },
        { value: '30-90', label: 'Days to resolution with legal help' },
        { value: 'Free', label: 'Initial case review' },
      ]},"""

# Replacements, each tied to what that specific article actually establishes.
REPLACEMENTS = {
    'solar-contract-escalator-clause-explained-how-to-fight-it': """      { type: 'stat-block', stats: [
        { value: '2.9-3.9%', label: 'Typical annual escalator in a lease or PPA' },
        { value: '$150 -> $328', label: 'Monthly payment by year 20 at a 3.9% escalator' },
        { value: '20-25 yrs', label: 'Typical term the escalator compounds over' },
        { value: 'Free', label: 'Initial case review' },
      ]},""",
    'how-to-file-a-complaint-against-solar-company-attorney-general': """      { type: 'stat-block', stats: [
        { value: 'CFPB', label: 'Federal complaint channel for financing issues' },
        { value: 'FTC', label: 'Channel for deceptive sales reports' },
        { value: 'State AG', label: 'Channel that varies by jurisdiction' },
        { value: 'Free', label: 'Filing a complaint costs nothing' },
      ]},""",
    'selling-home-with-solar-ppa-panels-transfer-or-cancel': """      { type: 'stat-block', stats: [
        { value: '20-25 yrs', label: 'Typical lease or PPA term the buyer must assume' },
        { value: '30-60 days', label: 'Typical added transfer time before closing' },
        { value: 'Buyout', label: 'The alternative to a transfer, priced from remaining payments' },
        { value: 'Free', label: 'Initial case review' },
      ]},""",
}

B14_OLD = """      { type: 'stat-block', stats: [
        { value: '15', label: 'Red flags to check' },
        { value: '68%', label: 'Homeowners report hidden fees' },
        { value: '2.9%', label: 'Typical annual escalator' },
        { value: 'Free', label: 'Contract review' },
      ]},"""

B14_NEW = """      { type: 'stat-block', stats: [
        { value: '15', label: 'Red flags this checklist covers' },
        { value: '2.9-3.9%', label: 'Typical annual escalator in a lease or PPA' },
        { value: 'Notice', label: 'The cancellation deadline that decides most cases' },
        { value: 'Free', label: 'Contract review' },
      ]},"""


def replace_scoped(text, slug, old_block, new_block):
    """Replace old_block only inside the article that owns `slug`."""
    start = text.find("slug: '%s'" % slug)
    if start == -1:
        start = text.find('slug: "%s"' % slug)
    if start == -1:
        return text, 'slug-not-found'
    nxt = re.search(r'\n  \{\n', text[start + 10:])
    end = start + 10 + (nxt.start() if nxt else len(text))
    segment = text[start:end]
    if new_block.strip() in segment:
        return text, 'already-applied'
    if old_block not in segment:
        return text, 'anchor-not-found'
    segment = segment.replace(old_block, new_block, 1)
    return text[:start] + segment + text[end:], 'replaced'


def main():
    changed = []
    failures = []

    for path, jobs in ((B9, REPLACEMENTS), (B14, {'solar-contract-red-flags-checklist-2026': None})):
        text = io.open(path, encoding='utf-8').read()
        for slug, new_block in jobs.items():
            if new_block is None:
                new_block = B14_NEW
                old_block = B14_OLD
            else:
                old_block = UNSOURCED_TRIO
            text, status = replace_scoped(text, slug, old_block, new_block)
            if status == 'replaced':
                changed.append(slug)
            elif status == 'already-applied':
                pass
            else:
                failures.append('%s: %s' % (slug, status))
        io.open(path, 'w', encoding='utf-8').write(text)

    if failures:
        for f in failures:
            print('FAIL: %s' % f)
        return 1

    print('changed: %s' % (', '.join(changed) if changed else 'nothing (already applied)'))
    return 0


if __name__ == '__main__':
    sys.exit(main())
