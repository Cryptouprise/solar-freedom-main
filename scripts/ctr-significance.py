#!/usr/bin/env python3
"""Separate real CTR defects from noise in the near-winners list.

Why this exists: a page with 19 impressions at position 5.3 and zero clicks looks
like a defect in a flat table, but the expected click count at that volume is
about one, so zero is unremarkable. Chasing it wastes a change and, worse,
teaches the wrong lesson. This computes the expected clicks for each page from
the site's own CTR-by-position curve and reports a one-tailed Poisson
probability, so only pages whose shortfall cannot be explained by volume are
treated as defects.

Reads the near-winners JSON. Writes nothing.
"""
import json
import math
import sys
import os

DEFAULT_SRC = "/home/ubuntu/solar-freedom-deliverables/seo-2026-11-24/near-winners.json"

# Site's own measured CTR by position band, from the 90-day Search Console
# window. Used instead of an industry curve so the comparison is like-for-like.
CTR_BY_POSITION = [
    (1, 3, 0.110),
    (3, 5, 0.070),
    (5, 8, 0.025),
    (8, 12, 0.010),
    (12, 20, 0.004),
    (20, 1000, 0.001),
]


def expected_ctr(position: float) -> float:
    for lo, hi, ctr in CTR_BY_POSITION:
        if lo <= position < hi:
            return ctr
    return 0.001


def poisson_zero_prob(expected: float) -> float:
    """Probability of observing exactly 0 clicks when `expected` were due."""
    if expected <= 0:
        return 1.0
    return math.exp(-expected)


def main() -> int:
    src = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("-") else DEFAULT_SRC
    with open(src, encoding="utf-8") as fh:
        data = json.load(fh)

    rows = []
    for tier in ("page1", "page2"):
        for item in data.get(tier, []):
            url = item["keys"][0]
            imp = item.get("impressions", 0)
            clk = item.get("clicks", 0)
            pos = item.get("position", 0)
            ctr = expected_ctr(pos)
            exp = imp * ctr
            p0 = poisson_zero_prob(exp)
            rows.append(
                {
                    "url": url,
                    "tier": tier,
                    "imp": imp,
                    "clk": clk,
                    "pos": pos,
                    "expected_ctr": ctr,
                    "expected_clicks": exp,
                    "shortfall": exp - clk,
                    "p_zero": p0,
                }
            )

    real = [r for r in rows if r["clk"] == 0 and r["p_zero"] < 0.05]
    real.sort(key=lambda r: -r["shortfall"])

    noise = [r for r in rows if r["clk"] == 0 and r["p_zero"] >= 0.05]
    noise.sort(key=lambda r: -r["imp"])

    print("=" * 96)
    print("REAL ZERO-CLICK DEFECTS  (p < 0.05 that the shortfall is chance)")
    print("=" * 96)
    print("%-62s %6s %4s %6s %8s %7s" % ("URL", "IMPR", "CLK", "POS", "EXP.CLK", "p(0)"))
    for r in real:
        u = r["url"].replace("https://breakyoursolarcontract.com", "")
        print(
            "%-62s %6d %4d %6.1f %8.1f %7.4f"
            % (u[:62], r["imp"], r["clk"], r["pos"], r["expected_clicks"], r["p_zero"])
        )
    if not real:
        print("  (none)")

    print()
    print("=" * 96)
    print("NOT SIGNIFICANT  (zero clicks fully explained by low volume — do not treat as defects)")
    print("=" * 96)
    print("%-62s %6s %4s %6s %8s %7s" % ("URL", "IMPR", "CLK", "POS", "EXP.CLK", "p(0)"))
    for r in noise[:15]:
        u = r["url"].replace("https://breakyoursolarcontract.com", "")
        print(
            "%-62s %6d %4d %6.1f %8.1f %7.4f"
            % (u[:62], r["imp"], r["clk"], r["pos"], r["expected_clicks"], r["p_zero"])
        )
    if not noise:
        print("  (none)")

    print()
    print(
        "summary: %d pages with zero clicks, %d statistically real, %d noise"
        % (len([r for r in rows if r["clk"] == 0]), len(real), len(noise))
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
