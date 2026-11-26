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
## 2026-11-26 — Blog hub was outranking the guides that answer its queries on 1,248 impressions
**Class:** SEO
**Changed:** `scripts/prerender.assembled.mjs` — added a "Which guide answers which question" routing table to the `/blog` served content, naming eight question clusters and linking each to the guide that answers it with the query words in the anchor text. Every anchor was verified against the built output before shipping; two slugs in the first draft did not resolve to an indexable page and were replaced rather than shipped broken.
**Why:** Search Console (1 Sep–22 Nov 2026) shows `/blog` holding **2,571 impressions across 149 queries and earning 2 clicks**. **119 of those 149 queries are also ranked by a dedicated article**, and those 119 carry **2,356 of the 2,571 impressions**. On **61 of them — 1,248 impressions — the hub outranks the best article**:

| Query | Hub | Answering article |
|---|---|---|
| can you cancel solar panel contract before installation | pos **15.1** (154 impr) | `/blog/how-to-get-out-of-a-solar-contract` pos 36.8 |
| how to cancel solar contract | pos **18.3** (91) | same article pos 55.4 |
| cancel solar contract before installation | pos **16.8** (83) | same article pos 52.8 |
| how to cancel sunrun contract before installation | pos **17.8** (68) | `/blog/sunrun-solar-contract-cancellation-2026` pos 10.4 (133) |

The hub's served content was **879 words of index prose** — how to use the guides, what records to gather, editorial limits — containing no cancellation procedure, no notice window and no company contact. Its CTR at position 11–20 is **0.08% on 1,182 impressions**. A hub cannot answer a procedure question: where it wins, the searcher lands on a directory and must search again. The fix routes rather than duplicates — naming the question clusters and pointing each at the answering guide tells the crawler this page is a directory whose job is to route, and passes descriptive internal links with the query words in the anchor to the articles that should own those queries. What would have falsified the diagnosis: if the hub's impressions sat on queries no article ranked for, the hub would be adding reach rather than absorbing it. **2,356 of 2,571 do overlap**, so it is absorbing.
**Verified:** `python3` comparison of the hub query set against every article query set in `near-winners.json`; every `href` in the routing table checked against `dist/public` for existence and robots; `pnpm build` pre-rendered 583 pages.
**Recurrence guard:** any index or hub page must be checked for query overlap with the pages it links to before its content is expanded. An index page that ranks for procedure questions is a cannibalization defect, not a ranking win.
**Measure after:** 2026-12-05.
## 2026-11-26 — GoodLeap: answers the payment and payoff questions it already ranked for
**Class:** content
**Changed:** `client/src/data/blog-articles-batch9.ts` — added a "How to make a payment or get a payoff quote" section naming **1-800-345-9372** and customerservice@goodleapsupport.com inline, plus the separate application line **1-844-562-6725** and what a payoff quote is actually good for. Rewrote the meta description to **152 characters** so it names the support number and the payoff quote. Added a payment/payoff FAQ at the front of the array, since `BlogPost.tsx` renders only the first five positionally.
**Why:** Search Console (1 Sep–22 Nov 2026) shows this page holding **10,365 impressions at average position 7.5 with 92 clicks — a 0.89% CTR**. That is the largest impression mass on the site and its largest CTR gap. Site-wide CTR at position 7–11 is **1.01%**, so the page converts *below the site's own average* while sitting at the best position of any page above 1,000 impressions. **128 impressions sit on literal phone-number queries at zero clicks**: "800-345-9372" 72 impressions at position 9.6, "8003459372" 34 at 9.4, "1-800-345-9372" 22 at 9.5. Another **57** sit on "goodleap payoff request" at 15.4 and **37** on "goodleap solar payments" at 26.5, also zero clicks. A grep of the built page on 26 Nov 2026 returned **zero** occurrences of "payment portal", "make a payment" or "payoff request", and exactly **one** occurrence of the phone number, inside a styled stat-block. 153 of the page's 157 queries earn zero clicks, carrying 1,082 impressions — **71% of its total**. This is the **fourth instance** of a class already named in this log, after Freedom Forever, Tesla and Sunnova: a page ranking for a question it never answers. The page was not losing on relevance — position 7.5 on 10,365 impressions is the strongest combination on the site — so what was missing was the answer itself. Phone-number and payoff-request queries are the most transactional kind a distressed borrower types. The description was rewritten rather than only the body because the snippet is the only thing a searcher sees before deciding. What would have falsified the diagnosis: if site-wide CTR at the same position band were below 0.89%, the page would be performing normally and the gap would be a site-wide snippet problem rather than a page defect. It is 1.01%, so the page sits below its own peer group.
**Verified:** Built page before the fix: 1 occurrence of `345-9372`, 0 of `pay-goodleap`, 0 of "customer service", 0 of "make a payment" (`grep` on `dist/public/blog/goodleap-solar-loan-cancellation-hidden-fees-2026/index.html`, 26 Nov 2026). GoodLeap contact page read 26 Nov 2026 for **1-800-345-9372** account support, **1-844-562-6725** application support, customerservice@goodleapsupport.com, consumercomplaints@goodleap.com, Maria Mellott VP and Deputy Chief Compliance Officer at 916-475-1255, NMLS #30336, formerly Loanpal. After the fix the block contains 4 occurrences of `1-800-345-9372`, exactly 1 stat-block, and 0 forward references to a number the reader has not yet seen.
**Recurrence guard:** before planning any change to a near-winner page, grep the built HTML for the core noun of each of its top five query clusters, not just the title. A phone-number query needs the number in the description; a payoff query needs the phrase "payoff" in a heading. Zero occurrences of a term the page ranks for is a defect, not an accident.
**Measure after:** 2026-12-05.
## YYYY-MM-DD — Short title
**Class:** content | SEO | defect | infrastructure | accuracy
**Changed:** files and what specifically changed
**Why:** the evidence. Cite exact query, impression count, position, source URL, or test.
**Verified:** the command run and its result
**Recurrence guard:** the test, script or rule that now prevents this class of defect
```

## 2026-11-26 — Rescission page title spent its last characters on a brand the query does not contain
**Class:** SEO
**Changed:** `client/src/data/blog-extra.ts` — rewrote the meta title from "Solar Contract Rescission Rights: 3-Day Rule Checklist" to "Solar Contract Rescission Rights: 3-Day Rule & TILA", and shortened the meta description from 165 to 141 characters.
**Why:** The served title measured **exactly 70 characters** on 26 Nov 2026 — "Solar Contract Rescission Rights: 3-Day Rule Checklist | Solar Freedom" — which is the hard limit enforced by `fitMetaTitle()` in `scripts/prerender.assembled.mjs`. Google truncates near 60, so the visible portion was being cut and the tail was a brand the query does not contain. The same page earns **287 impressions across 53 queries and zero clicks**, including 25 impressions at position 12.7 for "tila rescission solar loan". The word TILA appeared nowhere in the title; "Checklist" occupied the slot instead. Replacing it keeps the total at 67 characters, so the whole promise survives truncation and the title now covers all three top queries: rescission/rescind by morphological match, the 3-day rule, and TILA. The description was independently over the roughly 160-character display budget and was being cut mid-sentence.
**Verified:** `python3 scripts/inspect-rescission-meta.py` reports metaTitle at 51 chars (67 with brand) and metaDescription at 141 chars; `pnpm build` confirms the served title in `dist/public/blog/solar-contract-rescission-rights/index.html`.
**Recurrence guard:** a title at the 70-character limit is a defect even though it passes `fitMetaTitle`, because Google truncates near 60. Any near-winner page whose title is at or near the limit must be checked for words that consume space without appearing in the query set.
**Measure after:** 2026-12-05.

## 2026-11-26 — Sunlight Financial page answered 'is it legit' only in the negative
**Class:** SEO
**Changed:** `client/src/data/blog-articles-batch8.ts` — added a direct yes/no callout plus a supporting paragraph as the first two elements of the Sunlight Financial article.
**Why:** Search Console (1 Sep–22 Nov 2026) shows the page earning 47 impressions at average position 12.3 for "is sunlight financial legit", 76 impressions at 16.4 for "sunlight financial reviews", and 69 impressions at 12.1 for "sunlight financial complaints" — **192 impressions across those three queries and zero clicks**. Before this change the article opened with "For many homeowners, the promise of clean energy and lower utility bills has turned into a financial nightmare", so neither the page nor any extractable snippet contained a direct answer. "Is X legit" is a yes/no query and is answered by a short declarative sentence. The page already knew the answer — Sunlight Financial filed a prepackaged Chapter 11 on 30 October 2023 and emerged on 6 December 2023 under new ownership, and it still services loans — but the fact was buried mid-article. The wording separates "is it a scam" (no) from "should you trust it blindly" (also no), matching the corrected company status recorded the same day.
**Verified:** `pnpm check` clean; the inserted callout is the first element of the content array, confirmed by reading the built page for the "Short answer" string.
**Recurrence guard:** for any page whose top query is a yes/no or "is X legit" question, the first 100 words must contain a direct answer. A page can rank for a question it never answers, which is how 192 impressions produced zero clicks.
**Measure after:** 2026-12-05.

## 2026-11-26 — ADT page was an orphan holding 1,828 impressions; two pages now link to it
**Class:** SEO
**Changed:** `client/src/data/blog-articles-batch6.ts` — added a contextual in-body link to `/blog/adt-solar-complaints` after the Sunrun California complaints section. `client/src/data/blog-articles-batch10.ts` — added the same link after the Vivint/Sunrun merger section. `scripts/fix-adt-link-placement.mjs` and `scripts/fix-adt-link-placement-vivint.mjs` repositioned the first attempt, which had landed the sentence before its own antecedent.
**Why:** Search Console (1 Sep–22 Nov 2026) shows `/blog/adt-solar-complaints` holding **1,828 impressions across 34 queries and only 4 clicks** — "adt solar reviews" alone is 856 impressions at position 12.5 with zero clicks. A repo-wide grep for the slug on 26 Nov 2026 returned exactly one hit: its own definition. No other page linked to it. A page at position 10-12 with a 0.2% CTR is not losing on relevance, it is losing on authority, and an internal orphan receives no link equity at all. `relatedSlugs` could not fix this: `BlogPost.tsx` calls `getRelatedPosts(slug, 3)`, so any slug listed fourth or later is never rendered — the link had to live in body copy. Anchors sit where the reader has just learned their counterparty changed hands or vanished, which is when a comparison to another company's exit is genuinely useful.
**Verified:** `grep -c '/blog/adt-solar-complaints'` returned 1 in each of the two source files, with the surrounding paragraphs read back to confirm the antecedent precedes the reference.
**Recurrence guard:** any page in the near-winners report with meaningful impressions must be checked for inbound internal links, not just title and content match. An orphan page cannot rank on authority however well its copy matches the query.
**Measure after:** 2026-12-05.

## 2026-11-26 — Sunrun page had 207 impressions asking to cancel an appointment and never said the word
**Class:** content
**Changed:** `client/src/data/blog-articles-batch9.ts` — added a "How do you cancel or reschedule a Sunrun appointment?" section to the Sunrun cancellation article, added the matching FAQ at the front of the array, and retired the home-sale FAQ whose own dedicated page covers that topic.
**Why:** Search Console (1 Sep–22 Nov 2026) shows `/blog/sunrun-solar-contract-cancellation-2026` holding **2,007 impressions across 138 queries at average position 10.4 with 11 clicks**. A distinct cluster inside it is people trying to stop a visit rather than end a contract: "how to cancel sunrun appointment" 85 impressions at 9.0, "cancel sunrun appointment" 71 at 9.9, "how to cancel sunrun appointment online" 51 at 9.2 — about **207 impressions**. A grep of the built page on 26 Nov 2026 returned **zero** occurrences of the word "appointment" anywhere in it. A page ranking position 9 for a term it does not contain is matched on surrounding context, which caps how high it can climb and guarantees the snippet will not match. This also matters commercially: someone with an installer visit scheduled tomorrow is the most time-pressured visitor the site gets, and the page had nothing for them. The new section deliberately does not invent a phone menu or a web form path — it states the one verifiable and useful point, that stopping a visit and cancelling a contract are different actions and cancelling a visit does not cancel the agreement, then routes the reader to the documented notice requirement the article already covers. The FAQ swap follows the same rule as the Tesla page: `BlogPost.tsx` renders only the first five FAQs, so the question with real measured demand took the slot of one whose topic has its own page.
**Verified:** `pnpm check` clean; grep of the built Sunrun page confirms the new heading and the appointment FAQ; `pnpm test`.
**Recurrence guard:** any near-winner page must be grepped for its top query cluster's core noun before the change is planned. Zero occurrences of a word the page ranks for is a defect, not an accident.
**Measure after:** 2026-12-05.

## 2026-11-26 — Sunnova page ranked position 2 for a bankruptcy question it never answered
**Class:** content
**Changed:** `client/src/data/blog-articles-batch9.ts` — added a "Do you still have to pay Sunnova after the bankruptcy?" section covering the Chapter 11, the sale of the operating business, the liquidating plan, SunStrong servicing and the route for unfinished installations; added the payment question as the first FAQ.
**Why:** Search Console (1 Sep–22 Nov 2026) shows `/blog/how-to-cancel-sunnova-solar-contract-2026` ranking **position 2.0** for "sunnova bankruptcy" (3 impressions) and **position 2.0** for "sunnova bankruptcy do i have to pay" (2 impressions), plus position 3.0 for "sunstrong management" (2 impressions) — all at zero clicks. A grep of the built page on 26 Nov 2026 returned **zero** occurrences of "Chapter 11" and **zero** of "SunStrong", with one incidental mention of "bankrupt". This is the same defect found on the Freedom Forever article, where the site ranked for a bankruptcy question while its own copy described the bankruptcy as hypothetical. Ranking position 2 for a question the page never answers is the strongest signal that the query is matched on surrounding context alone. It is also the most commercially important unanswered question on the page: "do I still have to pay" is what a Sunnova customer actually needs, and the honest answer protects them from the expensive mistake of stopping payments because of a headline. Every fact was verified on 26 Nov 2026 and recorded in `docs/company-status-verified-2026-11-26.md` — Chapter 11 filed 8 June 2025, sale closed September 2025, liquidating plan effective 14 November 2025, SunStrong Management servicing most in-service systems, Sunnova's own site stating it has ceased independent operations, and payment terms unchanged with customers told to continue paying. The section answers the payment question in its first sentence because that is the query, does not promise an outcome, and repeats the standing warning not to stop payments.
**Verified:** `pnpm check` clean; grep of the built Sunnova page confirms the new heading, the Chapter 11 and SunStrong mentions, and the FAQ in the FAQPage schema.
**Recurrence guard:** any page ranking in the top 3 for a query must be checked for whether the page actually answers it, not merely whether it mentions the topic. A top-3 ranking on an unanswered question is a content defect that no amount of title work can fix.
**Measure after:** 2026-12-05.

## 2026-11-26 — Blue Raven page ranked position 6 for 1,994 impressions and earned 19 clicks
**Class:** SEO
**Changed:** `client/src/data/blog-articles-batch8.ts` — rewrote the Blue Raven meta description to name reviews, complaints, customer service and the support number, all of which the body already documented.
**Why:** Search Console (1 Sep–22 Nov 2026) shows `/blog/blue-raven-solar-complaints` as the best-positioned high-volume page on the site: **1,994 impressions, average position 6.4, but only 19 clicks** — a 0.95% CTR where position 6 normally earns several times that. The queries are overwhelmingly review-and-contact intent: "blue raven solar reviews" 459 impressions at 15.6, "blue raven solar customer service" 238 at 6.6, "blue raven solar phone number" 115 at 8.5, "blue raven solar customer service phone number" 96 at 7.0, "blue raven solar review" 88 at 13.1. The old 133-character description said none of those words, so roughly **1,080 impressions** were searching for terms the snippet never displayed. The body already answered every one of them, so this was a snippet gap rather than a content gap. The body's BBB figures were re-verified on 26 Nov 2026 against the BBB profile's own structured data — **A+** rating, **555** complaints in three years, **877** customer reviews, accredited since 23 October 2015, phone (800) 377-4480. The review count was deliberately left out of the description because it changes, and a stale figure in a snippet is worse than none.
**Verified:** `node scripts/fix-blue-raven-description.mjs` reports the new description at 151 characters; `pnpm check` clean; `pnpm build` and grep of the served meta description.
**Recurrence guard:** for every near-winner page, the top five queries by impressions must be checked against the meta description text, not only against the page body. A page can rank on body relevance while its snippet answers nothing the searcher typed.
**Measure after:** 2026-12-05.

## 2026-11-26 — Tesla article gained the reviews and customer-service answers it ranked for
**Class:** content
**Changed:** `client/src/data/blog-articles-batch10.ts` — added a "What SolarCity and Tesla Solar Reviews Actually Show" section with a four-cell stat block, and a "How to Reach Tesla Solar Customer Service" section with the published phone path and the in-app route. Also retired two zero-demand FAQs and moved the reviews and contact FAQs to the front of the array.
**Why:** Search Console (1 Sep–22 Nov 2026) shows this page earning 8 impressions at position 17.0 for "solarcity reviews" and 5 impressions at position 19.6 for "solarcity customer service". Reading the full article on 26 Nov 2026 found no reviews section and no support contact anywhere in it — it was all process: agreement types, transfer paths, UCC-1 filings. Both queries are question-shaped, so both want a direct answer under a heading rather than an implication spread across a process guide. Facts were verified the same day from primary sources: Tesla's own Customer Support page states solar and Powerwall support is (877) 798-3752, option 4 then option 2; the BBB profile for Tesla Energy carries an **F** rating with **21** complaints in the three-year window, **all 21** recorded as failure to respond, and no accreditation. No star rating is claimed because BBB publishes none on that profile.
**Verified:** `pnpm check` clean; `pnpm test`; `python3 scripts/show-url-queries.py solarcity` confirms the query set; `pnpm build` then grep of the built Tesla page for both new headings.
**Recurrence guard:** before adding an FAQ to any article, count the existing entries first. `client/src/pages/BlogPost.tsx` slices to `MAX_FAQ_ITEMS = 5` positionally, so a new FAQ appended to a full array ships invisible and marks up nothing — the exact "I added an FAQ and nothing changed" failure. Measured demand decides which FAQ is retired.
**Measure after:** 2026-12-05.

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

## 2026-11-26 — Solar-companies hub ranked 18.1 with zero clicks and a title matching none of its queries
**Class:** SEO
**Changed:**
- `scripts/prerender.assembled.mjs` — retitled `/solar-companies` from "Solar Company Complaints & Cancellation Guide" to **"Worst Solar Companies & Complaints List (2026)"**; description rewritten to 156 characters.
- `scripts/prerender.assembled.mjs` — replaced the opening shell section, which began by telling the reader that company research lives on the blogs instead of hub URLs, with a sourced list of nine company failures and status changes plus a five-step guide to checking any company independently.

**Why:** Search Console (1 Sep–22 Nov 2026) shows the page earning 82 impressions across 20 queries at average position 18.1 with **zero clicks**. The dominant query is "worst solar companies" at 45 impressions and position 25.4, then "cancel my solar reviews" at 9 and "solar company complaints" at 4. The published title contained none of those phrases, and the served body opened by disclaiming its own usefulness — which gives a reader arriving from "worst solar companies" no reason to stay. The fix is not to invent a ranking of worst companies, which would be an unverifiable opinion, but to answer the checkable version: which companies have ceased operations or changed hands, and on what date. Every entry is a public record with a dated event, from the same sources verified for the company status audit on the same day.

**Verified:** `pnpm build` pre-rendered 583 pages; the built title reads "Worst Solar Companies & Complaints List (2026)", the description is 156 characters, and the shell contains all nine company entries plus the checking guide.

**Recurrence guard:** standing rule for hub pages — a hub that ranks for a query must answer that query in its title and in its first paragraph. The specific check is to pull the top three queries by impressions for the page and confirm each phrase appears in the built HTML, done as part of the near-winners review rather than assumed from the page's topic.

**Measure after:** 2026-12-05.

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
