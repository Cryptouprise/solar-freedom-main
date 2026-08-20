#!/usr/bin/env python3
"""Validate that curated topic-cluster URLs are canonical and index-eligible."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
CLUSTERS = ROOT / "client/src/data/topicClusters.ts"
SITEMAP = ROOT / "client/public/sitemap.xml"
REDIRECTS = ROOT / "shared/seo-redirects.json"
REPORT = ROOT / "reports/operator-review/topic-cluster-validation.md"

PRIORITY_PATHS = {
    "/blog/sunrun-solar-contract-cancellation-2026",
    "/blog/goodleap-solar-loan-cancellation-hidden-fees-2026",
    "/blog/how-to-get-out-of-a-solar-contract",
    "/blog/blue-raven-solar-complaints",
    "/blog/adt-solar-complaints",
    "/blog/new-jersey-solar-contract-rights",
}


def sitemap_paths() -> set[str]:
    xml = SITEMAP.read_text(encoding="utf-8")
    return {
        urlparse(match).path.rstrip("/") or "/"
        for match in re.findall(r"<loc>([^<]+)</loc>", xml)
    }


def main() -> int:
    source = CLUSTERS.read_text(encoding="utf-8")
    paths = re.findall(r"(?:pillarUrl|url):\s*[\"']([^\"']+)[\"']", source)
    sitemap = sitemap_paths()
    ledger = json.loads(REDIRECTS.read_text(encoding="utf-8"))
    redirect_sources = set(ledger.get("public", {})) | set(ledger.get("blog", {}))

    unique_paths = set(paths)
    redirect_leaks = sorted(unique_paths & redirect_sources)
    missing_sitemap = sorted(path for path in unique_paths if path not in sitemap)
    missing_priority = sorted(PRIORITY_PATHS - unique_paths)

    status = "PASS" if not (redirect_leaks or missing_sitemap or missing_priority) else "FAIL"
    rows = [
        ("Validation status", status),
        ("Cluster URL references", str(len(paths))),
        ("Unique canonical destinations", str(len(unique_paths))),
        ("Redirect-source leaks", str(len(redirect_leaks))),
        ("URLs absent from sitemap", str(len(missing_sitemap))),
        ("Missing priority winners", str(len(missing_priority))),
    ]

    lines = [
        "# Topic-Cluster Validation",
        "",
        "| Check | Result |",
        "| --- | ---: |",
        *[f"| {label} | {value} |" for label, value in rows],
        "",
    ]

    for title, values in (
        ("Redirect-source leaks", redirect_leaks),
        ("URLs absent from sitemap", missing_sitemap),
        ("Missing priority winners", missing_priority),
    ):
        lines.extend([f"## {title}", ""])
        if values:
            lines.extend(f"- `{value}`" for value in values)
        else:
            lines.append("None.")
        lines.append("")

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Topic-cluster validation: {status}")
    print(f"Report: {REPORT.relative_to(ROOT)}")
    return 0 if status == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
