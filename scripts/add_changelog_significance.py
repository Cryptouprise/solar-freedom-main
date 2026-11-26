#!/usr/bin/env python3
"""Insert the CTR-significance change-log entry into both mirrors. Idempotent."""
import io
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TS = os.path.join(ROOT, "shared", "changeLog.ts")
MD = os.path.join(ROOT, "docs", "CHANGE-LOG.md")

TITLE = "None of the fourteen zero-click near-winners was a real defect, and the noindex suppression was already working"

TS_ENTRY = '''  {
    date: "2026-11-26",
    title: "None of the fourteen zero-click near-winners was a real defect, and the noindex suppression was already working",
    class: "infrastructure",
    changed: [
      "scripts/ctr-significance.py added: computes expected clicks per page from the site's own CTR-by-position curve and reports a one-tailed Poisson probability, so a zero-click page is only treated as a defect when the shortfall cannot be explained by volume",
      "scripts/gsc-page-trend.mjs added: compares a page across two Search Console windows so a cached impression count can be separated from current demand before any index-status change is made",
      "No content or index-status change was made. This entry records two negative findings and the tooling that produced them.",
    ],
    evidence:
      "Two investigations on 26 Nov 2026, both of which ended in NOT making a change. (1) Eight near-winner URLs ship noindex yet appeared to be ranking, including four in the top ten: goodleap-solar-loan-problems at position 8.6 with 214 impressions, solar-contract-cancellation-cost at 7.7 with 94, solar-lien-on-house-removal-guide at 9.0 with 54, and solar-escalator-clause-what-it-is-how-to-fight at 8.7 with 57. Direct requests confirmed five of the eight serve HTTP 200 with a noindex directive and are absent from the sitemap, which is the strongest suppression signal the site can send. scripts/gsc-page-trend.mjs then compared the recent 14 days against the preceding 45: all five returned ZERO impressions in the recent window against 28, 38, 8 and 15 in the older one, and SunPower zero in both. The suppression is working exactly as designed and the cached impressions are historical. (2) Fourteen near-winner pages had zero clicks at positions 6.2 to 18.1, which reads as fourteen CTR defects in a flat table. scripts/ctr-significance.py computed expected clicks from the site's own CTR-by-position curve: expected values were 0.2 to 2.3 clicks, and the probability of observing zero purely by chance ranged from 0.10 to 0.84. ZERO of the fourteen was statistically real.",
    reasoning:
      "Both findings are the same mistake in different clothes, which is treating a table row as a diagnosis. The index-status case nearly produced a change that would have promoted five pages into the index on the strength of impressions that had already stopped arriving — the suppression was correct, the pages are thin (317 and 311 words for the two company hubs), and Dividend Finance has zero recent query demand site-wide while the lien topic is already covered by the indexable /solar-lien-removal page. The CTR case would have produced fourteen rewrites to chase roughly one expected click each, and worse, it would have taught the wrong lesson from random variation. The discipline this establishes: before treating a page as a defect, check whether its demand is current, and check whether its shortfall is larger than chance. The high-volume pages remain the real opportunities and those were already worked today — GoodLeap at 10,365 impressions, Sunrun at 9,343 and Blue Raven at 4,488 are 81 percent of the page-1 near-winner impression mass, and all three were fixed earlier in the same session.",
    confidence: "measured",
    verifiedBy:
      "node scripts/gsc-page-trend.mjs --recent 14 --older 45 on the five suppressed pages returned 0 impressions in every recent window. curl against all eight live URLs confirmed five HTTP 200 with noindex and three HTTP 301. python3 scripts/ctr-significance.py over the 45-item near-winners list reported 14 zero-click pages, 0 statistically real, 14 noise, with p(0) from 0.1003 to 0.8420.",
    preventsRecurrence:
      "scripts/ctr-significance.py is now the required first pass over any near-winners list: a zero-click page is not a defect unless p(0) is below 0.05, so low-volume pages can no longer consume a change. scripts/gsc-page-trend.mjs is now required before any index-status change, because the near-winners dataset spans 1 Sep to 22 Nov and an impression count inside it says nothing about whether the demand is still there. Both are read-only and both are cheap enough to run before every batch.",
    measureAfter: "2026-12-05",
  },
'''

MD_ENTRY = '''## 2026-11-26 — None of the fourteen zero-click near-winners was a real defect, and the noindex suppression was already working
**Class:** infrastructure
**Changed:**
- `scripts/ctr-significance.py` added: computes expected clicks per page from the site's own CTR-by-position curve and reports a one-tailed Poisson probability, so a zero-click page is only treated as a defect when the shortfall cannot be explained by volume.
- `scripts/gsc-page-trend.mjs` added: compares a page across two Search Console windows so a cached impression count can be separated from current demand before any index-status change is made.
- No content or index-status change was made. This entry records two negative findings and the tooling that produced them.
**Why:** Two investigations on 26 Nov 2026, both of which ended in NOT making a change. (1) Eight near-winner URLs ship `noindex` yet appeared to be ranking, including four in the top ten: goodleap-solar-loan-problems at position 8.6 with 214 impressions, solar-contract-cancellation-cost at 7.7 with 94, solar-lien-on-house-removal-guide at 9.0 with 54, and solar-escalator-clause-what-it-is-how-to-fight at 8.7 with 57. Direct requests confirmed five of the eight serve HTTP 200 with a `noindex` directive and are absent from the sitemap, which is the strongest suppression signal the site can send. `scripts/gsc-page-trend.mjs` then compared the recent 14 days against the preceding 45: all five returned **zero** impressions in the recent window against 28, 38, 8 and 15 in the older one, and SunPower zero in both. The suppression is working exactly as designed and the cached impressions are historical. (2) Fourteen near-winner pages had zero clicks at positions 6.2 to 18.1, which reads as fourteen CTR defects in a flat table. `scripts/ctr-significance.py` computed expected clicks from the site's own CTR-by-position curve: expected values were 0.2 to 2.3 clicks, and the probability of observing zero purely by chance ranged from 0.10 to 0.84. **Zero of the fourteen was statistically real.**
**Reasoning:** Both findings are the same mistake in different clothes, which is treating a table row as a diagnosis. The index-status case nearly produced a change that would have promoted five pages into the index on the strength of impressions that had already stopped arriving — the suppression was correct, the pages are thin (317 and 311 words for the two company hubs), and Dividend Finance has zero recent query demand site-wide while the lien topic is already covered by the indexable `/solar-lien-removal` page. The CTR case would have produced fourteen rewrites to chase roughly one expected click each, and worse, it would have taught the wrong lesson from random variation. The discipline this establishes: before treating a page as a defect, check whether its demand is current, and check whether its shortfall is larger than chance. The high-volume pages remain the real opportunities and those were already worked today — GoodLeap at 10,365 impressions, Sunrun at 9,343 and Blue Raven at 4,488 are 81 percent of the page-1 near-winner impression mass, and all three were fixed earlier in the same session.
**Verified:** `node scripts/gsc-page-trend.mjs --recent 14 --older 45` on the five suppressed pages returned 0 impressions in every recent window. `curl` against all eight live URLs confirmed five HTTP 200 with `noindex` and three HTTP 301. `python3 scripts/ctr-significance.py` over the 45-item near-winners list reported 14 zero-click pages, 0 statistically real, 14 noise, with p(0) from 0.1003 to 0.8420.
**Recurrence guard:** `scripts/ctr-significance.py` is now the required first pass over any near-winners list: a zero-click page is not a defect unless p(0) is below 0.05, so low-volume pages can no longer consume a change. `scripts/gsc-page-trend.mjs` is now required before any index-status change, because the near-winners dataset spans 1 Sep to 22 Nov and an impression count inside it says nothing about whether the demand is still there. Both are read-only and both are cheap enough to run before every batch.
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
