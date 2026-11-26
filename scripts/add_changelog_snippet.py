#!/usr/bin/env python3
"""Insert the 26 Nov snippet-truncation change-log entry into both log files.

Idempotent: keyed on the exact title, so re-running writes nothing.
"""
import io
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TS = os.path.join(ROOT, "shared/changeLog.ts")
MD = os.path.join(ROOT, "docs/CHANGE-LOG.md")

TITLE = "74 pages shipped Google a snippet that stopped mid-phrase"

TS_ENTRY = '''  {
    date: "2026-11-26",
    title: "74 pages shipped Google a snippet that stopped mid-phrase",
    class: "defect",
    changed: [
      "scripts/prerender.assembled.mjs — replaced the ellipsis-appending slicers in fitMetaTitle and fitMetaDescription with fitSnippet, which cuts only on a sentence end, a strong clause mark, a coordinating conjunction or a whole word, and drops a trailing function word so nothing dangles",
      "scripts/fix-1126-baked-ellipsis-descriptions.py — repaired 20 article records whose metaDescription already contained a literal '...' baked into the source string while the same record held a complete excerpt; the build-time fitter could not repair these because the ellipsis arrived as content",
      "client/src/data/blog-articles-batch6.ts — Colorado metaTitle read 'How to Cancel & Protect Your', missing the word 'self', so the served title ended mid-word",
      "client/src/data/blog-articles-batch11.ts — the lease-vs-loan metaTitle was cut by the 70-character fitter to '(And Why', leaving an open parenthetical; the trailing clause was dropped so the phrase completes",
      "server/metaSnippet.test.ts — new, 10 tests locking in both halves of the defect",
    ],
    evidence:
      "Measured on dist/public on 26 Nov 2026 across all 583 built pages: 37 titles and 56 descriptions ended in a literal ellipsis, 19 pages had both, so 74 pages — 12.7% of the site — showed a mid-phrase cut-off. Examples from the built output: 'Titan Solar Power Complaints: How to Get Out of Your Contract...', 'Solar Escalator Clause Explained — How to Fight Annual Payment...', 'Sunnova Filed for Bankruptcy: What Happens to Your Solar Contract?...'. The page /blog/solar-escalator-clause-what-it-is-how-to-fight held 80 impressions at average position 6.95 with ZERO clicks and its title was one of the truncated 37. A separate grep of client/src/data found 20 metaDescription values with a '...' baked into the source string, e.g. '...keep your system runnin...'.",
    reasoning:
      "The defect was found by scanning the built output for titles and descriptions whose final characters are an ellipsis, which is a shape a correct snippet should never have. Tracing those strings back to source showed two independent causes: the build-time fitter appended '...' after slicing mid-phrase, and 20 records had been truncated by hand and saved that way. The build-time cause is the larger one and is the reason the defect was invisible in review — the source data looked fine and the damage happened during generation. The hand-edited cause was provable rather than a guess because every affected record carries a complete `excerpt` field holding the full sentence the description was cut from. Fixing only the fitter would have left the 20 baked-in ellipses shipping, and fixing only the data would have let the fitter re-break every future long title, so both were fixed and both are now tested. The cut-boundary rules were chosen so a shortened snippet still reads as a finished thought; the half-the-limit floor exists so a snippet is never reduced to a stub. What would have falsified the diagnosis: a title or description ending in an ellipsis that was not produced by these two code paths. A scan for that found none — after the fix the count is zero.",
    confidence: "measured",
    verifiedBy:
      "python3 scan of all 583 built pages for a trailing ellipsis: 37 titles and 56 descriptions before, 0 and 0 after; pnpm build pre-rendered 583 pages; npx vitest run server/metaSnippet.test.ts — 10 tests pass; pnpm test — 83 files, 815 tests pass, 3 skipped; node scripts/trust-governance-audit.mjs — passed",
    preventsRecurrence:
      "server/metaSnippet.test.ts fails the build if any built page ships a title or description ending in an ellipsis, if either meta fitter reintroduces a slicing pattern, or if any article source record carries a '...' inside metaTitle or metaDescription. A snippet is a finished sentence, not a place to show that text was cut.",
    measureAfter: "2026-12-05",
  },
'''


def insert_ts():
    src = io.open(TS, encoding="utf-8").read()
    if TITLE in src:
        print("TS: entry already present, skipping")
        return False
    anchor = "export const CHANGE_LOG: ChangeEntry[] = [\n"
    if anchor not in src:
        raise SystemExit("TS anchor not found")
    src = src.replace(anchor, anchor + TS_ENTRY, 1)
    io.open(TS, "w", encoding="utf-8").write(src)
    print("TS: entry inserted")
    return True


MD_ENTRY = """## 2026-11-26 — 74 pages shipped Google a snippet that stopped mid-phrase

**Class:** defect

**Changed:**
- `scripts/prerender.assembled.mjs` — replaced the ellipsis-appending slicers in `fitMetaTitle` and `fitMetaDescription` with `fitSnippet`, which cuts only on a sentence end, a strong clause mark, a coordinating conjunction or a whole word, and drops a trailing function word so nothing dangles.
- `scripts/fix-1126-baked-ellipsis-descriptions.py` — repaired 20 article records whose `metaDescription` already contained a literal `...` baked into the source string while the same record held a complete `excerpt`.
- `client/src/data/blog-articles-batch6.ts` — Colorado `metaTitle` read "How to Cancel & Protect Your", missing the word "self".
- `client/src/data/blog-articles-batch11.ts` — the lease-vs-loan `metaTitle` was cut by the 70-character fitter to "(And Why", leaving an open parenthetical.
- `server/metaSnippet.test.ts` — new, 10 tests locking in both halves of the defect.

**Why:** Measured on `dist/public` on 26 Nov 2026 across all 583 built pages: **37 titles and 56 descriptions ended in a literal ellipsis**, 19 pages had both, so **74 pages — 12.7% of the site — showed a mid-phrase cut-off**. Examples from the built output: "Titan Solar Power Complaints: How to Get Out of Your Contract...", "Solar Escalator Clause Explained — How to Fight Annual Payment...". The page `/blog/solar-escalator-clause-what-it-is-how-to-fight` held 80 impressions at average position 6.95 with **zero clicks** and its title was one of the truncated 37. Two independent causes: the build-time fitter appended `...` after slicing mid-phrase, and 20 records had been truncated by hand and saved that way. The build-time cause is why the defect was invisible in review — the source data looked fine and the damage happened during generation.

**Verified:** Scan of all 583 built pages for a trailing ellipsis: 37 titles and 56 descriptions before, **0 and 0 after**. `pnpm build` pre-rendered 583 pages; `npx vitest run server/metaSnippet.test.ts` — 10 tests pass; `pnpm test` — 83 files, 815 tests pass, 3 skipped; `node scripts/trust-governance-audit.mjs` — passed.

**Recurrence guard:** `server/metaSnippet.test.ts` fails the build if any built page ships a title or description ending in an ellipsis, if either meta fitter reintroduces a slicing pattern, or if any article source record carries a `...` inside `metaTitle` or `metaDescription`. A snippet is a finished sentence, not a place to show that text was cut.

**Measure after:** 2026-12-05
"""


def insert_md():
    src = io.open(MD, encoding="utf-8").read()
    if "74 pages shipped Google a snippet that stopped mid-phrase" in src:
        print("MD: entry already present, skipping")
        return False
    lines = src.split("\n")
    # find the first "## " heading and insert before it (newest-first file)
    idx = None
    for i, ln in enumerate(lines):
        if ln.startswith("## "):
            idx = i
            break
    if idx is None:
        raise SystemExit("MD: no '## ' heading found")
    lines[idx:idx] = MD_ENTRY.split("\n")
    io.open(MD, "w", encoding="utf-8").write("\n".join(lines))
    print("MD: entry inserted before line %d" % (idx + 1))
    return True


if __name__ == "__main__":
    insert_ts()
    insert_md()
    sys.exit(0)
