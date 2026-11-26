#!/usr/bin/env python3
"""
Fix 9b (26 Nov 2026) — GoodLeap: de-duplicate the stat-block and put the phone
number where the phone-number queries actually land.

Fix 9a added a payments section but gave it its own stat-block, which duplicated
the phone number and email that the existing "How to reach GoodLeap directly"
section already lists. Two identical stat-blocks on one page is repetition, not
reinforcement. This collapses the new section into prose that names the number
inline, which also reads better for a snippet.

The second half is the part that matters for the 128 impressions sitting on
literal phone-number queries ("800-345-9372" 72, "8003459372" 34,
"1-800-345-9372" 22) and the 57 on "goodleap payoff request". All of those are
served by a description that does not contain the number or the phrase, so the
searcher sees a snippet that answers nothing they typed. Verified against the
built page: the old description was 154 characters and contained neither.
"""
import io
import re
import sys

PATH = 'client/src/data/blog-articles-batch9.ts'
SLUG_ANCHOR = 'slug: "goodleap-solar-loan-cancellation'

OLD_SECTION_HEAD = '      { type: "h2", content: "How to make a payment or get a payoff quote" },'
OLD_CALLOUT_END = '      { type: "callout", content: "Do not pay a third party to obtain a payoff quote or to \\"negotiate\\" a GoodLeap loan. The account holder can request both directly at no cost, and GoodLeap\'s own FAQ states it charges no prepayment fee or penalty." },\n'

NEW_SECTION = '''      { type: "h2", content: "How to make a payment or get a payoff quote" },
      { type: "p", content: "Most people who land here are not trying to cancel anything yet. They are trying to pay, to find out what they owe, or to get a number in writing. All three are the same request as far as GoodLeap is concerned: account support, at 1-800-345-9372 or customerservice@goodleapsupport.com, Monday to Friday 6am to 8pm Pacific and weekends 6am to 3pm Pacific." },
      { type: "p", content: "GoodLeap's own contact page, read on 26 November 2026, lists a separate application line at 1-844-562-6725 for approvals, document signing and funding. If your question is about a loan you already have, use the account line above. GoodLeap, LLC was formerly known as Loanpal and operates under NMLS #30336." },
      { type: "p", content: "For a payoff quote, ask for it in writing and ask what date the figure is good through. A payoff number is only accurate for a stated window, and if a home sale is closing you want the quote to cover the closing date. If the number moves between the quote and the closing, you want to be able to show which date you were quoted." },
      { type: "callout", content: "Do not pay a third party to obtain a payoff quote or to \\"negotiate\\" a GoodLeap loan. The account holder can request both directly at no cost, and GoodLeap's own FAQ states it charges no prepayment fee or penalty." },
'''

# description: must name the phone number (128 impressions on literal number
# queries), the payoff request (57 impressions) and keep the cancel/reviews hook
# that carries the single largest query (245 impressions). Target <= 160 chars.
OLD_DESC = 'metaDescription: "Short answer: sometimes. When a GoodLeap loan can be cancelled or disputed, how to request a payoff, and the fees borrowers report. Free 15-minute review.",'
NEW_DESC = 'metaDescription: "Can you cancel a GoodLeap solar loan? How to request a payoff quote, dispute dealer fees, and reach account support at 1-800-345-9372. Free case review.",'


def main():
    t = io.open(PATH, encoding='utf-8').read()
    changed = []

    i = t.find(SLUG_ANCHOR)
    if i < 0:
        print('FAIL: slug anchor not found'); return 1
    j = t.find('\n  {\n    slug:', i + 10)
    block = t[i:j]

    # --- 1. collapse the duplicated stat-block into prose -------------------
    if 'Most people who land here are not trying to cancel anything yet' in block:
        print('skip: prose version already applied')
    else:
        a = block.find(OLD_SECTION_HEAD)
        if a < 0:
            print('FAIL: new section head not found'); return 1
        b = block.find(OLD_CALLOUT_END, a)
        if b < 0:
            print('FAIL: new section tail not found'); return 1
        b += len(OLD_CALLOUT_END)
        block = block[:a] + NEW_SECTION + block[b:]
        changed.append('payments section de-duplicated (stat-block -> prose)')

    # --- 2. description ------------------------------------------------------
    if NEW_DESC in block:
        print('skip: description already updated')
    else:
        if OLD_DESC not in block:
            print('WARN: old description not found verbatim; searching loosely')
            m = re.search(r'metaDescription: "[^"]*",', block)
            if not m:
                print('FAIL: no metaDescription found'); return 1
            print('  found:', m.group(0)[:120])
            block = block[:m.start()] + NEW_DESC + block[m.end():]
        else:
            block = block.replace(OLD_DESC, NEW_DESC, 1)
        changed.append('meta description now names the support number and payoff quote')

    if not changed:
        print('no changes needed'); return 0

    t = t[:i] + block + t[j:]
    io.open(PATH, 'w', encoding='utf-8').write(t)
    print('OK: applied ->', ', '.join(changed))

    # --- 3. report the new length -------------------------------------------
    m = re.search(r'metaDescription: "(.*?)",', block, re.S)
    if m:
        d = m.group(1)
        print('  new description length: %d chars (limit 160)' % len(d))
        print('  %s' % d)
    return 0


if __name__ == '__main__':
    sys.exit(main())
