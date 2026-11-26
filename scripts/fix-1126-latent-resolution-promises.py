#!/usr/bin/env python3
"""
Remove unsourced resolution-time promises from the two DEAD fields of the
legacy city-content-depth files, scoped strictly to the 27 indexable cities.

WHY THIS EXISTS
---------------
`localFaq` and `marketStats` are parsed into the depth objects but rendered by
NOTHING. Verified 26 Nov 2026:

    grep -rn ".localFaq|marketStats" client/src --include=*.tsx
    -> CityPage.tsx:517  const marketStats = [   (its own local literal, line 630)
    -> no consumer of depth.localFaq or depth.marketStats anywhere

So the strings below are NOT live. But they are LATENT exposure: the day someone
wires `depth.localFaq` or `depth.marketStats` into CityPage, 16 indexable city
pages would instantly publish an unsourced outcome-and-timeline promise on a
site whose own trust-governance filter exists to prevent exactly that.

The same class has already been fixed four times (3M+ homeowners, 68%, 30-90
days with legal help, and the outcome-timeline promise). This is the fifth
occurrence, and it is the one a `dist/public` scan can never see, because it
lives in a runtime React path.

SCOPE
-----
Only cities in shared/index-eligibility.json -> citySlugs. The 223 legacy
strings on noindex cities are left alone deliberately: they cannot be indexed,
and rewriting them is a separate, larger change that would block unrelated work.

IDEMPOTENT: re-running produces zero further changes.
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "client/src/data"

APPROVED_FAQ = (
    "Timing varies with the agreement, the facts, the parties involved, and the "
    "process selected. No result or timeline can be determined before an "
    "individual review."
)

# Exact object shapes found across the six depth files.
STAT_REPLACEMENTS = [
    (
        '{ label: "Avg. Resolution", value: "30\u201390 Days" }',
        '{ label: "Case Review", value: "Free" }',
    ),
    (
        '{ label: "Typical Resolution Time", value: "45\u201375 Days" }',
        '{ label: "Case Review", value: "Free" }',
    ),
    (
        '{ label: "Typical Resolution Time", value: "30\u201360 Days" }',
        '{ label: "Case Review", value: "Free" }',
    ),
    (
        '{"label":"Typical Resolution","value":"30-90 days"}',
        '{"label":"Case Review","value":"Free"}',
    ),
]

FAQ_PATTERNS = [
    re.compile(
        r'"[^"]*resolution typically takes [^"]*"',
    ),
]


def main() -> int:
    eligibility = json.loads(
        (ROOT / "shared/index-eligibility.json").read_text(encoding="utf-8")
    )
    indexable = set(eligibility["citySlugs"])

    total_stat = 0
    total_faq = 0
    touched = []

    for path in sorted(DATA.glob("city-content-depth*.ts")):
        src = path.read_text(encoding="utf-8")
        original = src

        # Split into per-city blocks so nothing can be replaced in the wrong city.
        parts = re.split(r"(\n\s*\{\s*\n\s*slug:\s*\")", src)
        # parts = [head, sep, "slug-name\"...", sep, ...]
        for i in range(1, len(parts), 2):
            body = parts[i + 1]
            m = re.match(r"([a-z0-9-]+)\"", body)
            if not m:
                continue
            slug = m.group(1)
            if slug not in indexable:
                continue

            new_body = body
            for old, new in STAT_REPLACEMENTS:
                if old in new_body:
                    n = new_body.count(old)
                    new_body = new_body.replace(old, new)
                    total_stat += n

            for pat in FAQ_PATTERNS:
                def _sub(match, slug=slug):
                    nonlocal total_faq
                    total_faq += 1
                    return '"' + APPROVED_FAQ + '"'

                new_body = pat.sub(_sub, new_body)

            parts[i + 1] = new_body

        src = "".join(parts)

        if src != original:
            path.write_text(src, encoding="utf-8")
            touched.append(path.name)

    print(f"stat objects replaced : {total_stat}")
    print(f"FAQ answers replaced  : {total_faq}")
    print(f"files written         : {touched or 'none (already clean)'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
