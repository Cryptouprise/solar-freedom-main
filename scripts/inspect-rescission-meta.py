#!/usr/bin/env python3
"""Locate the rescission article and print its meta field lengths."""
import glob
import re

SLUG = "solar-contract-rescission-rights"

for f in sorted(glob.glob("client/src/data/*.ts")):
    s = open(f, encoding="utf-8").read()
    m = re.search(r"""slug:\s*['"]%s['"]""" % SLUG, s)
    if not m:
        continue
    seg = s[m.start(): m.start() + 2500]
    print("FILE:", f)
    for key in ("title:", "metaTitle:", "metaDescription:"):
        k = seg.find(key)
        if k == -1:
            continue
        rest = seg[k + len(key):]
        mm = re.match(r"""\s*(["\'\`])(.*?)\1""", rest, re.S)
        if mm:
            v = mm.group(2).strip()
            print(f"  {key[:-1]} [{len(v)} chars]: {v}")
    print()
