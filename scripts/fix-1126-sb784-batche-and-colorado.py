#!/usr/bin/env python3
"""
Second pass on the same two defects, found by the new guard test.

Part 1 -- SB 784 in city-content-depth-batch-e.ts.
The first pass fixed state-laws.ts and blog-articles-batch5.ts, which are the
pre-rendered sources. This file is different: it feeds the RUNTIME CityPage
(`client/src/pages/CityPage.tsx` line 428 calls getCityContentDepth(slug), and
line 840 renders depth.stateLawExpanded). The pre-rendered shell does not include
it, so a built-output scan does not see it, but a reader with JavaScript does.
That is why the guard test scans SOURCE as well as the built output.

Only three of these cities are in the approved indexable set: san-francisco-ca,
san-jose-ca and little-rock-ar. Sacramento, which carries the most, is noindex.

Part 2 -- Colorado SB25-299 effective date.
Verified 26 Nov 2026 from leg.colorado.gov/bills/sb25-299: the bill BECAME LAW
(Governor signed 04 Jun 2025, session law effective 06 Aug 2025), and the bill
summary states its requirements "apply to agreements between a solar sales
company and a consumer that are entered into on or after July 1, 2026."
The page said "Effective January 1, 2026", which is wrong in a way that matters:
a homeowner reading it would believe the disclosure duty already applied to a
2025 or early-2026 contract when it does not.

Nevada SB 379 was checked in the same pass and is CORRECT: passed 6 Jun 2025,
effective 1 Oct 2025, and it is the source of the 10-business-day window for
buyers aged 60 or over. No change made there.

Idempotent: every replacement is keyed on an exact source string.
Run: python3 scripts/fix-1126-sb784-batche-and-colorado.py
"""
import io
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BATCHE = os.path.join(ROOT, "client", "src", "data", "city-content-depth-batch-e.ts")
STATES = os.path.join(ROOT, "client", "src", "data", "state-laws.ts")

PENDING = ("Pending California legislation (SB 784, still in committee as of "
           "26 Nov 2026) would add a pre-loan confirmation call if enacted, but "
           "it is not law today and creates no rights.")

PAIRS_E = [
    # Sacramento
    ("California's SB 784 Confirmation Call requirement and the CLRA give you more legal leverage than almost any other state.",
     "California's CLRA, the Unfair Competition Law, and the disclosure duties in Civil Code 7159 and 1689.7 give you more leverage than almost any other state."),
    ("\"SB 784 Confirmation Call was never completed — loan may be legally voidable\"",
     "\"Required disclosure documents and the detachable Notice of Cancellation were never provided\""),
    ("The California Consumer Legal Remedies Act (CLRA) prohibits misrepresentation of savings, system performance, and government incentives. SB 784 requires a live Confirmation Call before any solar loan is finalized — if your lender skipped it, your contract may be void.",
     "The California Consumer Legal Remedies Act (CLRA) prohibits misrepresentation of savings, system performance, and government incentives. " + PENDING),
    ("\"Does SB 784 apply to my Sacramento solar loan?\"",
     "\"What California law actually lets me cancel a Sacramento solar loan?\""),
    ("Yes. SB 784 requires a live Confirmation Call before any residential solar loan in California is finalized. If your lender (GoodLeap, Mosaic, Sunlight Financial, etc.) did not complete this call, your loan may be legally voidable. This is one of the strongest cancellation grounds available to Sacramento homeowners.",
     "California's home solicitation rules under Civil Code 1689.6 give three business days to cancel from the signing date, or five for a senior citizen, and Civil Code 1689.7(g) extends that until the seller complies with the notice requirements. A missing 10-point boldface cancellation statement or a missing detachable Notice of Cancellation is a defect worth examining. " + PENDING),
    # San Francisco
    ("California's SB 784 and the CLRA give you powerful legal tools to fight back.",
     "California's CLRA, the Unfair Competition Law and the Civil Code 1689.7 notice requirements give you real legal tools to examine."),
    ("SB 784's Confirmation Call requirement is particularly powerful — many Bay Area lenders skipped this step during the 2022–2023 rush.",
     "The Civil Code 1689.7(g) extension is particularly worth checking — if the cancellation notice was missing or defective, the right to cancel can survive long past the signing date."),
    ("CFPB complaints from SF homeowners cite loan approval before system commissioning and failure to complete SB 784 Confirmation Calls.",
     "CFPB complaints from SF homeowners cite loan approval before system commissioning and disclosures that were never delivered."),
    ("\"What is the SB 784 Confirmation Call and did my lender skip it?\"",
     "\"Does California law give me a way out after the three-day window has passed?\""),
    ("SB 784 requires your lender to conduct a live phone call with you before finalizing any solar loan in California. During the call, they must confirm you understand the loan terms. Many lenders skipped this during the 2022–2023 rush. If yours did, your loan may be voidable.",
     "Possibly. The ordinary window is three business days from signing, five for a senior citizen, under Civil Code 1689.6. But Civil Code 1689.7(g) says the buyer may cancel until the seller has complied with that section's notice requirements, which include a 10-point boldface statement at the signature space and a detachable Notice of Cancellation. Examine the signed documents for those two items. " + PENDING),
    # San Jose
    ("\"SB 784 Confirmation Call never completed for multiple San Jose GoodLeap loans\"",
     "\"Required cancellation notice and disclosure documents missing from multiple San Jose GoodLeap loans\""),
    ("California's SB 784 is particularly relevant in San Jose, where Mosaic and GoodLeap processed loans at high volume with minimal oversight. The law requires a live Confirmation Call before loan finalization — a step frequently skipped in the app-based approval rush.",
     "California's disclosure rules are particularly relevant in San Jose, where Mosaic and GoodLeap processed loans at high volume with minimal oversight. Civil Code 1689.7 requires a 10-point boldface cancellation statement at the signature space and an easily detachable Notice of Cancellation, and 1689.7(g) keeps the right to cancel alive until that is done — steps frequently skipped in the app-based approval rush."),
    ("Many SB 784 Confirmation Calls were never completed.",
     "Many required cancellation notices and disclosure documents were never delivered."),
    ("or your SB 784 Confirmation Call was never completed, you may have grounds to void the loan entirely.",
     "or the required cancellation notice was never delivered, you may have grounds to challenge the loan."),
    ("The lender complaints are particularly actionable under SB 784.",
     "The lender complaints are particularly actionable where a required disclosure or cancellation notice was never delivered."),
]

PAIRS_STATES = [
    ("Effective January 1, 2026, SB25-299 requires every solar company operating in Colorado to provide a standardized 4-page disclosure form before any contract is signed.",
     "Colorado SB25-299 became law on August 6, 2025, and its requirements apply to agreements entered into on or after July 1, 2026. From that date it requires every solar company operating in Colorado to provide a standardized disclosure form before any contract is signed."),
]


def apply(path, pairs):
    src = io.open(path, encoding="utf-8").read()
    applied, problems = 0, []
    for old, new in pairs:
        if new in src:
            continue
        n = src.count(old)
        if n == 0:
            problems.append("MISSING: " + old[:70])
            continue
        if n > 1:
            problems.append("NON-UNIQUE (%d): %s" % (n, old[:60]))
            continue
        src = src.replace(old, new)
        applied += 1
    io.open(path, "w", encoding="utf-8").write(src)
    return applied, problems


def main() -> int:
    a1, p1 = apply(BATCHE, PAIRS_E)
    a2, p2 = apply(STATES, PAIRS_STATES)
    print("city-content-depth-batch-e.ts applied:", a1, "| problems:", p1)
    print("state-laws.ts                applied:", a2, "| problems:", p2)
    return 1 if (p1 or p2) else 0


if __name__ == "__main__":
    sys.exit(main())
