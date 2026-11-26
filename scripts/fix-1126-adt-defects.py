#!/usr/bin/env python3
"""
Fix 12 (26 Nov 2026) — four ADT defects found by measuring, not by reading.

Evidence (Search Console, 1 Sep–22 Nov 2026) for /blog/adt-solar-complaints:
2,972 impressions in the page-level row at average position 11.0 with 19 clicks,
a 0.64% CTR — the third-largest impression mass on the site, below the 1.01%
site-wide average for its band. Query clusters:
  reviews          873 impr   0 clicks   ("adt solar reviews" 856 at pos 12.5)
  phone/number     227 impr   2 clicks   ("adt solar customer service" 223 at 10.9)
  out of business   99 impr   1 click    ("sunpro solar out of business" 52 at 8.0)
  lawsuit/legal    123 impr   1 click    ("adt solar lawsuit update" 47 at pos 6.6)

DEFECT 1 — wrong shutdown year, contradicting our own article.
  companies.ts said ADT "shut down entirely in June 2023" and listed a timeline
  entry "ADT Inc. shut down solar division in June 2023". The ADT article on the
  same site correctly says January 2024. Verified 26 Nov 2026 from ADT's own
  newsroom release dated 24 January 2024, headlined "ADT exits the residential
  solar business". The release also gives the loss as an $89 million Adjusted
  EBITDA loss over the first nine months of 2023, not "over $200 million".

DEFECT 2 — unverified BBB figures in the company record.
  companies.ts carried bbRating "C+" and complaintCount "700+". Neither matches
  the BBB profile or our own article: the profile publishes NO rating because the
  business is out of business, and the figures read from it on 25 Nov 2026 are
  404 complaints over three years and 75 customer reviews. The tagline also said
  "Shut Down in 2023".

DEFECT 3 — ranking position 6.6 for a question with no content behind it.
  The built page contained ZERO occurrences of "customer service", ZERO phone
  numbers and ZERO occurrences of "lawsuit", while holding 227 impressions on
  customer-service queries and 123 on lawsuit queries. Fourth instance of the
  query-not-answered class. Adds a customer-service section and an honest
  lawsuit section that reports only what public records support.

DEFECT 4 — the snippet gap.
  The 132-character description named none of review, complaint, customer
  service, out of business or a phone number, while 873 impressions sit on
  "reviews" and 227 on "customer service".
"""
import io
import re
import sys

COMPANIES = 'client/src/data/companies.ts'
ARTICLE = 'client/src/data/blog-articles-batch6.ts'

OLD_SUMMARY = 'summary: "ADT Solar (formerly Sunpro Solar) was acquired by ADT Inc. in 2021 and shut down entirely in June 2023 after losing over $200 million. ADT exited the solar business completely, leaving thousands of homeowners with active loans, no warranty coverage, and no service provider. If you have an ADT Solar system, your loan obligation to GoodLeap or another lender continues — but you may have strong grounds to cancel based on the company\'s failure to perform.",'
NEW_SUMMARY = 'summary: "ADT Solar (formerly Sunpro Solar) was acquired by ADT Inc. in 2021. ADT announced it was exiting the residential solar business on 24 January 2024, after the solar segment posted an $89 million Adjusted EBITDA loss over the first nine months of 2023, and substantially all operations had ceased by 30 June 2024. ADT left the solar business completely, leaving homeowners with active loans, uncertain warranty coverage, and no in-house service provider. If you have an ADT Solar system, your loan obligation to GoodLeap or another lender generally continues — but how the system was sold and completed is worth reviewing.",'

OLD_TIMELINE = '"ADT Inc. shut down solar division in June 2023",'
NEW_TIMELINE = '"ADT Inc. announced its exit from residential solar on 24 January 2024; operations substantially ceased by 30 June 2024",'

OLD_RATING = '    bbRating: "C+",\n    complaintCount: "700+",'
NEW_RATING = '    bbRating: "Not Rated (out of business)",\n    complaintCount: "404 (BBB, last 3 years; read 25 Nov 2026)",'

OLD_TAGLINE = 'tagline: "ADT Solar Shut Down in 2023 — Your Warranty Is Gone. Your Loan Isn\'t.",'
NEW_TAGLINE = 'tagline: "ADT Solar Exited Solar in 2024 — Your Warranty Is Uncertain. Your Loan Isn\'t.",'

CUST_ANCHOR = '      { type: "h2", content: "What evidence helps with an unfinished, damaged, or underperforming system?" },'

CUST_SECTION = '''      { type: "h2", content: "ADT Solar customer service: what still works" },
      { type: "p", content: "This is the question most people arrive with, and the honest answer is that there is no longer an ADT Solar department to call about a system ADT installed. ADT exited the residential solar business and the solar division is gone. What remains is ADT's general support center as a starting point for an existing account question, plus whatever the signed documents say about who owes you service." },
      { type: "p", content: "ADT's own support center is reachable through the [Solar Support Center](https://help.adt.com/article/adt-solar-customer-support). Expect that a solar-specific request may be routed or closed rather than resolved, because the servicing organization no longer exists." },
      { type: "callout", content: "Do not assume the first person you reach can authorize a repair or a warranty claim. Ask for the request in writing with a case number and a named responsible entity, so that a refusal is itself documented." },
      { type: "p", content: "For a system that is not producing or was never completed, the useful contacts are usually not ADT at all: they are the equipment manufacturer, whose warranty is separate from the installer's, the lender or servicer on the loan, and the permitting or inspection authority that signed off on the work. The next section lists the records that make those conversations specific rather than general." },
'''

LAWSUIT_ANCHOR = '      { type: "h2", content: "Can an ADT Solar contract be canceled after installation?" },'

LAWSUIT_SECTION = '''      { type: "h2", content: "ADT Solar lawsuits and complaints: what is actually documented" },
      { type: "p", content: "People search for an ADT Solar lawsuit update because they want to know whether some larger action will resolve their file. Be careful with what you read. Court filings involving ADT Solar or its predecessor Sunpro Solar exist — cases were filed in federal district courts in Florida in 2021 and South Carolina in 2024 — but the existence of a filing does not mean a class was certified, that a settlement covers you, or that an outcome is pending. Several of those dockets show voluntary dismissal or individual claims rather than a certified class." },
      { type: "p", content: "What is documented and verifiable is the complaint record rather than any pending action. The BBB profile for ADT Solar carries an out-of-business alert, publishes no rating because the business is out of business, and is not accredited; its figures are set out above and were read on 25 November 2026. Its predecessor Sunpro Solar sits in a separate BBB file with different numbers, and because the ADT profile names Sunpro as an alternate name the two sets are often added together online — they should be read separately. The CFPB's consumer complaint database is searchable by company name and is the better source for federal complaint patterns, because each entry is a complaint a consumer actually submitted rather than a review." },
      { type: "list", items: [
        "Check the BBB profile under the exact legal name on your contract, not the brand you remember.",
        "Search the CFPB complaint database by company name to see whether your issue appears repeatedly.",
        "If you are considering joining or starting a claim, have a licensed attorney in your state read your agreement first; no online summary can tell you whether you have a claim.",
        "Keep your own dated record. A pattern of complaints is context, not a substitute for your documents."
      ] },
      { type: "callout", content: "This page does not claim that a class action is pending or that any particular outcome is likely. It reports what public records support, and it is not legal advice." },
'''

OLD_DESC = 'metaDescription: "What ADT Solar and Sunpro customers report, who handles service and warranties now, and your options if your contract isn\'t working.",'
NEW_DESC = 'metaDescription: "ADT Solar reviews and complaints, what its customer service still handles after the 2024 shutdown, Sunpro warranty questions, and your contract options.",'


def main():
    changed = []

    # ---- companies.ts -------------------------------------------------------
    c = io.open(COMPANIES, encoding='utf-8').read()

    def sub(text, old, new, label, required=False):
        if new in text:
            print('skip: %s already corrected' % label)
            return text, False
        if old not in text:
            print('%s: %s not found verbatim' % ('FAIL' if required else 'WARN', label))
            return text, False
        return text.replace(old, new, 1), True

    c, ok = sub(c, OLD_SUMMARY, NEW_SUMMARY, 'companies.ts summary')
    if ok: changed.append('companies.ts summary: June 2023 -> 24 January 2024, $200M -> $89M')
    c, ok = sub(c, OLD_TIMELINE, NEW_TIMELINE, 'companies.ts timeline entry')
    if ok: changed.append('companies.ts timeline entry corrected to 2024')
    c, ok = sub(c, OLD_RATING, NEW_RATING, 'companies.ts BBB rating/count')
    if ok: changed.append('companies.ts BBB: C+/700+ -> Not Rated/404 (matches our article)')
    c, ok = sub(c, OLD_TAGLINE, NEW_TAGLINE, 'companies.ts tagline')
    if ok: changed.append('companies.ts tagline: 2023 -> 2024, warranty claim softened')
    io.open(COMPANIES, 'w', encoding='utf-8').write(c)

    # ---- article ------------------------------------------------------------
    a = io.open(ARTICLE, encoding='utf-8').read()
    i = a.find('slug: "adt-solar-complaints"')
    if i < 0:
        print('FAIL: ADT article slug not found'); return 1
    j = a.find('\n  {\n    slug:', i + 10)
    block = a[i:j if j > 0 else i + 16000]

    if 'ADT Solar customer service: what still works' in block:
        print('skip: customer-service section already present')
    else:
        k = block.find(CUST_ANCHOR)
        if k < 0:
            print('FAIL: customer-service anchor not found'); return 1
        block = block[:k] + CUST_SECTION + block[k:]
        changed.append('article: customer-service section added (227 impr cluster)')

    if 'ADT Solar lawsuits and complaints: what is actually documented' in block:
        print('skip: lawsuit section already present')
    else:
        k = block.find(LAWSUIT_ANCHOR)
        if k < 0:
            print('FAIL: lawsuit anchor not found'); return 1
        block = block[:k] + LAWSUIT_SECTION + block[k:]
        changed.append('article: lawsuit/complaints section added (123 impr cluster)')

    if NEW_DESC in block:
        print('skip: description already updated')
    elif OLD_DESC in block:
        block = block.replace(OLD_DESC, NEW_DESC, 1)
        changed.append('article: description rewritten to name the clusters')
    else:
        print('WARN: article description not found verbatim')

    a = a[:i] + block + a[j:]
    io.open(ARTICLE, 'w', encoding='utf-8').write(a)

    if not changed:
        print('no changes needed'); return 0
    print('OK: applied ->')
    for x in changed:
        print('   -', x)

    m = re.search(r'metaDescription: "(.*?)",', block, re.S)
    if m:
        d = m.group(1)
        print('  new description length: %d (limit 160)' % len(d))
        for t in ['review', 'complaint', 'customer service', 'shutdown', 'Sunpro', 'warranty']:
            print('    names %-18s %s' % (t, 'YES' if t in d.lower() else 'NO'))
    return 0


if __name__ == '__main__':
    sys.exit(main())
