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
    title: "Blue Raven page ranked position 6 for 1,994 impressions and earned 19 clicks",
    class: "SEO",
    changed: [
      "client/src/data/blog-articles-batch8.ts — rewrote the Blue Raven meta description to name reviews, complaints, customer service and the support number, which the body already documented",
    ],
    evidence:
      "Search Console (1 Sep–22 Nov 2026): /blog/blue-raven-solar-complaints is the best-positioned high-volume page on the site at 1,994 impressions and average position 6.4, but only 19 clicks — a 0.95% CTR where position 6 normally earns several times that. The queries it ranks for are overwhelmingly review-and-contact intent: 'blue raven solar reviews' 459 impressions at 15.6, 'blue raven solar customer service' 238 at 6.6, 'blue raven solar phone number' 115 at 8.5, 'blue raven solar customer service phone number' 96 at 7.0, 'blue raven solar review' 88 at 13.1. The old 133-character description said none of those words.",
    reasoning:
      "The page body already answered every one of those queries, including a verified BBB block, so this was not a content gap — it was a snippet gap, and the snippet is what earns the click. Roughly 1,080 impressions were searching for words the description never displayed. The body's BBB figures were re-verified on 26 Nov 2026 against the BBB profile's own structured data (A+ rating, 555 complaints in three years, 877 customer reviews, accredited since 23 October 2015, phone (800) 377-4480), so the description could cite the rating and the number without asserting anything new. The review count was deliberately left out of the description because it changes, and a stale figure in a snippet is worse than no figure.",
    confidence: "measured",
    verifiedBy:
      "node scripts/fix-blue-raven-description.mjs reports the new description at 151 characters; pnpm check clean; pnpm build and grep of the served meta description",
    preventsRecurrence:
      "For every near-winner page, the top five queries by impressions must be checked against the meta description text, not only against the page body. A page can rank on body relevance while its snippet answers nothing the searcher typed.",
    measureAfter: "2026-12-05",
  },
  {
    date: "2026-11-26",
    title: "Sunrun page had 207 impressions asking to cancel an appointment and never said the word",
    class: "content",
    changed: [
      "client/src/data/blog-articles-batch9.ts — added a 'How do you cancel or reschedule a Sunrun appointment?' section to the Sunrun cancellation article",
      "client/src/data/blog-articles-batch9.ts — added the matching FAQ at the front of the array and retired the home-sale FAQ, which its own dedicated page covers",
    ],
    evidence:
      "Search Console (1 Sep–22 Nov 2026): /blog/sunrun-solar-contract-cancellation-2026 holds 2,007 impressions across 138 queries at average position 10.4 with 11 clicks. A distinct cluster inside it is people trying to stop a visit rather than end a contract: 'how to cancel sunrun appointment' 85 impressions at 9.0, 'cancel sunrun appointment' 71 at 9.9, 'how to cancel sunrun appointment online' 51 at 9.2 — about 207 impressions. A grep of the built page on 26 Nov 2026 returned zero occurrences of the word 'appointment' anywhere in it.",
    reasoning:
      "A page ranking position 9 for a term it does not contain is matched on surrounding context, which caps how high it can climb and guarantees the snippet will not match. This also matters commercially: someone with an installer visit scheduled tomorrow is the most time-pressured visitor the site gets, and the page had nothing for them. The new section deliberately does not invent a phone menu or a web form path — it states the one verifiable and genuinely useful point, that stopping a visit and cancelling a contract are different actions and that cancelling a visit does not cancel the agreement, then routes the reader to the documented notice requirement the rest of the article already covers. The FAQ swap follows the same rule as the Tesla page: BlogPost.tsx renders only the first five FAQs, so the question with real measured demand took the slot of one whose topic has its own dedicated page.",
    confidence: "measured",
    verifiedBy:
      "pnpm check clean; grep of the built Sunrun page confirms the new heading and the appointment FAQ; pnpm test",
    preventsRecurrence:
      "Any near-winner page must be grepped for its top query cluster's core noun before the change is planned. Zero occurrences of a word the page ranks for is a defect, not an accident.",
    measureAfter: "2026-12-05",
  },
  {
    date: "2026-11-26",
    title: "Tesla article gained the reviews and customer-service answers it ranked for",
    class: "content",
    changed: [
      "client/src/data/blog-articles-batch10.ts — added a 'What SolarCity and Tesla Solar Reviews Actually Show' section with a stat block, plus a 'How to Reach Tesla Solar Customer Service' section",
      "client/src/data/blog-articles-batch10.ts — retired two zero-demand FAQs and added the reviews and contact FAQs at the front of the array, because BlogPost.tsx renders only the first five",
    ],
    evidence:
      "Search Console (1 Sep–22 Nov 2026): the page earns 8 impressions at position 17.0 for 'solarcity reviews' and 5 impressions at position 19.6 for 'solarcity customer service', but a read of the full article on 26 Nov 2026 found no reviews section and no support contact anywhere in it. Verified the same day from primary sources: Tesla's own Customer Support page states solar and Powerwall support is (877) 798-3752, option 4 then option 2, and the BBB profile for Tesla Energy carries an F rating with 21 complaints in the three-year window, all 21 recorded as failure to respond.",
    reasoning:
      "The article was all process — agreement types, transfer paths, UCC-1 filings — and answered neither of the two questions its own impressions were asking. Both queries are question-shaped, so both want a direct answer near a heading rather than an implication spread across a process guide. The FAQ cap forced a choice: BlogPost.tsx slices to MAX_FAQ_ITEMS = 5 positionally, so adding two FAQs to an existing five would have shipped them invisible — the exact 'I added an FAQ and nothing changed' failure. The two retired questions had 1 and 0 matching impressions. The BBB figures are stated as a rating letter, a complaint count and a non-response count, and no star rating is claimed, because BBB publishes none on that profile; overstating a review score would have been the same class of error as the wrong statute citations.",
    confidence: "verified",
    verifiedBy:
      "pnpm check clean; pnpm test; node scripts/show-url-queries.py solarcity confirms the query set; pnpm build and grep of the built Tesla page for the new headings",
    preventsRecurrence:
      "Before adding an FAQ to any article, count the existing entries first. BlogPost.tsx renders only the first five positionally, so a new FAQ appended to a full array is invisible and marks up nothing. The near-winners query dump is the check that proves demand exists for the FAQ being added.",
    measureAfter: "2026-12-05",
  },
  {
    date: "2026-11-26",
    title: "ADT page was an orphan holding 1,828 impressions; two pages now link to it",
    class: "SEO",
    changed: [
      "client/src/data/blog-articles-batch6.ts — added a contextual in-body link to /blog/adt-solar-complaints after the Sunrun California complaints section",
      "client/src/data/blog-articles-batch10.ts — added a contextual in-body link to /blog/adt-solar-complaints after the Vivint/Sunrun merger section",
      "scripts/fix-adt-link-placement.mjs and scripts/fix-adt-link-placement-vivint.mjs — corrected the first placement, which had landed the sentence before its own antecedent",
    ],
    evidence:
      "Search Console (1 Sep–22 Nov 2026): /blog/adt-solar-complaints holds 1,828 impressions across 34 queries and only 4 clicks — 'adt solar reviews' alone is 856 impressions at position 12.5 with zero clicks. A repo-wide grep for the slug on 26 Nov 2026 returned exactly one hit: its own definition. No other page linked to it.",
    reasoning:
      "A page at position 10-12 with a 0.2% CTR is not losing on relevance — it is losing on authority, and an internal orphan has no link equity flowing into it at all. relatedSlugs could not fix this: BlogPost.tsx calls getRelatedPosts(slug, 3), so any slug listed fourth or later is never rendered, which means the link had to live in body copy to be a real contextual link. The anchors were chosen where the reader has just learned their counterparty changed hands or vanished, which is the moment a comparison to another company's exit is genuinely useful rather than link-building. The first attempt appended after the first content element, producing a sentence that referred to 'these failures' before any failure was described; that is a spam signal to a reader and gives a crawler no topical context for the anchor, so both were repositioned and re-verified by reading the surrounding paragraphs.",
    confidence: "measured",
    verifiedBy:
      "grep -c '/blog/adt-solar-complaints' returned 1 in each of the two source files, with the surrounding paragraphs read back to confirm the antecedent precedes the reference",
    preventsRecurrence:
      "Any page in the near-winners report with meaningful impressions must be checked for inbound internal links, not just for title and content match. An orphan page cannot rank on authority no matter how well its copy matches the query.",
    measureAfter: "2026-12-05",
  },
  {
    date: "2026-11-26",
    title: "Sunlight Financial page answered 'is it legit' only in the negative",
    class: "SEO",
    changed: [
      "client/src/data/blog-articles-batch8.ts — added a direct yes/no callout and a supporting paragraph as the first two elements of the Sunlight Financial article",
    ],
    evidence:
      "Search Console (1 Sep–22 Nov 2026): the page earns 47 impressions at average position 12.3 for 'is sunlight financial legit', 76 impressions at 16.4 for 'sunlight financial reviews', and 69 impressions at 12.1 for 'sunlight financial complaints' — 192 impressions across those three queries and zero clicks. Before this change the article opened with 'For many homeowners, the promise of clean energy and lower utility bills has turned into a financial nightmare', so neither the page nor any extractable snippet contained a direct answer.",
    reasoning:
      "'Is X legit' is a yes/no query and is answered by a short declarative sentence, not by atmosphere. The page already knew the answer — Sunlight Financial filed a prepackaged Chapter 11 on 30 October 2023 and emerged on 6 December 2023 under new ownership, and it still services loans — but that fact was buried mid-article. Stating it first is the only change that can win the snippet, because the competing pages answer the question in their first line. The wording deliberately separates 'is it a scam' (no) from 'should you trust it blindly' (also no), which is the honest position and matches the corrected company status recorded the same day.",
    confidence: "measured",
    verifiedBy:
      "pnpm check clean; the inserted callout is the first element of the content array, confirmed by reading the built page for the 'Short answer' string",
    preventsRecurrence:
      "For any page whose top query is a yes/no or 'is X legit' question, the first 100 words must contain a direct answer. A page can rank for a question it never answers; that is how 192 impressions produced zero clicks.",
    measureAfter: "2026-12-05",
  },
  {
    date: "2026-11-26",
    title: "Rescission page title spent its last characters on a brand the query does not contain",
    class: "SEO",
    changed: [
      "client/src/data/blog-extra.ts — rewrote the meta title from 'Solar Contract Rescission Rights: 3-Day Rule Checklist' to 'Solar Contract Rescission Rights: 3-Day Rule & TILA'",
      "client/src/data/blog-extra.ts — shortened the meta description from 165 to 141 characters so it stops being truncated mid-sentence",
    ],
    evidence:
      "The served title measured exactly 70 characters on 26 Nov 2026 — 'Solar Contract Rescission Rights: 3-Day Rule Checklist | Solar Freedom' — which is the hard limit enforced by fitMetaTitle() in scripts/prerender.assembled.mjs, so the visible portion was being cut around character 60 and the tail was a brand the query does not contain. The same page earns 287 impressions across 53 queries and zero clicks, including 25 impressions at position 12.7 for 'tila rescission solar loan'. The word TILA appeared nowhere in the title; 'Checklist' occupied the slot instead.",
    reasoning:
      "Replacing 'Checklist' with 'TILA' keeps the total at 67 characters, so the entire promise now survives truncation, and it covers all three top queries at once: rescission and rescind by morphological match, the 3-day rule, and TILA. This was a genuine trade rather than an addition — the title had no free space, so a word with no measured demand had to leave for a word with 25 impressions behind it. The description was independently over the roughly 160-character display budget and was being cut mid-sentence, which wastes the one line that decides the click.",
    confidence: "measured",
    verifiedBy:
      "python3 scripts/inspect-rescission-meta.py reports metaTitle at 51 chars (67 with brand) and metaDescription at 141 chars; pnpm build confirms the served title in dist/public/blog/solar-contract-rescission-rights/index.html",
    preventsRecurrence:
      "A title at the 70-character limit is a defect even though it passes fitMetaTitle, because Google truncates near 60. Any near-winner page whose title is at or near the limit must be checked for words that consume space without appearing in the query set.",
    measureAfter: "2026-12-05",
  },
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
  {
    date: "2026-11-26",
    title: "Solar-companies hub ranked 18.1 with zero clicks and a title matching none of its queries",
    class: "SEO",
    changed: [
      "scripts/prerender.assembled.mjs — retitled /solar-companies from 'Solar Company Complaints & Cancellation Guide' to 'Worst Solar Companies & Complaints List (2026)' and rewrote the description to 156 characters",
      "scripts/prerender.assembled.mjs — replaced the opening shell section, which began by telling the reader company research lives elsewhere, with a sourced list of nine company failures and status changes plus a five-step guide to checking any company independently",
    ],
    evidence:
      "Search Console (1 Sep-22 Nov 2026): the page earned 82 impressions across 20 queries at average position 18.1 with zero clicks. The dominant query was 'worst solar companies' at 45 impressions and position 25.4, followed by 'cancel my solar reviews' at 9 and 'solar company complaints' at 4. The published title contained none of those phrases, and the served body opened with a paragraph explaining that company research lives on the blogs instead of on hub URLs.",
    reasoning:
      "The page was answering a question nobody asked. Its body began by disclaiming its own usefulness, which gives a reader arriving from 'worst solar companies' no reason to stay, consistent with zero clicks from 82 impressions. The fix is not to invent a ranking of worst companies, which would be an unverifiable opinion, but to answer the checkable version of the question: which companies have ceased operations or changed hands, and on what date. Every entry in the new list is a matter of public record with a dated event, drawn from the same sources verified for the company status audit on the same day. The five-step checking guide gives the reader something to do rather than something to believe.",
    confidence: "measured",
    verifiedBy:
      "pnpm build pre-rendered 583 pages; the built page title reads 'Worst Solar Companies & Complaints List (2026)', the description is 156 characters, and the shell contains all nine company entries plus the checking guide",
    preventsRecurrence:
      "Standing rule for hub pages: a hub that ranks for a query must answer that query in its title and in its first paragraph. The specific check is to pull the top three queries by impressions for the page and confirm each phrase appears in the built HTML, which is now done as part of the near-winners review rather than assumed from the page's topic.",
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
