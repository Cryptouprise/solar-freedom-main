#!/usr/bin/env python3
"""
audit-snippet-coverage.py — standing rule 2, automated.

For every indexed page that earns impressions, take its top query clusters by
impressions and check whether the meta description the searcher actually sees
names those clusters. A page can rank on body relevance while its snippet answers
nothing, which caps CTR no matter how good the position is.

This is the rule that found the Blue Raven, rescission, Sunrun and get-out gaps.
It is a script rather than a habit because a habit decays.

Usage:
  python3 scripts/audit-snippet-coverage.py                 # all pages, >= 20 impr
  python3 scripts/audit-snippet-coverage.py --min-impr 50   # only bigger pages
  python3 scripts/audit-snippet-coverage.py --url sunrun    # one page

Reads:  /home/ubuntu/solar-freedom-deliverables/seo-2026-11-24/near-winners.json
        dist/public/**/index.html  (the served snippet, not the source)
Writes: nothing. Prints a ranked table.
"""
import argparse
import glob
import html
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEAR_WINNERS = "/home/ubuntu/solar-freedom-deliverables/seo-2026-11-24/near-winners.json"
DIST = os.path.join(ROOT, "dist/public")

# Words that carry no search intent and must not count as a cluster match.
STOP = {
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "do", "does",
    "for", "from", "get", "how", "i", "if", "in", "is", "it", "its", "me", "my",
    "no", "not", "of", "on", "or", "so", "that", "the", "their", "them", "then",
    "there", "these", "they", "this", "to", "was", "we", "what", "when", "where",
    "which", "who", "why", "will", "with", "you", "your", "out", "up", "about",
    "into", "over", "after", "before", "have", "has", "had", "should", "would",
    "could", "solar", "contract", "contracts",  # too common on this site to be a signal
}


def built_file(url: str):
    path = url.replace("https://breakyoursolarcontract.com", "")
    path = path.replace("https://www.breakyoursolarcontract.com", "").strip("/")
    for cand in (
        os.path.join(DIST, path, "index.html"),
        os.path.join(DIST, path + ".html"),
    ):
        if os.path.exists(cand):
            return cand
    return None


def served_meta(f):
    t = io.open(f, encoding="utf-8").read()
    ti = re.search(r"<title>(.*?)</title>", t, re.S)
    de = re.search(r'<meta name="description" content="(.*?)"', t, re.S)
    rob = re.search(r'<meta name="robots" content="(.*?)"', t, re.S)
    return (
        html.unescape(ti.group(1)).strip() if ti else "",
        html.unescape(de.group(1)).strip() if de else "",
        (rob.group(1).split(",")[0] if rob else "NONE"),
    )


def terms(text):
    return {w for w in re.findall(r"[a-z0-9]+", text.lower()) if w not in STOP and len(w) > 2}


def cluster(queries):
    """Group queries by shared distinctive terms, ranked by impressions."""
    groups = {}
    for q in queries:
        key = tuple(sorted(terms(q["query"])))
        if not key:
            continue
        # merge into an existing group that shares any distinctive term
        placed = False
        for gk in list(groups):
            if set(gk) & set(key):
                merged = tuple(sorted(set(gk) | set(key)))
                groups[merged] = groups.pop(gk)
                groups[merged]["impressions"] += q["impressions"]
                groups[merged]["clicks"] += q["clicks"]
                groups[merged]["queries"].append(q["query"])
                placed = True
                break
        if not placed:
            groups[key] = {
                "impressions": q["impressions"],
                "clicks": q["clicks"],
                "queries": [q["query"]],
            }
    return sorted(groups.values(), key=lambda g: -g["impressions"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--min-impr", type=int, default=20)
    ap.add_argument("--url", default=None, help="substring filter")
    ap.add_argument("--top", type=int, default=5, help="clusters to check per page")
    args = ap.parse_args()

    if not os.path.exists(NEAR_WINNERS):
        print("FAIL: %s not found" % NEAR_WINNERS)
        return 1

    data = json.load(io.open(NEAR_WINNERS, encoding="utf-8"))
    detail = data.get("detail", {})

    rows = []
    for url, queries in detail.items():
        if args.url and args.url not in url:
            continue
        impr = sum(q["impressions"] for q in queries)
        if impr < args.min_impr:
            continue
        f = built_file(url)
        if not f:
            continue
        title, desc, robots = served_meta(f)
        if "noindex" in robots.lower():
            continue
        clicks = sum(q["clicks"] for q in queries)
        pos = (
            sum(q["position"] * q["impressions"] for q in queries) / impr if impr else 0
        )
        ctr = clicks / impr * 100 if impr else 0

        clusters = cluster(queries)[: args.top]
        dterms = terms(desc)
        gaps = []
        for g in clusters:
            cterms = set()
            for qq in g["queries"]:
                cterms |= terms(qq)
            if cterms and not (cterms & dterms):
                gaps.append(g)

        missed = sum(g["impressions"] for g in gaps)
        rows.append(
            {
                "url": url,
                "impr": impr,
                "clicks": clicks,
                "pos": pos,
                "ctr": ctr,
                "gaps": gaps,
                "missed": missed,
                "desc": desc,
            }
        )

    rows.sort(key=lambda r: -r["missed"])
    print(
        "indexed pages with >= %d impressions: %d"
        % (args.min_impr, len(rows))
    )
    print(
        "pages whose description names NONE of their top %d clusters: %d"
        % (args.top, sum(1 for r in rows if r["gaps"]))
    )
    print()
    print(
        "%-7s %-6s %-5s %-6s %-7s %-8s %s"
        % ("MISSED", "IMPR", "CLK", "POS", "CTR%", "CLUSTERS", "URL")
    )
    print("-" * 128)
    for r in rows:
        if not r["gaps"]:
            continue
        print(
            "%-7d %-6d %-5d %-6.1f %-7.2f %-8d %s"
            % (
                r["missed"],
                r["impr"],
                r["clicks"],
                r["pos"],
                r["ctr"],
                len(r["gaps"]),
                r["url"].replace("https://breakyoursolarcontract.com", ""),
            )
        )
        for g in r["gaps"]:
            print(
                "        %4d impr, %d clk  <- %s"
                % (g["impressions"], g["clicks"], "; ".join(g["queries"][:3]))
            )
        print("        DESC: %s" % r["desc"][:150])
        print()

    total_missed = sum(r["missed"] for r in rows)
    print(
        "total impressions sitting behind a cluster the snippet does not name: %d"
        % total_missed
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
