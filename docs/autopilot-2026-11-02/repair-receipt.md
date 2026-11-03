# Solar Freedom — accountable SEO repair receipt

**November 2, 2026. This is an implementation and validation receipt, not a ranking-recovery claim.**

## Why running agents did not guarantee growing traffic

The operating audit found repeated changes to a small set of pages, an ever-growing recommendation queue, weak content checks, and no dependable before-and-after outcome loop. In the audited seven-day period there were 56 live-change receipts across nine URLs—not 56 new articles or independently successful experiments. GoodLeap had accumulated 130 FAQs. The agent could also label malformed output completed, and an internal publication status did not prove a page was published. More AI calls did not fix these controls.

## What changed

1. **One safe existing-page change per executor callback.** Eligibility filtering happens before selecting the queue, claims are atomic, and terminal/approval-gated actions cannot be silently rerun. Equivalent targets are protected against repeated editing. Exact before/after data and rollback are committed with the actual page change. Pages with unmeasured changes are held rather than repeatedly rewritten. FAQ total cap is 10; existing overgrown FAQ lists are blocked for review, not silently deleted.
2. **Real content evidence before approval.** Content uses actual draft word counts, preserves the same-article Editor revision loop, and deduplicates normalized open targets. Editor reviews full submitted drafts and stores a fingerprint-linked decision. Manager can request owner publication but cannot label a draft published or bypass the owner's publish control. Historical false publication labels are exposed, not rewritten into fictional history.
3. **One compact SEO delivery per scheduled analysis.** Invalid JSON, empty/truncated replies and invalid published targets fail closed. Scheduled analysis no longer performs a long-form rewrite in the same callback. Model output is a proposal, not evidence of a public change. Source-backed competitor observations are now input to SEO, not merely a dashboard decoration.
4. **Dated outcome follow-up.** The existing daily scorecard checks at most one eligible experiment using equal, nonoverlapping seven-day Google Search Console windows. Low traffic, overlapping edits, missing data and immature periods stay unknown. It does not fabricate causal lift. New rolling scorecards use exactly 28 inclusive Pacific calendar dates; older saved rows retain their original ranges.
5. **Visible receipts in the existing Outcomes screen.** Open **Admin → Outcomes → Accountable SEO autopilot** for run IDs, actual recorded model, public-change links, measured/pending/confounded status, and dated competitor sources. A run finishing and a page changing are explicitly different.
6. **Correct model requests and accounting.** Built-in requests now pass the actual selected model and correct token-cap parameter. Scheduled reasoning is bounded, timed-out requests can be cancelled, fallback uses its actual model name, and missing cost stays unknown. Filling missing defaults no longer overwrites existing model choices.

## What was tested with real services

Both named candidate IDs are available in the model selector: `deepseek/deepseek-v4.1-flash` and `google/gemini-4-argon`. Gemini Argon passed a source-backed structured fixture in about 10 seconds (provider-reported $0.00825264) and a separate full real-data SEO delivery. That full run is **#52500001**, with one exact-target action and one message. Its proposed Sunrun edit was correctly **blocked** because an earlier public change had not been measured. **No page change or ranking gain is claimed for that run.** DeepSeek's first bounded fixture was truncated; it was not promoted. Saved production selections were not changed by these tests.

The original Qwen SEO route was also tested. One call was truncated; another timed out, then the fallback produced fields that failed the strict metadata contract. Those runs are now honestly marked failed rather than completed. These findings prompted the compact scheduled contract and explicit reasoning/token-budget correction. The final default-route recheck is recorded separately in the accompanying runtime evidence.

A real outcome probe retrieved a matched seven-day-before/seven-day-after experiment from Search Console. After the dry run passed, the same writer persisted one mature historical measurement (change #660004): September 11–17 versus September 19–25, 2026. Clicks were 2 then 1; impressions were 108 then 131; average position was 16.75 then 9.46. These mixed historical results are not a new repair win or proof of causation. The writer and source path are verified; the new code has not yet had time to produce a post-repair outcome.

## Still not claimed or silently done

- No guarantee of number-one Google rankings, daily ranking gains, or citations in Grok, Perplexity, ChatGPT or other AI answers. Existing crawler access does not prove inclusion.
- No mass reindexing, new city-index eligibility, new legal article publication, external outreach, or automatic change of the critical production model.
- The 130-FAQ legacy page still needs an owner-reviewed cleanup; no content was bulk-deleted.
- Historical duplicate ideas/queued tasks were not mass-deleted. Invalid/blocked rows need explicit triage; their existence is not called completed work.
- Daily competitor scheduling awaits the owner's choice of a separate task or replacement of the old indexing schedule. The first three-topic source review is complete and saved into the app; recurring research is **not yet armed**.
- A saved WebDev checkpoint is not itself proof the public website has deployed the new code. Publish the latest checkpoint through the project UI unless auto-publish is enabled, then verify the public Outcomes screen. Existing public URLs, redirects, city eligibility and analytics code were preserved.

**Success measure:** verified useful changes, qualified leads and appointments over comparable date windows—not number of model calls, queued recommendations, or artificially perfect scores.

## Final default-route recheck

The compact default scheduled SEO delivery completed as **run #52530001**, using the actual **GPT-5 Mini fallback** after Qwen3.7 Plus timed out. It created one exact-target internal-link recommendation and one message. Action **#20820001** was blocked before mutation because Sunrun had a prior unmeasured public change. This proves a validated run/receipt and the protective executor path, not a fresh page change. The primary Qwen route is still slow; its timeout is exposed rather than hidden, and the saved production choice was not silently replaced.

The exact release checks passed **62 test files, 484 tests, with three opt-in live probes skipped**. The production build succeeded and the existing Outcomes UI was visually checked.

Official reasoning-budget reference used for the truncation correction: https://openrouter.ai/docs/guides/best-practices/reasoning-tokens . Reasoning consumes completion budget; hiding reasoning is not the same as limiting it. Scheduled calls now use an explicit low-effort control for the verified model families, with output validation retained.

## Subsequent owner-authorized SEO model change — November 2, 2026

After the earlier checkpoint, the owner explicitly requested DeepSeek 4.1 or Argon and rejected GPT Mini for SEO. The saved SEO Intel model is now **`google/gemini-4-argon`**, re-read from the database to verify. The new code defaults SEO to Argon, rejects non-approved SEO routes before provider calls, and forbids GPT fallback even if a caller asks for it. Page-edit executors also use the SEO model regardless of which agent queued the action. Other roles were not changed. These enforcement changes require the new project checkpoint to be deployed; the saved model row takes effect immediately in runtimes that read it. Argon already passed the previously recorded fixture and full real-data delivery test. The updated full deterministic suite passed 501 tests in 63 files, with three opt-in probes skipped.
