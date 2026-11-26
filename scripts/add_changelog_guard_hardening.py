#!/usr/bin/env python3
"""Append one change-log entry for the snippet-completeness guard hardening.

Also records a NEGATIVE finding: the inherited concern that this test read the
eligibility list instead of the built robots directive was WRONG, and acting on
it would have been a fourth false positive of the same class.
"""
import io
import os
import re

ROOT = "/home/ubuntu/solar-freedom"
TS = os.path.join(ROOT, "shared/changeLog.ts")
MD = os.path.join(ROOT, "docs/CHANGE-LOG.md")

TITLE = "A guard was tightened after its inherited premise was disproved, not fixed on faith"

ENTRY = '''  {
    date: "2026-11-26",
    title: "A guard was tightened after its inherited premise was disproved, not fixed on faith",
    class: "infrastructure",
    changed: [
      "server/firstPartyClaims.test.ts — the source-side description-length bound was pinned at the measured 34 instead of the loose less-than-60, and the failure message now lists every offending file so a new one forces a decision rather than being absorbed by headroom",
      "no site change — the guard was already reading the correct thing",
    ],
    evidence:
      "Measured 26 Nov 2026 across all 583 built pages: the robots directive takes exactly two forms, noindex, follow on 498 pages and index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1 on 85. The test helper uses m[1].startsWith(index), which returns false for noindex, follow, so the helper was already correct and the 85 indexable pages it counts match the approved eligibility set. The source-side check that counts metaDescription values over 160 characters stood at 34 against a bound of less-than-60, which is 26 units of headroom in which 26 new defects could ship without a single test going red. Pinned to less-than-or-equal-34. Injection proof: appending one synthetic 200-character metaDescription to blog-articles-batch3.ts turned the test red with the count reported as 35 and every offending file listed, and restoring the file returned it to 6 passed.",
    reasoning:
      "The inherited note on this test said it called isIndexable() and therefore read the eligibility list rather than the built robots directive, and that this was the same class of error as the false positives found earlier the same day. That premise is false, and it was worth disproving before editing because acting on it would have been the fourth false positive of the session and the fourth one caused by a check rather than by the site. Reading the helper showed it tests startsWith(index) against the directive string, which is exactly the correct test and is the same discipline the earlier false positives were missing. What was genuinely wrong was narrower and different: the bound was loose enough that the source list could grow by 26 entries silently. Both halves of this are worth recording, because the habit that produced the correct outcome is the habit of disproving an inherited claim before implementing it, and the cost of not doing that is a change log full of fixes to things that were never broken.",
    confidence: "measured",
    verifiedBy:
      "The two robots directive forms were enumerated directly from the built output rather than assumed, 498 noindex against 85 index; the injection test appended a real over-limit string to a real data file and observed the exact expected failure before restoring; git diff confirms the injected file was restored byte-identical to HEAD; the full suite passes at 92 files and 883 tests with 3 skipped",
    preventsRecurrence:
      "A loose upper bound is not a guard, it is a tolerance. Any bound that exists to catch growth must be pinned at the measured value so the next occurrence forces a decision. And an inherited claim about a defect is a hypothesis like any other: it is disproved by reading the code, not confirmed by acting on it.",
    measureAfter: "2026-12-05",
  },
'''

MD_SECTION = '''## 2026-11-26 — A guard was tightened after its inherited premise was disproved, not fixed on faith

**Class:** infrastructure

**Changed:**
- `server/firstPartyClaims.test.ts` — the source-side description-length bound was pinned at the measured 34 instead of the loose `<60`, and the failure message now lists every offending file so a new one forces a decision rather than being absorbed by headroom
- no site change — the guard was already reading the correct thing

**Why:**
Measured 26 Nov 2026 across all 583 built pages: the robots directive takes exactly two forms, `noindex, follow` on 498 pages and `index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1` on 85. The test helper uses `m[1].startsWith("index")`, which returns false for `noindex, follow`, so the helper was already correct and the 85 indexable pages it counts match the approved eligibility set. The source-side check that counts `metaDescription` values over 160 characters stood at **34** against a bound of `<60`, which is 26 units of headroom in which 26 new defects could ship without a single test going red. Pinned to `<=34`. Injection proof: appending one synthetic 200-character metaDescription to `blog-articles-batch3.ts` turned the test red with the count reported as 35 and every offending file listed, and restoring the file returned it to 6 passed.

**How the conclusion was reached:**
The inherited note on this test said it called `isIndexable()` and therefore read the eligibility list rather than the built robots directive, and that this was the same class of error as the false positives found earlier the same day. That premise is **false**, and it was worth disproving before editing because acting on it would have been the fourth false positive of the session and the fourth one caused by a check rather than by the site. Reading the helper showed it tests `startsWith("index")` against the directive string, which is exactly the correct test and is the same discipline the earlier false positives were missing. What was genuinely wrong was narrower and different: the bound was loose enough that the source list could grow by 26 entries silently. Both halves of this are worth recording, because the habit that produced the correct outcome is the habit of disproving an inherited claim before implementing it, and the cost of not doing that is a change log full of fixes to things that were never broken.

**Verified:**
The two robots directive forms were enumerated directly from the built output rather than assumed, 498 `noindex` against 85 `index`; the injection test appended a real over-limit string to a real data file and observed the exact expected failure before restoring; `git diff` confirms the injected file was restored byte-identical to HEAD; the full suite passes at 92 files and 883 tests with 3 skipped.

**Recurrence guard:**
A loose upper bound is not a guard, it is a tolerance. Any bound that exists to catch growth must be pinned at the measured value so the next occurrence forces a decision. And an inherited claim about a defect is a hypothesis like any other: it is disproved by reading the code, not confirmed by acting on it.

**Measure after:** 2026-12-05

'''


def main():
    ts = io.open(TS, encoding="utf-8").read()
    if TITLE in ts:
        print("TS entry already present, skipping")
    else:
        i = ts.rfind("\n];\n")
        if i < 0:
            raise SystemExit("could not find the CHANGE_LOG terminator")
        ts = ts[: i + 1] + ENTRY + ts[i + 1 :]
        io.open(TS, "w", encoding="utf-8").write(ts)
        print("TS entry appended")

    md = io.open(MD, encoding="utf-8").read()
    if TITLE in md:
        print("MD section already present, skipping")
    else:
        m = re.search(r"^## 20", md, re.M)
        if not m:
            raise SystemExit("could not find the first entry heading")
        md = md[: m.start()] + MD_SECTION + md[m.start() :]
        io.open(MD, "w", encoding="utf-8").write(md)
        print("MD section inserted at the top")


main()
