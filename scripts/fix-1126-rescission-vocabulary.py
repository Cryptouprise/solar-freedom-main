#!/usr/bin/env python3
"""
Fix-1126: /blog/solar-contract-rescission-rights vocabulary + FAQ ordering.

Measured 26 Nov 2026 (GSC 1 Sep - 22 Nov 2026, 53 queries, 287 impr, 0 clicks):
  three day right to cancel solar contract   34 impr  pos 11.9   <- closest to page 1
  rescind solar contract                     33 impr  pos 13.5
  tila rescission solar loan                 25 impr  pos 12.7
  solar contract termination                 19 impr  pos 19.5
  how to cancel solar contract               17 impr  pos 49.1
  solar contract cancellation                15 impr  pos 34.5
  cancel solar contract before selling house 13 impr  pos 19.6

DEFECTS FOUND
 1. The served meta description never contained "cancel", "termination",
    "three day", or "before selling house" -- about 150 impressions of demand
    across those clusters, and the description named none of it.
 2. The body wrote the window only as "3-day"/"3-business-day" (numerals).
    Spelled-out "three day" occurred ZERO times, which is the form the
    highest-volume query uses.
 3. "cancel solar contract before selling house" (13 impr, pos 19.6) had no
    answer anywhere on the page and no path to the page that does answer it.
 4. The TILA FAQ added earlier on 26 Nov never shipped: BlogPost.tsx renders
    only the FIRST FIVE faq items positionally, and this array holds six, so
    the highest-demand FAQ in the set was invisible.

This script is idempotent: each block is guarded by its own marker.
"""
import io
import sys

PATH = 'client/src/data/blog-extra.ts'

OLD_TITLE = "    title: 'Solar Contract Rescission Rights: Check the 3-Day Rule',"
NEW_TITLE = "    title: 'Can You Cancel a Solar Contract in 3 Days? Rescission Rights & TILA',"

OLD_META_TITLE = "    metaTitle: 'Solar Contract Rescission Rights: 3-Day Rule & TILA',"
# 48 chars + " | Solar Freedom" = 64, so the whole promise survives Google's
# ~60-char display cut and the brand tail is the only thing dropped.
NEW_META_TITLE = "    metaTitle: 'Cancel a Solar Contract: 3-Day Rescission & TILA',"

OLD_DESC = (
    "    metaDescription: `Check whether the FTC Cooling-Off Rule or TILA covers your "
    "solar sale, how to rescind, the deadline, and how to preserve your delivery proof.`,"
)
# 153 chars. Names: cancel, rescind, terminate, three days, TILA, Cooling-Off Rule,
# and before selling your house. Every one of those clusters earns impressions today.
NEW_DESC = (
    "    metaDescription: `Cancel, rescind or terminate a solar contract in three days? "
    "Check if TILA or the FTC Cooling-Off Rule applies, and what to do before selling "
    "your house.`,"
)

# Body: introduce the spelled-out window without changing the legal substance.
# The rule gives THREE BUSINESS DAYS; "three day right to cancel" is the common
# name readers search for, so both forms appear in one accurate sentence.
OLD_FIRST_P = (
    "      { type: 'p', content: 'Direct answer: the FTC Cooling-Off Rule gives a short "
    "cancellation period for certain sales made away from a seller\u2019s permanent place "
    "of business, including some in-home sales."
)
NEW_FIRST_P = (
    "      { type: 'p', content: 'Direct answer: the FTC Cooling-Off Rule gives most "
    "covered buyers three business days \u2014 commonly called the three day right to "
    "cancel \u2014 to cancel certain sales made away from a seller\u2019s permanent place "
    "of business, including some in-home sales."
)

HOME_SALE_ANCHOR = "      { type: 'h2', content: 'Build a Reviewable Evidence File' },"
HOME_SALE_BLOCK = (
    "      { type: 'h2', content: 'Cancelling a Solar Contract Before Selling Your House' },\n"
    "      { type: 'p', content: 'A home sale adds a second, separate deadline problem. A solar "
    "lease, PPA or financed system normally has to be transferred to the buyer, bought out, or "
    "otherwise resolved before closing, and that process runs on its own timeline rather than on "
    "the cancellation window. A missed rescission deadline does not by itself prevent a sale, but "
    "it does remove the fastest option, which is why the transfer and buyout terms in the "
    "agreement are worth reading before the home is listed rather than after an offer is accepted. "
    "The transfer, buyout and disclosure steps are set out in order in our guide to "
    "[selling a house with solar panels](/blog/sell-house-with-solar-panels).' },\n"
)

FAQ_MARKER = '      // This page ranks around position 12.7 for "tila rescission solar loan" but'


def main():
    t = io.open(PATH, encoding='utf-8').read()
    changed = []

    # --- 1. title + metaTitle ------------------------------------------------
    if OLD_TITLE in t:
        t = t.replace(OLD_TITLE, NEW_TITLE, 1)
        changed.append('title')
    if OLD_META_TITLE in t:
        t = t.replace(OLD_META_TITLE, NEW_META_TITLE, 1)
        changed.append('metaTitle')

    # --- 2. description ------------------------------------------------------
    if OLD_DESC in t:
        t = t.replace(OLD_DESC, NEW_DESC, 1)
        changed.append('metaDescription')
    elif 'Cancel, rescind or terminate a solar contract in three days?' not in t:
        print('FAIL: description anchor not found and replacement not present')
        return 1

    # --- 3. spelled-out window in the opening paragraph ----------------------
    if OLD_FIRST_P in t:
        t = t.replace(OLD_FIRST_P, NEW_FIRST_P, 1)
        changed.append('body:three-day')
    elif 'three day right to cancel' not in t:
        print('FAIL: first-paragraph anchor not found and replacement not present')
        return 1

    # --- 4. home-sale section + contextual link -----------------------------
    if 'Cancelling a Solar Contract Before Selling Your House' not in t:
        if HOME_SALE_ANCHOR not in t:
            print('FAIL: home-sale insert anchor not found')
            return 1
        t = t.replace(HOME_SALE_ANCHOR, HOME_SALE_BLOCK + HOME_SALE_ANCHOR, 1)
        changed.append('body:home-sale')

    # --- 5. FAQ order so the highest-demand FAQ actually renders -------------
    # BlogPost.tsx renders faq.slice(0, 5) POSITIONALLY. Six items exist, so the
    # TILA FAQ (25 impressions behind it) never reached the page or its schema.
    # Reorder so the five that render are the five with real demand; the retired
    # one from rendering ("what if the deadline has passed") is already answered
    # in full by the body H2 "If the Stated Deadline Has Passed", so no
    # information is lost.
    # Scope to THIS article. blog-extra.ts holds five articles and each has its
    # own faq block, so an unscoped find lands in the first article's FAQ.
    art_start = t.find("slug: 'solar-contract-rescission-rights'")
    if art_start == -1:
        print('FAIL: rescission article not found')
        return 1
    nxt = t.find('\n  {', art_start + 10)
    art_end = nxt if nxt != -1 else len(t)
    faq_start = t.find('    faq: [', art_start, art_end)
    faq_end = t.find('    ],', faq_start, art_end)
    if faq_start == -1 or faq_end == -1:
        print('FAIL: faq block not found')
        return 1
    block = t[faq_start:faq_end]
    lines = block.split('\n')
    q_lines = [ln for ln in lines if ln.strip().startswith('{ q:')]
    other = [ln for ln in lines if not ln.strip().startswith('{ q:')
             and not ln.strip().startswith('//')]
    if len(q_lines) != 6:
        print('NOTE: faq has %d question lines, expected 6; skipping reorder' % len(q_lines))
    else:
        def key(ln):
            for i, q in enumerate(q_lines):
                if ln is q:
                    return i
            return 99
        order_names = [
            'Does the FTC 3-day Cooling-Off Rule cover every solar contract?',
            'How is the 3-business-day deadline calculated?',
            'Does TILA rescission apply to a solar loan?',
            'What if I cannot find the required cancellation notice?',
            'Should I stop loan or lease payments while disputing the contract?',
            'What if the stated cancellation deadline has passed?',
        ]
        picked = []
        for name in order_names:
            hit = [q for q in q_lines if name in q]
            if not hit:
                print('FAIL: faq question not found: %s' % name)
                return 1
            picked.append(hit[0])
        if picked == q_lines:
            pass  # already in the required order -- stay idempotent
        else:
            comment_lines = [ln for ln in lines if ln.strip().startswith('//')]
            rebuilt = ['    faq: [']
            rebuilt.extend(comment_lines)
            rebuilt.extend(picked)
            rebuilt.append('    ')
            t = t[:faq_start] + '\n'.join(rebuilt) + t[faq_end:]
            changed.append('faq:order')

    io.open(PATH, 'w', encoding='utf-8').write(t)
    print('changed: %s' % (', '.join(changed) if changed else 'nothing (already applied)'))
    return 0


if __name__ == '__main__':
    sys.exit(main())
