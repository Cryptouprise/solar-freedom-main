#!/usr/bin/env python3
"""Append the latent-runtime-promise entry to shared/changeLog.ts and docs/CHANGE-LOG.md.

TS appends newest at the END of the array (anchor on the final '\\n];\\n').
Markdown is newest-FIRST, so the entry is inserted after the H1.
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

TITLE = (
    "Sixteen indexable city pages carried an unsourced resolution-time promise "
    "in a code path no scan could see"
)
DATE = "2026-11-26"

ENTRY_TS = f"""  {{
    date: "{DATE}",
    title: "{TITLE}",
    class: "accuracy",
    changed: [
      "scripts/fix-1126-latent-resolution-promises.py — new idempotent fixer, scoped strictly to the 27 indexable cities; replaced 15 stat objects and 5 FAQ answers across 5 legacy depth files",
      "client/src/data/city-content-depth-batch-a.ts, -batch-b.ts, -batch-c.ts, -batch-e.ts, -batch-g.ts, city-content-depth.ts — resolution-time strings replaced with the site's own already-approved wording",
      "server/unsourcedClaims.test.ts — 2 new tests: an indexable-city source scan that ignores the file-level allow-list, plus a self-test proving the pattern fires on the exact pre-fix strings",
    ],
    evidence:
      "Measured 26 Nov 2026. 16 of the 27 indexable city pages carried a resolution-time promise: austin-tx, henderson-nv, north-las-vegas-nv, savannah-ga, nashville-tn, cincinnati-oh, san-francisco-ca, san-jose-ca, hartford-ct, little-rock-ar, shreveport-la, houston-tx, dallas-tx, san-antonio-tx, los-angeles-ca and san-diego-ca. The strings were 30–90 days, 45–75 days, 30–60 days, 'Typical Resolution Time' and 'Avg. Resolution'. All 23 occurrences sat in the localFaq or marketStats field, and a repository-wide grep proved no component renders either field: grep -rn '.localFaq|marketStats' client/src --include=*.tsx returns only CityPage.tsx:517, which builds its OWN local marketStats literal at line 630. Zero rendered-field hits, 23 dead-field hits. Fixed: 15 stat objects and 5 FAQ answers across 5 files, verified 0 remaining indexable hits and a second run writing nothing.",
    reasoning:
      "This is the fifth occurrence of the same defect class, after 3M+ homeowners, 68%, the 30-90-days-with-legal-help line, and the outcome-timeline promise — and it is the first one that neither existing guard could ever have caught. The earlier allow-list exempts the depth files by WHOLE FILE, so an indexable city inside an allow-listed file was never scanned; and the dist/public assertion can never see this path at all, because these files feed the runtime React component CityPage.tsx rather than the pre-rendered shell. Both were confirmed by experiment rather than assumed: injecting the exact pre-fix string turned the new source test red while the built-output test stayed green. So the exposure was latent, not live — but the day anyone wires depth.localFaq or depth.marketStats into CityPage, sixteen indexable pages publish an unsourced outcome-and-timeline promise instantly, on a site whose own trust-governance filter exists to prevent exactly that. Replacing the copy now costs nothing and removes the trap. The replacement wording is the site's own approved phrasing from the generic city FAQ ('Timing varies with the agreement, the facts, the parties involved, and the process selected. No result or timeline can be determined before an individual review.') rather than newly invented text, so no new claim is introduced. The 223 remaining legacy strings on noindex cities are deliberately left alone: they cannot be indexed, and rewriting them is a separate, larger change that would block unrelated work.",
    confidence: "measured",
    verifiedBy:
      "npx vitest run server/unsourcedClaims.test.ts (6 tests, proven in both directions: baseline green, injected regression red on batch-a.ts :: henderson-nv :: 'Avg. Resolution', restored green); pnpm check clean; 90 test files, 864 tests passed, 3 skipped; node scripts/trust-governance-audit.mjs passed; pnpm build pre-rendered 583 pages",
    preventsRecurrence:
      "The new test scans SOURCE, scopes to indexable cities only, and does not consult the allow-list, so a file-level exemption can no longer hide an indexable defect. It also asserts the indexable set is still 27, so if that approved set ever changes the test must be re-read rather than silently covering different pages. Its companion test reproduces the four exact pre-fix string shapes and asserts the pattern catches each one, because a guard that has never been seen to fail is not a guard.",
    measureAfter: "2026-12-05",
  }},
"""

ENTRY_MD = f"""## {DATE} — {TITLE}
**Class:** accuracy
**Changed:**
- scripts/fix-1126-latent-resolution-promises.py — new idempotent fixer, scoped strictly to the 27 indexable cities; replaced 15 stat objects and 5 FAQ answers across 5 legacy depth files
- client/src/data/city-content-depth-batch-a.ts, -batch-b.ts, -batch-c.ts, -batch-e.ts, -batch-g.ts, city-content-depth.ts — resolution-time strings replaced with the site's own already-approved wording
- server/unsourcedClaims.test.ts — 2 new tests: an indexable-city source scan that ignores the file-level allow-list, plus a self-test proving the pattern fires on the exact pre-fix strings
**Why:** Measured 26 Nov 2026. 16 of the 27 indexable city pages carried a resolution-time promise: austin-tx, henderson-nv, north-las-vegas-nv, savannah-ga, nashville-tn, cincinnati-oh, san-francisco-ca, san-jose-ca, hartford-ct, little-rock-ar, shreveport-la, houston-tx, dallas-tx, san-antonio-tx, los-angeles-ca and san-diego-ca. The strings were 30–90 days, 45–75 days, 30–60 days, 'Typical Resolution Time' and 'Avg. Resolution'. All 23 occurrences sat in the localFaq or marketStats field, and a repository-wide grep proved no component renders either field: grep -rn '.localFaq|marketStats' client/src --include=*.tsx returns only CityPage.tsx:517, which builds its OWN local marketStats literal at line 630. Zero rendered-field hits, 23 dead-field hits. Fixed: 15 stat objects and 5 FAQ answers across 5 files, verified 0 remaining indexable hits and a second run writing nothing.
**How the conclusion was reached:** This is the fifth occurrence of the same defect class, after 3M+ homeowners, 68%, the 30-90-days-with-legal-help line, and the outcome-timeline promise — and it is the first one that neither existing guard could ever have caught. The earlier allow-list exempts the depth files by WHOLE FILE, so an indexable city inside an allow-listed file was never scanned; and the dist/public assertion can never see this path at all, because these files feed the runtime React component CityPage.tsx rather than the pre-rendered shell. Both were confirmed by experiment rather than assumed: injecting the exact pre-fix string turned the new source test red while the built-output test stayed green. So the exposure was latent, not live — but the day anyone wires depth.localFaq or depth.marketStats into CityPage, sixteen indexable pages publish an unsourced outcome-and-timeline promise instantly, on a site whose own trust-governance filter exists to prevent exactly that. Replacing the copy now costs nothing and removes the trap. The replacement wording is the site's own approved phrasing from the generic city FAQ ('Timing varies with the agreement, the facts, the parties involved, and the process selected. No result or timeline can be determined before an individual review.') rather than newly invented text, so no new claim is introduced. The 223 remaining legacy strings on noindex cities are deliberately left alone: they cannot be indexed, and rewriting them is a separate, larger change that would block unrelated work.
**Verified:** npx vitest run server/unsourcedClaims.test.ts (6 tests, proven in both directions: baseline green, injected regression red on batch-a.ts :: henderson-nv :: 'Avg. Resolution', restored green); pnpm check clean; 90 test files, 864 tests passed, 3 skipped; node scripts/trust-governance-audit.mjs passed; pnpm build pre-rendered 583 pages
**Recurrence guard:** The new test scans SOURCE, scopes to indexable cities only, and does not consult the allow-list, so a file-level exemption can no longer hide an indexable defect. It also asserts the indexable set is still 27, so if that approved set ever changes the test must be re-read rather than silently covering different pages. Its companion test reproduces the four exact pre-fix string shapes and asserts the pattern catches each one, because a guard that has never been seen to fail is not a guard.
**Measure after:** 2026-12-05

"""


def main() -> None:
    ts = ROOT / "shared/changeLog.ts"
    s = ts.read_text(encoding="utf-8")
    if TITLE in s:
        print("TS: already present, skipping")
    else:
        i = s.rfind("\n];\n")
        assert i != -1, "array close not found"
        s = s[: i + 1] + ENTRY_TS + s[i + 1 :]
        ts.write_text(s, encoding="utf-8")
        print("TS: appended")

    md = ROOT / "docs/CHANGE-LOG.md"
    m = md.read_text(encoding="utf-8")
    if TITLE in m:
        print("MD: already present, skipping")
    else:
        lines = m.split("\n")
        # insert after the H1 line
        out = lines[0] + "\n" + ENTRY_MD + "\n".join(lines[1:])
        md.write_text(out, encoding="utf-8")
        print("MD: inserted")


if __name__ == "__main__":
    main()
