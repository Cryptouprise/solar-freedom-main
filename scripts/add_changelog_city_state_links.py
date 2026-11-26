#!/usr/bin/env python3
"""Insert the city state-law link change-log entry into both mirrors. Idempotent."""
import io
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TS = os.path.join(ROOT, "shared", "changeLog.ts")
MD = os.path.join(ROOT, "docs", "CHANGE-LOG.md")

TITLE = "Every city page now routes state-level questions to the state law page instead of competing with it"

TS_ENTRY = '''  {
    date: "2026-11-26",
    title:
      "Every city page now routes state-level questions to the state law page instead of competing with it",
    class: "SEO",
    changed: [
      "`scripts/prerender.assembled.mjs` gains `STATE_LAW_SLUG_BY_NAME` and `registerStateLawSlugs()`, populated from the state entries during `loadData()`, so the city renderer knows which state-law pages actually exist before it writes a link.",
      "`buildCityUniqueContent` now emits a real anchor in the state-law paragraph (\\"the <State> solar contract law resource\\") and adds a routing sentence: \\"State-level rules, deadlines and citations for <State> are collected on the <State> solar contract law resource.\\"",
      "`shared/priority-city-render.mjs` gains `getStateLawPath()` and the same routing sentence inside the `city-local-resources` section, which the 21 priority city guides render through a separate code path that had no state link at all.",
      "`client/src/components/PriorityCityGuide.tsx` renders the same sentence, importing `getStateLawPath` from the shared module rather than reimplementing the state map, so the shell and the hydrated page cannot drift apart.",
    ],
    evidence:
      "Measured 26 Nov 2026. Before the change, the state-law paragraph on every city page read \\"review the dedicated <State> law resource\\" with NO anchor, so the city page was competing for state-level queries instead of routing to the page that answers them. `/cancel-solar-contract/san-francisco-ca` earned 46 impressions in the recent 30-day window at average position 35.1 with ZERO clicks, while the California state page held its own state-level queries at position 10.4. The 21 priority city guides were worse: a JSON scan found ZERO references to `/solar-contract-laws/` anywhere in `shared/priority-city-content.json`, so Phoenix, Houston, Dallas, Los Angeles, San Diego and San Antonio — the six highest-value city pages — had no route to their own state page at all. After the change: 71 templated city pages carry a correct state-law link, 0 mismatched, 225 correctly omitted because their state has no published page, 0 broken targets; and all 21 priority guides verified, 6 with the correct link and 15 correctly omitted.",
    reasoning:
      "The San Francisco numbers are the whole argument. A page at position 35.1 with zero clicks is not losing to better content, it is losing to a page on the same site that already answers the query at position 10.4, and Google has no way to know which one the searcher wants when the weaker page never points at the stronger one. The state-law page is the canonical answer for state-level rules; the city page's job is local relevance plus a route out. Leaving the sentence unlinked made the city page a competitor for a query it is not the best answer for, which splits the site's own authority and wastes the local page's impressions. The priority-city gap was the same defect in a second code path, which is why it survived the templated fix: the guides render through `shared/priority-city-render.mjs` rather than `buildCityUniqueContent`, so a fix in one place does nothing for the other. Both were fixed together and the state map is now a single shared export so a third renderer cannot reintroduce the divergence. Only published states are linked, because a link to an unbuilt or `noindex` state page is worse than no link: it spends crawl budget and passes authority to a page Google is being told to ignore.",
    confidence: "verified",
    verifiedBy:
      "python3 on the 583-page build confirmed 71 city pages with a correct state-law link, 0 mismatched, 0 broken targets, 225 correctly omitted. node /tmp/verify-statelaw.mjs confirmed all 21 priority guides: 6 correct links, 15 correctly omitted, 0 problems, with the existing `city-local-resources` external source links, the `#city-form` CTA anchor and the `noopener noreferrer` attributes all still present. `pnpm check` clean and the production build pre-rendered 583 pages.",
    preventsRecurrence:
      "The state-law slug map now lives in exactly one place, `STATE_LAW_SLUG_BY_NAME` for the templated renderer and `getStateLawPath()` in `shared/priority-city-render.mjs` for the priority guides, and the client imports the shared helper instead of copying it. The recurring lesson is recorded here: this site renders city pages through TWO independent code paths, so any fix to city-page output must be checked against both.",
    measureAfter: "2026-12-05",
  },
'''

MD_ENTRY = '''## 2026-11-26 — Every city page now routes state-level questions to the state law page instead of competing with it
**Class:** SEO
**Changed:**
- `scripts/prerender.assembled.mjs` gains `STATE_LAW_SLUG_BY_NAME` and `registerStateLawSlugs()`, populated from the state entries during `loadData()`, so the city renderer knows which state-law pages actually exist before it writes a link.
- `buildCityUniqueContent` now emits a real anchor in the state-law paragraph ("the <State> solar contract law resource") and adds a routing sentence: "State-level rules, deadlines and citations for <State> are collected on the <State> solar contract law resource."
- `shared/priority-city-render.mjs` gains `getStateLawPath()` and the same routing sentence inside the `city-local-resources` section, which the 21 priority city guides render through a separate code path that had no state link at all.
- `client/src/components/PriorityCityGuide.tsx` renders the same sentence, importing `getStateLawPath` from the shared module rather than reimplementing the state map, so the shell and the hydrated page cannot drift apart.
**Why:** Measured 26 Nov 2026. Before the change, the state-law paragraph on every city page read "review the dedicated <State> law resource" with NO anchor, so the city page was competing for state-level queries instead of routing to the page that answers them. `/cancel-solar-contract/san-francisco-ca` earned 46 impressions in the recent 30-day window at average position 35.1 with ZERO clicks, while the California state page held its own state-level queries at position 10.4. The 21 priority city guides were worse: a JSON scan found ZERO references to `/solar-contract-laws/` anywhere in `shared/priority-city-content.json`, so Phoenix, Houston, Dallas, Los Angeles, San Diego and San Antonio — the six highest-value city pages — had no route to their own state page at all. After the change: 71 templated city pages carry a correct state-law link, 0 mismatched, 225 correctly omitted because their state has no published page, 0 broken targets; and all 21 priority guides verified, 6 with the correct link and 15 correctly omitted.
**Verified:** python3 on the 583-page build confirmed 71 city pages with a correct state-law link, 0 mismatched, 0 broken targets, 225 correctly omitted. node /tmp/verify-statelaw.mjs confirmed all 21 priority guides: 6 correct links, 15 correctly omitted, 0 problems, with the existing `city-local-resources` external source links, the `#city-form` CTA anchor and the `noopener noreferrer` attributes all still present. `pnpm check` clean and the production build pre-rendered 583 pages.
**Recurrence guard:** The state-law slug map now lives in exactly one place, `STATE_LAW_SLUG_BY_NAME` for the templated renderer and `getStateLawPath()` in `shared/priority-city-render.mjs` for the priority guides, and the client imports the shared helper instead of copying it. The recurring lesson is recorded here: this site renders city pages through TWO independent code paths, so any fix to city-page output must be checked against both.
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
