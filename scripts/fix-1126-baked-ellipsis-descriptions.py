#!/usr/bin/env python3
"""
fix-1126-baked-ellipsis-descriptions.py

DEFECT (found 26 Nov 2026):
  Source article data contained metaDescription strings that were cut mid-word
  with a literal "..." already baked into the string, e.g.

    metaDescription: `...keep your system runnin...`,

  The same records carry a complete `excerpt` field holding the full sentence, so
  the truncation was an editing accident, not an intentional short snippet. The
  build-time fitter could not repair these because the ellipsis arrived as content.

  Scope measured 26 Nov 2026: 20 occurrences, 19 in blog-articles-batch8.ts and
  1 in blog-articles-batch11.ts. All sit on pages that are currently `noindex`,
  so none is hurting live rankings today. They are fixed anyway because the defect
  is latent: promoting any one of these pages to `index` would publish a snippet
  that visibly stops mid-word.

FIX:
  For each affected record, prefer the complete `excerpt` when it fits inside 160
  characters. Otherwise extend the truncated text from the excerpt up to a real
  word boundary, and never leave an ellipsis. Records whose excerpt cannot be
  located are left untouched and reported.

Idempotent: re-running reports zero remaining and writes nothing.
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "client/src/data")
LIMIT = 160
FUNC_WORDS = (
    r"and|or|but|so|the|a|an|of|to|for|with|in|on|at|by|from|as|that|which|"
    r"your|you|is|are|be|it|its|their|this|these|those|how|what|when|why"
)


def fit(text, limit=LIMIT):
    """Trim to `limit` on a real boundary, never leaving an ellipsis."""
    s = re.sub(r"\s+", " ", text).strip()
    s = s.rstrip(".") if s.endswith("...") else s
    s = s.replace("...", " ").strip()
    if len(s) <= limit:
        return re.sub(r"\s+", " ", s).strip()
    window = s[: limit + 1]
    floor = limit // 2
    for mark in [". ", "! ", "? "]:
        at = window.rfind(mark)
        if at >= floor:
            return window[: at + 1].strip()
    for mark in ["; ", ": ", " \u2014 ", " \u2013 ", ", ", " and ", " or ", " & "]:
        at = window.rfind(mark)
        if at >= floor:
            return window[:at].rstrip(" ,;:\u2013\u2014&-").strip()
    out = window[:limit]
    out = re.sub(r"\s+\S*$", "", out)
    out = re.sub(r"[\s,;:\u2013\u2014&-]+$", "", out)
    out = re.sub(r"\s+(?:%s)$" % FUNC_WORDS, "", out, flags=re.I)
    return out.strip()


def find_record_bounds(text, pos):
    """Return (start, end) of the object literal containing character `pos`."""
    start = text.rfind("\n  {", 0, pos)
    if start == -1:
        start = 0
    depth = 0
    i = start
    while i < len(text):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                return start, i + 1
        i += 1
    return start, len(text)


def extract_field(chunk, field):
    m = re.search(
        r"%s:\s*(?:`([^`]*)`|\"((?:[^\"\\]|\\.)*)\"|'((?:[^'\\]|\\.)*)')" % field,
        chunk,
        re.S,
    )
    if not m:
        return None, None
    for g in (1, 2, 3):
        if m.group(g) is not None:
            return m.group(g), m
    return None, None


def main():
    changed = []
    unresolved = []

    for name in sorted(os.listdir(DATA)):
        if not name.endswith(".ts"):
            continue
        path = os.path.join(DATA, name)
        src = io.open(path, encoding="utf-8").read()
        original = src

        # iterate back-to-front so earlier offsets stay valid
        hits = [
            m
            for m in re.finditer(
                r"metaDescription:\s*(?:`([^`]*)`|\"((?:[^\"\\]|\\.)*)\")", src, re.S
            )
            if "..." in (m.group(1) if m.group(1) is not None else m.group(2))
        ]

        for m in reversed(hits):
            value = m.group(1) if m.group(1) is not None else m.group(2)
            quote = "`" if m.group(1) is not None else '"'
            rstart, rend = find_record_bounds(src, m.start())
            chunk = src[rstart:rend]
            slug, _ = extract_field(chunk, "slug")
            excerpt, _ = extract_field(chunk, "excerpt")

            if excerpt and len(excerpt.strip()) <= LIMIT and "..." not in excerpt:
                replacement = excerpt.strip()
                how = "excerpt"
            else:
                base = excerpt if excerpt else value
                replacement = fit(base)
                how = "fitted-from-%s" % ("excerpt" if excerpt else "value")

            if not replacement:
                unresolved.append((name, slug))
                continue

            new_text = "metaDescription: %s%s%s" % (quote, replacement, quote)
            src = src[: m.start()] + new_text + src[m.end():]
            changed.append((name, slug, len(replacement), how, replacement[-58:]))

        if src != original:
            io.open(path, "w", encoding="utf-8").write(src)

    print("repaired %d baked-in ellipsis descriptions" % len(changed))
    for name, slug, ln, how, tail in changed:
        print("  %-28s %-52s %3d  %-22s ...%s" % (name, slug or "?", ln, how, tail))
    if unresolved:
        print("\nUNRESOLVED (%d):" % len(unresolved))
        for name, slug in unresolved:
            print("  %s :: %s" % (name, slug))

    # verify nothing remains
    left = 0
    for name in sorted(os.listdir(DATA)):
        if not name.endswith(".ts"):
            continue
        t = io.open(os.path.join(DATA, name), encoding="utf-8").read()
        for m in re.finditer(
            r"metaDescription:\s*(?:`([^`]*)`|\"((?:[^\"\\]|\\.)*)\")", t, re.S
        ):
            v = m.group(1) if m.group(1) is not None else m.group(2)
            if "..." in v:
                left += 1
    print("\nremaining baked-in ellipsis descriptions: %d" % left)
    return 1 if unresolved else 0


if __name__ == "__main__":
    sys.exit(main())
