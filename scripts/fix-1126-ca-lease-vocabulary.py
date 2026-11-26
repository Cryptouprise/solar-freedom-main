#!/usr/bin/env python3
"""
fix-1126-ca-lease-vocabulary.py

Closes the California state-page vocabulary gap.

MEASURED (26 Nov 2026, on the 583-page build):
  /solar-contract-laws/california is INDEXABLE, 1,411 words, and holds:
    - "cancel solar lease california"       18 impressions, position 10.4
    - "cancel sunrun contract california"   18 impressions, position 10.4
  Its rendered text contained:
    "lease"  0 occurrences
    "Sunrun" 0 occurrences
    "power purchase" 0 occurrences
  while "PPA" appeared 3 times.

  A page at position 10.4 for a query it never names is being matched on
  surrounding context, which caps how far it can climb. The page covered
  B&P 7159, NEM 3.0, the three-day right and the tax credit — every one of
  which applies to leases and PPAs too — but it never said so in the words
  the searcher used.

WHAT WAS ADDED
  One section, "Solar Leases and PPAs in California: The Same Rights, a
  Different Target", which:
    - names lease, PPA and power purchase agreement explicitly;
    - states the verified Civ. Code 1689.6 / 1689.7(g) position as applying
      to lease and PPA agreements rather than only purchases;
    - separates what is cancelled (the agreement) from what is not (the
      installed equipment), which is the most common misunderstanding and a
      real reason readers bounce;
    - names Sunrun and SunPower as the two largest third-party owners in the
      state, sourced from their own sites, without asserting anything about
      either company's conduct;
    - routes the reader to the two INDEXABLE pages that answer the deeper
      questions, both verified indexable before shipping.

  Verified indexable before linking:
    /blog/sunrun-solar-contract-cancellation-2026                     index
    /blog/selling-home-with-solar-ppa-panels-transfer-or-cancel       index

  Deliberately NOT linked: /blog/how-to-get-out-of-solar-lease-2026 and
  /blog/how-to-get-out-of-solar-lease-2026-complete-guide are both
  `noindex, follow`, so linking them would spend crawl equity on pages that
  cannot rank.

Idempotent: skips if the new section is already present.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / "client" / "src" / "data" / "state-laws.ts"

MARKER = "type: 'h2',\n        content: 'Solar Leases and PPAs in California"

SECTION = """      {
        type: 'h2',
        content: 'Solar Leases and PPAs in California: The Same Rights, a Different Target',
      },
      {
        type: 'p',
        content: 'Most California solar complaints are not about a purchase. They are about a lease or a power purchase agreement (PPA), where a third-party owner keeps the panels and sells you the output for 20 to 25 years. If your agreement is a lease or a PPA, the protections above still apply to you: the home solicitation rules in Civil Code 1689.6 and the compliance-based extension in 1689.7(g) turn on how the agreement was sold and what notice you were given, not on whether you bought the system or leased it. The disclosure requirements under Business and Professions Code § 7159 and the CSLB Solar Energy System Disclosure Document likewise apply to the agreement you actually signed.',
      },
      {
        type: 'p',
        content: 'One distinction matters more than any other, and it is where most people get stuck: cancelling the agreement does not remove the equipment. A lease or PPA exit and a system removal are two separate transactions. If the panels are already on your roof and you stop paying, the third-party owner's remedy is against you, not the roof — and a lien or a credit hit is a worse outcome than the payment you were trying to escape. That is why the order of operations matters: establish your grounds first, then negotiate the agreement, then deal with the hardware.',
      },
      {
        type: 'p',
        content: 'Sunrun and SunPower are the two largest residential third-party solar owners operating in California, according to each company\\'s own site. If your lease or PPA is with one of them, the questions to bring to a review are the same ones the law cares about: what the salesperson said about your utility rate, whether you received the disclosure document and the cancellation notice, and whether the production estimate was tied to your actual address and utility. For the Sunrun-specific process, see [Sunrun solar contract cancellation](/blog/sunrun-solar-contract-cancellation-2026). If the question is what happens to a lease or PPA when you sell the house, see [selling a home with solar PPA panels](/blog/selling-home-with-solar-ppa-panels-transfer-or-cancel).',
      },
"""


def main():
    src = TARGET.read_text(encoding="utf-8")

    if MARKER in src:
        print("already applied -- skipping")
        return 0

    # Locate the California entry and the closing bracket of its content array.
    m = re.search(r"slug:\s*'california'", src)
    if not m:
        print("FATAL: california entry not found")
        return 1
    start = m.start()
    nxt = src.find("\n  },\n", start)
    entry = src[start:nxt]

    ci = entry.find("content: [")
    if ci == -1:
        print("FATAL: california content array not found")
        return 1
    depth = 0
    j = ci + len("content: [") - 1
    for k in range(j, len(entry)):
        if entry[k] == "[":
            depth += 1
        elif entry[k] == "]":
            depth -= 1
            if depth == 0:
                break

    # k is the index of the content array's closing ']' inside `entry`.
    # Insert the new sections immediately before it.
    abs_k = start + k
    # The last section ends with "      },\n    ]" -- insert after that "},\n"
    tail = src[max(0, abs_k - 12) : abs_k]
    if not tail.rstrip().endswith("},"):
        print(f"FATAL: unexpected content tail: {tail!r}")
        return 1

    new_src = src[:abs_k] + SECTION + "    " + src[abs_k:]
    TARGET.write_text(new_src, encoding="utf-8")

    # Report
    check = TARGET.read_text(encoding="utf-8")
    print("applied")
    print("  'Solar Leases and PPAs' present:", "Solar Leases and PPAs" in check)
    print("  'power purchase agreement' present:", "power purchase agreement" in check)
    print("  Sunrun link present:", "/blog/sunrun-solar-contract-cancellation-2026" in check)
    print("  PPA-selling-home link present:", "/blog/selling-home-with-solar-ppa-panels-transfer-or-cancel" in check)
    return 0


if __name__ == "__main__":
    sys.exit(main())
