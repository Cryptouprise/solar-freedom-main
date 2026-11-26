#!/usr/bin/env python3
"""
Add two change-log entries:
  1. the duplicate <h1> on the homepage (defect)
  2. the new window-comparison scripts and the baseline they measured (infrastructure)

Idempotent: refuses to write if either title is already present.
Content values deliberately avoid bare double quotes — they break the TS string.
"""
import sys, pathlib

TS = pathlib.Path("shared/changeLog.ts")
MD = pathlib.Path("docs/CHANGE-LOG.md")

T1 = "The homepage served two h1 elements, one of them hidden"
T2 = "Added window-comparison reporting, which showed the site is down 10 percent and named the four pages responsible"

if T1 in TS.read_text(encoding="utf-8") or T2 in TS.read_text(encoding="utf-8"):
    print("already present — nothing written")
    sys.exit(0)

ENTRY_1 = '''  {
    date: "2026-11-26",
    title: "The homepage served two h1 elements, one of them hidden",
    class: "defect",
    changed: [
      "client/index.html — the screen-reader-only <h1> holding the homepage title is now a <p> with the same text and the same visually-hidden styling",
      "server/headingStructure.test.ts — new guard, 5 tests, reads the BUILT output rather than the source",
    ],
    evidence:
      "Measured 26 Nov 2026 on the built output: dist/public/index.html contained TWO <h1> elements — one visible reading Cancel Your Solar Contract, and one hidden with clip:rect(0,0,0,0) reading Cancel Your Solar Contract | Solar Freedom. A scan of all 584 built pages found this was the only page on the site with more than one <h1>, and that the only page with no <h1> at all is Google\\'s own site-verification file, which is correct and is excluded from the guard. The cause is two files that are each reasonable alone: client/index.html line 99 carried the hidden <h1> for crawlers that do not execute JavaScript, and scripts/prerender.assembled.mjs line 1648 injects a real <h1> into every built page. Neither file is wrong on its own, so neither was ever going to be reviewed as the cause. After the fix the homepage carries exactly one <h1> and 583 of 584 built pages carry exactly one, the exception being the verification file.",
    reasoning:
      "Two <h1> elements are not penalised in themselves — HTML5 allows sectioning elements to have their own. The problem is narrower and worse: the hidden heading duplicated the visible one almost word for word. A duplicate heading that is deliberately hidden from users is the pattern search engines treat as manipulation, and it was placed there for crawlers that do not run JavaScript, which is exactly the audience most likely to read it and least likely to see the visible one. The risk is not that a duplicate is bad, it is that the only reader who saw it also saw it hidden. The fix keeps the semantic text, because the dev server and any route that is not pre-rendered still benefit from it, and demotes it to a <p> so the visible <h1> is unambiguous. Demoting rather than deleting was deliberate: deleting would have removed the only heading text from the un-pre-rendered homepage, trading one defect for another.",
    confidence: "measured",
    verifiedBy:
      "npx vitest run server/headingStructure.test.ts — the guard was first run against the UNFIXED build and failed on / with the exact two headings, then passed after the rebuild, so it has been seen to fail and is therefore a real guard; pnpm check clean; pnpm build pre-rendered 583 pages; a direct scan confirms the homepage has 1 <h1> and 583 of 584 pages have exactly 1",
    preventsRecurrence:
      "The guard reads the built output, so it catches any future interaction between the template and the pre-renderer regardless of which file changes. A separate assertion reads client/index.html directly and fails if any <h1> element reappears there, naming the cause rather than only reporting the symptom.",
    measureAfter: "2026-12-05",
  },'''

ENTRY_2 = '''  {
    date: "2026-11-26",
    title: "Added window-comparison reporting, which showed the site is down 10 percent and named the four pages responsible",
    class: "infrastructure",
    changed: [
      "scripts/gsc-site-trend.mjs — new: site-wide daily impressions, clicks, CTR and average position, recent window against prior window of equal length",
      "scripts/gsc-page-delta.mjs — new: per-page impression and click change between the same two windows, ranked by absolute change",
      "scripts/gsc-query-delta.mjs — new: per-query change, classified into demand loss, ranking loss and click loss",
      "scripts/gsc-exact-page-queries.mjs — new: exact-URL query detail, because the existing script matched on substring and the substring / matched every page on the site",
    ],
    evidence:
      "Measured 26 Nov 2026, recent window 25 Oct to 23 Nov against prior window 25 Sep to 24 Oct, both 30 days, Search Console lag of 3 days allowed for. Impressions 15,072 against 16,821, down 10.4 percent. Clicks 100 against 178, down 43.8 percent. CTR 0.66 percent against 1.06 percent. Average position 12.6 against 10.1. Clicks fell about four times faster than impressions, which is not explainable by a smaller market and is the single most important fact in this entry. Per-page attribution: 14 pages lost 3,216 impressions while 31 pages gained 2,003, a net of minus 1,213. Four blog pages account for 2,495 of the 3,216 lost, which is 78 percent: goodleap-solar-loan-cancellation-hidden-fees-2026 minus 985, blue-raven-solar-complaints minus 620, sunrun-solar-contract-cancellation-2026 minus 525, adt-solar-complaints minus 365. Query-level classification of the 21 queries with at least 20 prior impressions: 14 are demand loss where position held or improved while impressions fell, totalling minus 325 impressions, and these include how to cancel sunrun contract at 15.6 to 16.0 and adt solar customer service at 10.5 to 10.9. Another 14 are ranking loss totalling minus 512, dominated by blue raven solar reviews at 233 to 82 impressions and position 13.9 to 16.0, and adt solar reviews at 344 to 229 and position 11.0 to 13.5. Exactly one query is a click loss at stable position. The largest single gain on the site is the hub /blog, up 738 impressions from 942 to 1,680, which is the routing table added earlier the same day.",
    reasoning:
      "The owner asked, repeatedly and in these words, whether rankings and impressions are going up, and no script in the repository could answer it — every existing script was per-page, so a page-level answer was being given to a site-level question. Before acting on any of the four declining pages it was necessary to know WHY each fell, because the three possible causes need opposite responses and look identical at page level. If demand fell while position held, the market shrank and rewriting the page accomplishes nothing. If position slipped while volume held, the page needs work. If position and impressions held while clicks fell, the loss is in the result page rather than on the page, most likely an AI Overview or additional ads above us, and no amount of editing recovers it. The classification shows the honest answer is mixed, and it is recorded that way rather than as a single story. One finding is worth stating plainly because it is uncomfortable: a 10 percent impression decline and a 43 percent click decline on a site whose pages improved in position on 51 of 67 measured queries means the loss is concentrated in a handful of pages losing visibility on their most valuable commercial terms, not spread evenly, and that is a fixable problem rather than a trend.",
    confidence: "measured",
    verifiedBy:
      "node scripts/gsc-site-trend.mjs --days 30 --compare 30; node scripts/gsc-page-delta.mjs --days 30 --compare 30 --min 50; node scripts/gsc-query-delta.mjs --days 30 --compare 30 --min 20; all three read Search Console directly and write nothing; the per-page losses reconcile against the site total (3,216 lost minus 2,003 gained equals the 1,213 net shortfall)",
    preventsRecurrence:
      "A site-level question can no longer be answered with a page-level tool, and a declining page can no longer be rewritten before its cause is classified. Any future claim about rankings or traffic must cite a window comparison with both dates, because a single-window figure cannot distinguish a trend from noise.",
    measureAfter: "2026-12-05",
  },'''

ts = TS.read_text(encoding="utf-8")
anchor = "\n];"
idx = ts.rfind(anchor)
assert idx > 0, "could not find the closing anchor in shared/changeLog.ts"
ts = ts[:idx] + "\n" + ENTRY_1 + "\n" + ENTRY_2 + ts[idx:]
TS.write_text(ts, encoding="utf-8")
print("shared/changeLog.ts updated")

md = MD.read_text(encoding="utf-8")

BLOCK = """## 2026-11-26 — Added window-comparison reporting, which showed the site is down 10 percent and named the four pages responsible

**Class:** infrastructure

**Changed:** `scripts/gsc-site-trend.mjs`, `scripts/gsc-page-delta.mjs`, `scripts/gsc-query-delta.mjs`, `scripts/gsc-exact-page-queries.mjs` — all new.

**Why:** The owner has asked repeatedly whether rankings and impressions are going up. No script in the repository could answer it, because every existing script was per-page. A page-level tool was being used to answer a site-level question.

**How the conclusion was reached:** Recent window 25 Oct to 23 Nov against prior window 25 Sep to 24 Oct, both 30 days. Impressions 15,072 against 16,821, down 10.4%. Clicks 100 against 178, down 43.8%. CTR 0.66% against 1.06%. Clicks fell about four times faster than impressions — the most important fact here, because a smaller market cannot explain it. 14 pages lost 3,216 impressions; 31 gained 2,003. Four blog pages account for 78% of the loss. Query-level classification shows 14 demand losses (position held, volume fell — rewriting would achieve nothing), 14 ranking losses totalling -512, and exactly one click loss at stable position. The largest gain on the site is `/blog`, up 738 impressions, which is the routing table added earlier the same day.

**Verified:** All three scripts run against Search Console directly and write nothing. The per-page losses reconcile against the site total: 3,216 lost minus 2,003 gained equals the 1,213 net shortfall.

**Recurrence guard:** A site-level question can no longer be answered with a page-level tool, and a declining page can no longer be rewritten before its cause is classified. Any future claim about rankings or traffic must cite a window comparison with both dates.

**Measure after:** 2026-12-05

## 2026-11-26 — The homepage served two h1 elements, one of them hidden

**Class:** defect

**Changed:** `client/index.html` — the screen-reader-only `<h1>` is now a `<p>` with the same text and styling. `server/headingStructure.test.ts` — new guard, 5 tests, reads the built output.

**Why:** Two `<h1>` elements are not penalised in themselves. The problem is narrower: the hidden heading duplicated the visible one almost word for word. A duplicate heading deliberately hidden from users is the pattern search engines treat as manipulation, and it was placed there for crawlers that do not run JavaScript — exactly the audience most likely to read it and least likely to see the visible one.

**How the conclusion was reached:** Measured on the built output: `dist/public/index.html` contained two `<h1>` elements, one visible reading "Cancel Your Solar Contract" and one hidden with `clip:rect(0,0,0,0)` reading "Cancel Your Solar Contract | Solar Freedom". A scan of all 584 built pages found this was the only page with more than one `<h1>`, and that the only page with none is Google's site-verification file, which is correct. The cause is two files each reasonable alone: `client/index.html` line 99 carried the hidden heading, and `scripts/prerender.assembled.mjs` line 1648 injects a real `<h1>` into every built page. Neither file is wrong on its own, so neither would ever have been reviewed as the cause. Demoting rather than deleting was deliberate — deleting would have removed the only heading text from the un-pre-rendered homepage.

**Verified:** The guard was first run against the **unfixed** build and failed on `/` with the exact two headings, then passed after the rebuild, so it has been seen to fail. `pnpm check` clean; `pnpm build` pre-rendered 583 pages; the homepage now has 1 `<h1>` and 583 of 584 pages have exactly 1.

**Recurrence guard:** The guard reads the built output, so it catches any future interaction between the template and the pre-renderer regardless of which file changes. A separate assertion reads `client/index.html` directly and fails if any `<h1>` reappears there, naming the cause rather than only the symptom.

**Measure after:** 2026-12-05

"""

# newest first
first = md.find("\n## ")
assert first > 0, "could not find the first heading in docs/CHANGE-LOG.md"
md = md[:first + 1] + BLOCK + md[first + 1:]
MD.write_text(md, encoding="utf-8")
print("docs/CHANGE-LOG.md updated")
