#!/usr/bin/env python3
"""Append the meta-keyword coverage entry to shared/changeLog.ts and docs/CHANGE-LOG.md.

NOTE ON QUOTING: this script uses only single quotes and escaped apostrophes
inside the TS string values. An earlier version emitted raw double quotes inside
double-quoted TS strings and broke the file with TS1002, so the rule here is
simple: no bare double-quote characters in any content value.
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

TITLE = (
    'Eight indexable pages served no meta-keywords tag while the other twenty-two did'
)
DATE = '2026-11-26'

ENTRY_TS = """  {
    date: "%DATE%",
    title: "%TITLE%",
    class: "SEO",
    changed: [
      "shared/page-meta-keywords.json — 5 indexable city entries added (murfreesboro-tn, san-francisco-ca, san-jose-ca, santa-ana-ca, youngstown-oh) and 3 indexable state entries added (arizona, california, texas); 22 to 30 keys",
      "server/cityKeywordCoverage.test.ts — new guard, 4 tests",
      "scripts/add-1126-city-keywords.py — idempotent fixer for the city entries",
    ],
    evidence:
      "Measured 26 Nov 2026 against dist/public: of the 27 INDEXABLE city pages, 22 served a meta name=keywords tag and 5 did not — murfreesboro-tn, san-francisco-ca, san-jose-ca, santa-ana-ca, youngstown-oh. The 22 that did all carried exactly 5 keywords in one consistent pattern. The tag is emitted by scripts/prerender.assembled.mjs line 1684 from shared/page-meta-keywords.json, so a missing key means a missing tag. The guard written for the city gap then found a second one on its first run: all 3 INDEXABLE state pages (arizona, california, texas) were also missing. After the fix, all 27 city pages and all 3 state pages serve a tag with 5 keywords each, and the JSON diff is a pure addition — 0 keys removed, 0 keys modified, 22 to 30.",
    reasoning:
      "Recorded honestly: Google has publicly ignored the keywords meta tag for ranking for over a decade, so this change does not raise rankings and is not claimed to. It is done for two real reasons. First, the owner asked for this tag on specific city pages four separate times, each time with an explicit constraint of 3 to 8 keywords, and answering only the four named pages left the set inconsistent in a way nobody had measured. Second, an inconsistent set is a maintenance trap: any checker that reports no keywords detected keeps flagging these pages, and the next person to read that report cannot distinguish a real omission from a deliberate choice, which is how a false alarm becomes noise that gets ignored. The five city entries follow the existing pattern exactly rather than inventing a new one, using city and state names read from client/src/data/cities.ts rather than typed by hand. The owner\\'s 3-to-8 bound is enforced on every entry by the guard because it was stated, and duplicate keywords within an entry are rejected too.",
    confidence: "measured",
    verifiedBy:
      "npx vitest run server/cityKeywordCoverage.test.ts (4 tests, including one that removes a key and confirms the checker reports it); pnpm check clean; pnpm build pre-rendered 583 pages; a direct scan of dist/public confirms 27 of 27 indexable city pages and 3 of 3 indexable state pages serve a tag with 5 keywords each and 0 are missing or out of range",
    preventsRecurrence:
      "The guard fails the build if any indexable city or state page has no keywords entry, if any entry falls outside 3 to 8 keywords, or if any entry repeats a keyword. Because it reads shared/index-eligibility.json rather than a hard-coded list, promoting a new city to indexable automatically requires a keywords entry before the build passes.",
    measureAfter: "2026-12-05",
  },
""".replace("%DATE%", DATE).replace("%TITLE%", TITLE)

ENTRY_MD = """## %DATE% — %TITLE%
**Class:** SEO
**Changed:**
- shared/page-meta-keywords.json — 5 indexable city entries added (murfreesboro-tn, san-francisco-ca, san-jose-ca, santa-ana-ca, youngstown-oh) and 3 indexable state entries added (arizona, california, texas); 22 to 30 keys
- server/cityKeywordCoverage.test.ts — new guard, 4 tests
- scripts/add-1126-city-keywords.py — idempotent fixer for the city entries
**Why:** Measured 26 Nov 2026 against dist/public: of the 27 INDEXABLE city pages, 22 served a meta name=keywords tag and 5 did not — murfreesboro-tn, san-francisco-ca, san-jose-ca, santa-ana-ca, youngstown-oh. The 22 that did all carried exactly 5 keywords in one consistent pattern. The tag is emitted by scripts/prerender.assembled.mjs line 1684 from shared/page-meta-keywords.json, so a missing key means a missing tag. The guard written for the city gap then found a second one on its first run: all 3 INDEXABLE state pages (arizona, california, texas) were also missing. After the fix, all 27 city pages and all 3 state pages serve a tag with 5 keywords each, and the JSON diff is a pure addition — 0 keys removed, 0 keys modified, 22 to 30.
**How the conclusion was reached:** Recorded honestly: Google has publicly ignored the keywords meta tag for ranking for over a decade, so this change does not raise rankings and is not claimed to. It is done for two real reasons. First, the owner asked for this tag on specific city pages four separate times, each time with an explicit constraint of 3 to 8 keywords, and answering only the four named pages left the set inconsistent in a way nobody had measured. Second, an inconsistent set is a maintenance trap: any checker that reports no keywords detected keeps flagging these pages, and the next person to read that report cannot distinguish a real omission from a deliberate choice, which is how a false alarm becomes noise that gets ignored. The five city entries follow the existing pattern exactly rather than inventing a new one, using city and state names read from client/src/data/cities.ts rather than typed by hand. The owner's 3-to-8 bound is enforced on every entry by the guard because it was stated, and duplicate keywords within an entry are rejected too.
**Verified:** npx vitest run server/cityKeywordCoverage.test.ts (4 tests, including one that removes a key and confirms the checker reports it); pnpm check clean; pnpm build pre-rendered 583 pages; a direct scan of dist/public confirms 27 of 27 indexable city pages and 3 of 3 indexable state pages serve a tag with 5 keywords each and 0 are missing or out of range
**Recurrence guard:** The guard fails the build if any indexable city or state page has no keywords entry, if any entry falls outside 3 to 8 keywords, or if any entry repeats a keyword. Because it reads shared/index-eligibility.json rather than a hard-coded list, promoting a new city to indexable automatically requires a keywords entry before the build passes.
**Measure after:** 2026-12-05
""".replace("%DATE%", DATE).replace("%TITLE%", TITLE)


def main() -> None:
    ts = ROOT / "shared/changeLog.ts"
    s = ts.read_text(encoding="utf-8")
    if TITLE in s:
        print("TS: already present")
    else:
        i = s.rfind("\n];\n")
        assert i != -1, "array close not found"
        s = s[: i + 1] + ENTRY_TS + s[i + 1 :]
        ts.write_text(s, encoding="utf-8")
        print("TS: appended")

    md = ROOT / "docs/CHANGE-LOG.md"
    m = md.read_text(encoding="utf-8")
    if TITLE in m:
        print("MD: already present")
    else:
        lines = m.split("\n")
        out = lines[0] + "\n" + ENTRY_MD + "\n" + "\n".join(lines[1:])
        md.write_text(out, encoding="utf-8")
        print("MD: inserted")


if __name__ == "__main__":
    main()
