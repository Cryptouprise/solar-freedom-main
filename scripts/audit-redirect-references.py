#!/usr/bin/env python3
"""Report source-code references to redirecting paths outside the redirect ledger."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path("/home/ubuntu/solar-freedom-main")
LEDGER = ROOT / "shared/seo-redirects.json"
OUT = ROOT / "reports/operator-review/internal-redirect-references.md"
EXTENSIONS = {".ts", ".tsx", ".mjs", ".js"}
SKIP_PARTS = {"node_modules", "dist", ".git", "reports", "terminal_full_output", "docs"}
SKIP_FILES = {LEDGER, ROOT / "server/seo-redirects.ts"}


def main() -> None:
    ledger = json.loads(LEDGER.read_text(encoding="utf-8"))
    redirects = {**ledger["public"], **ledger["blog"]}
    records: list[tuple[str, str, str, int, str]] = []
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix not in EXTENSIONS or path in SKIP_FILES:
            continue
        if any(part in SKIP_PARTS for part in path.parts):
            continue
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except UnicodeDecodeError:
            continue
        for line_number, line in enumerate(lines, start=1):
            for source, target in redirects.items():
                pattern = re.compile(re.escape(source) + r"(?=$|[\\s\\\"'`),\\]}?#])")
                if pattern.search(line):
                    records.append((source, target, str(path.relative_to(ROOT)), line_number, line.strip()))

    records.sort(key=lambda item: (item[0], item[2], item[3]))
    lines = [
        "# Internal References to Redirecting URLs",
        "",
        f"References found outside the redirect ledger: **{len(records)}**.",
        "",
        "| Source | Target | File | Line | Context |",
        "|---|---|---|---:|---|",
    ]
    for source, target, file_name, line_number, context in records:
        safe_context = context.replace("|", "\\|")[:180]
        lines.append(f"| `{source}` | `{target}` | `{file_name}` | {line_number} | `{safe_context}` |")
    lines.append("")
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Found {len(records)} internal references to redirect sources.")


if __name__ == "__main__":
    main()
