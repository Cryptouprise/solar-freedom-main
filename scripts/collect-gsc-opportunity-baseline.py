#!/usr/bin/env python3
"""Collect read-only GSC page/query evidence for deterministic SEO prioritization."""
from __future__ import annotations

import csv
import json
from datetime import date, timedelta
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build

SITE = "sc-domain:breakyoursolarcontract.com"
KEY_PATH = Path("/home/ubuntu/skills/gsc-ga4/references/gsc-key.json")
OUT_DIR = Path("/home/ubuntu/solar-freedom-main/reports/operator-review/gsc")
SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]
DATA_LAG_DAYS = 3
ROW_LIMIT = 25000


def window_ending(end_date: date, days: int) -> tuple[date, date]:
    return end_date - timedelta(days=days - 1), end_date


def prior_window(start_date: date, days: int) -> tuple[date, date]:
    prior_end = start_date - timedelta(days=1)
    return window_ending(prior_end, days)


def query(service, start: date, end: date, dimensions: list[str]) -> list[dict]:
    body = {
        "startDate": start.isoformat(),
        "endDate": end.isoformat(),
        "dimensions": dimensions,
        "rowLimit": ROW_LIMIT,
        "startRow": 0,
        "dataState": "final",
        "type": "web",
    }
    response = service.searchanalytics().query(siteUrl=SITE, body=body).execute()
    rows = []
    for row in response.get("rows", []):
        values = {dimension: row.get("keys", [])[index] for index, dimension in enumerate(dimensions)}
        values.update({
            "clicks": float(row.get("clicks", 0)),
            "impressions": float(row.get("impressions", 0)),
            "ctr": float(row.get("ctr", 0)),
            "position": float(row.get("position", 0)),
        })
        rows.append(values)
    return rows


def write_csv(path: Path, rows: list[dict], dimensions: list[str]) -> None:
    fieldnames = dimensions + ["clicks", "impressions", "ctr", "position"]
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def summarize(rows: list[dict]) -> dict:
    return {
        "rows": len(rows),
        "clicks": round(sum(row["clicks"] for row in rows), 2),
        "impressions": round(sum(row["impressions"] for row in rows), 2),
    }


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    credentials = service_account.Credentials.from_service_account_file(KEY_PATH, scopes=SCOPES)
    service = build("searchconsole", "v1", credentials=credentials, cache_discovery=False)

    end = date.today() - timedelta(days=DATA_LAG_DAYS)
    current_start, current_end = window_ending(end, 28)
    prior_start, prior_end = prior_window(current_start, 28)
    ninety_start, ninety_end = window_ending(end, 90)

    periods = {
        "current_28d": (current_start, current_end),
        "prior_28d": (prior_start, prior_end),
        "last_90d": (ninety_start, ninety_end),
    }
    dimensions = {
        "pages": ["page"],
        "queries": ["query"],
        "page_queries": ["page", "query"],
        "dates": ["date"],
        "page_dates": ["page", "date"],
    }

    manifest = {
        "site": SITE,
        "retrieved_at": date.today().isoformat(),
        "data_lag_days": DATA_LAG_DAYS,
        "periods": {},
    }

    for period_name, (start, finish) in periods.items():
        manifest["periods"][period_name] = {
            "start_date": start.isoformat(),
            "end_date": finish.isoformat(),
            "datasets": {},
        }
        for dataset_name, dims in dimensions.items():
            rows = query(service, start, finish, dims)
            csv_path = OUT_DIR / f"{period_name}_{dataset_name}.csv"
            write_csv(csv_path, rows, dims)
            manifest["periods"][period_name]["datasets"][dataset_name] = {
                **summarize(rows),
                "file": str(csv_path),
            }

    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
