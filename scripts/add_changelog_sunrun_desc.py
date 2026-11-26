#!/usr/bin/env python3
"""
Adds the Sunrun description entry to BOTH shared/changeLog.ts and
docs/CHANGE-LOG.md. Keyed on the title, so it is safe to re-run.
"""
import io
import re
import sys

TS = 'shared/changeLog.ts'
MD = 'docs/CHANGE-LOG.md'

TITLE = 'Sunrun description named none of the four clusters it loses clicks on'

ENTRY_TS = '''  {
    date: "2026-11-26",
    title: "Sunrun description named none of the four clusters it loses clicks on",
    class: "SEO",
    changed: [
      "client/src/data/blog-articles-batch9.ts — replaced the Sunrun cancellation article's meta description, which named none of appointment, email, 'get out' or the exit fee, with a 155-character description that names all four and keeps a call to action",
    ],
    evidence:
      "Search Console (1 Sep–22 Nov 2026) for /blog/sunrun-solar-contract-cancellation-2026: 2,007 impressions in the query detail and 9,343 in the page-level row at average position 8.0 with 79 clicks, a 0.85% CTR against a site-wide 1.01% at the same position band. Clustered by theme, the zero-click mass is 332 impressions on appointment queries (85 on 'how to cancel sunrun appointment' at position 9.0, 71 on 'cancel sunrun appointment' at 9.9, 51 on the online variant at 9.2, 49 on 'sunrun cancel appointment'), 122 on email queries ('sunrun cancellation email' 121 at 8.8, 'cancellations@sunrun.com' 78 at 8.8), and 848 on 'get out' and 'cancel' phrasing including 235 on 'how to get out of sunrun contract' at 10.3. The served description read 'The cancellation window, what Sunrun charges to exit, transfer and buyout options when you sell, and how to put it in writing' and named none of those terms.",
    reasoning:
      "The body already answers every one of these clusters — the appointment section and the email answer were both added earlier the same day — so this was not a content gap. It was a snippet gap: the page ranks on body relevance while the description, which is all a searcher sees before deciding, answered nothing the searcher typed. This is the same class already recorded for Blue Raven and the rescission page, and the pattern is now clear enough to state as a rule: a near-winner page's top five query clusters must be checked against the DESCRIPTION, not only against the body. The appointment cluster is also the most commercially useful, because someone trying to stop an installer visit is the most time-pressured visitor the site gets, and most competing pages discuss only cancelling the contract, so naming it is a genuine differentiator rather than keyword stuffing. What would have falsified the diagnosis: if the description had already contained those terms, the gap would be a ranking or authority problem and no description change would help.",
    confidence: "measured",
    verifiedBy:
      "pnpm build pre-rendered 583 pages; the built Sunrun page's description reads 155 characters and contains 'appointment', 'email', 'get out' and 'fee'; scripts/fix-1126-sunrun-description.py is idempotent and prints a term-by-term confirmation",
    preventsRecurrence:
      "For every near-winner page, extract the top five query clusters by impressions and confirm each cluster's core noun appears in the meta description. Body relevance can rank a page while the snippet still answers nothing, which caps CTR regardless of position.",
    measureAfter: "2026-12-05",
  },
'''

MD_ENTRY = '''## 2026-11-26 — Sunrun description named none of the four clusters it loses clicks on
**Class:** SEO
**Changed:** `client/src/data/blog-articles-batch9.ts` — replaced the Sunrun cancellation article's meta description, which named none of appointment, email, "get out" or the exit fee, with a **155-character** description that names all four and keeps a call to action.
**Why:** Search Console (1 Sep–22 Nov 2026) for `/blog/sunrun-solar-contract-cancellation-2026`: **2,007 impressions in the query detail and 9,343 in the page-level row at average position 8.0 with 79 clicks — a 0.85% CTR against a site-wide 1.01%** at the same position band. Clustered by theme, the zero-click mass is **332 impressions on appointment queries** (85 on "how to cancel sunrun appointment" at pos 9.0, 71 on "cancel sunrun appointment" at 9.9, 51 on the online variant at 9.2, 49 on "sunrun cancel appointment"), **122 on email queries** ("sunrun cancellation email" 121 at 8.8, "cancellations@sunrun.com" 78 at 8.8), and **848 on "get out" and "cancel" phrasing** including 235 on "how to get out of sunrun contract" at 10.3. The served description read *"The cancellation window, what Sunrun charges to exit, transfer and buyout options when you sell, and how to put it in writing"* and named none of those terms. The body already answers every cluster — the appointment section and the email answer were both added earlier the same day — so this was not a content gap but a **snippet gap**: the page ranks on body relevance while the description answers nothing the searcher typed. Same class as Blue Raven and the rescission page, and the pattern is now clear enough to state as a rule: **a near-winner page's top five query clusters must be checked against the description, not only the body.** The appointment cluster is also the most commercially useful, because someone trying to stop an installer visit is the most time-pressured visitor the site gets, and most competing pages discuss only cancelling the contract.
**Verified:** `pnpm build` pre-rendered 583 pages; the built Sunrun page's description reads 155 characters and contains "appointment", "email", "get out" and "fee"; `scripts/fix-1126-sunrun-description.py` is idempotent and prints a term-by-term confirmation.
**Recurrence guard:** for every near-winner page, extract the top five query clusters by impressions and confirm each cluster's core noun appears in the meta description. Body relevance can rank a page while the snippet still answers nothing, which caps CTR regardless of position.
**Measure after:** 2026-12-05.
'''


def main():
    ok = False

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

    d = io.open(MD, encoding='utf-8').read()
    if 'Sunrun description named none of the four clusters' in d:
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
