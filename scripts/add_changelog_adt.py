#!/usr/bin/env python3
"""Adds the ADT entry to BOTH shared/changeLog.ts and docs/CHANGE-LOG.md."""
import io
import re
import sys

TS = 'shared/changeLog.ts'
MD = 'docs/CHANGE-LOG.md'

TITLE = 'ADT: four defects, including a shutdown year that contradicted our own article'

ENTRY_TS = '''  {
    date: "2026-11-26",
    title: "ADT: four defects, including a shutdown year that contradicted our own article",
    class: "accuracy",
    changed: [
      "client/src/data/companies.ts — corrected the shutdown date from June 2023 to the announced exit of 24 January 2024 with operations substantially ceased by 30 June 2024, in both the summary and the timeline entry; corrected the loss figure from 'over $200 million' to the $89 million Adjusted EBITDA loss over the first nine months of 2023",
      "client/src/data/companies.ts — corrected bbRating from C+ to Not Rated (out of business) and complaintCount from 700+ to 404 (BBB, last 3 years, read 25 Nov 2026), so the company record now matches the BBB profile and our own article",
      "client/src/data/companies.ts — tagline changed from 'Shut Down in 2023 — Your Warranty Is Gone' to 'Exited Solar in 2024 — Your Warranty Is Uncertain', because the exit announcement described a business exit, not a voiding of warranties",
      "client/src/data/blog-articles-batch6.ts — added an 'ADT Solar customer service: what still works' section, since the built page contained zero occurrences of 'customer service' and zero phone numbers while holding 227 impressions on customer-service queries",
      "client/src/data/blog-articles-batch6.ts — added an 'ADT Solar lawsuits and complaints: what is actually documented' section, since the built page contained zero occurrences of 'lawsuit' while holding 123 impressions on lawsuit queries",
      "client/src/data/blog-articles-batch6.ts — replaced the 132-character description, which named none of review, complaint, customer service or out of business, with a 152-character description naming them",
    ],
    evidence:
      "Search Console (1 Sep–22 Nov 2026): /blog/adt-solar-complaints holds 2,972 impressions at average position 11.0 with 19 clicks, a 0.64% CTR, the third-largest impression mass on the site. Its clusters are 873 impressions on reviews ('adt solar reviews' 856 at position 12.5), 227 on customer service ('adt solar customer service' 223 at 10.9), 123 on lawsuits ('adt solar lawsuit update' 47 at position 6.6) and 99 on out-of-business queries. The built page contained zero occurrences of 'customer service', zero phone numbers and zero occurrences of 'lawsuit'. Separately, companies.ts said ADT 'shut down entirely in June 2023' and listed a timeline entry 'ADT Inc. shut down solar division in June 2023', while the ADT article on the same site says January 2024 — the site contradicted itself. ADT's own newsroom release, read 26 Nov 2026 and dated 24 January 2024, is headlined 'ADT exits the residential solar business' and gives the solar segment's loss as an $89 million Adjusted EBITDA loss over the first nine months of 2023.",
    reasoning:
      "The date defect was found by auditing the company record against the article rather than by reading either alone, which is the same cross-check that caught Freedom Forever contradicting itself. A wrong date is not cosmetic in this niche: it changes which warranty regime and which exit-charge period a reader thinks applies. The C+ rating and the 700+ complaint count were worse than merely unverified, because the BBB profile publishes no rating at all for an out-of-business company and our own article had already recorded 404 complaints read on 25 November 2026, so the company page and the article were publishing different numbers for the same fact. The two content sections address the fourth instance of the query-not-answered class, which is now recorded four times. The lawsuit section is deliberately written to report only what public records support and to say plainly that several dockets show voluntary dismissal or individual claims rather than a certified class, because implying a pending class action would be exactly the kind of unsupported first-party claim the editorial policy forbids. What would have falsified the date conclusion: an ADT filing or release announcing a 2023 exit. The only ADT release on the subject is dated 24 January 2024 and is titled as an exit announcement.",
    confidence: "verified",
    verifiedBy:
      "ADT newsroom release read 26 Nov 2026 at newsroom.adt.com/corporate-news/adt-provides-solar-business-update-and-advances-capital-allocation-strategy; pnpm check clean; server/companyStatus.test.ts 24 tests pass; pnpm build pre-rendered 583 pages; grep of the built ADT page for the new headings, the customer-service section and the 152-character description",
    preventsRecurrence:
      "Any company record must be read against that company's own article before either ships, because the two are edited independently and can state different dates or figures for the same fact. The standing rule that a page ranking top 3 for a query must be checked for whether it answers the question applies here: position 6.6 on 'adt solar lawsuit update' with zero occurrences of 'lawsuit' is the same defect as position 2 on 'sunnova bankruptcy' with zero occurrences of 'Chapter 11'.",
    measureAfter: "2026-12-05",
  },
'''

MD_ENTRY = '''## 2026-11-26 — ADT: four defects, including a shutdown year that contradicted our own article
**Class:** accuracy
**Changed:** `client/src/data/companies.ts` — corrected the shutdown date from **June 2023** to the announced exit of **24 January 2024** with operations substantially ceased by 30 June 2024, in both the summary and the timeline entry; corrected the loss figure from "over $200 million" to the **$89 million** Adjusted EBITDA loss over the first nine months of 2023; corrected `bbRating` from C+ to **Not Rated (out of business)** and `complaintCount` from 700+ to **404 (BBB, last 3 years, read 25 Nov 2026)**; softened the tagline from "Shut Down in 2023 — Your Warranty Is Gone" to "Exited Solar in 2024 — Your Warranty Is Uncertain". `client/src/data/blog-articles-batch6.ts` — added an **"ADT Solar customer service: what still works"** section and an **"ADT Solar lawsuits and complaints: what is actually documented"** section, and replaced the 132-character description with a 152-character one naming reviews, complaints, customer service, the 2024 shutdown, Sunpro and warranty.
**Why:** Search Console (1 Sep–22 Nov 2026): `/blog/adt-solar-complaints` holds **2,972 impressions at average position 11.0 with 19 clicks, a 0.64% CTR** — the third-largest impression mass on the site. Clusters: **873 impressions on reviews** ("adt solar reviews" 856 at pos 12.5), **227 on customer service** ("adt solar customer service" 223 at 10.9), **123 on lawsuits** ("adt solar lawsuit update" 47 at **position 6.6**) and 99 on out-of-business queries. The built page contained **zero** occurrences of "customer service", **zero** phone numbers and **zero** occurrences of "lawsuit". Separately, `companies.ts` said ADT "shut down entirely in June 2023" while the ADT article on the same site says January 2024 — **the site contradicted itself**. ADT's own newsroom release, read 26 Nov 2026 and dated **24 January 2024**, is headlined "ADT exits the residential solar business" and gives the solar segment's loss as an **$89 million Adjusted EBITDA loss** over the first nine months of 2023. The C+ rating and 700+ complaint count were worse than unverified: BBB publishes **no rating** for an out-of-business company, and our own article had already recorded **404 complaints read on 25 November 2026**, so the company page and the article published different numbers for the same fact. The lawsuit section deliberately reports only what public records support and states plainly that several dockets show voluntary dismissal or individual claims rather than a certified class, because implying a pending class action would be an unsupported first-party claim.
**Verified:** ADT newsroom release read 26 Nov 2026; `pnpm check` clean; `server/companyStatus.test.ts` 24 tests pass; `pnpm build` pre-rendered 583 pages; grep of the built ADT page for the new headings and the 152-character description.
**Recurrence guard:** any company record must be read against that company's own article before either ships, because the two are edited independently and can state different dates or figures for the same fact. The standing rule that a page ranking top 3 for a query must be checked for whether it answers the question applies here: **position 6.6 on "adt solar lawsuit update" with zero occurrences of "lawsuit"** is the same defect as position 2 on "sunnova bankruptcy" with zero occurrences of "Chapter 11".
**Measure after:** 2026-12-05.
'''


def main():
    ok = False
    t = io.open(TS, encoding='utf-8').read()
    if TITLE in t:
        print('skip: entry already in changeLog.ts')
    else:
        m = re.search(r'export const CHANGE_LOG: ChangeEntry\[\] = \[\n', t)
        if not m:
            print('FAIL: could not locate the CHANGE_LOG array opening'); return 1
        t = t[:m.end()] + ENTRY_TS + t[m.end():]
        io.open(TS, 'w', encoding='utf-8').write(t)
        print('OK: added entry to changeLog.ts'); ok = True

    d = io.open(MD, encoding='utf-8').read()
    if 'ADT: four defects, including a shutdown year' in d:
        print('skip: entry already in CHANGE-LOG.md')
    else:
        m = re.search(r'^## ', d, re.M)
        if not m:
            print('FAIL: no existing entry headings found in CHANGE-LOG.md'); return 1
        d = d[:m.start()] + MD_ENTRY + d[m.start():]
        io.open(MD, 'w', encoding='utf-8').write(d)
        print('OK: added entry to CHANGE-LOG.md'); ok = True

    if not ok:
        print('no changes needed')
    return 0


if __name__ == '__main__':
    sys.exit(main())
