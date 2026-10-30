# Handoff: Cole Property Group, Bucket 3 build

Read this first, then `bucket-3-distress-assessment.md` in this folder.

## Context in one paragraph

Cole Property Group LLC (Houston Cole, Nashville, 615-640-4857) is a cash-offer house buyer. Chase is building them a lead engine with three buckets, specified by Bryan Pore of Pine Water Properties in a PDF dated 2026-09-29 (Google Drive folder "A wholesale engine": Seller LIst Data.pdf, AI_Caller_Training_Scripts.pdf, Code and violations.csv). Bucket 1 is on-market fixers, Bucket 2 is off-market owners in 15 luxury zips, Bucket 3 is distress (foreclosure, tax sale, code violations, probate, etc.) within 60 minutes of Nashville. The offer email engine already works (test deals on "1001 Test Lane", Oct 19-23, from cole@offers.colepropertygroupllc.com). Nothing about Cole lives in the solar-freedom-main repo; this folder is the only artifact there.

## Verified facts (2026-10-27)

- Metro Nashville code violations ArcGIS layer: open, no key, 43,276 rows, 3,026 OPEN, ~2,540 usable open (Housing, High Grass, CA Codes, Landlord Reg), ~150 new/week, edited today.
  `https://services2.arcgis.com/HdTo6HJqh92wn4D8/arcgis/rest/services/Property_Standards_Violations_2/FeatureServer/0/query`
  Fields: Request_Nbr, Date_Received, Property_APN, Property_Address, City, ZIP, Property_Owner, Reported_Problem, Status, Last_Activity_Date, Violations_Noted, Lon, Lat, Subtype_Description.
- Nashville Ledger notices (tnledger.com/Notices.aspx?noticesDate=MM/DD/YYYY): public HTML, foreclosures post Fridays.
- tennesseepostings.com: public HTML.
- tnpublicnotice.com: notice details behind reCAPTCHA. Do not bypass.
- Davidson Clerk & Master tax sale: Sept 14 and Oct 21 sales cancelled, next 2026-11-18, list in Ledger ~2026-10-30. Pages: /fees/delinquent-tax-sales/ and /fees/property-tax-schedule/.
- Davidson Assessor: padctn.org plus the Parcels layer on data.nashville.gov for owner, mailing address, year built, land/improvement values.
- Auction.com and HUD Home Store: bot-protected. Paid feed or manual.

## Decisions made

- Delivery = Supabase table -> GHL upsert (by parcel ID, one contact per owner, tag per stream) + dashboard view + CSV download button. No scheduled CSV email.
- Build order: Phase 1 code violations + assessor join + scoring first. Measure 2 weeks before buying ATTOM / PropertyRadar.
- Skip-trace step required before GHL push (assessor gives mailing address, not phone).
- Dedupe by owner name as well as address.

## Open questions for Chase

1. Which GHL location is Cole in, and is the offer email driven from GHL or n8n?
2. Where does the offer engine / dialer code live? Not found in any Cryptouprise repo this session could reach, nor Lovable, Vercel, Netlify, Replit.
3. Skip-trace vendor.
4. Which Supabase project hosts the Cole table (none of the 14 existing projects is named for it).

## Read MACHINE.md for the full-pipeline plan (Chase now owns the account; Houston is out).

## Build status (2026-10-30)

Stream 2 (Ledger) is also built: `python3 scripts/cole/bucket3_ledger.py --out out/cole --weeks 4 --details`.
Last 4 Fridays: 220 foreclosure notices (Davidson 86, Montgomery 40, Rutherford 31, Maury 15, Sumner 14, Wilson 12), 212 upcoming, 129 auctions within 30 days. 187 probate notices (decedent, county, docket; no address, match to assessor Owner).
Cole site backend found: Supabase project yazsmnsrwnkdazbeaidz (not in Chase's main org), React/TanStack on Cloudflare, GHL widget. Source code still not located.

Phase 1 stream 1 is built and runs: `python3 scripts/cole/bucket3_codes.py --out out/cole` (stdlib only, ~11 s).
Live result today: 2,467 open usable cases -> 2,339 properties -> 2,328 matched to assessor parcels (99.5%) -> 2,209 distinct owners.
1,359 absentee owners. 784 properties score 7+. 85 owners hold more than one flagged property (top: 8 each).
Outputs: s3_codes_properties.csv (one row per property, sorted by score), s3_codes_owners.csv (one row per owner), s3_codes_properties.json.
Table DDL: scripts/cole/s3_distress.sql. Set SUPABASE_URL + SUPABASE_SERVICE_KEY and the script upserts into s3_distress.
Data output is gitignored (out/) because this repo is public and the rows contain owner names and mailing addresses.

Next: (1) create the Cole Supabase project and apply the SQL, (2) schedule the script daily, (3) GHL upsert with tag `distress-codes` once the location ID is known, (4) Ledger foreclosure scraper (Fridays), (5) dashboard view.

## First build task (original plan, now done as described above)

A scheduled job (daily) that:
1. Queries the ArcGIS layer for Status='OPEN' and Subtype_Description in (Codes Housing Request, Codes High Grass and Weeds, CA Codes Case, Landlord Registration Violation).
2. Normalizes address per spec section 1.8, joins the Parcels layer on Property_APN for owner, mailing address, year built, land share.
3. Scores (open housing case +3, absentee owner +2, year built <= 1985 +1, land share >= 60% +2, multiple open cases +1).
4. Upserts into Supabase `s3_distress` keyed by parcel_id + distress_type, with source, source_url, pulled_at, as_of.
5. Upserts into GHL with tag `distress-codes`, removing the tag when a case leaves OPEN.
