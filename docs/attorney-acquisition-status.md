# Attorney Partner Acquisition Status

**Updated:** September 2, 2026

## Source of record

Overnight discovery uses **Justia public consumer-law lawyer directories**, not Google Maps. Heartbeat jobs:

- `agent-attorney-discovery-mountain-2-dst` (2:00 AM America/Denver during daylight time)
- `agent-attorney-discovery-mountain-2-standard` (2:00 AM America/Denver during standard time)

Admin **Run research** and Money Maker research actions call the same Justia producer. Maps Places remains in the tree but is not the default path.

The producer stores only fields present on the public listing (name, firm, city, phone, Justia profile URL). It does not email, call, text, or send LinkedIn messages.

## Remaining constraint

`reconcileDailyOperatingCycle` must run once in production so Heartbeat actually creates the new jobs. Automatic outreach is still forbidden.
