#!/usr/bin/env python3
"""
Fix 9 (26 Nov 2026) — GoodLeap article: add the answer the impressions are asking for.

Evidence: /blog/goodleap-solar-loan-cancellation-hidden-fees-2026 holds 10,365
impressions at average position 7.5 with 92 clicks (0.89% CTR) — the largest
impression mass on the site and the largest CTR gap. Site-wide CTR at position
7-11 is 1.01%, so the page converts BELOW the site's own average while sitting
at the best position of any page with more than 1,000 impressions.

Queries carrying impressions with ZERO clicks, and what the built page lacked:
  "800-345-9372"                     72 impr  pos  9.6   0 clicks
  "8003459372"                       34 impr  pos  9.4   0 clicks
  "1-800-345-9372"                   22 impr  pos  9.5   0 clicks
  "customerservice@goodleapsupport.com" 24 impr pos 9.7  0 clicks
  "www.pay-goodleap.com"             23 impr  pos 22.0   0 clicks
  "goodleap payoff request"          57 impr  pos 15.4   0 clicks
  "goodleap solar payments"          37 impr  pos 26.5   0 clicks
  "goodleap solar payment"           23 impr  pos 18.2   0 clicks

The built page had ONE occurrence of the phone number (in a stat-block) and
ZERO occurrences of "payment portal", "make a payment", "payoff request",
"www.pay-goodleap.com" or any payment path. So it ranked for payment and
payoff questions without answering them — the fourth instance of the same
defect class the change log already names.

All contact facts verified 26 Nov 2026 from GoodLeap's own contact page:
  1-800-345-9372  Account support: payments, balances, payoffs
  1-844-562-6725  Application support: approvals, signing, funding
  customerservice@goodleapsupport.com  Account email
  consumercomplaints@goodleap.com      Formal complaint email
  Maria Mellott, VP & Deputy Chief Compliance Officer,
  8781 Sierra College Blvd., Roseville, CA 95661, 916-475-1255
  GoodLeap, LLC, NMLS #30336, formerly Loanpal, rebranded 2 June 2021
"""
import io
import sys

PATH = 'client/src/data/blog-articles-batch9.ts'
SLUG_ANCHOR = 'slug: "goodleap-solar-loan-cancellation'

# --- 1. Insert a payments/payoff section before the reviews section -----------
PAY_ANCHOR = '      { type: "h2", content: "GoodLeap reviews: what borrowers report" },'

PAY_SECTION = '''      { type: "h2", content: "How to make a payment or get a payoff quote" },
      { type: "p", content: "Most people who land here are not trying to cancel anything yet. They are trying to pay, to find out what they owe, or to get a number in writing. Those are three different requests and they go to the same place." },
      { type: "stat-block", stats: [
        { value: "1-800-345-9372", label: "Account support: payments, balances, payoffs" },
        { value: "customerservice@goodleapsupport.com", label: "Account email" },
        { value: "Mon-Fri 6am-8pm PT", label: "Account support hours" },
        { value: "Sat-Sun 6am-3pm PT", label: "Weekend account hours" }
      ] },
      { type: "p", content: "GoodLeap's own contact page, read on 26 November 2026, lists account support as the route for payments, balances and payoffs, and application support separately at 1-844-562-6725 for approvals, document signing and funding. If your question is about a loan you already have, use the account number and the first line above." },
      { type: "p", content: "For a payoff quote, ask for it in writing and ask what date the figure is good through. A payoff number is only accurate for a stated window, and if a home sale is closing you want the quote to cover the closing date. If the figure moves between the quote and the closing, you want to be able to show which date you were quoted." },
      { type: "callout", content: "Do not pay a third party to obtain a payoff quote or to \\"negotiate\\" a GoodLeap loan. The account holder can request both directly at no cost, and GoodLeap's own FAQ states it charges no prepayment fee or penalty." },
'''

# --- 2. Add the missing FAQ, replacing the lowest-demand one -----------------
FAQ_OLD = '      { q: "Do I keep paying if my installer went out of business?",'
FAQ_NEW = '      { q: "How do I make a payment or request a payoff quote from GoodLeap?", a: "Call GoodLeap account support at 1-800-345-9372, or email customerservice@goodleapsupport.com. That is the line GoodLeap\'s own contact page lists for payments, balances and payoffs. Ask for the payoff quote in writing and ask what date it is valid through, because a payoff figure only holds for a stated window and a home sale can close on a different day." },\n      { q: "Do I keep paying if my installer went out of business?",'

def main():
    t = io.open(PATH, encoding='utf-8').read()
    changed = []

    i = t.find(SLUG_ANCHOR)
    if i < 0:
        print('FAIL: slug anchor not found'); return 1
    j = t.find('\n  {\n    slug:', i + 10)
    if j < 0:
        print('FAIL: could not find end of GoodLeap block'); return 1
    block = t[i:j]

    # 1. payments section
    if 'How to make a payment or get a payoff quote' in block:
        print('skip: payments section already present')
    else:
        k = block.find(PAY_ANCHOR)
        if k < 0:
            print('FAIL: reviews anchor not found inside block'); return 1
        block = block[:k] + PAY_SECTION + block[k:]
        changed.append('payments/payoff section')

    # 2. FAQ
    if 'How do I make a payment or request a payoff quote from GoodLeap?' in block:
        print('skip: payment FAQ already present')
    else:
        if FAQ_OLD not in block:
            print('FAIL: FAQ anchor not found inside block'); return 1
        block = block.replace(FAQ_OLD, FAQ_NEW, 1)
        changed.append('payment FAQ (inserted before installer FAQ)')

    if not changed:
        print('no changes needed'); return 0

    t = t[:i] + block + t[j:]
    io.open(PATH, 'w', encoding='utf-8').write(t)
    print('OK: applied ->', ', '.join(changed))
    return 0

if __name__ == '__main__':
    sys.exit(main())
