#!/usr/bin/env python3
"""Insert the first-party-claims change-log entry into both mirrors. Idempotent."""
import io
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TS = os.path.join(ROOT, "shared", "changeLog.ts")
MD = os.path.join(ROOT, "docs", "CHANGE-LOG.md")

TITLE = "Six indexable pages promised a first-party result, and one called us a law firm"

TS_ENTRY = '''  {
    date: "2026-11-26",
    title: "Six indexable pages promised a first-party result, and one called us a law firm",
    class: "accuracy",
    changed: [
      "client/src/data/blog-articles-batch5.ts: the Atlanta metaDescription dropped \\"We've helped 50+ GA homeowners save thousands\\" and the Boston metaDescription dropped \\"Our firm helped 200+ homeowners cancel\\"; both now name the statute and what decides a claim",
      "client/src/data/blog-articles-batch3.ts: the Bakersfield metaDescription dropped \\"cancel your contract and save thousands\\"",
      "client/src/data/blog-articles-batch4.ts: the payment-shock metaDescription dropped \\"legal options to save thousands\\"",
      "client/src/data/blog-articles-batch6.ts: the military-families metaDescription dropped \\"save thousands\\" and its \\"Urgent help available!\\" urgency, and a body sentence promising \\"save you thousands of dollars\\" was replaced with the notice-window reason to act now",
      "client/src/data/blog-articles-batch10.ts, batch6.ts, batch15.ts, batch19.ts: five descriptions shortened so they survive the 160-character fitter intact instead of being cut mid-phrase",
      "server/firstPartyClaims.test.ts added, 6 tests",
    ],
    evidence:
      "Found 26 Nov 2026 by scanning the BUILT output rather than the source, which is why it had survived every earlier content review. Four INDEXABLE pages carried a first-party result claim in their meta description and the Atlanta page carried it in body prose too: \\"We've helped 50+ GA homeowners save thousands\\" (Atlanta), \\"Our firm helped 200+ homeowners cancel\\" (Boston), \\"save thousands\\" (Bakersfield, payment shock), \\"save thousands\\" plus \\"Urgent help available!\\" (military families). No source for any figure exists anywhere in the repository. The Boston line is the worst of the six because it says \\"Our firm\\" on a site whose own /how-it-works page states in its first sentence \\"Solar Freedom is not a law firm\\", so the site contradicted itself on the two pages a skeptical reader is most likely to compare. The same scan found 35 pages whose description did not end in sentence punctuation, 5 of them indexable; the source strings were complete sentences that the 160-character fitSnippet limit cut at a word boundary, leaving snippets like \\"...closing records\\" with no object. Separately recorded: /blog/cancel-solar-contract-atlanta-ga ships robots=index in the built output while its slug is absent from INDEXED_BLOG_SLUGS in shared/index-eligibility.json, a discrepancy this test now pins in place rather than silently resolving.",
    reasoning:
      "Two different failure modes with the same cause, which is that both were checked in the source and never in the output. A first-party result claim is the single most damaging thing this site can publish, because it is checkable and it is false: an attorney or a sharp homeowner can ask for the fifty Georgia files, and there are none. It also directly contradicts the trust position the rest of the site is built on, which is that we promise no outcome. The truncation is the cheaper defect but it costs the same click: a description that stops mid-thought reads as unfinished and gives the searcher no reason to prefer it over the nine other results. Neither fix needed a new capability, only looking at what the site actually served. The replacements keep each snippet's job, which is to name the legal mechanism and the next step, and drop the promise.",
    confidence: "measured",
    verifiedBy:
      "npx vitest run server/firstPartyClaims.test.ts: 6 tests passed. The test fails the build if any article meta field matches a first-party claim pattern, if any INDEXABLE built page serves one, if any INDEXABLE page says \\"our firm\\" or \\"our law firm\\", if any indexable description does not end in sentence punctuation, or if the Atlanta index discrepancy changes in either direction without the record being updated. Grep of client/src/data on 26 Nov 2026 returns 0 occurrences of the four claim strings. pnpm check clean; npx vitest run: 87 files, 838 tests passed, 3 skipped; trust governance audit passed; pnpm build pre-rendered 583 pages.",
    preventsRecurrence:
      "server/firstPartyClaims.test.ts now scans the BUILT output for first-party claim patterns and for descriptions that do not end in a sentence, so the check runs against what Google actually receives rather than against the source. This is the second defect class found only by reading the built output, after the 74 pages of ellipsis-terminated snippets, which is why the standing practice is now to scan dist/public after every build rather than trusting the source.",
    measureAfter: "2026-12-05",
  },
'''

MD_ENTRY = '''## 2026-11-26 — Six indexable pages promised a first-party result, and one called us a law firm
**Class:** accuracy
**Changed:**
- `client/src/data/blog-articles-batch5.ts`: the Atlanta metaDescription dropped "We've helped 50+ GA homeowners save thousands" and the Boston metaDescription dropped "Our firm helped 200+ homeowners cancel"; both now name the statute and what decides a claim.
- `client/src/data/blog-articles-batch3.ts`: the Bakersfield metaDescription dropped "cancel your contract and save thousands".
- `client/src/data/blog-articles-batch4.ts`: the payment-shock metaDescription dropped "legal options to save thousands".
- `client/src/data/blog-articles-batch6.ts`: the military-families metaDescription dropped "save thousands" and its "Urgent help available!" urgency, and a body sentence promising "save you thousands of dollars" was replaced with the notice-window reason to act now.
- `client/src/data/blog-articles-batch10.ts`, `batch6.ts`, `batch15.ts`, `batch19.ts`: five descriptions shortened so they survive the 160-character fitter intact instead of being cut mid-phrase.
- `server/firstPartyClaims.test.ts` added, 6 tests.
**Why:** Found 26 Nov 2026 by scanning the BUILT output rather than the source, which is why it had survived every earlier content review. Four INDEXABLE pages carried a first-party result claim in their meta description and the Atlanta page carried it in body prose too: "We've helped 50+ GA homeowners save thousands" (Atlanta), "Our firm helped 200+ homeowners cancel" (Boston), "save thousands" (Bakersfield, payment shock), "save thousands" plus "Urgent help available!" (military families). No source for any figure exists anywhere in the repository. The Boston line is the worst of the six because it says "Our firm" on a site whose own `/how-it-works` page states in its first sentence "Solar Freedom is not a law firm", so the site contradicted itself on the two pages a skeptical reader is most likely to compare. The same scan found 35 pages whose description did not end in sentence punctuation, 5 of them indexable; the source strings were complete sentences that the 160-character `fitSnippet` limit cut at a word boundary, leaving snippets like "...closing records" with no object. Separately recorded: `/blog/cancel-solar-contract-atlanta-ga` ships `robots=index` in the built output while its slug is absent from `INDEXED_BLOG_SLUGS` in `shared/index-eligibility.json`, a discrepancy this test now pins in place rather than silently resolving.
**Reasoning:** Two different failure modes with the same cause, which is that both were checked in the source and never in the output. A first-party result claim is the single most damaging thing this site can publish, because it is checkable and it is false: an attorney or a sharp homeowner can ask for the fifty Georgia files, and there are none. It also directly contradicts the trust position the rest of the site is built on, which is that we promise no outcome. The truncation is the cheaper defect but it costs the same click: a description that stops mid-thought reads as unfinished and gives the searcher no reason to prefer it over the nine other results. Neither fix needed a new capability, only looking at what the site actually served. The replacements keep each snippet's job, which is to name the legal mechanism and the next step, and drop the promise.
**Verified:** `npx vitest run server/firstPartyClaims.test.ts`: 6 tests passed. The test fails the build if any article meta field matches a first-party claim pattern, if any INDEXABLE built page serves one, if any INDEXABLE page says "our firm" or "our law firm", if any indexable description does not end in sentence punctuation, or if the Atlanta index discrepancy changes in either direction without the record being updated. Grep of `client/src/data` on 26 Nov 2026 returns 0 occurrences of the four claim strings. `pnpm check` clean; `npx vitest run`: 87 files, 838 tests passed, 3 skipped; trust governance audit passed; `pnpm build` pre-rendered 583 pages.
**Recurrence guard:** `server/firstPartyClaims.test.ts` now scans the BUILT output for first-party claim patterns and for descriptions that do not end in a sentence, so the check runs against what Google actually receives rather than against the source. This is the second defect class found only by reading the built output, after the 74 pages of ellipsis-terminated snippets, which is why the standing practice is now to scan `dist/public` after every build rather than trusting the source.
**Measure after:** 2026-12-05
'''


def main() -> int:
    changed = []

    ts = io.open(TS, encoding="utf-8").read()
    if TITLE in ts:
        print("TS: already present")
    else:
        anchor = "\n];\n"
        if ts.count(anchor) != 1:
            print("TS: anchor count %d, refusing" % ts.count(anchor))
            return 1
        io.open(TS, "w", encoding="utf-8").write(ts.replace(anchor, "\n" + TS_ENTRY + "];\n"))
        changed.append("changeLog.ts")

    md = io.open(MD, encoding="utf-8").read()
    if "## 2026-11-26 \u2014 " + TITLE in md:
        print("MD: already present")
    else:
        lines = md.split("\n")
        idx = next((i for i, l in enumerate(lines) if l.startswith("## ")), None)
        if idx is None:
            print("MD: no heading, refusing")
            return 1
        lines[idx:idx] = MD_ENTRY.rstrip("\n").split("\n")
        io.open(MD, "w", encoding="utf-8").write("\n".join(lines))
        changed.append("CHANGE-LOG.md")

    print("inserted into:", ", ".join(changed) if changed else "nothing")
    return 0


if __name__ == "__main__":
    sys.exit(main())
