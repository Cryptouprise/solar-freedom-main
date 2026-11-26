#!/usr/bin/env python3
"""
Change-log entry for the Blue Raven lawsuit answer.
Idempotent. Content avoids bare double quotes.
"""
import sys, pathlib

TS = pathlib.Path("shared/changeLog.ts")
MD = pathlib.Path("docs/CHANGE-LOG.md")

T = "A page ranking position 6 for the lawsuit question never mentioned the word lawsuit"

if T in TS.read_text(encoding="utf-8"):
    print("already present — nothing written")
    sys.exit(0)

ENTRY = '''  {
    date: "2026-11-26",
    title: "A page ranking position 6 for the lawsuit question never mentioned the word lawsuit",
    class: "SEO",
    changed: [
      "client/src/data/blog-articles-batch8.ts — new section Is there a Blue Raven Solar lawsuit or class action?, five paragraphs plus a callout, and a new first FAQ entry",
      "scripts/fix-1126-blue-raven-lawsuit-query.py — idempotent fixer, scoped to the Blue Raven article by slug boundary",
      "docs/sources-verified-2026-11-26.md — every case number, date and finding recorded with its source URL",
    ],
    evidence:
      "Measured 26 Nov 2026. /blog/blue-raven-solar-complaints held position 6.0 for `blue raven solar lawsuit` on 36 impressions in the prior 30-day window, and that query fell to 11 impressions at position 7.5 in the recent window. A grep of the built page returned ZERO occurrences of the word lawsuit. The page went from 1,132 to 1,652 words and now carries lawsuit 3 times, class action twice, settlement 6 times, and the case numbers 3:25-cv-06032 and 1:24-bk-11660. The FAQ went from 6 entries to 7, and both the FAQPage structured data and the rendered page carry all 7 in the same order, so the parity rule holds. Every fact was verified the same day: Blue Raven Solar Holdings, LLC filed Chapter 11 on 5 August 2024 in the District of Delaware as case 1:24-bk-11660, a member case of the SunPower lead case 1:24-bk-11649; Seeley et al v. Blue Raven Solar LLC et al, No. 3:25-cv-06032, opened in the Western District of Washington on 17 November 2025 on a petition for removal; Johansen v. Blue Raven Solar, LLC, No. 2:20-cv-02930 (S.D. Ohio, 2020) and Costa v. Blue Raven Solar, LLC, No. 2:24-cv-00265 (D. Utah, 2024) were Telephone Consumer Protection Act cases whose complaints included class allegations but where no class was certified; and the Idaho Attorney General voluntary agreement of October 2020, in which Blue Raven denied violating any law and paid 7,500 dollars to the state for costs, ran through 31 December 2025.",
    reasoning:
      "This is the fifth instance of the defect class the change log already names, after Freedom Forever, Tesla, Sunnova and GoodLeap: a page ranking highly for a question it never answers, matched on surrounding context alone. It is the strongest instance yet because position 6.0 is the highest position any of them held. The deeper reason to fix it is what the searcher actually wants. Someone typing that query does not want litigation news, they want to know whether money is available, and the honest answer is no. Saying so in the first sentence is both the most useful thing the page can do and the strongest available differentiator, because the pages currently ranking for that query are lead-capture funnels that imply a settlement exists. Three distinctions are drawn deliberately and each one protects a reader from a real mistake: a bankruptcy is not a lawsuit against the company and not a settlement for customers; a change of owner is not a court order cancelling a contract, which is stated as a callout because services charge fees on that false premise; and a demand in a live case is not an award, which is why the 200,000 dollar figure is attributed to the plaintiffs seeking it. Torre v. Blue Raven Solar, No. 1:25-cv-12988, is mentioned only as existing, because its docket could not be opened and its outcome is therefore unknown, and stating an outcome we could not read would be exactly the error this session has been correcting elsewhere.",
    confidence: "verified",
    verifiedBy:
      "pnpm check clean; pnpm build pre-rendered 583 pages; a direct scan of dist/public confirms the section, the case numbers and the phrase counts above; the FAQPage schema and the rendered h3 elements both carry 7 questions in the same order; npx vitest run shows 92 files and 883 tests passing with 3 skipped; the change-log sync and drift checks report no drift",
    preventsRecurrence:
      "The standing rule is unchanged and now has five recorded instances: any page ranking in the top 3 for a query must be checked for whether it actually answers the question rather than merely mentioning the topic. This case extends it, because the page held position 6 rather than the top 3, so the rule now reads top 10. The factual guard is that every case number, date and figure on the page is recorded in docs/sources-verified-2026-11-26.md with its source URL, so a later edit can be checked against the record rather than re-researched and answered differently.",
    measureAfter: "2026-12-05",
  },'''

ts = TS.read_text(encoding="utf-8")
idx = ts.rfind("\n];")
assert idx > 0
ts = ts[:idx] + "\n" + ENTRY + ts[idx:]
TS.write_text(ts, encoding="utf-8")
print("shared/changeLog.ts updated")

BLOCK = """## 2026-11-26 — A page ranking position 6 for the lawsuit question never mentioned the word lawsuit

**Class:** SEO

**Changed:** `client/src/data/blog-articles-batch8.ts` — new section "Is there a Blue Raven Solar lawsuit or class action?", five paragraphs plus a callout, and a new first FAQ entry. `scripts/fix-1126-blue-raven-lawsuit-query.py`. `docs/sources-verified-2026-11-26.md` — every case number, date and finding recorded with its source URL.

**Why:** This is the fifth instance of the defect class the change log already names, after Freedom Forever, Tesla, Sunnova and GoodLeap — a page ranking highly for a question it never answers, matched on surrounding context alone. It is the strongest instance yet: position **6.0** is the highest any of them held. The deeper reason is what the searcher wants. Someone typing that query does not want litigation news, they want to know whether money is available, and the honest answer is no. The pages currently ranking for it are lead-capture funnels that imply a settlement exists.

**How the conclusion was reached:** Measured 26 Nov 2026 — position 6.0 for `blue raven solar lawsuit` on 36 impressions in the prior window, falling to 11 impressions at position 7.5 in the recent window, while a grep of the built page returned **zero** occurrences of the word "lawsuit". Every fact was verified the same day: Blue Raven Solar Holdings filed Chapter 11 on 5 Aug 2024 (D. Del. 1:24-bk-11660, member case of SunPower's 1:24-bk-11649); *Seeley v. Blue Raven Solar LLC*, No. 3:25-cv-06032 (W.D. Wash., opened 17 Nov 2025); *Johansen* (S.D. Ohio 2020) and *Costa* (D. Utah 2024) were TCPA cases with class allegations but **no certified class**; and the Idaho AG voluntary agreement (Oct 2020, $7,500 to the state, through 31 Dec 2025). Three distinctions protect readers from real mistakes: a bankruptcy is not a lawsuit and not a settlement; a change of owner is not a court order cancelling a contract; and a demand is not an award. *Torre* (N.D. Ill. 2025) is stated as existing only, because its docket could not be opened — stating an outcome we could not read would repeat the exact error this session has been correcting.

**Verified:** `pnpm check` clean; `pnpm build` pre-rendered 583 pages; the page went 1,132 → 1,652 words with "lawsuit" 0 → 3 and both case numbers present; FAQPage schema and rendered `<h3>` elements both carry 7 questions in the same order; 92 test files, 883 tests passing.

**Recurrence guard:** The standing rule now reads **top 10** rather than top 3, since this page held position 6. Every case number, date and figure on the page is recorded with its source URL, so a later edit is checked against the record rather than re-researched and answered differently.

**Measure after:** 2026-12-05

"""

md = MD.read_text(encoding="utf-8")
first = md.find("\n## ")
assert first > 0
md = md[:first + 1] + BLOCK + md[first + 1:]
MD.write_text(md, encoding="utf-8")
print("docs/CHANGE-LOG.md updated")
