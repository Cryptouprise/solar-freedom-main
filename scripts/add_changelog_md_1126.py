#!/usr/bin/env python3
"""Add the 26 Nov 2026 near-winner entries to docs/CHANGE-LOG.md.

The Markdown file is the human-readable mirror of shared/changeLog.ts and
server/changeLogSync.test.ts fails the build if the two drift apart: one
"## YYYY-MM-DD - Title" heading per data entry, and every entry must carry
**Class:**, **Changed:**, **Why:** and **Verified:**.

Entries are newest-first, so these are inserted directly above the current
newest entry.

Idempotent: keyed on the heading line.
"""
import io

FILE = "docs/CHANGE-LOG.md"

INSERT_BEFORE = "## 2026-11-26 \u2014 Rescission page ranked for TILA but never used the word"

ENTRIES = [
    (
        "## 2026-11-26 \u2014 Tesla article gained the reviews and customer-service answers it ranked for",
        """**Class:** content
**Changed:** `client/src/data/blog-articles-batch10.ts` \u2014 added a "What SolarCity and Tesla Solar Reviews Actually Show" section with a four-cell stat block, and a "How to Reach Tesla Solar Customer Service" section with the published phone path and the in-app route. Also retired two zero-demand FAQs and moved the reviews and contact FAQs to the front of the array.
**Why:** Search Console (1 Sep\u201322 Nov 2026) shows this page earning 8 impressions at position 17.0 for "solarcity reviews" and 5 impressions at position 19.6 for "solarcity customer service". Reading the full article on 26 Nov 2026 found no reviews section and no support contact anywhere in it \u2014 it was all process: agreement types, transfer paths, UCC-1 filings. Both queries are question-shaped, so both want a direct answer under a heading rather than an implication spread across a process guide. Facts were verified the same day from primary sources: Tesla's own Customer Support page states solar and Powerwall support is (877) 798-3752, option 4 then option 2; the BBB profile for Tesla Energy carries an **F** rating with **21** complaints in the three-year window, **all 21** recorded as failure to respond, and no accreditation. No star rating is claimed because BBB publishes none on that profile.
**Verified:** `pnpm check` clean; `pnpm test`; `python3 scripts/show-url-queries.py solarcity` confirms the query set; `pnpm build` then grep of the built Tesla page for both new headings.
**Recurrence guard:** before adding an FAQ to any article, count the existing entries first. `client/src/pages/BlogPost.tsx` slices to `MAX_FAQ_ITEMS = 5` positionally, so a new FAQ appended to a full array ships invisible and marks up nothing \u2014 the exact "I added an FAQ and nothing changed" failure. Measured demand decides which FAQ is retired.
**Measure after:** 2026-12-05.
""",
    ),
    (
        "## 2026-11-26 \u2014 ADT page was an orphan holding 1,828 impressions; two pages now link to it",
        """**Class:** SEO
**Changed:** `client/src/data/blog-articles-batch6.ts` \u2014 added a contextual in-body link to `/blog/adt-solar-complaints` after the Sunrun California complaints section. `client/src/data/blog-articles-batch10.ts` \u2014 added the same link after the Vivint/Sunrun merger section. `scripts/fix-adt-link-placement.mjs` and `scripts/fix-adt-link-placement-vivint.mjs` repositioned the first attempt, which had landed the sentence before its own antecedent.
**Why:** Search Console (1 Sep\u201322 Nov 2026) shows `/blog/adt-solar-complaints` holding **1,828 impressions across 34 queries and only 4 clicks** \u2014 "adt solar reviews" alone is 856 impressions at position 12.5 with zero clicks. A repo-wide grep for the slug on 26 Nov 2026 returned exactly one hit: its own definition. No other page linked to it. A page at position 10-12 with a 0.2% CTR is not losing on relevance, it is losing on authority, and an internal orphan receives no link equity at all. `relatedSlugs` could not fix this: `BlogPost.tsx` calls `getRelatedPosts(slug, 3)`, so any slug listed fourth or later is never rendered \u2014 the link had to live in body copy. Anchors sit where the reader has just learned their counterparty changed hands or vanished, which is when a comparison to another company's exit is genuinely useful.
**Verified:** `grep -c '/blog/adt-solar-complaints'` returned 1 in each of the two source files, with the surrounding paragraphs read back to confirm the antecedent precedes the reference.
**Recurrence guard:** any page in the near-winners report with meaningful impressions must be checked for inbound internal links, not just title and content match. An orphan page cannot rank on authority however well its copy matches the query.
**Measure after:** 2026-12-05.
""",
    ),
    (
        "## 2026-11-26 \u2014 Sunlight Financial page answered \u201cis it legit\u201d only in the negative",
        """**Class:** SEO
**Changed:** `client/src/data/blog-articles-batch8.ts` \u2014 added a direct yes/no callout plus a supporting paragraph as the first two elements of the Sunlight Financial article.
**Why:** Search Console (1 Sep\u201322 Nov 2026) shows the page earning 47 impressions at average position 12.3 for "is sunlight financial legit", 76 impressions at 16.4 for "sunlight financial reviews", and 69 impressions at 12.1 for "sunlight financial complaints" \u2014 **192 impressions across those three queries and zero clicks**. Before this change the article opened with "For many homeowners, the promise of clean energy and lower utility bills has turned into a financial nightmare", so neither the page nor any extractable snippet contained a direct answer. "Is X legit" is a yes/no query and is answered by a short declarative sentence. The page already knew the answer \u2014 Sunlight Financial filed a prepackaged Chapter 11 on 30 October 2023 and emerged on 6 December 2023 under new ownership, and it still services loans \u2014 but the fact was buried mid-article. The wording separates "is it a scam" (no) from "should you trust it blindly" (also no), matching the corrected company status recorded the same day.
**Verified:** `pnpm check` clean; the inserted callout is the first element of the content array, confirmed by reading the built page for the "Short answer" string.
**Recurrence guard:** for any page whose top query is a yes/no or "is X legit" question, the first 100 words must contain a direct answer. A page can rank for a question it never answers, which is how 192 impressions produced zero clicks.
**Measure after:** 2026-12-05.
""",
    ),
    (
        "## 2026-11-26 \u2014 Rescission page title spent its last characters on a brand the query does not contain",
        """**Class:** SEO
**Changed:** `client/src/data/blog-extra.ts` \u2014 rewrote the meta title from "Solar Contract Rescission Rights: 3-Day Rule Checklist" to "Solar Contract Rescission Rights: 3-Day Rule & TILA", and shortened the meta description from 165 to 141 characters.
**Why:** The served title measured **exactly 70 characters** on 26 Nov 2026 \u2014 "Solar Contract Rescission Rights: 3-Day Rule Checklist | Solar Freedom" \u2014 which is the hard limit enforced by `fitMetaTitle()` in `scripts/prerender.assembled.mjs`. Google truncates near 60, so the visible portion was being cut and the tail was a brand the query does not contain. The same page earns **287 impressions across 53 queries and zero clicks**, including 25 impressions at position 12.7 for "tila rescission solar loan". The word TILA appeared nowhere in the title; "Checklist" occupied the slot instead. Replacing it keeps the total at 67 characters, so the whole promise survives truncation and the title now covers all three top queries: rescission/rescind by morphological match, the 3-day rule, and TILA. The description was independently over the roughly 160-character display budget and was being cut mid-sentence.
**Verified:** `python3 scripts/inspect-rescission-meta.py` reports metaTitle at 51 chars (67 with brand) and metaDescription at 141 chars; `pnpm build` confirms the served title in `dist/public/blog/solar-contract-rescission-rights/index.html`.
**Recurrence guard:** a title at the 70-character limit is a defect even though it passes `fitMetaTitle`, because Google truncates near 60. Any near-winner page whose title is at or near the limit must be checked for words that consume space without appearing in the query set.
**Measure after:** 2026-12-05.
""",
    ),
]


def main() -> None:
    src = io.open(FILE, encoding="utf-8").read()
    idx = src.find(INSERT_BEFORE)
    if idx == -1:
        raise SystemExit("Insertion anchor not found in " + FILE)

    added = 0
    for heading, body in ENTRIES:
        if heading in src:
            print("SKIP (already present):", heading[:60])
            continue
        src = src[:idx] + heading + "\n" + body + "\n" + src[idx:]
        added += 1
        print("ADDED:", heading[:70])

    io.open(FILE, "w", encoding="utf-8").write(src)
    print("\n%d entries added." % added)


if __name__ == "__main__":
    main()
