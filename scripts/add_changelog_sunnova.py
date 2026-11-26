#!/usr/bin/env python3
"""Add the Sunnova bankruptcy entry to shared/changeLog.ts and docs/CHANGE-LOG.md.

Both files must be updated together or server/changeLogSync.test.ts fails.
Idempotent: keyed on the title line.
"""
import io

TS = "shared/changeLog.ts"
MD = "docs/CHANGE-LOG.md"

TITLE = "Sunnova page ranked position 2 for a bankruptcy question it never answered"
DATE = "2026-11-26"

TS_BLOCK = '''  {
    date: "2026-11-26",
    title: "Sunnova page ranked position 2 for a bankruptcy question it never answered",
    class: "content",
    changed: [
      "client/src/data/blog-articles-batch9.ts — added a 'Do you still have to pay Sunnova after the bankruptcy?' section covering the Chapter 11, the sale, the liquidating plan, SunStrong servicing and the in-progress installation route",
      "client/src/data/blog-articles-batch9.ts — added the payment question as the first FAQ, since BlogPost.tsx renders only the first five",
    ],
    evidence:
      "Search Console (1 Sep–22 Nov 2026): /blog/how-to-cancel-sunnova-solar-contract-2026 ranks position 2.0 for 'sunnova bankruptcy' (3 impressions) and position 2.0 for 'sunnova bankruptcy do i have to pay' (2 impressions), plus position 3.0 for 'sunstrong management' (2 impressions) — all at zero clicks. A grep of the built page on 26 Nov 2026 returned ZERO occurrences of 'Chapter 11' and ZERO of 'SunStrong', with one incidental mention of 'bankrupt'. This is the same defect found on the Freedom Forever article, where the site ranked for a bankruptcy question while its own copy described the bankruptcy as hypothetical.",
    reasoning:
      "Ranking position 2 for a question the page never answers is the strongest possible signal that the query is being matched on surrounding context alone, and it is the highest-leverage fix available on this page because the surrounding context is already good. It is also the most commercially important unanswered question here: 'do I still have to pay' is what a Sunnova customer actually needs, and the honest answer protects them from the expensive mistake of stopping payments because of a headline. Every fact was verified on 26 Nov 2026 and recorded in docs/company-status-verified-2026-11-26.md — Chapter 11 filed 8 June 2025, sale closed September 2025, liquidating plan effective 14 November 2025, SunStrong Management servicing most in-service systems, Sunnova's own site stating it has ceased independent operations, and payment terms unchanged with customers told to continue paying. The section answers the payment question in its first sentence because that is the query, does not promise an outcome, and repeats the standing warning not to stop payments.",
    confidence: "verified",
    verifiedBy:
      "pnpm check clean; grep of the built Sunnova page confirms the new heading, the Chapter 11 and SunStrong mentions, and the FAQ in the FAQPage schema",
    preventsRecurrence:
      "Any page ranking in the top 3 for a query must be checked for whether the page actually answers it, not merely whether it mentions the topic. A top-3 ranking on an unanswered question is a content defect that no amount of title work can fix.",
    measureAfter: "2026-12-05",
  },
'''

MD_HEADING = "## %s \u2014 %s" % (DATE, TITLE)
MD_BODY = """**Class:** content
**Changed:** `client/src/data/blog-articles-batch9.ts` \u2014 added a "Do you still have to pay Sunnova after the bankruptcy?" section covering the Chapter 11, the sale of the operating business, the liquidating plan, SunStrong servicing and the route for unfinished installations; added the payment question as the first FAQ.
**Why:** Search Console (1 Sep\u201322 Nov 2026) shows `/blog/how-to-cancel-sunnova-solar-contract-2026` ranking **position 2.0** for "sunnova bankruptcy" (3 impressions) and **position 2.0** for "sunnova bankruptcy do i have to pay" (2 impressions), plus position 3.0 for "sunstrong management" (2 impressions) \u2014 all at zero clicks. A grep of the built page on 26 Nov 2026 returned **zero** occurrences of "Chapter 11" and **zero** of "SunStrong", with one incidental mention of "bankrupt". This is the same defect found on the Freedom Forever article, where the site ranked for a bankruptcy question while its own copy described the bankruptcy as hypothetical. Ranking position 2 for a question the page never answers is the strongest signal that the query is matched on surrounding context alone. It is also the most commercially important unanswered question on the page: "do I still have to pay" is what a Sunnova customer actually needs, and the honest answer protects them from the expensive mistake of stopping payments because of a headline. Every fact was verified on 26 Nov 2026 and recorded in `docs/company-status-verified-2026-11-26.md` \u2014 Chapter 11 filed 8 June 2025, sale closed September 2025, liquidating plan effective 14 November 2025, SunStrong Management servicing most in-service systems, Sunnova's own site stating it has ceased independent operations, and payment terms unchanged with customers told to continue paying. The section answers the payment question in its first sentence because that is the query, does not promise an outcome, and repeats the standing warning not to stop payments.
**Verified:** `pnpm check` clean; grep of the built Sunnova page confirms the new heading, the Chapter 11 and SunStrong mentions, and the FAQ in the FAQPage schema.
**Recurrence guard:** any page ranking in the top 3 for a query must be checked for whether the page actually answers it, not merely whether it mentions the topic. A top-3 ranking on an unanswered question is a content defect that no amount of title work can fix.
**Measure after:** 2026-12-05.
"""


def main() -> None:
    # --- TypeScript data file ---
    ts = io.open(TS, encoding="utf-8").read()
    if 'title: "%s"' % TITLE in ts:
        print("SKIP ts (already present)")
    else:
        anchor = "export const CHANGE_LOG: ChangeEntry[] = [\n"
        idx = ts.find(anchor)
        if idx == -1:
            raise SystemExit("CHANGE_LOG array not found")
        at = idx + len(anchor)
        ts = ts[:at] + TS_BLOCK + ts[at:]
        io.open(TS, "w", encoding="utf-8").write(ts)
        print("ADDED to", TS)

    # --- Markdown mirror ---
    md = io.open(MD, encoding="utf-8").read()
    if MD_HEADING in md:
        print("SKIP md (already present)")
    else:
        before = "## 2026-11-26 \u2014 Blue Raven page ranked position 6"
        idx = md.find(before)
        if idx == -1:
            raise SystemExit("Markdown insertion anchor not found")
        md = md[:idx] + MD_HEADING + "\n" + MD_BODY + "\n" + md[idx:]
        io.open(MD, "w", encoding="utf-8").write(md)
        print("ADDED to", MD)


if __name__ == "__main__":
    main()
