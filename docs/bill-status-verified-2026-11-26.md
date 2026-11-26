# Bill status verification — 26 Nov 2026

Triggered by finding that **California SB 784 was described as enacted law on
indexable pages while it is actually a bill held in committee.** Every bill
citation on the site was then enumerated and checked. This file is the record.

## Method

1. `python3` regex sweep over `client/src/data/*.ts` + `shared/*.ts` + `shared/*.json`
   for `\b(SB|AB|HB|LB|SF|HF)\s?-?\s?\d{2,4}\b` → **12 distinct bill citations.**
2. For each, read the official legislature page (not a secondary summary).
3. Record: enacted? effective date? does it create the right we claim?

## Verified results

### 1. California SB 784 — NOT LAW. **DEFECT. FIXED.**
- Official: https://leginfo.legislature.ca.gov/faces/billStatusClient.xhtml?bill_id=202520260SB784
- Status: **"Active Bill - In Committee Process."** Last action **08/13/26:
  "August 13 hearing: Held in committee and under submission."**
- Title: "Home improvement loans: right to cancel contracts."
- We said: "Effective January 1, 2026, SB 784 requires lenders to conduct a live
  'Confirmation Call'... the loan agreement may be rescindable under this new law.
  Additionally, SB 784 extends the cancellation window to 5 business days for
  homeowners over 65."
- **A bill held in committee creates no rights.** The 5-business-day senior window
  it was credited with actually comes from **Civ. Code 1689.6**, where
  **1689.6(a)(4)** says the five-day right applies to contracts entered into on or
  after **1 January 2021** — not 2026, not SB 784.
- Real basis for an extended window: **Civ. Code 1689.7(g)** — "Until the seller
  has complied with this section the buyer may cancel the home solicitation
  contract or offer."
  https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1689.7
- Notice requirements verified in **1689.7(a)(1)** (statement in immediate
  proximity to the signature space, at least 10-point boldface) and
  **1689.7(c)(1)** (easily detachable "Notice of Cancellation", at least 10-point).
- **1689.6 was amended by AB 1327 (Stats. 2025, Ch. 348, Sec. 3), effective
  1 Jan 2026.** 1689.7 was amended by the same act at Sec. 4.
- **Files fixed (3):**
  - `client/src/data/state-laws.ts` — H2 + body replaced with the real statutory
    basis; `coolingOffNote` no longer credits a bill.
  - `client/src/data/blog-articles-batch5.ts` (Sacramento) — title, metaTitle,
    metaDescription, excerpt, ctaSubtext, opening sentence, H3, FAQ answer.
    Also removed an unsourced "Over 500 CA homeowners helped" and "Act now".
  - `client/src/data/city-content-depth-batch-e.ts` — **15 instances** across
    Sacramento, San Francisco, San Jose.
- **Indexable pages that were affected:** `/solar-contract-laws/california`,
  `/blog/cancel-solar-contract-sacramento-ca`, `/cancel-solar-contract/san-francisco-ca`,
  `/cancel-solar-contract/san-jose-ca`.
- **Why a built-output scan missed it:** `city-content-depth-batch-e.ts` feeds the
  RUNTIME `CityPage` (`client/src/pages/CityPage.tsx` line 428
  `getCityContentDepth(slug)`, line 840 renders `depth.stateLawExpanded`), not the
  pre-rendered shell. **A dist/public scan cannot see runtime-only content.**

### 2. Colorado SB25-299 — ENACTED, but wrong effective date. **DEFECT. FIXED.**
- Official: https://leg.colorado.gov/bills/sb25-299
- Became law: Governor signed **06/04/2025**; session law effective **08/06/2025**;
  Chapter 427.
- **Its requirements "apply to agreements between a solar sales company and a
  consumer that are entered into on or after July 1, 2026."**
- We said "Effective January 1, 2026" → a homeowner would believe the disclosure
  duty already applied to a 2025/early-2026 contract when it does not.
- Fixed in `client/src/data/state-laws.ts`.
- Codified at C.R.S. § 6-1-1803 (disclosures required).

### 3. Oregon HB 4029 — ENACTED, but wrong effective date. **DEFECT. NOT YET FIXED.**
- Passed **March 2026** (House 5 Mar / signed by 17 Mar 2026). Effective
  **June 5, 2026** (Chapter 11, 2026 Laws).
- Sources: https://olis.oregonlegislature.gov/liz/2026R1/Downloads/MeasureDocument/HB4029/Introduced
  https://blog.energytrust.org/oregonians-going-solar-now-have-greater-protections-in-place/
  https://legiscan.com/OR/bill/HB4029/2026
- We say (in `client/src/data/blog-articles-batch5.ts` Portland article + `state-laws.ts`):
  - excerpt: "Oregon's HB 4029 took effect January 1, 2026"
  - title/metaTitle: "...Oregon's 2026 HB 4029 Gives You New Rights"
  - body: "Oregon's new HB 4029 consumer protection laws have just taken effect"
  - ctaSubtext: "HB 4029 requires plain-language disclosures"
- **All of these are wrong on the date.** Note: the Portland article was published
  2026-03-22, before the June 5 effective date.
- **Portland is a priority city guide but noindex** (not in the 27-city set), so
  exposure is limited to the runtime/priority render.

### 4. Nevada SB 379 — ENACTED. **CORRECT. No change.**
- Passed **06/06/2025**, effective **10/01/2025**. 83rd Legislature.
- https://www.leg.state.nv.us/App/NELIS/REL/83rd2025/Bill/12675/Overview
- It **is** the source of the 10-business-day window for buyers aged 60 or over
  (vs 3 business days under NRS 598.98216). Our text is accurate.
- Also confirmed: NRS 598.98213 is the recording requirement.

### 5. Nevada SB 293 — **SUSPECT. NEEDS FIX.**
- We cite it in `blog-articles-batch6.ts` as "Mandatory Disclosures — SB 293 must
  provide a cover page with total costs and production estimates."
- **The change log already records that this exact citation was wrong:**
  "'SB 440 requires the disclosures' was also wrong: SB 379 is the solar lending
  and leasing rewrite, SB 440 is the HOA and utility-timeline bill."
  → the same slot is now attributed to SB 293. Needs the official check.

### 6. Nevada AB 405 — **PLAUSIBLE, NEEDS CONFIRMATION.**
- We cite it in `blog-articles-batch6.ts` as the 2017 "Renewable Energy Bill of
  Rights", later codified into NRS. AB 405 (2017) is a real Nevada bill.

### 7. Texas SB 1036 — **NEEDS VERIFICATION.**
- We claim in `blog-articles-batch6.ts` and `blog-articles-batch11.ts`:
  TDLR registration + background checks, a **5-business-day right of rescission**
  for solar contracts, and a standardized disclosure statement.
- Also cited as the source of Texas's 5-business-day window.

### 8. California AB 1070 (2023) — **NEEDS VERIFICATION.**
- We claim in `blog-articles-batch9.ts` it "further strengthens consumer
  protections for solar energy system sales" and "mandates clearer disclosures",
  and tell readers to reference it in an AG complaint.

### 9. Florida HB 741 — **DATE CHECK NEEDED.**
- We say in `city-content-depth.ts` and `city-content-depth-batch-a.ts`
  "HB 741, effective January 2024, changed how FPL compensates homeowners."
- HB 741 (2023) is the real Florida net-metering bill; the effective date needs
  confirming (the net-metering changes were phased).

### 10. Florida Statutes § 501.021 — **CHECK.**
- `city-content-depth.ts` cites "Florida Statutes § 501.021" for a "3-day
  cancellation right for home solicitation sales." Note 501.021 is the
  **definitions** section of the FDUTPA home solicitation part; the operative
  cancellation provision is 501.025. **This is the same defect class as the four
  wrong statute citations fixed earlier (a definition section cited as operative).**

### 11. AB 1327 / AB 458 / SB 440
- AB 1327 — verified above (Stats. 2025, Ch. 348), the amendment to 1689.6/1689.7.
- AB 458 (2025, Ch. 254) — already recorded in the change log as the
  solar-powered affordable housing net-metering bill, **not** a contract protection.
- SB 440 — already recorded as the HOA/utility-timeline bill, not the disclosure bill.

## Guard added

`server/billStatusClaims.test.ts` — 7 tests:
- the California page explains SB 784 is pending and gives the real basis
- no INDEXABLE built page asserts a pending bill is in force
- **no SOURCE file asserts a pending bill is in force** (this is the test that
  caught the 15 runtime-only batch-e instances)
- the cooling-off note does not credit the senior window to a bill
- every state entry still cites a statute (the fix did not strip the legal basis)
- Colorado SB25-299 states 1 Jul 2026 and not 1 Jan 2026
- `ENACTED_BILLS` allowlist (SB 379, SB25-299) documents which bills may use
  "requires" phrasing, with their effective dates stated inline.

## Scripts

- `scripts/fix-1126-sb784-not-law.py` — state-laws.ts + blog-articles-batch5.ts (10 replacements)
- `scripts/fix-1126-sb784-batche-and-colorado.py` — batch-e (15) + Colorado (1)
- Both idempotent, keyed on exact strings.

## Still to do

Fix Oregon HB 4029 dates; verify and fix NV SB 293, TX SB 1036, CA AB 1070,
FL HB 741 date, FL Stat. 501.021 vs 501.025; verify NV AB 405.
Then extend `server/billStatusClaims.test.ts` with an effective-date table.
