# Attorney Partner Acquisition Status

**Updated:** September 3, 2026

## What is actually running

The attorney prospect pool still contains the existing public-business cards. No firm has been emailed, enrolled, called, texted, or sent a LinkedIn message by the system.

Google Maps research is exhausted and is no longer the producer. Discovery is a public Justia consumer-law listing fetch:

- One rotating state per run
- URL shape: `https://www.justia.com/lawyers/consumer-law/{state}/`
- Saves `firmName`, `state`, `sourceUrl`, plus website/phone/city only if they are on the card
- `discoveredVia: justia_public_directory`
- Dedupe on (`firmName`, `state`)
- Max 8 cards
- Empty or blocked pages insert zero rows and write a blocked receipt
- No Firecrawl, no Maps, no invented emails

Money Maker `research_firm` actions and admin **Run research** both call this producer.

## Nightly schedule (code, not yet live until this ships)

Heartbeat DST pair, 2:00 AM America/Denver, same guard pattern as Manager:

| Job | UTC cron | Window |
|---|---|---|
| `agent-attorney-research-mountain-2-dst` | `0 0 8 * * *` | 2:00 AM MDT |
| `agent-attorney-research-mountain-2-standard` | `0 0 9 * * *` | 2:00 AM MST |

Path: `/api/scheduled/attorney-research`. After merge, reconcile Heartbeat from admin so the pair is created. Do not treat the schedule as live until that reconcile succeeds.

## Remaining constraint

This producer fills research cards only. It does not score partnership-readiness, send outreach, or collect invoices. Florida and Nevada **SEO pages** stay quarantined; those states may still appear in attorney rotation because that is a marketplace source, not a ranking URL.
