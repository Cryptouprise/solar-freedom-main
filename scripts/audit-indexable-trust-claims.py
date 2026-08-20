#!/usr/bin/env python3
"""Audit source-visible claims on every indexable URL in the generated sitemap."""
from __future__ import annotations

import csv
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist/public"
SITEMAP = ROOT / "client/public/sitemap.xml"
OUT_DIR = ROOT / "reports/operator-review/trust-claims"


@dataclass(frozen=True)
class Rule:
    code: str
    severity: str
    pattern: re.Pattern[str]
    rationale: str


RULES = [
    Rule("UNVERIFIED_ATTORNEY_AUTHORSHIP", "critical", re.compile(r"\b(?:written|reviewed) by (?:an? )?attorney|\bour (?:attorneys|legal team)\b|\blicensed (?:attorney|counsel)|\battorney[- ]reviewed\b", re.I), "Professional identity or review claim requires a named, verifiable reviewer."),
    Rule("UNVERIFIED_EXPERTISE", "high", re.compile(r"\b(?:our|Solar Freedom(?:'s)?) (?:consumer protection specialists?|solar contract law experts?|legal experts?)\b", re.I), "First-party expertise claims require attributable credentials and review evidence."),
    Rule("UNVERIFIED_FIRST_PARTY_RESULT", "critical", re.compile(r"\b(?:success rate|homeowners (?:helped|freed)|contracts? (?:cancelled|canceled)|average resolution time|avg\. resolution time)\b|\b(?:we|Solar Freedom) (?:have )?(?:cancelled|canceled|saved|recovered|secured|won)\b", re.I), "First-party results require auditable case-level evidence."),
    Rule("GUARANTEED_OR_CERTAIN_RESULT", "critical", re.compile(r"\b(?:we|Solar Freedom) guarantee\b|\bwill (?:cancel|void|eliminate|erase) (?:your|the)\b|\bcontract (?:will be|is) (?:cancelled|canceled|void)\b|\bno more payments\b|\bdebt (?:erased|eliminated)\b", re.I), "Outcome certainty is not supportable from general information."),
    Rule("UNIVERSAL_CANCELLATION_RIGHT", "critical", re.compile(r"\byou (?:have|retain) (?:a |the )?(?:legal )?right to cancel\b|\byou can cancel\b|\bmay still be legally open\b|\bwindow (?:is|remains) (?:still )?open\b|\bprovide(?:s)? grounds for (?:post-install )?cancellation\b|\ballow(?:s)? (?:you|homeowners|consumers) to (?:cancel|void)\b", re.I), "Cancellation rights depend on transaction facts, documents, timing, and jurisdiction."),
    Rule("FREE_EQUIPMENT_OR_PAYMENT_CLAIM", "critical", re.compile(r"\bkeep (?:the )?(?:solar )?(?:panels|equipment|system) (?:for )?free\b|(?<!do not )(?<!not to )\bstop (?:all )?payments\b|\bpay nothing\b", re.I), "Payment and equipment outcomes require contract-specific proof."),
    Rule("FIXED_SAVINGS_OR_BUYOUT", "high", re.compile(r"\b(?:save|reduce|reduced|discount|buyout)[^.!?]{0,60}\b\d{1,3}%\b|\b\d{1,3}% (?:less|reduction|savings)\b", re.I), "Quantified savings or buyout claims require documented methodology and evidence."),
    Rule("FIXED_TIMELINE", "high", re.compile(r"\b(?:results?|resolution|resolve(?:d)?) (?:in|within) \d{1,3}(?:[–-]\d{1,3})? (?:business )?(?:days|weeks|months)\b|\btypically takes? \d{1,3}(?:[–-]\d{1,3})? (?:days|weeks|months)\b", re.I), "Fixed process timelines are unsupported without current operational evidence."),
    Rule("UNVERIFIED_FEE_ARRANGEMENT", "high", re.compile(r"\bno upfront (?:cost|fee)s?\b|\bcontingency (?:basis|fee)\b|\byou (?:pay|owe) nothing unless\b", re.I), "Fee arrangements require current written engagement terms."),
    Rule("BANKRUPTCY_OR_CLOSURE_ASSERTION", "high", re.compile(r"\b(?:filed for|in) bankruptcy\b|\b(?:is|has|was) (?:shut(?:ting)? down|closed|out of business|bankrupt)\b|\bceased operations\b", re.I), "Company-status claims require current primary-source verification and dates."),
    Rule("UNVERIFIED_COMPLAINT_OR_RATING_COUNT", "high", re.compile(r"\b\d[\d,]*\+? (?:BBB )?complaints\b|\bBBB (?:rating|grade)\b|\b[1-5](?:\.\d)?[- ]star rating\b", re.I), "Complaint totals and ratings change and require dated source evidence."),
    Rule("UNVERIFIED_DEALER_FEE", "high", re.compile(r"\bdealer fees? (?:of |up to |as high as |\()?\d{1,3}%\b|\b\d{1,3}% (?:dealer |hidden )fees?\b", re.I), "Quantified dealer-fee claims require agreement-level, regulator, or documented methodology evidence."),
    Rule("EXTENDED_RESCISSION_CLAIM", "critical", re.compile(r"\b(?:rescission|cancellation|cooling[- ]off) (?:right|window)[^.!?]{0,100}\b(?:years?|months?) later\b|\bregardless of how long ago\b", re.I), "Extended rescission conclusions require qualified, fact-specific legal review."),
    Rule("UNVERIFIED_TESTIMONIAL", "critical", re.compile(r"\b(?:client|homeowner|customer) (?:testimonial|success story)\b|\bwhat our clients say\b", re.I), "Testimonials require source, consent, and verification metadata."),
]


def sitemap_paths() -> list[str]:
    xml = SITEMAP.read_text(encoding="utf-8")
    urls = re.findall(r"<loc>([^<]+)</loc>", xml)
    return [urlparse(url).path.rstrip("/") or "/" for url in urls]


def artifact_path(page_path: str) -> Path:
    return DIST / "index.html" if page_path == "/" else DIST / page_path.lstrip("/") / "index.html"


def sentences(text: str) -> list[str]:
    normalized = re.sub(r"\s+", " ", text).strip()
    return [part.strip() for part in re.split(r"(?<=[.!?])\s+|\s*[|•]\s*", normalized) if part.strip()]


def should_skip(rule: Rule, sentence: str) -> bool:
    lower = sentence.lower()
    if rule.code == "FREE_EQUIPMENT_OR_PAYMENT_CLAIM" and (
        "do not stop" in lower or "not stop payments" in lower
    ):
        return True
    if rule.code == "UNIVERSAL_CANCELLATION_RIGHT" and (
        "whether you can cancel depends" in lower
        or "can cancel depends on" in lower
        or "covers certain" in lower
        or "cancel certain" in lower
    ):
        return True
    if rule.code == "BANKRUPTCY_OR_CLOSURE_ASSERTION" and (
        lower.startswith("if ")
        or "what steps should" in lower
        or "verify whether" in lower
        or "confirm your installer is" in lower
    ):
        return True
    return False


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    findings: list[dict[str, str]] = []
    missing: list[str] = []
    pages = sitemap_paths()

    for page_path in pages:
        html_path = artifact_path(page_path)
        if not html_path.exists():
            missing.append(page_path)
            continue
        soup = BeautifulSoup(html_path.read_text(encoding="utf-8"), "html.parser")
        for node in soup(["script", "style", "noscript"]):
            node.decompose()
        visible_text = soup.get_text(" ", strip=True)
        seen: set[tuple[str, str]] = set()
        for sentence in sentences(visible_text):
            for rule in RULES:
                if not rule.pattern.search(sentence) or should_skip(rule, sentence):
                    continue
                key = (rule.code, sentence)
                if key in seen:
                    continue
                seen.add(key)
                findings.append({
                    "path": page_path,
                    "severity": rule.severity,
                    "code": rule.code,
                    "snippet": sentence[:600],
                    "rationale": rule.rationale,
                })

    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    findings.sort(key=lambda row: (severity_order.get(row["severity"], 9), row["path"], row["code"]))

    csv_path = OUT_DIR / "indexable-trust-claim-findings.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["path", "severity", "code", "snippet", "rationale"])
        writer.writeheader()
        writer.writerows(findings)

    grouped: dict[str, list[dict[str, str]]] = {}
    for finding in findings:
        grouped.setdefault(finding["path"], []).append(finding)

    summary = {
        "sitemap_pages": len(pages),
        "pages_with_findings": len(grouped),
        "finding_count": len(findings),
        "critical_count": sum(item["severity"] == "critical" for item in findings),
        "high_count": sum(item["severity"] == "high" for item in findings),
        "missing_artifacts": missing,
    }
    (OUT_DIR / "summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# Indexable Trust-Claim Audit",
        "",
        "| Metric | Count |",
        "| --- | ---: |",
        f"| Sitemap URLs audited | {summary['sitemap_pages']} |",
        f"| Pages with findings | {summary['pages_with_findings']} |",
        f"| Critical findings | {summary['critical_count']} |",
        f"| High findings | {summary['high_count']} |",
        f"| Missing generated artifacts | {len(missing)} |",
        "",
        "> A match is a remediation lead, not a legal conclusion. Every matched sentence must be sourced, qualified, removed, or the page must be quarantined before deployment.",
        "",
    ]
    for path, page_findings in grouped.items():
        lines.extend([f"## `{path}`", ""])
        for item in page_findings:
            lines.append(f"- **{item['severity'].upper()} — {item['code']}:** {item['snippet']}")
        lines.append("")
    if not grouped:
        lines.extend(["## Findings", "", "None.", ""])
    if missing:
        lines.extend(["## Missing artifacts", "", *[f"- `{path}`" for path in missing], ""])

    report_path = OUT_DIR / "indexable-trust-claim-audit.md"
    report_path.write_text("\n".join(lines), encoding="utf-8")
    print(json.dumps(summary))
    print(f"Report: {report_path.relative_to(ROOT)}")
    return 2 if missing else (1 if findings else 0)


if __name__ == "__main__":
    sys.exit(main())
