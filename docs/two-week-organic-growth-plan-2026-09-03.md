# Two-Week Organic Search and Appointment Plan

## The exact baseline

Google Search Console currently reports **111 indexed URLs** across `breakyoursolarcontract.com` and **253 not-indexed URLs**. The project tracks **41 blog/article URLs**. The exact subset of those 41 articles that Google has indexed cannot yet be stated truthfully: the automated URL Inspection audit returned `UNKNOWN` for all 41 because the current service identity has Search Analytics access but not usable URL-level inspection results. We should not mislabel the 111 site-wide indexed URLs as 111 indexed articles.

The verified 28-day scorecard captured on **2026-09-02** reports **82 organic clicks**, **7,213 impressions**, **1.1368% CTR**, **13.18 average position**, **9 durable leads**, **9 CRM deliveries**, and **0 booked appointments**. The live Search Console three-month report shows **298 clicks**, **22.2K impressions**, **1.3% CTR**, and **12.1 average position**. The key implication is clear: the site is being shown in Google, but it is not earning enough clicks and its current lead flow is not yielding verifiable appointments.

| Measurement | Verified value | Interpretation |
|---|---:|---|
| Site-wide indexed URLs | 111 | This is a Google Search Console total for every URL type, not an article-only count. |
| Tracked blog/article URLs | 41 | The current published article inventory targeted by the index audit. |
| 28-day clicks | 82 | Current organic baseline for the daily Outcomes scorecard. |
| 28-day impressions | 7,213 | Enough visibility exists to prioritize CTR and position work now. |
| 28-day CTR | 1.1368% | Low for pages already ranking near page one. |
| 28-day average position | 13.18 | The aggregate is page two; the two strongest pages already rank around positions 8–9. |
| Durable leads / CRM deliveries | 9 / 9 | Lead capture and HighLevel handoff are working at a basic level. |
| Booked appointments | 0 | The revenue-critical booking loop is either not occurring, not tracked, or both. |

> **The hard rule for this sprint:** no task counts as a win because an agent created an idea. It only counts after it has a public-page or booking implementation receipt and a dated measurement comparison.

## The three moves that matter in the next 14 days

### 1. Capture more clicks from the two pages Google already shows on page one

This is the fastest available organic lever. Two pages account for **4,196 of the 7,213 current impressions (58.2%)**, but both underperform on CTR.

| Page | Current impressions | Clicks | CTR | Avg. position | 14-day execution target |
|---|---:|---:|---:|---:|---|
| Sunrun cancellation guide | 2,538 | 28 | 1.10% | 8.5 | Raise CTR toward 3.0% with an approved title/description and verify the live snippet source. |
| GoodLeap cancellation guide | 1,658 | 14 | 0.84% | 7.7 | Raise CTR toward 3.0% with an approved title/description and verify the live snippet source. |
| Cancel Sunrun before installation | 387 | 3 | 0.78% | 14.0 | Raise CTR toward 2.5% while improving rank toward page one. |

If impression volume stays flat and those CTR targets are reached, the arithmetic upside is approximately **+91 clicks per 28 days**, or roughly **+45 clicks during a two-week observation period**. This is a target calculation, not a guarantee: Google controls when it refreshes titles and rankings.

| Day | Exact work | Owner/control | Receipt required |
|---|---|---|---|
| 1 | Collapse the duplicated queued Sunrun/GoodLeap actions into one approved task per page. The current queue repeats similar Sunrun actions without completion receipts. | SEO Intel prepares; owner approves. | One action per page with target URL, before-state metadata, target CTR, and completion owner. |
| 1–2 | Publish conservative, intent-matched title and description updates. The titles must promise process clarity—not cancellation outcomes or legal advice. | Owner uses **Approve & Publish** in BlogStudio. | Public URL, before/after metadata, timestamp, and rollback copy. |
| 3 | Confirm rendered title, meta description, canonical, and index eligibility on the live page. | Executor/Infra plus owner review. | Technical verification receipt; failed verification becomes P1. |
| 7 and 14 | Compare page-specific impressions, clicks, CTR, and position against the saved Sept. 2 baseline. | Daily scorecard. | Outcomes chart and action result updated; no “win” claimed without the comparison. |

Recommended page-title direction for review—not automatic use—is: **“Cancel a Sunrun Solar Contract: Options Before & After Installation (2026)”**, **“GoodLeap Solar Loan Cancellation: Fees, Options & Next Steps (2026)”**, and **“Cancel a Sunrun Contract Before Installation: What to Do Now (2026)”**. Each description should name the homeowner’s problem, indicate the documents and steps covered, and end with a plain invitation to request a quick case review; none should claim that a contract will be cancelled.

### 2. Push the same three pages upward with answer coverage, internal links, and FAQ schema

The two best pages already sit around positions 8–9. The next ranking gain will not come from producing more unrelated articles; it will come from making these specific pages the most complete, trustworthy answer to their observed intent.

| Required page change | Exact standard | Why it matters |
|---|---|---|
| Intent sections | Add short, factual sections for **before installation**, **after installation**, **loan vs. installer**, **documents to collect**, and **what a 15-minute review can determine** where relevant. | Covers the decisions visible in the search intent without overpromising a legal result. |
| FAQ and schema | Add 4–6 question-and-answer entries, ensure FAQ structured data validates, and retain conservative compliance wording. | Improves answer completeness and eligible rich-result support. |
| Internal-link map | Add 3–4 contextual internal links per priority page from the cancellation hub and closely related company/lender pages; use only live, index-eligible destinations. | Concentrates internal relevance on the pages already earning impressions. |
| Proof and trust | Add document-checklist, timeline, lender/installer distinction, and clear “not legal advice / case review” framing where appropriate. | Makes the page more useful and protects conversion quality. |

The delivery sequence is fixed: **SEO brief → Content self-QA → Editor quality gate → owner Approve & Publish → technical verification → dated GSC measurement**. The Content and Editor loop is already designed so editor revision feedback must return to the same article. The important operational correction is that this sprint must finish those three named pages before Content is allowed to create a new topic.

The 14-day ranking target is not “rank #1.” The measurable target is a median position improvement of at least **two positions** on the three pages, with the Sunrun and GoodLeap pages moving toward positions **6.0** and **5.5**, and the pre-installation page toward **10.0**. If Google does not recrawl the updates within two weeks, the implementation is still complete, but the ranking result remains **pending**, not failed or claimed as success.

### 3. Turn leads into a booked 15-minute case review and prove the booking loop works

This is the highest revenue priority because the site has 9 durable leads but **zero recorded booked appointments**. The data shows **1,416 journey events** in 28 days, including **1,312 CTA/click/scroll/view events**, but no appointment event and no GoHighLevel appointment lifecycle record. That means engagement exists, but the booking outcome is not measurable.

| Day | Exact work | Acceptance criterion |
|---|---|---|
| 1 | Set the one primary conversion offer: **“Book a no-obligation 15-minute solar contract case review.”** Put it above the fold and after the key decision sections on the three priority pages. Keep chat and call as secondary options. | Every priority page contains the same primary booking CTA and a visible secondary contact path. |
| 1–2 | Connect that CTA to the active GoHighLevel calendar/booking flow; pass page URL, article slug, UTM/source, and lead/session ID into the booking flow. | A booking test reaches the calendar and retains source context. |
| 2 | Configure the GoHighLevel `appointment_booked` lifecycle webhook to write a signed event to this site’s existing endpoint. | One controlled test booking appears in `ghlPipelineEvents` as `appointment_booked` and in Outcomes. |
| 3 | Show a post-submission booking step rather than ending the journey after a form lead. | A newly submitted lead can book immediately without waiting for a callback. |
| 7 and 14 | Report **organic click → CTA → lead → calendar-open → appointment-booked** counts, by priority page. | Each stage is present; missing stages create a P1 alert. |

The numerical target for the first two weeks is **100% event capture for every booking**, plus at least **one verified booked appointment**. A more mature 28-day target is a **20% lead-to-booked-appointment rate**; from the present 9-lead baseline, that means at least two booked appointments. This is a business target, not a guarantee—appointment volume depends on actual visitor intent, calendar availability, and response speed—but the tracking and booking path are entirely controllable and must be made reliable first.

## What is not in the top three this sprint

Backlink acquisition matters because the scorecard shows **zero verified active backlinks**, but it should not be the primary 14-day bet. It has a longer, less predictable feedback cycle. It should run in parallel as a tightly scoped outreach test after the three priority pages are improved, with placements counted only when a live canonical link is verified.

Likewise, do not create more broad city pages to inflate the content count. The domain already has 253 URLs that Google reports as not indexed. The two-week content rule is to improve and consolidate pages that already show demand, not add thin pages that dilute crawl and editorial attention.

## Daily accountability table

| Metric | Baseline | Day 7 status rule | Day 14 decision rule |
|---|---:|---|---|
| Priority-page CTR | Sunrun 1.10%; GoodLeap 0.84%; pre-installation 0.78% | Implemented + live verification required. | Compare against GSC; if no CTR lift after sufficient impressions, test a new approved snippet. |
| Priority-page position | 8.5; 7.7; 14.0 | Internal links, FAQ, and page updates must be live. | If position does not improve, audit query intent and competing-page gaps before drafting new content. |
| Organic clicks | 82 in latest 28-day scorecard | Track daily rolling window without declaring short-term noise a trend. | Evaluate change against the saved baseline and priority-page results. |
| Durable leads | 9 in latest 28-day scorecard | Every lead must retain source/page identity. | Compare rate by priority page once CTA events are available. |
| Booked appointments | 0 | Booking event wiring must be tested. | At least one verified event or a visible P1 integration failure. |
| Article index verification | 41 tracked blog URLs; exact indexed subset unknown | Fix URL Inspection access or create a browser-account audit path. | Store per-URL verdicts; never substitute the 111 site-wide total. |

## References

1. [Google Search Console live Overview and Performance reports](https://search.google.com/search-console) for the production domain, read on 2026-09-03.
2. [Persisted Solar Freedom 28-day SEO scorecard](../server/scheduled/seoScorecard.ts) and `seoScorecardSnapshots` record captured 2026-09-02.
3. [Persisted page-level Search Console metrics](../server/gscRefresh.ts) and `seoPages` records captured 2026-09-02.
4. [Current project baseline note](seo-baseline-2026-09-03.md).
