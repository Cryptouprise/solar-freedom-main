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

---

## 2026-11-26 — Citation accuracy: four wrong state statutes in customer-facing copy

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

## 2026-11-26 — Doubled company name in meta descriptions

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

## 2026-11-26 — Meta description describing the wrong article

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

## 2026-11-26 — Tesla page title missing its strongest query

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

## 2026-11-26 — Database was overriding every SEO title

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

## 2026-11-26 — Every page shipped zero images

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
