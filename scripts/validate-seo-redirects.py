#!/usr/bin/env python3
"""Validate the shared SEO redirect ledger against canonical inventories."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path("/home/ubuntu/solar-freedom-main")
LEDGER_PATH = ROOT / "shared/seo-redirects.json"
SITEMAP_PATH = ROOT / "client/public/sitemap.xml"
LLMS_PATH = ROOT / "client/public/llms-full.txt"
REPORT_PATH = ROOT / "reports/operator-review/seo-redirect-validation.md"


def main() -> None:
    ledger = json.loads(LEDGER_PATH.read_text(encoding="utf-8"))
    redirects: dict[str, str] = {**ledger["public"], **ledger["blog"]}
    sources = set(redirects)
    sitemap = SITEMAP_PATH.read_text(encoding="utf-8")
    llms = LLMS_PATH.read_text(encoding="utf-8")
    errors: list[str] = []

    for source, target in redirects.items():
        if not source.startswith("/") or not target.startswith("/"):
            errors.append(f"Non-relative path: {source} -> {target}")
        if source == target:
            errors.append(f"Self redirect: {source}")
        if target in sources:
            errors.append(f"Redirect chain: {source} -> {target} -> {redirects[target]}")
        source_url = f"https://breakyoursolarcontract.com{source}"
        target_url = f"https://breakyoursolarcontract.com{target}"
        if re.search(rf"<loc>{re.escape(source_url)}</loc>", sitemap):
            errors.append(f"Redirect source leaked into sitemap: {source}")
        if re.search(rf"(?m)^{re.escape(source_url)}(?:\\s|$)", llms):
            errors.append(f"Redirect source leaked into llms-full.txt: {source}")
        if target != "/blog" and target_url not in sitemap:
            errors.append(f"Redirect target is not in sitemap: {source} -> {target}")

    lines = [
        "# SEO Redirect Validation",
        "",
        f"Redirects checked: **{len(redirects)}**.",
        f"Validation errors: **{len(errors)}**.",
        "",
    ]
    if errors:
        lines.extend(["## Errors", ""])
        lines.extend(f"- {error}" for error in errors)
    else:
        lines.append("All redirects are single-hop, loop-free, absent from discovery inventories, and point to sitemap-eligible targets.")
    lines.append("")
    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")
    if errors:
        print("\n".join(errors))
        raise SystemExit(1)
    print(f"Validated {len(redirects)} redirects with zero errors.")


if __name__ == "__main__":
    main()
