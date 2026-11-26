# Company status — verified 26 Nov 2026

Every fact below was read from the source shown on **26 Nov 2026**. Do not change a
status in `client/src/data/companies.ts` without re-reading a primary source on the
day of the change and updating `statusNote` / `statusSource` on that record.
`server/companyStatus.test.ts` enforces this.

## Corrected in this audit (5 of 19 records were wrong)

### Freedom Forever — Active → **Bankrupt**
- Filed Chapter 11 on **15 April 2026** in the District of Delaware, case **No. 26-10522**.
  Two affiliates filed 2 May 2026.
- Auction ran 28–30 July 2026 and closed **without a sale**. Velera Energy was named
  stalking horse; the official committee of unsecured creditors declined to qualify
  that bid on 30 July, and the debtors cancelled the sale hearing.
- Moved to convert on 3 August 2026; court **converted all three cases to Chapter 7 on
  7 August 2026**. Interim trustee: **Alfred T. Giuliano**.
- General proof of claim deadline: **16 October 2026** (passed).
  Government units: **3 February 2027**.
- Secured debt at petition date: **SolarEdge ~$111,758,581** (first-priority lien on
  substantially all assets); **Tesla ~$22.09 million** (narrower interest).
- Financing partners that may step in to complete open installations: **Sunrun,
  EverBright, Project Solar, EnFin, GoodLeap, Credit Human, Participate**. GoodLeap may
  take possession and complete projects but is not required to. EnFin's equipment is to
  be returned.
- On 6 August 2026 the court approved terminating Freedom Forever's agreements with
  **EverBright** so EverBright could take over that pipeline. EverBright got an
  administrative expense claim of at least **$177,741.81**.
- On 6 August 2026 the court approved a settlement with **Sunrun**: Sunrun's reclamation
  claim fixed at **$199,909.29** (down from $399,818.67 asserted).
- CEO **Brett Bouchy** gave three reasons for filing: the One Big Beautiful Bill Act's
  repeal of the residential solar tax credit, executive orders aimed at solar subsidies,
  and repeated payment breaches by certain finance partners.
- Petition estimated liabilities **$500M–$1B** against assets **$100M–$500M**.
- WARN Act adversary proceedings: No. **26-50237** (Jacob Quinones, ~1,600 furloughed
  employees) and No. **26-50238** (Prophett Kelley, 100+ former employees).
- Source: https://elevenflo.com/cases/freedom-forever-llc-13674/analysis (cites Dkt. 1,
  52, 236, 501, 522, 523, 533, 534, 568)

### Titan Solar Power — Active → **Bankrupt**
- Ceased operations **13 June 2024**; filed Chapter 7 shortly after.
- Nevada State Contractors Board suspended its licence **18 June 2024**, revoked
  **17 July 2024** after a hearing the company did not attend.
- Titan Solar Power NV pulled 2,524 Las Vegas permits; fined $400,000 across 70 counts.
- No successor entity took over residential contracts.
- Sources: https://www.pv-tech.org/us-residential-installer-titan-solar-power-shuts-down-business/ ;
  our own article `client/src/data/blog-articles-batch15.ts` (slug
  `titan-solar-nevada-out-of-business-contract-help`)

### Sunnova — Active → **Bankrupt**
- Filed Chapter 11 on **8 June 2025**; Sunnova TEP Developer LLC petitioned 1 June 2025.
- Sale closed **September 2025**; bondholder group that financed the Chapter 11 bought
  the operating business. Liquidating plan took effect **14 November 2025**.
- **SunStrong Management** assumed servicing of most in-service systems (leases, loans,
  PPAs). New owner group is **Solaris Assets LLC**.
- Sunnova's own site states: "Sunnova has ceased independent operations." Payment terms
  did **not** change; customers told to continue paying.
- In-progress installations: SunStrong working with **GoodLeap** to complete some;
  GoodLeap support (888) 975-5436, sunnovasupport@goodleap.com.
- Source: https://www.sunnova.com/ (last updated 2 November 2025);
  https://restructuring.ra.kroll.com/Sunnova

### Mosaic — Active → **Bankrupt**
- Mosaic Sustainable Finance Corporation and 4 affiliates filed Chapter 11 on
  **6 June 2025**, S.D. Tex., Case No. **25-90156**, Judge Christopher M. Lopez.
- Plan confirmed **5 September 2025**; **Effective Date 22 September 2025**.
- Loan servicing moved to **Solar Servicing LLC**, a **Forbright Bank** unit; Forbright
  is equity holder of the reorganized company. Servicing covers >$8 billion in solar loans.
- General claims bar date: 16 October 2025. Governmental: 3 December 2025.
- **The loans themselves were not cancelled.**
- Source: https://cases.ra.kroll.com/MOSAIC

### Sunlight Financial — Active → **Acquired** (was wrong in the other direction)
- Filed **prepackaged Chapter 11 on 30 October 2023** in Delaware; confirmation order
  **5 December 2023**; plan effective **6 December 2023**; emerged under new ownership.
- **Sunlight Financial LLC still operates and still services the loans.** The bankruptcy
  did not cancel them.
- Source: https://www.bankruptcydata.com/feeds/blog/bankrupt-solar-companies ;
  https://bennettlegal.com/sunlight-financial-litigation-update/

## Verified correct — left unchanged

| Company | Status | Note |
|---|---|---|
| Pink Energy | Bankrupt | Failed 2022 |
| SunPower | Bankrupt | Chapter 11 filed **5 August 2024**; wind-down. Assets incl. Blue Raven bought by Complete Solaria |
| ADT Solar | Bankrupt | ADT board voted **19 January 2024** to exit residential solar; operations ceased by **30 June 2024** |
| Sungevity | Bankrupt | Filed 2017; assets acquired, became part of Complete Solaria |
| Vivint Solar | Acquired | By Sunrun (2020) |
| Blue Raven Solar | Acquired | By SunPower (2021); assets to Complete Solaria in 2024 |
| Sunrun | Active | |
| GoodLeap | Active | Formerly Loanpal; rebranded **2 June 2021** |
| Loanpal | Active | Same company as GoodLeap |
| Momentum Solar | Active | Site lists 7 states, not California as of 23 Sept 2026 |
| Tesla Solar / SolarCity | Active | |
| Palmetto Solar | Active | Site live 21 November 2026; layoffs reported but still operating |
| EverBright Solar | Active | NextEra subsidiary |
| Dividend Finance | Active | Fifth Third subsidiary; new originations paused July 2026 |

## Explicitly NOT marked bankrupt (and why)

- **GoodLeap / Loanpal** — rebrand only, never filed.
- **Dividend Finance** — paused new originations in July 2026 after incentives expired;
  that is not a bankruptcy filing.
- **EverBright** — a NextEra Energy subsidiary.
- **Momentum Solar** — some third-party pages claim it closed; the company's own site and
  recent posts show active operation, and CSLB records show a licence expiry rather than
  a corporate failure. Insufficient evidence to mark bankrupt.
- **Palmetto Solar** — reported layoffs and operational disruption, but website live and
  public records show it operating.

## Files that reference these facts

- `client/src/data/companies.ts` — the 19 records with `status`, `statusNote`, `statusSource`
- `server/companyStatus.test.ts` — 24 tests locking the corrections in
- `client/src/data/blog-articles-batch9.ts` — Freedom Forever article (rewritten 26 Nov
  2026 to past tense) and Sunrun articles
- `client/src/data/blog-articles-batch15.ts` — Titan Nevada article
- `scripts/prerender.assembled.mjs` — `/solar-companies` hub carries the sourced failure
  list; company shells emit a "Current status of …" section

---

## ADT Solar — corrected 26 Nov 2026

**The defect:** `client/src/data/companies.ts` said ADT "shut down entirely in June
2023 after losing over $200 million" and carried a timeline entry "ADT Inc. shut
down solar division in June 2023". The ADT article on the same site correctly says
January 2024. **The site contradicted itself.** The record also carried
`bbRating: "C+"` and `complaintCount: "700+"`, neither of which matches the BBB
profile or our own article.

**Verified facts:**

| Fact | Value | Source |
|---|---|---|
| Exit announced | **24 January 2024** | ADT newsroom release, dated 24 Jan 2024 |
| Headline of release | "ADT exits the residential solar business" | same |
| Loss figure | **$89 million** Adjusted EBITDA loss, solar segment, first 9 months of 2023 | same |
| Operations ceased | substantially all by **30 June 2024** | secondary sources; consistent with the release |
| BBB rating | **Not Rated** — the profile states the business "has no rating because it is out of business"; not accredited | BBB profile, read 25 Nov 2026 |
| BBB complaints | **404** over 3 years; **29** over 12 months; **75** customer reviews | BBB profile, read 25 Nov 2026 |
| Predecessor | Sunpro Solar, acquired 2021 for ~$825M incl. debt | WSJ, 9 Nov 2021 |
| Sunpro BBB file | separate profile, accredited since 1 Jul 2021, **425** complaints/3yr, **80** reviews | BBB, read 25 Nov 2026 |

**Primary source URL (read 26 Nov 2026):**
https://newsroom.adt.com/corporate-news/adt-provides-solar-business-update-and-advances-capital-allocation-strategy

**BBB profile URL:**
https://www.bbb.org/us/la/mandeville/profile/solar-energy-design/adt-solar-0985-90006391

**Court filings noted (existence only — NOT a certified class):**
- Stemke v. SunPro Solar, LLC, 5:2021cv00274 (M.D. Fla. 2021)
- Souder v. ADT Solar LLC, 3:2024cv02883 (D.S.C., filed 8 May 2024; voluntary dismissal)
Several dockets show voluntary dismissal or individual claims. **Never imply a
pending class action or that a settlement covers any reader.**

**Why the tagline was changed:** it read "Shut Down in 2023 — Your Warranty Is
Gone." The exit announcement describes a business exit and does not state that
customer warranties were voided. Now reads "ADT Solar Exited Solar in 2024 — Your
Warranty Is Uncertain. Your Loan Isn't."

**Standing lesson:** a company record and that company's own article are edited
independently and can state different dates or figures for the same fact. Read them
against each other before either ships. This is the same cross-check that caught
Freedom Forever contradicting itself.
