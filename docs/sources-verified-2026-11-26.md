# External sources verified 26 November 2026

Every fact below was read from the named source **on 26 Nov 2026**. Where a fact
was used in published copy, the page it appears on is noted. Keep this file
updated rather than re-researching the same questions in a later session.

---

## California NEM 3.0 / Net Billing Tariff

**Source:** CPUC — *Net Energy Metering and Net Billing*
https://www.cpuc.ca.gov/industries-and-topics/electrical-energy/demand-side-management/customer-generation/net-energy-metering-and-net-billing

> "Since April 15, 2023, customers applying for interconnection have taken
> service on the new net billing tariff (NBT) pursuant to D.22-12-056."

**Facts established**

- The **Net Billing Tariff (NBT)**, commonly called **NEM 3.0**, took effect
  **15 April 2023**.
- It replaced **NEM 2.0** for customers who submit an interconnection
  application **on or after 15 April 2023**. Existing NEM 2.0 customers keep
  their tariff.
- The governing decision is **D.22-12-056**.
- The NBT changed the **export** credit, **not** the value of power the home
  consumes directly. This distinction matters because "NEM 3.0 wiped out my
  savings" usually blends two different problems: a projection built on NEM 2.0
  export rates, versus actual production below the written estimate. They are
  different claims with different evidence.

**Also confirmed:** CPUC news release 15 Dec 2022, *"CPUC Modernizes Solar
Tariff To Support Reliability and Decarbonization"*.
https://www.cpuc.ca.gov/news-and-updates/all-news/cpuc-modernizes-solar-tariff-to-support-reliability-and-decarbonization

**Where used:** `/blog/sunrun-complaints-california` (section "NEM 2.0, NEM 3.0
and What Actually Changed in California") and its meta description.

---

## California solar-contractor complaints — the CORRECT body

**Source:** CSLB — *Online Submission* (solar complaint form process)
https://www.cslb.ca.gov/OnlineServices/SolarComplaint/SolarComplaintFormProcess.aspx

**Facts established**

- The **Contractors State License Board (CSLB)** runs a **dedicated solar
  complaint form**.
- Online complaints are not complete until CSLB receives a **signed form and
  supporting documentation**.
- CSLB states a **four-year window** for filing a construction complaint
  (confirmed 26 Nov 2026; also reported by CSLB via its own consumer guidance).
- CSLB phone: **(800) 321-CSLB (2752)**.
- Filing a CSLB complaint runs on a **different track** from a civil claim and
  does **not by itself cancel** an agreement.

### IMPORTANT NEGATIVE FINDING — do not route readers to the CPUC here

The **CPUC Consumer Affairs Branch (CAB)** handles **utilities** (electric, gas,
telephone, water, LifeLine), **not solar contractors**. CPUC CAB hotline
**(800) 649-7570**, email `consumer-affairs@cpuc.ca.gov`.

Routing a solar *sales or installation* complaint to CAB would be **wrong** and
would have introduced a new error while fixing a vocabulary gap. The CAB is
relevant only where the dispute is genuinely about the **utility** (for example
an interconnection or billing dispute with PG&E, SCE or SDG&E).

**Where used:** `/blog/sunrun-complaints-california` (section "Sunrun Consumer
Affairs: Who Actually Takes the Complaint").

---

## Defamation-risk rule derived from the above work

Not an external source — a standing internal rule, recorded here because it was
established this session and belongs with the sources that produced it.

**Rule:** Never assert a **named company's state of mind** (knew, knowingly,
intentionally, deliberately, willfully, concealed, hid, lied) in any published
copy, and never name a **legal conclusion** as fact in a title or description.

**Why:** Intent is a finding a court makes, not something this site can state.
Naming the company in a meta description satisfies the "of and concerning"
element of defamation for **every searcher who sees it**. The site's own
`/how-it-works` page states *"Solar Freedom is not a law firm."*

**Enforced by:** `STATE_OF_MIND` pattern in `server/unsourcedClaims.test.ts`.

**Two instances found and fixed 26 Nov 2026**

| Page | Indexable | Shipped text |
|---|---|---|
| `/blog/sunrun-complaints-california` | **yes** | `NEM 3.0 Fraud & Legal Options` (title) + `Sunrun knew` (description) |
| `/blog/goodleap-tila-violation-cancel-solar-loan` | no | `GoodLeap hid dealer fees … that's a federal TILA violation. Attorneys are using it to cancel GoodLeap loans right now.` |

**Correct pattern instead:** state the **verifiable mechanism** and what a review
checks, then let the reader decide. Example: *"TILA requires a solar lender to
disclose the true cost of credit. What a GoodLeap loan review checks, the
dealer-fee question, and the rescission window."*

---

## Google's position on the keywords meta tag

Not re-verified this session — carried as background and **explicitly labelled as
not a ranking claim** in the change log. Google has publicly stated for over a
decade that it does not use the `keywords` meta tag for ranking.

**Consequence for this site:** `shared/page-meta-keywords.json` is maintained for
**consistency**, not for ranking. Adding entries does **not** raise rankings and
must never be reported as an SEO win. The reason to keep it complete is that an
inconsistent set makes a "no keywords detected" checker produce permanent false
alarms, and a false alarm that is never resolved trains the next reader to ignore
the report.

**Coverage after the 26 Nov 2026 fix:** 27 of 27 indexable city pages and 3 of 3
indexable state pages serve a tag, 5 keywords each (owner's stated bound is
3–8). 30 keys total in the file.
