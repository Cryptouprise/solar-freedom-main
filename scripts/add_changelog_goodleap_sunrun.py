#!/usr/bin/env python3
"""Append one entry to shared/changeLog.ts and the matching section to docs/CHANGE-LOG.md.

Content values must contain no bare double quotes: the TS entry is written inside
double-quoted strings. Single quotes are used throughout the prose instead.
Idempotent: keyed on the exact title.
"""
import io
import os

ROOT = "/home/ubuntu/solar-freedom"
TS = os.path.join(ROOT, "shared/changeLog.ts")
MD = os.path.join(ROOT, "docs/CHANGE-LOG.md")

TITLE = "Two of the four declining pages were ranking for questions they never answered"

ENTRY = '''  {
    date: "2026-11-26",
    title: "Two of the four declining pages were ranking for questions they never answered",
    class: "SEO",
    changed: [
      "client/src/data/blog-articles-batch9.ts — goodleap-solar-loan-cancellation-hidden-fees-2026: new section 'Has GoodLeap been sued? What the public record shows' (5 paragraphs plus a callout), 2 FAQ items appended at positions 7 and 8, description rewritten, sources paragraph extended with two primary sources",
      "client/src/data/blog-articles-batch9.ts — sunrun-solar-contract-cancellation-2026: metaTitle and metaDescription rewritten to name the appointment question; body deliberately unchanged",
      "scripts/fix-1126-goodleap-sunrun-decline.py — idempotent, slug-scoped repair script, both articles live in the same file",
    ],
    evidence:
      "The four declining pages are 78 per cent of the site's 30-day impression loss and were worked one at a time from exact-URL Search Console query detail rather than from the page title. GoodLeap (3862 to 2877 impressions, position 7.2 to 8.3) held eight of its visible queries on its own corporate status and litigation while the built page contained ZERO occurrences of bankrupt and ZERO of lawsuit: is goodleap going bankrupt 11 impressions at position 6.1 with no clicks, goodleap solar lawsuit 9 at 3.0 with none, goodleap lawsuit 7 at 3.4 with none, did goodleap go bankrupt 5 at 8.4 with none, is goodleap going out of business 5 at 17.8 with none, goodleap lawsuit update 3 at 3.0 with none, did goodleap file bankruptcy 3 at 20.7 with none, is good leap going bankrupt 3 at 2.3 with none. This is the sixth instance of the recorded defect class and the highest-stakes one, because the honest answer is reassuring and the pages ranking for those terms are the ones implying a settlement exists. Sunrun (3284 to 2759 impressions) held 554 impressions at average position 8.6 across nine appointment queries with ZERO clicks against 5.07 expected, p(0) = 0.0063, the second statistically real CTR defect on the site after ADT, while its served title said Email, Fees and Steps and named no appointment at all.",
    reasoning:
      "Both pages rank on body relevance and lose the click at the snippet, which is the same distinction the significance test draws: Sunrun's appointment cluster is real at p = 0.0063 while its get-out cluster at p = 0.0668 and its email cluster at p = 0.5235 are noise, so only the appointment vocabulary was changed and the body was left alone. GoodLeap's phone cluster is also noise at p = 0.1534, so the earlier phone-number fix was left in place and not re-touched. On the substance, a page that ranks position 3 for a lawsuit question and never mentions the word is not a keyword problem, it is a trust problem: the searcher's next click lands on a page implying a payout that does not exist, and when they find out, the site that answered honestly loses nothing. The verified record is more useful to the reader than the implication anyway, because two state attorneys general have described the exact fee practice the page is about. Three distinctions are stated explicitly because each prevents a real error a reader could act on: a lawsuit is not a finding, a regulator suing a lender is not relief for the individual borrower, and a lender in litigation is not a lender in bankruptcy. The bankruptcy answer was worth publishing for the same reason — it is the query with the most traffic, the answer is no, and silence on a question that high in the funnel leaves the reader to a worse source.",
    confidence: "measured",
    verifiedBy:
      "Primary sources opened 26 Nov 2026 and recorded in docs/sources-verified-2026-11-26.md: Minnesota Attorney General release of 8 March 2024 (35 million dollars in hidden fees on nearly 5000 Minnesota loans since 2017, most fees raising borrower cost 15 to 30 per cent, up to 54 per cent more than cash) and the Commonwealth of Virginia amended complaint of 3 February 2026, No. 3:26-cv-00039-REP (over 200 million dollars in loans to more than 4000 Virginia consumers, hidden loan fees of 5 to 33 per cent, GoodLeap named against 1682 Virginia loans 2018 to 2022, rescission and restitution sought), plus GoodLeap's own release of 2 October 2026 confirming a 389 million dollar securitization, its 26th, which is the evidence that no bankruptcy has occurred. Verified in the built output: GoodLeap 2092 words with bankrupt 7 times and lawsuit 4 times, description 147 characters ending in a period, both primary-source links present, FAQ shell 8 against schema 8; Sunrun title 62 rendered characters naming Appointment, description 156 characters ending in a period, FAQ shell 7 against schema 7. Site-wide after the change: 0 titles and 0 descriptions ending in an ellipsis and 0 titles over 70 characters across 583 built pages. A diff of the edited file against HEAD shows 13 lines inserted and 4 replaced with nothing else touched.",
    preventsRecurrence:
      "Before changing a snippet, the significance test decides whether there is anything to fix: p(0) below 0.05 for a zero-click cluster, or a Poisson shortfall test where clicks exist. Three clusters on these two pages were measured and deliberately left alone as noise, which is the outcome that rule is for. The companion rule is that a page ranking in the top 10 for a query must be checked for whether it answers the question, with six instances now recorded.",
    measureAfter: "2026-12-05",
  },
'''

MD_SECTION = '''## 2026-11-26 — Two of the four declining pages were ranking for questions they never answered

**Class:** SEO

**Changed:**
- `client/src/data/blog-articles-batch9.ts` — `goodleap-solar-loan-cancellation-hidden-fees-2026`: new section 'Has GoodLeap been sued? What the public record shows' (5 paragraphs plus a callout), 2 FAQ items appended at positions 7 and 8, description rewritten, sources paragraph extended with two primary sources
- `client/src/data/blog-articles-batch9.ts` — `sunrun-solar-contract-cancellation-2026`: metaTitle and metaDescription rewritten to name the appointment question; body deliberately unchanged
- `scripts/fix-1126-goodleap-sunrun-decline.py` — idempotent, slug-scoped repair script, both articles live in the same file

**Why:**
The four declining pages are 78% of the site's 30-day impression loss and were worked one at a time from exact-URL Search Console query detail rather than from the page title. GoodLeap (3862 to 2877 impressions, position 7.2 to 8.3) held eight of its visible queries on its own corporate status and litigation while the built page contained ZERO occurrences of "bankrupt" and ZERO of "lawsuit": `is goodleap going bankrupt` 11 impressions at position 6.1 with no clicks, `goodleap solar lawsuit` 9 at 3.0 with none, `goodleap lawsuit` 7 at 3.4 with none, `did goodleap go bankrupt` 5 at 8.4 with none, `is goodleap going out of business` 5 at 17.8 with none, `goodleap lawsuit update` 3 at 3.0 with none, `did goodleap file bankruptcy` 3 at 20.7 with none, `is good leap going bankrupt` 3 at 2.3 with none. This is the sixth instance of the recorded defect class and the highest-stakes one, because the honest answer is reassuring and the pages ranking for those terms are the ones implying a settlement exists. Sunrun (3284 to 2759 impressions) held 554 impressions at average position 8.6 across nine appointment queries with ZERO clicks against 5.07 expected, p(0) = 0.0063, the second statistically real CTR defect on the site after ADT, while its served title said "Email, Fees & Steps" and named no appointment at all.

**How the conclusion was reached:**
Both pages rank on body relevance and lose the click at the snippet, which is the same distinction the significance test draws: Sunrun's appointment cluster is real at p = 0.0063 while its get-out cluster at p = 0.0668 and its email cluster at p = 0.5235 are noise, so only the appointment vocabulary was changed and the body was left alone. GoodLeap's phone cluster is also noise at p = 0.1534, so the earlier phone-number fix was left in place and not re-touched. On the substance, a page that ranks position 3 for a lawsuit question and never mentions the word is not a keyword problem, it is a trust problem: the searcher's next click lands on a page implying a payout that does not exist, and when they find out, the site that answered honestly loses nothing. The verified record is more useful to the reader than the implication anyway, because two state attorneys general have described the exact fee practice the page is about. Three distinctions are stated explicitly because each prevents a real error a reader could act on: a lawsuit is not a finding, a regulator suing a lender is not relief for the individual borrower, and a lender in litigation is not a lender in bankruptcy. The bankruptcy answer was worth publishing for the same reason — it is the query with the most traffic, the answer is no, and silence on a question that high in the funnel leaves the reader to a worse source.

**Verified:**
Primary sources opened 26 Nov 2026 and recorded in `docs/sources-verified-2026-11-26.md`: Minnesota Attorney General release of 8 March 2024 ($35M in hidden fees on nearly 5,000 Minnesota loans since 2017, most fees raising borrower cost 15–30%, up to 54% more than cash) and the Commonwealth of Virginia amended complaint of 3 February 2026, No. 3:26-cv-00039-REP (over $200M in loans to more than 4,000 Virginia consumers, hidden loan fees of 5–33%, GoodLeap named against 1,682 Virginia loans 2018–2022, rescission and restitution sought), plus GoodLeap's own release of 2 October 2026 confirming a $389M securitization, its 26th, which is the evidence that no bankruptcy has occurred. Verified in the built output: GoodLeap 2,092 words with "bankrupt" 7 times and "lawsuit" 4 times, description 147 characters ending in a period, both primary-source links present, FAQ shell 8 against schema 8; Sunrun title 62 rendered characters naming "Appointment", description 156 characters ending in a period, FAQ shell 7 against schema 7. Site-wide after the change: 0 titles and 0 descriptions ending in an ellipsis and 0 titles over 70 characters across 583 built pages. A diff of the edited file against HEAD shows 13 lines inserted and 4 replaced with nothing else touched.

**Recurrence guard:**
Before changing a snippet, the significance test decides whether there is anything to fix: p(0) below 0.05 for a zero-click cluster, or a Poisson shortfall test where clicks exist. Three clusters on these two pages were measured and deliberately left alone as noise, which is the outcome that rule is for. The companion rule is that a page ranking in the top 10 for a query must be checked for whether it answers the question, with six instances now recorded.

**Measure after:** 2026-12-05

'''


def main():
    ts = io.open(TS, encoding="utf-8").read()
    if TITLE in ts:
        print("TS entry already present, skipping")
    else:
        i = ts.rfind("\n];\n")
        if i < 0:
            raise SystemExit("could not find the CHANGE_LOG terminator")
        ts = ts[: i + 1] + ENTRY + ts[i + 1 :]
        io.open(TS, "w", encoding="utf-8").write(ts)
        print("TS entry appended")

    md = io.open(MD, encoding="utf-8").read()
    if TITLE in md:
        print("MD section already present, skipping")
    else:
        # newest-first: insert immediately before the first entry heading
        import re

        m = re.search(r"^## 20", md, re.M)
        if not m:
            raise SystemExit("could not find the first entry heading in the markdown log")
        md = md[: m.start()] + MD_SECTION + md[m.start() :]
        io.open(MD, "w", encoding="utf-8").write(md)
        print("MD section inserted at the top")

    n_ts = ts.count("\n    title: \"")
    n_md = len(__import__("re").findall(r"^## 20", md, __import__("re").M))
    print("TS entries: %d   MD entries: %d" % (n_ts, n_md))


main()
