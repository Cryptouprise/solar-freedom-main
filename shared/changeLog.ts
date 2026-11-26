/**
 * CHANGE LOG — the permanent, readable record of every change made to this site.
 *
 * Why this file exists
 * --------------------
 * The owner asked to always see (a) what changed, (b) why it changed, and (c) how the
 * conclusion was reached — and to never repeat the same mistake. This file is the
 * single source of truth for that. It is typed, so it can be rendered in the admin UI,
 * asserted on in tests, and read by any agent working on this codebase.
 *
 * Rules for adding an entry
 * -------------------------
 * 1. `evidence` must be a fact with a number and a date, not an opinion. If you cannot
 *    cite an impression count, a statute read date, a test name or a measured value,
 *    you are not ready to add the entry.
 * 2. `reasoning` must state how the conclusion was reached — what was checked, and
 *    what would have falsified it.
 * 3. `verifiedBy` must be the actual command run, not "tested".
 * 4. If `class` repeats an earlier entry, `preventsRecurrence` is required and must
 *    name the specific test, script or rule that now blocks it.
 * 5. Never record a ranking, traffic or appointment win here until a like-for-like
 *    window has closed. Record the measurement date instead.
 */

export type ChangeClass =
  | "content"
  | "SEO"
  | "defect"
  | "accuracy"
  | "infrastructure"
  | "conversion";

export type ChangeConfidence =
  | "measured"      // a number we pulled from a data source
  | "verified"      // read from a primary source on a stated date
  | "reasoned"      // a judgement call; no measurement yet
  | "unverified";   // must not ship to customers in this state

export interface ChangeEntry {
  /** ISO date the change landed. */
  date: string;
  /** One-line description of what changed. */
  title: string;
  class: ChangeClass;
  /** Files touched, and specifically what changed in each. */
  changed: string[];
  /** The concrete, dated, numbered reason. No opinions. */
  evidence: string;
  /** How the conclusion was reached, including what would have disproved it. */
  reasoning: string;
  /** How confident we are, based on the strength of the evidence above. */
  confidence: ChangeConfidence;
  /** The exact command run to prove it worked. */
  verifiedBy: string;
  /** The guard that stops this class of defect coming back. */
  preventsRecurrence?: string;
  /** Set when the change targets a metric; the date the result can be judged. */
  measureAfter?: string;
}

export const CHANGE_LOG: ChangeEntry[] = [
  {
    date: "2026-11-26",
    title: "Rescission page ranked for TILA but never used the word",
    class: "SEO",
    changed: [
      "client/src/data/blog-extra.ts — added the TILA acronym to the loan-rescission section and a fifth FAQ answering whether TILA rescission applies to a solar loan",
    ],
    evidence:
      "Search Console (1 Sep–22 Nov 2026): the page earns 25 impressions at average position 12.7 for 'tila rescission solar loan', plus 34 impressions at 11.9 for 'three day right to cancel solar contract'. A grep of the built page on 26 Nov 2026 returned zero occurrences of 'TILA' — the article said 'Truth in Lending Act' in full but never the acronym readers search.",
    reasoning:
      "A page ranking 12.7 for a term it does not contain is being matched on surrounding context, which caps how high it can climb. Adding the acronym is the lowest-risk way to align the page with the query, because the underlying legal position is unchanged — the section already separated sales cancellation from loan rescission. The FAQ was written to state the limits of the right rather than promise an outcome, since whether TILA rescission applies depends on the security documents and disclosures.",
    confidence: "measured",
    verifiedBy:
      "pnpm build pre-rendered 583 pages; grep -c TILA on the built page returned 3, and the FAQ appears in the FAQPage schema",
    preventsRecurrence:
      "Same rule as the Tesla title: for each page in the near-winners report, the top query by impressions is checked against the page text, not just the title. A query the page ranks for but never names is treated as a defect.",
    measureAfter: "2026-12-05",
  },
  {
    date: "2026-11-03",
    title: "Two statute citations in customer copy were simply wrong",
    class: "accuracy",
    changed: [
      "client/src/data/ — removed the AB 458 protection claim and the NRS 704.7801 disclosure claim from customer-facing copy",
      "docs/nevada-verified-facts-2026-11-03.md — recorded both corrections with source URLs",
    ],
    evidence:
      "Read on 3 Nov 2026: AB 458 (2025, Ch. 254) is the solar-powered affordable housing net-metering bill, not a solar contract protection. NRS 704.7801 opens 'As used in NRS 704.7801 to 704.7828...' — it is a definitions section, not a disclosure requirement. A third claim, 'SB 440 requires the disclosures', was also wrong: SB 379 is the solar lending and leasing rewrite, SB 440 is the HOA and utility-timeline bill.",
    reasoning:
      "These were plausible-looking citations that had never been opened. The tell is that each wrong citation pointed at the correct chapter — AB 458 is a real 2025 solar bill and NRS 704.7801 is real Nevada utility law — so a reviewer checking the topic rather than the section number would pass them. In this niche the audience includes attorneys, and a wrong section number costs more credibility than the sentence earns.",
    confidence: "verified",
    verifiedBy:
      "Corrections recorded in docs/nevada-verified-facts-2026-11-03.md with a source URL and read date for each; now asserted by server/statuteCitations.test.ts",
    preventsRecurrence:
      "Standing rule written at the time: never cite a section number that has not been read from the official source on the day it is written. The rule was not yet enforced by a test, which is why the same class recurred on 26 Nov 2026 and produced server/statuteCitations.test.ts. A rule without a test is a note, not a guard.",
  },
  {
    date: "2026-11-26",
    title: "Four wrong state statute citations in the Sunrun state-rights list",
    class: "accuracy",
    changed: [
      "client/src/data/blog-articles-batch9.ts — the State-Specific Sunrun Cancellation Rights list",
      "server/statuteCitations.test.ts — new guard test (13 assertions)",
    ],
    evidence:
      "Four of five citations pointed at the wrong section. Cal. Civ. Code 1689.5 is legislative intent; the right to cancel is 1689.6. Fla. Stat. 501.021 is definitions; 501.025 is the buyer's right to cancel. A.R.S. 44-5001 is definitions; 44-5002 is the cancellation period. NRS 598.2821 does not govern solar agreements; NRS 598.98216 does. Each was read from the official statute text on 26 Nov 2026.",
    reasoning:
      "A sweep of every statute number in the content files, followed by opening each source rather than trusting the number. The pattern is identical in all four cases: the definitions or intent section of the correct chapter, which is why the numbers looked plausible. This is the third time this class has shipped — AB 458 and NRS 704.7801 were the first two, corrected 3 Nov 2026. Two repetitions is a process failure, not bad luck, so the fix is a test rather than a correction.",
    confidence: "verified",
    verifiedBy:
      "npx vitest run server/statuteCitations.test.ts — 13 passed; pnpm check clean; pnpm test 759 passed, 3 skipped; pnpm build pre-rendered 583 pages",
    preventsRecurrence:
      "server/statuteCitations.test.ts asserts each wrong citation is absent and each correct one is present, so a regression fails the build. Standing rule: never write a section number that was not read from the official source on the day it is written.",
  },
  {
    date: "2026-11-26",
    title: "Company meta descriptions still said 'ADT Solar solar contract'",
    class: "defect",
    changed: [
      "scripts/prerender.assembled.mjs — title and description now derive from one shared companyLabel value",
    ],
    evidence:
      "On 26 Nov 2026, six company pages served a meta description reading 'Review ADT Solar solar contract terms'. The title generator had been fixed for the same doubling, but the description template appended the word 'solar' independently. A scan of all 583 built pages found 6 occurrences, now 0.",
    reasoning:
      "Found by asserting on the built output rather than the source, which is the only way to catch a defect that only exists after template assembly. The fix is structural: deriving both strings from one variable makes it impossible to fix one and forget the other.",
    confidence: "measured",
    verifiedBy:
      'grep -ril "solar solar" dist/public --include="index.html" | wc -l — returned 0, down from 6',
    preventsRecurrence:
      "server/prerenderImages.test.ts scans all 583 built pages for doubled wording and fails on any match.",
  },
  {
    date: "2026-11-26",
    title: "Escalator-clause article had a Sunrun cancellation description",
    class: "content",
    changed: [
      "client/src/data/blog-articles-batch10.ts — metaDescription for the solar escalator clause article",
    ],
    evidence:
      "On 26 Nov 2026 the description read 'Signed a Sunrun contract? Cancel before installation to avoid penalties!' — copy-pasted from a different article. The page's own subject is annual payment escalators, and it earns 80 impressions at average position 7.0 (Search Console, 1 Sep–22 Nov 2026) with 0 clicks, so every one of those impressions was spent on a snippet that described a different topic.",
    reasoning:
      "Found by an audit that cross-checked every description against its URL for a brand name that does not belong. A description is the single highest-leverage sentence on a page because it is what a searcher reads before deciding to click, so a wrong one wastes every impression the page earns.",
    confidence: "verified",
    verifiedBy:
      "Confirmed corrected in dist/public/blog/solar-escalator-clause-what-it-is-how-to-fight/index.html",
    preventsRecurrence:
      "The description audit checks all 583 pages for a brand name absent from the URL slug, which is the signature of this error.",
  },
  {
    date: "2026-11-26",
    title: "Tesla page title ignored the query it already ranks for",
    class: "SEO",
    changed: [
      "client/src/data/blog-articles-batch10.ts — metaTitle and metaDescription for /blog/tesla-solar-solarcity-complaints-cancel-2026",
    ],
    evidence:
      "The page ranks position 10.5 for 'tesla ucc termination' and 11.5 for 'tesla ucc termination request' (Search Console, 1 Sep–22 Nov 2026), but the title read 'Tesla Solar / SolarCity Contract, Billing and Transfer Checklist' and never mentioned UCC. The body already answered the question, including Tesla's own statement that a UCC-1 fixture filing is a notice of interest and not itself a lien on the home.",
    reasoning:
      "Position 10-11 with the right answer already on the page is the cheapest ranking gain available: the content does not need to be written, only surfaced. The near-winners report ranks pages by impressions at positions 11-20, and for each one the top query by impressions was compared against the title. This page was the clearest mismatch.",
    confidence: "measured",
    verifiedBy:
      "Title confirmed in the built output as 'Tesla Solar / SolarCity: UCC-1, PPA, Billing & Transfer' (56 chars)",
    preventsRecurrence:
      "Title work is now driven by the near-winners report rather than by preference: for each page, the top query by impressions is compared against the title before anything else is changed. A title that omits a query the page already ranks for in positions 11-20 is treated as a defect.",
    measureAfter: "2026-12-05",
  },
  {
    date: "2026-11-26",
    title: "Database was overriding every SEO title on the site",
    class: "SEO",
    changed: [
      "scripts/reconcile-blog-db.mjs — cleared metaTitle/metaDescription for the 11 code-backed posts; left the 14 database-only posts untouched",
    ],
    evidence:
      "Checked on 26 Nov 2026: all 25 blogPosts rows had a metaTitle differing from the repository value, and server/seo-meta.ts applies the database value over the pre-rendered shell at request time. Every title written in code was therefore discarded before it reached a visitor.",
    reasoning:
      "This explains the owner's repeated observation that SEO work produced no visible change: the work was correct and was being overwritten at runtime. Found by tracing why a corrected title did not appear on the live site, rather than assuming the deploy had failed. The 14 database-only posts were deliberately left alone because clearing their meta would strip the only title they have, and they are noindex by design.",
    confidence: "measured",
    verifiedBy:
      "Live titles now match the repository; re-running the script reports no pending changes",
    preventsRecurrence:
      "The script is idempotent and defaults to dry-run. The 14 database-only posts stay noindex under the documented rule in shared/index-eligibility.json and must not be bulk-promoted.",
  },
  {
    date: "2026-11-26",
    title: "Every page on the site shipped zero images",
    class: "defect",
    changed: [
      "scripts/prerender.assembled.mjs — parser captures src/alt/caption, image blocks render as figure/img, article and city heroes carried into the shell",
      "server/priorityCityDelivery.ts — the runtime city rebuild now preserves the hero figure",
    ],
    evidence:
      "Measured on 26 Nov 2026: all 583 pre-rendered pages contained zero <img> tags. The parser read only content, items and stats, so image blocks were discarded silently. A second, independent half of the same bug: a runtime transform emptied the guide container and rebuilt it, discarding the hero that pre-rendering had just added.",
    reasoning:
      "The owner had reported walls of text repeatedly and the report was accurate — the images existed in the data and were being dropped at assembly. Confirmed by counting <img> tags in the built output rather than inspecting the source, because the source contained the images.",
    confidence: "measured",
    verifiedBy:
      "img tags now present on homepage, blog posts and city pages in the built output and live",
    preventsRecurrence:
      "server/prerenderImages.test.ts asserts every emitted img has alt text and a real source, and that the city hero survives the runtime rebuild.",
  },  {
    date: "2026-11-26",
    title: "Five company statuses were factually wrong, two contradicting our own articles",
    class: "accuracy",
    changed: [
      "client/src/data/companies.ts — corrected Titan Solar (Active to Bankrupt), Freedom Forever (Active to Bankrupt), Sunnova (Active to Bankrupt), Mosaic (Active to Bankrupt) and Sunlight Financial (Active to Acquired)",
      "client/src/data/companies.ts — added statusNote and statusSource to the CompanyData interface so every corrected status carries why it is what it is and a primary source URL",
      "client/src/pages/CompanyPage.tsx — renders the status note and a source link under the company quick facts panel",
      "server/companyStatus.test.ts — new file, 21 tests locking the corrected statuses, the evidence requirement, and a guard against any Active company carrying a shutdown note",
    ],
    evidence:
      "An audit on 26 Nov 2026 compared all 19 company records against primary sources and found five wrong. Freedom Forever was the worst: companies.ts said Active while our own article at /blog/freedom-forever-solar-bankruptcy-what-homeowners-can-do-2026 described its bankruptcy. Verified the same day — Freedom Forever filed Chapter 11 on 15 April 2026 and converted to Chapter 7 on 7 August 2026 (ElevenFlo case No. 26-10522, D. Del., citing Dkt. 533). Titan ceased operations 13 June 2024 (pv-tech). Sunnova filed Chapter 11 on 8 June 2025 and its own site states it has ceased independent operations with SunStrong Management servicing accounts. Mosaic confirmed a plan effective 22 September 2025 (cases.ra.kroll.com/MOSAIC). Sunlight Financial emerged from its December 2023 prepackaged Chapter 11 and still services loans, so Bankrupt was wrong in the other direction.",
    reasoning:
      "Four of the five errors made a dead company look alive, which understates the homeowner's problem, and one made a live servicer look dead, which overstates it. Both directions damage credibility in a niche where the reader is checking whether the company that took their money still exists. The test suite was written before the fix could be considered done because this is the fourth defect class where the site asserted something the sources did not support — the earlier three were statute citations. A status with no source is a guess with a deadline, so statusNote and statusSource are now part of the type.",
    confidence: "verified",
    verifiedBy:
      "pnpm vitest run server/companyStatus.test.ts — 21 tests passed",
    preventsRecurrence:
      "server/companyStatus.test.ts asserts the five corrected statuses, requires a substantive statusNote plus an http(s) statusSource on each, rejects any status value outside the four known ones, and fails if any company marked Active carries a note describing a shutdown. That last assertion is the exact contradiction that triggered the audit.",
  },
  {
    date: "2026-11-26",
    title: "Homepage ranked 10.7 for 'solar contracts voidable' and never used the word",
    class: "SEO",
    changed: [
      "shared/home-faq.json — added an eighth FAQ, 'Can a solar contract be voidable?', written from verified Nevada statutory text",
    ],
    evidence:
      "Search Console (1 Sep-22 Nov 2026): the homepage earns 9 impressions at average position 10.7 for 'solar contracts voidable'. A grep of the built homepage HTML on 26 Nov 2026 returned zero occurrences of 'voidable'. The only occurrence anywhere in the page source is inside Home.tsx, which is replaced at pre-render time by buildSemanticShellContent, so the word never reaches the served HTML.",
    reasoning:
      "This is the same defect as the TILA and Tesla title cases: the page is matched on surrounding context rather than on the term, which caps how high it can rank. The homepage shell emits only the FAQ block as unique body content, so the FAQ is the correct and lowest-risk place to put the term. The answer was written to define voidable as a legal status rather than a marketing claim, cite NRS 624.875 and NRS 598.9822, and state that whether a specific agreement is voidable depends on comparing the signed documents against the statute where the reader signed. It deliberately avoids promising an outcome, because the standing accuracy rule forbids that.",
    confidence: "verified",
    verifiedBy:
      "pnpm build pre-rendered 583 pages; grep -c voidable on dist/public/index.html returned a non-zero count",
    preventsRecurrence:
      "server/changeLog.test.ts requires any entry with a repeated class to name a specific guard. For this class the standing rule is that a query earning impressions at position 20 or better must appear in the built page — check with grep against dist/public, not against the React source, because the shell replaces the component tree.",
    measureAfter: "2026-12-05",
  },
  {
    date: "2026-11-26",
    title: "Two Sunrun cancellation pages were split across the same queries",
    class: "SEO",
    changed: [
      "client/src/data/blog-articles-batch9.ts — added a scope-boundary paragraph to sunrun-solar-contract-cancellation-2026 naming its full-lifecycle remit and pointing pre-installation readers to the dedicated guide",
      "client/src/data/blog-articles-batch9.ts — converted the pre-installation section on that page into a summary plus a link, so it no longer competes with the dedicated page",
      "client/src/data/blog-articles-batch9.ts — added the matching scope paragraph to cancel-sunrun-solar-contract-before-installation, naming the pre-installation window and linking to the full-lifecycle page",
    ],
    evidence:
      "Search Console (1 Sep-22 Nov 2026): the two pages split the same intent. 'how to cancel sunrun contract' went 188 impressions to the before-installation page at position 13.7 and 131 to the 2026 page at position 13.7. 'how to cancel sunrun contract before installation' went 142 to the before-installation page and 133 to the 2026 page. The 2026 page holds 9,343 total impressions against 1,936 for the other, so both have real weight and neither can simply be retired.",
    reasoning:
      "Neither page can win a query it only half-owns, because Google has to choose between two similar answers on the same domain. The fix is not to delete either page but to make each one unambiguously about a different stage, and to link between them so the pair reads as a sequence rather than a duplicate. The dedicated pre-installation page keeps the letter template, the state windows and the deadline math; the 2026 page keeps after-installation, transfer-on-sale and the fee analysis. Cross-links were added in both directions so a reader who lands on the wrong stage is one click from the right one.",
    confidence: "measured",
    verifiedBy:
      "pnpm build pre-rendered 583 pages with both scope paragraphs present in the output; the link targets resolve to real slugs",
    preventsRecurrence:
      "The rule now standing: before adding or rewriting a page on a topic the site already covers, check whether an existing page already earns impressions for the target query, and if so differentiate rather than duplicate. The signal to check is the per-URL query breakdown, where two URLs on the same domain showing impressions for the same query means the site is competing with itself. Both pages now carry an explicit stage boundary and a link to the other, so a future edit that blurs them is visible in review.",
    measureAfter: "2026-12-05",
  },
  {
    date: "2026-11-26",
    title: "Freedom Forever article speculated about a bankruptcy that had already happened",
    class: "content",
    changed: [
      "client/src/data/blog-articles-batch9.ts — rewrote freedom-forever-solar-bankruptcy-what-homeowners-can-do-2026 from conditional to past tense with the verified Chapter 7 record: the 15 April 2026 petition, the 7 August 2026 conversion, the trustee, the 16 October 2026 claim deadline, and the 3 February 2027 government deadline",
      "client/src/data/blog-articles-batch9.ts — added the finance-partner list that can step in to complete open installations, the SolarEdge and Tesla secured debt figures, and seven FAQs replacing six conditional ones",
    ],
    evidence:
      "Search Console (1 Sep-22 Nov 2026): the page earns 97 impressions across 28 queries, and every high-volume one is bankruptcy-intent — 'freedom bankruptcy' 22 at position 15.1, 'freedom forever bankruptcy' 21 at 17.8, 'freedom forever out of business' 4 at 19.5, 'is freedom forever going out of business' 4 at 20.5. It earned 1 click. The published article said 'If Freedom Forever files for bankruptcy' throughout, seven months after it filed, and never mentioned Chapter 7, the trustee or the claim deadline.",
    reasoning:
      "A page written in the conditional cannot satisfy a reader who already knows the company failed, which is consistent with 1 click from 97 impressions. The facts were read on 26 Nov 2026 from the ElevenFlo case analysis of No. 26-10522, which cites docket numbers for every claim, rather than from secondary commentary. The rewrite keeps the honest core of the original argument — the installer failing does not cancel a loan held by a separate lender — and adds the operational detail readers actually need: who may finish an incomplete install, why the warranty is effectively unenforceable, and that the claim deadline has passed. A new image and a stat block were added to break up what was a wall of text.",
    confidence: "verified",
    verifiedBy:
      "pnpm build pre-rendered 583 pages; grep confirms the built page contains Chapter 7, 7 August 2026 and the seven new FAQs",
    preventsRecurrence:
      "Any article whose subject is an event must be checked for tense before it is left alone: if the event the page is written about has already occurred, the conditional phrasing is a defect, not a style choice. The specific detector is a grep for 'if <company> files', 'if the company enters', 'might attempt', and 'faces significant financial headwinds' across the article data files. The rule is written into this entry rather than only into a test because the failure was editorial judgement, not a code path, so a reviewer reading the change log is the guard.",
    measureAfter: "2026-12-05",
  },

];

/** Entries grouped by class, for the admin view. */
export function changeLogByClass(): Record<string, ChangeEntry[]> {
  const out: Record<string, ChangeEntry[]> = {};
  for (const entry of CHANGE_LOG) {
    (out[entry.class] ??= []).push(entry);
  }
  return out;
}

/** Every class that has appeared more than once — these are the recurring defects. */
export function recurringClasses(): ChangeClass[] {
  const counts = new Map<ChangeClass, number>();
  for (const entry of CHANGE_LOG) {
    counts.set(entry.class, (counts.get(entry.class) ?? 0) + 1);
  }
  const out: ChangeClass[] = [];
  counts.forEach((n, c) => {
    if (n > 1) out.push(c);
  });
  return out;
}

/**
 * Entries whose target metric cannot yet be judged. Rendering a result before this
 * date would be reporting noise as progress, which is exactly what this file exists
 * to prevent.
 */
export function pendingMeasurements(today: string): ChangeEntry[] {
  return CHANGE_LOG.filter(e => e.measureAfter && e.measureAfter > today);
}
