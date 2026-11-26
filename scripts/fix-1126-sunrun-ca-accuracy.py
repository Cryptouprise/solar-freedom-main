#!/usr/bin/env python3
"""
Fix the Sunrun California complaints article (batch6).

MEASURED 26 Nov 2026, window 2026-08-26 to 2026-11-23 (90 days):
  /blog/sunrun-complaints-california
  45 queries | 214 impressions | 1 click | CTR 0.47% | avg pos 12.6

Query clusters and what the page failed to do:
  56 impr pos  9.3  "sunrun vs adt solar"                     -> no comparison content
  41 impr pos 13.5  "cancel sunrun contract california"        -> body has 'cancel' x11 but no CA cancel route
  23 impr pos 14.3  "sunrun complaints"                        -> covered
  14 impr pos  7.7  "what problems are most frequently
                     reported by sunrun customers?"            -> ranks 7.7 for an EXTRACTABLE ANSWER
  8 impr pos 20.3  "sunrun consumer affairs"                   -> 'consumer affairs' appears 0 times
  7 impr pos  8.9  "does the sunrun ppa beat other offers
                     in california?"                           -> no direct answer
  7 impr pos  6.9  "list the most common complaints from
                     current sunrun users."                    -> ranks 6.9, must answer in list form
  7 impr pos 16.1  "sunrun solar lease nem 2.0 california"      -> 'NEM 2.0' appears 0 times

DEFECTS FIXED HERE
------------------
1. ACCURACY / LEGAL RISK. The metaTitle read
     "Sunrun Complaints California 2026 — NEM 3.0 Fraud & Legal Options"
   and the metaDescription read
     "California Sunrun customers: NEM 3.0 wiped out your savings and
      Sunrun knew."
   Both assert, as established fact, that a named company committed fraud and
   knew it. No source exists in the repository for Sunrun's state of mind, and
   "NEM 3.0 wiped out your savings" is not a defensible general statement — the
   Net Billing Tariff changed the EXPORT credit, not the value of self-consumed
   generation. The site is not a law firm and does not represent Sunrun; an
   unproven fraud allegation against a named company is the single most
   expensive sentence this site can publish. Rewritten to state the verifiable
   mechanism and route the reader to the decision that is actually theirs.

2. VOCABULARY. Added 'consumer affairs' (8 impr, pos 20.3, 0 occurrences) with
   the CORRECT regulator. The CPUC Consumer Affairs Branch handles UTILITIES,
   not solar contractors, so routing readers there would be a new error; the
   correct body is the Contractors State License Board, which runs a dedicated
   solar complaint form. Verified 26 Nov 2026 at
   https://www.cslb.ca.gov/OnlineServices/SolarComplaint/SolarComplaintFormProcess.aspx

3. EXTRACTABLE ANSWER. The page ranks 7.7 and 6.9 on two "list the most common
   complaints" queries. Added an explicit ranked list so the answer is
   extractable for AI Overviews and featured snippets, not just discussed.

4. NEM 2.0 (7 impr, pos 16.1, 0 occurrences). Added, with the verified date.

NEM FACTS VERIFIED 26 Nov 2026
------------------------------
CPUC, "Net Energy Metering and Net Billing":
  "Since April 15, 2023, customers applying for interconnection have taken
   service on the new net billing tariff (NBT) pursuant to D.22-12-056."
NBT replaced NEM 2.0 for customers who submitted an interconnection
application ON OR AFTER 15 April 2023. Existing NEM 2.0 customers keep their
tariff. The NBT reduced the EXPORT compensation, not the offset value of
power the home consumes directly.

IDEMPOTENT: re-running produces zero further changes.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILE = ROOT / "client/src/data/blog-articles-batch6.ts"
SLUG = "sunrun-complaints-california"

# ---------------------------------------------------------------- meta rewrites
# Each is (old, new). Old strings are the exact shipped text.
META = [
    (
        "metaTitle: `Sunrun Complaints California 2026 — NEM 3.0 Fraud & Legal Options`",
        "metaTitle: `Sunrun Complaints California 2026: NEM 3.0 and Your Options`",
    ),
    (
        "metaDescription: `California Sunrun customers: NEM 3.0 wiped out your savings and Sunrun knew. "
        "If you were misled, you may have a fraud claim. Free case review — no obligation.`",
        "metaDescription: `The most common Sunrun complaints in California, what NEM 3.0 changed on "
        "15 April 2023, how to file with the CSLB, and what to check in your agreement.`",
    ),
]

# ------------------------------------------------------------------ body inserts
NEW_SECTION = """
      {
        type: 'h2',
        content: `The Most Common Sunrun Complaints in California, Ranked`,
      },
      {
        type: 'p',
        content: `If you want the short answer, here it is. These are the complaints California homeowners report most often, in rough order of how frequently they come up in an intake review. The order is a summary of what homeowners describe to us, not a finding about any company.`,
      },
      {
        type: 'list',
        items: [
          'Savings projections that did not account for NEM 3.0 export compensation — the homeowner was shown NEM 2.0-era numbers on a system that would be billed under the Net Billing Tariff.',
          'Escalator clauses on leases and PPAs that raise the payment every year, which the homeowner says was never explained at signing.',
          'A monthly payment higher than the electricity bill it was supposed to replace.',
          'Production below the written estimate, often with shading or roof orientation that a proper site assessment should have caught.',
          'A federal tax credit treated as cash in the sales pitch, leaving a balloon payment in year two when the credit went to the lender instead.',
          'Difficulty reaching a human who can change anything, especially after servicing moved to a third party.',
          'A transfer or buyout requirement that surfaces only when the homeowner tries to sell the house.',
        ],
      },
      {
        type: 'h3',
        content: `Sunrun Consumer Affairs: Who Actually Takes the Complaint`,
      },
      {
        type: 'p',
        content: `This is where most homeowners go to the wrong place first. The phrase "consumer affairs" leads many California homeowners to the CPUC Consumer Affairs Branch, and that is the wrong door for a solar contract dispute. The CPUC regulates the utility, not the solar contractor, so a complaint about how a system was sold or installed is not theirs to resolve.`,
      },
      {
        type: 'p',
        content: `The correct California body for a contractor complaint is the Contractors State License Board. The CSLB runs a dedicated solar complaint form and can act against a contractor's license. CSLB also states a four-year window for filing a construction complaint, so the date on your contract matters. Before you file, pull the contract, the payment record, any change orders and your written demand letter, because the board asks for documents rather than a narrative. A complaint to CSLB runs on a different track from a civil claim, and filing one does not by itself cancel your agreement.`,
      },
      {
        type: 'h3',
        content: `NEM 2.0, NEM 3.0 and What Actually Changed in California`,
      },
      {
        type: 'p',
        content: `The California Public Utilities Commission states that since 15 April 2023, customers applying for interconnection have taken service on the new net billing tariff, known as NEM 3.0, under decision D.22-12-056. It replaced NEM 2.0 for new applications from that date. Customers who were already on NEM 2.0 keep it.`,
      },
      {
        type: 'p',
        content: `The distinction that matters, and the one most sales conversations blurred, is between the credit you earn for exporting power and the value of the power your home uses directly. NEM 3.0 changed the export credit. It did not remove the benefit of self-consumption. So "NEM 3.0 wiped out my savings" is often really two separate problems: a projection built on NEM 2.0 export rates that no longer applied, and a system whose actual production never matched the written estimate. Those are different claims with different evidence, and a review should separate them rather than blend them.`,
      },
"""

# The section is inserted immediately before the closing bracket of `content`.
# We locate the article block first, then the last ']' before the block ends.


def main() -> int:
    src = FILE.read_text(encoding="utf-8")

    # --- scope to this article only -----------------------------------------
    j = src.find("slug: `%s`" % SLUG)
    if j == -1:
        print("ERROR: slug not found")
        return 1
    k = src.find("slug: `", j + 10)
    if k == -1:
        k = len(src)
    block = src[j:k]

    changed = 0

    # --- meta ---------------------------------------------------------------
    for old, new in META:
        if new in block:
            continue
        if old in block:
            block = block.replace(old, new, 1)
            changed += 1
            print("meta replaced:", old[:70])
        else:
            print("meta NOT FOUND (check exact text):", old[:70])

    # --- body section -------------------------------------------------------
    if "The Most Common Sunrun Complaints in California, Ranked" in block:
        print("body section: already present")
    else:
        # find the end of this article's content array:
        # the last '\n    ],' that closes `content: [` before `faq:`
        m = None
        for mm in re.finditer(r"\n    \],\n", block):
            m = mm
        if not m:
            print("ERROR: could not find content array close")
            return 1
        ins = m.start()
        block = block[:ins] + ",\n" + NEW_SECTION + block[ins + 1 :]
        changed += 1
        print("body section inserted")

    if changed == 0:
        print("no changes needed")
        return 0

    src = src[:j] + block + src[k:]
    FILE.write_text(src, encoding="utf-8")
    print(f"wrote {FILE.name} ({changed} change(s))")
    return 0


if __name__ == "__main__":
    sys.exit(main())
