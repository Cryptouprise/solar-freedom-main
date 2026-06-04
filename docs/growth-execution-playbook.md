# Growth Execution Playbook

This playbook operationalizes conversion, SEO, topic-cluster, and distribution loops for Solar Freedom.

## 1) Homepage Conversion Funnel

- Keep one primary on-page CTA language: **"Get My Free Case Review"**
- Run phone-first callback capture before multi-step qualification
- Keep trust proof directly before contact-form submit:
  - outcomes credibility
  - attorney credibility
  - FAQ reassurance snippet

## 2) Chat/Callback Qualification Engine

- Capture one intent before callback request:
  - `cancel_contract`
  - `lien_issue`
  - `selling_home`
- Route each intent to dedicated pages:
  - `/solar-contract-help`
  - `/solar-lien-removal`
  - `/selling-house-with-solar`
- Include callback follow-up metadata in lead payload so CRM automations can escalate within 5 minutes for unworked callback requests.

## 3) SEO Operations Cadence

Daily automated workflow already runs:
- `pnpm seo:agent -- --base https://breakyoursolarcontract.com`
- `pnpm seo:indexing`
- `pnpm seo:alert-summary`

Manual weekly review:

1. Open latest heartbeat issue and review critical/high items.
2. Clear source-visible content/internal-link issues first.
3. Resolve duplicate and truncated title/description issues.
4. Process top business-priority URLs from indexing queue.

## 4) Topic Cluster Expansion Rules

For each money/legal pillar query, add supporting pages across:

- state
- city
- lender/company
- timeline
- cost/payment burden
- case type/comparison

Internal-link every supporting page back to its pillar page and at least two sibling pages.

## 5) Claude Artifact Traffic Engine

Publish artifact-style tools with strong hooks and matching landing pages:

- Solar Contract Exit Probability Checker
- Solar Payment Burden Calculator
- Solar Lien Risk Estimator

For each artifact launch:

1. Publish artifact.
2. Publish one supporting article on-site.
3. Publish one short distribution asset (social/video/email teaser).
4. Drive clicks to one matching landing page with UTM parameters.

UTM template:

`?utm_source=claude_artifact&utm_medium=referral&utm_campaign=<artifact_slug>`

## 6) Weekly Distribution Loop

Every week:

- 1 artifact/tool launch
- 1 supporting article
- 1 press-style distribution push

Monthly:

- refresh top-performing artifacts and pages based on CTR, rankings, and booked calls.

