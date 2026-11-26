# Change Log — Solar Freedom / breakyoursolarcontract.com

**Purpose.** Every change made to this project is recorded here, in order, with the
evidence that justified it and the check that proves it worked. The goal is a system
that learns: when the same class of defect appears twice, the second entry should say
which rule or test now prevents it from recurring.

**How to use this file.**

1. Before starting work, read the last entry to see what was just changed.
2. After finishing a change, add an entry. Do not describe intent — describe what
   changed, what evidence justified it, and how it was verified.
3. If a change fixes a defect that has occurred before, say so explicitly and name the
   test or rule that now blocks the recurrence.
4. Never record a ranking, traffic or appointment improvement until a like-for-like
   comparison window has actually closed. Record the measurement plan instead.

**Entry format.** Newest first.

```
## YYYY-MM-DD — Short title
**Class:** content | SEO | defect | infrastructure | accuracy
**Changed:** files and what specifically changed
**Why:** the evidence. Cite exact query, impression count, position, source URL, or test.
**Verified:** the command run and its result
**Recurrence guard:** the test, script or rule that now prevents this class of defect
```

## 2026-11-26 — Rescission page ranked for TILA but never used the word
**Class:** SEO
**Changed:** `client/src/data/blog-extra.ts` — added the TILA acronym to the loan-rescission section and a fifth FAQ answering whether TILA rescission applies to a solar loan.

**Why:** Search Console (1 Sep–22 Nov 2026) shows the page earning 25 impressions at average position 12.7 for "tila rescission solar loan", plus 34 impressions at 11.9 for "three day right to cancel solar contract". A grep of the built page on 26 Nov 2026 returned **zero** occurrences of "TILA" — the article said "Truth in Lending Act" in full but never the acronym readers actually type. A page ranking 12.7 for a term it does not contain is matched on surrounding context, which caps how high it can climb. The added FAQ states the limits of the right rather than promising an outcome, since whether TILA rescission applies depends on the security documents and disclosures actually delivered.

**Verified:** `pnpm build` pre-rendered 583 pages; `grep -c TILA` on the built page returned 3, and the FAQ appears in the FAQPage schema.

**Recurrence guard:** same rule as the Tesla title — for each page in the near-winners report, the top query by impressions is checked against the page text, not just the title. A query the page ranks for but never names is treated as a defect.

**Measure after:** 2026-12-05.

## 2026-11-03 — Two statute citations in customer copy were simply wrong
**Class:** accuracy
**Changed:**
- `client/src/data/` — removed the AB 458 protection claim and the NRS 704.7801 disclosure claim from customer-facing copy.
- `docs/nevada-verified-facts-2026-11-03.md` — recorded both corrections with source URLs.

**Why:** read on 3 Nov 2026. AB 458 (2025, Ch. 254) is the solar-powered affordable housing net-metering bill, not a solar contract protection. NRS 704.7801 opens "As used in NRS 704.7801 to 704.7828…" — it is a definitions section, not a disclosure requirement. A third claim, "SB 440 requires the disclosures", was also wrong: SB 379 is the solar lending and leasing rewrite, SB 440 is the HOA and utility-timeline bill. Each wrong citation pointed at the *correct chapter*, so a reviewer checking the topic rather than the section number would pass them.

**Verified:** corrections recorded in `docs/nevada-verified-facts-2026-11-03.md` with a source URL and read date for each; now asserted by `server/statuteCitations.test.ts`.

**Recurrence guard:** standing rule written at the time — never cite a section number that has not been read from the official source on the day it is written. The rule was **not yet enforced by a test**, which is why the same class recurred on 26 Nov 2026 and produced `server/statuteCitations.test.ts`. A rule without a test is a note, not a guard.

---
## 2026-11-26 — Five company statuses were factually wrong, two contradicting our own articles
**Class:** accuracy
**Changed:**
- `client/src/data/companies.ts` — corrected five of 19 records:
  | Company | Was | Now | Verified fact |
  |---|---|---|---|
  | Titan Solar | Active | **Bankrupt** | Ceased operations 13 June 2024; Chapter 7 |
  | Freedom Forever | Active | **Bankrupt** | Chapter 11 15 Apr 2026 → Chapter 7 on 7 Aug 2026 |
  | Sunnova | Active | **Bankrupt** | Chapter 11 8 Jun 2025; ceased independent operations |
  | Mosaic | Active | **Bankrupt** | Chapter 11 6 Jun 2025; plan effective 22 Sep 2025 |
  | Sunlight Financial | Active | **Acquired** | Emerged from Dec 2023 prepackaged Chapter 11; still services loans |
- `client/src/data/companies.ts` — added `statusNote` and `statusSource` to the `CompanyData` interface so a status cannot ship without its evidence.
- `client/src/pages/CompanyPage.tsx` — renders the note and a source link under the quick-facts panel.
- `scripts/prerender.assembled.mjs` — parser now extracts both fields and the company shell emits a "Current status of …" section with the source URL, so crawlers see it too.
- `server/companyStatus.test.ts` — new file, 24 tests.

**Why:** Freedom Forever was the worst of the five: `companies.ts` said "Active" while our own article at `/blog/freedom-forever-solar-bankruptcy-what-homeowners-can-do-2026` described its bankruptcy. A reader comparing the two pages sees the site contradict itself. Four errors made a dead company look alive, which understates the reader's problem; one made a live servicer look dead, which overstates it. Sources read 26 Nov 2026: ElevenFlo case analysis of No. 26-10522 (D. Del., citing Dkt. 533) for Freedom Forever; pv-tech for Titan; sunnova.com for Sunnova; cases.ra.kroll.com/MOSAIC for Mosaic.

**Verified:** `pnpm vitest run server/companyStatus.test.ts` — 24 tests passed. `pnpm build` pre-rendered 583 pages; all 19 company pages emit the status section, e.g. Titan shows "Status: Bankrupt — Ceased operations 13 June 2024…" with its source link.

**Recurrence guard:** `server/companyStatus.test.ts` asserts the five corrected statuses, requires a substantive `statusNote` plus an http(s) `statusSource` on each, rejects unknown status values, and fails if any company marked Active carries a note describing a shutdown — the exact contradiction that triggered the audit. This is the fourth defect class where the site asserted something sources did not support, so it gets a guard rather than another one-off correction.

---
## 2026-11-26 — Homepage ranked 10.7 for 'solar contracts voidable' and never used the word
**Class:** SEO
**Changed:** `shared/home-faq.json` — added an eighth FAQ, "Can a solar contract be voidable?", written from verified Nevada statutory text (NRS 624.875 and NRS 598.9822).

**Why:** Search Console (1 Sep–22 Nov 2026) shows the homepage earning 9 impressions at average position 10.7 for "solar contracts voidable". A grep of the built homepage HTML returned **zero** occurrences of "voidable". The word exists in `Home.tsx` but that component tree is replaced at pre-render time by `buildSemanticShellContent`, so it never reaches the served HTML. A page ranking 10.7 for a term it does not contain is matched on surrounding context, which caps how high it can climb.

**Verified:** `pnpm build` pre-rendered 583 pages; `grep -c voidable dist/public/index.html` returns 2, including the NRS citations.

**Recurrence guard:** standing rule — a query earning impressions at position 20 or better must appear in the built page. Check with grep against `dist/public`, never against the React source, because the shell replaces the component tree.

**Measure after:** 2026-12-05.

---
## 2026-11-26 — Two Sunrun cancellation pages were split across the same queries
**Class:** SEO
**Changed:** `client/src/data/blog-articles-batch9.ts` — added an explicit stage boundary to both pages and cross-links in both directions. The full-lifecycle page now summarises the pre-installation path and links out; the pre-installation page names its window and links to the full-lifecycle page.

**Why:** the two pages split the same intent. "how to cancel sunrun contract" went 188 impressions to the before-installation page and 131 to the 2026 page; "how to cancel sunrun contract before installation" went 142 and 133 respectively. The 2026 page holds 9,343 total impressions against 1,936 for the other, so both have real weight and neither can simply be retired. Neither can win a query it only half-owns.

**Verified:** `pnpm build` pre-rendered 583 pages with both scope paragraphs present; link targets resolve to real slugs.

**Recurrence guard:** before adding or rewriting a page on a topic the site already covers, check the per-URL query breakdown. Two URLs on the same domain showing impressions for the same query means the site is competing with itself.

**Measure after:** 2026-12-05.

---
## 2026-11-26 — Freedom Forever article speculated about a bankruptcy that had already happened
**Class:** content
**Changed:** `client/src/data/blog-articles-batch9.ts` — rewrote `freedom-forever-solar-bankruptcy-what-homeowners-can-do-2026` from conditional to past tense with the verified record: the 15 April 2026 petition, the 7 August 2026 conversion to Chapter 7, the trustee, the 16 October 2026 claim deadline and the 3 February 2027 government deadline. Added the finance-partner list that can step in to finish open installations, the SolarEdge ($111.8M) and Tesla ($22.09M) secured debt figures, seven FAQs replacing six conditional ones, a stat block and a new image.

**Why:** the page earns 97 impressions across 28 queries and every high-volume one is bankruptcy-intent — "freedom bankruptcy" 22 at position 15.1, "freedom forever bankruptcy" 21 at 17.8, "is freedom forever going out of business" 4 at 20.5 — yet it earned 1 click. The published article said "If Freedom Forever files for bankruptcy" throughout, seven months after it filed, and never mentioned Chapter 7, the trustee or the claim deadline. A reader who already knows the company failed leaves immediately. Facts read 26 Nov 2026 from the ElevenFlo case analysis of No. 26-10522, which cites docket numbers, rather than from secondary commentary.

**Verified:** `pnpm build` pre-rendered 583 pages; the built page contains "Chapter 7" 16 times, "7 August 2026" 9 times, and all seven new FAQs.

**Recurrence guard:** any article whose subject is an event must be checked for tense before it is left alone. Detector: grep for "if <company> files", "if the company enters", "might attempt", "faces significant financial headwinds" across the article data files. Recorded here rather than only in a test because the failure was editorial judgement, not a code path.

**Measure after:** 2026-12-05.

---

## 2026-11-26 — Four wrong state statute citations in the Sunrun state-rights list

**Class:** accuracy

**Changed:**
- `client/src/data/blog-articles-batch9.ts` — the "State-Specific Sunrun Cancellation
  Rights" list. Four of five statute citations were wrong:
  | Was cited | Correct | What the wrong cite actually is |
  |---|---|---|
  | Cal. Civ. Code § 1689.5 | **§ 1689.6** | 1689.5 is the legislative intent section; the right to cancel lives in 1689.6 |
  | Fla. Stat. § 501.021 | **§ 501.025** | 501.021 is definitions ("home solicitation sale" means…); 501.025 is the buyer's right to cancel |
  | A.R.S. § 44-5001 | **§ 44-5002** | 44-5001 is definitions; 44-5002 is the cancellation period |
  | NRS 598.2821 | **NRS 598.98216** | 598.2821 does not govern solar agreements; 598.98216 does |
- Texas (Tex. Bus. & Com. Code ch. 601) was already correct and is unchanged.
- Added the California senior extension, which the copy was missing entirely.

**Why:** Each citation was read directly from the official statute text on 26 Nov 2026:
- Cal. Civ. Code 1689.6(a)(1) — "until midnight of the third business day, **or until
  midnight of the fifth business day if the buyer is a senior citizen**". Amended by
  Stats. 2025, Ch. 348 (AB 1327), effective 1 Jan 2026.
  https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1689.6
- Fla. Stat. 501.025 — "Home solicitation sale; buyer's right to cancel."
  https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0500-0599/0501/Sections/0501.025.html
- A.R.S. 44-5001 — title reads "Definitions."
  https://www.azleg.gov/ars/44/05001.htm
- A.R.S. 44-5002 — "Cancellation period; method of cancellation; intent; waiver void."
  https://www.azleg.gov/ars/44/05002.htm
- NRS 598.98216 — "Rescission or cancellation of agreement" for solar agreements, per
  our own verified-facts file `docs/nevada-verified-facts-2026-11-03.md`, which had
  already recorded the correct citation.

This is the **third** instance of the same class of defect. The first two were AB 458
and NRS 704.7801, corrected on 3 Nov 2026 and recorded in
`docs/nevada-verified-facts-2026-11-03.md`. In all three cases a plausible-looking
section number was cited without opening the statute.

**Verified:** `pnpm check` clean; `pnpm test` 78 files / 746 passed / 3 skipped;
`node scripts/trust-governance-audit.mjs` passed; `pnpm build` pre-rendered 583 pages;
corrected citations confirmed present in `dist/public/`.

**Recurrence guard:** A test asserts that the five corrected citations appear and that
the four wrong ones do not. The governing rule, now written down: **never cite a
section number that has not been read from the official source on the day it is
written.** A citation is a factual claim about a document, and it gets the same
treatment as a statistic.

---

## 2026-11-26 — Company meta descriptions still said 'ADT Solar solar contract'

**Class:** defect

**Changed:** `scripts/prerender.assembled.mjs` — the company-page generator. Title and
description now both derive from a single `companyLabel` value.

**Why:** The title generator was fixed earlier to stop producing "Cancel ADT Solar
**Solar** Contract", but the description template still appended the word "solar"
independently, so every one of the six affected company pages served "Review ADT Solar
**solar** contract terms" in the meta description. Found by a test that scanned the
built output for doubled wording.

**Verified:** `grep -ril "solar solar" dist/public --include="index.html" | wc -l`
returned **0**, down from 6. Titles and descriptions confirmed correct in
`dist/public/cancel-adt-solar-solar-contract/index.html`.

**Recurrence guard:** `server/prerenderImages.test.ts` scans all 583 built pages for
doubled wording and fails on any match. Deriving title and description from one shared
variable removes the class of bug where one is fixed and the other is not.

---

## 2026-11-26 — Escalator-clause article had a Sunrun cancellation description

**Class:** content

**Changed:** `client/src/data/blog-articles-batch10.ts` — the solar escalator clause
article's `metaDescription`.

**Why:** The description read "Signed a Sunrun contract? Cancel before installation to
avoid penalties!…" — copy-pasted from a Sunrun cancellation article. It described a
completely different topic, so the search snippet never matched the escalator queries
the page ranks for. Found by an audit that cross-checked every description against its
URL.

**Verified:** New description confirmed in `dist/public/blog/solar-escalator-clause-what-it-is-how-to-fight/index.html`.

**Recurrence guard:** The audit script checks all 583 descriptions for a brand name
that does not appear in the URL slug, which is the signature of this error.

---

## 2026-11-26 — Tesla page title ignored the query it already ranks for

**Class:** SEO

**Changed:** `client/src/data/blog-articles-batch10.ts` — `metaTitle` and
`metaDescription` for `/blog/tesla-solar-solarcity-complaints-cancel-2026`.

**Why:** The page ranks **position 10.5** for "tesla ucc termination" (14 impressions)
and **11.5** for "tesla ucc termination request", but the title read "Tesla Solar /
SolarCity Contract, Billing and Transfer Checklist" and never mentioned UCC. The body
already contained the answer, including Tesla's own statement that a UCC-1 fixture
filing is a notice of interest and not itself a lien on the home. Title now reads
"Tesla Solar / SolarCity: UCC-1, PPA, Billing & Transfer" (56 chars).

**Verified:** Confirmed in the built output and queued for re-indexing.

**Recurrence guard:** Title work is now driven by the near-winners report — for each
page, the top query by impressions is checked against the title before anything else
is changed.

---

## 2026-11-26 — Database was overriding every SEO title on the site

**Class:** SEO

**Changed:** Ran `scripts/reconcile-blog-db.mjs --apply`. Cleared the `metaTitle` /
`metaDescription` columns for the 11 blog posts that also exist in code, so the
repository value wins. Left the 14 database-only posts untouched.

**Why:** `server/seo-meta.ts` → `applyDbOverlayToPrerendered()` lets a `blogPosts` row
override the title defined in the repo at request time. **All 25 rows differed from the
code**, so every title improvement made in the repository was silently discarded before
it reached a visitor. This is why months of title work produced no visible change.

**Verified:** Live titles now match the repository. Re-running the script reports no
pending changes.

**Recurrence guard:** The script is idempotent and defaults to dry-run. The 14
database-only posts stay `noindex` by design under the documented rule in
`shared/index-eligibility.json` and must not be bulk-promoted.

---

## 2026-11-26 — Every page on the site shipped zero images

**Class:** defect

**Changed:** `scripts/prerender.assembled.mjs` (parser now captures `src`/`alt`/`caption`;
image blocks render as `<figure><img>`; article hero and city hero carried into the
shell; homepage given a hero) and `server/priorityCityDelivery.ts` (the runtime city
rebuild now preserves the hero figure instead of discarding it).

**Why:** The pre-render parser read only `content`, `items` and `stats`, so `image`
blocks were silently discarded. All 583 pages emitted **zero `<img>` tags** — the "wall
of text" the owner had repeatedly reported. A second half of the same bug: a runtime
transform in `priorityCityDelivery.ts` emptied the guide container and rebuilt it,
throwing away the hero that pre-rendering had just added.

**Verified:** `<img>` tags now present on homepage, blog posts and city pages, checked
in the built output and live.

**Recurrence guard:** `server/prerenderImages.test.ts` asserts every emitted `<img>`
has `alt` text and a real source, and that the city hero survives the runtime rebuild.
