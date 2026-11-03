# Readable pages and outside-AI access — November 3, 2026

## What changed for visitors

The article renderer now actually styles paragraphs, headings, lists, links and tables. The project had `prose` class names and a Typography package, but the Tailwind Typography styles were not enabled. Scoped article CSS now supplies real reading styles without globally changing unrelated pages. Long paragraphs split at sentence boundaries while preserving words, inline emphasis and links. DB section-array posts no longer silently render only their first entry.

Blog layouts now have responsive heroes, a clear review action in the hero, one midpoint action, an end action and usable reading width. Missing solar-topic heroes can use the existing managed panels-only asset; unrelated missing-image posts use a neutral document treatment, not misleading stock people or geography. This is not a new custom image campaign for every article.

Approved priority-city guides now show document checklist cards, separated steps, short readable text and distinct CTAs. The intake appears early on mobile and beside the article on desktop. Existing individual city heroes, facts, canonical/index policies and Vegas booking controls remain. Sources were not re-researched as part of this renderer change.

## Argon now sees real captures, not just prose

Two actual Chromium screenshot requests were sent to `google/gemini-4-argon` through OpenRouter: Houston at 390×844, and the existing `how-to-get-out-of-a-solar-contract` blog at 1440×900. Each included top/middle/bottom captures. Receipts #21030001 and #21030002 record model, capture type, sampled regions, fingerprint, time, cost source and limits. Both returned `needs_repair`—we did not manufacture a pass.

Argon correctly identified mobile chat/CTA collisions, redundant floating callback controls, repeated review headings and footer overlap. Those findings produced concrete presentation fixes: third-party unsolicited chat teaser suppressed only on article/city routes, mobile chat launcher moved 126px above the bottom, redundant callback pill suppressed on these layouts, distinct city form/midpoint headings and footer clearance.

Argon's callback-button contrast complaint required human/deterministic checking: that submit button was intentionally disabled because the phone field was empty. Required phone validation remains. A visible explanation now says to enter a phone number to enable the request; no fake enabled submit was introduced.

After-fix Chromium checks verified no horizontal overflow, hidden unsolicited teaser, a usable chat launcher, no duplicate callback pill, one remaining original Houston CTA heading and preserved callback validation. This is preview evidence, not a second Argon pass or a claim that rankings/appointments increased. No leads, bookings or outbound messages were submitted.

## The ongoing drafting quality gate

Content and Editor now audit actual draft paragraph density, useful headings, lists/callouts and CTA structure. Dense drafts cannot pass just because a model assigned a high score. Same-article revision retains identity and evidence. Editor is explicitly routed to Argon. These are editorial heuristics, not Google rules and not rendered screenshot proof. Missing imagery requires a real managed-asset brief; fake image markup does not satisfy it. Missing generated imagery alone does not burn repeated text-revision rounds.

## Let another AI work without routine Manus chat

The existing Admin REST API now supports scoped blog source reads, managed image uploads, exact-source-fingerprinted repair drafts, Argon screenshot reviews, dated scorecard summaries and durable work status. Owner-only Outcomes controls create/revoke a separate limited key. No key was created during this implementation.

The outside AI can assess and draft; substantive publication remains owner-approved. City source/React/CSS changes still require an authorized GitHub PR and this host's actual build/publication step. A merge is not proof of deployment; no automatic deploy bridge was created.

Browser-native screenshot API input is the full visual route. The owner's in-page DOM capture also works, but explicitly excludes inputs, iframes and third-party chat. Images a CDN won't let the browser serializer embed can become neutral placeholders; do not claim their subject was visually verified. Top/middle/bottom sampling, one width and a 12,000px capture ceiling are disclosed. Recurring autonomous browser screenshot collection is not yet wired into the native five-minute worker.

## Business measurement and unfinished work

Success means qualified organic clicks, durable leads and verifiable appointments—not picture counts, internal SEO scores or generated drafts. The external summary preserves snapshot coverage dates and reports appointment data as unverified rather than zero. Reliable end-to-end appointment attribution and comprehensive automatic competitor/AI-citation tracking remain unfinished. No claim of #1 rankings or daily gains is made.

The production worker's latest checked callback at 8:07 AM Mountain returned HTTP 200 in 775ms with `idle: no due persisted work; no model called`. That proves a real tick succeeded, not that it improved a page or completed the entire editorial pipeline.

The public release must be checked after the managed checkpoint/publication flow. This receipt and the portable outside-AI instructions distinguish preview-verified changes from live deployment.

## Final release validation

TypeScript passed. The full deterministic suite passed 73 test files and 677 tests, with three explicit live probes skipped. The production build passed and prerendered 574 pages. Representative desktop/mobile browser checks and two separate paid Argon screenshot reviews were completed. Generated-only sitemap/AI-index differences were restored; existing city eligibility, redirect ledger, robots and unrelated analytics source were unchanged. The checkpoint is restorable; it is not itself proof of public deployment.
