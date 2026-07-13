# Production cutover runbook

This is the approval checklist for publishing `Cryptouprise/solar-freedom-main` to `https://breakyoursolarcontract.com` through Manus. It separates an urgent security deployment from legal approval and from future autonomous publishing.

Do not paste credentials, private keys, webhook URLs, session cookies, database URLs, or API-key values into this document, GitHub issues, PRs, logs, screenshots, or chat. Record only secret names, rotation completion, timestamps, and provider-side identifiers that are not credentials.

## Current status snapshot

Observed 2026-07-13 UTC. This is evidence of the current deployment, not an approval:

| Check | Observed state | Gate |
| --- | --- | --- |
| GitHub `main` emergency-removal baseline | `fba5ccc74e2ec6c969a390e805872048cf45eda2` | This is the post-emergency-removal baseline, not the release candidate. Record the reviewed PR head or merge SHA and its green CI run immediately before deploy. |
| Release candidate | SHA and CI run are **TBD from the reviewed pull request** | **Blocked:** do not deploy a branch name, an old checkpoint, or an unrecorded Manus snapshot. |
| Current tracked tree | Customer exports and raw GSC/indexing exports are removed | Git history still contains prior copies. History remediation, provider rotation, and any notification assessment remain separate incident-response gates. |
| SEO heartbeat/public evidence | Workflow manually disabled; former public issue redacted and closed; retained public artifacts deleted | **Blocked:** require a rotated least-privilege key and an approved private evidence store or private operations repository before re-enabling. Never reopen a public measurement issue. |
| Live production release | Exact candidate SHA is not verified as deployed; verified Manus login/project access was unavailable during this repair session | **Blocked:** authenticate to the verified Manus project, deploy the recorded candidate, and prove the release SHA through health checks and smoke results. |
| Legacy Manus OAuth state | The current legacy `/app-auth` flow uses a deterministic redirect-derived `state`; repository contracts do not prove support for a random browser-bound nonce | **Access-dependent P1:** validate the legacy provider contract in staging, then add one-time state, a callback-origin allowlist, and PKCE if supported. Do not guess at this change against production. |
| Public JavaScript graph | The older live release previously matched legacy credential patterns | **Blocked:** rotate the provider credentials and require a clean post-deploy asset scan. Values must not be printed or reused. |
| Route and publication behavior | The older live deployment does not satisfy the current fail-closed release contract | **Blocked:** unknown, withheld, and quarantined routes must fail closed; only approved pages may be indexable or appear in the sitemap. |
| GSC measurement | No current private, fresh, verified release snapshot is approved | **Blocked:** revoke the exposed key, configure its rotated replacement privately, and produce a fresh verified snapshot after cutover. |
| Database schema/data | Migrations `0011`, `0012`, `0013`, and `0014` are part of the candidate | **Blocked:** back up first, apply in order, and verify consent, API-key lifecycle, editorial-review columns, and backlink seed cleanup. |
| Production smoke | The live site does not yet completely pass the candidate's smoke contract | **Blocked:** every check emitted by the release-candidate smoke script must pass after exact-commit deployment. Do not substitute a historical count. |
| Trust/legal cleanup | Technical governance gates do not establish the truth or legal approval of business claims | Real legal/business facts, source evidence, and qualified human approval remain external gates. |
| Repository release controls | Pull-request/push CI, CODEOWNERS, dependency updates, and a non-leaking tracked-artifact scan are defined in the repository | **External setting remains:** protect `main` and require the `Validate release candidate` check after this change is merged. |

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
Candidate PR URL:
Candidate CI run URL:
Release operator:
Security owner:
Legal/content approver:
Manus project identifier (non-secret):
Previous Manus deployment identifier:
New Manus deployment identifier:
Cutover started (UTC):
Cutover completed (UTC):
Credential rotations completed (names only):
Database backup identifier (non-secret):
Migrations 0011/0012/0013/0014 applied and verified:
Local validation result:
Production smoke result:
Heartbeat run URL:
Private GSC evidence locator/fetchedAt/date range/row count:
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
- [ ] Inventory `backlinkTargets` for legacy plaintext account fields, rotate any still-valid credentials at their providers, export only the minimum non-secret audit evidence, then purge the credential values from the database. The admin API no longer selects these columns; schema removal remains a separate destructive migration decision requiring an approved backup and rollback plan.
- [ ] Confirm no unrelated secret such as `JWT_SECRET` is rotated casually. If it was exposed, rotate it deliberately and record the expected session invalidation.
- [ ] Run the public asset scan after deploy and require zero credential-pattern findings.

Never restore a compromised value during rollback.

## Gate 2: GitHub Search Console connection

The heartbeat is manually disabled, and it must stay disabled until both a private evidence destination and a rotated credential are ready. Configure secrets in the approved private operations repository or approved private evidence system, not source files or a public issue:

- [ ] Select and approve a private operations repository or private evidence store for raw GSC data, indexing queues, heartbeat state, alert bodies, and retained artifacts.
- [ ] Add secret `GOOGLE_SERVICE_ACCOUNT_JSON` containing only the newly rotated JSON credential to that approved private execution environment.
- [ ] Confirm the secret name exists without displaying its value.
- [x] `GSC_PROPERTY_URL=sc-domain:breakyoursolarcontract.com` is configured as an Actions variable at the status-snapshot time.
- [x] `GSC_DATE_RANGE_DAYS=28`, `GSC_DATA_LAG_DAYS=3`, and `GSC_MAX_AGE_HOURS=36` are configured as Actions variables at the status-snapshot time.
- [ ] Confirm the replacement service-account email is granted read access to the exact Search Console property.
- [ ] Confirm the former public heartbeat issue remains redacted and closed and no retained public SEO evidence artifacts remain.
- [ ] Re-enable or relocate the heartbeat only after the security owner approves the private evidence path and rotated credential.
- [ ] Manually run the SEO heartbeat from the deployed release commit in the approved private environment.
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
- [ ] `OPENROUTER_API_KEY` is present only if approved AI draft assistance is enabled. Compiled third-party press distribution is intentionally absent; do not restore legacy press credentials.
- [ ] No secrets remain in `siteConfig`, `pressReleaseSettings`, legacy `backlinkTargets` account fields, browser storage, build variables, or client-prefixed environment variables.
- [ ] In a disposable staging session, confirm whether the legacy Manus `/app-auth` and token-exchange endpoints accept an opaque random `state` and independently supplied registered redirect URI. Replace the deterministic redirect-derived state with a short-lived, one-time, browser-bound value and explicit callback allowlist; add PKCE if the provider supports it. Until this is verified end to end, treat OAuth login as a residual P1 risk rather than claiming the flow is hardened.

### Build/release selection

- [ ] Fetch/sync GitHub and select the exact reviewed `main` commit recorded in the evidence log.
- [ ] Confirm Manus is not building an older cached branch or detached snapshot.
- [ ] Use `pnpm install --frozen-lockfile` and `pnpm build` (or the verified equivalent configured by Manus).
- [ ] Preserve the previous deployment identifier and its configuration metadata before publishing.
- [ ] Back up the production database using the provider-supported method and verify the backup can be located before applying schema changes.

### Ordered database migration

Apply these migrations exactly once, in order, using the production database's migration ledger:

1. `0011_quiet_polaris.sql` — lead and exit-intent consent fields.
2. `0012_cooing_sister_grimm.sql` — API-key expiry and revocation fields.
3. `0013_editorial_blog_review.sql` — editorial reviewer, source, unique-value, and duplicate-funnel review fields.
4. `0014_reset_backlink_seed_claims.sql` — removes unsupported modeled metrics from historical backlink seeds and returns only never-reviewed seeds to the manual queue.

- [ ] Confirm the database backup completed before `0011` begins.
- [ ] Apply `0011`, then `0012`, then `0013`, then `0014`; stop on the first error and preserve its non-sensitive log.
- [ ] Verify the migration ledger records all four once and in order.
- [ ] Verify the new consent fields exist with safe defaults and that a controlled lead canary records the intended consent state.
- [ ] Verify newly minted scoped Admin API keys honor expiry/revocation fields; revoke legacy keys rather than copying them forward.
- [ ] Verify existing blog rows remain withheld unless complete editorial evidence passes the publication gate. Migration success alone never approves a post.
- [ ] Verify historical backlink seed rows have null relevance/authority/link-attribute metrics; never-reviewed rows are `new`, while genuine human review state remains intact.

The first three migrations add columns; `0014` performs narrowly scoped data cleanup. Production rollback still requires care. Do not drop the new columns, restore unsupported backlink metrics, or overwrite post-cutover leads as part of an application rollback.

## Gate 4: local release validation

Run from a clean checkout of the release commit:

```bash
pnpm install --frozen-lockfile
node scripts/ci-public-artifact-scan.mjs --self-test
node scripts/ci-public-artifact-scan.mjs
pnpm check
pnpm test
pnpm build
pnpm bundle:budget
pnpm governance:audit
pnpm audit --prod --audit-level=moderate
pnpm audit --audit-level=moderate
git diff --exit-code
```

Approval requires all commands and the required GitHub `Validate release candidate` check to pass. The tracked-artifact scanner reports rule identifiers and paths only; it never prints matched values. `git diff --exit-code` proves the build did not leave stale tracked generated files. Also inspect `git status --short` and resolve any unexplained untracked or user-owned files without deleting them casually.

The repository CI is a code-readiness gate, not a deployment system. A green run does not prove that Manus selected the commit, that runtime secrets are correct, or that the live domain serves the candidate.

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
pnpm smoke:production -- --expected-release-sha "$RELEASE_SHA"
```

The script sends unauthenticated GET requests only. It does not submit leads, log in, use cookies, request indexing, or mutate production. Run it with the recorded expected release SHA. It checks:

- homepage status, canonical, indexability, and source-visible content;
- health and readiness responses, including the deployed release SHA when supplied;
- direct source-visible responses only for the small approved publication inventory defined by the release candidate;
- known withheld blog, city, company, and state research routes remain accessible with their own canonical but return `noindex, follow` and no Article/FAQ search schema; unknown records still return `404`;
- a unique invented URL returning HTTP 404 with `noindex` and no canonical;
- `/admin/content` returning 200 with `noindex` and no canonical;
- `/api/admin/status` rejecting an unauthenticated request with HTTP 401;
- `robots.txt`, the canonical sitemap directive, and a sitemap containing only approved canonical URLs while excluding withheld/quarantined routes;
- the exact public storage manifest redirects known assets safely while an invented storage key returns `404` before privileged presigning;
- the public JavaScript asset graph for credential patterns without printing matched values.

There is no minimum URL count for approval, and quarantined pages are not required to return `200` or appear in the sitemap. `--skip-assets` is diagnostic only and cannot approve a release. Save the normal output in the evidence record. Any failed check is a no-go until explained and rerun.

## Gate 7: authenticated and conversion verification

These checks require explicit operator access and therefore are not automated by the smoke script:

- [ ] Sign in through the normal admin session and confirm `/admin/content` loads without a browser-bundled API key.
- [ ] Confirm a callback with missing, expired, reused, or browser-mismatched OAuth state is rejected without creating a session after the staging-compatible state repair is implemented.
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

- [ ] Review the release candidate's complete claim and publication-governance diff against current `main`.
- [ ] Record counsel- or qualified-approver-approved replacement language where required; a passing automated gate is not approval.
- [ ] Attach evidence identifiers and review dates without placing confidential source material in public code.
- [ ] Confirm privacy/terms/consent/advertising disclosures with qualified counsel.
- [ ] Approve explicit retention periods and an authenticated deletion/restriction procedure for leads, guide requests, consent records, CRM copies, and provider backups. Until then, do not claim automatic expiration or a completed deletion workflow.
- [ ] Keep all prompt-only schedulers plan-only. Do not enable autonomous publishing until typed adapters enforce approval, evidence, verification, and rollback.

These gates do not prevent an emergency credential-removal deployment. They do prevent calling that deployment legally approved or enabling autopilot publication.

## Gate 9: heartbeat and post-deploy observation

- [ ] Keep the public-repository heartbeat manually disabled until private storage and the rotated key are verified.
- [ ] Confirm its former public issue remains redacted and closed and retained public artifacts remain deleted.
- [ ] Trigger the SEO heartbeat from the deployed release commit only in the approved private execution/evidence environment.
- [ ] Require the workflow conclusion to be success and the GSC evidence gate to be fresh.
- [ ] Treat thin-content, title, internal-link, and CTR findings as review queues, not automatic publication authority.
- [ ] Monitor HTTP errors, lead persistence, CRM delivery, auth failures, and GA4 pageviews for at least one business cycle.
- [ ] Record any regression in the approved tracker with the deployment ID and non-sensitive summary; keep raw measurement evidence private.

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
