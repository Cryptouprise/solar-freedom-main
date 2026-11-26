#!/usr/bin/env python3
"""
fix-1126-fl-hb741-ab1070-hb4029.py

Corrects four verified factual defects, all found by checking each bill
citation on the site against its official legislature page on 26 Nov 2026.

1. FLORIDA HB 741 -- described site-wide as a law that changed net metering
   in 2023. It was VETOED by Governor DeSantis on 27 April 2022 and never
   became law. Florida retail-rate net metering (PSC Rule 25-6.065) is still
   in effect.
   Official: https://www.flsenate.gov/Session/Bill/2022/741
   History: 4/27/2022 "Signed by Officers and presented to Governor -
   Vetoed by Governor"; 12/7/2023 "Veto Message transmitted to
   Secretary of State".

2. FLORIDA STAT. 501.021 -- cited as the source of the 3-business-day
   cancellation right. 501.021 is "Home solicitation sale; definitions."
   The operative right is 501.025 ("the buyer has the right to cancel a
   home solicitation sale until midnight of the third business day after
   the day on which the buyer signs an agreement or offer to purchase").
   The Act itself spans 501.021-501.055 (per 501.021's own text).
   Official: https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&Search_String=&URL=0500-0599/0501/Sections/0501.021.html

3. CALIFORNIA AB 1070 -- cited as a 2023 law. It is AB 1070, Stats. 2017,
   Ch. 662, codified at Business and Professions Code section 7169
   (the CSLB solar disclosure requirement).
   Sources: cutredtape.com ("Assembly Bill 1070, Stats of 2017, Ch 662
   established Business and Professions Code (BPC) section 7169");
   gravel2gavel.com ("AB 1070 enacted late last year (Chapter 662,
   Statutes of 2017)").

4. OREGON HB 4029 -- described as taking effect January 1, 2026 and as the
   "Residential Solar Disclosure Act". Verified 26 Nov 2026: Governor
   signed 5 March 2026; Chapter 11, 2026 Laws; "Effective date June 5,
   2026". It is a real disclosure + licensing law, but its requirements
   apply to solar agreements entered into on or after 5 June 2026, and the
   official title is "Relating to solar energy systems".
   Official: https://olis.oregonlegislature.gov/liz/2026R1/Measures/Overview/HB4029
   Roll call: https://legiscan.com/OR/bill/HB4029/2026

Idempotent: each replacement is skipped when the new text is already present.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "client" / "src" / "data"

stats = {"files": 0, "changed": 0, "skipped": 0, "missed": []}


def sub_exact(path: Path, old: str, new: str, label: str):
    """Replace an exact substring once. Idempotent. Reports a miss loudly."""
    text = path.read_text(encoding="utf-8")
    if new in text:
        stats["skipped"] += 1
        return
    if old not in text:
        stats["missed"].append(f"{path.name}: {label}")
        return
    if text.count(old) != 1:
        stats["missed"].append(f"{path.name}: {label} (count={text.count(old)})")
        return
    path.write_text(text.replace(old, new), encoding="utf-8")
    stats["changed"] += 1


def sub_regex(path: Path, pattern: str, new: str, label: str, expect=None):
    """Regex substitution. Idempotent when the new text is already present."""
    text = path.read_text(encoding="utf-8")
    if new in text:
        stats["skipped"] += 1
        return
    new_text, n = re.subn(pattern, new, text)
    if n == 0:
        stats["missed"].append(f"{path.name}: {label}")
        return
    if expect is not None and n != expect:
        stats["missed"].append(f"{path.name}: {label} (n={n}, expected {expect})")
        return
    path.write_text(new_text, encoding="utf-8")
    stats["changed"] += n


# ─────────────────────────────────────────────────────────────────────────
# 1. FLORIDA HB 741 -- the veto
# ─────────────────────────────────────────────────────────────────────────

VETO_FACT = ("Florida's net metering rules never changed -- HB 741 was vetoed "
             "by Governor DeSantis on April 27, 2022 and retail-rate net "
             "metering is still in effect")

# --- blog-articles-batch2.ts (orlando-solar-regret) ---
p = DATA / "blog-articles-batch2.ts"
sub_exact(
    p,
    "{ q: 'How did Florida net metering changes affect solar savings in Orlando?', "
    "a: 'Florida HB 741 in 2023 changed net metering rules, reducing credits for "
    "excess solar production. If your savings projections were based on old rates, "
    "they may now be significantly overstated.' },",
    "{ q: 'Did Florida net metering rules actually change for solar owners?', "
    "a: 'No. HB 741, the 2022 bill that would have phased down net metering credits, "
    "was vetoed by Governor DeSantis on April 27, 2022 and never became law. "
    "Retail-rate net metering is still in effect for Florida\\'s major utilities. "
    "That distinction matters: if your savings fell short, the cause is the savings "
    "projection itself rather than a change in the rules.' },",
    "batch2 line 266 HB 741 FAQ",
)
sub_exact(
    p,
    "{ type: 'warning', content: '\u26a0 Florida\\'s net metering rules changed in "
    "2023 under HB 741. If your salesperson quoted savings based on the old net "
    "metering rates, those projections may now be significantly overstated -- which "
    "could be grounds for a FDUTPA claim.' },",
    "{ type: 'warning', content: '\u26a0 Florida\\'s net metering rules did not change: "
    "HB 741 was vetoed on April 27, 2022, and retail-rate net metering is still in "
    "effect. If your savings fell short anyway, the projection itself is the issue -- "
    "and an overstated savings projection can be grounds for a FDUTPA claim.' },",
    "batch2 line 280 HB 741 warning",
)

# --- blog-articles-batch3.ts (miami-solar-problems-help) ---
p = DATA / "blog-articles-batch3.ts"
sub_exact(
    p,
    "{ q: 'How did Florida net metering changes affect Miami solar savings?', "
    "a: 'Florida HB 741 in 2023 reduced credits for excess solar production. If your "
    "savings projections were based on pre-2023 net metering rates, your actual "
    "savings may be significantly lower than promised.' },",
    "{ q: 'Did Florida net metering changes hurt Miami solar savings?', "
    "a: 'Florida\\'s net metering rules did not change. HB 741, the 2022 bill that "
    "would have reduced credits for excess solar production, was vetoed on April 27, "
    "2022 and never became law, and retail-rate net metering is still in effect. If "
    "your actual savings came in lower than promised, the shortfall points at the "
    "savings projection rather than at a change in the rules.' },",
    "batch3 line 55 HB 741 FAQ",
)
sub_exact(
    p,
    "{ type: 'callout', content: '\U0001f4a1 FPL (Florida Power and Light) changed its "
    "net metering policy in 2023 under HB 741. If your salesperson quoted savings "
    "based on the old net metering rates, those projections may now be significantly "
    "overstated -- which could constitute a material misrepresentation under FDUTPA.' },",
    "{ type: 'callout', content: '\U0001f4a1 FPL did not change its net metering "
    "policy -- HB 741 was vetoed on April 27, 2022, and retail-rate net metering "
    "remains in effect. So if your salesperson quoted savings you never received, the "
    "projection was wrong on its own terms, which can constitute a material "
    "misrepresentation under FDUTPA.' },",
    "batch3 line 62 HB 741 callout",
)

# --- blog-articles-batch4.ts (solar-misleading-savings-claims, INDEXABLE) ---
p = DATA / "blog-articles-batch4.ts"
sub_exact(
    p,
    "California\\'s NEM 3.0, Nevada\\'s rate changes, Florida\\'s HB 741, and similar "
    "changes in other states have dramatically reduced the credit homeowners receive "
    "for excess solar production. If your savings projections were based on net "
    "metering rates that no longer apply, the projections were materially inaccurate.",
    "California\\'s NEM 3.0 and Nevada\\'s rate changes are real examples that "
    "dramatically reduced the credit homeowners receive for excess solar production. "
    "Florida is the opposite case and worth knowing: HB 741, which would have phased "
    "down Florida credits, was vetoed in April 2022, and retail-rate net metering is "
    "still in effect there. Either way the principle holds -- if your savings "
    "projections were based on net metering rates that no longer apply, or on rates "
    "that never changed the way the salesperson implied, the projections were "
    "materially inaccurate.",
    "batch4 line 167 HB 741 paragraph (INDEXABLE)",
)

# --- city-content-depth-batch-a.ts (Jacksonville, Fort Lauderdale, Cape Coral) ---
p = DATA / "city-content-depth-batch-a.ts"
for city, util in (
    ("Jacksonville", "JEA"),
    ("Fort Lauderdale", "FPL"),
    ("Cape Coral", "FPL"),
):
    sub_regex(
        p,
        r"Florida's HB 741 net metering changes have left many "
        + re.escape(city)
        + r" homeowners with solar agreements that no longer deliver the promised savings\.",
        "Florida\\'s net metering rules never changed -- HB 741 was vetoed on April 27, "
        "2022 -- so when a " + city + " solar agreement fails to deliver the promised "
        "savings, the shortfall points at the savings projection itself.",
        f"batch-a {city} localHook",
    )
    sub_regex(
        p,
        r"\{ label: \"" + re.escape(util) + r" Net Metering Change\", value: \"2023 \(HB 741\)\" \},",
        "{ label: \"Net Metering Change\", value: \"None -- HB 741 vetoed 2022\" },",
        f"batch-a {city} stat label",
    )
    sub_regex(
        p,
        r"issue: \""
        + re.escape(city)
        + r" homeowners report Sunrun savings projections based on pre-HB 741 "
        + re.escape(util)
        + r" net metering rates\.\"",
        "issue: \"" + city + " homeowners report Sunrun savings projections that "
        "assumed net metering credits they never received.\"",
        f"batch-a {city} Sunrun complaint",
    )
    sub_regex(
        p,
        r"Florida's HB 741 changes in 2023 reduced the value of solar exports "
        r"significantly\.",
        "Florida\\'s net metering rules did not change -- HB 741 was vetoed in 2022 -- "
        "so a savings shortfall traces back to the projection rather than to a change "
        "in the rules.",
        f"batch-a {city} whyItHappens",
    )

# Fort Lauderdale + Cape Coral FAQ (no city name in the answer)
sub_regex(
    p,
    r"\{ q: \"How did Florida's HB 741 affect my Fort Lauderdale solar contract\?\".*?\},",
    "{ q: \"Did Florida\\'s net metering rules change for my Fort Lauderdale solar "
    "contract?\", a: \"No. HB 741, the bill that would have moved credits to "
    "avoided-cost rates, was vetoed on April 27, 2022 and never took effect, so FPL "
    "still credits excess production under retail-rate rules. If your savings came in "
    "lower than promised, the projection is the place to look.\" },",
    "batch-a Fort Lauderdale FAQ",
)
sub_regex(
    p,
    r"\{ q: \"How did Florida's HB 741 affect my Cape Coral solar contract\?\".*?\},",
    "{ q: \"Did Florida\\'s net metering rules change for my Cape Coral solar "
    "contract?\", a: \"No. HB 741 was vetoed on April 27, 2022 and never became law, "
    "so FPL still credits excess production under retail-rate rules. A savings "
    "shortfall therefore points at the projection rather than at a change in the "
    "rules.\" },",
    "batch-a Cape Coral FAQ",
)

# --- city-content-depth.ts (Orlando, Tampa, Miami) ---
p = DATA / "city-content-depth.ts"
sub_exact(
    p,
    "Florida's 2023 net metering changes (HB 741). Thousands of Orlando homeowners "
    "signed solar agreements expecting to offset their FPL bill, only to find that the "
    "2023 law changes dramatically reduced the value of their excess solar production.",
    "Florida\\'s net metering rules never changed -- HB 741 was vetoed on April 27, "
    "2022 -- so thousands of Orlando homeowners who signed expecting to offset their "
    "FPL bill are finding the savings shortfall comes from the projection itself, not "
    "from a change in the rules.",
    "depth.ts Orlando localHook",
)
sub_exact(
    p,
    '{ label: "FL HB 741 Impact", value: "Net metering reduced 2023" },',
    '{ label: "Net Metering Change", value: "None -- HB 741 vetoed 2022" },',
    "depth.ts Orlando stat",
)
sub_exact(
    p,
    '"HB 741 net metering changes eliminated promised FPL savings",',
    '"Savings projections that never materialized",',
    "depth.ts Orlando complaint bullet",
)
sub_exact(
    p,
    'issue: "Orlando homeowners report Sunrun savings projections based on pre-HB 741 '
    'net metering rates that are no longer accurate." },',
    'issue: "Orlando homeowners report Sunrun savings projections that assumed net '
    'metering credits they never received." },',
    "depth.ts Orlando Sunrun",
)
sub_exact(
    p,
    "Florida's HB 741, signed in 2023, changed how utilities compensate homeowners for "
    "excess solar production. Instead of receiving retail-rate credits, homeowners now "
    "receive wholesale-rate credits \u2014 a fraction of the previous value. Sales "
    "companies that sold solar in 2021\u20132023 using pre-HB 741 projections without "
    "disclosing the pending legislation were making materially misleading "
    "representations.",
    "Florida\\'s HB 741 was vetoed on April 27, 2022, so utilities never moved "
    "homeowners off retail-rate credits. Sales companies that sold solar using savings "
    "projections the rules never supported were making materially misleading "
    "representations regardless of any pending legislation.",
    "depth.ts Orlando whyItHappens",
)
sub_exact(
    p,
    '{ q: "How did Florida\'s HB 741 affect my solar contract in Orlando?", a: "HB 741, '
    'effective January 2024, changed how FPL and other utilities compensate homeowners '
    'for excess solar production. Credits are now based on wholesale rates rather than '
    'retail rates, significantly reducing the value of solar exports. If your savings '
    'projections were based on pre-HB 741 rates, those projections are now materially '
    'inaccurate." },',
    '{ q: "Did Florida\'s net metering rules change for my Orlando solar contract?", '
    'a: "No. HB 741 was vetoed on April 27, 2022 and never took effect, so FPL still '
    'credits excess production under retail-rate rules. If your savings projections '
    'assumed a rate change that never happened, or simply came in far below what you '
    'were shown, those projections are the issue." },',
    "depth.ts Orlando FAQ",
)
sub_exact(
    p,
    'a: "Yes, in many cases. Florida\'s FDUTPA provides strong remedies for deceptive '
    'sales practices. If your savings projections were based on pre-HB 741 rates, if '
    'dealer fees were not disclosed, or if the tax credit implications were '
    'misrepresented, you may have viable grounds for cancellation." },',
    'a: "Yes, in many cases. Florida\'s FDUTPA provides strong remedies for deceptive '
    'sales practices. If your savings projections were inflated, if dealer fees were '
    'not disclosed, or if the tax credit implications were misrepresented, you may have '
    'viable grounds for cancellation." },',
    "depth.ts Orlando FAQ 2",
)
sub_exact(
    p,
    "Florida's 2023 HB 741 net metering changes have left thousands of Tampa homeowners "
    "with solar agreements that no longer deliver the promised savings.",
    "Florida\\'s net metering rules never changed -- HB 741 was vetoed on April 27, "
    "2022 -- so thousands of Tampa homeowners are finding their solar agreements do not "
    "deliver the promised savings for reasons that trace back to the projection.",
    "depth.ts Tampa localHook",
)
sub_exact(
    p,
    '{ label: "TECO Net Metering Change", value: "2023 (HB 741)" },',
    '{ label: "Net Metering Change", value: "None -- HB 741 vetoed 2022" },',
    "depth.ts Tampa stat",
)
sub_exact(
    p,
    'issue: "Tampa homeowners report Sunrun savings projections based on pre-HB 741 '
    'TECO net metering rates." },',
    'issue: "Tampa homeowners report Sunrun savings projections that assumed net '
    'metering credits they never received." },',
    "depth.ts Tampa Sunrun",
)
sub_exact(
    p,
    "The 2023 HB 741 changes hit Tampa homeowners particularly hard because TECO's "
    "previous net metering rates were among the most favorable in Florida. Sales "
    "companies that sold in 2021\u20132023 using pre-HB 741 projections without "
    "disclosing the pending legislation were making materially misleading "
    "representations.",
    "TECO\\'s net metering rates were among the most favorable in Florida and never "
    "changed -- HB 741 was vetoed in 2022 -- so sales companies that sold using "
    "inflated savings projections were making materially misleading representations "
    "regardless of any pending legislation.",
    "depth.ts Tampa whyItHappens",
)
sub_exact(
    p,
    '{ q: "Can I cancel my Tampa solar contract because of Florida\'s HB 741 changes?", '
    'a: "Possibly yes. If your savings projections were based on pre-HB 741 TECO net '
    'metering rates, and the salesperson did not disclose the pending legislation, '
    'that may constitute a material misrepresentation under FDUTPA. A contract review '
    'can assess whether this applies to your specific situation." },',
    '{ q: "Can I cancel my Tampa solar contract over inflated savings projections?", '
    'a: "Possibly yes. Florida\\\'s net metering rules never changed -- HB 741 was '
    'vetoed in 2022 -- so if your projected savings were never achievable under the '
    'rules that actually applied, that may constitute a material misrepresentation '
    'under FDUTPA. A contract review can assess whether this applies to your specific '
    'situation." },',
    "depth.ts Tampa FAQ",
)
sub_exact(
    p,
    "Florida's 2023 HB 741 net metering changes, combined with Miami's unique "
    "challenges \u2014 hurricane risk, high humidity, and salt air corrosion \u2014 have "
    "left many Miami homeowners with solar agreements that do not deliver the promised "
    "savings.",
    "Florida\\'s net metering rules never changed -- HB 741 was vetoed on April 27, "
    "2022 -- and Miami\\'s unique challenges of hurricane risk, high humidity and salt "
    "air corrosion have left many homeowners with solar agreements that do not deliver "
    "the promised savings.",
    "depth.ts Miami localHook",
)
sub_exact(
    p,
    '{ label: "FPL Net Metering Change", value: "2023 (HB 741)" },',
    '{ label: "Net Metering Change", value: "None -- HB 741 vetoed 2022" },',
    "depth.ts Miami stat",
)
sub_exact(
    p,
    'issue: "Miami homeowners report Sunrun savings projections based on pre-HB 741 FPL '
    'net metering rates." },',
    'issue: "Miami homeowners report Sunrun savings projections that assumed net '
    'metering credits they never received." },',
    "depth.ts Miami Sunrun",
)
sub_exact(
    p,
    "Miami's solar market was built on FPL's net metering program, which provided "
    "generous credits for excess solar production. Florida's HB 741 changes in 2023 "
    "reduced those credits significantly.",
    "Miami\\'s solar market was built on FPL\\'s net metering program, which provided "
    "generous credits for excess solar production. Those credits were never reduced -- "
    "HB 741 was vetoed in 2022 -- so a savings shortfall is not explained by a change "
    "in the rules.",
    "depth.ts Miami whyItHappens",
)
sub_exact(
    p,
    '{ q: "How did Florida\'s HB 741 affect my Miami solar contract?", a: "HB 741, '
    'effective January 2024, changed how FPL compensates homeowners for excess solar '
    'production. Credits are now based on avoided cost rates rather than retail rates, '
    'significantly reducing the value of solar exports. If your savings projections '
    'were based on pre-HB 741 rates, those projections are now materially inaccurate." },',
    '{ q: "Did Florida\'s net metering rules change for my Miami solar contract?", '
    'a: "No. HB 741 was vetoed on April 27, 2022 and never took effect, so FPL still '
    'credits excess production under retail-rate rules. If your savings projections '
    'assumed a rate change that never happened, or came in far below what you were '
    'shown, those projections are the issue." },',
    "depth.ts Miami FAQ",
)
sub_exact(
    p,
    'or challenging the lease based on misrepresentation or undisclosed terms including '
    'the HB 741 impact on savings projections." },',
    'or challenging the lease based on misrepresentation or undisclosed terms, '
    'including savings projections that the applicable net metering rules never '
    'supported." },',
    "depth.ts Miami lease FAQ",
)

# ─────────────────────────────────────────────────────────────────────────
# 2. FLORIDA STAT. 501.021 -> 501.025 (definitions section cited as the right)
# ─────────────────────────────────────────────────────────────────────────

p = DATA / "state-laws.ts"
sub_exact(
    p,
    "coolingOffNote: 'Under Florida Statute \u00a7 501.021 (Home Solicitation Sales "
    "Act). The seller must provide a Home Solicitation Sales permit number and a "
    "written Notice of Right to Cancel. Missing either element may extend the "
    "cancellation window.',",
    "coolingOffNote: 'Under Fla. Stat. \u00a7 501.025 (Home Solicitation Sales Act, "
    "\u00a7\u00a7 501.021-501.055), the seller must give you written notice of your "
    "right to cancel, and you have until midnight of the third business day after "
    "signing to cancel. If that notice was missing, the window may still be open.',",
    "state-laws FL coolingOffNote",
)
sub_exact(
    p,
    "{ value: '\u00a7 501.021', label: 'The Home Solicitation Sales Act that protects "
    "kitchen-table signers' },",
    "{ value: '\u00a7 501.025', label: 'The right to cancel a home solicitation sale' },",
    "state-laws FL stat block",
)
sub_exact(
    p,
    "content: 'Under Florida Statute \u00a7 501.021, any salesperson who comes to your "
    "home to sell goods or services worth more than $25 must hold a valid Home "
    "Solicitation Sales permit. They must provide you with a written \"Notice of Right "
    "to Cancel\" at the time of sale. The notice must be in the same language used "
    "during the sales presentation. If any of these requirements were not met, your "
    "cancellation window may still be legally open \u2014 even if you signed months "
    "ago.',",
    "content: 'Under Florida\\'s Home Solicitation Sales Act (Fla. Stat. "
    "\u00a7\u00a7 501.021-501.055), a sale of goods or services over $25 made at a "
    "place other than the seller\\'s fixed place of business is a home solicitation "
    "sale. The seller must give you written notice of your right to cancel, and Fla. "
    "Stat. \u00a7 501.025 gives you until midnight of the third business day after "
    "signing to cancel. If that written notice was missing, the cancellation window "
    "may still be legally open \u2014 even if you signed months ago.',",
    "state-laws FL body",
)

p = DATA / "city-content-depth.ts"
sub_exact(
    p,
    "Florida also has a 3-day cancellation right for home solicitation sales under "
    "Florida Statutes \u00a7 501.021.",
    "Florida also has a 3-business-day cancellation right for home solicitation sales "
    "under Fla. Stat. \u00a7 501.025 (the Act spans \u00a7\u00a7 501.021-501.055; "
    "\u00a7 501.021 itself is only the definitions section).",
    "depth.ts Orlando 501.021",
)
sub_exact(
    p,
    '{ q: "What is the Florida 3-day cancellation rule for solar contracts?", a: '
    '"Florida Statutes \u00a7 501.021 gives you 3 business days to cancel any contract '
    'signed at your home. The seller must provide a written Notice of Cancellation at '
    'the time of signing. If you did not receive this notice, the cancellation window '
    'may never have legally started." },',
    '{ q: "What is the Florida 3-day cancellation rule for solar contracts?", a: '
    '"Fla. Stat. \u00a7 501.025 gives you until midnight of the third business day '
    'after signing to cancel a home solicitation sale. The seller must give you '
    'written notice of that right at the time of sale. If you did not receive the '
    'notice, the cancellation window may never have legally started." },',
    "depth.ts Orlando 501.021 FAQ",
)

p = DATA / "blog-articles-batch5.ts"
sub_exact(
    p,
    "content: 'Under Florida Statute  Section  501.021, home solicitors must have a "
    "permit and provide a specific \"Notice of Right to Cancel.\" If they missed these "
    "steps, your window to cancel may still be legally open.',",
    "content: 'Under Florida\\'s Home Solicitation Sales Act (Fla. Stat. "
    "\u00a7\u00a7 501.021-501.055), the seller must give you written notice of your "
    "right to cancel, and Fla. Stat. \u00a7 501.025 gives you until midnight of the "
    "third business day after signing to cancel. If the notice was missing, the "
    "cancellation window may still be legally open.',",
    "batch5 Tampa 501.021",
)

# ─────────────────────────────────────────────────────────────────────────
# 3. CALIFORNIA AB 1070 -- 2023 -> Stats. 2017, Ch. 662
# ─────────────────────────────────────────────────────────────────────────

p = DATA / "blog-articles-batch9.ts"
sub_exact(
    p,
    "California\\'s AB 1070 (2023) further strengthens consumer protections for solar "
    "energy system sales, making it easier to report non-compliance.",
    "California\\'s AB 1070 (Stats. 2017, Ch. 662) is the law behind the CSLB\\'s solar "
    "disclosure requirements, which is the right reference when you describe what a "
    "contract was required to disclose.",
    "batch9 AB 1070 FAQ",
)
sub_exact(
    p,
    "such as AB 1070 (2023), which mandates clearer disclosures.",
    "such as AB 1070 (Stats. 2017, Ch. 662), now codified at Business and Professions "
    "Code \u00a7 7169, which requires the CSLB solar disclosure documents.",
    "batch9 AB 1070 body",
)
sub_exact(
    p,
    "Reference AB 1070 (2023) in your complaint.",
    "Reference AB 1070 (Stats. 2017, Ch. 662) in your complaint.",
    "batch9 AB 1070 list",
)

# ─────────────────────────────────────────────────────────────────────────
# 4. OREGON HB 4029 -- effective date, official characterization
# ─────────────────────────────────────────────────────────────────────────

p = DATA / "state-laws.ts"
sub_exact(
    p,
    "metaTitle: 'Oregon Solar Contract Rights: HB 4029, Licensed Agent Rule & Your "
    "Options (2026)',",
    "metaTitle: 'Oregon Solar Contract Rights: HB 4029 Disclosure & Licensing Rules',",
    "state-laws OR metaTitle",
)
sub_exact(
    p,
    "metaDescription: `Oregon solar laws include HB 4029, licensed-agent rules, and "
    "3-day cancellation rights. Learn how to fight a predatory solar contract.`,",
    "metaDescription: `Oregon solar laws include HB 4029 disclosure and licensing "
    "rules plus a 3-day cancellation right. Learn how to fight a predatory solar "
    "contract.`,",
    "state-laws OR metaDescription",
)
sub_exact(
    p,
    "heroHook: 'Oregon\\'s HB 4029 Took Effect January 1, 2026. If Your Contract "
    "Predates the Disclosures It Requires, You May Have New Legal Options.',",
    "heroHook: 'Oregon\\'s HB 4029 Takes Effect June 5, 2026. If You Signed Before It, "
    "the Older Disclosure and Licensing Rules Still Govern Your Deal.',",
    "state-laws OR heroHook",
)
sub_exact(
    p,
    "heroSubhook: 'The Residential Solar Disclosure Act targets the exact deceptions "
    "that flooded Portland and Eugene neighborhoods. Here is how to use it.',",
    "heroSubhook: 'The law targets the exact deceptions that flooded Portland and "
    "Eugene neighborhoods. Here is how to use it, before and after the effective "
    "date.',",
    "state-laws OR heroSubhook",
)
sub_exact(
    p,
    "primaryStatute: 'ORS 646.608 / HB 4029 (2026)',",
    "primaryStatute: 'ORS 646.608 / HB 4029 (2026 Laws, Ch. 11)',",
    "state-laws OR primaryStatute",
)
sub_exact(
    p,
    "primaryStatuteTitle: 'Oregon Unlawful Trade Practices Act + HB 4029 Solar "
    "Disclosure Act',",
    "primaryStatuteTitle: 'Oregon Unlawful Trade Practices Act + HB 4029 (solar "
    "disclosure and licensing)',",
    "state-laws OR primaryStatuteTitle",
)
sub_exact(
    p,
    "coolingOffNote: 'Under ORS 83.710 (Home Solicitation Sales Act). HB 4029 adds "
    "additional disclosure requirements effective January 1, 2026.',",
    "coolingOffNote: 'Under ORS 83.710 (Home Solicitation Sales Act). HB 4029 adds "
    "disclosure and licensing requirements for solar agreements entered into on or "
    "after June 5, 2026.',",
    "state-laws OR coolingOffNote",
)
sub_exact(
    p,
    "HB 4029 is the state\\'s response \u2014 and it is specific, detailed, and "
    "enforceable.',",
    "HB 4029 is the state\\'s response. Governor Kotek signed it on March 5, 2026; it "
    "became Chapter 11 of the 2026 Laws, and its requirements apply to solar "
    "agreements entered into on or after June 5, 2026.',",
    "state-laws OR body 1",
)
sub_exact(
    p,
    "content: 'The Licensed Agent Requirement: The Rule That Catches Fly-By-Night "
    "Operations',",
    "content: 'The Licensing Requirement: The Rule That Catches Fly-By-Night "
    "Operations',",
    "state-laws OR h2",
)
sub_exact(
    p,
    "content: 'Under HB 4029, solar contracts in Oregon must be executed by licensed "
    "sales agents registered with the state. Many out-of-state solar companies use "
    "unlicensed door-to-door representatives who are not registered in Oregon. If your "
    "sales rep was not properly licensed, the validity of your contract is highly "
    "questionable \u2014 and this is one of the easiest violations to verify.',",
    "content: 'Under HB 4029, a solar energy contractor or a person installing a solar "
    "energy system must hold a license appropriate to the scope of the work. Many "
    "out-of-state solar companies use door-to-door crews whose licensing does not "
    "match the installation they are selling. Checking whether the installer named on "
    "your contract held the right license is one of the easiest verifications to run.',",
    "state-laws OR body 2",
)
sub_exact(
    p,
    "{ q: 'What does HB 4029 require for Oregon solar contracts?', a: 'A plain-language "
    "disclosure form, a licensed sales agent, and a good-faith production estimate "
    "based on the specific address. Missing these elements may make the contract "
    "voidable.' },",
    "{ q: 'What does HB 4029 require for Oregon solar contracts?', a: 'Disclosures in "
    "the contract itself for purchase agreements, leases and power purchase "
    "agreements, plus a contractor or installer licensed for the work. It applies to "
    "agreements entered into on or after June 5, 2026, and a violation is an unlawful "
    "practice under the Unlawful Trade Practices Act.' },",
    "state-laws OR FAQ 1",
)
sub_exact(
    p,
    "{ q: 'Can I cancel my Oregon solar contract after installation?', a: 'Yes. HB 4029 "
    "violations, the Unlawful Trade Practices Act, and the licensed agent requirement "
    "all provide grounds for post-install cancellation.' },",
    "{ q: 'Can I cancel my Oregon solar contract after installation?', a: 'It depends "
    "on your facts rather than on one law. The Unlawful Trade Practices Act and the "
    "home solicitation cancellation rule can apply to a misrepresented sale, and HB "
    "4029 adds disclosure and licensing requirements for agreements entered into on or "
    "after June 5, 2026. A contract review is how you find out which applies to you.' },",
    "state-laws OR FAQ 2",
)

# --- blog-articles-batch5.ts (Portland) ---
p = DATA / "blog-articles-batch5.ts"
sub_exact(
    p,
    "title: 'Portland Solar Contract Exit: Oregon\\'s 2026 HB 4029 Gives You New "
    "Rights',",
    "title: 'Portland Solar Contract Exit: Oregon\\'s New Solar Rights Under HB 4029',",
    "batch5 Portland title",
)
sub_exact(
    p,
    "metaDescription: `Portland homeowners: Oregon's HB 4029 Residential Solar "
    "Disclosure Act, licensed agent requirements, and 3-day cancellation rights give "
    "you new tools to exit a bad solar deal.`,",
    "metaDescription: `Portland homeowners: Oregon's HB 4029 disclosure duties, "
    "licensed-installer rule and 3-day cancellation right give you new tools to exit a "
    "bad solar deal.`,",
    "batch5 Portland metaDescription",
)
sub_exact(
    p,
    "excerpt: 'Oregon\\'s HB 4029 took effect January 1, 2026 -- and it specifically "
    "targets the deceptive sales tactics that flooded Portland neighborhoods. Here is "
    "how to use it.',",
    "excerpt: 'Oregon\\'s HB 4029 takes effect June 5, 2026 -- and it specifically "
    "targets the deceptive sales tactics that flooded Portland neighborhoods. Here is "
    "how to use it.',",
    "batch5 Portland excerpt",
)
sub_exact(
    p,
    "ctaSubtext: 'HB 4029 requires plain-language disclosures -- find out if yours were "
    "provided.',",
    "ctaSubtext: 'Oregon law requires plain-language solar disclosures -- find out if "
    "your contract met the standard.',",
    "batch5 Portland ctaSubtext",
)
sub_exact(
    p,
    "As of March 2026, the landscape has shifted. The federal residential tax credit "
    "has expired, and Oregon\\'s new HB 4029 consumer protection laws have just taken "
    "effect to combat the Wild West of out-of-state sales tactics.',",
    "Oregon\\'s HB 4029, signed on March 5, 2026 and effective June 5, 2026, was "
    "written to combat the Wild West of out-of-state sales tactics. It requires a "
    "licensed contractor, puts the disclosures in the contract itself, and treats a "
    "violation as an unlawful trade practice under ORS 646.608.",
    "batch5 Portland body 1",
)
sub_exact(
    p,
    "content: 'HB 4029: The Residential Solar Disclosure Act',",
    "content: 'HB 4029: What Oregon Solar Contracts Must Now Disclose',",
    "batch5 Portland h3",
)
sub_exact(
    p,
    "content: 'This landmark 2026 law mandates that every solar contract must include a "
    "plain-language disclosure form clearly stating the full price including fees, the "
    "identity of the actual installer, and a good-faith estimate of utility savings "
    "based on your specific utility\\'s rates. If you didn\\'t get this form, the "
    "contract is likely in violation.',",
    "content: 'Oregon HB 4029 (Chapter 11, 2026 Laws) requires disclosures in the "
    "contract itself for solar purchase agreements, leases and power purchase "
    "agreements, and requires the contractor or installer to hold a license "
    "appropriate to the work. It also prohibits deceptive statements about the "
    "contract\\'s terms, and a violation is an unlawful practice under the Unlawful "
    "Trade Practices Act. The Act applies to agreements entered into on or after June "
    "5, 2026. If you signed before that date, the pre-existing disclosure and "
    "licensing rules still apply to your deal, and a misrepresented savings figure is "
    "actionable on its own.',",
    "batch5 Portland body 2",
)

# ─────────────────────────────────────────────────────────────────────────
# 5. Nevada SB 293 -- add the enactment year for precision (already correct)
# ─────────────────────────────────────────────────────────────────────────

p = DATA / "blog-articles-batch6.ts"
sub_exact(
    p,
    "      SB 293\n      Must provide a cover page with total costs and production "
    "estimates.",
    "      SB 293 (2023)\n      Must provide a cover page with total costs and "
    "production estimates. Effective January 1, 2024.",
    "batch6 NV SB 293 year",
)

# ─────────────────────────────────────────────────────────────────────────
print("files scanned:", stats["files"])
print("replacements made:", stats["changed"])
print("already applied (skipped):", stats["skipped"])
if stats["missed"]:
    print("\nMISSED (string not found or count mismatch):")
    for m in stats["missed"]:
        print("  -", m)
    sys.exit(1)
print("\nOK -- all replacements applied.")
