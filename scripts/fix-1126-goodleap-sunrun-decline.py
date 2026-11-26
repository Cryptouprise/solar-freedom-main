#!/usr/bin/env python3
"""Fix the two largest remaining declining pages, scoped strictly by slug.

Why these two, and why these changes.

MEASUREMENT (26 Nov 2026, GSC, 30d vs prior 30d, like-for-like):
  goodleap-solar-loan-cancellation-hidden-fees-2026  3862 -> 2877 impr (-985)
  sunrun-solar-contract-cancellation-2026            3284 -> 2759 impr (-525)
Together the single largest and third largest losses on the site.

GOODLEAP. Two of its top-13 visible queries are about GoodLeap's own
corporate status and litigation, and the built page contained ZERO
occurrences of both 'bankrupt' and 'lawsuit':
  is goodleap going bankrupt        11 impr, pos 6.1,  0 clicks
  goodleap solar lawsuit             9 impr, pos 3.0,  0 clicks
  goodleap lawsuit                   7 impr, pos 3.4,  0 clicks
  goodleap lawsuit update            3 impr, pos 3.0,  0 clicks
  did goodleap go bankrupt           5 impr, pos 8.4,  0 clicks
  did goodleap file bankruptcy       3 impr, pos 20.7, 0 clicks
  is goodleap going out of business  5 impr, pos 17.8, 0 clicks
  is good leap going bankrupt        3 impr, pos 2.3,  0 clicks
This is the sixth instance of the defect class the change log already names:
a page ranking for a question it never answers. It is the highest-stakes
instance because the honest answer is reassuring and we were silent, so the
funnel that ranks for these terms is the one implying a settlement exists.

Verified from primary sources on 26 Nov 2026, NOT from aggregator blogs:
  - Minnesota AG Keith Ellison sued GoodLeap, Sunlight Financial, Solar
    Mosaic and Dividend Solar Finance on 8 March 2024 in Hennepin County.
    $35M in hidden fees on nearly 5,000 Minnesota loans since 2017; most
    fees raised borrower cost 15-30%; some borrowers paid up to 54% more
    than cash. Source: ag.state.mn.us press release 8 Mar 2024.
  - Commonwealth of Virginia ex rel. Attorney General v. Waller, Klink,
    Cross River Bank, GoodLeap LLC, Solar Mosaic LLC, Sunlight Financial LLC
    and Technology Credit Union, No. 3:26-cv-00039-REP (E.D. Va., amended
    complaint filed 3 Feb 2026). Over 4,000 Virginia consumers, over $200M
    in loans; hidden loan fees of 5-33%; GoodLeap alone extended loans to
    over 1,000 Virginia households and is listed against 1,682 Virginia
    loans 2018-2022. Counts include the federal Consumer Financial
    Protection Act and the Virginia Consumer Protection Act. Relief sought
    includes rescission and restitution. This is an ALLEGATION stage
    filing; no finding of liability.
  - GoodLeap is NOT bankrupt and is not going out of business: it closed a
    $389M securitization on 2 October 2026, its 26th. Source: GoodLeap
    press release 2 Oct 2026.
Three protective distinctions are stated in the page copy because each
prevents a real error: a lawsuit is not a finding; a regulator suing is not
relief for you; and a lender in litigation is not a lender in bankruptcy.

SUNRUN. The page holds 554 impressions at average position 8.6 on the
appointment cluster with ZERO clicks, expected 5.07, p(0)=0.0063 - the
second statistically real CTR defect on the site after ADT. The cause is
intent mismatch: the served title said 'Email, Fees & Steps' and named no
appointment, while the page body already answers the appointment question
well. 315 of those 554 impressions sit at position 8.6-9.5 where the site's
own curve predicts clicks. The body needed no change, only the snippet.

Idempotent: every edit is keyed on an exact string that only exists before
the edit. A second run writes nothing.
"""
import io
import os
import re
import sys

ROOT = "/home/ubuntu/solar-freedom"
B9 = os.path.join(ROOT, "client/src/data/blog-articles-batch9.ts")
# Both declining pages happen to live in batch9. Checked by slug before use.
B6 = B9

changed = []


def slug_block(text, slug, quote='"'):
    """Return (start, end) char offsets of one article object, by slug.

    Scoped by slug on purpose: a global replace in an article data file hits
    the wrong article, which has happened on this project before.
    """
    needle = "slug: %s%s%s" % (quote, slug, quote)
    i = text.find(needle)
    if i < 0:
        raise SystemExit("slug not found: %s" % slug)
    start = text.rfind("\n  {", 0, i)
    nxt = text.find("\n  {", i)
    if nxt < 0:
        nxt = len(text)
    return start, nxt


def sub_in_block(path, slug, old, new, quote='"'):
    """Replace exactly one occurrence of old with new inside the slug's block."""
    text = io.open(path, encoding="utf-8").read()
    s, e = slug_block(text, slug, quote)
    block = text[s:e]
    if new in block:
        print("  already applied, skipping")
        return False
    if old not in block:
        raise SystemExit("anchor not found in %s: %s" % (slug, old[:90]))
    if block.count(old) != 1:
        raise SystemExit("anchor not unique (%d) in %s" % (block.count(old), slug))
    text = text[:s] + block.replace(old, new, 1) + text[e:]
    io.open(path, "w", encoding="utf-8").write(text)
    return True


print("== GoodLeap: %s ==" % B9)

GL = "goodleap-solar-loan-cancellation-hidden-fees-2026"

# 1. Description keeps the phone-number vocabulary the earlier fix added and
#    gains the lawsuit vocabulary, because the lawsuit queries are the ones
#    sitting at position 3 with zero clicks.
OLD_GL_DESC = (
    '    metaDescription: "Can you cancel a GoodLeap solar loan? How to request a '
    'payoff quote, dispute dealer fees, and reach account support at 1-800-345-9372. '
    'Free case review.",'
)
NEW_GL_DESC = (
    '    metaDescription: "Can you cancel a GoodLeap solar loan? Request a payoff '
    'quote, dispute hidden dealer fees, and see the state lawsuits against GoodLeap. '
    'Free review.",'
)
if sub_in_block(B9, GL, OLD_GL_DESC, NEW_GL_DESC):
    print("  description rewritten")
    changed.append("goodleap description")

# 2. Two FAQ items appended at positions 7 and 8. Appended rather than
#    inserted because BlogPost.tsx renders the FIRST N positionally, so the
#    existing six keep their positions and the new answers are additive.
OLD_GL_FAQ_END = (
    '      { q: "Do I keep paying if my installer went out of business?", '
    'a: "In most cases the loan stands on its own, so keep paying while you sort '
    'it out. Missing payments can damage your credit and weaken your position." },\n'
    '    ],'
)
NEW_GL_FAQ_END = (
    '      { q: "Do I keep paying if my installer went out of business?", '
    'a: "In most cases the loan stands on its own, so keep paying while you sort '
    'it out. Missing payments can damage your credit and weaken your position." },\n'
    '      { q: "Is GoodLeap going bankrupt?", '
    'a: "No. GoodLeap is not in bankruptcy and has not filed. It closed a $389 million '
    'securitization on 2 October 2026, its 26th, and continues to originate and service '
    'loans. A lender in litigation is not a lender in bankruptcy, and a bankruptcy '
    'filing by an installer is not one by the lender. Keep paying while you review." },\n'
    '      { q: "Has GoodLeap been sued by any state attorney general?", '
    'a: "Yes, twice. Minnesota Attorney General Keith Ellison sued GoodLeap, Sunlight '
    'Financial, Solar Mosaic and Dividend Solar Finance on 8 March 2024 over $35 million '
    'in hidden fees on nearly 5,000 Minnesota loans. Virginia sued GoodLeap and others '
    'on 3 February 2026, alleging hidden loan fees of 5-33% on over $200 million in '
    'loans to more than 4,000 Virginians. Both are allegations; neither is a finding of '
    'liability, and neither creates a claim form for you." },\n'
    '    ],'
)
if sub_in_block(B9, GL, OLD_GL_FAQ_END, NEW_GL_FAQ_END):
    print("  two FAQ items added (positions 7 and 8)")
    changed.append("goodleap faq")

# 3. The answering section, placed immediately before 'How to reach GoodLeap
#    directly' so the reader gets the corporate-status answer before the
#    contact block, and so the section sits inside the page's existing flow.
ANCHOR = '      { type: "h2", content: "How to reach GoodLeap directly" },'
NEW_SECTION = (
    '      { type: "h2", content: "Has GoodLeap been sued? What the public record shows" },\n'
    '      { type: "p", content: "Two state attorneys general have sued GoodLeap. Both '
    'are public record, and both are about the fees this page is about." },\n'
    '      { type: "p", content: "On 8 March 2024, Minnesota Attorney General Keith '
    'Ellison sued GoodLeap, Sunlight Financial, Solar Mosaic and Dividend Solar Finance '
    'in Hennepin County. The attorney general alleges the lenders charged $35 million in '
    'hidden fees on nearly 5,000 Minnesota loans since 2017, that most of those fees '
    'raised what borrowers paid by 15% to 30%, and that some borrowers paid up to 54% '
    'more than if they had paid cash. The claims are deceptive trade practices, '
    'deceptive lending and illegally high rates of interest." },\n'
    '      { type: "p", content: "Virginia filed against GoodLeap and others on 3 '
    'February 2026 in the Eastern District of Virginia, No. 3:26-cv-00039-REP. That '
    'complaint alleges hidden loan fees of 5% to 33% on more than $200 million in loans '
    'to over 4,000 Virginia consumers, and names GoodLeap against 1,682 Virginia loans '
    'made between 2018 and 2022. It seeks contract rescission or reformation, '
    'restitution and civil penalties. The case names the former Power Home Solar '
    'executives as well as the lenders." },\n'
    '      { type: "p", content: "GoodLeap is not bankrupt. It closed a $389 million '
    'securitization on 2 October 2026, its 26th, and continues to originate and service '
    'loans. A lender being sued is not a lender in bankruptcy, and a lender in '
    'bankruptcy would not automatically cancel your loan either." },\n'
    '      { type: "callout", content: "A lawsuit is not a finding. A regulator suing a '
    'lender is not relief for you, and it does not create a claim form, a deadline or a '
    'payout for any individual borrower. What a filed case does give you is a documented, '
    'official description of the fee practice, which is useful when you raise the same '
    'issue about your own account." },\n'
    '      { type: "p", content: "The practical use of both cases is the same. They '
    'describe how dealer fees were built into financed prices in a way regulators '
    'consider deceptive. If your own proposal shows a financed amount well above the '
    'cash price, that gap is where those fees sit, and the [CFPB issue spotlight on '
    'solar financing](https://www.consumerfinance.gov/data-research/research-reports/'
    'issue-spotlight-solar-financing/) describes the same pattern nationally." },\n'
    + ANCHOR
)
if sub_in_block(B9, GL, ANCHOR, NEW_SECTION):
    print("  lawsuit and bankruptcy section added")
    changed.append("goodleap section")

# 4. Sources paragraph gains the two primary sources, so the claims above are
#    traceable from the page itself rather than only from the repository.
OLD_GL_SRC = (
    '      { type: "p", content: "Sources: [GoodLeap\'s FAQ](https://www.goodleap.com/faq) '
    '(payment change after month 18, prepayment, home sale, UCC-1) and the CFPB\'s '
    '[issue spotlight on solar financing](https://www.consumerfinance.gov/data-research/'
    'research-reports/issue-spotlight-solar-financing/) (dealer fees)." }'
)
NEW_GL_SRC = (
    '      { type: "p", content: "Sources: [GoodLeap\'s FAQ](https://www.goodleap.com/faq) '
    '(payment change after month 18, prepayment, home sale, UCC-1), the CFPB\'s '
    '[issue spotlight on solar financing](https://www.consumerfinance.gov/data-research/'
    'research-reports/issue-spotlight-solar-financing/) (dealer fees), the '
    '[Minnesota Attorney General\'s release of 8 March 2024]'
    '(https://www.ag.state.mn.us/Office/Communications/2024/03/08_SolarLending.asp), '
    'and the [Virginia complaint of 3 February 2026]'
    '(https://www.oag.state.va.us/consumer-protection/files/Lawsuits/'
    'Com-v-Waller-First-Amended-Complaint.pdf)." }'
)
if sub_in_block(B9, GL, OLD_GL_SRC, NEW_GL_SRC):
    print("  sources paragraph extended")
    changed.append("goodleap sources")

print()
print("== Sunrun: %s ==" % B6)

SR = "sunrun-solar-contract-cancellation-2026"

# Title and description: appointment vocabulary added, both within limits and
# both measured in the built page afterwards. Body deliberately unchanged
# because the appointment answer is already on the page and it is good.
OLD_SR_TITLE = '    metaTitle: "Sunrun Contract Cancellation: Email, Fees & Steps (2026)",'
NEW_SR_TITLE = '    metaTitle: "Sunrun Contract Cancellation: Appointment, Email & Fees (2026)",'
if sub_in_block(B6, SR, OLD_SR_TITLE, NEW_SR_TITLE):
    print("  metaTitle rewritten")
    changed.append("sunrun title")

OLD_SR_DESC = (
    '    metaDescription: "Cancel or get out of a Sunrun contract: the cancellation '
    'window, the exit fee, how to cancel an appointment, and no public cancellation '
    'email. Free review.",'
)
NEW_SR_DESC = (
    '    metaDescription: "Cancel a Sunrun appointment or get out of a Sunrun contract: '
    'exit fees, the cancellation window, and why there is no public cancellation email. '
    'Free review.",'
)
if sub_in_block(B6, SR, OLD_SR_DESC, NEW_SR_DESC):
    print("  metaDescription rewritten")
    changed.append("sunrun description")

print()
if changed:
    print("CHANGED: " + ", ".join(changed))
else:
    print("CHANGED: nothing (all edits already applied)")
