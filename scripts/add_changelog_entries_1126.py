#!/usr/bin/env python3
"""Add the 26 Nov 2026 near-winner entries to shared/changeLog.ts.

Written in Python because the JS version tripped over backtick template
literals containing braces. This inserts raw text into the CHANGE_LOG array.

Idempotent: keyed on each entry's title line.
"""
import io
import os

FILE = "shared/changeLog.ts"
ANCHOR = "export const CHANGE_LOG: ChangeEntry[] = [\n"

ENTRIES = [
    (
        "Tesla article gained the reviews and customer-service answers it ranked for",
        '''  {
    date: "2026-11-26",
    title: "Tesla article gained the reviews and customer-service answers it ranked for",
    class: "content",
    changed: [
      "client/src/data/blog-articles-batch10.ts — added a 'What SolarCity and Tesla Solar Reviews Actually Show' section with a stat block, plus a 'How to Reach Tesla Solar Customer Service' section",
      "client/src/data/blog-articles-batch10.ts — retired two zero-demand FAQs and added the reviews and contact FAQs at the front of the array, because BlogPost.tsx renders only the first five",
    ],
    evidence:
      "Search Console (1 Sep–22 Nov 2026): the page earns 8 impressions at position 17.0 for 'solarcity reviews' and 5 impressions at position 19.6 for 'solarcity customer service', but a read of the full article on 26 Nov 2026 found no reviews section and no support contact anywhere in it. Verified the same day from primary sources: Tesla's own Customer Support page states solar and Powerwall support is (877) 798-3752, option 4 then option 2, and the BBB profile for Tesla Energy carries an F rating with 21 complaints in the three-year window, all 21 recorded as failure to respond.",
    reasoning:
      "The article was all process — agreement types, transfer paths, UCC-1 filings — and answered neither of the two questions its own impressions were asking. Both queries are question-shaped, so both want a direct answer near a heading rather than an implication spread across a process guide. The FAQ cap forced a choice: BlogPost.tsx slices to MAX_FAQ_ITEMS = 5 positionally, so adding two FAQs to an existing five would have shipped them invisible — the exact 'I added an FAQ and nothing changed' failure. The two retired questions had 1 and 0 matching impressions. The BBB figures are stated as a rating letter, a complaint count and a non-response count, and no star rating is claimed, because BBB publishes none on that profile; overstating a review score would have been the same class of error as the wrong statute citations.",
    confidence: "verified",
    verifiedBy:
      "pnpm check clean; pnpm test; node scripts/show-url-queries.py solarcity confirms the query set; pnpm build and grep of the built Tesla page for the new headings",
    preventsRecurrence:
      "Before adding an FAQ to any article, count the existing entries first. BlogPost.tsx renders only the first five positionally, so a new FAQ appended to a full array is invisible and marks up nothing. The near-winners query dump is the check that proves demand exists for the FAQ being added.",
    measureAfter: "2026-12-05",
  },
''',
    ),
    (
        "ADT page was an orphan holding 1,828 impressions; two pages now link to it",
        '''  {
    date: "2026-11-26",
    title: "ADT page was an orphan holding 1,828 impressions; two pages now link to it",
    class: "SEO",
    changed: [
      "client/src/data/blog-articles-batch6.ts — added a contextual in-body link to /blog/adt-solar-complaints after the Sunrun California complaints section",
      "client/src/data/blog-articles-batch10.ts — added a contextual in-body link to /blog/adt-solar-complaints after the Vivint/Sunrun merger section",
      "scripts/fix-adt-link-placement.mjs and scripts/fix-adt-link-placement-vivint.mjs — corrected the first placement, which had landed the sentence before its own antecedent",
    ],
    evidence:
      "Search Console (1 Sep–22 Nov 2026): /blog/adt-solar-complaints holds 1,828 impressions across 34 queries and only 4 clicks — 'adt solar reviews' alone is 856 impressions at position 12.5 with zero clicks. A repo-wide grep for the slug on 26 Nov 2026 returned exactly one hit: its own definition. No other page linked to it.",
    reasoning:
      "A page at position 10-12 with a 0.2% CTR is not losing on relevance — it is losing on authority, and an internal orphan has no link equity flowing into it at all. relatedSlugs could not fix this: BlogPost.tsx calls getRelatedPosts(slug, 3), so any slug listed fourth or later is never rendered, which means the link had to live in body copy to be a real contextual link. The anchors were chosen where the reader has just learned their counterparty changed hands or vanished, which is the moment a comparison to another company's exit is genuinely useful rather than link-building. The first attempt appended after the first content element, producing a sentence that referred to 'these failures' before any failure was described; that is a spam signal to a reader and gives a crawler no topical context for the anchor, so both were repositioned and re-verified by reading the surrounding paragraphs.",
    confidence: "measured",
    verifiedBy:
      "grep -c '/blog/adt-solar-complaints' returned 1 in each of the two source files, with the surrounding paragraphs read back to confirm the antecedent precedes the reference",
    preventsRecurrence:
      "Any page in the near-winners report with meaningful impressions must be checked for inbound internal links, not just for title and content match. An orphan page cannot rank on authority no matter how well its copy matches the query.",
    measureAfter: "2026-12-05",
  },
''',
    ),
    (
        "Sunlight Financial page answered 'is it legit' only in the negative",
        '''  {
    date: "2026-11-26",
    title: "Sunlight Financial page answered 'is it legit' only in the negative",
    class: "SEO",
    changed: [
      "client/src/data/blog-articles-batch8.ts — added a direct yes/no callout and a supporting paragraph as the first two elements of the Sunlight Financial article",
    ],
    evidence:
      "Search Console (1 Sep–22 Nov 2026): the page earns 47 impressions at average position 12.3 for 'is sunlight financial legit', 76 impressions at 16.4 for 'sunlight financial reviews', and 69 impressions at 12.1 for 'sunlight financial complaints' — 192 impressions across those three queries and zero clicks. Before this change the article opened with 'For many homeowners, the promise of clean energy and lower utility bills has turned into a financial nightmare', so neither the page nor any extractable snippet contained a direct answer.",
    reasoning:
      "'Is X legit' is a yes/no query and is answered by a short declarative sentence, not by atmosphere. The page already knew the answer — Sunlight Financial filed a prepackaged Chapter 11 on 30 October 2023 and emerged on 6 December 2023 under new ownership, and it still services loans — but that fact was buried mid-article. Stating it first is the only change that can win the snippet, because the competing pages answer the question in their first line. The wording deliberately separates 'is it a scam' (no) from 'should you trust it blindly' (also no), which is the honest position and matches the corrected company status recorded the same day.",
    confidence: "measured",
    verifiedBy:
      "pnpm check clean; the inserted callout is the first element of the content array, confirmed by reading the built page for the 'Short answer' string",
    preventsRecurrence:
      "For any page whose top query is a yes/no or 'is X legit' question, the first 100 words must contain a direct answer. A page can rank for a question it never answers; that is how 192 impressions produced zero clicks.",
    measureAfter: "2026-12-05",
  },
''',
    ),
    (
        "Rescission page title spent its last characters on a brand the query does not contain",
        '''  {
    date: "2026-11-26",
    title: "Rescission page title spent its last characters on a brand the query does not contain",
    class: "SEO",
    changed: [
      "client/src/data/blog-extra.ts — rewrote the meta title from 'Solar Contract Rescission Rights: 3-Day Rule Checklist' to 'Solar Contract Rescission Rights: 3-Day Rule & TILA'",
      "client/src/data/blog-extra.ts — shortened the meta description from 165 to 141 characters so it stops being truncated mid-sentence",
    ],
    evidence:
      "The served title measured exactly 70 characters on 26 Nov 2026 — 'Solar Contract Rescission Rights: 3-Day Rule Checklist | Solar Freedom' — which is the hard limit enforced by fitMetaTitle() in scripts/prerender.assembled.mjs, so the visible portion was being cut around character 60 and the tail was a brand the query does not contain. The same page earns 287 impressions across 53 queries and zero clicks, including 25 impressions at position 12.7 for 'tila rescission solar loan'. The word TILA appeared nowhere in the title; 'Checklist' occupied the slot instead.",
    reasoning:
      "Replacing 'Checklist' with 'TILA' keeps the total at 67 characters, so the entire promise now survives truncation, and it covers all three top queries at once: rescission and rescind by morphological match, the 3-day rule, and TILA. This was a genuine trade rather than an addition — the title had no free space, so a word with no measured demand had to leave for a word with 25 impressions behind it. The description was independently over the roughly 160-character display budget and was being cut mid-sentence, which wastes the one line that decides the click.",
    confidence: "measured",
    verifiedBy:
      "python3 scripts/inspect-rescission-meta.py reports metaTitle at 51 chars (67 with brand) and metaDescription at 141 chars; pnpm build confirms the served title in dist/public/blog/solar-contract-rescission-rights/index.html",
    preventsRecurrence:
      "A title at the 70-character limit is a defect even though it passes fitMetaTitle, because Google truncates near 60. Any near-winner page whose title is at or near the limit must be checked for words that consume space without appearing in the query set.",
    measureAfter: "2026-12-05",
  },
''',
    ),
]


def main() -> None:
    src = io.open(FILE, encoding="utf-8").read()
    idx = src.find(ANCHOR)
    if idx == -1:
        raise SystemExit("CHANGE_LOG array not found")

    insert_at = idx + len(ANCHOR)
    added = 0
    for key, block in ENTRIES:
        if 'title: "%s"' % key in src:
            print("SKIP (already present):", key)
            continue
        src = src[:insert_at] + block + src[insert_at:]
        insert_at += len(block)
        added += 1
        print("ADDED:", key)

    io.open(FILE, "w", encoding="utf-8").write(src)
    print("\n%d entries added." % added)


if __name__ == "__main__":
    main()
