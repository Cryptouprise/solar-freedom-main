#!/usr/bin/env python3
"""
Insert the two 26 Nov 2026 change-log entries:

  A) "Rescission page ranked for cancel, termination and the three-day window
      without naming any of them"          (class: SEO)
  B) "FAQ structured data described 38 questions the page never displayed"
                                           (class: defect)

Idempotent: keyed on the exact title string in both shared/changeLog.ts and
docs/CHANGE-LOG.md. Running twice changes nothing.
"""
import io
import re
import sys

TS = 'shared/changeLog.ts'
MD = 'docs/CHANGE-LOG.md'

TITLE_A = ("Rescission page ranked for cancel, termination and the three-day window "
           "without naming any of them")
TITLE_B = "FAQ structured data described 38 questions the page never displayed"

ENTRY_A = '''  {
    date: "2026-11-26",
    title: "Rescission page ranked for cancel, termination and the three-day window without naming any of them",
    class: "SEO",
    changed: [
      "client/src/data/blog-extra.ts: the /blog/solar-contract-rescission-rights metaTitle is now 'Cancel a Solar Contract: 3-Day Rescission & TILA' (48 chars, 64 rendered with the brand suffix) and the metaDescription now names cancel, rescind, terminate, three days, TILA, the FTC Cooling-Off Rule and before selling your house",
      "The page title changed from 'Solar Contract Rescission Rights: Check the 3-Day Rule' to 'Can You Cancel a Solar Contract in 3 Days? Rescission Rights & TILA'",
      "The opening paragraph now states the three business day window in words as well as numerals, because the page wrote only '3-day' and never 'three day' while the highest-volume query uses the spelled form",
      "New H2 section 'Cancelling a Solar Contract Before Selling Your House' answering the home-sale cluster and linking to /blog/sell-house-with-solar-panels",
      "FAQ order changed so the TILA question is third instead of sixth, because the client rendered only the first five and that question was therefore invisible despite carrying 25 impressions",
      "scripts/fix-1126-rescission-vocabulary.py added; idempotent, keyed on each block",
    ],
    evidence:
      "Search Console (1 Sep-22 Nov 2026): the page earned 287 impressions across 53 queries at average position 36.2 with ZERO clicks. Its top queries were 'three day right to cancel solar contract' 34 impressions at position 11.9, 'rescind solar contract' 33 at 13.5, 'tila rescission solar loan' 25 at 12.7, 'solar contract termination' 19 at 19.5, 'how to cancel solar contract' 17 at 49.1, 'solar contract cancellation' 15 at 34.5 and 'cancel solar contract before selling house' 13 at 19.6. The served meta description read 'Check whether the FTC Cooling-Off Rule or TILA covers your solar sale, how to rescind, the deadline, and how to preserve your delivery proof.' and contained the word 'cancel' zero times, 'termination' zero times, 'three day' zero times and 'before selling house' zero times, so roughly 150 impressions of demand were matched on body relevance while the snippet answered none of it. The built page wrote the window only as '3-day' and '3-business-day' and never as 'three day'.",
    reasoning:
      "Two separate fields were wrong and the earlier fix in this session had corrected only the first. That fix replaced 'Checklist' with 'TILA' in the title because 'tila rescission solar loan' carried 25 impressions, and it worked, but it left the description untouched. The description is what the searcher reads, and the audit that found this compares the top five query clusters by impressions against the description rather than against the page topic, which is how the mismatch became visible. 'Cancel' is the single largest vocabulary group on the page at over 150 impressions and the word appeared nowhere in the snippet. The body already answered the cancellation question, so this was a naming problem rather than a content hole. The one genuine content hole was the home-sale cluster, which had no answer on the page and no link to the page that does answer it, so that got a section rather than a keyword. The FAQ reorder is the same positional-cap defect found twice before on other pages and is fixed by moving demand into the visible five rather than by adding a sixth item that would never render. No new legal claim was introduced: the three business day window is the existing rule stated in both numeral and word form, and the home-sale section repeats the standing warning that a missed deadline removes the fastest option rather than saying a sale is impossible.",
    confidence: "measured",
    verifiedBy:
      "pnpm build pre-rendered 583 pages; the built page title is 64 rendered characters reading 'Cancel a Solar Contract: 3-Day Rescission & TILA | Solar Freedom', the description is 153 characters naming cancel, rescind, terminate, three days, TILA, Cooling-Off Rule and before selling your house, the served body now contains 'three day' twice where it had zero, 'before selling' twice where it had zero, and the TILA FAQ renders third in both the HTML and the FAQPage schema",
    preventsRecurrence:
      "scripts/audit-snippet-coverage.py now runs this check across every indexed page instead of one page at a time: for each page earning impressions it clusters the top queries by impressions and reports which clusters the served meta description does not name. Run after any content or meta change and after each GSC refresh. The FAQ positional cap is separately guarded by server/faqParity.test.ts.",
    measureAfter: "2026-12-05",
  },
'''

ENTRY_B = '''  {
    date: "2026-11-26",
    title: "FAQ structured data described 38 questions the page never displayed",
    class: "defect",
    changed: [
      "shared/faq-policy.json created as the single source of truth for how many FAQ items a page may render and mark up (maxRenderedItems: 8), with the drift history recorded in the file",
      "client/src/pages/BlogPost.tsx: MAX_FAQ_ITEMS raised from 5 to the shared policy value and the literal removed so it cannot be hard-coded again",
      "scripts/prerender.assembled.mjs: the FAQ HTML emitter now slices to the shared cap, and the FAQPage JSON-LD slice changed from a hard-coded 10 to the shared cap",
      "server/faqParity.test.ts added, 8 tests, including a scan of the built output asserting no page marks up more questions than the cap",
    ],
    evidence:
      "Measured 26 Nov 2026 across all 583 built pages: 23 pages emitted more FAQ questions in the pre-rendered shell than the client rendered. The shell carried 153 Q&As on those pages and the client rendered 115, so 38 questions were described in FAQPage JSON-LD and served as visible HTML to crawlers that do not run JavaScript, but were invisible to any reader with JavaScript enabled. The worst cases carried 8 shell questions against 5 rendered. The cause is dated: git log shows commit 2b14b60 (18 Nov 2026, PR #58, 'Guide pages: chat on every page, one booking block, 5-question FAQ') introduced the client cap of 5 to stop long FAQ walls burying the call to action, and did not change the shell, which sliced at 10.",
    reasoning:
      "Google's structured-data policy requires FAQPage markup to describe content visible on the page. This was therefore a live violation rather than a style preference, and it was invisible to every check that looked at either side alone: the shell was internally consistent, the client was internally consistent, and only a comparison of the two exposed it. The fix direction was decided by asking which cap was correct rather than which was easier to change. Raising the client to 8 preserves the shell's crawler-visible content and restores parity, and it does not recreate the wall-of-text problem that motivated the cap of 5, because the section renders as collapsed <details> accordions where only the first is open. Lowering the shell to 5 was rejected because it would have deleted 38 questions from crawler-visible HTML that had been live and indexed for eight days, and because several of those questions answer demand measured in Search Console. The cap now lives in one shared JSON file that both sides read, so the two cannot drift apart again, and the test asserts the structural properties rather than the current number.",
    confidence: "measured",
    verifiedBy:
      "npx vitest run server/faqParity.test.ts: 8 tests passed. pnpm build pre-rendered 583 pages, and a scan of all 197 built pages carrying a FAQ section found 0 pages exceeding the cap and 0 with an HTML-versus-JSON-LD count mismatch, down from 23 pages and 38 hidden questions",
    preventsRecurrence:
      "shared/faq-policy.json is read by both the client and the pre-render shell, and server/faqParity.test.ts fails the build if either side hard-codes a number, if the shell's HTML or JSON-LD emitter stops slicing at the shared cap, if the cap drops below the largest faq array in client/src/data, or if any built page marks up more questions than the cap. The same class of defect had appeared three times before on individual pages as a positional FAQ cap, which is why this is now enforced structurally rather than per page.",
    measureAfter: "2026-12-05",
  },
'''

MD_A = '''## 2026-11-26 — Rescission page ranked for cancel, termination and the three-day window without naming any of them

**Class:** SEO

**Changed:**
- `client/src/data/blog-extra.ts`: the `/blog/solar-contract-rescission-rights` metaTitle is now `Cancel a Solar Contract: 3-Day Rescission & TILA` (48 chars, 64 rendered with the brand suffix) and the metaDescription names cancel, rescind, terminate, three days, TILA, the FTC Cooling-Off Rule and before selling your house.
- The page title changed from `Solar Contract Rescission Rights: Check the 3-Day Rule` to `Can You Cancel a Solar Contract in 3 Days? Rescission Rights & TILA`.
- The opening paragraph now states the three business day window in words as well as numerals, because the page wrote only `3-day` and never `three day` while the highest-volume query uses the spelled form.
- New H2 section "Cancelling a Solar Contract Before Selling Your House" answering the home-sale cluster and linking to `/blog/sell-house-with-solar-panels`.
- FAQ order changed so the TILA question is third instead of sixth, because the client rendered only the first five and that question was therefore invisible despite carrying 25 impressions.
- `scripts/fix-1126-rescission-vocabulary.py` added; idempotent, keyed on each block.

**Why:** Search Console (1 Sep–22 Nov 2026) shows 287 impressions across 53 queries at average position 36.2 with **zero clicks**. Top queries: "three day right to cancel solar contract" 34 impr at 11.9, "rescind solar contract" 33 at 13.5, "tila rescission solar loan" 25 at 12.7, "solar contract termination" 19 at 19.5, "how to cancel solar contract" 17 at 49.1, "solar contract cancellation" 15 at 34.5, "cancel solar contract before selling house" 13 at 19.6. The served description contained the word "cancel" zero times, "termination" zero times, "three day" zero times and "before selling house" zero times — about 150 impressions of demand matched on body relevance while the snippet answered none of it. An earlier fix in the same session corrected only the title; the description is a separate field.

**Verified:** `pnpm build` pre-rendered 583 pages. The built title is 64 rendered characters. The description is 153 characters naming all seven clusters. The served body now contains "three day" twice where it had zero and "before selling" twice where it had zero. The TILA FAQ renders third in both the HTML and the FAQPage schema.

**Recurrence guard:** `scripts/audit-snippet-coverage.py` now runs this check across every indexed page rather than one at a time — for each page earning impressions it clusters the top queries and reports which clusters the served description does not name. The FAQ positional cap is separately guarded by `server/faqParity.test.ts`.

**Measure after:** 2026-12-05

'''

MD_B = '''## 2026-11-26 — FAQ structured data described 38 questions the page never displayed

**Class:** defect

**Changed:**
- `shared/faq-policy.json` created as the single source of truth for how many FAQ items a page may render and mark up (`maxRenderedItems: 8`), with the drift history recorded in the file.
- `client/src/pages/BlogPost.tsx`: `MAX_FAQ_ITEMS` raised from 5 to the shared policy value and the literal removed so it cannot be hard-coded again.
- `scripts/prerender.assembled.mjs`: the FAQ HTML emitter now slices to the shared cap, and the FAQPage JSON-LD slice changed from a hard-coded 10 to the shared cap.
- `server/faqParity.test.ts` added, 8 tests, including a scan of the built output asserting no page marks up more questions than the cap.

**Why:** Measured 26 Nov 2026 across all 583 built pages: **23 pages emitted more FAQ questions in the pre-rendered shell than the client rendered.** The shell carried 153 Q&As on those pages, the client rendered 115, so **38 questions were described in FAQPage JSON-LD and served as visible HTML to crawlers that do not run JavaScript, but were invisible to any reader with JavaScript enabled.** The cause is dated: `git log` shows commit `2b14b60` (18 Nov 2026, PR #58) introduced the client cap of 5 to stop long FAQ walls burying the call to action and did not change the shell, which sliced at 10. Google's structured-data policy requires FAQPage markup to describe content visible on the page, so this was a live violation rather than a style preference.

**Verified:** `npx vitest run server/faqParity.test.ts` — 8 tests passed. `pnpm build` pre-rendered 583 pages, and a scan of all 197 built pages carrying a FAQ section found **0 pages exceeding the cap and 0 with an HTML-versus-JSON-LD count mismatch**, down from 23 pages and 38 hidden questions.

**Recurrence guard:** `shared/faq-policy.json` is read by both the client and the pre-render shell, and `server/faqParity.test.ts` fails the build if either side hard-codes a number, if the shell's HTML or JSON-LD emitter stops slicing at the shared cap, if the cap drops below the largest faq array in `client/src/data`, or if any built page marks up more questions than the cap. The same class of defect had appeared three times before on individual pages as a positional FAQ cap, which is why it is now enforced structurally rather than per page.

**Measure after:** 2026-12-05

'''


def main():
    ts = io.open(TS, encoding='utf-8').read()
    md = io.open(MD, encoding='utf-8').read()
    changed = []

    if TITLE_A not in ts:
        # insert before the closing "];" of the CHANGE_LOG array. The array
        # closes with a blank line before "];" -- match on "];" on its own line.
        marker = '\n];\n'
        if marker not in ts:
            print('FAIL: CHANGE_LOG array close marker not found')
            return 1
        ts = ts.replace(marker, '\n' + ENTRY_A + ENTRY_B + '];\n', 1)
        changed.append('changeLog.ts')

    if TITLE_B not in ts:
        print('FAIL: entry B did not land in changeLog.ts')
        return 1

    if TITLE_A not in md:
        # newest-first: put the new headings at the very top after any H1
        m = re.search(r'^(#\s+.*\n)', md, re.M)
        if not m:
            print('FAIL: no H1 in CHANGE-LOG.md')
            return 1
        insert_at = m.end()
        md = md[:insert_at] + '\n' + MD_A + MD_B + md[insert_at:]
        changed.append('CHANGE-LOG.md')

    if TITLE_B not in md:
        print('FAIL: entry B did not land in CHANGE-LOG.md')
        return 1

    if changed:
        io.open(TS, 'w', encoding='utf-8').write(ts)
        io.open(MD, 'w', encoding='utf-8').write(md)
    print('changed: %s' % (', '.join(changed) if changed else 'nothing (already present)'))
    return 0


if __name__ == '__main__':
    sys.exit(main())
