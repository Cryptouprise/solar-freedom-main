#!/usr/bin/env python3
"""Locate the Blue Raven article block and print its meta fields verbatim.

The earlier one-liner matched the wrong entry because it searched backwards for
the nearest 'slug:' and landed in a neighbouring article. This walks forward
from the slug and stops at the next top-level article start instead.
"""
import io
import re

SLUG = "blue-raven-solar-complaints"
FILES = [
    "client/src/data/blog-articles-batch9.ts",
    "client/src/data/blog-articles-batch10.ts",
    "client/src/data/blog-articles-batch8.ts",
    "client/src/data/blog-articles-batch11.ts",
]

for path in FILES:
    try:
        src = io.open(path, encoding="utf-8").read()
    except IOError:
        continue

    for m in re.finditer(r"""slug:\s*['"`]%s['"`]""" % SLUG, src):
        start = m.start()
        # End of this article: the next "  {\n" at two-space indent after start.
        nxt = re.search(r"\n  \{\n", src[start:])
        end = start + nxt.start() if nxt else len(src)
        block = src[start:end]

        print("FILE:", path)
        print("offset:", start, "block length:", len(block))
        print()
        for key in ("title", "metaTitle", "metaDescription", "excerpt"):
            mm = re.search(
                r"""\b%s:\s*(?:`([^`]*)`|"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')"""
                % key,
                block,
                re.S,
            )
            if mm:
                val = next(g for g in mm.groups() if g is not None)
                print("  %s [%d chars]: %s" % (key, len(val), val))
            else:
                print("  %s: NOT FOUND" % key)
        print()
        # Show the first two content entries so the opening can be judged.
        ci = block.find("content: [")
        if ci != -1:
            print("  --- first 600 chars of content array ---")
            print("  " + block[ci: ci + 600].replace("\n", "\n  "))
        print("=" * 70)
