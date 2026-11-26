#!/usr/bin/env python3
"""Add the Blue Raven and Sunrun near-winner entries to shared/changeLog.ts.

Idempotent: keyed on each entry's title line.
"""
import io

FILE = "shared/changeLog.ts"
ANCHOR = "export const CHANGE_LOG: ChangeEntry[] = [\n"

ENTRIES = [
    (
        "Blue Raven page ranked position 6 for 1,994 impressions and earned 19 clicks",
        '''  {
    date: "2026-11-26",
    title: "Blue Raven page ranked position 6 for 1,994 impressions and earned 19 clicks",
    class: "SEO",
    changed: [
      "client/src/data/blog-articles-batch8.ts — rewrote the Blue Raven meta description to name reviews, complaints, customer service and the support number, which the body already documented",
    ],
    evidence:
      "Search Console (1 Sep–22 Nov 2026): /blog/blue-raven-solar-complaints is the best-positioned high-volume page on the site at 1,994 impressions and average position 6.4, but only 19 clicks — a 0.95% CTR where position 6 normally earns several times that. The queries it ranks for are overwhelmingly review-and-contact intent: 'blue raven solar reviews' 459 impressions at 15.6, 'blue raven solar customer service' 238 at 6.6, 'blue raven solar phone number' 115 at 8.5, 'blue raven solar customer service phone number' 96 at 7.0, 'blue raven solar review' 88 at 13.1. The old 133-character description said none of those words.",
    reasoning:
      "The page body already answered every one of those queries, including a verified BBB block, so this was not a content gap — it was a snippet gap, and the snippet is what earns the click. Roughly 1,080 impressions were searching for words the description never displayed. The body's BBB figures were re-verified on 26 Nov 2026 against the BBB profile's own structured data (A+ rating, 555 complaints in three years, 877 customer reviews, accredited since 23 October 2015, phone (800) 377-4480), so the description could cite the rating and the number without asserting anything new. The review count was deliberately left out of the description because it changes, and a stale figure in a snippet is worse than no figure.",
    confidence: "measured",
    verifiedBy:
      "node scripts/fix-blue-raven-description.mjs reports the new description at 151 characters; pnpm check clean; pnpm build and grep of the served meta description",
    preventsRecurrence:
      "For every near-winner page, the top five queries by impressions must be checked against the meta description text, not only against the page body. A page can rank on body relevance while its snippet answers nothing the searcher typed.",
    measureAfter: "2026-12-05",
  },
''',
    ),
    (
        "Sunrun page had 207 impressions asking to cancel an appointment and never said the word",
        '''  {
    date: "2026-11-26",
    title: "Sunrun page had 207 impressions asking to cancel an appointment and never said the word",
    class: "content",
    changed: [
      "client/src/data/blog-articles-batch9.ts — added a 'How do you cancel or reschedule a Sunrun appointment?' section to the Sunrun cancellation article",
      "client/src/data/blog-articles-batch9.ts — added the matching FAQ at the front of the array and retired the home-sale FAQ, which its own dedicated page covers",
    ],
    evidence:
      "Search Console (1 Sep–22 Nov 2026): /blog/sunrun-solar-contract-cancellation-2026 holds 2,007 impressions across 138 queries at average position 10.4 with 11 clicks. A distinct cluster inside it is people trying to stop a visit rather than end a contract: 'how to cancel sunrun appointment' 85 impressions at 9.0, 'cancel sunrun appointment' 71 at 9.9, 'how to cancel sunrun appointment online' 51 at 9.2 — about 207 impressions. A grep of the built page on 26 Nov 2026 returned zero occurrences of the word 'appointment' anywhere in it.",
    reasoning:
      "A page ranking position 9 for a term it does not contain is matched on surrounding context, which caps how high it can climb and guarantees the snippet will not match. This also matters commercially: someone with an installer visit scheduled tomorrow is the most time-pressured visitor the site gets, and the page had nothing for them. The new section deliberately does not invent a phone menu or a web form path — it states the one verifiable and genuinely useful point, that stopping a visit and cancelling a contract are different actions and that cancelling a visit does not cancel the agreement, then routes the reader to the documented notice requirement the rest of the article already covers. The FAQ swap follows the same rule as the Tesla page: BlogPost.tsx renders only the first five FAQs, so the question with real measured demand took the slot of one whose topic has its own dedicated page.",
    confidence: "measured",
    verifiedBy:
      "pnpm check clean; grep of the built Sunrun page confirms the new heading and the appointment FAQ; pnpm test",
    preventsRecurrence:
      "Any near-winner page must be grepped for its top query cluster's core noun before the change is planned. Zero occurrences of a word the page ranks for is a defect, not an accident.",
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
