# The Offer Machine (formerly Cole Property Group build)

Owner: Chase. Houston Cole is no longer involved. The GHL location is still named "Cole Property Group" and stays the system of record for contacts and conversations. The goal is a self-running pipeline: find distressed sellers, reach them, make offers from comps, sign, then find the buyer. Side products: sell the scrubbed lists, and feed the investor-finder app the buyer side.

## What we own today (verified 2026-10-30)

| Asset | Where | Notes |
|---|---|---|
| Public site + cash-offer form | colepropertygroupllc.com, React/TanStack on Cloudflare, GHL chat widget | 3-step form (address, details, offer), net calculator, SEO pages per zip and situation. Backed by Supabase project `yazsmnsrwnkdazbeaidz` (not in Chase's main Supabase org; source code not found in any reachable repo, Lovable, Vercel, Netlify, Replit) |
| Offer email engine | cole@offers.colepropertygroupllc.com | Sends offer / counter / PDF with accept-counter buttons. Source not located |
| GHL location | "Cole Property Group" | Contacts, SMS, email, calls, workflows |
| Bucket 3 stream 1 | `scripts/cole/bucket3_codes.py` | 2,339 open-code-case properties, 99.5% matched to owner. Daily |
| Bucket 3 stream 2 | `scripts/cole/bucket3_ledger.py` | ~55 foreclosure notices/week across 10 counties, ~60 probate estates/week. Fridays |
| Table DDL | `scripts/cole/s3_distress.sql` | |
| LLM routing pattern | `server/agents/agentLLM.ts` in this repo | Already routes DeepSeek via OpenRouter: deepseek-v4-flash ($0.14/$0.28 per M), v4-pro, v3.2, r1 |
| GHL client pattern | `server/ghlRouter.ts` | Reusable for the contact upsert |

## The pipeline, stage by stage

```
FIND -> SCRUB -> REACH -> QUALIFY -> OFFER -> CONTRACT -> DISPOSE
```

| Stage | What runs | Model | Status |
|---|---|---|---|
| 1. Find | Daily code violations, Friday Ledger foreclosures + probate, monthly tax sale lists, Bucket 2 assessor pull, Bucket 1 listing scrape | none | Streams 1 and 2 built |
| 2. Scrub | Dedupe by owner, join assessor, skip-trace for phone, DNC check, DeepSeek V4 Flash reads each record and writes a 1-line "why this seller" + motivation score + suggested first message. Probate: match decedent to assessor owner | deepseek-v4-flash | Next |
| 3. Reach | GHL upsert with tag per stream. Workflows: SMS day 0, email day 1, AI call day 2 (scripts from AI_Caller_Training_Scripts.pdf), 2-week drip | GHL + DeepSeek for reply classification | Needs location ID wiring |
| 4. Qualify | Reply classifier tags: interested / not now / DNC / wrong number. Interested -> ask condition, timeline, number they want. Books a call or moves straight to offer | deepseek-v4-flash | Next |
| 5. Offer | Comps pull (RentCast or ATTOM AVM + recent sales within 0.5 mi), ARV, repair estimate from condition answers, MAO = ARV x 0.70 - repairs - assignment fee. Offer email via existing engine, PDF, accept/counter buttons. Counter logic bounded by MAO | deepseek-v4-pro for repair + comp reasoning, deterministic math for MAO | Comps data source to pick |
| 6. Contract | Accepted -> e-sign TN PSA, EMD instructions to title, GHL stage "Under Contract" | none | Needs PSA template + e-sign vendor |
| 7. Dispose | Push deal sheet to buyer list (investor-finder app output + GHL buyer tags), blast, collect offers, assign | deepseek-v4-flash for deal sheet copy | Needs investor-finder app hookup |

## Money paths

1. Assignment fees on contracted deals (core).
2. List sales: the scrubbed, scored, skip-traced Bucket 3 list per county per week. Same pipeline, new geography = new product. Nashville first, then any county with an open codes API or a public-notice paper.
3. Buyer-side data: the investor-finder app's list is the dispose channel and is itself sellable.

## Simplify rules

- One table (`s3_distress`) is the source of truth. GHL is for conversations. Dashboard reads the table and GHL.
- Every record carries source, source_url, pulled_at, as_of. No row without provenance.
- Deterministic math for offers. The model explains and drafts, it does not set the price.
- Any list that leaves the building has DNC scrubbed and a provenance column.
- Daily job, Friday job, monthly job. Nothing else on a timer.

## Open items (ordered)

1. Locate the dashboard + offer-engine source. The Supabase project `yazsmnsrwnkdazbeaidz` is the key. Options: add the repo via GitHub to a Claude Code session, or run `claude remote-control` in the folder on Chase's machine.
2. GHL: API key + location ID for "Cole Property Group" into env. Then wire stream 1 and 2 upserts.
3. Skip-trace vendor (BatchData, PropertyRadar, or Tracerfy). Per-record cost.
4. Comps source for stage 5 (RentCast is cheapest to start).
5. Create the Bucket 3 table in the Cole Supabase project and schedule the two scripts.
