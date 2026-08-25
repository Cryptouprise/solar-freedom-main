#!/usr/bin/env python3
"""Validate production HTML for priority AEO/GEO pages and the homepage entity surface."""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist/public"
REPORT = ROOT / "reports/operator-review/aeo-geo-artifact-validation.md"
ORG_ID = "https://breakyoursolarcontract.com/#organization"

PRIORITY_SLUGS = [
    "sunrun-solar-contract-cancellation-2026",
    "goodleap-solar-loan-cancellation-hidden-fees-2026",
    "how-to-get-out-of-a-solar-contract",
    "blue-raven-solar-complaints",
    "adt-solar-complaints",
    "new-jersey-solar-contract-rights",
]


def jsonld_nodes(soup: BeautifulSoup) -> list[dict[str, Any]]:
    nodes: list[dict[str, Any]] = []
    for tag in soup.select('script[type="application/ld+json"]'):
        try:
            payload = json.loads(tag.string or tag.get_text())
        except (TypeError, json.JSONDecodeError):
            continue
        if isinstance(payload, dict):
            nodes.append(payload)
        elif isinstance(payload, list):
            nodes.extend(item for item in payload if isinstance(item, dict))
    return nodes


def has_type(nodes: list[dict[str, Any]], schema_type: str) -> bool:
    return any(node.get("@type") == schema_type for node in nodes)


def page_row(slug: str) -> tuple[dict[str, Any], list[str]]:
    path = DIST / "blog" / slug / "index.html"
    errors: list[str] = []
    if not path.exists():
        return {"page": slug, "status": "FAIL"}, ["Generated HTML missing"]

    html = path.read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")
    nodes = jsonld_nodes(soup)
    article = next((node for node in nodes if node.get("@type") == "Article"), {})
    faq = next((node for node in nodes if node.get("@type") == "FAQPage"), {})
    text = soup.get_text(" ", strip=True)

    robots = soup.find("meta", attrs={"name": "robots"})
    robots_value = (robots.get("content", "") if robots else "").lower()
    canonical = soup.find("link", attrs={"rel": "canonical"})
    expected_canonical = f"https://breakyoursolarcontract.com/blog/{slug}"

    if "noindex" in robots_value:
        errors.append("Priority page is noindex")
    if not canonical or canonical.get("href") != expected_canonical:
        errors.append("Canonical mismatch")
    if not article:
        errors.append("Article schema missing")
    if article.get("author", {}).get("@id") != ORG_ID:
        errors.append("Organization author ID missing or inconsistent")
    if article.get("publisher", {}).get("@id") != ORG_ID:
        errors.append("Organization publisher ID missing or inconsistent")
    citations = article.get("citation") or []
    if not citations:
        errors.append("Article schema has no visible-source citations")
    elif any(url not in html for url in citations):
        errors.append("Schema citation is not visible in source HTML")
    if has_type(nodes, "VideoObject"):
        errors.append("Placeholder VideoObject remains")
    if any("speakable" in node for node in nodes):
        errors.append("Unsupported Speakable markup remains")
    if faq:
        questions = [item.get("name", "") for item in faq.get("mainEntity", [])]
        missing_questions = [question for question in questions if question and question not in text]
        if missing_questions:
            errors.append("FAQ schema questions are not all visible")
    if "Editorial method" not in text:
        errors.append("Editorial method is not source-visible")
    if "Solar Freedom Legal Research Team" in html or "Written by attorneys" in html:
        errors.append("Unsupported reviewer or attorney claim remains")

    return {
        "page": f"/blog/{slug}",
        "article": "yes" if article else "no",
        "citations": len(citations),
        "faq": "yes" if faq else "no",
        "robots": robots_value or "default index",
        "status": "PASS" if not errors else "FAIL",
    }, errors


def homepage_errors() -> tuple[dict[str, Any], list[str]]:
    path = DIST / "index.html"
    html = path.read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")
    nodes = jsonld_nodes(soup)
    text = soup.get_text(" ", strip=True)
    errors: list[str] = []

    organization = next((node for node in nodes if node.get("@type") == "Organization"), {})
    website = next((node for node in nodes if node.get("@type") == "WebSite"), {})
    faq = next((node for node in nodes if node.get("@type") == "FAQPage"), {})
    if organization.get("@id") != ORG_ID:
        errors.append("Source-visible Organization entity missing")
    if website.get("@id") != "https://breakyoursolarcontract.com/#website":
        errors.append("Source-visible WebSite entity missing")
    if "medium.com/@solarfreedom" in html:
        errors.append("Dead Medium sameAs identifier remains")
    if not faq:
        errors.append("Source-visible homepage FAQ schema missing")
    else:
        questions = [item.get("name", "") for item in faq.get("mainEntity", [])]
        if any(question and question not in text for question in questions):
            errors.append("Homepage FAQ schema is not in visible parity")

    return {
        "page": "/",
        "article": "n/a",
        "citations": 0,
        "faq": "yes" if faq else "no",
        "robots": "default index",
        "status": "PASS" if not errors else "FAIL",
    }, errors


def main() -> int:
    results: list[dict[str, Any]] = []
    failures: dict[str, list[str]] = {}
    for slug in PRIORITY_SLUGS:
        row, errors = page_row(slug)
        results.append(row)
        if errors:
            failures[row["page"]] = errors

    home_row, home_failures = homepage_errors()
    results.append(home_row)
    if home_failures:
        failures["/"] = home_failures

    lines = [
        "# AEO/GEO Production Artifact Validation",
        "",
        "| Page | Article | Citations | FAQ | Robots | Status |",
        "| --- | --- | ---: | --- | --- | --- |",
    ]
    for row in results:
        lines.append(
            f"| `{row['page']}` | {row['article']} | {row['citations']} | {row['faq']} | {row['robots']} | **{row['status']}** |"
        )
    lines.extend(["", "## Failures", ""])
    if not failures:
        lines.append("None.")
    else:
        for page, errors in failures.items():
            lines.append(f"### `{page}`")
            lines.extend(f"- {error}" for error in errors)
            lines.append("")

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Validated {len(results)} generated pages; failures={len(failures)}")
    print(f"Report: {REPORT.relative_to(ROOT)}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
