#!/usr/bin/env python3
"""Print every query recorded for one URL, sorted by impressions."""
import json
import sys

DATA = "/home/ubuntu/solar-freedom-deliverables/seo-2026-11-24/near-winners.json"
needle = sys.argv[1] if len(sys.argv) > 1 else "rescission"

d = json.load(open(DATA, encoding="utf-8"))
for url, payload in d["detail"].items():
    if needle not in url:
        continue
    qs = payload if isinstance(payload, list) else payload.get("queries", [])
    qs = [q for q in qs if isinstance(q, dict)]
    qs.sort(key=lambda q: -(q.get("impressions") or 0))
    print(f"URL: {url}   ({len(qs)} queries)")
    tot_i = sum(q.get("impressions") or 0 for q in qs)
    tot_c = sum(q.get("clicks") or 0 for q in qs)
    print(f"  totals: {tot_i} impressions, {tot_c} clicks\n")
    for q in qs:
        print(
            "  {:<52} {:>4} impr  pos {:>6}  {} clicks".format(
                (q.get("query") or "")[:52],
                q.get("impressions") or 0,
                round(q.get("position") or 0, 1),
                q.get("clicks") or 0,
            )
        )
    print()
