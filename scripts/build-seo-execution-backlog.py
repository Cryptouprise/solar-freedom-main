#!/usr/bin/env python3
"""Build a deterministic SEO recovery backlog from verified GSC and live audit evidence."""
from __future__ import annotations

import json
import math
from pathlib import Path
from urllib.parse import urlparse

import pandas as pd

ROOT = Path("/home/ubuntu/solar-freedom-main")
REPORT = ROOT / "reports/operator-review"
GSC = REPORT / "gsc"

ISSUE_SEVERITY = {
    "status_error": 100,
    "noindex": 95,
    "missing_title": 90,
    "missing_description": 80,
    "missing_canonical": 75,
    "duplicate_title": 65,
    "canonical_mismatch": 55,
    "canonical_origin_mismatch": 50,
    "duplicate_description": 50,
    "missing_json_ld": 45,
    "invalid_json_ld": 45,
    "thin_content": 40,
    "multiple_h1": 35,
    "low_internal_links": 30,
    "short_title": 25,
    "short_description": 25,
    "long_title": 20,
    "long_description": 20,
    "low_image_alt_coverage": 20,
}

COMMERCIAL_PATTERNS = (
    "cancel-", "how-to-get-out", "solar-contract-help", "solar-loan-help",
    "solar-exit-options", "solar-lien-removal", "selling-house-with-solar",
)

TEMPLATE_TYPES = {"city_page", "state_law", "company_page"}


def path_only(url: str) -> str:
    return urlparse(url).path or "/"


def load_pages(name: str, prefix: str) -> pd.DataFrame:
    frame = pd.read_csv(GSC / f"{name}_pages.csv")
    frame["path"] = frame["page"].map(path_only)
    frame["position_weight"] = frame["position"] * frame["impressions"]
    grouped = frame.groupby("path", as_index=False).agg(
        clicks=("clicks", "sum"),
        impressions=("impressions", "sum"),
        position_weight=("position_weight", "sum"),
    )
    grouped["ctr"] = grouped.apply(
        lambda row: row["clicks"] / row["impressions"] if row["impressions"] else 0,
        axis=1,
    )
    grouped["position"] = grouped.apply(
        lambda row: row["position_weight"] / row["impressions"] if row["impressions"] else 0,
        axis=1,
    )
    return grouped[["path", "clicks", "impressions", "ctr", "position"]].rename(
        columns={column: f"{prefix}_{column}" for column in ("clicks", "impressions", "ctr", "position")}
    )


def is_commercial(path: str) -> bool:
    return any(pattern in path for pattern in COMMERCIAL_PATTERNS)


def main() -> None:
    audit = json.loads((REPORT / "production-seo-audit.json").read_text(encoding="utf-8"))
    rows = []
    for page in audit["pages"]:
        issue_codes = [issue["code"] for issue in page.get("issues", [])]
        rows.append({
            "path": page["path"],
            "page_type": page["type"],
            "http_status": page.get("status", 0),
            "audit_score": page.get("score", 0),
            "issues": ",".join(issue_codes),
            "issue_severity": sum(ISSUE_SEVERITY.get(code, 10) for code in issue_codes),
            "word_count": page.get("metrics", {}).get("wordCount", 0),
            "title": page.get("metrics", {}).get("title", ""),
        })
    frame = pd.DataFrame(rows)

    current = load_pages("current_28d", "current")
    prior = load_pages("prior_28d", "prior")
    ninety = load_pages("last_90d", "d90")
    frame = frame.merge(current, on="path", how="outer").merge(prior, on="path", how="outer").merge(ninety, on="path", how="outer")

    numeric = [column for column in frame.columns if any(column.startswith(prefix) for prefix in ("current_", "prior_", "d90_"))]
    frame[numeric] = frame[numeric].fillna(0)
    frame["page_type"] = frame["page_type"].fillna("not_in_sitemap")
    frame["issues"] = frame["issues"].fillna("")
    frame["issue_severity"] = frame["issue_severity"].fillna(0)
    frame["audit_score"] = frame["audit_score"].fillna(0)
    frame["word_count"] = frame["word_count"].fillna(0)
    frame["http_status"] = frame["http_status"].fillna(0)
    frame["title"] = frame["title"].fillna("")

    frame["impression_loss_28d"] = (frame["prior_impressions"] - frame["current_impressions"]).clip(lower=0)
    frame["click_loss_28d"] = (frame["prior_clicks"] - frame["current_clicks"]).clip(lower=0)
    frame["commercial_intent"] = frame["path"].map(is_commercial)
    frame["template_cluster"] = frame["page_type"].isin(TEMPLATE_TYPES)
    frame["no_90d_evidence"] = (frame["d90_impressions"] == 0) & (frame["d90_clicks"] == 0)
    frame["thin_or_template_risk"] = frame["template_cluster"] & ((frame["word_count"] < 500) | frame["no_90d_evidence"])

    demand = frame["d90_impressions"].map(lambda value: math.log1p(value) * 12) + frame["d90_clicks"] * 1.8
    recoverability = frame["impression_loss_28d"].map(lambda value: math.log1p(value) * 10) + frame["click_loss_28d"] * 2
    position_bonus = frame["d90_position"].map(lambda pos: 24 if 1 <= pos <= 10 else 14 if pos <= 20 and pos > 0 else 5 if pos <= 40 and pos > 0 else 0)
    technical = frame["issue_severity"].clip(upper=160) * 0.7
    commercial = frame["commercial_intent"].astype(int) * 15
    spam_recovery = frame["thin_or_template_risk"].astype(int) * 20
    frame["priority_score"] = (demand + recoverability + position_bonus + technical + commercial + spam_recovery).round(1)

    def action(row: pd.Series) -> str:
        issues = set(filter(None, str(row["issues"]).split(",")))
        if {"status_error", "noindex", "missing_canonical"} & issues:
            return "repair_technical_now"
        if {"duplicate_title", "duplicate_description", "canonical_mismatch"} & issues:
            return "consolidate_or_differentiate"
        if row["d90_impressions"] >= 100 or row["d90_clicks"] >= 2 or row["impression_loss_28d"] >= 50:
            return "protect_rewrite_and_relaunch"
        if row["template_cluster"] and row["no_90d_evidence"]:
            return "remove_from_index_or_consolidate"
        if row["template_cluster"] and row["word_count"] < 500:
            return "source_enrich_or_noindex"
        if row["page_type"] == "blog_post" and row["no_90d_evidence"]:
            return "quarantine_until_original_value"
        if "long_title" in issues or "short_title" in issues or "long_description" in issues:
            return "metadata_cleanup_after_recovery"
        return "monitor_or_low_priority"

    frame["recommended_action"] = frame.apply(action, axis=1)
    frame = frame.sort_values(["priority_score", "d90_impressions", "issue_severity"], ascending=False)
    frame.to_csv(REPORT / "seo-master-execution-backlog.csv", index=False)

    action_counts = frame.groupby("recommended_action").size().sort_values(ascending=False)
    top = frame.head(50)
    lines = [
        "# Solar Freedom Deterministic SEO Execution Backlog",
        "",
        "This backlog combines verified 90-day Search Console demand, current-versus-prior losses, the live 295-URL audit, commercial intent, and template/scaled-content risk. The score orders work; it does not predict guaranteed traffic.",
        "",
        "## Action inventory",
        "",
        "| Action | URLs |",
        "|---|---:|",
    ]
    for action_name, count in action_counts.items():
        lines.append(f"| `{action_name}` | {int(count)} |")

    lines.extend([
        "",
        "## Top 50 execution order",
        "",
        "| Rank | URL | Action | Score | 90d Clicks | 90d Impressions | 90d Position | Lost Impressions | Issues |",
        "|---:|---|---|---:|---:|---:|---:|---:|---|",
    ])
    for rank, (_, row) in enumerate(top.iterrows(), start=1):
        lines.append(
            f"| {rank} | `{row['path']}` | `{row['recommended_action']}` | {row['priority_score']:.1f} | {row['d90_clicks']:.0f} | {row['d90_impressions']:.0f} | {row['d90_position']:.1f} | {row['impression_loss_28d']:.0f} | {row['issues'] or 'none'} |"
        )

    lines.extend([
        "",
        "## Non-negotiable execution rule",
        "",
        "Pages with demonstrated demand are protected and improved first. Thin template pages with no 90-day evidence are not expanded in bulk; they are removed from discovery, consolidated, or held noindex until they contain original, source-backed value.",
        "",
    ])
    (REPORT / "seo-master-execution-backlog.md").write_text("\n".join(lines), encoding="utf-8")
    print(f"Backlog created for {len(frame)} URLs; top score {frame.iloc[0]['priority_score']:.1f}.")


if __name__ == "__main__":
    main()
