#!/usr/bin/env python3
"""Insert the unsourced-claims change-log entry into both mirrors. Idempotent."""
import io
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TS = os.path.join(ROOT, "shared", "changeLog.ts")
MD = os.path.join(ROOT, "docs", "CHANGE-LOG.md")

TITLE = "Five articles promised a resolution timeline and cited population statistics that no source supports"

TS_ENTRY = '''  {
    date: "2026-11-26",
    title: "Five articles promised a resolution timeline and cited population statistics that no source supports",
    class: "accuracy",
    changed: [
      "client/src/data/blog-articles-batch9.ts, blog-articles-batch14.ts and blog.ts: the stat trio '3M+' U.S. homeowners with solar contracts, '68%' report higher-than-expected costs and '30-90 days to resolution with legal help' removed from five articles and replaced with figures each article can actually defend",
      "escalator-clause article stat block now reads 2.9-3.9% / $150 -> $328 / 20-25 yrs / Free, all of which are arithmetic the reader can check against their own contract",
      "attorney-general complaint article now reads CFPB / FTC / State AG / Free, naming the agencies that actually receive these complaints rather than a predicted outcome",
      "PPA transfer article now reads 20-25 yrs / 30-60 days / Buyout / Free; red-flags checklist now reads 15 / 2.9-3.9% / Notice / Free",
      "cancel-solar-contract-after-installation in client/src/data/blog.ts: the same '30-90 days to resolution with legal help' stat replaced with the notice requirement",
      "escalator article metaDescription rewritten to drop the 'Act now' urgency and the 'Secure your savings' guarantee, and its ctaSubtext corrected to match",
      "blog-articles-batch6.ts breakyoursolarcontract-how-it-works (noindex): metaDescription no longer promises 'in 30-90 days' and the excerpt no longer says 'in as little as 30 days'",
      "scripts/prerender.assembled.mjs: three new patterns added to unsupportedFirstPartyClaimPatterns covering outcome-plus-timeline promises and unsourced population statistics; a broader version was written, measured and deliberately rejected",
      "server/unsourcedClaims.test.ts added, 4 tests, including a build-output assertion that no indexable page ships 'Typical Resolution' or '30-90 days' and an assertion that the runtime filter stays narrow",
    ],
    evidence:
      "A site-wide grep on 26 Nov 2026 found the same stat trio in four articles and a fifth occurrence of the resolution-time stat in client/src/data/blog.ts, and no source anywhere in the repository. The only genuine '68%' in the repo is in docs/seo-baseline-2026-09-03.md describing an unrelated impression decrease. The '30-90 days to resolution with legal help' line is an outcome and timeline promise, not a statistic, and the trust filter missed it because the nearest pattern required the literal phrase 'Results in 30-90 days'. Measured across the built output: 7 pages shipped a resolution-time promise and all 7 were noindex; the indexed city pages las-vegas-nv, phoenix-az and houston-tx did not ship it. A sweep of the proposed broader '% of <group>' runtime pattern showed it would have suppressed 87 legitimate lines including approved published city-page statistics and correct explanations of the 30% federal tax credit.",
    reasoning:
      "Two separate harms. The resolution-time line is a prediction about an outcome we cannot control, which is both a trust problem with the reader and the kind of claim that damages credibility with an attorney. The population statistics are worse because they are unfalsifiable as written: no citation, no date, no sample. Rather than soften the numbers, each article was given figures it can defend from its own subject matter, so the stat block still does the job of a stat block, which is to make the page scannable. The broad runtime filter was rejected because runtime suppression DELETES content, and deleting 87 legitimate lines to catch a handful of bad ones is a worse trade than catching them at build time. The wide class is therefore guarded by a failing test rather than a runtime deletion.",
    confidence: "measured",
    verifiedBy:
      "npx vitest run server/unsourcedClaims.test.ts: 4 tests passed. A grep of client/src/data on 26 Nov 2026 returns 0 occurrences of '3M+', 'Report higher-than-expected costs', 'Days to resolution with legal help' and 'Homeowners report hidden fees' outside the test file and the 6 legacy city-content-depth files that are all noindex. pnpm check clean; npx vitest run: 86 files, 832 tests passed, 3 skipped.",
    preventsRecurrence:
      "server/unsourcedClaims.test.ts bans outcome-timeline promises and unsourced population statistics in article copy, asserts that the runtime trust filter still contains 'with legal help' and does NOT contain the rejected broad '% of <group>' pattern, and asserts that no indexable built page ships 'Typical Resolution' or '30-90 days'. The test carries an explicit ALLOWED list for 6 legacy city-content-depth files and LEGACY_NOINDEX_BLOGS for blog-articles-batch7.ts, each with a stated reason, so the exclusions are visible rather than silent.",
    measureAfter: "2026-12-05",
  },
'''

MD_ENTRY = '''## 2026-11-26 — Five articles promised a resolution timeline and cited population statistics that no source supports
**Class:** accuracy
**Changed:**
- `client/src/data/blog-articles-batch9.ts`, `blog-articles-batch14.ts` and `blog.ts`: the stat trio `3M+` U.S. homeowners with solar contracts, `68%` report higher-than-expected costs and `30-90 days to resolution with legal help` removed from five articles and replaced with figures each article can actually defend.
- Escalator-clause article stat block now reads `2.9-3.9%` / `$150 -> $328` / `20-25 yrs` / `Free`, all of which are arithmetic the reader can check against their own contract.
- Attorney-general complaint article now reads `CFPB` / `FTC` / `State AG` / `Free`, naming the agencies that actually receive these complaints rather than a predicted outcome.
- PPA transfer article now reads `20-25 yrs` / `30-60 days` / `Buyout` / `Free`; red-flags checklist now reads `15` / `2.9-3.9%` / `Notice` / `Free`.
- `cancel-solar-contract-after-installation` in `client/src/data/blog.ts`: the same `30-90 days to resolution with legal help` stat replaced with the notice requirement.
- Escalator article metaDescription rewritten to drop the "Act now" urgency and the "Secure your savings" guarantee, and its ctaSubtext corrected to match.
- `blog-articles-batch6.ts` `breakyoursolarcontract-how-it-works` (noindex): metaDescription no longer promises "in 30-90 days" and the excerpt no longer says "in as little as 30 days".
- `scripts/prerender.assembled.mjs`: three new patterns added to `unsupportedFirstPartyClaimPatterns` covering outcome-plus-timeline promises and unsourced population statistics; a broader version was written, measured and deliberately rejected.
- `server/unsourcedClaims.test.ts` added, 4 tests, including a build-output assertion that no indexable page ships `Typical Resolution` or `30-90 days` and an assertion that the runtime filter stays narrow.
**Why:** A site-wide grep on 26 Nov 2026 found the same stat trio in four articles and a fifth occurrence of the resolution-time stat in `client/src/data/blog.ts`, and no source anywhere in the repository. The only genuine "68%" in the repo is in `docs/seo-baseline-2026-09-03.md` describing an unrelated impression decrease. The "30-90 days to resolution with legal help" line is an outcome and timeline promise, not a statistic, and the trust filter missed it because the nearest pattern required the literal phrase "Results in 30-90 days". Measured across the built output: 7 pages shipped a resolution-time promise and all 7 were noindex; the indexed city pages las-vegas-nv, phoenix-az and houston-tx did not ship it. A sweep of the proposed broader `% of <group>` runtime pattern showed it would have suppressed 87 legitimate lines including approved published city-page statistics and correct explanations of the 30% federal tax credit.
**Reasoning:** Two separate harms. The resolution-time line is a prediction about an outcome we cannot control, which is both a trust problem with the reader and the kind of claim that damages credibility with an attorney. The population statistics are worse because they are unfalsifiable as written: no citation, no date, no sample. Rather than soften the numbers, each article was given figures it can defend from its own subject matter, so the stat block still does the job of a stat block, which is to make the page scannable. The broad runtime filter was rejected because runtime suppression DELETES content, and deleting 87 legitimate lines to catch a handful of bad ones is a worse trade than catching them at build time. The wide class is therefore guarded by a failing test rather than a runtime deletion.
**Verified:** `npx vitest run server/unsourcedClaims.test.ts`: 4 tests passed. A grep of `client/src/data` on 26 Nov 2026 returns 0 occurrences of "3M+", "Report higher-than-expected costs", "Days to resolution with legal help" and "Homeowners report hidden fees" outside the test file and the 6 legacy `city-content-depth` files that are all noindex. `pnpm check` clean; `npx vitest run`: 86 files, 832 tests passed, 3 skipped.
**Recurrence guard:** `server/unsourcedClaims.test.ts` bans outcome-timeline promises and unsourced population statistics in article copy, asserts that the runtime trust filter still contains "with legal help" and does NOT contain the rejected broad `% of <group>` pattern, and asserts that no indexable built page ships `Typical Resolution` or `30-90 days`. The test carries an explicit `ALLOWED` list for 6 legacy `city-content-depth` files and `LEGACY_NOINDEX_BLOGS` for `blog-articles-batch7.ts`, each with a stated reason, so the exclusions are visible rather than silent.
**Measure after:** 2026-12-05
'''

def main() -> int:
    changed = []

    ts = io.open(TS, encoding="utf-8").read()
    if TITLE in ts:
        print("TS: already present, skipping")
    else:
        anchor = "\n];\n"
        if ts.count(anchor) != 1:
            print("TS: anchor count %d, refusing" % ts.count(anchor))
            return 1
        ts = ts.replace(anchor, "\n" + TS_ENTRY + "];\n")
        io.open(TS, "w", encoding="utf-8").write(ts)
        changed.append("changeLog.ts")

    md = io.open(MD, encoding="utf-8").read()
    if "## 2026-11-26 \u2014 " + TITLE in md:
        print("MD: already present, skipping")
    else:
        lines = md.split("\n")
        # find first '## ' heading
        idx = next((i for i, l in enumerate(lines) if l.startswith("## ")), None)
        if idx is None:
            print("MD: no heading found, refusing")
            return 1
        lines[idx:idx] = MD_ENTRY.rstrip("\n").split("\n")
        io.open(MD, "w", encoding="utf-8").write("\n".join(lines))
        changed.append("CHANGE-LOG.md")

    print("inserted into:", ", ".join(changed) if changed else "nothing")
    return 0

if __name__ == "__main__":
    sys.exit(main())
