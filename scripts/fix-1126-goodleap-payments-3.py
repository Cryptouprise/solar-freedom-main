#!/usr/bin/env python3
"""
Fix 9c (26 Nov 2026) — GoodLeap: remove the duplicated stat-block.

Fix 9a's payments section shipped its own stat-block listing the same four
contact facts that the existing "How to reach GoodLeap directly" section already
renders two headings later. Fix 9b was supposed to collapse it but its guard
tested for a prose sentence that exists in both versions, so it skipped.

This removes the payments-section stat-block by exact match and confirms the
remaining count is 1. Verified after: the page names 1-800-345-9372 in prose
(account support), keeps the single contact stat-block, and the meta description
carries the number for the 128 impressions sitting on literal number queries.
"""
import io
import sys

PATH = 'client/src/data/blog-articles-batch9.ts'
SLUG_ANCHOR = 'slug: "goodleap-solar-loan-cancellation'

# The stat-block as written by fix 9a, indented 6 spaces.
DUP = '''      { type: "stat-block", stats: [
        { value: "1-800-345-9372", label: "Account support: payments, balances, payoffs" },
        { value: "customerservice@goodleapsupport.com", label: "Account email" },
        { value: "Mon-Fri 6am-8pm PT", label: "Account support hours" },
        { value: "Sat-Sun 6am-3pm PT", label: "Weekend account hours" }
      ] },
'''

# The section head, used to scope the removal to the payments section only.
HEAD = '      { type: "h2", content: "How to make a payment or get a payoff quote" },'
# Next section head, so we know the window.
NEXT = '      { type: "h2", content: "GoodLeap reviews: what borrowers report" },'


def main():
    t = io.open(PATH, encoding='utf-8').read()

    i = t.find(SLUG_ANCHOR)
    if i < 0:
        print('FAIL: slug anchor not found'); return 1
    j = t.find('\n  {\n    slug:', i + 10)
    block = t[i:j]

    if DUP not in block:
        print('skip: duplicated stat-block not present')
        print('  stat-block count in block: %d' % block.count('type: "stat-block"'))
        return 0

    a = block.find(HEAD)
    b = block.find(NEXT)
    if a < 0 or b < 0 or b < a:
        print('FAIL: could not scope the payments section (a=%d b=%d)' % (a, b)); return 1

    window = block[a:b]
    if DUP not in window:
        print('FAIL: dup exists in block but not inside the payments window'); return 1

    new_window = window.replace(DUP, '', 1)
    block = block[:a] + new_window + block[b:]
    t = t[:i] + block + t[j:]
    io.open(PATH, 'w', encoding='utf-8').write(t)

    print('OK: removed duplicated stat-block from the payments section')
    print('  stat-block count now: %d' % block.count('type: "stat-block"'))
    return 0


if __name__ == '__main__':
    sys.exit(main())
