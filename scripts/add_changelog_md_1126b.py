#!/usr/bin/env python3
"""Add the Blue Raven and Sunrun entries to docs/CHANGE-LOG.md.

Idempotent: keyed on the heading line.
"""
import io

FILE = "docs/CHANGE-LOG.md"
INSERT_BEFORE = "## 2026-11-26 \u2014 Tesla article gained the reviews and customer-service answers it ranked for"

ENTRIES = [
    (
        "## 2026-11-26 \u2014 Blue Raven page ranked position 6 for 1,994 impressions and earned 19 clicks",
        """**Class:** SEO
**Changed:** `client/src/data/blog-articles-batch8.ts` \u2014 rewrote the Blue Raven meta description to name reviews, complaints, customer service and the support number, all of which the body already documented.
**Why:** Search Console (1 Sep\u201322 Nov 2026) shows `/blog/blue-raven-solar-complaints` as the best-positioned high-volume page on the site: **1,994 impressions, average position 6.4, but only 19 clicks** \u2014 a 0.95% CTR where position 6 normally earns several times that. The queries are overwhelmingly review-and-contact intent: "blue raven solar reviews" 459 impressions at 15.6, "blue raven solar customer service" 238 at 6.6, "blue raven solar phone number" 115 at 8.5, "blue raven solar customer service phone number" 96 at 7.0, "blue raven solar review" 88 at 13.1. The old 133-character description said none of those words, so roughly **1,080 impressions** were searching for terms the snippet never displayed. The body already answered every one of them, so this was a snippet gap rather than a content gap. The body's BBB figures were re-verified on 26 Nov 2026 against the BBB profile's own structured data \u2014 **A+** rating, **555** complaints in three years, **877** customer reviews, accredited since 23 October 2015, phone (800) 377-4480. The review count was deliberately left out of the description because it changes, and a stale figure in a snippet is worse than none.
**Verified:** `node scripts/fix-blue-raven-description.mjs` reports the new description at 151 characters; `pnpm check` clean; `pnpm build` and grep of the served meta description.
**Recurrence guard:** for every near-winner page, the top five queries by impressions must be checked against the meta description text, not only against the page body. A page can rank on body relevance while its snippet answers nothing the searcher typed.
**Measure after:** 2026-12-05.
""",
    ),
    (
        "## 2026-11-26 \u2014 Sunrun page had 207 impressions asking to cancel an appointment and never said the word",
        """**Class:** content
**Changed:** `client/src/data/blog-articles-batch9.ts` \u2014 added a "How do you cancel or reschedule a Sunrun appointment?" section to the Sunrun cancellation article, added the matching FAQ at the front of the array, and retired the home-sale FAQ whose own dedicated page covers that topic.
**Why:** Search Console (1 Sep\u201322 Nov 2026) shows `/blog/sunrun-solar-contract-cancellation-2026` holding **2,007 impressions across 138 queries at average position 10.4 with 11 clicks**. A distinct cluster inside it is people trying to stop a visit rather than end a contract: "how to cancel sunrun appointment" 85 impressions at 9.0, "cancel sunrun appointment" 71 at 9.9, "how to cancel sunrun appointment online" 51 at 9.2 \u2014 about **207 impressions**. A grep of the built page on 26 Nov 2026 returned **zero** occurrences of the word "appointment" anywhere in it. A page ranking position 9 for a term it does not contain is matched on surrounding context, which caps how high it can climb and guarantees the snippet will not match. This also matters commercially: someone with an installer visit scheduled tomorrow is the most time-pressured visitor the site gets, and the page had nothing for them. The new section deliberately does not invent a phone menu or a web form path \u2014 it states the one verifiable and useful point, that stopping a visit and cancelling a contract are different actions and cancelling a visit does not cancel the agreement, then routes the reader to the documented notice requirement the article already covers. The FAQ swap follows the same rule as the Tesla page: `BlogPost.tsx` renders only the first five FAQs, so the question with real measured demand took the slot of one whose topic has its own page.
**Verified:** `pnpm check` clean; grep of the built Sunrun page confirms the new heading and the appointment FAQ; `pnpm test`.
**Recurrence guard:** any near-winner page must be grepped for its top query cluster's core noun before the change is planned. Zero occurrences of a word the page ranks for is a defect, not an accident.
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
