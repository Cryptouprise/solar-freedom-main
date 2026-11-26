#!/usr/bin/env python3
"""
Change-log entry for the ADT reviews snippet fix, plus the two false positives
that a correct significance test and a corrected substring check prevented.
Idempotent. Content avoids bare double quotes.
"""
import sys, pathlib

TS = pathlib.Path("shared/changeLog.ts")
MD = pathlib.Path("docs/CHANGE-LOG.md")

T = "The first statistically real CTR defect on the site, found after fourteen that were noise"

if T in TS.read_text(encoding="utf-8"):
    print("already present — nothing written")
    sys.exit(0)

ENTRY = '''  {
    date: "2026-11-26",
    title: "The first statistically real CTR defect on the site, found after fourteen that were noise",
    class: "SEO",
    changed: [
      "client/src/data/blog-articles-batch6.ts — metaTitle and metaDescription for adt-solar-complaints rewritten to lead with the concrete review figures",
      "scripts/fix-1126-adt-reviews-snippet.py — idempotent fixer, scoped to the owning slug",
    ],
    evidence:
      "Measured 26 Nov 2026: /blog/adt-solar-complaints holds `adt solar reviews` on 881 impressions at average position 13.3 with ZERO clicks, the largest single query mass on the page. Applying the site\\'s own CTR-by-position curve, expected clicks at position 13.3 are 3.52, so the probability of zero by chance is 0.0295 — below the 0.05 threshold, and the FIRST statistically real CTR defect found on this site. The fourteen pages examined earlier the same day were all noise, with p(0) between 0.1003 and 0.8420. The served title promised Who Services It Now, which is a service question; the searcher asked for reviews. The page\\'s strongest asset is not its position on anything, it is that it publishes concrete dated review figures — 404 BBB complaints over three years, 29 over twelve months, 75 customer reviews, and no rating because the business is out of business — and separates ADT\\'s BBB file from Sunpro\\'s separate accredited file with 425 complaints and 80 reviews. The new title is 61 rendered characters and the description 152, both inside the 70 and 160 limits, with no ellipsis and ending in sentence punctuation.",
    reasoning:
      "The distinction that mattered here was between a snippet problem and a ranking problem, and the significance test is what separated them. A page at position 13.3 with 881 impressions and no clicks looks like a snippet failure, and the earlier work on this site treated several such pages that way. Most were noise. This one was real, which means the snippet genuinely is losing clicks that the position should be earning, so rewriting it is the correct lever rather than pursuing position that the page already holds. Leading with the numbers rather than with an editorial claim was deliberate: a review searcher wants figures, the figures are already sourced and dated in the body, and a snippet that quotes them is both more useful and more defensible than one that promises an answer. The rating is described as absent rather than quoted, because it is genuinely absent on the profile — the company is out of business and BBB publishes no rating — so no number that could go stale is placed in a snippet.",
    confidence: "measured",
    verifiedBy:
      "pnpm check clean; pnpm build pre-rendered 583 pages; the built page carries a 61-character title and a 152-character description, both measured in dist/public, with the reviews and complaints terms present and no ellipsis; npx vitest run shows 92 files and 883 tests passing with 3 skipped",
    preventsRecurrence:
      "The standing rule is now stated with a number rather than as a judgement: a zero-click page is not a defect unless the significance test returns p(0) below 0.05 against the site\\'s own CTR curve. Fourteen pages were correctly left alone by that test today and one was correctly changed.",
    measureAfter: "2026-12-05",
  },'''

ENTRY_2 = '''  {
    date: "2026-11-26",
    title: "Two candidate defects were false positives created by the checking tools themselves",
    class: "infrastructure",
    changed: [
      "scripts/gsc-exact-page-queries.mjs — added earlier the same day, because the substring / matched every page on the site",
      "no site change — both findings were disproved before anything was edited",
    ],
    evidence:
      "Two scans run on 26 Nov 2026 reported defects that did not exist, and both were disproved by checking the check rather than the site. First: a scan of all 583 built pages reported 29 INDEXABLE pages whose meta description did not end in sentence punctuation, including four cut at exactly 160 characters mid-word (Hol, effectivel, transfe, cancella). The check tested for the substring index inside the robots directive, and noindex contains index, so every noindex page was counted as indexable. Re-run with noindex tested first, all 29 are noindex, and the number of truly indexable pages with an unterminated description is ZERO. Second: comparing shared/index-eligibility.json against the built robots directives reported four slugs listed as indexable that ship noindex — cancel-solar-contract-denver-co-2026, cancel-solar-contract-rescission-rights, goodleap-solar-loan-hidden-dealer-fees-2026 and solar-escalator-clause-what-it-is-how-to-fight. All four are the redirect overlap fixed earlier the same day and recorded in its own change-log entry: each is a 301 source, and the build deliberately ORs the eligibility test with isRedirectedPath so the redirect wins. The list was left intact on purpose, because removing a slug from it drops the page from the build entirely rather than simply de-indexing it.",
    reasoning:
      "Both false positives have the same cause and it is worth naming: the tool reported a substring match as a fact. A robots directive is a token list, and testing whether one string contains another is not the same as testing whether the directive grants indexing. The failure mode is asymmetric and therefore dangerous — it manufactures work rather than missing it, and manufactured work looks like diligence. The cost is not only wasted edits, it is that the change log fills with entries describing fixes to things that were never broken, which is exactly what the owner asked to avoid when he said never to repeat the same mistakes. The discipline applied was to open one reported page and read it before touching anything, which is what exposed both.",
    confidence: "measured",
    verifiedBy:
      "A corrected scan that tests noindex before index reports 0 truly indexable pages with an unterminated description out of 583 built pages; the four eligibility mismatches were matched against the existing redirect change-log entry and against scripts/generate-sitemap.mjs line 194, which already excludes redirected slugs",
    preventsRecurrence:
      "A substring test on a token list must never be treated as a fact about the token list. Where a directive is checked, noindex is tested first. The wider rule, now used three times today, is that a scan result is a hypothesis until one instance of it has been opened and read.",
    measureAfter: "2026-12-05",
  },'''

ts = TS.read_text(encoding="utf-8")
idx = ts.rfind("\n];")
assert idx > 0
ts = ts[:idx] + "\n" + ENTRY + "\n" + ENTRY_2 + ts[idx:]
TS.write_text(ts, encoding="utf-8")
print("shared/changeLog.ts updated")

BLOCK = """## 2026-11-26 — Two candidate defects were false positives created by the checking tools themselves

**Class:** infrastructure

**Changed:** No site change. Both findings were disproved before anything was edited.

**Why:** Both false positives have the same cause, and it is worth naming: the tool reported a **substring match as a fact**. A robots directive is a token list, and testing whether one string contains another is not the same as testing whether the directive grants indexing. The failure mode is asymmetric and therefore dangerous — it **manufactures work rather than missing it**, and manufactured work looks like diligence. The cost is not only wasted edits; it is that the change log fills with entries describing fixes to things that were never broken.

**How the conclusion was reached:** A scan reported 29 *indexable* pages with unterminated descriptions, including four cut at exactly 160 chars mid-word ("Hol", "effectivel", "transfe", "cancella"). The check tested for the substring `index` inside the robots directive — and **`noindex` contains `index`**, so every noindex page counted as indexable. Re-run testing `noindex` first: **all 29 are noindex, and the number of truly indexable pages with an unterminated description is ZERO.** Separately, four slugs listed as indexable that ship `noindex` turned out to be the redirect overlap fixed earlier the same day — each is a 301 source, and the build deliberately ORs the eligibility test with `isRedirectedPath` so the redirect wins. The list was left intact on purpose: removing a slug from it drops the page from the build entirely rather than simply de-indexing it.

**Verified:** Corrected scan reports 0 truly indexable pages with an unterminated description out of 583 built pages. The four eligibility mismatches were matched against the existing redirect change-log entry and against `scripts/generate-sitemap.mjs:194`, which already excludes redirected slugs.

**Recurrence guard:** A substring test on a token list must never be treated as a fact about the token list. Where a directive is checked, `noindex` is tested first. The wider rule, now used three times today: **a scan result is a hypothesis until one instance of it has been opened and read.**

**Measure after:** 2026-12-05

## 2026-11-26 — The first statistically real CTR defect on the site, found after fourteen that were noise

**Class:** SEO

**Changed:** `client/src/data/blog-articles-batch6.ts` — `metaTitle` and `metaDescription` for `adt-solar-complaints` rewritten to lead with the concrete review figures. `scripts/fix-1126-adt-reviews-snippet.py`.

**Why:** The distinction that mattered was between a snippet problem and a ranking problem, and the **significance test is what separated them**. A page at position 13.3 with 881 impressions and no clicks looks like a snippet failure, and earlier work on this site treated several such pages that way. Most were noise. This one was real, so the snippet genuinely is losing clicks the position should be earning — rewriting it is the correct lever rather than chasing position the page already holds. Leading with the numbers rather than an editorial claim was deliberate: a review searcher wants figures, the figures are already sourced and dated in the body, and a snippet quoting them is both more useful and more defensible than one promising an answer. The rating is described as **absent** rather than quoted, because it genuinely is absent — the company is out of business and BBB publishes no rating — so no number that could go stale is placed in a snippet.

**How the conclusion was reached:** `adt solar reviews` holds **881 impressions at average position 13.3 with ZERO clicks**, the largest single query mass on the page. Expected clicks at that position on the site's own CTR curve are **3.52**, so p(0) = **0.0295** — below 0.05, and the **first statistically real CTR defect found on this site**. The fourteen pages examined earlier the same day were all noise, p(0) between 0.1003 and 0.8420. The served title promised "Who Services It Now", a *service* question, while the searcher asked for *reviews*. The page's strongest asset is that it publishes concrete dated figures — 404 BBB complaints over three years, 29 over twelve months, 75 customer reviews, no rating because the business is out of business — and separates ADT's BBB file from Sunpro's separate accredited file (425 complaints, 80 reviews).

**Verified:** `pnpm check` clean; `pnpm build` pre-rendered 583 pages; the built page carries a **61-character title and a 152-character description**, both measured in `dist/public`, with the terms present, no ellipsis, and ending in sentence punctuation. 92 test files, 883 tests passing.

**Recurrence guard:** The standing rule is now stated **with a number** rather than as a judgement: a zero-click page is not a defect unless the significance test returns **p(0) < 0.05** against the site's own CTR curve. Fourteen pages were correctly left alone by that test today and one was correctly changed.

**Measure after:** 2026-12-05

"""

md = MD.read_text(encoding="utf-8")
first = md.find("\n## ")
assert first > 0
md = md[:first + 1] + BLOCK + md[first + 1:]
MD.write_text(md, encoding="utf-8")
print("docs/CHANGE-LOG.md updated")
