# Solar Freedom: What Is Actually Happening

**Purpose.** This is the one-page operating map for Solar Freedom. It explains the system in plain English: what exists, what the agents actually do, what is working, what is broken, and what must happen next.

> **The business goal is simple:** help a homeowner understand whether their solar-contract problem may be fightable, then make it easy to request a no-obligation 15–20 minute case-review call or use the chat widget. Every agent and page should serve that goal.

## 1. The System Today

| Area | What it is supposed to do | What it currently does |
|---|---|---|
| Website | Explain the problem, build trust, and capture calls/forms/chats. | The public site is live at `breakyoursolarcontract.com` with case-review calls to action. |
| Outcomes dashboard | Show whether organic visibility and conversion results are improving. | Shows verified Search Console scorecard metrics, a 30-day CTR/ranking chart, action/run evidence, loading states, and page/target-keyword filtering. |
| SEO Intel | Find the strongest SEO opportunities and turn them into specific work. | Reads fresh GSC data when available, creates bounded actions, and can save valid BlogStudio optimization drafts. It does **not** claim a ranking win until future measurement supports it. |
| Content Agent | Write useful, empathetic, SEO-targeted articles. | Creates drafts. It now must pass a minimum completeness/FAQ/case-review CTA check before Editor sees the draft. |
| Editor Agent | Check drafts for quality, SEO, compliance, and completeness. | Approves, rejects, or requests revisions. Its feedback now forces Content to revise the **same article** instead of quietly choosing a different topic. |
| BlogStudio | Store/edit drafts and publish approved content. | Stores the reviewable content drafts. The human-friendly “one-click approval → publish → verification → measure” flow is not yet unified in one place. |
| Action Executor | Apply small, safe, typed SEO changes. | Can update certain already-published, index-eligible pages; records before/after values and a rollback plan. It does not publish brand-new long-form articles. |
| Money Maker | Find, rank, and prepare attorney-partner acquisition work. | The attorney board and safe LinkedIn-draft workflow exist. The scheduled Money Maker run is currently unreliable because its model route is timing out. |
| Manager | Supervise agents, performance, failures, and cost. | Creates oversight actions and now raises P1 visibility when daily SEO measurement or post-measurement execution evidence is missing. |

## 2. What “Completed” Actually Means

This is the most important distinction. A completed agent run does **not** automatically mean a customer-facing page was changed or money was made.

| Status | Plain-English meaning | Example |
|---|---|---|
| **Idea / recommendation** | The agent identified an opportunity. Nothing has changed yet. | “Improve CTR on Sunrun cancellation page.” |
| **Reviewable action** | A tracked task exists with an owner or executor. | A P1 metadata or internal-link action appears in the queue. |
| **Reviewable draft** | A proposed article/page change is saved in BlogStudio. It is not live. | “SEO Optimization — cancel sunrun solar contract.” |
| **Editor rejected / revision needed** | The draft failed quality or compliance checks. It cannot be published as-is. | A cut-off article was rejected because it ended mid-sentence. |
| **Approved** | It passed the review stage. It still needs a human publish decision unless it is a narrow typed executor action. | A BlogStudio draft ready for approval. |
| **Implemented** | A typed executor actually changed an eligible published page and logged before/after values. | Meta title, internal link, or FAQ schema update. |
| **Measured** | A later Search Console / analytics snapshot can be compared against the pre-change baseline. | CTR or average position after enough time has passed. |
| **Blocked** | The system refused unsafe, missing-data, invalid-slug, or failed-provider work and recorded why. | A non-indexable target or failed GSC refresh. |

## 3. What Is Working

### SEO measurement and visibility

The daily SEO operating foundation is working better than it was. Search Console data can refresh, the scorecard now persists **clicks, impressions, CTR, and impression-weighted average position**, and Outcomes displays a 30-day trend. It also has a page-or-target-keyword selector, so the chart can focus on a specific measured page rather than only the site total.

The current dashboard has displayed a recent verified organic snapshot of **80 clicks, 6,854 impressions, 1.17% CTR, and 13.18 average position**. An earlier verified baseline was **31 clicks, 3,944 impressions, 0.79% CTR, and 15.28 average position**. These are snapshots from different reporting periods; they indicate visibility and a potential improvement, but they are **not proof of a lasting SEO win** until the dashboard accumulates like-for-like daily comparisons.

### SEO execution safeguards

SEO Intel now refreshes GSC before analysis if its measurements are stale, validates that optimization targets correspond to real published slugs, and records a visible block rather than silently losing invalid work. A measured run created a valid BlogStudio optimization draft for the existing `cancel-sunrun-solar-contract` page and created actionable SEO items. The narrow Action Executor can apply supported changes to eligible published pages and preserves a rollback record.

### Content quality is no longer a one-pass gamble

Content drafts now face an initial deterministic self-check before Editor review. A draft is held for revision if it is too short, looks truncated, lacks an FAQ, or fails to include a no-obligation case-review CTA. Editor rejection/revision feedback is mandatory work on the same title/slug/keyword, not an excuse for Content to create a new article.

### Attorney pipeline safety and visibility

The Attorney Pipeline contains source-backed prospects, evidence links, priorities, public contact data where available, and safe LinkedIn lookup/draft controls. A per-attorney button can generate a personalized **review-only** LinkedIn message. Nothing is automatically sent through LinkedIn, email, phone, SMS, or GHL.

## 4. What Is Not Working Well Enough

| Problem | Why it matters | Required repair |
|---|---|---|
| **Money Maker scheduled runs time out** | Attorney partner acquisition work can stop without producing new reviewable work. | Test an alternate model with the real compact prompt; reduce timeout-prone context; preserve a clear failed-run receipt; do not route production work until the test passes. |
| **The content approval journey is scattered** | You must look across BlogStudio, actions, and agent history to understand whether work is ready. | Add one visible lifecycle card: idea → self-QA → Editor → your approval → published → verification → measured result. |
| **“Completed” is still too easy to misread** | A completed run can be an analysis, a draft, or an actual page edit. | Put an output ledger and status badge on every agent result. |
| **No complete analytics evidence for CTA engagement/time on page** | We cannot honestly prove that a particular CTA or page experience is improving without events. | Confirm and repair first-party CTA, page-view, scroll, chat, form, booked-call, and qualified-lead event capture. |
| **Daily history is still new** | One or two snapshots cannot prove a durable trend. | Preserve daily measurements and compare matching windows; only call something an improvement when the data supports it. |
| **Model monitoring is too narrow** | Qwen pricing/spend is monitored, but there is no full weekly best-model test tournament. | Add a low-frequency weekly model/deal evaluation receipt with live price, uptime, latency, valid structured-output rate, and cost. |

## 5. The Operating Loop We Are Building

```text
1. Measure daily
   GSC rankings/CTR + website engagement + leads/appointments
        ↓
2. Explain the problem
   Which page/keyword/CTA is losing clicks or conversions, and why?
        ↓
3. Create bounded work
   SEO action, metadata/internal-link/FAQ update, or content draft
        ↓
4. Quality loop
   Content self-QA → Editor review → required revision until acceptable
        ↓
5. Your decision
   Clear Approve / Reject / Request change controls for anything long-form or material
        ↓
6. Implement and verify
   Publish or execute; check URL, index eligibility, structured data, and rollback record
        ↓
7. Measure again
   Compare a later like-for-like snapshot; show click, CTR, ranking, lead, and appointment movement
```

## 6. What You Should Expect To See Each Day

Every daily report should show the following, even if the answer is “no data” or “blocked.”

| Question | Required visible answer |
|---|---|
| Are we getting seen? | Clicks, impressions, CTR, average position, date range, and comparison to the prior equivalent snapshot. |
| Which pages need attention? | Ranked list of pages/keywords with the biggest visibility or CTR opportunity. |
| Did the SEO agent do anything? | Exact action/draft, URL/slug, work status, owner, and whether it was actually applied. |
| Did content improve? | Self-QA result, Editor score/feedback, revision number, and publish status. |
| Did it create business results? | CTA clicks, chat starts, form submits, calls/appointments, qualified leads, and outcome status—once instrumentation is confirmed. |
| Is anything broken? | One plain-English P1 block with the actual error and who/what will resolve it. |

## 7. The Immediate Priority Order

1. **Repair Money Maker reliability.** It is the only agent currently known to be repeatedly failing in scheduled operation.
2. **Build the unified content/SEO lifecycle card in BlogStudio/Post Editor.** You need one click path from a draft to an accountable approval and published result.
3. **Confirm conversion instrumentation.** CTR alone is not revenue. CTA, chat, form, booked-call, qualified-lead, and outcome events must be stored and visible.
4. **Create the weekly OpenRouter model evaluation.** It should test candidates such as `z-ai/glm-5.3-flash` and `google/gemini-3.8-flash` with a real compact agent task before they touch critical work.
5. **Add the owner output ledger.** This prevents “the agent completed” from being confused with “the page is live and generating more cases.”

## 8. What You Need To Do

For the moment, your job should be limited to simple decisions:

1. Review drafts that reach **Approved**.
2. Click **Approve & publish** only after reading the final article/page change.
3. Review P1 blocked items, especially Money Maker failures or missing conversion data.
4. Watch the daily Outcomes dashboard rather than trying to reconstruct the story from agent chat logs.

Everything else should be automated, measured, or visibly blocked with a reason. The system should never make you guess whether it is doing work.
