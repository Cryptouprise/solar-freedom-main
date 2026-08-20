#!/usr/bin/env python3
"""Analyze Solar Freedom's verified GSC visibility collapse and rank recovery targets."""
from __future__ import annotations

from pathlib import Path
from urllib.parse import urlparse

import pandas as pd

ROOT = Path("/home/ubuntu/solar-freedom-main")
DATA = ROOT / "reports/operator-review/gsc"
OUT = ROOT / "reports/operator-review"


def path_only(url: str) -> str:
    return urlparse(url).path or "/"


def expected_ctr(position: float) -> float:
    if position <= 1.5:
        return 0.28
    if position <= 3:
        return 0.15
    if position <= 5:
        return 0.08
    if position <= 10:
        return 0.035
    if position <= 20:
        return 0.015
    return 0.005


def load_period(name: str) -> pd.DataFrame:
    frame = pd.read_csv(DATA / f"{name}_pages.csv")
    frame["path"] = frame["page"].map(path_only)
    return frame


def main() -> None:
    current = load_period("current_28d")
    prior = load_period("prior_28d")
    ninety = load_period("last_90d")

    current_small = current[["path", "clicks", "impressions", "ctr", "position"]].rename(
        columns={column: f"current_{column}" for column in ["clicks", "impressions", "ctr", "position"]}
    )
    prior_small = prior[["path", "clicks", "impressions", "ctr", "position"]].rename(
        columns={column: f"prior_{column}" for column in ["clicks", "impressions", "ctr", "position"]}
    )
    delta = prior_small.merge(current_small, on="path", how="outer").fillna(0)
    delta["click_change"] = delta["current_clicks"] - delta["prior_clicks"]
    delta["impression_change"] = delta["current_impressions"] - delta["prior_impressions"]
    delta["impression_loss"] = (delta["prior_impressions"] - delta["current_impressions"]).clip(lower=0)
    delta["click_loss"] = (delta["prior_clicks"] - delta["current_clicks"]).clip(lower=0)
    delta = delta.sort_values(["impression_loss", "click_loss"], ascending=False)
    delta.to_csv(OUT / "gsc-page-period-deltas.csv", index=False)

    ninety = ninety.copy()
    ninety["expected_ctr"] = ninety["position"].map(expected_ctr)
    ninety["modeled_click_upside"] = (ninety["impressions"] * ninety["expected_ctr"] - ninety["clicks"]).clip(lower=0)
    ninety["priority_score"] = (
        ninety["modeled_click_upside"] * 100
        + ninety["impressions"] * 0.02
        + ninety["clicks"] * 2
        - (ninety["position"] - 10).clip(lower=0) * 0.1
    )
    opportunities = ninety.sort_values(["priority_score", "impressions"], ascending=False)
    opportunities.to_csv(OUT / "gsc-ranked-recovery-opportunities.csv", index=False)

    daily = pd.read_csv(DATA / "last_90d_dates.csv")
    daily["date"] = pd.to_datetime(daily["date"])
    daily = daily.sort_values("date")
    daily["impressions_7d"] = daily["impressions"].rolling(7, min_periods=7).mean()
    daily["clicks_7d"] = daily["clicks"].rolling(7, min_periods=7).mean()
    daily["impression_7d_change"] = daily["impressions_7d"].diff()
    inflection_row = daily.loc[daily["impression_7d_change"].idxmin()]

    pre = daily[(daily["date"] >= pd.Timestamp("2026-06-19")) & (daily["date"] <= pd.Timestamp("2026-06-25"))]
    post = daily[(daily["date"] >= pd.Timestamp("2026-06-26")) & (daily["date"] <= pd.Timestamp("2026-07-02"))]

    current_clicks = current["clicks"].sum()
    current_impressions = current["impressions"].sum()
    prior_clicks = prior["clicks"].sum()
    prior_impressions = prior["impressions"].sum()
    click_pct = ((current_clicks - prior_clicks) / prior_clicks * 100) if prior_clicks else 0
    impression_pct = ((current_impressions - prior_impressions) / prior_impressions * 100) if prior_impressions else 0

    top_losses = delta.head(15)
    top_opportunities = opportunities.head(15)

    lines = [
        "# Verified GSC Visibility Collapse Analysis",
        "",
        "## Headline",
        "",
        f"Current 28 days recorded **{current_clicks:.0f} clicks and {current_impressions:.0f} impressions**, versus **{prior_clicks:.0f} clicks and {prior_impressions:.0f} impressions** in the prior 28 days. That is a **{click_pct:.1f}% click change** and **{impression_pct:.1f}% impression change**.",
        "",
        f"The sharp break begins on **2026-06-26**: average daily impressions fell from **{pre['impressions'].mean():.1f}** during June 19–25 to **{post['impressions'].mean():.1f}** during June 26–July 2. The largest seven-day rolling deterioration is centered on **{inflection_row['date'].date().isoformat()}**.",
        "",
        "## Largest page-level losses",
        "",
        "| Page | Prior Clicks | Current Clicks | Prior Impressions | Current Impressions | Prior Position | Current Position |",
        "|---|---:|---:|---:|---:|---:|---:|",
    ]
    for _, row in top_losses.iterrows():
        lines.append(
            f"| `{row['path']}` | {row['prior_clicks']:.0f} | {row['current_clicks']:.0f} | {row['prior_impressions']:.0f} | {row['current_impressions']:.0f} | {row['prior_position']:.1f} | {row['current_position']:.1f} |"
        )

    lines.extend([
        "",
        "## Highest modeled recovery opportunities from the verified 90-day portfolio",
        "",
        "> The upside estimate uses a fixed CTR-by-position curve only to order work. It is not a traffic guarantee.",
        "",
        "| Page | Clicks | Impressions | Position | CTR | Modeled Additional Clicks |",
        "|---|---:|---:|---:|---:|---:|",
    ])
    for _, row in top_opportunities.iterrows():
        lines.append(
            f"| `{row['path']}` | {row['clicks']:.0f} | {row['impressions']:.0f} | {row['position']:.1f} | {row['ctr'] * 100:.2f}% | {row['modeled_click_upside']:.1f} |"
        )

    lines.extend([
        "",
        "## Deterministic decision",
        "",
        "The collapse predates the current 28-day period and is sitewide enough that recovery must begin with indexation, rendering, canonical, redirect, and content-quality change correlation around June 26. CTR optimization remains secondary until the cause of the visibility loss is repaired.",
        "",
    ])
    (OUT / "gsc-visibility-collapse-analysis.md").write_text("\n".join(lines), encoding="utf-8")
    print("Wrote GSC collapse analysis and ranked recovery datasets.")


if __name__ == "__main__":
    main()
