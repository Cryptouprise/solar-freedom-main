#!/usr/bin/env python3
"""Quarantine every currently indexable URL flagged by the launch-gate claim scan.

The script changes only the shared index-eligibility ledger. The content remains in
source control and can be re-approved later; generation code applies noindex and
removes it from sitemap/AI inventories from this one source of truth.
"""
from __future__ import annotations

import csv
import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEDGER = ROOT / "shared/index-eligibility.json"
FINDINGS = ROOT / "reports/operator-review/trust-claims/indexable-trust-claim-findings.csv"
REPORT = ROOT / "reports/operator-review/trust-claims/quarantine-manifest.md"


def main() -> None:
    ledger = json.loads(LEDGER.read_text(encoding="utf-8"))
    flagged: dict[str, set[str]] = {}
    with FINDINGS.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            flagged.setdefault(row["path"], set()).add(row["code"])

    blog_before = set(ledger["blogSlugs"])
    state_before = set(ledger["stateSlugs"])
    blog_remove: set[str] = set()
    state_remove: set[str] = set()
    unsupported: list[str] = []

    for page_path in sorted(flagged):
        if page_path.startswith("/blog/"):
            slug = page_path.removeprefix("/blog/")
            if slug in blog_before:
                blog_remove.add(slug)
            else:
                unsupported.append(page_path)
        elif page_path.startswith("/solar-contract-laws/"):
            slug = page_path.removeprefix("/solar-contract-laws/")
            if slug in state_before:
                state_remove.add(slug)
            else:
                unsupported.append(page_path)
        else:
            unsupported.append(page_path)

    if unsupported:
        raise SystemExit(f"Flagged paths cannot be quarantined through the shared ledger: {unsupported}")

    ledger["blogSlugs"] = [slug for slug in ledger["blogSlugs"] if slug not in blog_remove]
    ledger["stateSlugs"] = [slug for slug in ledger["stateSlugs"] if slug not in state_remove]
    ledger["trustQuarantine"] = {
        "updatedAt": str(date.today()),
        "reason": "Unsupported legal, outcome, fee, timeline, complaint, or authority claims found by the pre-deployment source-governance launch gate.",
        "paths": [
            {
                "path": page_path,
                "issueCodes": sorted(flagged[page_path]),
                "action": "noindex; exclude from sitemap and AI inventories until a source-backed rewrite passes the claim scan",
            }
            for page_path in sorted(flagged)
        ],
    }
    LEDGER.write_text(json.dumps(ledger, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# Trust-Risk Quarantine Manifest",
        "",
        "| Metric | Count |",
        "| --- | ---: |",
        f"| Blog pages removed from index eligibility | {len(blog_remove)} |",
        f"| State-law pages removed from index eligibility | {len(state_remove)} |",
        f"| Total quarantined search URLs | {len(blog_remove) + len(state_remove)} |",
        "",
        "> Quarantine is reversible. Content remains in the repository, but each listed URL will receive `noindex` and be omitted from the sitemap and AI-readable inventories until it is rewritten from reviewed primary sources and passes the claim gate.",
        "",
        "## Quarantined URLs",
        "",
        "| URL | Issue codes | Action |",
        "| --- | --- | --- |",
    ]
    for page_path in sorted(flagged):
        codes = ", ".join(sorted(flagged[page_path]))
        lines.append(f"| `{page_path}` | `{codes}` | Noindex; remove from sitemap and AI inventories |")
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(json.dumps({
        "blog_removed": sorted(blog_remove),
        "state_removed": sorted(state_remove),
        "total_quarantined": len(blog_remove) + len(state_remove),
    }))


if __name__ == "__main__":
    main()
