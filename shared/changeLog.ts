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
