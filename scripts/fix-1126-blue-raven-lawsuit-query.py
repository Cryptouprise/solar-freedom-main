#!/usr/bin/env python3
"""
Answer the lawsuit question on the Blue Raven page.

Measured 26 Nov 2026: /blog/blue-raven-solar-complaints held position 6.0 for
`blue raven solar lawsuit` on 36 impressions in the prior 30-day window, and
that query collapsed to 11 impressions at position 7.5 in the recent window.
A grep of the built page found ZERO occurrences of the word `lawsuit`. The page
was ranking on surrounding context alone — the fifth instance of the defect
class the change log already names, after Freedom Forever, Tesla, Sunnova and
GoodLeap.

The deeper problem is what a searcher is actually asking. Someone typing that
query does not want litigation news; they want to know whether money is
available. The honest answer is no, and saying so in the first sentence is both
the most useful thing the page can do and the strongest available differentiator,
because the pages currently ranking for this query are lead-capture funnels that
imply a settlement exists.

Facts verified 26 Nov 2026 from primary and secondary records:
  - Blue Raven Solar Holdings, LLC filed Chapter 11 on 5 Aug 2024, D. Del.,
    case 1:24-bk-11660, member case of the SunPower lead case 1:24-bk-11649.
  - Seeley et al v. Blue Raven Solar LLC et al, No. 3:25-cv-06032, W.D. Wash.,
    opened 17 Nov 2025 on a petition for removal, nature of suit 371.
  - No class action, settlement, fund, claim form or deadline identified as of
    21 Nov 2026. Individual suits only.
  - Idaho Attorney General voluntary agreement, October 2020, denied wrongdoing,
    paid $7,500 in costs, ran through 31 Dec 2025.

Idempotent: refuses to write if the marker text is already present.
"""
import sys, pathlib

P = pathlib.Path("client/src/data/blog-articles-batch8.ts")
MARKER = "Is there a Blue Raven Solar class action or settlement?"

NEW_SECTION = '''      { type: "h2", content: "Is there a Blue Raven Solar lawsuit or class action?" },
      { type: "p", content: "If you are searching this because you want money back, the direct answer is that as of 26 November 2026 no court has certified a class of Blue Raven customers, and no settlement fund, claim form or claim deadline exists. What exists is individual litigation, and an individual case pays only the people who brought it. Any page that offers to sign you up for a Blue Raven class settlement is collecting your information, not filing anything." },
      { type: "p", content: "The active case is Seeley v. Blue Raven Solar LLC, No. 3:25-cv-06032, in the U.S. District Court for the Western District of Washington. It opened there on 17 November 2025 after being removed from Pierce County Superior Court, and the plaintiffs are a Washington couple alleging defective solar panels along with problems in the purchase, financing and installation. They seek more than $200,000 for themselves. That figure is a demand, not an award, and it does not create anything for anyone else." },
      { type: "p", content: "Older individual federal suits were brought under the Telephone Consumer Protection Act over unwanted sales calls, including Johansen v. Blue Raven Solar, LLC, No. 2:20-cv-02930 (S.D. Ohio, 2020) and Costa v. Blue Raven Solar, LLC, No. 2:24-cv-00265 (D. Utah, 2024). Both complaints included class allegations, but no class was certified in either, so neither produced a payment for other people who received calls." },
      { type: "p", content: "One more thing is worth separating from a lawsuit, because it is real and it is often mistaken for one. Blue Raven Solar Holdings, LLC filed for Chapter 11 on 5 August 2024 in the District of Delaware as case 1:24-bk-11660, part of the SunPower Corporation bankruptcy. A bankruptcy is not a lawsuit against the company and it is not a settlement for customers. If you believe you hold a claim against the former SunPower Corporation, that claim runs through the bankruptcy case and its claims process, and the entity your claim belongs to depends on the purchase agreement." },
      { type: "p", content: "Separately, the Idaho Attorney General investigated Blue Raven's sales practices from spring 2020 and reached a voluntary agreement in October 2020. Blue Raven denied violating any law. The company agreed to sales-practice limits and paid $7,500 to the Attorney General's office for legal and investigative costs. That money went to the state, not to homeowners, and the agreement ran through 31 December 2025." },
      { type: "callout", content: "A change of owner is not a court order cancelling your contract. If someone offers to void your Blue Raven agreement for a fee on the strength of the bankruptcy, that is not what a bankruptcy does. Check with your lender and read your agreement before paying anyone." },
'''

NEW_FAQ = '''      { q: "Is there a Blue Raven Solar class action or settlement?", a: "No. As of 26 November 2026 no class has been certified and there is no settlement fund, claim form or deadline for Blue Raven customers. The active case, Seeley v. Blue Raven Solar LLC, No. 3:25-cv-06032 (W.D. Wash.), is one couple's individual suit. If a class settlement is ever reached, a court-appointed administrator notifies class members directly, and you would not need to pay anyone to join it." },
'''

ANCHOR_H2 = '      { type: "h2", content: "Does the SunPower bankruptcy cancel a Blue Raven contract or loan?" },'
ANCHOR_FAQ = '      { q: "Is Blue Raven Solar still in business?"'

s = P.read_text(encoding="utf-8")
if MARKER in s:
    print("already applied — nothing written")
    sys.exit(0)

assert s.count(ANCHOR_H2) == 1, f"H2 anchor count {s.count(ANCHOR_H2)}"
assert s.count(ANCHOR_FAQ) == 1, f"FAQ anchor count {s.count(ANCHOR_FAQ)}"

# Scope strictly to the Blue Raven article so a global replace cannot touch another one.
i = s.find('slug: "blue-raven-solar-complaints"')
j = s.find("slug:", i + 10)
assert i > 0 and j > i, "could not bound the Blue Raven article"
art = s[i:j]

assert art.count(ANCHOR_H2) == 1
assert art.count(ANCHOR_FAQ) == 1
assert "lawsuit" not in art.lower(), "the article already mentions lawsuit — re-read before applying"

art = art.replace(ANCHOR_H2, NEW_SECTION + ANCHOR_H2)
art = art.replace(ANCHOR_FAQ, NEW_FAQ + ANCHOR_FAQ)
s = s[:i] + art + s[j:]
P.write_text(s, encoding="utf-8")
print("applied")
