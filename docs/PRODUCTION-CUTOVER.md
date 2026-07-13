# Production cutover runbook

This is the approval checklist for publishing `Cryptouprise/solar-freedom-main` to `https://breakyoursolarcontract.com` through Manus. It separates an urgent security deployment from legal approval and from future autonomous publishing.

Do not paste credentials, private keys, webhook URLs, session cookies, database URLs, or API-key values into this document, GitHub issues, PRs, logs, screenshots, or chat. Record only secret names, rotation completion, timestamps, and provider-side identifiers that are not credentials.

## Current status snapshot

Observed 2026-07-13 UTC. This is evidence of the current deployment, not an approval:

| Check | Observed state | Gate |
| --- | --- | --- |
| GitHub `main` | `a961079` at snapshot time | Record the actual release SHA again immediately before deploy. |
| Unknown production URL | HTTP 200, no `X-Robots-Tag` | **Blocked:** must be 404 with `noindex` after deploy. |
| `/admin/content` | HTTP 200, no `X-Robots-Tag` | **Blocked:** must be noindex and have no canonical after deploy. |
| Public JavaScript graph | Matches an embedded legacy Admin API-key pattern and an embedded CRM-webhook pattern | **Blocked:** values were not printed or used. Rotate them and require a clean asset scan. |
| Restored article `/blog/solar-panel-scam-signs-what-to-do` | Direct request redirects instead of returning the expected page response; heartbeat reports a status error | **Blocked:** direct request must return 200 with its own canonical and source-visible content. |
| `robots.txt` and `sitemap.xml` | Both return HTTP 200 | Recheck inventory and canonical sitemap directive after deploy. |
| Latest manual SEO heartbeat | [Run 29220356208](https://github.com/Cryptouprise/solar-freedom-main/actions/runs/29220356208) succeeded mechanically | Not a measurement pass: it ran against the old production release. |
| GSC measurement | [Issue #20](https://github.com/Cryptouprise/solar-freedom-main/issues/20) reports stale March data and missing output hashes | **Blocked:** install a rotated GSC secret and produce a fresh verified snapshot. |
| GitHub Actions configuration | GSC variables exist; repository Actions secret list is empty | **Blocked:** add `GOOGLE_SERVICE_ACCOUNT_JSON` after revoking the exposed key. |
| Trust/legal cleanup | [PR #26](https://github.com/Cryptouprise/solar-freedom-main/pull/26) is still a draft and is behind current `main` | Blocks marketing/legal approval and autonomous publication; it must be updated, reviewed, and merged or explicitly replaced by counsel-approved content. |

The existing public credential exposure makes the technical security cutover urgent. Do not delay revocation and deployment merely to call the site “fully launched.” A security deployment may proceed as remediation, but it does not grant legal approval or enable autonomous publishing.

## Roles and evidence record

Assign one person to each role before starting:

- Release operator: Manus configuration and publish action.
- Security owner: credential rotation and provider-side revocation.
- Product owner: lead, admin, and analytics acceptance.
- Legal/content approver: YMYL claims, testimonials, professional identity, and advertising disclosures.

Copy this evidence record into the release issue without adding secret values:

```text
Release commit:
Release operator:
Security owner:
Legal/content approver:
Manus project identifier (non-secret):
Previous Manus deployment identifier:
New Manus deployment identifier:
Cutover started (UTC):
Cutover completed (UTC):
Credential rotations completed (names only):
Local validation result:
Production smoke result:
Heartbeat run URL:
GSC snapshot fetchedAt/date range/row count:
Lead canary record ID:
CRM canary status:
GA4 DebugView status:
Rollback decision and reason:
```

## Gate 1: rotate compromised credentials

All boxes are required. Rotation means the old credential is invalid at its provider; merely deleting it from source is insufficient.

- [ ] Revoke the Google service-account private key that was exposed outside the provider.
- [ ] Create a replacement service-account key with only Search Console read access to `sc-domain:breakyoursolarcontract.com`.
- [ ] Revoke every Admin API key that appeared in browser bundles, source history, shared prompts, or screenshots.
- [ ] Generate future Admin API keys only after the clean deployment. Store them server-side or in an approved secret manager, never in browser code.
- [ ] Create a replacement GHL webhook and stage it as Manus secret `GHL_WEBHOOK_URL`.
- [ ] Disable the historical GHL webhook at cutover. Coordinate this step tightly with deploy to minimize CRM forwarding interruption.
- [ ] Rotate any press-release/distribution credentials previously stored in database configuration and purge the legacy database values.
- [ ] Confirm no unrelated secret such as `JWT_SECRET` is rotated casually. If it was exposed, rotate it deliberately and record the expected session invalidation.
- [ ] Run the public asset scan after deploy and require zero credential-pattern findings.

Never restore a compromised value during rollback.

## Gate 2: GitHub Search Console connection

Configure in GitHub repository settings, not source files:

- [ ] Add Actions secret `GOOGLE_SERVICE_ACCOUNT_JSON` containing only the newly rotated JSON credential.
- [ ] Confirm the secret name appears in `gh secret list --repo Cryptouprise/solar-freedom-main`; do not display its value.
- [x] `GSC_PROPERTY_URL=sc-domain:breakyoursolarcontract.com` is configured as an Actions variable at the status-snapshot time.
- [x] `GSC_DATE_RANGE_DAYS=28`, `GSC_DATA_LAG_DAYS=3`, and `GSC_MAX_AGE_HOURS=36` are configured as Actions variables at the status-snapshot time.
- [ ] Confirm the replacement service-account email is granted read access to the exact Search Console property.
- [ ] Manually run the SEO heartbeat from the release commit.
- [ ] Require `GSC state: fresh`, `Safe to use for recommendations: yes`, matching output hashes, a non-truncated result, and a current date range.

Search Analytics is not URL Inspection. Missing performance rows must never be labeled “unindexed” without separate inspection evidence.

## Gate 3: Manus production configuration

Use the verified Manus project attached to `breakyoursolarcontract.com`. If the project URL or deployment ownership cannot be verified, stop.

### Required platform/runtime values

- [ ] `NODE_ENV=production` and the platform-provided `PORT` are correct.
- [ ] `DATABASE_URL`, `JWT_SECRET`, `OAUTH_SERVER_URL`, `OWNER_OPEN_ID`, and `VITE_APP_ID` are present in encrypted Manus configuration.
- [ ] Platform-managed `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY` remain server-only if the deployment uses them.
- [ ] Rotated `GHL_WEBHOOK_URL` is present and is not prefixed with `VITE_`.
- [ ] `TRUST_PROXY` is empty unless Manus has supplied verified proxy IP/CIDR values. Never use blanket proxy trust.
- [ ] `GA4_PROPERTY_ID` and `GA4_SERVICE_ACCOUNT_JSON` are present only if the Admin Analytics report is enabled. This is separate from the GSC credential.
- [ ] Optional AI/press-release credentials are present only for approved integrations: `OPENROUTER_API_KEY`, `PRLOG_*`, `NEWSBYWIRE_*`, and `OPENPR_*`.
- [ ] No secrets remain in `siteConfig`, `pressReleaseSettings`, browser storage, build variables, or client-prefixed environment variables.

### Build/release selection

- [ ] Fetch/sync GitHub and select the exact reviewed `main` commit recorded in the evidence log.
- [ ] Confirm Manus is not building an older cached branch or detached snapshot.
- [ ] Use `pnpm install --frozen-lockfile` and `pnpm build` (or the verified equivalent configured by Manus).
- [ ] Preserve the previous deployment identifier and its configuration metadata before publishing.
- [ ] Back up the production database using the provider-supported method. This release should not require a destructive migration.

## Gate 4: local release validation

Run from a clean checkout of the release commit:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
git status --short
```

Approval requires all commands to pass and `git status --short` to contain no unexplained generated or user files. Inspect the final asset graph locally for credential patterns without printing matches.

## Gate 5: publish through Manus

1. Put nonessential content and automation jobs into a change freeze.
2. Record the current production deployment and release commit.
3. Confirm replacement credentials are staged and historical credentials are revoked according to Gate 1.
4. Publish the recorded release commit using the verified Manus production action.
5. Wait for the platform to report a healthy deployment. Do not treat a successful build alone as a successful cutover.
6. Confirm the canonical domain and TLS certificate resolve to the new deployment.
7. Run the read-only production smoke test immediately.

No repository API, Admin API, or prompt-only automation can perform this Manus publish today. The release operator must use the verified Manus management surface.

## Gate 6: read-only production smoke

Run:

```bash
pnpm smoke:production
```

The script sends unauthenticated GET requests only. It does not submit leads, log in, use cookies, request indexing, or mutate production. It checks:

- homepage status, canonical, indexability, and source-visible content;
- two known blog pages and a city page with direct HTTP 200 responses;
- a unique invented URL returning HTTP 404 with `noindex` and no canonical;
- `/admin/content` returning 200 with `noindex` and no canonical;
- `/api/admin/status` rejecting an unauthenticated request with HTTP 401;
- `robots.txt`, sitemap directive, at least 500 sitemap URLs, and the restored blog URL;
- the public JavaScript asset graph for credential patterns without printing matched values.

`--skip-assets` is diagnostic only and cannot approve a release. Save the normal output in the evidence record. Any failed check is a no-go until explained and rerun.

## Gate 7: authenticated and conversion verification

These checks require explicit operator access and therefore are not automated by the smoke script:

- [ ] Sign in through the normal admin session and confirm `/admin/content` loads without a browser-bundled API key.
- [ ] Confirm an unauthenticated Admin API request is 401 and a scoped, newly generated server-side key can perform only its granted read operation.
- [ ] Submit one clearly labeled non-production lead canary after confirming consent language. Record only its database record ID in the release evidence.
- [ ] Confirm the UI shows success only after durable database persistence.
- [ ] Confirm the canary reaches GHL exactly once and the database delivery marker agrees.
- [ ] Confirm a controlled CRM-delivery failure leaves the lead persisted and visibly pending rather than presenting a false success/failure state.
- [ ] In GA4 DebugView, confirm one sanitized `page_view` per SPA navigation, one `generate_lead` for the persisted canary, and no email, phone, query-string, or fragment values.
- [ ] Confirm the canonical phone display, `tel:` link, structured data, CRM payload, and approved business record agree.
- [ ] Delete or label the canary according to retention policy; do not erase release evidence needed for audit.

## Gate 8: legal and evidence approval

The following claims require source evidence and human approval before they can be published or generated automatically:

- attorney/law-firm identity, licensing, jurisdiction, or representation claims;
- outcomes, cancellation rates, client counts, dollar savings, and time-to-resolution claims;
- “free,” contingency, no-fee, guarantee, triple-damages, or similar legal/financial promises;
- BBB grades, complaint totals, lawsuit/regulatory summaries, and competitor allegations;
- testimonials, quotes, names, locations, photos, and AggregateRating/Review schema;
- privacy, terms, consent, attorney-advertising, and editorial-policy language.

Required actions:

- [ ] Update and review draft [PR #26](https://github.com/Cryptouprise/solar-freedom-main/pull/26) against current `main`.
- [ ] Merge the approved trust-governance changes or record counsel-approved replacement language.
- [ ] Attach evidence identifiers and review dates without placing confidential source material in public code.
- [ ] Confirm privacy/terms/consent/advertising disclosures with qualified counsel.
- [ ] Keep all prompt-only schedulers plan-only. Do not enable autonomous publishing until typed adapters enforce approval, evidence, verification, and rollback.

These gates do not prevent an emergency credential-removal deployment. They do prevent calling that deployment legally approved or enabling autopilot publication.

## Gate 9: heartbeat and post-deploy observation

- [ ] Trigger the SEO heartbeat from the deployed release commit.
- [ ] Require the workflow conclusion to be success and the GSC evidence gate to be fresh.
- [ ] Confirm issue #20 no longer reports the restored article as a status error.
- [ ] Treat thin-content, title, internal-link, and CTR findings as review queues, not automatic publication authority.
- [ ] Monitor HTTP errors, lead persistence, CRM delivery, auth failures, and GA4 pageviews for at least one business cycle.
- [ ] Record any regression as a GitHub issue with the deployment ID and non-sensitive evidence.

## Rollback decision and procedure

Rollback is warranted for widespread 5xx errors, broken authentication, failed durable lead persistence, corrupted routing, missing critical pages, or a newly exposed credential. A CRM-only outage with successful database persistence is normally an integration repair, not an application rollback.

1. Stop new publishes and record the failure evidence.
2. Revoke any newly exposed credential immediately; do not wait for application rollback.
3. Prefer the provider's previous known-good Manus deployment only if it does not contain the embedded legacy credentials.
4. If every previous deployment contains a compromised browser bundle, do not restore it publicly. Restrict the affected route at ingress and deploy a forward fix.
5. Preserve all rotated credentials. Never restore old secret values with an old deployment.
6. If source must be reverted, use a reviewed Git revert PR; do not rewrite `main` or use `git reset --hard`.
7. Restore database state only from a verified backup and only when a release actually changed schema/data. Application rollback alone should not overwrite valid new leads.
8. Rerun the complete smoke, authenticated canary, and heartbeat checks after rollback or forward fix.
9. Record the final deployment identifier, incident reason, user impact, and follow-up owner.

Cutover is complete only when the technical smoke passes, credential rotations are provider-confirmed, durable lead and CRM evidence agrees, GSC is fresh, and the release is labeled honestly as either security-remediated or fully approved.
