# Solar Freedom deployment entry point

The authoritative deployment and rollback procedure is [docs/PRODUCTION-CUTOVER.md](docs/PRODUCTION-CUTOVER.md). Do not deploy from an older copy of this checklist, a prompt, an Admin API call, or an unverified Manus checkpoint.

## Current release state

- Post-emergency-removal GitHub `main` baseline: `fba5ccc74e2ec6c969a390e805872048cf45eda2`. This identifies the current-tree PII and raw SEO-export removal point; it is not the release candidate.
- Release-candidate SHA and CI run: **TBD from the reviewed pull request**. Record both immediately before cutover and deploy only that exact commit.
- Tracked customer exports and raw GSC/indexing exports are absent from the current tree. Copies remain in Git history, so history remediation, credential rotation, and any required notification assessment remain separate incident-response work.
- The SEO heartbeat is manually disabled. Its former public issue was redacted and closed, and retained public artifacts were deleted. Do not re-enable it until a rotated least-privilege GSC key and an approved private evidence store or private operations repository are in place.
- Live production is **not approved** and may still serve an older Manus release. Verified Manus login/project access was unavailable during this repair session. Credential rotation, encrypted Manus/GitHub configuration, ordered database migration, legal/business approval, exact-commit deployment, authenticated canaries, fresh private GSC evidence, and a completely passing production smoke remain required.

## Required repository preflight

Run from a clean checkout of the exact commit proposed for release:

```bash
corepack pnpm install --frozen-lockfile
node scripts/ci-public-artifact-scan.mjs --self-test
node scripts/ci-public-artifact-scan.mjs
corepack pnpm check
corepack pnpm test
corepack pnpm build
corepack pnpm bundle:budget
corepack pnpm governance:audit
corepack pnpm audit --prod --audit-level=moderate
corepack pnpm audit --audit-level=moderate
git diff --exit-code
```

The same checks run in [Release CI](.github/workflows/ci.yml) for pull requests and pushes to `main`. Record the candidate's actual green check URL instead of carrying forward a historical count or run. A green CI run proves code readiness only; it does not deploy Manus, rotate credentials, apply or verify database migrations, approve legal claims, validate conversions, or prove that production serves the reviewed commit.

Before publishing, take a provider-supported database backup, then apply migrations `0011_quiet_polaris.sql`, `0012_cooing_sister_grimm.sql`, `0013_editorial_blog_review.sql`, and `0014_reset_backlink_seed_claims.sql` in that order. Verify the consent fields, API-key expiry/revocation fields, editorial-review fields, and removal of unsupported backlink-seed metrics before accepting traffic or publishing content. Separately inventory, rotate, and purge any legacy plaintext backlink-target account credentials; the admin API no longer selects those columns, but dropping them from the schema is a destructive migration decision that requires its own approved backup and rollback plan.

## Rollback rule

Never roll back to a deployment containing a revoked or browser-exposed credential. Follow the forward-fix and rollback decision procedure in the authoritative runbook, preserve valid lead data, and rerun every smoke and canary check after recovery.
