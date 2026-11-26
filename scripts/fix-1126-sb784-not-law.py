#!/usr/bin/env python3
"""
Correct the SB 784 misstatement of law on the two INDEXABLE pages that carry it.

Why this exists (verified 26 Nov 2026):
California SB 784 (2025-2026) is NOT law. The official bill status page at
leginfo.legislature.ca.gov shows Measure SB-784 "Home improvement loans: right to
cancel contracts." with Type of Measure = "Active Bill - In Committee Process"
and last action 08/13/26: "August 13 hearing: Held in committee and under
submission." A bill held in committee is not enacted and creates no rights.

Two indexable pages stated it as effective law:
  1. /solar-contract-laws/california (indexable, in INDEXED_STATE_SLUGS)
     - H2 "SB 784: California's 2026 Solar Transparency Act"
     - body: "Effective January 1, 2026, SB 784 requires lenders to conduct a
       live Confirmation Call before any solar loan is finalized ... the loan
       agreement may be rescindable under this new law. Additionally, SB 784
       extends the cancellation window to 5 business days for homeowners over 65."
     - coolingOffNote credited the 5-day senior window to SB 784 (2026)
  2. /blog/cancel-solar-contract-sacramento-ca (indexable)
     - title, metaTitle, metaDescription, excerpt, ctaSubtext, an opening
       sentence, an H3, and a FAQ answer

Verified facts used in the replacement text (all read from the official text on
26 Nov 2026):
  - Civ. Code 1689.6(a)(1): right to cancel a home solicitation contract until
    midnight of the THIRD business day, or the FIFTH business day for a senior
    citizen. Amended by Stats. 2025, Ch. 348, Sec. 3 (AB 1327), effective
    1 Jan 2026.
  - Civ. Code 1689.6(a)(4): the five-day right applies to contracts entered into
    on or after 1 January 2021 -- NOT 2026, and not SB 784.
  - Civ. Code 1689.7(g): "Until the seller has complied with this section the
    buyer may cancel the home solicitation contract or offer." This is the real
    statutory basis for an extended window when the required notice was missing
    or defective.
  - Civ. Code 1689.7(a)(1): the cancellation statement must appear in immediate
    proximity to the signature space in at least 10-point boldface type.
  - Civ. Code 1689.7(c)(1): the "Notice of Cancellation" form must accompany the
    agreement, be easily detachable, and be in type of at least 10-point.

Also fixes an unrelated but adjacent defect on the Sacramento page: the
metaDescription promised "Over 500 CA homeowners helped" with no source anywhere
in the repository, and used "Act now" urgency. Both removed.

Idempotent: every replacement is keyed on an exact source string and refuses to
double-apply. Run: python3 scripts/fix-1126-sb784-not-law.py
"""
import io
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATES = os.path.join(ROOT, "client", "src", "data", "state-laws.ts")
BATCH5 = os.path.join(ROOT, "client", "src", "data", "blog-articles-batch5.ts")

# ── state-laws.ts ────────────────────────────────────────────────────────────
S1_OLD = """        content: 'SB 784: California\\'s 2026 Solar Transparency Act',
      },
      {
        type: 'p',
        content: 'Effective January 1, 2026, SB 784 requires lenders to conduct a live "Confirmation Call" before any solar loan is finalized. The purpose is to ensure you actually understood what you were signing. If your lender skipped this call, rushed through it, or conducted it in a language you don\\'t speak fluently, the loan agreement may be rescindable under this new law. Additionally, SB 784 extends the cancellation window to 5 business days for homeowners over 65.',"""

S1_NEW = """        content: 'Your Three-Day Right to Cancel, and How the Window Gets Extended',
      },
      {
        type: 'p',
        content: 'Under Civil Code 1689.6, a home solicitation contract can be cancelled until midnight of the third business day after you sign, or the fifth business day if you are a senior citizen. The five-day senior rule has applied to contracts entered into on or after January 1, 2021, and the section was most recently amended by AB 1327 (Stats. 2025, Ch. 348), effective January 1, 2026. The window runs from the signing date, not from the installation date.',
      },
      {
        type: 'p',
        content: 'The extension most homeowners actually rely on is Civil Code 1689.7(g): until the seller has complied with the notice requirements in that section, the buyer may cancel. Those requirements are specific. The cancellation statement must appear in immediate proximity to the signature space in at least 10-point boldface type, and the agreement must be accompanied by an easily detachable Notice of Cancellation in type of at least 10-point. If the notice was missing, buried inside the body of the contract, or too small, the extended right is the argument to raise, and the notice itself is the first document to examine.',
      },
      {
        type: 'p',
        content: 'One caution about pending legislation. California SB 784 (2025-2026), titled Home improvement loans: right to cancel contracts, would require lenders to obtain a borrower\\'s confirmation of loan terms before certain home improvement loans are executed. As of 26 November 2026 it is an active bill held in committee, not an enacted law, so it does not currently create a cancellation right or extend any deadline. Check the official bill status before relying on any summary of a pending bill, including this one.',"""

S2_OLD = "coolingOffNote: 'Extended to 5 days for seniors (65+) under SB 784 (2026). If the Notice of Cancellation was not provided in 10-point font, the window may be legally extended indefinitely.',"
S2_NEW = "coolingOffNote: 'Three business days from signing, or five business days for a senior citizen (65+), under Civil Code 1689.6. If the seller did not comply with the notice requirements in Civil Code 1689.7, including the 10-point boldface statement and the detachable Notice of Cancellation, the buyer may cancel until that section is complied with.',"

# ── blog-articles-batch5.ts (Sacramento) ─────────────────────────────────────
S3_OLD = "    title: 'Sacramento Solar Contract Cancellation: California\\'s SB 784 Changes Everything in 2026',"
S3_NEW = "    title: 'Sacramento Solar Contract Cancellation: California\\'s Three-Day Right to Cancel in 2026',"

S4_OLD = "    metaTitle: 'Cancel Your Solar Contract in Sacramento, CA | California SB 784 2026',"
S4_NEW = "    metaTitle: 'Cancel a Sacramento Solar Contract | California Cancel Rights',"

S5_OLD = "    metaDescription: `Sacramento homeowners: SB 784 & NEM 3.0 offer new ways to cancel solar contracts. Over 500 CA homeowners helped. Act now for a free case review.`,"
S5_NEW = "    metaDescription: `Sacramento solar contracts: California's three-day right to cancel, the notice defects that extend it, and the NEM 3.0 math that changed the deal.`,"

S6_OLD = "    excerpt: 'SB 784 requires a live Confirmation Call before any solar loan is finalized. If your lender skipped it, your Sacramento contract may already be voidable under California law.',"
S6_NEW = "    excerpt: 'California gives you three business days to cancel a home solicitation contract, and longer when the required notice was missing. Here is what to check in a Sacramento agreement.',"

S7_OLD = "    ctaSubtext: 'SB 784 extends your cancellation window to 5 days -- find out if it applies to you.',"
S7_NEW = "    ctaSubtext: 'Three business days from signing, or five for seniors -- find out whether a notice defect extends your window.',"

S8_OLD = "With the federal residential tax credit officially expired and the implementation of SB 784, many Sacramento residents are finding that the high-pressure sales pitch they heard a year ago was built on outdated or misleading information.'"
S8_NEW = "With the federal residential tax credit expired for systems placed in service after December 31, 2025, and NEM 3.0 export credits far below what was promised, many Sacramento residents are finding that the high-pressure sales pitch they heard a year ago was built on outdated or misleading information.'"

S9_OLD = "        content: 'SB 784: The Solar Transparency Act',"
S9_NEW = "        content: 'California\\'s Three-Day Right to Cancel, and What Extends It',"

S10_OLD = "        a: 'Absolutely. If the contract violates SB 784 or California\\'s strict disclosure laws, the physical installation does not make the debt permanent. We have successfully helped many homeowners have systems removed and debts wiped.',"
S10_NEW = "        a: 'The installation does not by itself make the debt permanent, but it does close the ordinary cancellation window, which runs from the signing date rather than the installation date. The arguments that survive installation are different ones: a missing or defective Notice of Cancellation under Civil Code 1689.7, a required disclosure that was never delivered, or a misrepresentation about savings, production or a government incentive. Which of those applies depends on the documents in the file.',"


def apply(path, pairs):
    src = io.open(path, encoding="utf-8").read()
    applied, missing = 0, []
    for old, new in pairs:
        if new in src:
            continue  # already applied
        if old not in src:
            missing.append(old[:70])
            continue
        if src.count(old) != 1:
            missing.append("NON-UNIQUE (%d): %s" % (src.count(old), old[:60]))
            continue
        src = src.replace(old, new)
        applied += 1
    io.open(path, "w", encoding="utf-8").write(src)
    return applied, missing


def main() -> int:
    a1, m1 = apply(STATES, [(S1_OLD, S1_NEW), (S2_OLD, S2_NEW)])
    a2, m2 = apply(BATCH5, [(S3_OLD, S3_NEW), (S4_OLD, S4_NEW), (S5_OLD, S5_NEW),
                            (S6_OLD, S6_NEW), (S7_OLD, S7_NEW), (S8_OLD, S8_NEW),
                            (S9_OLD, S9_NEW), (S10_OLD, S10_NEW)])
    print("state-laws.ts       applied:", a1, "| problems:", m1)
    print("blog-articles-b5.ts applied:", a2, "| problems:", m2)
    return 1 if (m1 or m2) else 0


if __name__ == "__main__":
    sys.exit(main())
