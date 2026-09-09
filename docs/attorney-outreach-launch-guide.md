# Attorney Outreach — First Batch Launch Guide

## Current verified pipeline

| Measure | Count | Meaning |
|---|---:|---|
| Total public-business attorney prospects | 100 | Source-backed law-firm records in the Attorney Pipeline. |
| Prospects with a public email address | 61 | A public address is available; this does not by itself prove partnership capacity or consent. |
| Ready-to-pitch prospects | 9 | Records moved into the outreach-review stage. |
| Direct-solar priority prospects | 7 | Stronger public solar-practice evidence, ranked for human review. |
| First send batch | 2 | Only the highest-confidence ready-to-pitch records with public business email addresses. |

## First batch file

Use `docs/attorney-first-outreach-batch.csv`. It contains the two approved-for-review records with their public evidence URLs and personalized notes.

> Do not send to the remaining 59 public-email records as a bulk blast. Review the public source, recipient, and personalized message first. The first two records were selected because they have the clearest verified solar-practice evidence and higher confidence scores.

## Expanded review batch

Use `docs/attorney-verify-before-send-batch.csv` for the next nine prospects. These records have public business emails and moderate-to-high evidence confidence, but they remain in the `researching` stage. They are **not ready for a blind campaign import**. Open the supplied source URL, confirm the practice fit, then change `campaign_status` to `approved_for_import` for each one you personally approve.

This provides an 11-person reviewed launch universe: two ready-to-send records plus nine fast-review records. A further 13 public-email records meet the same evidence-confidence threshold but are not included in the first expanded review set; 37 other public-email records are held because their evidence, fit, or readiness is weaker.

## Instantly status

An **Instantly** connector exists in the project configuration but is currently **disabled**. No Instantly sending path is active from the Solar Freedom app today. The app does not automatically send attorney outreach.

The immediate no-code path is to import the two-row CSV manually into an Instantly campaign after the connector/account is enabled and authenticated. Keep the campaign paused until the copy, sender identity, suppression list, and unsubscribe footer are verified in Instantly.

## Simple 8:00 AM launch sequence

1. Download `attorney-first-outreach-batch.csv`.
2. Open your Instantly account and create a new campaign named `Solar Freedom — Attorney Partnerships — First Review Batch`.
3. Import the CSV and map `first_name`, `company_name`, `email`, `city`, `state`, `website`, and `personalization_note`.
4. Use a single plain-text message. Do not make legal, revenue, lead-volume, exclusivity, or outcome promises that cannot be substantiated.
5. Review both rendered emails individually. Confirm the public source page matches the message before scheduling.
6. Add the appropriate company identity, physical mailing address, and unsubscribe mechanism required by the sending platform and applicable outreach rules.
7. Send only the two reviewed records. Record the send in Attorney Pipeline by moving the prospect to `Contacted` and adding the campaign name/date to outreach notes.
8. After replies and bounce results are available, decide whether to expand to the next reviewed group. Do not expand merely because a campaign technically sent.

## Plain-text first outreach structure

**Subject:** Quick question about solar-contract matters in {{state}}

Hi {{first_name}},

I found {{company_name}} while reviewing firms that publicly handle solar-contract or solar-fraud matters in {{state}}. We help homeowners organize contract and sales-practice information before a legal review, and I wanted to ask whether your firm is open to reviewing qualified solar-contract matters or discussing a referral relationship.

If this is not a fit, I will not follow up. If it is, I can send a short overview of the information we collect before a homeowner is introduced.

Best,

{{sender_name}}

Solar Freedom

## Required evidence before expansion

Before adding a prospect to the next batch, confirm:

- The email is a public business address from the recorded source or official firm website.
- The source URL is still live and supports the stated practice-area alignment.
- The message names no unverified result, case volume, fee arrangement, or attorney relationship.
- The recipient has not opted out, bounced, or been marked not a fit.
- The campaign result is written back to Attorney Pipeline.
