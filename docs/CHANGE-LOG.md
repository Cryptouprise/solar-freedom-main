# Change Log — Solar Freedom / breakyoursolarcontract.com
## 2026-11-26 — Added window-comparison reporting, which showed the site is down 10 percent and named the four pages responsible

**Class:** infrastructure

**Changed:** `scripts/gsc-site-trend.mjs`, `scripts/gsc-page-delta.mjs`, `scripts/gsc-query-delta.mjs`, `scripts/gsc-exact-page-queries.mjs` — all new.

**Why:** The owner has asked repeatedly whether rankings and impressions are going up. No script in the repository could answer it, because every existing script was per-page. A page-level tool was being used to answer a site-level question.

**How the conclusion was reached:** Recent window 25 Oct to 23 Nov against prior window 25 Sep to 24 Oct, both 30 days. Impressions 15,072 against 16,821, down 10.4%. Clicks 100 against 178, down 43.8%. CTR 0.66% against 1.06%. Clicks fell about four times faster than impressions — the most important fact here, because a smaller market cannot explain it. 14 pages lost 3,216 impressions; 31 gained 2,003. Four blog pages account for 78% of the loss. Query-level classification shows 14 demand losses (position held, volume fell — rewriting would achieve nothing), 14 ranking losses totalling -512, and exactly one click loss at stable position. The largest gain on the site is `/blog`, up 738 impressions, which is the routing table added earlier the same day.

**Verified:** All three scripts run against Search Console directly and write nothing. The per-page losses reconcile against the site total: 3,216 lost minus 2,003 gained equals the 1,213 net shortfall.

**Recurrence guard:** A site-level question can no longer be answered with a page-level tool, and a declining page can no longer be rewritten before its cause is classified. Any future claim about rankings or traffic must cite a window comparison with both dates.

**Measure after:** 2026-12-05

## 2026-11-26 — The homepage served two h1 elements, one of them hidden

**Class:** defect

**Changed:** `client/index.html` — the screen-reader-only `<h1>` is now a `<p>` with the same text and styling. `server/headingStructure.test.ts` — new guard, 5 tests, reads the built output.

**Why:** Two `<h1>` elements are not penalised in themselves. The problem is narrower: the hidden heading duplicated the visible one almost word for word. A duplicate heading deliberately hidden from users is the pattern search engines treat as manipulation, and it was placed there for crawlers that do not run JavaScript — exactly the audience most likely to read it and least likely to see the visible one.

**How the conclusion was reached:** Measured on the built output: `dist/public/index.html` contained two `<h1>` elements, one visible reading "Cancel Your Solar Contract" and one hidden with `clip:rect(0,0,0,0)` reading "Cancel Your Solar Contract | Solar Freedom". A scan of all 584 built pages found this was the only page with more than one `<h1>`, and that the only page with none is Google's site-verification file, which is correct. The cause is two files each reasonable alone: `client/index.html` line 99 carried the hidden heading, and `scripts/prerender.assembled.mjs` line 1648 injects a real `<h1>` into every built page. Neither file is wrong on its own, so neither would ever have been reviewed as the cause. Demoting rather than deleting was deliberate — deleting would have removed the only heading text from the un-pre-rendered homepage.

**Verified:** The guard was first run against the **unfixed** build and failed on `/` with the exact two headings, then passed after the rebuild, so it has been seen to fail. `pnpm check` clean; `pnpm build` pre-rendered 583 pages; the homepage now has 1 `<h1>` and 583 of 584 pages have exactly 1.

**Recurrence guard:** The guard reads the built output, so it catches any future interaction between the template and the pre-renderer regardless of which file changes. A separate assertion reads `client/index.html` directly and fails if any `<h1>` reappears there, naming the cause rather than only the symptom.

**Measure after:** 2026-12-05

## 2026-11-26 — Eight indexable pages served no meta-keywords tag while the other twenty-two did
**Class:** SEO
**Changed:**
- shared/page-meta-keywords.json — 5 indexable city entries added (murfreesboro-tn, san-francisco-ca, san-jose-ca, santa-ana-ca, youngstown-oh) and 3 indexable state entries added (arizona, california, texas); 22 to 30 keys
- server/cityKeywordCoverage.test.ts — new guard, 4 tests
- scripts/add-1126-city-keywords.py — idempotent fixer for the city entries
**Why:** Measured 26 Nov 2026 against dist/public: of the 27 INDEXABLE city pages, 22 served a meta name=keywords tag and 5 did not — murfreesboro-tn, san-francisco-ca, san-jose-ca, santa-ana-ca, youngstown-oh. The 22 that did all carried exactly 5 keywords in one consistent pattern. The tag is emitted by scripts/prerender.assembled.mjs line 1684 from shared/page-meta-keywords.json, so a missing key means a missing tag. The guard written for the city gap then found a second one on its first run: all 3 INDEXABLE state pages (arizona, california, texas) were also missing. After the fix, all 27 city pages and all 3 state pages serve a tag with 5 keywords each, and the JSON diff is a pure addition — 0 keys removed, 0 keys modified, 22 to 30.
**How the conclusion was reached:** Recorded honestly: Google has publicly ignored the keywords meta tag for ranking for over a decade, so this change does not raise rankings and is not claimed to. It is done for two real reasons. First, the owner asked for this tag on specific city pages four separate times, each time with an explicit constraint of 3 to 8 keywords, and answering only the four named pages left the set inconsistent in a way nobody had measured. Second, an inconsistent set is a maintenance trap: any checker that reports no keywords detected keeps flagging these pages, and the next person to read that report cannot distinguish a real omission from a deliberate choice, which is how a false alarm becomes noise that gets ignored. The five city entries follow the existing pattern exactly rather than inventing a new one, using city and state names read from client/src/data/cities.ts rather than typed by hand. The owner's 3-to-8 bound is enforced on every entry by the guard because it was stated, and duplicate keywords within an entry are rejected too.
**Verified:** npx vitest run server/cityKeywordCoverage.test.ts (4 tests, including one that removes a key and confirms the checker reports it); pnpm check clean; pnpm build pre-rendered 583 pages; a direct scan of dist/public confirms 27 of 27 indexable city pages and 3 of 3 indexable state pages serve a tag with 5 keywords each and 0 are missing or out of range
**Recurrence guard:** The guard fails the build if any indexable city or state page has no keywords entry, if any entry falls outside 3 to 8 keywords, or if any entry repeats a keyword. Because it reads shared/index-eligibility.json rather than a hard-coded list, promoting a new city to indexable automatically requires a keywords entry before the build passes.
**Measure after:** 2026-12-05

## 2026-11-26 — An indexable page asserted that Sunrun knew, as established fact, and named fraud in its title
**Class:** accuracy
**Changed:**
- client/src/data/blog-articles-batch6.ts — sunrun-complaints-california: metaTitle and metaDescription rewritten to state the verifiable mechanism instead of asserting intent; added three sections covering the ranked complaint list, the correct California complaint body, and what NEM 3.0 actually changed
- scripts/fix-1126-sunrun-ca-accuracy.py — new idempotent fixer
- server/unsourcedClaims.test.ts — new STATE_OF_MIND pattern plus 2 tests
**Why:** Measured 26 Nov 2026, window 2026-08-26 to 2026-11-23 (90 days): /blog/sunrun-complaints-california holds 45 queries, 214 impressions, 1 click, CTR 0.47%, average position 12.6, and is INDEXABLE. Its served metaTitle read 'Sunrun Complaints California 2026 — NEM 3.0 Fraud & Legal Options' and its served metaDescription read 'California Sunrun customers: NEM 3.0 wiped out your savings and Sunrun knew. If you were misled, you may have a fraud claim.' A repository-wide grep for Sunrun's state of mind returned nothing, because no source for it exists. After the fix the built page contains 0 occurrences of 'Sunrun knew', 0 of 'Fraud & Legal' and 0 of 'wiped out your savings'; it now contains 'consumer affairs' x3, 'NEM 2.0' x5, 'CSLB' x10, 'Contractors State License Board' x5 and '15 April 2023' x7, with a 59-character title and a 151-character description.
**How the conclusion was reached:** Two separate problems in one snippet. The accuracy problem: 'Sunrun knew' asserts a named company's state of mind, and intent is a finding a court makes rather than something this site can state; 'NEM 3.0 Fraud' names a legal conclusion in the title itself. This site's own /how-it-works page says Solar Freedom is not a law firm, so it cannot plead a claim it is not making. A provably false statement of fact about a named company is the core of a defamation claim, and naming the company in a meta description satisfies the 'of and concerning' element for every searcher who sees it. It is also a conversion problem in the opposite direction from the usual one: a homeowner who is genuinely unsure whether they were misled is told their case is already proven, which is the same over-promise the trust governance exists to prevent. The SEO problem, measured rather than assumed: the page ranks 6.9 for 'list the most common complaints from current sunrun users' and 7.7 for 'what problems are most frequently reported by sunrun customers?' — two extractable-answer queries — while answering neither in list form, and ranks 20.3 for 'sunrun consumer affairs' with zero occurrences of the phrase. The fix routes 'consumer affairs' to the RIGHT body: the CPUC Consumer Affairs Branch handles utilities, not solar contractors, so sending readers there would have introduced a new error. The correct California body is the Contractors State License Board, which runs a dedicated solar complaint form and states a four-year window for construction complaints, verified 26 Nov 2026 at cslb.ca.gov. NEM 3.0 facts come from the CPUC's own Net Energy Metering and Net Billing page: since 15 April 2023, customers applying for interconnection take service on the net billing tariff under D.22-12-056. The rewrite also separates two problems the old copy blended — a projection built on NEM 2.0 export rates versus production that never matched the written estimate — because they are different claims with different evidence.
**Verified:** npx vitest run server/unsourcedClaims.test.ts (8 tests); pnpm check clean; 90 test files, 866 tests passed, 3 skipped; node scripts/trust-governance-audit.mjs passed; pnpm build pre-rendered 583 pages; built-page grep confirms all three banned strings at 0 and all five new vocabulary items present
**Recurrence guard:** The new STATE_OF_MIND pattern matches a company name followed by a knowledge verb in any meta field and fails the build. It is deliberately narrow: it does not fire on the legitimate hedge 'depends on what it knew', which is how these pages should read, and it does fire on 'knew (or should have known)', because asserting what a sales rep knew is the same problem with a softer verb. A companion test reproduces the exact shipped sentence and asserts the pattern catches it.
**Measure after:** 2026-12-05

## 2026-11-26 — A new guard for state-of-mind claims about named companies found a second page on its first run
**Class:** accuracy
**Changed:**
- client/src/data/blog-articles-batch14.ts — goodleap-tila-violation-cancel-solar-loan: metaTitle and metaDescription rewritten to drop the assertion of fact
- scripts/fix-1126-goodleap-tila-metaclaims.py — new idempotent fixer
**Why:** The STATE_OF_MIND guard added earlier the same day, on its first run across every file in client/src/data, returned two hits rather than the one it was written for: the Sunrun California page already fixed, and blog-articles-batch14.ts line 15, whose metaDescription read 'GoodLeap hid dealer fees in your loan documents — that's a federal TILA violation. Attorneys are using it to cancel GoodLeap loans right now.' The page /blog/goodleap-tila-violation-cancel-solar-loan is noindex, follow, verified in dist/public on 26 Nov 2026 and absent from INDEXED_BLOG_SLUGS. After the fix the built page contains 0 occurrences of 'GoodLeap hid', 0 of "that's a federal TILA violation" and 0 of 'Attorneys are using it'.
**How the conclusion was reached:** Lower exposure than the Sunrun defect because the page is noindex, so no searcher reaches it from Google. Fixed anyway for three reasons. First, a live readable page is still readable: it is linked from the site and can be reached directly or by an AI crawler, and 'noindex' governs Google's index rather than the truth of the sentence. Second, the three assertions are the most legally exposed on the site: 'GoodLeap hid' asserts a completed act and a state of mind, "that's a federal TILA violation" states the legal conclusion as fact rather than as the question to investigate, and 'Attorneys are using it to cancel GoodLeap loans right now' asserts a current practice with no source. Third, the body of that same article is largely conditional and therefore defensible — its FAQ says 'if a lender fails to make required disclosures, you have the right to rescind', which states the rule rather than a conclusion — so the meta copy was the unhedged part and the part served to every searcher and social preview, where the surrounding conditional context is stripped away. The rewrites keep the search intent (TILA, dealer fees, rescission, cancellation) and state what TILA requires and what a review checks. The broader lesson recorded here is that a guard written for one page and scoped to every file finds the second instance of its class immediately, which is the argument for writing the guard rather than the correction.
**Verified:** npx vitest run server/unsourcedClaims.test.ts — proven in both directions: the shipped sentence was injected back into batch14 and the test failed with 'blog-articles-batch14.ts:15 "GoodLeap hid"', then passed on restore; pnpm check clean; 90 test files, 866 tests passed, 3 skipped; pnpm build pre-rendered 583 pages; built-page grep confirms all three banned strings at 0
**Recurrence guard:** The same STATE_OF_MIND guard covers this page and every other file in client/src/data, so a third instance fails the build without anyone having to remember this one existed.
**Measure after:** 2026-12-05

## 2026-11-26 — Sixteen indexable city pages carried an unsourced resolution-time promise in a code path no scan could see
**Class:** accuracy
**Changed:**
- scripts/fix-1126-latent-resolution-promises.py — new idempotent fixer, scoped strictly to the 27 indexable cities; replaced 15 stat objects and 5 FAQ answers across 5 legacy depth files
- client/src/data/city-content-depth-batch-a.ts, -batch-b.ts, -batch-c.ts, -batch-e.ts, -batch-g.ts, city-content-depth.ts — resolution-time strings replaced with the site's own already-approved wording
- server/unsourcedClaims.test.ts — 2 new tests: an indexable-city source scan that ignores the file-level allow-list, plus a self-test proving the pattern fires on the exact pre-fix strings
**Why:** Measured 26 Nov 2026. 16 of the 27 indexable city pages carried a resolution-time promise: austin-tx, henderson-nv, north-las-vegas-nv, savannah-ga, nashville-tn, cincinnati-oh, san-francisco-ca, san-jose-ca, hartford-ct, little-rock-ar, shreveport-la, houston-tx, dallas-tx, san-antonio-tx, los-angeles-ca and san-diego-ca. The strings were 30–90 days, 45–75 days, 30–60 days, 'Typical Resolution Time' and 'Avg. Resolution'. All 23 occurrences sat in the localFaq or marketStats field, and a repository-wide grep proved no component renders either field: grep -rn '.localFaq|marketStats' client/src --include=*.tsx returns only CityPage.tsx:517, which builds its OWN local marketStats literal at line 630. Zero rendered-field hits, 23 dead-field hits. Fixed: 15 stat objects and 5 FAQ answers across 5 files, verified 0 remaining indexable hits and a second run writing nothing.
**How the conclusion was reached:** This is the fifth occurrence of the same defect class, after 3M+ homeowners, 68%, the 30-90-days-with-legal-help line, and the outcome-timeline promise — and it is the first one that neither existing guard could ever have caught. The earlier allow-list exempts the depth files by WHOLE FILE, so an indexable city inside an allow-listed file was never scanned; and the dist/public assertion can never see this path at all, because these files feed the runtime React component CityPage.tsx rather than the pre-rendered shell. Both were confirmed by experiment rather than assumed: injecting the exact pre-fix string turned the new source test red while the built-output test stayed green. So the exposure was latent, not live — but the day anyone wires depth.localFaq or depth.marketStats into CityPage, sixteen indexable pages publish an unsourced outcome-and-timeline promise instantly, on a site whose own trust-governance filter exists to prevent exactly that. Replacing the copy now costs nothing and removes the trap. The replacement wording is the site's own approved phrasing from the generic city FAQ ('Timing varies with the agreement, the facts, the parties involved, and the process selected. No result or timeline can be determined before an individual review.') rather than newly invented text, so no new claim is introduced. The 223 remaining legacy strings on noindex cities are deliberately left alone: they cannot be indexed, and rewriting them is a separate, larger change that would block unrelated work.
**Verified:** npx vitest run server/unsourcedClaims.test.ts (6 tests, proven in both directions: baseline green, injected regression red on batch-a.ts :: henderson-nv :: 'Avg. Resolution', restored green); pnpm check clean; 90 test files, 864 tests passed, 3 skipped; node scripts/trust-governance-audit.mjs passed; pnpm build pre-rendered 583 pages
**Recurrence guard:** The new test scans SOURCE, scopes to indexable cities only, and does not consult the allow-list, so a file-level exemption can no longer hide an indexable defect. It also asserts the indexable set is still 27, so if that approved set ever changes the test must be re-read rather than silently covering different pages. Its companion test reproduces the four exact pre-fix string shapes and asserts the pattern catches each one, because a guard that has never been seen to fail is not a guard.
**Measure after:** 2026-12-05


## 2026-11-26 — California state page ranked position 10.4 for lease and Sunrun queries without naming either
**Class:** SEO
**Changed:**
- client/src/data/state-laws.ts — the California entry gained a section titled 'Solar Leases and PPAs in California: The Same Rights, a Different Target', three paragraphs, and two contextual links
- scripts/fix-1126-ca-lease-vocabulary.py — idempotent fixer
- server/statePageVocabulary.test.ts — new guard, 4 tests
**Why:** A page at position 10.4 for a query it never names is matched on surrounding context, which caps how far it can climb, and this is the fourth instance of the class already recorded for the rescission page (ranked for 'TILA', never used the word), Blue Raven (ranked for 'customer service' and 'phone number', description named neither) and Sunrun (ranked for 'appointment', zero occurrences). The gap was easy to miss because the page did discuss third-party ownership - it had 3 'PPA' mentions - just never in the words the searcher used. The added section also fixes a real reader misunderstanding rather than only a keyword gap: cancelling the agreement does not remove the equipment, and a homeowner who stops paying without knowing that trades a payment problem for a lien or a credit problem. Naming Sunrun and SunPower as the two largest third-party owners is sourced from each company's own site and asserts nothing about either company's conduct. Both links were checked indexable before shipping; the two lease-exit guides are noindex and were deliberately NOT linked, because linking a noindex page spends crawl equity on a page that cannot rank. Search Console (1 Sep-22 Nov 2026): /solar-contract-laws/california is indexable and holds 'cancel solar lease california' at position 10.4 on 18 impressions and 'cancel sunrun contract california' at position 10.4 on 18 impressions. Measured on the 583-page build on 26 Nov 2026, its rendered text contained 0 occurrences of 'lease', 0 of 'Sunrun' and 0 of 'power purchase', while 'PPA' appeared 3 times. After the fix: lease 7, Sunrun 4, PPA 11, power purchase agreement 1, third-party 3, and the page grew from 1,411 to 1,747 words.
**Verified:** pnpm build pre-rendered 583 pages; the built California page now shows lease 7, Sunrun 4, PPA 11, both anchors present, and the page is still indexable; npx vitest run server/statePageVocabulary.test.ts - 4 passed, and the guard was proven by injecting a regression that removed the vocabulary, which failed it, then restoring, which passed it
**Recurrence guard:** server/statePageVocabulary.test.ts holds a list of pages with MEASURED query demand and the vocabulary that demand requires, and each entry must cite the impressions and position that justify it so the list cannot grow into a wish list. It also asserts that any page linked from the California state page is indexable, which blocks the opposite mistake of spending internal links on noindex pages.
**Measure after:** 2026-12-05
## 2026-11-26 — California AB 1070 was cited as a 2023 law; it is Stats. 2017, Ch. 662
**Class:** accuracy
**Changed:**
- client/src/data/blog-articles-batch9.ts — the attorney-general complaint article: the FAQ, the body paragraph and the state list entry
**Why:** A wrong year on a statute is not cosmetic when the page's whole purpose is to tell a reader what to cite. A homeowner who follows that instruction quotes a 2023 session that never produced the law, which is the fastest way to have a complaint discounted. The correction also improves the advice: the useful reference is the CSLB disclosure requirement at B&P Code 7169, because that is the document a homeowner can check against what they were actually given. Read 26 Nov 2026. AB 1070 is 'Solar energy systems: contracts: disclosures', Stats. 2017, Ch. 662, codified at Business and Professions Code section 7169, requiring the CSLB solar disclosure documents. Sources: cutredtape.com, 'Assembly Bill 1070, Stats of 2017, Ch 662 established Business and Professions Code (BPC) section 7169'; gravel2gavel.com, 'AB 1070 enacted late last year (Chapter 662, Statutes of 2017)'. The site said 'AB 1070 (2023)' in three places and told readers to cite that year in an Attorney General complaint.
**Verified:** grep -c 'Stats. 2017, Ch. 662' on dist/public/blog/how-to-file-a-complaint-against-solar-company-attorney-general/index.html returned 4; the string 'AB 1070 (2023)' returns 0 across client/src
**Recurrence guard:** server/billStatusClaims.test.ts asserts the page never says 'AB 1070 (2023)' and does say 'AB 1070 (Stats. 2017, Ch. 662)'. AB 1070 is also in the ENACTED_BILLS allowlist with its session law recorded inline, so it cannot be mistaken for a pending bill.
**Measure after:** 2026-12-05
## 2026-11-26 — Florida Stat. 501.021 is the definitions section, not the cancellation right
**Class:** accuracy
**Changed:**
- client/src/data/state-laws.ts — the Florida coolingOffNote, stat block and body paragraph
- client/src/data/city-content-depth.ts — the Orlando stateLawExpanded and the 3-day FAQ
- client/src/data/blog-articles-batch5.ts — the Tampa article body
**Why:** This is the definitions-versus-operative defect that was already corrected once on 3 Nov 2026 for Cal. Civ. Code 1689.5, A.R.S. 44-5001 and NRS 598.2821 — and the same wrong section was fixed in blog-articles-batch9.ts while these six other occurrences were missed. That makes it a process failure rather than an oversight, which is why the guard is a positive rule over every occurrence in the content files rather than another single correction. The tell is identical each time: the wrong number sits in the correct chapter and the correct part, so a reviewer checking the topic rather than the section passes it. Read 26 Nov 2026 at leg.state.fl.us: F.S. 501.021 is titled 'Home solicitation sale; definitions' and its own text scopes the Act to 'ss. 501.021-501.055'. The operative right is 501.025: 'the buyer has the right to cancel a home solicitation sale until midnight of the third business day after the day on which the buyer signs an agreement or offer to purchase'. The site cited 501.021 as the source of the 3-business-day right in six places.
**Verified:** Built output: 3 pages cite 501.025 and 2 cite 501.021, both as part of the Act range; npx vitest run server/billStatusClaims.test.ts — 12 passed
**Recurrence guard:** server/billStatusClaims.test.ts now requires every 501.021 citation in the content files to be either the Act range (501.021-501.055) or an explicit definitions note, and asserts 501.025 is cited somewhere. This turns the recurring class into a rule about every occurrence rather than a list of corrected ones.
**Measure after:** 2026-12-05
## 2026-11-26 — Two enacted solar bills had the wrong effective date
**Class:** accuracy
**Changed:**
- client/src/data/state-laws.ts — Colorado SB25-299 and Oregon HB 4029
- client/src/data/blog-articles-batch5.ts — the Portland article: title, metaDescription, excerpt, ctaSubtext and two body blocks
- scripts/fix-1126-sb784-batche-and-colorado.py and scripts/fix-1126-fl-hb741-ab1070-hb4029.py
**Why:** Both bills are real law, so this is a subtler error than the vetoed bills and a more instructive one: an effective date is not one fact but two. A session-law effective date is the date the act takes legal effect as a statute; the date its requirements begin to apply to a given contract can be later, as Colorado shows by five months. Telling a homeowner a disclosure duty already applied to their 2025 contract when it begins with contracts signed after 1 July 2026 invites them to make a demand they cannot support. The Oregon case is the mirror image: a real, strong consumer law whose requirements begin later than the page implied, which risks a reader concluding their pre-June-2026 contract is covered when it is not. Read 26 Nov 2026. Colorado SB25-299: leg.colorado.gov/bills/sb25-299 — signed 4 Jun 2025, session law effective 6 Aug 2025, Chapter 427, and its requirements 'apply to agreements between a solar sales company and a consumer that are entered into on or after July 1, 2026.' The page said 'Effective January 1, 2026'. Oregon HB 4029: olis.oregonlegislature.gov — Governor signed 5 March 2026, Chapter 11 of the 2026 Laws, 'Effective date June 5, 2026'. The page said 'took effect January 1, 2026'. Its official title is 'Relating to solar energy systems'; the site called it the 'Residential Solar Disclosure Act'.
**Verified:** Built output confirms dist/public/solar-contract-laws/oregon/index.html contains 'June 5, 2026' and zero occurrences of 'January 1, 2026'; server/billStatusClaims.test.ts asserts both dates for both states
**Recurrence guard:** server/billStatusClaims.test.ts asserts Colorado states 1 July 2026 and not 1 January 2026, and that Oregon states 5 June 2026 and not 1 January 2026, in both state-laws.ts and the Portland article. Standing rule: before asserting a bill's effective date, read the session-law line AND the applicability clause.
**Measure after:** 2026-12-05
## 2026-11-26 — Florida HB 741 was vetoed in 2022 and the site said it changed the law
**Class:** accuracy
**Changed:**
- client/src/data/blog-articles-batch2.ts — the Orlando article: the HB 741 FAQ and the warning block
- client/src/data/blog-articles-batch3.ts — the Miami article: the HB 741 FAQ and callout
- client/src/data/blog-articles-batch4.ts — the misleading-savings article (INDEXABLE): the net-metering paragraph
- client/src/data/city-content-depth-batch-a.ts — Jacksonville, Fort Lauderdale and Cape Coral: localHook, stat label, complaint entry, whyItHappens and FAQ
- client/src/data/city-content-depth.ts — Orlando, Tampa and Miami: localHook, stat label, complaint entry, whyItHappens and FAQ
- scripts/fix-1126-fl-hb741-ab1070-hb4029.py — idempotent fixer
- server/billStatusClaims.test.ts — extended with a vetoed-bill guard
**Why:** This is the same class as SB 784, found in the same sweep, and it is the one with the clearest commercial cost. The site was telling Florida homeowners that a rule change caused their savings shortfall, which points them away from the real and actionable cause: an overstated savings projection that the applicable rules never supported. It also set up a false expectation about what evidence they would need, since a homeowner would go looking for a rate-change notice that does not exist. Correcting it makes the FDUTPA claim stronger rather than weaker, because the misrepresentation now stands on its own instead of depending on a law that was never enacted. Official record read 26 Nov 2026 at flsenate.gov/Session/Bill/2022/741: 4/27/2022 'Signed by Officers and presented to Governor • Vetoed by Governor', and 12/7/2023 'Veto Message transmitted to Secretary of State'. The bill never became law, and Florida retail-rate net metering is still in effect. The site said 'Florida HB 741 in 2023 changed net metering rules', 'HB 741, effective January 2024, changed how FPL compensates homeowners', and shipped the stat label '2023 (HB 741)' across three city blocks — 29 mentions in total, one of them on an INDEXABLE page.
**Verified:** A scan of all 583 built pages for the six vetoed-bill patterns returns 0 unflagged assertions, and the single INDEXABLE page that mentions HB 741 describes the veto; grep for '2023 (HB 741)' across client/src returns 0
**Recurrence guard:** server/billStatusClaims.test.ts asserts, across source and built output, that no page describes HB 741 as operative law. The pattern set was validated in both directions before being committed: 0 matches against the corrected source, and 7 of 7 caught against regressions written from the actual pre-fix strings.
**Measure after:** 2026-12-05
## 2026-11-26 — California SB 784 was described as enacted law while it sits in committee
**Class:** accuracy
**Changed:**
- client/src/data/state-laws.ts — the California entry: the SB 784 H2 became 'Your Three-Day Right to Cancel, and How the Window Gets Extended'; the body now cites Civil Code 1689.6 and 1689.7(g) and carries an explicit pending-legislation caution; coolingOffNote no longer credits a bill with the senior window
- client/src/data/blog-articles-batch5.ts — the Sacramento article: title, metaTitle, metaDescription, excerpt, ctaSubtext, opening sentence, H3 and FAQ answer; also removed an unsourced 'Over 500 CA homeowners helped' and an 'Act now' urgency line from the metaDescription
- client/src/data/city-content-depth-batch-e.ts — 15 instances across Sacramento, San Francisco and San Jose
- server/billStatusClaims.test.ts — new guard, 12 tests
- scripts/fix-1126-sb784-not-law.py and scripts/fix-1126-sb784-batche-and-colorado.py — idempotent fixers
**Why:** A bill held in committee creates no rights, so the page was telling California homeowners they held statutory protections that do not exist — the single most damaging kind of error this site can publish, because the audience includes attorneys and the remedy described is the thing a homeowner would act on. The defect survived every earlier content review because the citation looks authoritative: a real bill number, a real subject, a plausible date. The fix replaces a promise with the mechanism that actually exists, 1689.7(g), which is stronger copy as well as accurate copy, because it gives the reader a testable question — did the seller comply with the notice requirements? — rather than a statute that may never pass. Official bill status read 26 Nov 2026 at leginfo.legislature.ca.gov: SB-784 'Home improvement loans: right to cancel contracts.' is 'Active Bill - In Committee Process', last action 08/13/26 'August 13 hearing: Held in committee and under submission.' The site told readers it was 'Effective January 1, 2026', that it 'requires' a live Confirmation Call, and that it 'extends' the cancellation window. Separately, the 5-business-day senior window credited to SB 784 comes from Civ. Code 1689.6, where 1689.6(a)(4) applies the five-day right to contracts entered into on or after 1 January 2021 — not 2026, and not any bill. 1689.6 was amended by AB 1327 (Stats. 2025, Ch. 348, Sec. 3), effective 1 Jan 2026. The real extension mechanism is Civ. Code 1689.7(g): 'Until the seller has complied with this section the buyer may cancel.' 1689.7(a)(1) requires the cancellation statement at the signature space in at least 10-point boldface; 1689.7(c)(1) requires an easily detachable Notice of Cancellation in at least 10-point type.
**Verified:** grep on the built page confirms 'Three-Day Right to Cancel', '1689.7(g)', '10-point boldface', 'held in committee' and 'not an enacted law' are all present in dist/public/solar-contract-laws/california/index.html; the Sacramento page carries zero SB 784 mentions and no unsourced figure; npx vitest run server/billStatusClaims.test.ts — 12 passed
**Recurrence guard:** server/billStatusClaims.test.ts fails the build if any indexable page or any SOURCE file describes a pending bill as in force. The source scan is the part that matters: it caught 15 more instances in city-content-depth-batch-e.ts, which feeds the runtime CityPage rather than the pre-rendered shell, so those claims were live for readers with JavaScript while being invisible to a dist/public scan.
**Measure after:** 2026-12-05
## 2026-11-26 — Every city page now routes state-level questions to the state law page instead of competing with it
**Class:** SEO
**Changed:**
- `scripts/prerender.assembled.mjs` gains `STATE_LAW_SLUG_BY_NAME` and `registerStateLawSlugs()`, populated from the state entries during `loadData()`, so the city renderer knows which state-law pages actually exist before it writes a link.
- `buildCityUniqueContent` now emits a real anchor in the state-law paragraph ("the <State> solar contract law resource") and adds a routing sentence: "State-level rules, deadlines and citations for <State> are collected on the <State> solar contract law resource."
- `shared/priority-city-render.mjs` gains `getStateLawPath()` and the same routing sentence inside the `city-local-resources` section, which the 21 priority city guides render through a separate code path that had no state link at all.
- `client/src/components/PriorityCityGuide.tsx` renders the same sentence, importing `getStateLawPath` from the shared module rather than reimplementing the state map, so the shell and the hydrated page cannot drift apart.
**Why:** Measured 26 Nov 2026. Before the change, the state-law paragraph on every city page read "review the dedicated <State> law resource" with NO anchor, so the city page was competing for state-level queries instead of routing to the page that answers them. `/cancel-solar-contract/san-francisco-ca` earned 46 impressions in the recent 30-day window at average position 35.1 with ZERO clicks, while the California state page held its own state-level queries at position 10.4. The 21 priority city guides were worse: a JSON scan found ZERO references to `/solar-contract-laws/` anywhere in `shared/priority-city-content.json`, so Phoenix, Houston, Dallas, Los Angeles, San Diego and San Antonio — the six highest-value city pages — had no route to their own state page at all. The routing sentence also said \"for this location\" rather than naming the state, which tells a crawler nothing, so it now names it. After the change, measured on the 583-page build: 77 city pages carry a correct state-law link (71 templated plus the 6 highest-value priority guides), 0 mismatched, 0 broken targets, and 225 correctly omitted because their state has no published page; all 21 priority guides verified, 6 with the correct link and 15 correctly omitted.
**Verified:** python3 on the 583-page build confirmed 77 city pages with a correct state-law link and 225 correctly omitted, 0 linking an unpublished state, 0 where the anchor text disagreed with its target. node /tmp/verify-statelaw.mjs confirmed all 21 priority guides: 6 correct links, 15 correctly omitted, 0 problems, with the existing `city-local-resources` external source links, the `#city-form` CTA anchor and the `noopener noreferrer` attributes all still present. `pnpm check` clean and the production build pre-rendered 583 pages.
**Recurrence guard:** The state-law slug map now lives in exactly one place, `STATE_LAW_SLUG_BY_NAME` for the templated renderer and `getStateLawPath()` in `shared/priority-city-render.mjs` for the priority guides, and the client imports the shared helper instead of copying it. The recurring lesson is recorded here: this site renders city pages through TWO independent code paths, so any fix to city-page output must be checked against both.
**Measure after:** 2026-12-05
## 2026-11-26 — None of the fourteen zero-click near-winners was a real defect, and the noindex suppression was already working
**Class:** infrastructure
**Changed:**
- `scripts/ctr-significance.py` added: computes expected clicks per page from the site's own CTR-by-position curve and reports a one-tailed Poisson probability, so a zero-click page is only treated as a defect when the shortfall cannot be explained by volume.
- `scripts/gsc-page-trend.mjs` added: compares a page across two Search Console windows so a cached impression count can be separated from current demand before any index-status change is made.
- No content or index-status change was made. This entry records two negative findings and the tooling that produced them.
**Why:** Two investigations on 26 Nov 2026, both of which ended in NOT making a change. (1) Eight near-winner URLs ship `noindex` yet appeared to be ranking, including four in the top ten: goodleap-solar-loan-problems at position 8.6 with 214 impressions, solar-contract-cancellation-cost at 7.7 with 94, solar-lien-on-house-removal-guide at 9.0 with 54, and solar-escalator-clause-what-it-is-how-to-fight at 8.7 with 57. Direct requests confirmed five of the eight serve HTTP 200 with a `noindex` directive and are absent from the sitemap, which is the strongest suppression signal the site can send. `scripts/gsc-page-trend.mjs` then compared the recent 14 days against the preceding 45: all five returned **zero** impressions in the recent window against 28, 38, 8 and 15 in the older one, and SunPower zero in both. The suppression is working exactly as designed and the cached impressions are historical. (2) Fourteen near-winner pages had zero clicks at positions 6.2 to 18.1, which reads as fourteen CTR defects in a flat table. `scripts/ctr-significance.py` computed expected clicks from the site's own CTR-by-position curve: expected values were 0.2 to 2.3 clicks, and the probability of observing zero purely by chance ranged from 0.10 to 0.84. **Zero of the fourteen was statistically real.**
**Reasoning:** Both findings are the same mistake in different clothes, which is treating a table row as a diagnosis. The index-status case nearly produced a change that would have promoted five pages into the index on the strength of impressions that had already stopped arriving — the suppression was correct, the pages are thin (317 and 311 words for the two company hubs), and Dividend Finance has zero recent query demand site-wide while the lien topic is already covered by the indexable `/solar-lien-removal` page. The CTR case would have produced fourteen rewrites to chase roughly one expected click each, and worse, it would have taught the wrong lesson from random variation. The discipline this establishes: before treating a page as a defect, check whether its demand is current, and check whether its shortfall is larger than chance. The high-volume pages remain the real opportunities and those were already worked today — GoodLeap at 10,365 impressions, Sunrun at 9,343 and Blue Raven at 4,488 are 81 percent of the page-1 near-winner impression mass, and all three were fixed earlier in the same session.
**Verified:** `node scripts/gsc-page-trend.mjs --recent 14 --older 45` on the five suppressed pages returned 0 impressions in every recent window. `curl` against all eight live URLs confirmed five HTTP 200 with `noindex` and three HTTP 301. `python3 scripts/ctr-significance.py` over the 45-item near-winners list reported 14 zero-click pages, 0 statistically real, 14 noise, with p(0) from 0.1003 to 0.8420.
**Recurrence guard:** `scripts/ctr-significance.py` is now the required first pass over any near-winners list: a zero-click page is not a defect unless p(0) is below 0.05, so low-volume pages can no longer consume a change. `scripts/gsc-page-trend.mjs` is now required before any index-status change, because the near-winners dataset spans 1 Sep to 22 Nov and an impression count inside it says nothing about whether the demand is still there. Both are read-only and both are cheap enough to run before every batch.
**Measure after:** 2026-12-05
## 2026-11-26 — Six indexable pages promised a first-party result, and one called us a law firm
**Class:** accuracy
**Changed:**
- `client/src/data/blog-articles-batch5.ts`: the Atlanta metaDescription dropped "We've helped 50+ GA homeowners save thousands" and the Boston metaDescription dropped "Our firm helped 200+ homeowners cancel"; both now name the statute and what decides a claim.
- `client/src/data/blog-articles-batch3.ts`: the Bakersfield metaDescription dropped "cancel your contract and save thousands".
- `client/src/data/blog-articles-batch4.ts`: the payment-shock metaDescription dropped "legal options to save thousands".
- `client/src/data/blog-articles-batch6.ts`: the military-families metaDescription dropped "save thousands" and its "Urgent help available!" urgency, and a body sentence promising "save you thousands of dollars" was replaced with the notice-window reason to act now.
- `client/src/data/blog-articles-batch10.ts`, `batch6.ts`, `batch15.ts`, `batch19.ts`: five descriptions shortened so they survive the 160-character fitter intact instead of being cut mid-phrase.
- `server/firstPartyClaims.test.ts` added, 6 tests.
**Why:** Found 26 Nov 2026 by scanning the BUILT output rather than the source, which is why it had survived every earlier content review. Four INDEXABLE pages carried a first-party result claim in their meta description and the Atlanta page carried it in body prose too: "We've helped 50+ GA homeowners save thousands" (Atlanta), "Our firm helped 200+ homeowners cancel" (Boston), "save thousands" (Bakersfield, payment shock), "save thousands" plus "Urgent help available!" (military families). No source for any figure exists anywhere in the repository. The Boston line is the worst of the six because it says "Our firm" on a site whose own `/how-it-works` page states in its first sentence "Solar Freedom is not a law firm", so the site contradicted itself on the two pages a skeptical reader is most likely to compare. The same scan found 35 pages whose description did not end in sentence punctuation, 5 of them indexable; the source strings were complete sentences that the 160-character `fitSnippet` limit cut at a word boundary, leaving snippets like "...closing records" with no object. Separately recorded: `/blog/cancel-solar-contract-atlanta-ga` ships `robots=index` in the built output while its slug is absent from `INDEXED_BLOG_SLUGS` in `shared/index-eligibility.json`, a discrepancy this test now pins in place rather than silently resolving.
**Reasoning:** Two different failure modes with the same cause, which is that both were checked in the source and never in the output. A first-party result claim is the single most damaging thing this site can publish, because it is checkable and it is false: an attorney or a sharp homeowner can ask for the fifty Georgia files, and there are none. It also directly contradicts the trust position the rest of the site is built on, which is that we promise no outcome. The truncation is the cheaper defect but it costs the same click: a description that stops mid-thought reads as unfinished and gives the searcher no reason to prefer it over the nine other results. Neither fix needed a new capability, only looking at what the site actually served. The replacements keep each snippet's job, which is to name the legal mechanism and the next step, and drop the promise.
**Verified:** `npx vitest run server/firstPartyClaims.test.ts`: 6 tests passed. The test fails the build if any article meta field matches a first-party claim pattern, if any INDEXABLE built page serves one, if any INDEXABLE page says "our firm" or "our law firm", if any indexable description does not end in sentence punctuation, or if the Atlanta index discrepancy changes in either direction without the record being updated. Grep of `client/src/data` on 26 Nov 2026 returns 0 occurrences of the four claim strings. `pnpm check` clean; `npx vitest run`: 87 files, 838 tests passed, 3 skipped; trust governance audit passed; `pnpm build` pre-rendered 583 pages.
**Recurrence guard:** `server/firstPartyClaims.test.ts` now scans the BUILT output for first-party claim patterns and for descriptions that do not end in a sentence, so the check runs against what Google actually receives rather than against the source. This is the second defect class found only by reading the built output, after the 74 pages of ellipsis-terminated snippets, which is why the standing practice is now to scan `dist/public` after every build rather than trusting the source.
**Measure after:** 2026-12-05
## 2026-11-26 — Five articles promised a resolution timeline and cited population statistics that no source supports
**Class:** accuracy
**Changed:**
- `client/src/data/blog-articles-batch9.ts`, `blog-articles-batch14.ts` and `blog.ts`: the stat trio `3M+` U.S. homeowners with solar contracts, `68%` report higher-than-expected costs and `30-90 days to resolution with legal help` removed from five articles and replaced with figures each article can actually defend.
- Escalator-clause article stat block now reads `2.9-3.9%` / `$150 -> $328` / `20-25 yrs` / `Free`, all of which are arithmetic the reader can check against their own contract.
- Attorney-general complaint article now reads `CFPB` / `FTC` / `State AG` / `Free`, naming the agencies that actually receive these complaints rather than a predicted outcome.
- PPA transfer article now reads `20-25 yrs` / `30-60 days` / `Buyout` / `Free`; red-flags checklist now reads `15` / `2.9-3.9%` / `Notice` / `Free`.
- `cancel-solar-contract-after-installation` in `client/src/data/blog.ts`: the same `30-90 days to resolution with legal help` stat replaced with the notice requirement.
- Escalator article metaDescription rewritten to drop the "Act now" urgency and the "Secure your savings" guarantee, and its ctaSubtext corrected to match.
- `blog-articles-batch6.ts` `breakyoursolarcontract-how-it-works` (noindex): metaDescription no longer promises "in 30-90 days" and the excerpt no longer says "in as little as 30 days".
- `scripts/prerender.assembled.mjs`: three new patterns added to `unsupportedFirstPartyClaimPatterns` covering outcome-plus-timeline promises and unsourced population statistics; a broader version was written, measured and deliberately rejected.
- `server/unsourcedClaims.test.ts` added, 4 tests, including a build-output assertion that no indexable page ships `Typical Resolution` or `30-90 days` and an assertion that the runtime filter stays narrow.
**Why:** A site-wide grep on 26 Nov 2026 found the same stat trio in four articles and a fifth occurrence of the resolution-time stat in `client/src/data/blog.ts`, and no source anywhere in the repository. The only genuine "68%" in the repo is in `docs/seo-baseline-2026-09-03.md` describing an unrelated impression decrease. The "30-90 days to resolution with legal help" line is an outcome and timeline promise, not a statistic, and the trust filter missed it because the nearest pattern required the literal phrase "Results in 30-90 days". Measured across the built output: 7 pages shipped a resolution-time promise and all 7 were noindex; the indexed city pages las-vegas-nv, phoenix-az and houston-tx did not ship it. A sweep of the proposed broader `% of <group>` runtime pattern showed it would have suppressed 87 legitimate lines including approved published city-page statistics and correct explanations of the 30% federal tax credit.
**Reasoning:** Two separate harms. The resolution-time line is a prediction about an outcome we cannot control, which is both a trust problem with the reader and the kind of claim that damages credibility with an attorney. The population statistics are worse because they are unfalsifiable as written: no citation, no date, no sample. Rather than soften the numbers, each article was given figures it can defend from its own subject matter, so the stat block still does the job of a stat block, which is to make the page scannable. The broad runtime filter was rejected because runtime suppression DELETES content, and deleting 87 legitimate lines to catch a handful of bad ones is a worse trade than catching them at build time. The wide class is therefore guarded by a failing test rather than a runtime deletion.
**Verified:** `npx vitest run server/unsourcedClaims.test.ts`: 4 tests passed. A grep of `client/src/data` on 26 Nov 2026 returns 0 occurrences of "3M+", "Report higher-than-expected costs", "Days to resolution with legal help" and "Homeowners report hidden fees" outside the test file and the 6 legacy `city-content-depth` files that are all noindex. `pnpm check` clean; `npx vitest run`: 86 files, 832 tests passed, 3 skipped.
**Recurrence guard:** `server/unsourcedClaims.test.ts` bans outcome-timeline promises and unsourced population statistics in article copy, asserts that the runtime trust filter still contains "with legal help" and does NOT contain the rejected broad `% of <group>` pattern, and asserts that no indexable built page ships `Typical Resolution` or `30-90 days`. The test carries an explicit `ALLOWED` list for 6 legacy `city-content-depth` files and `LEGACY_NOINDEX_BLOGS` for `blog-articles-batch7.ts`, each with a stated reason, so the exclusions are visible rather than silent.
**Measure after:** 2026-12-05
## 2026-11-26 — Rescission page ranked for cancel, termination and the three-day window without naming any of them

**Class:** SEO

**Changed:**
- `client/src/data/blog-extra.ts`: the `/blog/solar-contract-rescission-rights` metaTitle is now `Cancel a Solar Contract: 3-Day Rescission & TILA` (48 chars, 64 rendered with the brand suffix) and the metaDescription names cancel, rescind, terminate, three days, TILA, the FTC Cooling-Off Rule and before selling your house.
- The page title changed from `Solar Contract Rescission Rights: Check the 3-Day Rule` to `Can You Cancel a Solar Contract in 3 Days? Rescission Rights & TILA`.
- The opening paragraph now states the three business day window in words as well as numerals, because the page wrote only `3-day` and never `three day` while the highest-volume query uses the spelled form.
- New H2 section "Cancelling a Solar Contract Before Selling Your House" answering the home-sale cluster and linking to `/blog/sell-house-with-solar-panels`.
- FAQ order changed so the TILA question is third instead of sixth, because the client rendered only the first five and that question was therefore invisible despite carrying 25 impressions.
- `scripts/fix-1126-rescission-vocabulary.py` added; idempotent, keyed on each block.

**Why:** Search Console (1 Sep–22 Nov 2026) shows 287 impressions across 53 queries at average position 36.2 with **zero clicks**. Top queries: "three day right to cancel solar contract" 34 impr at 11.9, "rescind solar contract" 33 at 13.5, "tila rescission solar loan" 25 at 12.7, "solar contract termination" 19 at 19.5, "how to cancel solar contract" 17 at 49.1, "solar contract cancellation" 15 at 34.5, "cancel solar contract before selling house" 13 at 19.6. The served description contained the word "cancel" zero times, "termination" zero times, "three day" zero times and "before selling house" zero times — about 150 impressions of demand matched on body relevance while the snippet answered none of it. An earlier fix in the same session corrected only the title; the description is a separate field.

**Verified:** `pnpm build` pre-rendered 583 pages. The built title is 64 rendered characters. The description is 153 characters naming all seven clusters. The served body now contains "three day" twice where it had zero and "before selling" twice where it had zero. The TILA FAQ renders third in both the HTML and the FAQPage schema.

**Recurrence guard:** `scripts/audit-snippet-coverage.py` now runs this check across every indexed page rather than one at a time — for each page earning impressions it clusters the top queries and reports which clusters the served description does not name. The FAQ positional cap is separately guarded by `server/faqParity.test.ts`.

**Measure after:** 2026-12-05

## 2026-11-26 — FAQ structured data described 38 questions the page never displayed

**Class:** defect

**Changed:**
- `shared/faq-policy.json` created as the single source of truth for how many FAQ items a page may render and mark up (`maxRenderedItems: 8`), with the drift history recorded in the file.
- `client/src/pages/BlogPost.tsx`: `MAX_FAQ_ITEMS` raised from 5 to the shared policy value and the literal removed so it cannot be hard-coded again.
- `scripts/prerender.assembled.mjs`: the FAQ HTML emitter now slices to the shared cap, and the FAQPage JSON-LD slice changed from a hard-coded 10 to the shared cap.
- `server/faqParity.test.ts` added, 8 tests, including a scan of the built output asserting no page marks up more questions than the cap.

**Why:** Measured 26 Nov 2026 across all 583 built pages: **23 pages emitted more FAQ questions in the pre-rendered shell than the client rendered.** The shell carried 153 Q&As on those pages, the client rendered 115, so **38 questions were described in FAQPage JSON-LD and served as visible HTML to crawlers that do not run JavaScript, but were invisible to any reader with JavaScript enabled.** The cause is dated: `git log` shows commit `2b14b60` (18 Nov 2026, PR #58) introduced the client cap of 5 to stop long FAQ walls burying the call to action and did not change the shell, which sliced at 10. Google's structured-data policy requires FAQPage markup to describe content visible on the page, so this was a live violation rather than a style preference.

**Verified:** `npx vitest run server/faqParity.test.ts` — 8 tests passed. `pnpm build` pre-rendered 583 pages, and a scan of all 197 built pages carrying a FAQ section found **0 pages exceeding the cap and 0 with an HTML-versus-JSON-LD count mismatch**, down from 23 pages and 38 hidden questions.

**Recurrence guard:** `shared/faq-policy.json` is read by both the client and the pre-render shell, and `server/faqParity.test.ts` fails the build if either side hard-codes a number, if the shell's HTML or JSON-LD emitter stops slicing at the shared cap, if the cap drops below the largest faq array in `client/src/data`, or if any built page marks up more questions than the cap. The same class of defect had appeared three times before on individual pages as a positional FAQ cap, which is why it is now enforced structurally rather than per page.

**Measure after:** 2026-12-05


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
## 2026-11-26 — Four URLs were 301-redirects and indexable pages at the same time

**Class:** defect

**Changed:**
- `scripts/prerender.assembled.mjs` — added `isRedirectedPath()` and made the blog `noindex` decision respect `shared/seo-redirects.json`, so a path the server 301s can no longer be emitted as an indexable page.
- `server/redirectConsistency.test.ts` — new, 5 tests asserting no built redirect source carries an index directive, none is both indexable and self-canonical, and no redirect points at another redirect source.

**Why:** Comparing `shared/index-eligibility.json` against `shared/seo-redirects.json` found **four slugs declared indexable that the app also serves as 301s**. Confirmed by direct request on 26 Nov 2026 — all four returned HTTP 301: `/blog/solar-escalator-clause-what-it-is-how-to-fight` → the `-explained-how-to-fight-it` variant, `/blog/cancel-solar-contract-denver-co-2026` → `/cancel-solar-contract/denver-co`, `/blog/cancel-solar-contract-rescission-rights` → `/blog/solar-contract-rescission-rights`, `/blog/goodleap-solar-loan-hidden-dealer-fees-2026` → `/blog/goodleap-solar-loan-cancellation-hidden-fees-2026`. The built copies of all four said "index, follow" and pointed their canonical at themselves, while the sitemap generator already excluded all four — three mutually contradictory signals for the same URL. The escalator pair is the clearest case: 80 impressions at average position 6.95 with **zero clicks** on the source URL that redirects. Two independent lists decided the same question and nothing forced them to agree; the sitemap generator consulted both, which is why it was right while the HTML was wrong.

**Verified:** `curl` against all four live URLs on 26 Nov 2026 returned 301 with the expected `Location`; `pnpm build` pre-rendered 583 pages; the four slugs now ship `noindex` while their four canonical destinations ship `index`; sitemap still carries 41 blog articles and excludes all four sources; `npx vitest run server/redirectConsistency.test.ts` — 5 tests pass; `pnpm test` — 84 files, 820 tests pass, 3 skipped; `node scripts/trust-governance-audit.mjs` passed.

**Recurrence guard:** `server/redirectConsistency.test.ts` fails the build if any path in `shared/seo-redirects.json` is also emitted with an index directive, if any redirect source is both indexable and self-canonical, or if a redirect points at another redirect source. Two lists deciding the same question must be checked against each other, not maintained by memory.

**Measure after:** 2026-12-05

## 2026-11-26 — The site's biggest page-2 opportunity ranked on 'get out' while its snippet said 'cancel'

**Class:** SEO

**Changed:**
- `client/src/data/blog.ts` — `/blog/how-to-get-out-of-a-solar-contract`: `metaTitle` now leads with "How to Get Out of a Solar Contract: Loan, Lease or PPA" instead of "How to Cancel a Solar Contract: Before or After Install (2026)"; `metaDescription` now names "get out", "loan" and "lease" instead of "cancel" alone.
- `client/src/data/blog.ts` — added a section answering the lease variant, the loan variant and the PPA variant separately in the searcher's own words, routing to the state solar-contract law guides for the statutory windows. It states no outcome and promises nothing.
- `scripts/fix-1126-get-out-vocabulary.py` — idempotent, scoped to the one article slice.

**Why:** Search Console (1 Sep–22 Nov 2026): **1,255 impressions at average position 45.3 with 1 click** — the largest single impression mass below position 20 on the site. Every top query uses "get out" or "get rid" phrasing and **not one contains the word "cancel"**: "how to get out of a solar contract" 31 impr at 42.7, "how to get out of a solar loan" 31 at 26.7, "how to get out of solar lease" 40 at 47.0, "get out of solar lease" 35 at 46.9, "how do i get out of my solar lease" 26 at 58.9. The page slug, its H1 and its `title` field all said "Get Out"; only the `metaTitle` Google displays said "Cancel". Measured on the built page before the fix: 1,248 words containing "lease" 4 times and "loan" 3 times, with no place answering either variant directly; and 49 of its 51 inbound internal links used the raw title as anchor text. The two pages that do target lease phrasing are both `noindex`, so the indexed page has to carry that vocabulary itself.

**Verified:** `pnpm check` clean; `pnpm build` pre-rendered 583 pages; built page now serves a 70-character title leading with "How to Get Out of a Solar Contract", a 134-character description naming loan and lease, and 1,490 served words with the new heading present; `pnpm test` 83 files, 815 tests pass, 3 skipped; `node scripts/trust-governance-audit.mjs` passed.

**Recurrence guard:** Before tuning a snippet, check the page's own top queries for vocabulary the snippet does not contain. A page whose slug, H1 and visible title agree but whose `metaTitle` disagrees is contradicting itself in exactly the field the searcher reads first. Also check whether the pages that already target a variant are indexable before redirecting a title at that variant, or the fix creates cannibalization instead of removing it.

**Measure after:** 2026-12-05

## 2026-11-26 — 74 pages shipped Google a snippet that stopped mid-phrase

**Class:** defect

**Changed:**
- `scripts/prerender.assembled.mjs` — replaced the ellipsis-appending slicers in `fitMetaTitle` and `fitMetaDescription` with `fitSnippet`, which cuts only on a sentence end, a strong clause mark, a coordinating conjunction or a whole word, and drops a trailing function word so nothing dangles.
- `scripts/fix-1126-baked-ellipsis-descriptions.py` — repaired 20 article records whose `metaDescription` already contained a literal `...` baked into the source string while the same record held a complete `excerpt`.
- `client/src/data/blog-articles-batch6.ts` — Colorado `metaTitle` read "How to Cancel & Protect Your", missing the word "self".
- `client/src/data/blog-articles-batch11.ts` — the lease-vs-loan `metaTitle` was cut by the 70-character fitter to "(And Why", leaving an open parenthetical.
- `server/metaSnippet.test.ts` — new, 10 tests locking in both halves of the defect.

**Why:** Measured on `dist/public` on 26 Nov 2026 across all 583 built pages: **37 titles and 56 descriptions ended in a literal ellipsis**, 19 pages had both, so **74 pages — 12.7% of the site — showed a mid-phrase cut-off**. Examples from the built output: "Titan Solar Power Complaints: How to Get Out of Your Contract...", "Solar Escalator Clause Explained — How to Fight Annual Payment...". The page `/blog/solar-escalator-clause-what-it-is-how-to-fight` held 80 impressions at average position 6.95 with **zero clicks** and its title was one of the truncated 37. Two independent causes: the build-time fitter appended `...` after slicing mid-phrase, and 20 records had been truncated by hand and saved that way. The build-time cause is why the defect was invisible in review — the source data looked fine and the damage happened during generation.

**Verified:** Scan of all 583 built pages for a trailing ellipsis: 37 titles and 56 descriptions before, **0 and 0 after**. `pnpm build` pre-rendered 583 pages; `npx vitest run server/metaSnippet.test.ts` — 10 tests pass; `pnpm test` — 83 files, 815 tests pass, 3 skipped; `node scripts/trust-governance-audit.mjs` — passed.

**Recurrence guard:** `server/metaSnippet.test.ts` fails the build if any built page ships a title or description ending in an ellipsis, if either meta fitter reintroduces a slicing pattern, or if any article source record carries a `...` inside `metaTitle` or `metaDescription`. A snippet is a finished sentence, not a place to show that text was cut.

**Measure after:** 2026-12-05

## 2026-11-26 — ADT: four defects, including a shutdown year that contradicted our own article
**Class:** accuracy
**Changed:** `client/src/data/companies.ts` — corrected the shutdown date from **June 2023** to the announced exit of **24 January 2024** with operations substantially ceased by 30 June 2024, in both the summary and the timeline entry; corrected the loss figure from "over $200 million" to the **$89 million** Adjusted EBITDA loss over the first nine months of 2023; corrected `bbRating` from C+ to **Not Rated (out of business)** and `complaintCount` from 700+ to **404 (BBB, last 3 years, read 25 Nov 2026)**; softened the tagline from "Shut Down in 2023 — Your Warranty Is Gone" to "Exited Solar in 2024 — Your Warranty Is Uncertain". `client/src/data/blog-articles-batch6.ts` — added an **"ADT Solar customer service: what still works"** section and an **"ADT Solar lawsuits and complaints: what is actually documented"** section, and replaced the 132-character description with a 152-character one naming reviews, complaints, customer service, the 2024 shutdown, Sunpro and warranty.
**Why:** Search Console (1 Sep–22 Nov 2026): `/blog/adt-solar-complaints` holds **2,972 impressions at average position 11.0 with 19 clicks, a 0.64% CTR** — the third-largest impression mass on the site. Clusters: **873 impressions on reviews** ("adt solar reviews" 856 at pos 12.5), **227 on customer service** ("adt solar customer service" 223 at 10.9), **123 on lawsuits** ("adt solar lawsuit update" 47 at **position 6.6**) and 99 on out-of-business queries. The built page contained **zero** occurrences of "customer service", **zero** phone numbers and **zero** occurrences of "lawsuit". Separately, `companies.ts` said ADT "shut down entirely in June 2023" while the ADT article on the same site says January 2024 — **the site contradicted itself**. ADT's own newsroom release, read 26 Nov 2026 and dated **24 January 2024**, is headlined "ADT exits the residential solar business" and gives the solar segment's loss as an **$89 million Adjusted EBITDA loss** over the first nine months of 2023. The C+ rating and 700+ complaint count were worse than unverified: BBB publishes **no rating** for an out-of-business company, and our own article had already recorded **404 complaints read on 25 November 2026**, so the company page and the article published different numbers for the same fact. The lawsuit section deliberately reports only what public records support and states plainly that several dockets show voluntary dismissal or individual claims rather than a certified class, because implying a pending class action would be an unsupported first-party claim.
**Verified:** ADT newsroom release read 26 Nov 2026; `pnpm check` clean; `server/companyStatus.test.ts` 24 tests pass; `pnpm build` pre-rendered 583 pages; grep of the built ADT page for the new headings and the 152-character description.
**Recurrence guard:** any company record must be read against that company's own article before either ships, because the two are edited independently and can state different dates or figures for the same fact. The standing rule that a page ranking top 3 for a query must be checked for whether it answers the question applies here: **position 6.6 on "adt solar lawsuit update" with zero occurrences of "lawsuit"** is the same defect as position 2 on "sunnova bankruptcy" with zero occurrences of "Chapter 11".
**Measure after:** 2026-12-05.
## 2026-11-26 — Sunrun description named none of the four clusters it loses clicks on
**Class:** SEO
**Changed:** `client/src/data/blog-articles-batch9.ts` — replaced the Sunrun cancellation article's meta description, which named none of appointment, email, "get out" or the exit fee, with a **155-character** description that names all four and keeps a call to action.
**Why:** Search Console (1 Sep–22 Nov 2026) for `/blog/sunrun-solar-contract-cancellation-2026`: **2,007 impressions in the query detail and 9,343 in the page-level row at average position 8.0 with 79 clicks — a 0.85% CTR against a site-wide 1.01%** at the same position band. Clustered by theme, the zero-click mass is **332 impressions on appointment queries** (85 on "how to cancel sunrun appointment" at pos 9.0, 71 on "cancel sunrun appointment" at 9.9, 51 on the online variant at 9.2, 49 on "sunrun cancel appointment"), **122 on email queries** ("sunrun cancellation email" 121 at 8.8, "cancellations@sunrun.com" 78 at 8.8), and **848 on "get out" and "cancel" phrasing** including 235 on "how to get out of sunrun contract" at 10.3. The served description read *"The cancellation window, what Sunrun charges to exit, transfer and buyout options when you sell, and how to put it in writing"* and named none of those terms. The body already answers every cluster — the appointment section and the email answer were both added earlier the same day — so this was not a content gap but a **snippet gap**: the page ranks on body relevance while the description answers nothing the searcher typed. Same class as Blue Raven and the rescission page, and the pattern is now clear enough to state as a rule: **a near-winner page's top five query clusters must be checked against the description, not only the body.** The appointment cluster is also the most commercially useful, because someone trying to stop an installer visit is the most time-pressured visitor the site gets, and most competing pages discuss only cancelling the contract.
**Verified:** `pnpm build` pre-rendered 583 pages; the built Sunrun page's description reads 155 characters and contains "appointment", "email", "get out" and "fee"; `scripts/fix-1126-sunrun-description.py` is idempotent and prints a term-by-term confirmation.
**Recurrence guard:** for every near-winner page, extract the top five query clusters by impressions and confirm each cluster's core noun appears in the meta description. Body relevance can rank a page while the snippet still answers nothing, which caps CTR regardless of position.
**Measure after:** 2026-12-05.
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
