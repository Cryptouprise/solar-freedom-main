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

---

## Blue Raven Solar — litigation and ownership

**Verified 26 November 2026.** Used on `/blog/blue-raven-solar-complaints`.

**Sources**

- Blue Raven Solar Holdings, LLC bankruptcy, D. Del. **case 1:24-bk-11660**,
  filed **5 August 2024**, member case of the SunPower lead case
  **1:24-bk-11649** (Chapter 11, Judge Craig T. Goldblatt).
  https://www.pacermonitor.com/public/case/54575660/Blue_Raven_Solar_Holdings,_LLC
- *Seeley et al v. Blue Raven Solar LLC et al*, No. **3:25-cv-06032**,
  U.S. District Court for the Western District of Washington, opened
  **17 November 2025** on a petition for removal; nature of suit 371
  (Torts – Personal Property – Truth in Lending).
  https://www.pacermonitor.com/public/case/61256050/Seeley_et_al_v_Blue_Raven_Solar_LLC_et_al
- Idaho Attorney General voluntary agreement (Assurance of Voluntary
  Compliance), **October 2020**; investigated from spring 2020; Blue Raven
  **denied violating any law**; paid **$7,500** for legal and investigative
  costs; ran through **31 December 2025**.
  https://idahocapitalsun.com/2022/03/28/that-deal-on-solar-panels-could-be-a-scam-warns-idaho-attorney-general/
- Ownership: SunPower acquired Blue Raven **October 2021** (announced
  5 Oct 2021, up to **$165M**). SunPower Chapter 11 **5 August 2024**; sale of
  the Blue Raven business to Complete Solaria **approved 23 September 2024**,
  **closed 30 September 2024** for **$45M**. Complete Solaria now files as
  SunPower Inc. The buyer assumed only the liabilities defined in the purchase
  agreement, so projects completed **on or before 30 September 2024** are the
  stranded ones.
  https://www.prnewswire.com/news-releases/sunpower-announces-stalking-horse-asset-purchase-agreement-with-complete-solaria-to-sell-blue-raven-solar-new-homes-and-its-non-installing-dealer-network-302214943.html

**Key findings**

- **There is NO class action, NO settlement, NO fund, NO claim form and NO claim
  deadline for Blue Raven customers** as of November 2026. What exists is
  individual litigation.
- Older individual federal suits were brought under the **Telephone Consumer
  Protection Act**: *Johansen v. Blue Raven Solar, LLC*, No. 2:20-cv-02930
  (S.D. Ohio, filed 5 June 2020) and *Costa v. Blue Raven Solar, LLC*,
  No. 2:24-cv-00265 (D. Utah, filed 11 April 2024). Both complaints included
  **class allegations** but **no class was certified**, so neither produced a
  payment for other people who received calls.
- *Torre v. Blue Raven Solar, LLC*, No. 1:25-cv-12988 (N.D. Ill., filed
  24 October 2025), consumer credit. Docket not opened — **state only its
  existence, never its outcome.**
- The Idaho agreement paid the **state**, not homeowners, and was **not a court
  judgment**.

**Standing warning recorded with these facts:** a **change of owner is not a
court order cancelling a contract**, and a **bankruptcy is not a lawsuit against
the company and not a settlement for customers**. Any offer to "void" a Blue
Raven agreement for a fee on the strength of the bankruptcy is wrong, and the
site says so explicitly.

**Why this mattered:** `/blog/blue-raven-solar-complaints` ranked **position 6.0**
for `blue raven solar lawsuit` while containing **zero** occurrences of the word
"lawsuit". It was ranking on surrounding context alone. The competing pages for
that query are lead-capture funnels that imply a settlement exists; answering
"no, and here is exactly what does exist" is both the honest answer and the
differentiator.

---

## GoodLeap — corporate status and litigation (verified 26 Nov 2026)

**Not bankrupt.** GoodLeap closed a **$389 million securitization on 2 October
2026**, its **26th** to date, backed solely by home improvement loans it
originated. A company in Chapter 11 does not close securitizations. This is the
primary evidence for the answer to the site's highest-traffic GoodLeap query,
`is goodleap going bankrupt`, which the page previously did not answer at all.

Source: GoodLeap press release, 2 October 2026 —
`goodleap.com/press-releases/goodleap-announces-closing-of-389-million-securitization-bringing-the-company-s-total-to-26`
(also distributed via PR Newswire and Morningstar, same date).

**Minnesota Attorney General — filed 8 March 2024, Hennepin County.**
Defendants: **GoodLeap, Sunlight Financial, Solar Mosaic and Dividend Solar
Finance.** Alleged **$35 million in hidden fees on nearly 5,000 Minnesota loans
since 2017**. Most of the fees **raised what borrowers paid by 15% to 30%**; some
borrowers paid **up to 54% more** than paying cash or obtaining their own credit.
Claims: deceptive trade practices, deceptive lending, illegally high rates of
interest. Relief sought: accurate disclosure, civil penalties, remediation.
The release also documents a **2022 action against Avolta Power** ending in the
company ceasing Minnesota operations, and a **$310K restitution judgment** in 2023.

Source: Minnesota Attorney General's Office, 8 March 2024 —
`ag.state.mn.us/Office/Communications/2024/03/08_SolarLending.asp`

**Virginia — amended complaint filed 3 February 2026.**
*Commonwealth of Virginia ex rel. Attorney General v. Waller, Klink, Cross River
Bank, GoodLeap, LLC, Solar Mosaic LLC, Sunlight Financial LLC and Technology
Credit Union*, **No. 3:26-cv-00039-REP** (E.D. Va., Richmond Division).
Alleges **over $200 million in loans to more than 4,000 Virginia consumers**,
**hidden loan fees of 5% to 33%**, and that GoodLeap **extended loans to over
1,000 Virginia households**, named against **1,682 Virginia loans 2018–2022**.
Counts under the **federal Consumer Financial Protection Act** (12 U.S.C.
§§ 5536(a), 5552, 5565) and the **Virginia Consumer Protection Act** (Va. Code
§ 59.1-196 et seq.). Relief sought includes **contract rescission or
reformation, restitution, disgorgement, civil penalties**.
**Allegation stage. No finding of liability.** Named individual defendants are
Power Home Solar / Pink Energy's former CEO and CFO. Power Home filed Chapter 7
on 7 October 2022, *In re: Power Home Solar, LLC*, No. 22-50228 (Bankr. W.D.N.C.).
Mosaic is named through its bankruptcy plan administrator after *In re: Mosaic
Sustainable Finance Corp.*, No. 25-90156 (Bankr. S.D. Tex.).

Source: Virginia Office of the Attorney General —
`oag.state.va.us/consumer-protection/files/Lawsuits/Com-v-Waller-First-Amended-Complaint.pdf`

**Three distinctions recorded on the page because each prevents a real error:**
a lawsuit is not a finding; a regulator suing a lender is not relief for an
individual borrower and creates no claim form; and a lender in litigation is not
a lender in bankruptcy. A bankruptcy by an installer is likewise not one by the
lender.

---

## FAQ rich results — deprecated by Google (verified 26 Nov 2026)

**The FAQ rich result feature is dead.** Google's own Search Central documentation
changelog records, in order:

- **May 2026** — *"Deprecating the FAQ rich result feature"*
- **June 2026** — *"Removing documentation for the FAQ rich result feature"*

Source: `developers.google.com/search/updates` (Search Central documentation
updates), read 26 Nov 2026. The FAQPage documentation page still resolves but the
feature it describes is no longer a rich result Google renders.

**What this means, and what it does not mean.**

- It does **not** mean FAQPage markup is a violation. Google deprecated the
  *display* of the feature; it did not make the markup spam, and accurate markup
  is still accurate markup.
- It **does** mean no amount of FAQPage schema will produce a rich result in
  Google Search, so it cannot lift Google CTR. Any plan whose stated mechanism is
  "add FAQ schema -> rich results -> more clicks" is unsound in Google as of
  mid-2026.
- It **does not** make the markup worthless. FAQPage remains valid JSON-LD and
  remains consumable by non-Google systems, including Bing and the AI answer
  engines the owner has named as targets (Perplexity, ChatGPT, Google AI
  Overviews). Structured Q&A is machine-readable content, and the value now sits
  in machine comprehension rather than in a Google SERP enhancement.

**State of the site, measured 26 Nov 2026.** All four of the pages in question
already ship FAQPage schema with exact shell/rendered parity:

| page | FAQPage questions | shell h3 | parity |
|---|---|---|---|
| goodleap-solar-loan-cancellation-hidden-fees-2026 | 8 | 8 | OK |
| sunrun-solar-contract-cancellation-2026 | 7 | 7 | OK |
| blue-raven-solar-complaints | 7 | 7 | OK |
| adt-solar-complaints | 6 | 6 | OK |

Each page's single `application/ld+json` block carries `WebPage`,
`BreadcrumbList`, `Article` and `FAQPage`. Nothing was missing. The only reason
these four pages did not already have it is that none of them lacked it.
