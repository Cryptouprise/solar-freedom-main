#!/usr/bin/env python3
"""
Add the five missing meta-keyword entries so every INDEXABLE city page has one.

MEASURED 26 Nov 2026: 22 of the 27 indexable city pages served a
<meta name="keywords"> tag and 5 did not:
  murfreesboro-tn, san-francisco-ca, san-jose-ca, santa-ana-ca, youngstown-oh

The tag is emitted by scripts/prerender.assembled.mjs line 1684 from
shared/page-meta-keywords.json, so a missing key means a missing tag. The other
22 all carry exactly 5 keywords in the same five-slot pattern:
  cancel solar contract <City>
  <City> solar contract cancellation
  <State> solar contract rights
  <City> solar lease cancellation
  <City> solar PPA cancellation

The five below follow that pattern exactly, using the city and state names read
from client/src/data/cities.ts rather than typed by hand:
  Murfreesboro / Tennessee, San Francisco / California, San Jose / California,
  Santa Ana / California, Youngstown / Ohio

WHY THIS IS A COMPLETENESS FIX RATHER THAN AN SEO CLAIM
Google has publicly ignored the keywords meta tag for ranking for over a decade,
and this is recorded rather than glossed over: adding these five does not raise
rankings. It is done because the owner asked for the tag on specific city pages
and because an inconsistent set is a maintenance trap — a checker that flags "no
keywords detected" will keep flagging these five, and the next person to read
that report cannot tell a real omission from a deliberate one. Consistency here
is worth more than the tag itself.

IDEMPOTENT: re-running produces zero further changes.
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILE = ROOT / "shared/page-meta-keywords.json"

NEW = {
    "/cancel-solar-contract/murfreesboro-tn": [
        "cancel solar contract Murfreesboro",
        "Murfreesboro solar contract cancellation",
        "Tennessee solar contract rights",
        "Murfreesboro solar lease cancellation",
        "Murfreesboro solar PPA cancellation",
    ],
    "/cancel-solar-contract/san-francisco-ca": [
        "cancel solar contract San Francisco",
        "San Francisco solar contract cancellation",
        "California solar contract rights",
        "San Francisco solar lease cancellation",
        "San Francisco solar PPA cancellation",
    ],
    "/cancel-solar-contract/san-jose-ca": [
        "cancel solar contract San Jose",
        "San Jose solar contract cancellation",
        "California solar contract rights",
        "San Jose solar lease cancellation",
        "San Jose solar PPA cancellation",
    ],
    "/cancel-solar-contract/santa-ana-ca": [
        "cancel solar contract Santa Ana",
        "Santa Ana solar contract cancellation",
        "California solar contract rights",
        "Santa Ana solar lease cancellation",
        "Santa Ana solar PPA cancellation",
    ],
    "/cancel-solar-contract/youngstown-oh": [
        "cancel solar contract Youngstown",
        "Youngstown solar contract cancellation",
        "Ohio solar contract rights",
        "Youngstown solar lease cancellation",
        "Youngstown solar PPA cancellation",
    ],
}


def main() -> int:
    data = json.loads(FILE.read_text(encoding="utf-8"))
    added = 0
    for path, kws in NEW.items():
        assert 3 <= len(kws) <= 8, f"{path}: {len(kws)} keywords outside 3-8"
        if path in data:
            print("already present:", path)
            continue
        data[path] = kws
        added += 1
        print("added:", path)
    if added:
        # preserve the file's existing 2-space indent and trailing newline
        FILE.write_text(
            json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        print(f"wrote {FILE.name} (+{added})")
    else:
        print("no changes needed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
