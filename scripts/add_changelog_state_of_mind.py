#!/usr/bin/env python3
"""Append the two state-of-mind-claim entries to shared/changeLog.ts and docs/CHANGE-LOG.md."""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

TITLE1 = (
    "An indexable page asserted that Sunrun knew, as established fact, and named "
    "fraud in its title"
)
TITLE2 = (
    "A new guard for state-of-mind claims about named companies found a second "
    "page on its first run"
)
DATE = "2026-11-26"

ENTRY1 = f"""  {{
    date: "{DATE}",
    title: "{TITLE1}",
    class: "accuracy",
    changed: [
      "client/src/data/blog-articles-batch6.ts — sunrun-complaints-california: metaTitle and metaDescription rewritten to state the verifiable mechanism instead of asserting intent; added three sections covering the ranked complaint list, the correct California complaint body, and what NEM 3.0 actually changed",
      "scripts/fix-1126-sunrun-ca-accuracy.py — new idempotent fixer",
      "server/unsourcedClaims.test.ts — new STATE_OF_MIND pattern plus 2 tests",
    ],
    evidence:
      "Measured 26 Nov 2026, window 2026-08-26 to 2026-11-23 (90 days): /blog/sunrun-complaints-california holds 45 queries, 214 impressions, 1 click, CTR 0.47%, average position 12.6, and is INDEXABLE. Its served metaTitle read 'Sunrun Complaints California 2026 — NEM 3.0 Fraud & Legal Options' and its served metaDescription read 'California Sunrun customers: NEM 3.0 wiped out your savings and Sunrun knew. If you were misled, you may have a fraud claim.' A repository-wide grep for Sunrun's state of mind returned nothing, because no source for it exists. After the fix the built page contains 0 occurrences of 'Sunrun knew', 0 of 'Fraud & Legal' and 0 of 'wiped out your savings'; it now contains 'consumer affairs' x3, 'NEM 2.0' x5, 'CSLB' x10, 'Contractors State License Board' x5 and '15 April 2023' x7, with a 59-character title and a 151-character description.",
    reasoning:
      "Two separate problems in one snippet. The accuracy problem: 'Sunrun knew' asserts a named company's state of mind, and intent is a finding a court makes rather than something this site can state; 'NEM 3.0 Fraud' names a legal conclusion in the title itself. This site's own /how-it-works page says Solar Freedom is not a law firm, so it cannot plead a claim it is not making. A provably false statement of fact about a named company is the core of a defamation claim, and naming the company in a meta description satisfies the 'of and concerning' element for every searcher who sees it. It is also a conversion problem in the opposite direction from the usual one: a homeowner who is genuinely unsure whether they were misled is told their case is already proven, which is the same over-promise the trust governance exists to prevent. The SEO problem, measured rather than assumed: the page ranks 6.9 for 'list the most common complaints from current sunrun users' and 7.7 for 'what problems are most frequently reported by sunrun customers?' — two extractable-answer queries — while answering neither in list form, and ranks 20.3 for 'sunrun consumer affairs' with zero occurrences of the phrase. The fix routes 'consumer affairs' to the RIGHT body: the CPUC Consumer Affairs Branch handles utilities, not solar contractors, so sending readers there would have introduced a new error. The correct California body is the Contractors State License Board, which runs a dedicated solar complaint form and states a four-year window for construction complaints, verified 26 Nov 2026 at cslb.ca.gov. NEM 3.0 facts come from the CPUC's own Net Energy Metering and Net Billing page: since 15 April 2023, customers applying for interconnection take service on the net billing tariff under D.22-12-056. The rewrite also separates two problems the old copy blended — a projection built on NEM 2.0 export rates versus production that never matched the written estimate — because they are different claims with different evidence.",
    confidence: "measured",
    verifiedBy:
      "npx vitest run server/unsourcedClaims.test.ts (8 tests); pnpm check clean; 90 test files, 866 tests passed, 3 skipped; node scripts/trust-governance-audit.mjs passed; pnpm build pre-rendered 583 pages; built-page grep confirms all three banned strings at 0 and all five new vocabulary items present",
    preventsRecurrence:
      "The new STATE_OF_MIND pattern matches a company name followed by a knowledge verb in any meta field and fails the build. It is deliberately narrow: it does not fire on the legitimate hedge 'depends on what it knew', which is how these pages should read, and it does fire on 'knew (or should have known)', because asserting what a sales rep knew is the same problem with a softer verb. A companion test reproduces the exact shipped sentence and asserts the pattern catches it.",
    measureAfter: "2026-12-05",
  }},
"""

ENTRY2 = f"""  {{
    date: "{DATE}",
    title: "{TITLE2}",
    class: "accuracy",
    changed: [
      "client/src/data/blog-articles-batch14.ts — goodleap-tila-violation-cancel-solar-loan: metaTitle and metaDescription rewritten to drop the assertion of fact",
      "scripts/fix-1126-goodleap-tila-metaclaims.py — new idempotent fixer",
    ],
    evidence:
      "The STATE_OF_MIND guard added earlier the same day, on its first run across every file in client/src/data, returned two hits rather than the one it was written for: the Sunrun California page already fixed, and blog-articles-batch14.ts line 15, whose metaDescription read 'GoodLeap hid dealer fees in your loan documents — that's a federal TILA violation. Attorneys are using it to cancel GoodLeap loans right now.' The page /blog/goodleap-tila-violation-cancel-solar-loan is noindex, follow, verified in dist/public on 26 Nov 2026 and absent from INDEXED_BLOG_SLUGS. After the fix the built page contains 0 occurrences of 'GoodLeap hid', 0 of \"that's a federal TILA violation\" and 0 of 'Attorneys are using it'.",
    reasoning:
      "Lower exposure than the Sunrun defect because the page is noindex, so no searcher reaches it from Google. Fixed anyway for three reasons. First, a live readable page is still readable: it is linked from the site and can be reached directly or by an AI crawler, and 'noindex' governs Google's index rather than the truth of the sentence. Second, the three assertions are the most legally exposed on the site: 'GoodLeap hid' asserts a completed act and a state of mind, \"that's a federal TILA violation\" states the legal conclusion as fact rather than as the question to investigate, and 'Attorneys are using it to cancel GoodLeap loans right now' asserts a current practice with no source. Third, the body of that same article is largely conditional and therefore defensible — its FAQ says 'if a lender fails to make required disclosures, you have the right to rescind', which states the rule rather than a conclusion — so the meta copy was the unhedged part and the part served to every searcher and social preview, where the surrounding conditional context is stripped away. The rewrites keep the search intent (TILA, dealer fees, rescission, cancellation) and state what TILA requires and what a review checks. The broader lesson recorded here is that a guard written for one page and scoped to every file finds the second instance of its class immediately, which is the argument for writing the guard rather than the correction.",
    confidence: "verified",
    verifiedBy:
      "npx vitest run server/unsourcedClaims.test.ts — proven in both directions: the shipped sentence was injected back into batch14 and the test failed with 'blog-articles-batch14.ts:15 \"GoodLeap hid\"', then passed on restore; pnpm check clean; 90 test files, 866 tests passed, 3 skipped; pnpm build pre-rendered 583 pages; built-page grep confirms all three banned strings at 0",
    preventsRecurrence:
      "The same STATE_OF_MIND guard covers this page and every other file in client/src/data, so a third instance fails the build without anyone having to remember this one existed.",
    measureAfter: "2026-12-05",
  }},
"""


def md_for(title: str, body: str) -> str:
    return body


def main() -> None:
    ts = ROOT / "shared/changeLog.ts"
    s = ts.read_text(encoding="utf-8")
    added = 0
    for title, entry in ((TITLE1, ENTRY1), (TITLE2, ENTRY2)):
        if title in s:
            print("TS already has:", title[:60])
            continue
        i = s.rfind("\n];\n")
        assert i != -1
        s = s[: i + 1] + entry + s[i + 1 :]
        added += 1
    if added:
        ts.write_text(s, encoding="utf-8")
        print(f"TS: appended {added}")

    md = ROOT / "docs/CHANGE-LOG.md"
    m = md.read_text(encoding="utf-8")
    blocks = []
    for title, entry in ((TITLE1, ENTRY1), (TITLE2, ENTRY2)):
        if title in m:
            print("MD already has:", title[:60])
            continue
        # convert the TS entry into Markdown, newest first
        import re as _re

        body = entry
        cls = _re.search(r'class: "([a-z]+)"', body).group(1)
        changed = _re.search(r"changed: \[(.*?)\n    \],", body, _re.S).group(1)
        changed_items = _re.findall(r'"((?:[^"\\]|\\.)*)"', changed)
        evidence = _re.search(r'evidence:\s*"(.*?)",\n    reasoning:', body, _re.S).group(1)
        reasoning = _re.search(r'reasoning:\s*"(.*?)",\n    confidence:', body, _re.S).group(1)
        verified = _re.search(r'verifiedBy:\s*"(.*?)",\n    preventsRecurrence:', body, _re.S).group(1)
        prevents = _re.search(r'preventsRecurrence:\s*"(.*?)",\n    measureAfter:', body, _re.S).group(1)
        measure = _re.search(r'measureAfter: "(.*?)"', body).group(1)

        def unesc(t: str) -> str:
            return t.replace('\\"', '"').replace("\n      ", " ")

        blk = f"## {DATE} — {title}\n"
        blk += f"**Class:** {cls}\n"
        blk += "**Changed:**\n"
        for c in changed_items:
            blk += f"- {unesc(c)}\n"
        blk += f"**Why:** {unesc(evidence)}\n"
        blk += f"**How the conclusion was reached:** {unesc(reasoning)}\n"
        blk += f"**Verified:** {unesc(verified)}\n"
        blk += f"**Recurrence guard:** {unesc(prevents)}\n"
        blk += f"**Measure after:** {measure}\n\n"
        blocks.append(blk)

    if blocks:
        lines = m.split("\n")
        out = lines[0] + "\n" + "".join(blocks) + "\n".join(lines[1:])
        md.write_text(out, encoding="utf-8")
        print(f"MD: inserted {len(blocks)}")


if __name__ == "__main__":
    main()
