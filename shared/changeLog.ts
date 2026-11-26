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
    title: "Four URLs were 301-redirects and indexable pages at the same time",
    class: "defect",
    changed: [
      "scripts/prerender.assembled.mjs — added isRedirectedPath() and made the blog noindex decision respect shared/seo-redirects.json, so a path the server 301s can no longer be emitted as an indexable page",
      "server/redirectConsistency.test.ts — new, 5 tests asserting no built redirect source carries an index directive, none is both indexable and self-canonical, and no redirect points at another redirect source",
    ],
    evidence:
      "Comparing shared/index-eligibility.json against shared/seo-redirects.json found four slugs declared indexable that the app also serves as 301s. Confirmed by direct request on 26 Nov 2026 — all four returned HTTP 301: /blog/solar-escalator-clause-what-it-is-how-to-fight to the -explained-how-to-fight-it variant, /blog/cancel-solar-contract-denver-co-2026 to /cancel-solar-contract/denver-co, /blog/cancel-solar-contract-rescission-rights to /blog/solar-contract-rescission-rights, and /blog/goodleap-solar-loan-hidden-dealer-fees-2026 to /blog/goodleap-solar-loan-cancellation-hidden-fees-2026. The built copies of all four said 'index, follow' and pointed their canonical at themselves. The sitemap generator already excluded all four, so the site was publishing three mutually contradictory signals for the same URL. The escalator pair is the clearest case: 80 impressions at average position 6.95 with ZERO clicks on the source URL that redirects, while the indexed destination holds the content.",
    reasoning:
      "The contradiction surfaced while investigating why the escalator source had 80 impressions at position 6.95 and no clicks: two near-identical articles existed, both flagged index, both in INDEXED_BLOG_SLUGS, but only one in the sitemap. The cause is that two independent lists decide the same question — index-eligibility.json decides what the build marks indexable, and seo-redirects.json decides what the server redirects — and nothing forced them to agree. The sitemap generator consulted both, which is why it was correct while the HTML was not. The fix makes the build consult both, so the redirect wins. The alternative of deleting the four entries from index-eligibility.json was rejected because that list also governs whether the page is retained at all, and removing a slug from it would have dropped the page from the build rather than simply de-indexing it. What would have falsified the diagnosis: a request to one of the four returning HTTP 200. All four returned 301.",
    confidence: "measured",
    verifiedBy:
      "curl against all four live URLs on 26 Nov 2026 returned 301 with the expected Location; pnpm build pre-rendered 583 pages; the four slugs now ship noindex while their four canonical destinations ship index; sitemap still carries 41 blog articles and excludes all four sources; npx vitest run server/redirectConsistency.test.ts — 5 tests pass; pnpm test — 84 files, 820 tests pass, 3 skipped; node scripts/trust-governance-audit.mjs passed",
    preventsRecurrence:
      "server/redirectConsistency.test.ts fails the build if any path in shared/seo-redirects.json is also emitted with an index directive, if any redirect source is both indexable and self-canonical, or if a redirect points at another redirect source. Two lists deciding the same question must be checked against each other, not maintained by memory.",
    measureAfter: "2026-12-05",
  },
  {
    date: "2026-11-26",
    title: "The site's biggest page-2 opportunity ranked on 'get out' while its snippet said 'cancel'",
    class: "SEO",
    changed: [
      "client/src/data/blog.ts — /blog/how-to-get-out-of-a-solar-contract: metaTitle now leads with 'How to Get Out of a Solar Contract: Loan, Lease or PPA' instead of 'How to Cancel a Solar Contract: Before or After Install (2026)'; metaDescription now names 'get out', 'loan' and 'lease' instead of 'cancel' alone",
      "client/src/data/blog.ts — added a section answering the lease variant, the loan variant and the PPA variant separately in the searcher's own words, and routing to the state solar-contract law guides for the statutory windows. It states no outcome and promises nothing",
      "scripts/fix-1126-get-out-vocabulary.py — idempotent, scoped to the one article slice",
    ],
    evidence:
      "Search Console (1 Sep–22 Nov 2026) for /blog/how-to-get-out-of-a-solar-contract: 1,255 impressions at average position 45.3 with 1 click — the largest single impression mass below position 20 on the site. Every one of its top queries uses 'get out' or 'get rid' phrasing and NOT ONE contains the word 'cancel': 'how to get out of a solar contract' 31 impr at 42.7, 'how to get out of a solar loan' 31 at 26.7, 'how to get out of solar lease' 40 at 47.0, 'get out of solar lease' 35 at 46.9, 'how do i get out of my solar lease' 26 at 58.9, 'how to get out of a solar lease' 26 at 48.4, 'how can i get out of my solar panel contract' 22 at 62.4, 'get out of solar contract' 21 at 45.0, 'how to get out of a solar panel lease' 21 at 51.9. The page slug, its H1 and its `title` field all said 'Get Out'; only the metaTitle Google displays said 'Cancel'. Measured on the built page before the fix: 1,248 words containing 'lease' 4 times and 'loan' 3 times, with no place answering either variant directly; and 49 of its 51 inbound internal links used the raw title as anchor text, an over-optimized pattern containing none of the query phrases. The two pages that do target lease phrasing, /blog/how-to-get-out-of-solar-lease-2026 and /blog/how-to-get-out-of-solar-lease-2026-complete-guide, are both noindex, so the indexed page has to carry that vocabulary itself.",
    reasoning:
      "The near-winners report ranked this page fourth by CTR gap, but its position 45.3 rules out snippet tuning alone as a fix — a snippet change cannot move a page 40 places. Splitting its query list by vocabulary showed the split is not positional: the lease variants average about position 48 and the loan variants about position 27, so the page is being matched on topic rather than on any single term, which is what a page whose visible title says 'cancel' while its slug says 'get out' looks like to a search engine. The correction is therefore to stop contradicting itself: lead the snippet with the phrase the searcher typed, and give the page a place that actually answers the lease and loan variants instead of mentioning them in passing. The two lease-specific pages being noindex was the deciding factor — had either been indexable, changing this page's title to target lease phrasing would have created a new cannibalization problem rather than fixing one. What would have falsified the diagnosis: any top query containing 'cancel'. There are none. The title was kept to 70 characters because that is the hard limit the build's fitter enforces; the meaningful 55 characters complete before Google's near-60 truncation, so the brand suffix is what gets dropped and the promise survives.",
    confidence: "measured",
    verifiedBy:
      "pnpm check clean; pnpm build pre-rendered 583 pages; built page now serves a 70-character title leading with 'How to Get Out of a Solar Contract', a 134-character description naming loan and lease, and 1,490 served words with the new 'Getting out of a solar lease, a solar loan, or a PPA' heading present; pnpm test 83 files, 815 tests pass, 3 skipped; node scripts/trust-governance-audit.mjs passed",
    preventsRecurrence:
      "Before tuning a snippet, check the page's own top queries for vocabulary the snippet does not contain. A page whose slug, H1 and visible title agree but whose metaTitle disagrees is contradicting itself in exactly the field the searcher reads first. Also check whether the pages that already target a variant are indexable before redirecting a title at that variant, or the fix creates cannibalization instead of removing it.",
    measureAfter: "2026-12-05",
  },
  {
    date: "2026-11-26",
    title: "74 pages shipped Google a snippet that stopped mid-phrase",
    class: "defect",
    changed: [
      "scripts/prerender.assembled.mjs — replaced the ellipsis-appending slicers in fitMetaTitle and fitMetaDescription with fitSnippet, which cuts only on a sentence end, a strong clause mark, a coordinating conjunction or a whole word, and drops a trailing function word so nothing dangles",
      "scripts/fix-1126-baked-ellipsis-descriptions.py — repaired 20 article records whose metaDescription already contained a literal '...' baked into the source string while the same record held a complete excerpt; the build-time fitter could not repair these because the ellipsis arrived as content",
      "client/src/data/blog-articles-batch6.ts — Colorado metaTitle read 'How to Cancel & Protect Your', missing the word 'self', so the served title ended mid-word",
      "client/src/data/blog-articles-batch11.ts — the lease-vs-loan metaTitle was cut by the 70-character fitter to '(And Why', leaving an open parenthetical; the trailing clause was dropped so the phrase completes",
      "server/metaSnippet.test.ts — new, 10 tests locking in both halves of the defect",
    ],
    evidence:
      "Measured on dist/public on 26 Nov 2026 across all 583 built pages: 37 titles and 56 descriptions ended in a literal ellipsis, 19 pages had both, so 74 pages — 12.7% of the site — showed a mid-phrase cut-off. Examples from the built output: 'Titan Solar Power Complaints: How to Get Out of Your Contract...', 'Solar Escalator Clause Explained — How to Fight Annual Payment...', 'Sunnova Filed for Bankruptcy: What Happens to Your Solar Contract?...'. The page /blog/solar-escalator-clause-what-it-is-how-to-fight held 80 impressions at average position 6.95 with ZERO clicks and its title was one of the truncated 37. A separate grep of client/src/data found 20 metaDescription values with a '...' baked into the source string, e.g. '...keep your system runnin...'.",
    reasoning:
      "The defect was found by scanning the built output for titles and descriptions whose final characters are an ellipsis, which is a shape a correct snippet should never have. Tracing those strings back to source showed two independent causes: the build-time fitter appended '...' after slicing mid-phrase, and 20 records had been truncated by hand and saved that way. The build-time cause is the larger one and is the reason the defect was invisible in review — the source data looked fine and the damage happened during generation. The hand-edited cause was provable rather than a guess because every affected record carries a complete `excerpt` field holding the full sentence the description was cut from. Fixing only the fitter would have left the 20 baked-in ellipses shipping, and fixing only the data would have let the fitter re-break every future long title, so both were fixed and both are now tested. The cut-boundary rules were chosen so a shortened snippet still reads as a finished thought; the half-the-limit floor exists so a snippet is never reduced to a stub. What would have falsified the diagnosis: a title or description ending in an ellipsis that was not produced by these two code paths. A scan for that found none — after the fix the count is zero.",
    confidence: "measured",
    verifiedBy:
      "python3 scan of all 583 built pages for a trailing ellipsis: 37 titles and 56 descriptions before, 0 and 0 after; pnpm build pre-rendered 583 pages; npx vitest run server/metaSnippet.test.ts — 10 tests pass; pnpm test — 83 files, 815 tests pass, 3 skipped; node scripts/trust-governance-audit.mjs — passed",
    preventsRecurrence:
      "server/metaSnippet.test.ts fails the build if any built page ships a title or description ending in an ellipsis, if either meta fitter reintroduces a slicing pattern, or if any article source record carries a '...' inside metaTitle or metaDescription. A snippet is a finished sentence, not a place to show that text was cut.",
    measureAfter: "2026-12-05",
  },
  {
    date: "2026-11-26",
    title: "ADT: four defects, including a shutdown year that contradicted our own article",
    class: "accuracy",
    changed: [
      "client/src/data/companies.ts — corrected the shutdown date from June 2023 to the announced exit of 24 January 2024 with operations substantially ceased by 30 June 2024, in both the summary and the timeline entry; corrected the loss figure from 'over $200 million' to the $89 million Adjusted EBITDA loss over the first nine months of 2023",
      "client/src/data/companies.ts — corrected bbRating from C+ to Not Rated (out of business) and complaintCount from 700+ to 404 (BBB, last 3 years, read 25 Nov 2026), so the company record now matches the BBB profile and our own article",
      "client/src/data/companies.ts — tagline changed from 'Shut Down in 2023 — Your Warranty Is Gone' to 'Exited Solar in 2024 — Your Warranty Is Uncertain', because the exit announcement described a business exit, not a voiding of warranties",
      "client/src/data/blog-articles-batch6.ts — added an 'ADT Solar customer service: what still works' section, since the built page contained zero occurrences of 'customer service' and zero phone numbers while holding 227 impressions on customer-service queries",
      "client/src/data/blog-articles-batch6.ts — added an 'ADT Solar lawsuits and complaints: what is actually documented' section, since the built page contained zero occurrences of 'lawsuit' while holding 123 impressions on lawsuit queries",
      "client/src/data/blog-articles-batch6.ts — replaced the 132-character description, which named none of review, complaint, customer service or out of business, with a 152-character description naming them",
    ],
    evidence:
      "Search Console (1 Sep–22 Nov 2026): /blog/adt-solar-complaints holds 2,972 impressions at average position 11.0 with 19 clicks, a 0.64% CTR, the third-largest impression mass on the site. Its clusters are 873 impressions on reviews ('adt solar reviews' 856 at position 12.5), 227 on customer service ('adt solar customer service' 223 at 10.9), 123 on lawsuits ('adt solar lawsuit update' 47 at position 6.6) and 99 on out-of-business queries. The built page contained zero occurrences of 'customer service', zero phone numbers and zero occurrences of 'lawsuit'. Separately, companies.ts said ADT 'shut down entirely in June 2023' and listed a timeline entry 'ADT Inc. shut down solar division in June 2023', while the ADT article on the same site says January 2024 — the site contradicted itself. ADT's own newsroom release, read 26 Nov 2026 and dated 24 January 2024, is headlined 'ADT exits the residential solar business' and gives the solar segment's loss as an $89 million Adjusted EBITDA loss over the first nine months of 2023.",
    reasoning:
      "The date defect was found by auditing the company record against the article rather than by reading either alone, which is the same cross-check that caught Freedom Forever contradicting itself. A wrong date is not cosmetic in this niche: it changes which warranty regime and which exit-charge period a reader thinks applies. The C+ rating and the 700+ complaint count were worse than merely unverified, because the BBB profile publishes no rating at all for an out-of-business company and our own article had already recorded 404 complaints read on 25 November 2026, so the company page and the article were publishing different numbers for the same fact. The two content sections address the fourth instance of the query-not-answered class, which is now recorded four times. The lawsuit section is deliberately written to report only what public records support and to say plainly that several dockets show voluntary dismissal or individual claims rather than a certified class, because implying a pending class action would be exactly the kind of unsupported first-party claim the editorial policy forbids. What would have falsified the date conclusion: an ADT filing or release announcing a 2023 exit. The only ADT release on the subject is dated 24 January 2024 and is titled as an exit announcement.",
    confidence: "verified",
    verifiedBy:
      "ADT newsroom release read 26 Nov 2026 at newsroom.adt.com/corporate-news/adt-provides-solar-business-update-and-advances-capital-allocation-strategy; pnpm check clean; server/companyStatus.test.ts 24 tests pass; pnpm build pre-rendered 583 pages; grep of the built ADT page for the new headings, the customer-service section and the 152-character description",
    preventsRecurrence:
      "Any company record must be read against that company's own article before either ships, because the two are edited independently and can state different dates or figures for the same fact. The standing rule that a page ranking top 3 for a query must be checked for whether it answers the question applies here: position 6.6 on 'adt solar lawsuit update' with zero occurrences of 'lawsuit' is the same defect as position 2 on 'sunnova bankruptcy' with zero occurrences of 'Chapter 11'.",
    measureAfter: "2026-12-05",
  },
  {
    date: "2026-11-26",
    title: "Sunrun description named none of the four clusters it loses clicks on",
    class: "SEO",
    changed: [
      "client/src/data/blog-articles-batch9.ts — replaced the Sunrun cancellation article's meta description, which named none of appointment, email, 'get out' or the exit fee, with a 155-character description that names all four and keeps a call to action",
    ],
    evidence:
      "Search Console (1 Sep–22 Nov 2026) for /blog/sunrun-solar-contract-cancellation-2026: 2,007 impressions in the query detail and 9,343 in the page-level row at average position 8.0 with 79 clicks, a 0.85% CTR against a site-wide 1.01% at the same position band. Clustered by theme, the zero-click mass is 332 impressions on appointment queries (85 on 'how to cancel sunrun appointment' at position 9.0, 71 on 'cancel sunrun appointment' at 9.9, 51 on the online variant at 9.2, 49 on 'sunrun cancel appointment'), 122 on email queries ('sunrun cancellation email' 121 at 8.8, 'cancellations@sunrun.com' 78 at 8.8), and 848 on 'get out' and 'cancel' phrasing including 235 on 'how to get out of sunrun contract' at 10.3. The served description read 'The cancellation window, what Sunrun charges to exit, transfer and buyout options when you sell, and how to put it in writing' and named none of those terms.",
    reasoning:
      "The body already answers every one of these clusters — the appointment section and the email answer were both added earlier the same day — so this was not a content gap. It was a snippet gap: the page ranks on body relevance while the description, which is all a searcher sees before deciding, answered nothing the searcher typed. This is the same class already recorded for Blue Raven and the rescission page, and the pattern is now clear enough to state as a rule: a near-winner page's top five query clusters must be checked against the DESCRIPTION, not only against the body. The appointment cluster is also the most commercially useful, because someone trying to stop an installer visit is the most time-pressured visitor the site gets, and most competing pages discuss only cancelling the contract, so naming it is a genuine differentiator rather than keyword stuffing. What would have falsified the diagnosis: if the description had already contained those terms, the gap would be a ranking or authority problem and no description change would help.",
    confidence: "measured",
    verifiedBy:
      "pnpm build pre-rendered 583 pages; the built Sunrun page's description reads 155 characters and contains 'appointment', 'email', 'get out' and 'fee'; scripts/fix-1126-sunrun-description.py is idempotent and prints a term-by-term confirmation",
    preventsRecurrence:
      "For every near-winner page, extract the top five query clusters by impressions and confirm each cluster's core noun appears in the meta description. Body relevance can rank a page while the snippet still answers nothing, which caps CTR regardless of position.",
    measureAfter: "2026-12-05",
  },
  {
    date: "2026-11-26",
    title: "Blog hub was outranking the guides that answer its queries on 1,248 impressions",
    class: "SEO",
    changed: [
      "scripts/prerender.assembled.mjs — added a 'Which guide answers which question' routing table to the /blog served content, naming eight question clusters and linking each to the guide that answers it with the query words in the anchor text",
      "Verified every anchor before shipping: two slugs in the first draft did not resolve to an indexable page, so they were replaced rather than shipped broken",
    ],
    evidence:
      "Search Console (1 Sep–22 Nov 2026): /blog holds 2,571 impressions across 149 queries and earned 2 clicks. 119 of those 149 queries are also ranked by a dedicated article, and those 119 carry 2,356 of the 2,571 impressions. On 61 of them — 1,248 impressions — the HUB outranks the best article: 'can you cancel solar panel contract before installation' hub position 15.1 on 154 impressions against /blog/how-to-get-out-of-a-solar-contract at position 36.8; 'how to cancel solar contract' hub 18.3 on 91 against the article at 55.4; 'cancel solar contract before installation' hub 16.8 on 83 against 52.8; 'how to cancel sunrun contract before installation' hub 17.8 on 68 against /blog/sunrun-solar-contract-cancellation-2026 at 10.4 on 133. The hub's served content was 879 words of index prose — how to use the guides, what records to gather, editorial limits — containing no cancellation procedure, no notice window and no company contact. Its CTR at position 11 to 20 is 0.08% on 1,182 impressions.",
    reasoning:
      "A hub cannot answer a procedure question. Where the hub wins one of these queries the searcher lands on a directory and has to search a second time, which is the worst outcome for a distressed visitor and is exactly what a 0.08% CTR looks like. The hub was competing with its own library rather than organising it. The fix routes rather than duplicates: naming the question clusters and pointing each at the answering guide gives the crawler an unambiguous statement that this page is a directory whose job is to route, and passes descriptive internal links — with the query words themselves in the anchor — to the articles that should own those queries. The impression figure beside each question is the measured count from the same window, so the table is a prioritised reading list rather than decoration. What would have falsified the diagnosis: if the hub's impressions sat on queries no article ranked for, the hub would be adding reach rather than absorbing it. 2,356 of 2,571 do overlap, so it is absorbing.",
    confidence: "measured",
    verifiedBy:
      "python3 -c on near-winners.json comparing the hub query set against every article query set; node scripts/find-orphan-pages.mjs; every href in the routing table checked against dist/public for existence and robots; pnpm build pre-rendered 583 pages",
    preventsRecurrence:
      "Any index or hub page must be checked for query overlap with the pages it links to before its content is expanded. An index page that ranks for procedure questions is a cannibalization defect, not a ranking win. The overlap check is one comparison of the hub query set against the article query sets and should be run whenever a hub gains content.",
    measureAfter: "2026-12-05",
  },
  {
    date: "2026-11-26",
    title: "GoodLeap: answers the payment and payoff questions it already ranked for",
    class: "content",
    changed: [
      "client/src/data/blog-articles-batch9.ts — added a 'How to make a payment or get a payoff quote' section naming 1-800-345-9372 and customerservice@goodleapsupport.com inline, plus the separate application line 1-844-562-6725 and what a payoff quote is actually good for",
      "client/src/data/blog-articles-batch9.ts — rewrote the meta description to 152 characters so it names the support number and the payoff quote",
      "client/src/data/blog-articles-batch9.ts — added a payment/payoff FAQ at the front of the array, since BlogPost.tsx renders only the first five positionally",
    ],
    evidence:
      "Search Console (1 Sep–22 Nov 2026): the page holds 10,365 impressions at average position 7.5 with 92 clicks, a 0.89% CTR. That is the largest impression mass on the site and its largest CTR gap — site-wide CTR at position 7 to 11 is 1.01%, so the page converts below the site's own average while sitting at the best position of any page above 1,000 impressions. 128 impressions sit on literal phone-number queries at zero clicks: '800-345-9372' 72 impressions at position 9.6, '8003459372' 34 at 9.4, '1-800-345-9372' 22 at 9.5. Another 57 sit on 'goodleap payoff request' at 15.4 and 37 on 'goodleap solar payments' at 26.5, also zero clicks. A grep of the built page on 26 Nov 2026 returned zero occurrences of 'payment portal', 'make a payment' or 'payoff request', and exactly one occurrence of the phone number, inside a styled stat-block. 153 of the page's 157 queries earn zero clicks, carrying 1,082 impressions, 71% of its total.",
    reasoning:
      "This is the fourth instance of a class already named in this log, after Freedom Forever, Tesla and Sunnova: a page ranking for a question it never answers. The page was not losing on relevance — position 7.5 on 10,365 impressions is the strongest combination on the site — so title and body match were already doing their job. What was missing was the answer. Phone-number and payoff-request queries are the most transactional kind a distressed borrower types, and the page had no payment path at all, so it was matched on surrounding context and the snippet answered nothing. The description was rewritten rather than only the body because the snippet is the only thing a searcher sees before deciding; naming the number there is what turns a position-7 impression into a click. What would have falsified the diagnosis: if site-wide CTR at the same position band were below 0.89%, the page would be performing normally and the gap would be a site-wide snippet problem rather than a page defect. It is 1.01%, so the page is below its own peer group.",
    confidence: "measured",
    verifiedBy:
      "Built page before the fix: 1 occurrence of 345-9372, 0 of pay-goodleap, 0 of 'customer service', 0 of 'make a payment' (grep on dist/public/blog/goodleap-solar-loan-cancellation-hidden-fees-2026/index.html, 26 Nov 2026). GoodLeap contact page read 26 Nov 2026 for 1-800-345-9372 account support, 1-844-562-6725 application support, customerservice@goodleapsupport.com, consumercomplaints@goodleap.com, Maria Mellott VP and Deputy Chief Compliance Officer at 916-475-1255, NMLS #30336, formerly Loanpal. After the fix the block contains 4 occurrences of 1-800-345-9372, exactly 1 stat-block, and 0 forward references to a number the reader has not yet seen.",
    preventsRecurrence:
      "Before planning any change to a near-winner page, grep the built HTML for the core noun of each of its top five query clusters, not just the title. A phone-number query needs the number in the description; a payoff query needs the phrase 'payoff' in a heading. Zero occurrences of a term the page ranks for is a defect, not an accident.",
    measureAfter: "2026-12-05",
  },
  {
    date: "2026-11-26",
    title: "Sunnova page ranked position 2 for a bankruptcy question it never answered",
    class: "content",
    changed: [
      "client/src/data/blog-articles-batch9.ts — added a 'Do you still have to pay Sunnova after the bankruptcy?' section covering the Chapter 11, the sale, the liquidating plan, SunStrong servicing and the in-progress installation route",
      "client/src/data/blog-articles-batch9.ts — added the payment question as the first FAQ, since BlogPost.tsx renders only the first five",
    ],
    evidence:
      "Search Console (1 Sep–22 Nov 2026): /blog/how-to-cancel-sunnova-solar-contract-2026 ranks position 2.0 for 'sunnova bankruptcy' (3 impressions) and position 2.0 for 'sunnova bankruptcy do i have to pay' (2 impressions), plus position 3.0 for 'sunstrong management' (2 impressions) — all at zero clicks. A grep of the built page on 26 Nov 2026 returned ZERO occurrences of 'Chapter 11' and ZERO of 'SunStrong', with one incidental mention of 'bankrupt'. This is the same defect found on the Freedom Forever article, where the site ranked for a bankruptcy question while its own copy described the bankruptcy as hypothetical.",
    reasoning:
      "Ranking position 2 for a question the page never answers is the strongest possible signal that the query is being matched on surrounding context alone, and it is the highest-leverage fix available on this page because the surrounding context is already good. It is also the most commercially important unanswered question here: 'do I still have to pay' is what a Sunnova customer actually needs, and the honest answer protects them from the expensive mistake of stopping payments because of a headline. Every fact was verified on 26 Nov 2026 and recorded in docs/company-status-verified-2026-11-26.md — Chapter 11 filed 8 June 2025, sale closed September 2025, liquidating plan effective 14 November 2025, SunStrong Management servicing most in-service systems, Sunnova's own site stating it has ceased independent operations, and payment terms unchanged with customers told to continue paying. The section answers the payment question in its first sentence because that is the query, does not promise an outcome, and repeats the standing warning not to stop payments.",
    confidence: "verified",
    verifiedBy:
      "pnpm check clean; grep of the built Sunnova page confirms the new heading, the Chapter 11 and SunStrong mentions, and the FAQ in the FAQPage schema",
    preventsRecurrence:
      "Any page ranking in the top 3 for a query must be checked for whether the page actually answers it, not merely whether it mentions the topic. A top-3 ranking on an unanswered question is a content defect that no amount of title work can fix.",
    measureAfter: "2026-12-05",
  },
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

  {
    date: "2026-11-26",
    title: "Rescission page ranked for cancel, termination and the three-day window without naming any of them",
    class: "SEO",
    changed: [
      "client/src/data/blog-extra.ts: the /blog/solar-contract-rescission-rights metaTitle is now 'Cancel a Solar Contract: 3-Day Rescission & TILA' (48 chars, 64 rendered with the brand suffix) and the metaDescription now names cancel, rescind, terminate, three days, TILA, the FTC Cooling-Off Rule and before selling your house",
      "The page title changed from 'Solar Contract Rescission Rights: Check the 3-Day Rule' to 'Can You Cancel a Solar Contract in 3 Days? Rescission Rights & TILA'",
      "The opening paragraph now states the three business day window in words as well as numerals, because the page wrote only '3-day' and never 'three day' while the highest-volume query uses the spelled form",
      "New H2 section 'Cancelling a Solar Contract Before Selling Your House' answering the home-sale cluster and linking to /blog/sell-house-with-solar-panels",
      "FAQ order changed so the TILA question is third instead of sixth, because the client rendered only the first five and that question was therefore invisible despite carrying 25 impressions",
      "scripts/fix-1126-rescission-vocabulary.py added; idempotent, keyed on each block",
    ],
    evidence:
      "Search Console (1 Sep-22 Nov 2026): the page earned 287 impressions across 53 queries at average position 36.2 with ZERO clicks. Its top queries were 'three day right to cancel solar contract' 34 impressions at position 11.9, 'rescind solar contract' 33 at 13.5, 'tila rescission solar loan' 25 at 12.7, 'solar contract termination' 19 at 19.5, 'how to cancel solar contract' 17 at 49.1, 'solar contract cancellation' 15 at 34.5 and 'cancel solar contract before selling house' 13 at 19.6. The served meta description read 'Check whether the FTC Cooling-Off Rule or TILA covers your solar sale, how to rescind, the deadline, and how to preserve your delivery proof.' and contained the word 'cancel' zero times, 'termination' zero times, 'three day' zero times and 'before selling house' zero times, so roughly 150 impressions of demand were matched on body relevance while the snippet answered none of it. The built page wrote the window only as '3-day' and '3-business-day' and never as 'three day'.",
    reasoning:
      "Two separate fields were wrong and the earlier fix in this session had corrected only the first. That fix replaced 'Checklist' with 'TILA' in the title because 'tila rescission solar loan' carried 25 impressions, and it worked, but it left the description untouched. The description is what the searcher reads, and the audit that found this compares the top five query clusters by impressions against the description rather than against the page topic, which is how the mismatch became visible. 'Cancel' is the single largest vocabulary group on the page at over 150 impressions and the word appeared nowhere in the snippet. The body already answered the cancellation question, so this was a naming problem rather than a content hole. The one genuine content hole was the home-sale cluster, which had no answer on the page and no link to the page that does answer it, so that got a section rather than a keyword. The FAQ reorder is the same positional-cap defect found twice before on other pages and is fixed by moving demand into the visible five rather than by adding a sixth item that would never render. No new legal claim was introduced: the three business day window is the existing rule stated in both numeral and word form, and the home-sale section repeats the standing warning that a missed deadline removes the fastest option rather than saying a sale is impossible.",
    confidence: "measured",
    verifiedBy:
      "pnpm build pre-rendered 583 pages; the built page title is 64 rendered characters reading 'Cancel a Solar Contract: 3-Day Rescission & TILA | Solar Freedom', the description is 153 characters naming cancel, rescind, terminate, three days, TILA, Cooling-Off Rule and before selling your house, the served body now contains 'three day' twice where it had zero, 'before selling' twice where it had zero, and the TILA FAQ renders third in both the HTML and the FAQPage schema",
    preventsRecurrence:
      "scripts/audit-snippet-coverage.py now runs this check across every indexed page instead of one page at a time: for each page earning impressions it clusters the top queries by impressions and reports which clusters the served meta description does not name. Run after any content or meta change and after each GSC refresh. The FAQ positional cap is separately guarded by server/faqParity.test.ts.",
    measureAfter: "2026-12-05",
  },
  {
    date: "2026-11-26",
    title: "FAQ structured data described 38 questions the page never displayed",
    class: "defect",
    changed: [
      "shared/faq-policy.json created as the single source of truth for how many FAQ items a page may render and mark up (maxRenderedItems: 8), with the drift history recorded in the file",
      "client/src/pages/BlogPost.tsx: MAX_FAQ_ITEMS raised from 5 to the shared policy value and the literal removed so it cannot be hard-coded again",
      "scripts/prerender.assembled.mjs: the FAQ HTML emitter now slices to the shared cap, and the FAQPage JSON-LD slice changed from a hard-coded 10 to the shared cap",
      "server/faqParity.test.ts added, 8 tests, including a scan of the built output asserting no page marks up more questions than the cap",
    ],
    evidence:
      "Measured 26 Nov 2026 across all 583 built pages: 23 pages emitted more FAQ questions in the pre-rendered shell than the client rendered. The shell carried 153 Q&As on those pages and the client rendered 115, so 38 questions were described in FAQPage JSON-LD and served as visible HTML to crawlers that do not run JavaScript, but were invisible to any reader with JavaScript enabled. The worst cases carried 8 shell questions against 5 rendered. The cause is dated: git log shows commit 2b14b60 (18 Nov 2026, PR #58, 'Guide pages: chat on every page, one booking block, 5-question FAQ') introduced the client cap of 5 to stop long FAQ walls burying the call to action, and did not change the shell, which sliced at 10.",
    reasoning:
      "Google's structured-data policy requires FAQPage markup to describe content visible on the page. This was therefore a live violation rather than a style preference, and it was invisible to every check that looked at either side alone: the shell was internally consistent, the client was internally consistent, and only a comparison of the two exposed it. The fix direction was decided by asking which cap was correct rather than which was easier to change. Raising the client to 8 preserves the shell's crawler-visible content and restores parity, and it does not recreate the wall-of-text problem that motivated the cap of 5, because the section renders as collapsed <details> accordions where only the first is open. Lowering the shell to 5 was rejected because it would have deleted 38 questions from crawler-visible HTML that had been live and indexed for eight days, and because several of those questions answer demand measured in Search Console. The cap now lives in one shared JSON file that both sides read, so the two cannot drift apart again, and the test asserts the structural properties rather than the current number.",
    confidence: "measured",
    verifiedBy:
      "npx vitest run server/faqParity.test.ts: 8 tests passed. pnpm build pre-rendered 583 pages, and a scan of all 197 built pages carrying a FAQ section found 0 pages exceeding the cap and 0 with an HTML-versus-JSON-LD count mismatch, down from 23 pages and 38 hidden questions",
    preventsRecurrence:
      "shared/faq-policy.json is read by both the client and the pre-render shell, and server/faqParity.test.ts fails the build if either side hard-codes a number, if the shell's HTML or JSON-LD emitter stops slicing at the shared cap, if the cap drops below the largest faq array in client/src/data, or if any built page marks up more questions than the cap. The same class of defect had appeared three times before on individual pages as a positional FAQ cap, which is why this is now enforced structurally rather than per page.",
    measureAfter: "2026-12-05",
  },
  {
    date: "2026-11-26",
    title: "Five articles promised a resolution timeline and cited population statistics that no source supports",
    class: "accuracy",
    changed: [
      "client/src/data/blog-articles-batch9.ts, blog-articles-batch14.ts and blog.ts: the stat trio '3M+' U.S. homeowners with solar contracts, '68%' report higher-than-expected costs and '30-90 days to resolution with legal help' removed from five articles and replaced with figures each article can actually defend",
      "escalator-clause article stat block now reads 2.9-3.9% / $150 -> $328 / 20-25 yrs / Free, all of which are arithmetic the reader can check against their own contract",
      "attorney-general complaint article now reads CFPB / FTC / State AG / Free, naming the agencies that actually receive these complaints rather than a predicted outcome",
      "PPA transfer article now reads 20-25 yrs / 30-60 days / Buyout / Free; red-flags checklist now reads 15 / 2.9-3.9% / Notice / Free",
      "cancel-solar-contract-after-installation in client/src/data/blog.ts: the same '30-90 days to resolution with legal help' stat replaced with the notice requirement",
      "escalator article metaDescription rewritten to drop the 'Act now' urgency and the 'Secure your savings' guarantee, and its ctaSubtext corrected to match",
      "blog-articles-batch6.ts breakyoursolarcontract-how-it-works (noindex): metaDescription no longer promises 'in 30-90 days' and the excerpt no longer says 'in as little as 30 days'",
      "scripts/prerender.assembled.mjs: three new patterns added to unsupportedFirstPartyClaimPatterns covering outcome-plus-timeline promises and unsourced population statistics; a broader version was written, measured and deliberately rejected",
      "server/unsourcedClaims.test.ts added, 4 tests, including a build-output assertion that no indexable page ships 'Typical Resolution' or '30-90 days' and an assertion that the runtime filter stays narrow",
    ],
    evidence:
      "A site-wide grep on 26 Nov 2026 found the same stat trio in four articles and a fifth occurrence of the resolution-time stat in client/src/data/blog.ts, and no source anywhere in the repository. The only genuine '68%' in the repo is in docs/seo-baseline-2026-09-03.md describing an unrelated impression decrease. The '30-90 days to resolution with legal help' line is an outcome and timeline promise, not a statistic, and the trust filter missed it because the nearest pattern required the literal phrase 'Results in 30-90 days'. Measured across the built output: 7 pages shipped a resolution-time promise and all 7 were noindex; the indexed city pages las-vegas-nv, phoenix-az and houston-tx did not ship it. A sweep of the proposed broader '% of <group>' runtime pattern showed it would have suppressed 87 legitimate lines including approved published city-page statistics and correct explanations of the 30% federal tax credit.",
    reasoning:
      "Two separate harms. The resolution-time line is a prediction about an outcome we cannot control, which is both a trust problem with the reader and the kind of claim that damages credibility with an attorney. The population statistics are worse because they are unfalsifiable as written: no citation, no date, no sample. Rather than soften the numbers, each article was given figures it can defend from its own subject matter, so the stat block still does the job of a stat block, which is to make the page scannable. The broad runtime filter was rejected because runtime suppression DELETES content, and deleting 87 legitimate lines to catch a handful of bad ones is a worse trade than catching them at build time. The wide class is therefore guarded by a failing test rather than a runtime deletion.",
    confidence: "measured",
    verifiedBy:
      "npx vitest run server/unsourcedClaims.test.ts: 4 tests passed. A grep of client/src/data on 26 Nov 2026 returns 0 occurrences of '3M+', 'Report higher-than-expected costs', 'Days to resolution with legal help' and 'Homeowners report hidden fees' outside the test file and the 6 legacy city-content-depth files that are all noindex. pnpm check clean; npx vitest run: 86 files, 832 tests passed, 3 skipped.",
    preventsRecurrence:
      "server/unsourcedClaims.test.ts bans outcome-timeline promises and unsourced population statistics in article copy, asserts that the runtime trust filter still contains 'with legal help' and does NOT contain the rejected broad '% of <group>' pattern, and asserts that no indexable built page ships 'Typical Resolution' or '30-90 days'. The test carries an explicit ALLOWED list for 6 legacy city-content-depth files and LEGACY_NOINDEX_BLOGS for blog-articles-batch7.ts, each with a stated reason, so the exclusions are visible rather than silent.",
    measureAfter: "2026-12-05",
  },
  {
    date: "2026-11-26",
    title: "Six indexable pages promised a first-party result, and one called us a law firm",
    class: "accuracy",
    changed: [
      "client/src/data/blog-articles-batch5.ts: the Atlanta metaDescription dropped \"We've helped 50+ GA homeowners save thousands\" and the Boston metaDescription dropped \"Our firm helped 200+ homeowners cancel\"; both now name the statute and what decides a claim",
      "client/src/data/blog-articles-batch3.ts: the Bakersfield metaDescription dropped \"cancel your contract and save thousands\"",
      "client/src/data/blog-articles-batch4.ts: the payment-shock metaDescription dropped \"legal options to save thousands\"",
      "client/src/data/blog-articles-batch6.ts: the military-families metaDescription dropped \"save thousands\" and its \"Urgent help available!\" urgency, and a body sentence promising \"save you thousands of dollars\" was replaced with the notice-window reason to act now",
      "client/src/data/blog-articles-batch10.ts, batch6.ts, batch15.ts, batch19.ts: five descriptions shortened so they survive the 160-character fitter intact instead of being cut mid-phrase",
      "server/firstPartyClaims.test.ts added, 6 tests",
    ],
    evidence:
      "Found 26 Nov 2026 by scanning the BUILT output rather than the source, which is why it had survived every earlier content review. Four INDEXABLE pages carried a first-party result claim in their meta description and the Atlanta page carried it in body prose too: \"We've helped 50+ GA homeowners save thousands\" (Atlanta), \"Our firm helped 200+ homeowners cancel\" (Boston), \"save thousands\" (Bakersfield, payment shock), \"save thousands\" plus \"Urgent help available!\" (military families). No source for any figure exists anywhere in the repository. The Boston line is the worst of the six because it says \"Our firm\" on a site whose own /how-it-works page states in its first sentence \"Solar Freedom is not a law firm\", so the site contradicted itself on the two pages a skeptical reader is most likely to compare. The same scan found 35 pages whose description did not end in sentence punctuation, 5 of them indexable; the source strings were complete sentences that the 160-character fitSnippet limit cut at a word boundary, leaving snippets like \"...closing records\" with no object. Separately recorded: /blog/cancel-solar-contract-atlanta-ga ships robots=index in the built output while its slug is absent from INDEXED_BLOG_SLUGS in shared/index-eligibility.json, a discrepancy this test now pins in place rather than silently resolving.",
    reasoning:
      "Two different failure modes with the same cause, which is that both were checked in the source and never in the output. A first-party result claim is the single most damaging thing this site can publish, because it is checkable and it is false: an attorney or a sharp homeowner can ask for the fifty Georgia files, and there are none. It also directly contradicts the trust position the rest of the site is built on, which is that we promise no outcome. The truncation is the cheaper defect but it costs the same click: a description that stops mid-thought reads as unfinished and gives the searcher no reason to prefer it over the nine other results. Neither fix needed a new capability, only looking at what the site actually served. The replacements keep each snippet's job, which is to name the legal mechanism and the next step, and drop the promise.",
    confidence: "measured",
    verifiedBy:
      "npx vitest run server/firstPartyClaims.test.ts: 6 tests passed. The test fails the build if any article meta field matches a first-party claim pattern, if any INDEXABLE built page serves one, if any INDEXABLE page says \"our firm\" or \"our law firm\", if any indexable description does not end in sentence punctuation, or if the Atlanta index discrepancy changes in either direction without the record being updated. Grep of client/src/data on 26 Nov 2026 returns 0 occurrences of the four claim strings. pnpm check clean; npx vitest run: 87 files, 838 tests passed, 3 skipped; trust governance audit passed; pnpm build pre-rendered 583 pages.",
    preventsRecurrence:
      "server/firstPartyClaims.test.ts now scans the BUILT output for first-party claim patterns and for descriptions that do not end in a sentence, so the check runs against what Google actually receives rather than against the source. This is the second defect class found only by reading the built output, after the 74 pages of ellipsis-terminated snippets, which is why the standing practice is now to scan dist/public after every build rather than trusting the source.",
    measureAfter: "2026-12-05",
  },
  {
    date: "2026-11-26",
    title: "None of the fourteen zero-click near-winners was a real defect, and the noindex suppression was already working",
    class: "infrastructure",
    changed: [
      "scripts/ctr-significance.py added: computes expected clicks per page from the site's own CTR-by-position curve and reports a one-tailed Poisson probability, so a zero-click page is only treated as a defect when the shortfall cannot be explained by volume",
      "scripts/gsc-page-trend.mjs added: compares a page across two Search Console windows so a cached impression count can be separated from current demand before any index-status change is made",
      "No content or index-status change was made. This entry records two negative findings and the tooling that produced them.",
    ],
    evidence:
      "Two investigations on 26 Nov 2026, both of which ended in NOT making a change. (1) Eight near-winner URLs ship noindex yet appeared to be ranking, including four in the top ten: goodleap-solar-loan-problems at position 8.6 with 214 impressions, solar-contract-cancellation-cost at 7.7 with 94, solar-lien-on-house-removal-guide at 9.0 with 54, and solar-escalator-clause-what-it-is-how-to-fight at 8.7 with 57. Direct requests confirmed five of the eight serve HTTP 200 with a noindex directive and are absent from the sitemap, which is the strongest suppression signal the site can send. scripts/gsc-page-trend.mjs then compared the recent 14 days against the preceding 45: all five returned ZERO impressions in the recent window against 28, 38, 8 and 15 in the older one, and SunPower zero in both. The suppression is working exactly as designed and the cached impressions are historical. (2) Fourteen near-winner pages had zero clicks at positions 6.2 to 18.1, which reads as fourteen CTR defects in a flat table. scripts/ctr-significance.py computed expected clicks from the site's own CTR-by-position curve: expected values were 0.2 to 2.3 clicks, and the probability of observing zero purely by chance ranged from 0.10 to 0.84. ZERO of the fourteen was statistically real.",
    reasoning:
      "Both findings are the same mistake in different clothes, which is treating a table row as a diagnosis. The index-status case nearly produced a change that would have promoted five pages into the index on the strength of impressions that had already stopped arriving — the suppression was correct, the pages are thin (317 and 311 words for the two company hubs), and Dividend Finance has zero recent query demand site-wide while the lien topic is already covered by the indexable /solar-lien-removal page. The CTR case would have produced fourteen rewrites to chase roughly one expected click each, and worse, it would have taught the wrong lesson from random variation. The discipline this establishes: before treating a page as a defect, check whether its demand is current, and check whether its shortfall is larger than chance. The high-volume pages remain the real opportunities and those were already worked today — GoodLeap at 10,365 impressions, Sunrun at 9,343 and Blue Raven at 4,488 are 81 percent of the page-1 near-winner impression mass, and all three were fixed earlier in the same session.",
    confidence: "measured",
    verifiedBy:
      "node scripts/gsc-page-trend.mjs --recent 14 --older 45 on the five suppressed pages returned 0 impressions in every recent window. curl against all eight live URLs confirmed five HTTP 200 with noindex and three HTTP 301. python3 scripts/ctr-significance.py over the 45-item near-winners list reported 14 zero-click pages, 0 statistically real, 14 noise, with p(0) from 0.1003 to 0.8420.",
    preventsRecurrence:
      "scripts/ctr-significance.py is now the required first pass over any near-winners list: a zero-click page is not a defect unless p(0) is below 0.05, so low-volume pages can no longer consume a change. scripts/gsc-page-trend.mjs is now required before any index-status change, because the near-winners dataset spans 1 Sep to 22 Nov and an impression count inside it says nothing about whether the demand is still there. Both are read-only and both are cheap enough to run before every batch.",
    measureAfter: "2026-12-05",
  },
  {
    date: "2026-11-26",
    title:
      "Every city page now routes state-level questions to the state law page instead of competing with it",
    class: "SEO",
    changed: [
      "`scripts/prerender.assembled.mjs` gains `STATE_LAW_SLUG_BY_NAME` and `registerStateLawSlugs()`, populated from the state entries during `loadData()`, so the city renderer knows which state-law pages actually exist before it writes a link.",
      "`buildCityUniqueContent` now emits a real anchor in the state-law paragraph (\"the <State> solar contract law resource\") and adds a routing sentence: \"State-level rules, deadlines and citations for <State> are collected on the <State> solar contract law resource.\"",
      "`shared/priority-city-render.mjs` gains `getStateLawPath()` and the same routing sentence inside the `city-local-resources` section, which the 21 priority city guides render through a separate code path that had no state link at all.",
      "`client/src/components/PriorityCityGuide.tsx` renders the same sentence, importing `getStateLawPath` from the shared module rather than reimplementing the state map, so the shell and the hydrated page cannot drift apart.",
    ],
    evidence:
      "Measured 26 Nov 2026. Before the change, the state-law paragraph on every city page read \"review the dedicated <State> law resource\" with NO anchor, so the city page was competing for state-level queries instead of routing to the page that answers them. `/cancel-solar-contract/san-francisco-ca` earned 46 impressions in the recent 30-day window at average position 35.1 with ZERO clicks, while the California state page held its own state-level queries at position 10.4. The 21 priority city guides were worse: a JSON scan found ZERO references to `/solar-contract-laws/` anywhere in `shared/priority-city-content.json`, so Phoenix, Houston, Dallas, Los Angeles, San Diego and San Antonio — the six highest-value city pages — had no route to their own state page at all. The routing sentence also said \"for this location\" rather than naming the state, which tells a crawler nothing, so it now names it. After the change, measured on the 583-page build: 77 city pages carry a correct state-law link (71 templated plus the 6 highest-value priority guides), 0 mismatched, 0 broken targets, and 225 correctly omitted because their state has no published page; all 21 priority guides verified, 6 with the correct link and 15 correctly omitted.",
    reasoning:
      "The San Francisco numbers are the whole argument. A page at position 35.1 with zero clicks is not losing to better content, it is losing to a page on the same site that already answers the query at position 10.4, and Google has no way to know which one the searcher wants when the weaker page never points at the stronger one. The state-law page is the canonical answer for state-level rules; the city page's job is local relevance plus a route out. Leaving the sentence unlinked made the city page a competitor for a query it is not the best answer for, which splits the site's own authority and wastes the local page's impressions. The priority-city gap was the same defect in a second code path, which is why it survived the templated fix: the guides render through `shared/priority-city-render.mjs` rather than `buildCityUniqueContent`, so a fix in one place does nothing for the other. Both were fixed together and the state map is now a single shared export so a third renderer cannot reintroduce the divergence. Only published states are linked, because a link to an unbuilt or `noindex` state page is worse than no link: it spends crawl budget and passes authority to a page Google is being told to ignore.",
    confidence: "verified",
    verifiedBy:
      "python3 on the 583-page build confirmed 77 city pages with a correct state-law link and 225 correctly omitted, 0 linking an unpublished state, 0 where the anchor text disagreed with its target. node /tmp/verify-statelaw.mjs confirmed all 21 priority guides: 6 correct links, 15 correctly omitted, 0 problems, with the existing `city-local-resources` external source links, the `#city-form` CTA anchor and the `noopener noreferrer` attributes all still present. `pnpm check` clean and the production build pre-rendered 583 pages.",
    preventsRecurrence:
      "The state-law slug map now lives in exactly one place, `STATE_LAW_SLUG_BY_NAME` for the templated renderer and `getStateLawPath()` in `shared/priority-city-render.mjs` for the priority guides, and the client imports the shared helper instead of copying it. The recurring lesson is recorded here: this site renders city pages through TWO independent code paths, so any fix to city-page output must be checked against both.",
    measureAfter: "2026-12-05",
  },
  {
    date: "2026-11-26",
    title: "California SB 784 was described as enacted law while it sits in committee",
    class: "accuracy",
    changed: [
      "client/src/data/state-laws.ts — the California entry: the SB 784 H2 became 'Your Three-Day Right to Cancel, and How the Window Gets Extended'; the body now cites Civil Code 1689.6 and 1689.7(g) and carries an explicit pending-legislation caution; coolingOffNote no longer credits a bill with the senior window",
      "client/src/data/blog-articles-batch5.ts — the Sacramento article: title, metaTitle, metaDescription, excerpt, ctaSubtext, opening sentence, H3 and FAQ answer; also removed an unsourced 'Over 500 CA homeowners helped' and an 'Act now' urgency line from the metaDescription",
      "client/src/data/city-content-depth-batch-e.ts — 15 instances across Sacramento, San Francisco and San Jose",
      "server/billStatusClaims.test.ts — new guard, 12 tests",
      "scripts/fix-1126-sb784-not-law.py and scripts/fix-1126-sb784-batche-and-colorado.py — idempotent fixers",
    ],
    evidence: "Official bill status read 26 Nov 2026 at leginfo.legislature.ca.gov: SB-784 'Home improvement loans: right to cancel contracts.' is 'Active Bill - In Committee Process', last action 08/13/26 'August 13 hearing: Held in committee and under submission.' The site told readers it was 'Effective January 1, 2026', that it 'requires' a live Confirmation Call, and that it 'extends' the cancellation window. Separately, the 5-business-day senior window credited to SB 784 comes from Civ. Code 1689.6, where 1689.6(a)(4) applies the five-day right to contracts entered into on or after 1 January 2021 — not 2026, and not any bill. 1689.6 was amended by AB 1327 (Stats. 2025, Ch. 348, Sec. 3), effective 1 Jan 2026. The real extension mechanism is Civ. Code 1689.7(g): 'Until the seller has complied with this section the buyer may cancel.' 1689.7(a)(1) requires the cancellation statement at the signature space in at least 10-point boldface; 1689.7(c)(1) requires an easily detachable Notice of Cancellation in at least 10-point type.",
    reasoning: "A bill held in committee creates no rights, so the page was telling California homeowners they held statutory protections that do not exist — the single most damaging kind of error this site can publish, because the audience includes attorneys and the remedy described is the thing a homeowner would act on. The defect survived every earlier content review because the citation looks authoritative: a real bill number, a real subject, a plausible date. The fix replaces a promise with the mechanism that actually exists, 1689.7(g), which is stronger copy as well as accurate copy, because it gives the reader a testable question — did the seller comply with the notice requirements? — rather than a statute that may never pass.",
    confidence: "verified",
    verifiedBy: "grep on the built page confirms 'Three-Day Right to Cancel', '1689.7(g)', '10-point boldface', 'held in committee' and 'not an enacted law' are all present in dist/public/solar-contract-laws/california/index.html; the Sacramento page carries zero SB 784 mentions and no unsourced figure; npx vitest run server/billStatusClaims.test.ts — 12 passed",
    preventsRecurrence: "server/billStatusClaims.test.ts fails the build if any indexable page or any SOURCE file describes a pending bill as in force. The source scan is the part that matters: it caught 15 more instances in city-content-depth-batch-e.ts, which feeds the runtime CityPage rather than the pre-rendered shell, so those claims were live for readers with JavaScript while being invisible to a dist/public scan.",
    measureAfter: "2026-12-05",
  },
  {
    date: "2026-11-26",
    title: "Florida HB 741 was vetoed in 2022 and the site said it changed the law",
    class: "accuracy",
    changed: [
      "client/src/data/blog-articles-batch2.ts — the Orlando article: the HB 741 FAQ and the warning block",
      "client/src/data/blog-articles-batch3.ts — the Miami article: the HB 741 FAQ and callout",
      "client/src/data/blog-articles-batch4.ts — the misleading-savings article (INDEXABLE): the net-metering paragraph",
      "client/src/data/city-content-depth-batch-a.ts — Jacksonville, Fort Lauderdale and Cape Coral: localHook, stat label, complaint entry, whyItHappens and FAQ",
      "client/src/data/city-content-depth.ts — Orlando, Tampa and Miami: localHook, stat label, complaint entry, whyItHappens and FAQ",
      "scripts/fix-1126-fl-hb741-ab1070-hb4029.py — idempotent fixer",
      "server/billStatusClaims.test.ts — extended with a vetoed-bill guard",
    ],
    evidence: "Official record read 26 Nov 2026 at flsenate.gov/Session/Bill/2022/741: 4/27/2022 'Signed by Officers and presented to Governor • Vetoed by Governor', and 12/7/2023 'Veto Message transmitted to Secretary of State'. The bill never became law, and Florida retail-rate net metering is still in effect. The site said 'Florida HB 741 in 2023 changed net metering rules', 'HB 741, effective January 2024, changed how FPL compensates homeowners', and shipped the stat label '2023 (HB 741)' across three city blocks — 29 mentions in total, one of them on an INDEXABLE page.",
    reasoning: "This is the same class as SB 784, found in the same sweep, and it is the one with the clearest commercial cost. The site was telling Florida homeowners that a rule change caused their savings shortfall, which points them away from the real and actionable cause: an overstated savings projection that the applicable rules never supported. It also set up a false expectation about what evidence they would need, since a homeowner would go looking for a rate-change notice that does not exist. Correcting it makes the FDUTPA claim stronger rather than weaker, because the misrepresentation now stands on its own instead of depending on a law that was never enacted.",
    confidence: "verified",
    verifiedBy: "A scan of all 583 built pages for the six vetoed-bill patterns returns 0 unflagged assertions, and the single INDEXABLE page that mentions HB 741 describes the veto; grep for '2023 (HB 741)' across client/src returns 0",
    preventsRecurrence: "server/billStatusClaims.test.ts asserts, across source and built output, that no page describes HB 741 as operative law. The pattern set was validated in both directions before being committed: 0 matches against the corrected source, and 7 of 7 caught against regressions written from the actual pre-fix strings.",
    measureAfter: "2026-12-05",
  },
  {
    date: "2026-11-26",
    title: "Two enacted solar bills had the wrong effective date",
    class: "accuracy",
    changed: [
      "client/src/data/state-laws.ts — Colorado SB25-299 and Oregon HB 4029",
      "client/src/data/blog-articles-batch5.ts — the Portland article: title, metaDescription, excerpt, ctaSubtext and two body blocks",
      "scripts/fix-1126-sb784-batche-and-colorado.py and scripts/fix-1126-fl-hb741-ab1070-hb4029.py",
    ],
    evidence: "Read 26 Nov 2026. Colorado SB25-299: leg.colorado.gov/bills/sb25-299 — signed 4 Jun 2025, session law effective 6 Aug 2025, Chapter 427, and its requirements 'apply to agreements between a solar sales company and a consumer that are entered into on or after July 1, 2026.' The page said 'Effective January 1, 2026'. Oregon HB 4029: olis.oregonlegislature.gov — Governor signed 5 March 2026, Chapter 11 of the 2026 Laws, 'Effective date June 5, 2026'. The page said 'took effect January 1, 2026'. Its official title is 'Relating to solar energy systems'; the site called it the 'Residential Solar Disclosure Act'.",
    reasoning: "Both bills are real law, so this is a subtler error than the vetoed bills and a more instructive one: an effective date is not one fact but two. A session-law effective date is the date the act takes legal effect as a statute; the date its requirements begin to apply to a given contract can be later, as Colorado shows by five months. Telling a homeowner a disclosure duty already applied to their 2025 contract when it begins with contracts signed after 1 July 2026 invites them to make a demand they cannot support. The Oregon case is the mirror image: a real, strong consumer law whose requirements begin later than the page implied, which risks a reader concluding their pre-June-2026 contract is covered when it is not.",
    confidence: "verified",
    verifiedBy: "Built output confirms dist/public/solar-contract-laws/oregon/index.html contains 'June 5, 2026' and zero occurrences of 'January 1, 2026'; server/billStatusClaims.test.ts asserts both dates for both states",
    preventsRecurrence: "server/billStatusClaims.test.ts asserts Colorado states 1 July 2026 and not 1 January 2026, and that Oregon states 5 June 2026 and not 1 January 2026, in both state-laws.ts and the Portland article. Standing rule: before asserting a bill's effective date, read the session-law line AND the applicability clause.",
    measureAfter: "2026-12-05",
  },
  {
    date: "2026-11-26",
    title: "Florida Stat. 501.021 is the definitions section, not the cancellation right",
    class: "accuracy",
    changed: [
      "client/src/data/state-laws.ts — the Florida coolingOffNote, stat block and body paragraph",
      "client/src/data/city-content-depth.ts — the Orlando stateLawExpanded and the 3-day FAQ",
      "client/src/data/blog-articles-batch5.ts — the Tampa article body",
    ],
    evidence: "Read 26 Nov 2026 at leg.state.fl.us: F.S. 501.021 is titled 'Home solicitation sale; definitions' and its own text scopes the Act to 'ss. 501.021-501.055'. The operative right is 501.025: 'the buyer has the right to cancel a home solicitation sale until midnight of the third business day after the day on which the buyer signs an agreement or offer to purchase'. The site cited 501.021 as the source of the 3-business-day right in six places.",
    reasoning: "This is the definitions-versus-operative defect that was already corrected once on 3 Nov 2026 for Cal. Civ. Code 1689.5, A.R.S. 44-5001 and NRS 598.2821 — and the same wrong section was fixed in blog-articles-batch9.ts while these six other occurrences were missed. That makes it a process failure rather than an oversight, which is why the guard is a positive rule over every occurrence in the content files rather than another single correction. The tell is identical each time: the wrong number sits in the correct chapter and the correct part, so a reviewer checking the topic rather than the section passes it.",
    confidence: "verified",
    verifiedBy: "Built output: 3 pages cite 501.025 and 2 cite 501.021, both as part of the Act range; npx vitest run server/billStatusClaims.test.ts — 12 passed",
    preventsRecurrence: "server/billStatusClaims.test.ts now requires every 501.021 citation in the content files to be either the Act range (501.021-501.055) or an explicit definitions note, and asserts 501.025 is cited somewhere. This turns the recurring class into a rule about every occurrence rather than a list of corrected ones.",
    measureAfter: "2026-12-05",
  },
  {
    date: "2026-11-26",
    title: "California AB 1070 was cited as a 2023 law; it is Stats. 2017, Ch. 662",
    class: "accuracy",
    changed: [
      "client/src/data/blog-articles-batch9.ts — the attorney-general complaint article: the FAQ, the body paragraph and the state list entry",
    ],
    evidence: "Read 26 Nov 2026. AB 1070 is 'Solar energy systems: contracts: disclosures', Stats. 2017, Ch. 662, codified at Business and Professions Code section 7169, requiring the CSLB solar disclosure documents. Sources: cutredtape.com, 'Assembly Bill 1070, Stats of 2017, Ch 662 established Business and Professions Code (BPC) section 7169'; gravel2gavel.com, 'AB 1070 enacted late last year (Chapter 662, Statutes of 2017)'. The site said 'AB 1070 (2023)' in three places and told readers to cite that year in an Attorney General complaint.",
    reasoning: "A wrong year on a statute is not cosmetic when the page's whole purpose is to tell a reader what to cite. A homeowner who follows that instruction quotes a 2023 session that never produced the law, which is the fastest way to have a complaint discounted. The correction also improves the advice: the useful reference is the CSLB disclosure requirement at B&P Code 7169, because that is the document a homeowner can check against what they were actually given.",
    confidence: "verified",
    verifiedBy: "grep -c 'Stats. 2017, Ch. 662' on dist/public/blog/how-to-file-a-complaint-against-solar-company-attorney-general/index.html returned 4; the string 'AB 1070 (2023)' returns 0 across client/src",
    preventsRecurrence: "server/billStatusClaims.test.ts asserts the page never says 'AB 1070 (2023)' and does say 'AB 1070 (Stats. 2017, Ch. 662)'. AB 1070 is also in the ENACTED_BILLS allowlist with its session law recorded inline, so it cannot be mistaken for a pending bill.",
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
