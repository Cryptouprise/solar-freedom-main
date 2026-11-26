#!/usr/bin/env python3
"""
fix-1126-snippet-truncation.py

DEFECT (found 26 Nov 2026):
  scripts/prerender.assembled.mjs fitted meta titles and descriptions by slicing
  the string and appending a literal "...". Measured on dist/public: 37 built
  pages shipped a title ending in an ellipsis and 56 shipped a description ending
  in one (19 pages had both) -- 74 of 583 pages, 12.7% of the site. Every one of
  them showed a mid-phrase cut-off to Google and to the searcher, e.g.

    "Titan Solar Power Complaints: How to Get Out of Your Contract..."
    "Solar Escalator Clause Explained -- How to Fight Annual Payment..."

  A snippet that visibly stops mid-thought reads as broken and suppresses clicks.
  The page /blog/solar-escalator-clause-what-it-is-how-to-fight held 80
  impressions at average position 6.95 with ZERO clicks, and its title was one of
  the truncated 37.

FIX:
  Replace mechanical slicing with boundary-aware fitting. A cut now lands on a
  real boundary and never leaves an ellipsis or a dangling conjunction:
    1. last complete sentence
    2. last strong clause mark ( ; : , em dash, en dash )
    3. last coordinating conjunction ( and / or / but / so ), cut before it
    4. last whole word, with a trailing function word dropped
  Each boundary must sit at or past half the limit, so a snippet is never
  truncated to something uselessly short.

Idempotent: re-running detects the new code and exits without writing.
"""
import io
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = os.path.join(ROOT, "scripts", "prerender.assembled.mjs")

HELPER = '''/**
 * Fits text into `limit` characters WITHOUT leaving a dangling ellipsis or a
 * half-finished clause. A search snippet that visibly stops mid-thought reads as
 * broken and suppresses clicks, so every cut lands on a real boundary instead:
 * a sentence end, a strong clause mark, a coordinating conjunction, or a whole
 * word with any trailing function word removed. Each candidate boundary must sit
 * at or past half the limit so a snippet is never cut to something uselessly short.
 */
function fitSnippet(text, limit) {
  const normalized = String(text ?? "").replace(/\\s+/g, " ").trim();
  if (normalized.length <= limit) return normalized;

  const window = normalized.slice(0, limit + 1);
  const floor = Math.floor(limit * 0.5);

  // 1. A complete sentence is the cleanest possible ending.
  const sentence = Math.max(
    window.lastIndexOf(". "),
    window.lastIndexOf("! "),
    window.lastIndexOf("? ")
  );
  if (sentence >= floor) return window.slice(0, sentence + 1).trim();

  // 2. Then any strong clause mark, cut before the mark itself.
  for (const mark of ["; ", ": ", " \\u2014 ", " \\u2013 ", ", "]) {
    const at = window.lastIndexOf(mark);
    if (at >= floor) {
      return window.slice(0, at).replace(/[\\s,;:\\u2013\\u2014-]+$/, "").trim();
    }
  }

  // 3. Then a coordinating conjunction, cut before it so no clause is left hanging.
  for (const word of [" and ", " or ", " but ", " so "]) {
    const at = window.lastIndexOf(word);
    if (at >= floor) return window.slice(0, at).trim();
  }

  // 4. Finally a plain word boundary, dropping a dangling function word.
  return window
    .slice(0, limit)
    .replace(/\\s+\\S*$/, "")
    .replace(/[\\s,;:\\u2013\\u2014-]+$/, "")
    .replace(
      /\\s+(?:and|or|the|a|an|of|to|for|with|in|on|at|by|from|as|that|which|your|you|is|are|be|it|its|their|this|these|those|how|what|when|why)$/i,
      ""
    )
    .trim();
}

function fitMetaDescription(description) {
  return fitSnippet(description, 160);
}
'''

NEW_TAIL = '''  if (tightened.length <= 70) return tightened;
  return fitSnippet(tightened, 70);
}'''

MARKER = "function fitSnippet(text, limit) {"


def main():
    if not os.path.exists(TARGET):
        print("FAIL: %s not found" % TARGET)
        return 1

    src = io.open(TARGET, encoding="utf-8").read()

    if MARKER in src:
        print("ALREADY PATCHED: fitSnippet present in prerender.assembled.mjs")
        return 0

    lines = src.split("\n")

    # ---- replace the whole fitMetaDescription block with helper + new version
    start = None
    for i, ln in enumerate(lines):
        if ln.startswith("function fitMetaDescription(description) {"):
            start = i
            break
    if start is None:
        print("FAIL: fitMetaDescription block not found")
        return 1

    end = None
    for j in range(start + 1, len(lines)):
        if lines[j] == "}":
            end = j
            break
    if end is None:
        print("FAIL: end of fitMetaDescription block not found")
        return 1

    old_block = "\n".join(lines[start:end + 1])
    print("--- replacing fitMetaDescription block (%d lines) ---" % (end - start + 1))
    for ln in lines[start:end + 1]:
        print("    | " + ln)

    lines[start:end + 1] = HELPER.rstrip("\n").split("\n")

    # ---- replace the ellipsis tail inside fitMetaTitle
    src2 = "\n".join(lines)
    old_tail = '''  if (tightened.length <= 70) return tightened;
  return `${tightened.slice(0, 67).replace(/\\s+\\S*$/, "")}...`;
}'''
    if old_tail not in src2:
        print("FAIL: fitMetaTitle ellipsis tail not found verbatim")
        return 1
    src2 = src2.replace(old_tail, NEW_TAIL, 1)
    print("--- replaced fitMetaTitle ellipsis tail ---")

    # ---- sanity: no ellipsis truncation may remain in a fit function
    if "slice(0, 67)" in src2 or "slice(0, 162)" in src2:
        print("FAIL: an ellipsis slice survived the patch")
        return 1

    io.open(TARGET, "w", encoding="utf-8").write(src2)
    print("WROTE %s" % TARGET)
    print("fitSnippet defined: %s" % ("fitSnippet(text, limit) {" in src2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
