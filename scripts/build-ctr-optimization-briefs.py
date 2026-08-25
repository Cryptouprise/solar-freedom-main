#!/usr/bin/env python3
"""Create deterministic CTR briefs for the highest-opportunity canonical pages."""
from __future__ import annotations

from pathlib import Path
from urllib.parse import urlparse

import pandas as pd

ROOT = Path("/home/ubuntu/solar-freedom-main")
REPORT = ROOT / "reports/operator-review"
GSC = REPORT / "gsc"

TARGETS = [
    "/blog/goodleap-solar-loan-cancellation-hidden-fees-2026",
    "/blog/sunrun-solar-contract-cancellation-2026",
    "/blog/how-to-get-out-of-a-solar-contract",
    "/blog/blue-raven-solar-complaints",
    "/blog/adt-solar-complaints",
    "/blog/new-jersey-solar-contract-rights",
]


def path_only(url: str) -> str:
    return urlparse(url).path or "/"


def load_page_metrics(filename: str, prefix: str) -> pd.DataFrame:
    frame = pd.read_csv(GSC / filename)
    frame["path"] = frame["page"].map(path_only)
    return frame[["path", "clicks", "impressions", "ctr", "position"]].rename(
        columns={name: f"{prefix}_{name}" for name in ["clicks", "impressions", "ctr", "position"]}
    )


def main() -> None:
    page_queries = pd.read_csv(GSC / "last_90d_page_queries.csv")
    page_queries["path"] = page_queries["page"].map(path_only)
    current = load_page_metrics("current_28d_pages.csv", "current")
    prior = load_page_metrics("prior_28d_pages.csv", "prior")
    last90 = load_page_metrics("last_90d_pages.csv", "d90")
    metrics = last90.merge(current, on="path", how="left").merge(prior, on="path", how="left").fillna(0)

    lines = [
        "# Verified CTR Optimization Briefs",
        "",
        "The briefs below use only Search Console query/page evidence. Titles should match dominant intent without promising a result.",
        "",
    ]
    rows: list[dict[str, object]] = []
    for rank, path in enumerate(TARGETS, start=1):
        metric_rows = metrics[metrics["path"] == path]
        metric = metric_rows.iloc[0] if not metric_rows.empty else None
        queries = page_queries[page_queries["path"] == path].sort_values(
            ["impressions", "clicks"], ascending=False
        ).head(15)
        lines.extend([
            f"## {rank}. `{path}`",
            "",
        ])
        if metric is not None:
            lines.append(
                f"90 days: **{metric['d90_clicks']:.0f} clicks / {metric['d90_impressions']:.0f} impressions / {metric['d90_ctr']:.2%} CTR / position {metric['d90_position']:.1f}**. Current 28 days: **{metric['current_clicks']:.0f} clicks / {metric['current_impressions']:.0f} impressions**."
            )
            lines.append("")
        lines.extend([
            "| Query | Clicks | Impressions | CTR | Position |",
            "|---|---:|---:|---:|---:|",
        ])
        for _, query in queries.iterrows():
            lines.append(
                f"| {query['query']} | {query['clicks']:.0f} | {query['impressions']:.0f} | {query['ctr']:.2%} | {query['position']:.1f} |"
            )
            rows.append({
                "priority_rank": rank,
                "path": path,
                "query": query["query"],
                "clicks": query["clicks"],
                "impressions": query["impressions"],
                "ctr": query["ctr"],
                "position": query["position"],
            })
        lines.append("")

    pd.DataFrame(rows).to_csv(REPORT / "ctr-top-page-queries.csv", index=False)
    (REPORT / "ctr-optimization-briefs.md").write_text("\n".join(lines), encoding="utf-8")
    print(f"Built CTR briefs for {len(TARGETS)} canonical pages.")


if __name__ == "__main__":
    main()
