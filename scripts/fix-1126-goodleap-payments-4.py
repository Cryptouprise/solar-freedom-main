#!/usr/bin/env python3
"""
Fix 9d (26 Nov 2026) — GoodLeap: make the payments section self-contained.

Removing the duplicated stat-block (fix 9c) left the prose pointing forward:
"use the account number and the first line above" — but the stat-block that
holds the number now appears in the NEXT section, further down the page. A
forward reference to a number the reader has not seen is exactly the same class
of defect as the dangling internal links found on the ADT page earlier today.

This rewrites the section so it names 1-800-345-9372 and the account email in
its own first paragraph. That also puts the number in body text rather than only
inside a stat-block, which matters because the stat-block is a styled component
while the paragraph is plain prose a snippet can lift.

Evidence for the whole fix remains: 128 impressions sit on literal phone-number
queries ("800-345-9372" 72 at pos 9.6, "8003459372" 34 at 9.4,
"1-800-345-9372" 22 at 9.5) and 57 on "goodleap payoff request" at 15.4, all at
zero clicks, against a built page that contained no payment or payoff path.
"""
import io
import sys

PATH = 'client/src/data/blog-articles-batch9.ts'
SLUG_ANCHOR = 'slug: "goodleap-solar-loan-cancellation'
HEAD = '      { type: "h2", content: "How to make a payment or get a payoff quote" },'
NEXT = '      { type: "h2", content: "GoodLeap reviews: what borrowers report" },'

OLD_LEAD = '''      { type: "p", content: "Most people who land here are not trying to cancel anything yet. They are trying to pay, to find out what they owe, or to get a number in writing. Those are three different requests and they go to the same place." },
      { type: "p", content: "GoodLeap's own contact page, read on 26 November 2026, lists account support as the route for payments, balances and payoffs, and application support separately at 1-844-562-6725 for approvals, document signing and funding. If your question is about a loan you already have, use the account number and the first line above." },
'''

NEW_LEAD = '''      { type: "p", content: "Most people who land here are not trying to cancel anything yet. They are trying to pay, to find out what they owe, or to get a number in writing. All three are account questions, and GoodLeap handles them on one line: 1-800-345-9372, or customerservice@goodleapsupport.com." },
      { type: "p", content: "GoodLeap's own contact page, read on 26 November 2026, lists account support as the route for payments, balances and payoffs, and application support separately at 1-844-562-6725 for approvals, document signing and funding. If your question is about a loan you already have, use the account line. GoodLeap, LLC was formerly known as Loanpal and operates under NMLS #30336." },
'''


def main():
    t = io.open(PATH, encoding='utf-8').read()

    i = t.find(SLUG_ANCHOR)
    if i < 0:
        print('FAIL: slug anchor not found'); return 1
    j = t.find('\n  {\n    slug:', i + 10)
    block = t[i:j]

    a = block.find(HEAD)
    b = block.find(NEXT)
    if a < 0 or b < 0 or b < a:
        print('FAIL: could not scope the payments section'); return 1

    window = block[a:b]

    if 'handles them on one line' in window:
        print('skip: inline version already applied')
        return 0

    if OLD_LEAD not in window:
        print('FAIL: lead paragraphs not found verbatim in the payments window')
        print('  window starts:', repr(window[:200]))
        return 1

    window = window.replace(OLD_LEAD, NEW_LEAD, 1)
    block = block[:a] + window + block[b:]
    t = t[:i] + block + t[j:]
    io.open(PATH, 'w', encoding='utf-8').write(t)

    print('OK: payments section now names the number inline')
    print('  1-800-345-9372 in block : %d' % block.count('1-800-345-9372'))
    print('  stat-block count        : %d' % block.count('type: "stat-block"'))
    print('  forward-reference check : %d ("first line above")'
          % block.count('first line above'))
    return 0


if __name__ == '__main__':
    sys.exit(main())
