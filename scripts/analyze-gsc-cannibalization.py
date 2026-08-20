#!/usr/bin/env python3
"""Identify competing Solar Freedom URLs from verified GSC page-query data."""
from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import urlparse

import pandas as pd

ROOT = Path("/home/ubuntu/solar-freedom-main")
REPORT = ROOT / "reports/operator-review"
GSC_FILE = REPORT / "gsc/last_90d_page_queries.csv"
ELIGIBILITY = ROOT / "shared/index-eligibility.json"

INTENTS = [
    ("sunrun", ("sunrun",)),
    ("goodleap", ("goodleap", "loanpal")),
    ("blue_raven", ("blue raven",)),
    ("adt_solar", ("adt solar", "sunpro")),
    ("tesla_solarcity", ("tesla solar", "solarcity")),
    ("sunnova", ("sunnova",)),
    ("freedom_forever", ("freedom forever",)),
    ("vivint_solar", ("vivint solar",)),
    ("sunlight_financial", ("sunlight financial",)),
    ("complete_solaria", ("complete solaria",)),
    ("escalator_clause", ("escalator",)),
    ("rescission_cooling_off", ("rescission", "cooling off", "3 day", "three day", "right to cancel")),
    ("selling_home_with_solar", ("sell house", "selling house", "selling home", "transfer solar", "home sale")),
    ("bankruptcy_out_of_business", ("bankrupt", "bankruptcy", "out of business", "closed down")),
    ("complaint_reporting", ("file a complaint", "attorney general", "report solar", "solar complaint")),
    ("general_exit", ("cancel solar", "get out of solar", "solar contract help", "break solar contract", "solar cancellation")),
]


def path_only(url: str) -> str:
    return urlparse(url).path or "/"


def classify(query: str) -> str:
    normalized = re.sub(r"\s+", " ", query.lower()).strip()
    for intent, needles in INTENTS:
        if any(needle in normalized for needle in needles):
            return intent
    return "other"


def page_score(row: pd.Series) -> float:
    position_component = max(0.0, 50.0 - float(row["position"]))
    return float(row["clicks"]) * 1000 + float(row["impressions"]) * 2 + position_component


def eligible_paths() -> set[str]:
    data = json.loads(ELIGIBILITY.read_text(encoding="utf-8"))
    paths = {f"/blog/{slug}" for slug in data["blogSlugs"]}
    paths.update(f"/cancel-solar-contract/{slug}" for slug in data["citySlugs"])
    paths.update(f"/solar-contract-laws/{slug}" for slug in data["stateSlugs"])
    paths.update(f"/cancel-{slug}-solar-contract" for slug in data["companySlugs"])
    paths.update({"/", "/blog", "/how-it-works", "/solar-contract-help", "/solar-panel-scam", "/solar-exit-options", "/solar-lien-removal", "/solar-loan-help", "/selling-house-with-solar", "/solar-contract-laws", "/solar-companies"})
    return paths


def main() -> None:
    frame = pd.read_csv(GSC_FILE)
    frame["path"] = frame["page"].map(path_only)
    frame["intent"] = frame["query"].map(classify)
    frame["row_score"] = frame.apply(page_score, axis=1)
    eligible = eligible_paths()
    frame["eligible"] = frame["path"].isin(eligible)

    exact_records: list[dict[str, object]] = []
    for query, group in frame.groupby("query"):
        paths = group["path"].nunique()
        impressions = group["impressions"].sum()
        if paths < 2 or impressions < 2:
            continue
        ordered = group.sort_values(["clicks", "position", "impressions"], ascending=[False, True, False])
        winner = ordered.iloc[0]
        for _, row in ordered.iterrows():
            exact_records.append({
                "query": query,
                "intent": classify(query),
                "total_query_impressions": impressions,
                "competing_pages": paths,
                "winner_path": winner["path"],
                "path": row["path"],
                "is_winner": row["path"] == winner["path"],
                "eligible": row["eligible"],
                "clicks": row["clicks"],
                "impressions": row["impressions"],
                "ctr": row["ctr"],
                "position": row["position"],
            })
    exact = pd.DataFrame(exact_records)
    if not exact.empty:
        exact = exact.sort_values(["total_query_impressions", "query", "is_winner", "clicks"], ascending=[False, True, False, False])
    exact.to_csv(REPORT / "gsc-exact-query-cannibalization.csv", index=False)

    clustered = (
        frame[frame["intent"] != "other"]
        .groupby(["intent", "path", "eligible"], as_index=False)
        .agg(clicks=("clicks", "sum"), impressions=("impressions", "sum"), position_weight=("position", lambda values: 0.0))
    )
    # Recalculate weighted position without an opaque groupby lambda.
    weighted = frame[frame["intent"] != "other"].copy()
    weighted["weighted_position"] = weighted["position"] * weighted["impressions"]
    weighted = weighted.groupby(["intent", "path"], as_index=False).agg(
        weighted_position=("weighted_position", "sum"),
        weight=("impressions", "sum"),
    )
    clustered = clustered.drop(columns=["position_weight"]).merge(weighted, on=["intent", "path"], how="left")
    clustered["position"] = clustered.apply(
        lambda row: row["weighted_position"] / row["weight"] if row["weight"] else 0,
        axis=1,
    )
    clustered["score"] = clustered.apply(page_score, axis=1)
    clustered["rank_in_intent"] = clustered.groupby("intent")["score"].rank(method="first", ascending=False).astype(int)
    winners = clustered[clustered["rank_in_intent"] == 1][["intent", "path"]].rename(columns={"path": "winner_path"})
    clustered = clustered.merge(winners, on="intent", how="left")
    clustered = clustered.sort_values(["intent", "rank_in_intent"])
    clustered.to_csv(REPORT / "gsc-intent-cluster-cannibalization.csv", index=False)

    overlap_queries = 0 if exact.empty else exact["query"].nunique()
    lines = [
        "# GSC Cannibalization and Canonical-Winner Report",
        "",
        f"Verified 90-day page-query rows analyzed: **{len(frame):,}**. Exact queries served by multiple URLs: **{overlap_queries:,}**.",
        "",
        "## Intent winners",
        "",
        "| Intent | Winner | Clicks | Impressions | Position | Competing URLs |",
        "|---|---|---:|---:|---:|---:|",
    ]
    for intent, group in clustered.groupby("intent"):
        winner = group.sort_values("rank_in_intent").iloc[0]
        lines.append(
            f"| `{intent}` | `{winner['path']}` | {winner['clicks']:.0f} | {winner['impressions']:.0f} | {winner['position']:.1f} | {group['path'].nunique()} |"
        )

    lines.extend([
        "",
        "## Highest-volume exact-query overlap",
        "",
        "| Query | Winner | Competing URL | Impressions | Position | Eligible |",
        "|---|---|---|---:|---:|---|",
    ])
    if not exact.empty:
        losers = exact[~exact["is_winner"]].head(80)
        for _, row in losers.iterrows():
            lines.append(
                f"| {row['query']} | `{row['winner_path']}` | `{row['path']}` | {row['impressions']:.0f} | {row['position']:.1f} | {'yes' if row['eligible'] else 'no'} |"
            )

    lines.extend([
        "",
        "## Decision rule",
        "",
        "Redirect only when two URLs answer the same intent and the losing URL has no distinct value. Keep separate URLs when query modifiers show a different task, stage, company, jurisdiction, or fact pattern. Do not redirect a demonstrated winner to a generic page.",
        "",
    ])
    (REPORT / "gsc-cannibalization-report.md").write_text("\n".join(lines), encoding="utf-8")
    print(f"Analyzed {len(frame)} rows; {overlap_queries} exact overlapping queries; {clustered['intent'].nunique()} intent clusters.")


if __name__ == "__main__":
    main()
