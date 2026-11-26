#!/usr/bin/env python3
"""
Adds the GoodLeap payments change-log entry to BOTH shared/changeLog.ts and
docs/CHANGE-LOG.md, using the schema and Markdown shape already in those files.
Keyed on the title, so it is safe to re-run.
"""
import io
import re
import sys

TS = 'shared/changeLog.ts'
MD = 'docs/CHANGE-LOG.md'

TITLE = 'GoodLeap: answers the payment and payoff questions it already ranked for'

ENTRY_TS = '''  {
    date: "2026-11-26",
    title: "GoodLeap: answers the payment and payoff questions it already ranked for",
    class: "content",
    changed: [
      "client/src/data/blog-articles-batch9.ts — added a 'How to make a payment or get a payoff quote' section naming 1-800-345-9372 and customerservice@goodleapsupport.com inline, plus the separate application line 1-844-562-6725 and what a payoff quote is actually good for",
      "client/src/data/blog-articles-batch9.ts — rewrote the meta description to 152 characters so it names the support number and the payoff quote",
      "client/src/data/blog-articles-batch9.ts — added a payment/payoff FAQ at the front of the array, since BlogPost.tsx renders only the first five positionally",
    ],
    evidence:
      "Search Console (1 Sep–22 Nov 2026): the page holds 10,365 impressions at average position 7.5 with 92 clicks, a 0.89% CTR. That is the largest impression mass on the site and its largest CTR gap — site-wide CTR at position 7 to 11 is 1.01%, so the page converts below the site's own average while sitting at the best position of any page above 1,000 impressions. 128 impressions sit on literal phone-number queries at zero clicks: '800-345-9372' 72 impressions at position 9.6, '8003459372' 34 at 9.4, '1-800-345-9372' 22 at 9.5. Another 57 sit on 'goodleap payoff request' at 15.4 and 37 on 'goodleap solar payments' at 26.5, also zero clicks. A grep of the built page on 26 Nov 2026 returned zero occurrences of 'payment portal', 'make a payment' or 'payoff request', and exactly one occurrence of the phone number, inside a styled stat-block. 153 of the page's 157 queries earn zero clicks, carrying 1,082 impressions, 71% of its total.",
    reasoning:
      "This is the fourth instance of a class already named in this log, after Freedom Forever, Tesla and Sunnova: a page ranking for a question it never answers. The page was not losing on relevance — position 7.5 on 10,365 impressions is the strongest combination on the site — so title and body match were already doing their job. What was missing was the answer. Phone-number and payoff-request queries are the most transactional kind a distressed borrower types, and the page had no payment path at all, so it was matched on surrounding context and the snippet answered nothing. The description was rewritten rather than only the body because the snippet is the only thing a searcher sees before deciding; naming the number there is what turns a position-7 impression into a click. What would have falsified the diagnosis: if site-wide CTR at the same position band were below 0.89%, the page would be performing normally and the gap would be a site-wide snippet problem rather than a page defect. It is 1.01%, so the page is below its own peer group.",
    confidence: "measured",
    verifiedBy:
      "Built page before the fix: 1 occurrence of 345-9372, 0 of pay-goodleap, 0 of 'customer service', 0 of 'make a payment' (grep on dist/public/blog/goodleap-solar-loan-cancellation-hidden-fees-2026/index.html, 26 Nov 2026). GoodLeap contact page read 26 Nov 2026 for 1-800-345-9372 account support, 1-844-562-6725 application support, customerservice@goodleapsupport.com, consumercomplaints@goodleap.com, Maria Mellott VP and Deputy Chief Compliance Officer at 916-475-1255, NMLS #30336, formerly Loanpal. After the fix the block contains 4 occurrences of 1-800-345-9372, exactly 1 stat-block, and 0 forward references to a number the reader has not yet seen.",
    preventsRecurrence:
      "Before planning any change to a near-winner page, grep the built HTML for the core noun of each of its top five query clusters, not just the title. A phone-number query needs the number in the description; a payoff query needs the phrase 'payoff' in a heading. Zero occurrences of a term the page ranks for is a defect, not an accident.",
    measureAfter: "2026-12-05",
  },
'''

MD_ENTRY = '''## 2026-11-26 — GoodLeap: answers the payment and payoff questions it already ranked for
**Class:** content
**Changed:** `client/src/data/blog-articles-batch9.ts` — added a "How to make a payment or get a payoff quote" section naming **1-800-345-9372** and customerservice@goodleapsupport.com inline, plus the separate application line **1-844-562-6725** and what a payoff quote is actually good for. Rewrote the meta description to **152 characters** so it names the support number and the payoff quote. Added a payment/payoff FAQ at the front of the array, since `BlogPost.tsx` renders only the first five positionally.
**Why:** Search Console (1 Sep–22 Nov 2026) shows this page holding **10,365 impressions at average position 7.5 with 92 clicks — a 0.89% CTR**. That is the largest impression mass on the site and its largest CTR gap. Site-wide CTR at position 7–11 is **1.01%**, so the page converts *below the site's own average* while sitting at the best position of any page above 1,000 impressions. **128 impressions sit on literal phone-number queries at zero clicks**: "800-345-9372" 72 impressions at position 9.6, "8003459372" 34 at 9.4, "1-800-345-9372" 22 at 9.5. Another **57** sit on "goodleap payoff request" at 15.4 and **37** on "goodleap solar payments" at 26.5, also zero clicks. A grep of the built page on 26 Nov 2026 returned **zero** occurrences of "payment portal", "make a payment" or "payoff request", and exactly **one** occurrence of the phone number, inside a styled stat-block. 153 of the page's 157 queries earn zero clicks, carrying 1,082 impressions — **71% of its total**. This is the **fourth instance** of a class already named in this log, after Freedom Forever, Tesla and Sunnova: a page ranking for a question it never answers. The page was not losing on relevance — position 7.5 on 10,365 impressions is the strongest combination on the site — so what was missing was the answer itself. Phone-number and payoff-request queries are the most transactional kind a distressed borrower types. The description was rewritten rather than only the body because the snippet is the only thing a searcher sees before deciding. What would have falsified the diagnosis: if site-wide CTR at the same position band were below 0.89%, the page would be performing normally and the gap would be a site-wide snippet problem rather than a page defect. It is 1.01%, so the page sits below its own peer group.
**Verified:** Built page before the fix: 1 occurrence of `345-9372`, 0 of `pay-goodleap`, 0 of "customer service", 0 of "make a payment" (`grep` on `dist/public/blog/goodleap-solar-loan-cancellation-hidden-fees-2026/index.html`, 26 Nov 2026). GoodLeap contact page read 26 Nov 2026 for **1-800-345-9372** account support, **1-844-562-6725** application support, customerservice@goodleapsupport.com, consumercomplaints@goodleap.com, Maria Mellott VP and Deputy Chief Compliance Officer at 916-475-1255, NMLS #30336, formerly Loanpal. After the fix the block contains 4 occurrences of `1-800-345-9372`, exactly 1 stat-block, and 0 forward references to a number the reader has not yet seen.
**Recurrence guard:** before planning any change to a near-winner page, grep the built HTML for the core noun of each of its top five query clusters, not just the title. A phone-number query needs the number in the description; a payoff query needs the phrase "payoff" in a heading. Zero occurrences of a term the page ranks for is a defect, not an accident.
**Measure after:** 2026-12-05.
'''


def main():
    ok = False

    # --- TypeScript data file: insert as the first element of CHANGE_LOG ----
    t = io.open(TS, encoding='utf-8').read()
    if TITLE in t:
        print('skip: entry already in changeLog.ts')
    else:
        m = re.search(r'export const CHANGE_LOG: ChangeEntry\[\] = \[\n', t)
        if not m:
            print('FAIL: could not locate the CHANGE_LOG array opening'); return 1
        t = t[:m.end()] + ENTRY_TS + t[m.end():]
        io.open(TS, 'w', encoding='utf-8').write(t)
        print('OK: added entry to changeLog.ts')
        ok = True

    # --- Markdown mirror: newest first, before the first "## " heading ------
    d = io.open(MD, encoding='utf-8').read()
    if 'GoodLeap: answers the payment and payoff questions' in d:
        print('skip: entry already in CHANGE-LOG.md')
    else:
        m = re.search(r'^## ', d, re.M)
        if not m:
            print('FAIL: no existing entry headings found in CHANGE-LOG.md'); return 1
        d = d[:m.start()] + MD_ENTRY + d[m.start():]
        io.open(MD, 'w', encoding='utf-8').write(d)
        print('OK: added entry to CHANGE-LOG.md')
        ok = True

    if not ok:
        print('no changes needed')
    return 0


if __name__ == '__main__':
    sys.exit(main())
