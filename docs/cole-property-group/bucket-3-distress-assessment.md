# Cole Property Group: Bucket 3 (Middle TN Distress) Assessment

Date: 2026-10-27

## What exists today

| Piece | Where | State |
|---|---|---|
| Search spec (3 buckets) | Google Drive > "A wholesale engine" > Seller LIst Data.pdf (Bryan Pore, Pine Water Properties, v2, 2026-09-29) | Done. Defines Bucket 1 (on-market fixers), Bucket 2 (off-market luxury-zip owners, ~24,468 records), Bucket 3 (distress) |
| AI caller scripts | Same folder > AI_Caller_Training_Scripts.pdf | Done. Agent script + seller script, disclosure and DNC rules |
| Code violations pull | Same folder > Code and violations.csv (16 MB, uploaded twice) | One-time export of the Metro Nashville codes layer, Sept 29 |
| Offer engine | cole@offers.colepropertygroupllc.com (Houston Cole, 615-640-4857), earlier tests from keenapprntc@gmail.com | Working. Oct 19-23 test deals on "1001 Test Lane": offer, counter, call-request, PDF attached, accept/counter buttons, Tennessee PSA language |
| Code in this repo | none | Nothing about Cole lives in solar-freedom-main |

The offer engine's source code was not found in any repo this session can reach, Lovable, Vercel, Netlify, or Replit. It is likely a GHL/n8n flow or a repo outside this session's scope.

## Bucket 3 definition (from the spec)

Geography: every TN zip within a 60-minute drive of downtown Nashville or Mount Juliet. 127 zips, 14 counties. Core: Davidson, Williamson, Rutherford, Wilson, Sumner, Cheatham, Robertson.

Distress types: foreclosure notices, tax delinquent, tax sales, auctions, REO, open code violations, probate, lis pendens, bankruptcy (optional: divorce, evictions).

## Live source check (2026-10-27)

| Source | Access | Measured today | Refresh |
|---|---|---|---|
| Metro Nashville code violations (ArcGIS FeatureServer) | Open API, no key | 43,276 total, 3,026 OPEN. Open and usable (Housing 1,919 + High Grass 402 + CA Codes 214 + Landlord Reg 5) = ~2,540. New cases: 146 in last 7 days, 993 in last 30 days. Layer last edited today | Daily is possible. Weekly is plenty |
| Nashville Ledger notices (tnledger.com) | Public HTML, scrapeable | Page loads. Foreclosure notices publish Fridays | Weekly |
| tennesseepostings.com | Public HTML | Loads (327 KB) | Weekly |
| tnpublicnotice.com | Search open, each notice behind reCAPTCHA | Snippets only, no addresses | Manual or TPA email alerts |
| Davidson Clerk & Master tax sale | Public page with list downloads | Sept 14 and Oct 21 sales cancelled. Next sale 2026-11-18, list in Ledger ~2026-10-30 | Monthly, weekly in the 6 weeks before a sale |
| Davidson Assessor (padctn.org) | Open site + bulk Parcels layer on data.nashville.gov | Loads | Monthly (join key for owner + mailing address) |
| Auction.com, HUD Home Store | Bot-protected / captcha | Blocked | Paid feed (PropStream, ATTOM, PropertyRadar) or manual |
| Trustee delinquent rolls, probate, lis pendens, PACER | Records request / paid | Not attempted yet | Monthly / weekly |

## How many are available

Bucket 3 is not one number. It is a few streams with very different sizes.

| Stream | Davidson County only | Notes |
|---|---|---|
| Open code violations (usable types) | ~2,540 right now | Churns ~150/week. Best free, structured, daily source. Only Davidson has this feed. |
| Foreclosure notices | Low dozens per week (Ledger) across Middle TN | Highest motivation, shortest window. Must be matched to assessor for owner name |
| Tax sale list | Hundreds per sale, 3 to 4 sales a year | Next Davidson sale 2026-11-18. Cancellations are common |
| Tax delinquent (not yet at sale) | Thousands | Requires Trustee records request or paid data |
| Probate | Dozens per week in Ledger | No address; match decedent name to assessor owner |

Realistic Phase 1 pool: ~2,500 open code-violation properties in Davidson, refreshed weekly, plus 30 to 60 new foreclosure notices a week across the 60-minute zone. Add owner mailing address and absentee flag from the assessor layer.

## Difficulty

| Phase | What | Effort | Blockers |
|---|---|---|---|
| 1. Code violations + assessor join | Pull OPEN cases by subtype, dedupe by normalized address + zip, join Parcels layer for owner, mailing address, year built, land share. Load into a table. Score: open housing case + absentee owner + older home = top of list | 2 to 3 days | None. Both sources are open APIs |
| 2. Ledger foreclosure + probate scrape | Weekly Friday pull, parse address, sale date, trustee. Match probate decedent to owner name | 3 to 5 days | HTML parsing is fragile. tnpublicnotice is captcha-walled and should not be bypassed |
| 3. Tax sale lists | Calendar each county's sale, download the xlsx/pdf when posted, geocode parcels | 2 to 3 days per county | Lists post late and sales get cancelled |
| 4. Paid fill (ATTOM / PropertyRadar / PropStream) | Lis pendens, tax delinquent rolls, auctions, REO in one feed | 1 to 2 days integration | Subscription cost. Replaces most of phase 3 and the blocked sources |
| 5. Hand-off to the dialer | Push scored rows into the AI caller with the seller script and DNC suppression | 1 to 2 days | Needs skip-tracing for phone numbers (assessor gives mailing address, not phone) |

Bucket 3 is harder than Bucket 2 (which is one assessor export plus an AVM) and easier than Bucket 1 (which depends on MLS/Redfin scraping). Phase 1 alone is a real, sellable list within a week.

## Recommended cadence

| Stream | Cadence |
|---|---|
| Code violations | Daily pull, weekly list to callers |
| Foreclosure notices | Every Friday after the Ledger posts |
| Tax sale lists | Monthly, then weekly in the 6 weeks before each county's sale |
| Assessor join | Monthly re-pull of the Parcels layer |
| Paid feed (if bought) | Daily or weekly per vendor |

## Holes to poke

- Only Davidson publishes a code-violations API. The other 13 counties need a paid feed or manual pulls, so "127 zips" is really Davidson-first.
- Foreclosure notices give a short runway (often 3 to 4 weeks to sale). The dialer has to run the same day the list lands.
- Assessor data gives mailing address, not phone. Skip-tracing is a separate cost per record.
- Code violations include landlords with lots of properties. Dedupe by owner name, not just address, or the callers will hit the same person ten times.
- The AI caller disclosure and DNC rules from the script PDF must be wired before any Bucket 3 calling, since these owners are the most likely to complain.
- The spec says a 0 count for an unsourced distress type means "not sourced", not "none". Reports to Houston should say which sources were actually pulled.

## Suggested next step

Build Phase 1 (code violations + assessor join + scoring) as a scheduled job writing to a Supabase table, with a weekly CSV to Houston Cole. Measure reply and appointment rate for 2 weeks before paying for ATTOM or PropertyRadar.
