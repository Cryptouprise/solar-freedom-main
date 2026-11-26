#!/usr/bin/env python3
"""
add_changelog_bill_accuracy.py

Appends the bill-accuracy entries to BOTH shared/changeLog.ts and
docs/CHANGE-LOG.md, newest-first in the Markdown mirror.

Idempotent: keyed on the exact title. Safe to re-run.

Entries added:
  1. California SB 784 was described as enacted law while held in committee
  2. Florida HB 741 was vetoed in 2022 and the site said it changed the law
  3. Colorado SB25-299 and Oregon HB 4029 had wrong effective dates
  4. Florida Stat. 501.021 (definitions) was cited as the cancellation right
  5. California AB 1070 was cited as a 2023 law; it is Stats. 2017, Ch. 662
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TS = ROOT / "shared" / "changeLog.ts"
MD = ROOT / "docs" / "CHANGE-LOG.md"

# ── The entries, newest first ────────────────────────────────────────────
# (title, class, changed[], evidence, reasoning, confidence, verifiedBy,
#  preventsRecurrence, measureAfter)
ENTRIES = [
    dict(
        title="California SB 784 was described as enacted law while it sits in committee",
        cls="accuracy",
        changed=[
            "client/src/data/state-laws.ts — the California entry: the SB 784 H2 became 'Your Three-Day Right to Cancel, and How the Window Gets Extended'; the body now cites Civil Code 1689.6 and 1689.7(g) and carries an explicit pending-legislation caution; coolingOffNote no longer credits a bill with the senior window",
            "client/src/data/blog-articles-batch5.ts — the Sacramento article: title, metaTitle, metaDescription, excerpt, ctaSubtext, opening sentence, H3 and FAQ answer; also removed an unsourced 'Over 500 CA homeowners helped' and an 'Act now' urgency line from the metaDescription",
            "client/src/data/city-content-depth-batch-e.ts — 15 instances across Sacramento, San Francisco and San Jose",
            "server/billStatusClaims.test.ts — new guard, 12 tests",
            "scripts/fix-1126-sb784-not-law.py and scripts/fix-1126-sb784-batche-and-colorado.py — idempotent fixers",
        ],
        evidence=(
            "Official bill status read 26 Nov 2026 at leginfo.legislature.ca.gov: SB-784 "
            "'Home improvement loans: right to cancel contracts.' is 'Active Bill - In "
            "Committee Process', last action 08/13/26 'August 13 hearing: Held in committee "
            "and under submission.' The site told readers it was 'Effective January 1, 2026', "
            "that it 'requires' a live Confirmation Call, and that it 'extends' the "
            "cancellation window. Separately, the 5-business-day senior window credited to "
            "SB 784 comes from Civ. Code 1689.6, where 1689.6(a)(4) applies the five-day "
            "right to contracts entered into on or after 1 January 2021 — not 2026, and not "
            "any bill. 1689.6 was amended by AB 1327 (Stats. 2025, Ch. 348, Sec. 3), "
            "effective 1 Jan 2026. The real extension mechanism is Civ. Code 1689.7(g): "
            "'Until the seller has complied with this section the buyer may cancel.' "
            "1689.7(a)(1) requires the cancellation statement at the signature space in at "
            "least 10-point boldface; 1689.7(c)(1) requires an easily detachable Notice of "
            "Cancellation in at least 10-point type."
        ),
        reasoning=(
            "A bill held in committee creates no rights, so the page was telling California "
            "homeowners they held statutory protections that do not exist — the single most "
            "damaging kind of error this site can publish, because the audience includes "
            "attorneys and the remedy described is the thing a homeowner would act on. The "
            "defect survived every earlier content review because the citation looks "
            "authoritative: a real bill number, a real subject, a plausible date. The fix "
            "replaces a promise with the mechanism that actually exists, 1689.7(g), which is "
            "stronger copy as well as accurate copy, because it gives the reader a testable "
            "question — did the seller comply with the notice requirements? — rather than a "
            "statute that may never pass."
        ),
        conf="verified",
        verifiedBy=(
            "grep on the built page confirms 'Three-Day Right to Cancel', '1689.7(g)', "
            "'10-point boldface', 'held in committee' and 'not an enacted law' are all "
            "present in dist/public/solar-contract-laws/california/index.html; the Sacramento "
            "page carries zero SB 784 mentions and no unsourced figure; npx vitest run "
            "server/billStatusClaims.test.ts — 12 passed"
        ),
        prevents=(
            "server/billStatusClaims.test.ts fails the build if any indexable page or any "
            "SOURCE file describes a pending bill as in force. The source scan is the part "
            "that matters: it caught 15 more instances in city-content-depth-batch-e.ts, "
            "which feeds the runtime CityPage rather than the pre-rendered shell, so those "
            "claims were live for readers with JavaScript while being invisible to a "
            "dist/public scan."
        ),
        measure="2026-12-05",
    ),
    dict(
        title="Florida HB 741 was vetoed in 2022 and the site said it changed the law",
        cls="accuracy",
        changed=[
            "client/src/data/blog-articles-batch2.ts — the Orlando article: the HB 741 FAQ and the warning block",
            "client/src/data/blog-articles-batch3.ts — the Miami article: the HB 741 FAQ and callout",
            "client/src/data/blog-articles-batch4.ts — the misleading-savings article (INDEXABLE): the net-metering paragraph",
            "client/src/data/city-content-depth-batch-a.ts — Jacksonville, Fort Lauderdale and Cape Coral: localHook, stat label, complaint entry, whyItHappens and FAQ",
            "client/src/data/city-content-depth.ts — Orlando, Tampa and Miami: localHook, stat label, complaint entry, whyItHappens and FAQ",
            "scripts/fix-1126-fl-hb741-ab1070-hb4029.py — idempotent fixer",
            "server/billStatusClaims.test.ts — extended with a vetoed-bill guard",
        ],
        evidence=(
            "Official record read 26 Nov 2026 at flsenate.gov/Session/Bill/2022/741: "
            "4/27/2022 'Signed by Officers and presented to Governor • Vetoed by Governor', "
            "and 12/7/2023 'Veto Message transmitted to Secretary of State'. The bill never "
            "became law, and Florida retail-rate net metering is still in effect. The site "
            "said 'Florida HB 741 in 2023 changed net metering rules', 'HB 741, effective "
            "January 2024, changed how FPL compensates homeowners', and shipped the stat "
            "label '2023 (HB 741)' across three city blocks — 29 mentions in total, one of "
            "them on an INDEXABLE page."
        ),
        reasoning=(
            "This is the same class as SB 784, found in the same sweep, and it is the one "
            "with the clearest commercial cost. The site was telling Florida homeowners that "
            "a rule change caused their savings shortfall, which points them away from the "
            "real and actionable cause: an overstated savings projection that the applicable "
            "rules never supported. It also set up a false expectation about what evidence "
            "they would need, since a homeowner would go looking for a rate-change notice "
            "that does not exist. Correcting it makes the FDUTPA claim stronger rather than "
            "weaker, because the misrepresentation now stands on its own instead of depending "
            "on a law that was never enacted."
        ),
        conf="verified",
        verifiedBy=(
            "A scan of all 583 built pages for the six vetoed-bill patterns returns 0 "
            "unflagged assertions, and the single INDEXABLE page that mentions HB 741 "
            "describes the veto; grep for '2023 (HB 741)' across client/src returns 0"
        ),
        prevents=(
            "server/billStatusClaims.test.ts asserts, across source and built output, that "
            "no page describes HB 741 as operative law. The pattern set was validated in both "
            "directions before being committed: 0 matches against the corrected source, and 7 "
            "of 7 caught against regressions written from the actual pre-fix strings."
        ),
        measure="2026-12-05",
    ),
    dict(
        title="Two enacted solar bills had the wrong effective date",
        cls="accuracy",
        changed=[
            "client/src/data/state-laws.ts — Colorado SB25-299 and Oregon HB 4029",
            "client/src/data/blog-articles-batch5.ts — the Portland article: title, metaDescription, excerpt, ctaSubtext and two body blocks",
            "scripts/fix-1126-sb784-batche-and-colorado.py and scripts/fix-1126-fl-hb741-ab1070-hb4029.py",
        ],
        evidence=(
            "Read 26 Nov 2026. Colorado SB25-299: leg.colorado.gov/bills/sb25-299 — signed "
            "4 Jun 2025, session law effective 6 Aug 2025, Chapter 427, and its requirements "
            "'apply to agreements between a solar sales company and a consumer that are "
            "entered into on or after July 1, 2026.' The page said 'Effective January 1, "
            "2026'. Oregon HB 4029: olis.oregonlegislature.gov — Governor signed 5 March "
            "2026, Chapter 11 of the 2026 Laws, 'Effective date June 5, 2026'. The page said "
            "'took effect January 1, 2026'. Its official title is 'Relating to solar energy "
            "systems'; the site called it the 'Residential Solar Disclosure Act'."
        ),
        reasoning=(
            "Both bills are real law, so this is a subtler error than the vetoed bills and a "
            "more instructive one: an effective date is not one fact but two. A session-law "
            "effective date is the date the act takes legal effect as a statute; the date its "
            "requirements begin to apply to a given contract can be later, as Colorado shows "
            "by five months. Telling a homeowner a disclosure duty already applied to their "
            "2025 contract when it begins with contracts signed after 1 July 2026 invites "
            "them to make a demand they cannot support. The Oregon case is the mirror image: "
            "a real, strong consumer law whose requirements begin later than the page "
            "implied, which risks a reader concluding their pre-June-2026 contract is "
            "covered when it is not."
        ),
        conf="verified",
        verifiedBy=(
            "Built output confirms dist/public/solar-contract-laws/oregon/index.html "
            "contains 'June 5, 2026' and zero occurrences of 'January 1, 2026'; "
            "server/billStatusClaims.test.ts asserts both dates for both states"
        ),
        prevents=(
            "server/billStatusClaims.test.ts asserts Colorado states 1 July 2026 and not 1 "
            "January 2026, and that Oregon states 5 June 2026 and not 1 January 2026, in both "
            "state-laws.ts and the Portland article. Standing rule: before asserting a bill's "
            "effective date, read the session-law line AND the applicability clause."
        ),
        measure="2026-12-05",
    ),
    dict(
        title="Florida Stat. 501.021 is the definitions section, not the cancellation right",
        cls="accuracy",
        changed=[
            "client/src/data/state-laws.ts — the Florida coolingOffNote, stat block and body paragraph",
            "client/src/data/city-content-depth.ts — the Orlando stateLawExpanded and the 3-day FAQ",
            "client/src/data/blog-articles-batch5.ts — the Tampa article body",
        ],
        evidence=(
            "Read 26 Nov 2026 at leg.state.fl.us: F.S. 501.021 is titled 'Home solicitation "
            "sale; definitions' and its own text scopes the Act to 'ss. 501.021-501.055'. "
            "The operative right is 501.025: 'the buyer has the right to cancel a home "
            "solicitation sale until midnight of the third business day after the day on "
            "which the buyer signs an agreement or offer to purchase'. The site cited "
            "501.021 as the source of the 3-business-day right in six places."
        ),
        reasoning=(
            "This is the definitions-versus-operative defect that was already corrected once "
            "on 3 Nov 2026 for Cal. Civ. Code 1689.5, A.R.S. 44-5001 and NRS 598.2821 — and "
            "the same wrong section was fixed in blog-articles-batch9.ts while these six "
            "other occurrences were missed. That makes it a process failure rather than an "
            "oversight, which is why the guard is a positive rule over every occurrence in "
            "the content files rather than another single correction. The tell is identical "
            "each time: the wrong number sits in the correct chapter and the correct part, so "
            "a reviewer checking the topic rather than the section passes it."
        ),
        conf="verified",
        verifiedBy=(
            "Built output: 3 pages cite 501.025 and 2 cite 501.021, both as part of the "
            "Act range; npx vitest run server/billStatusClaims.test.ts — 12 passed"
        ),
        prevents=(
            "server/billStatusClaims.test.ts now requires every 501.021 citation in the "
            "content files to be either the Act range (501.021-501.055) or an explicit "
            "definitions note, and asserts 501.025 is cited somewhere. This turns the "
            "recurring class into a rule about every occurrence rather than a list of "
            "corrected ones."
        ),
        measure="2026-12-05",
    ),
    dict(
        title="California AB 1070 was cited as a 2023 law; it is Stats. 2017, Ch. 662",
        cls="accuracy",
        changed=[
            "client/src/data/blog-articles-batch9.ts — the attorney-general complaint article: the FAQ, the body paragraph and the state list entry",
        ],
        evidence=(
            "Read 26 Nov 2026. AB 1070 is 'Solar energy systems: contracts: disclosures', "
            "Stats. 2017, Ch. 662, codified at Business and Professions Code section 7169, "
            "requiring the CSLB solar disclosure documents. Sources: cutredtape.com, "
            "'Assembly Bill 1070, Stats of 2017, Ch 662 established Business and Professions "
            "Code (BPC) section 7169'; gravel2gavel.com, 'AB 1070 enacted late last year "
            "(Chapter 662, Statutes of 2017)'. The site said 'AB 1070 (2023)' in three "
            "places and told readers to cite that year in an Attorney General complaint."
        ),
        reasoning=(
            "A wrong year on a statute is not cosmetic when the page's whole purpose is to "
            "tell a reader what to cite. A homeowner who follows that instruction quotes a "
            "2023 session that never produced the law, which is the fastest way to have a "
            "complaint discounted. The correction also improves the advice: the useful "
            "reference is the CSLB disclosure requirement at B&P Code 7169, because that is "
            "the document a homeowner can check against what they were actually given."
        ),
        conf="verified",
        verifiedBy=(
            "grep -c 'Stats. 2017, Ch. 662' on "
            "dist/public/blog/how-to-file-a-complaint-against-solar-company-attorney-general/"
            "index.html returned 4; the string 'AB 1070 (2023)' returns 0 across client/src"
        ),
        prevents=(
            "server/billStatusClaims.test.ts asserts the page never says 'AB 1070 (2023)' and "
            "does say 'AB 1070 (Stats. 2017, Ch. 662)'. AB 1070 is also in the ENACTED_BILLS "
            "allowlist with its session law recorded inline, so it cannot be mistaken for a "
            "pending bill."
        ),
        measure="2026-12-05",
    ),
]


def ts_entry(e) -> str:
    def arr(items, indent="      "):
        return "\n".join(f"{indent}{q(i)}," for i in items)

    return (
        "  {\n"
        f'    date: "2026-11-26",\n'
        f"    title: {q(e['title'])},\n"
        f'    class: "{e["cls"]}",\n'
        "    changed: [\n"
        f"{arr(e['changed'])}\n"
        "    ],\n"
        f"    evidence: {q(e['evidence'])},\n"
        f"    reasoning: {q(e['reasoning'])},\n"
        f'    confidence: "{e["conf"]}",\n'
        f"    verifiedBy: {q(e['verifiedBy'])},\n"
        f"    preventsRecurrence: {q(e['prevents'])},\n"
        f'    measureAfter: "{e["measure"]}",\n'
        "  },\n"
    )


def q(s: str) -> str:
    """Render a Python string as a TypeScript double-quoted string."""
    out = s.replace("\\", "\\\\").replace('"', '\\"')
    out = out.replace("\n", "\\n")
    return f'"{out}"'


def md_block(e) -> str:
    changed = "\n".join(f"- {c}" for c in e["changed"])
    return (
        f"## 2026-11-26 — {e['title']}\n"
        f"**Class:** {e['cls']}\n"
        f"**Changed:**\n{changed}\n"
        f"**Why:** {e['reasoning']} {e['evidence']}\n"
        f"**Verified:** {e['verifiedBy']}\n"
        f"**Recurrence guard:** {e['prevents']}\n"
        f"**Measure after:** {e['measure']}\n"
    )


def main():
    ts = TS.read_text(encoding="utf-8")
    md = MD.read_text(encoding="utf-8")
    added_ts = 0
    added_md = 0

    for e in ENTRIES:
        if f"title: {q(e['title'])}" in ts:
            print(f"  skip (already in TS): {e['title'][:60]}")
        else:
            # insert before the closing bracket of the CHANGE_LOG array
            marker = "\n];\n"
            idx = ts.rfind(marker)
            if idx == -1:
                print("FATAL: could not find the CHANGE_LOG array terminator")
                sys.exit(1)
            ts = ts[: idx + 1] + ts_entry(e) + ts[idx + 1 :]
            added_ts += 1
            print(f"  +TS: {e['title'][:60]}")

        heading = f"## 2026-11-26 — {e['title']}"
        if heading in md:
            print(f"  skip (already in MD): {e['title'][:60]}")
        else:
            first = md.find("\n## ")
            if first == -1:
                print("FATAL: could not find the first entry heading in CHANGE-LOG.md")
                sys.exit(1)
            # newest-first: insert after the preamble, before the current first entry
            md = md[: first + 1] + md_block(e) + md[first + 1 :]
            added_md += 1
            print(f"  +MD: {e['title'][:60]}")

    TS.write_text(ts, encoding="utf-8")
    MD.write_text(md, encoding="utf-8")
    print(f"\nTS entries added: {added_ts}")
    print(f"MD entries added: {added_md}")


if __name__ == "__main__":
    main()
