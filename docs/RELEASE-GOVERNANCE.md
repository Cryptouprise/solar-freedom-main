# Release governance

Solar Freedom uses approval-first release controls. Repository automation may validate a change and collect evidence; it may not infer permission to publish legal claims, rotate credentials, deploy Manus, submit leads, or write to third-party services.

## Required CI check

`.github/workflows/ci.yml` runs `Validate release candidate` for every pull request, every push to `main`, and manual dispatches. It enforces:

1. a self-tested scan of the current tracked tree for blocked Manus/database/session artifacts and credential patterns;
2. frozen dependency installation with Node 22 and pnpm 10.34.5;
3. TypeScript checking and the deterministic repository test suite;
4. a production build and rendered trust-governance audit;
5. production and complete dependency audits at moderate-or-higher severity; and
6. a clean tracked diff after generators and the build run.

Actions are pinned to immutable commit SHAs. Dependabot reviews npm and GitHub Actions updates weekly.

## GitHub settings still required

Repository files cannot protect `main` on their own. After this workflow is merged, an administrator must create a branch rule or ruleset that:

- requires pull requests for changes to `main`;
- requires `Validate release candidate` and CodeQL to pass on the latest commit;
- requires branches to be current before merge;
- blocks force pushes and branch deletion;
- restricts workflow changes to CODEOWNERS review where the account model permits it; and
- does not allow administrators or automation to bypass a failed security or release gate casually.

The repository currently has one owner. Do not configure a review count that makes emergency security work impossible until a second trusted reviewer exists; required automated checks and non-bypassable history protection are still appropriate.

## Scanner boundary

`scripts/ci-public-artifact-scan.mjs` scans only files tracked in the checked-out tree and suppresses every matched value. It does not cleanse Git history, revoke a leaked credential, classify every possible form of personal data, or scan the deployed JavaScript graph. Historical removal is a destructive incident-response operation requiring explicit approval and coordinated credential rotation. Production assets remain covered by `pnpm smoke:production`.

## Release evidence

A release record must identify the reviewed Git SHA, CI run, Manus deployment identifier, credential rotations by name only, production smoke result, authenticated lead/CRM canary, analytics verification, GSC snapshot metadata, approvers, and rollback decision. Use [PRODUCTION-CUTOVER.md](PRODUCTION-CUTOVER.md) as the authoritative checklist.

## Search-publication evidence gate

City, company, state-detail, and blog routes may remain accessible as research backlogs without being eligible for search publication. This is a deliberate fail-closed control informed by [Google Search's spam policies](https://developers.google.com/search/docs/essentials/spam-policies), including its guidance on substantially similar city or regional funnel pages, doorway abuse, scaled content, and blocks of location links created for ranking.

Before a city or company detail page may be indexed, linked from search-facing directories, or added to XML/LLM inventories, its record must include all of the following:

1. substantive, page-specific user value that is not copied from another location or company funnel;
2. a written unique-value summary of at least 80 characters and 12 words;
3. one or more direct HTTPS primary-source URLs, with a title and non-future `accessedAt` date for every source;
4. a named editorial reviewer, reviewer role, and non-future `reviewedAt` date; and
5. an explicit `funnelOnlyDuplicate: false` determination after checking that the page is not merely an intermediate lead form or lightly varied template.

Blog publication requires the same editorial record and must also pass the unsupported first-party-claim gate across every public copy surface. A database `published` flag alone is insufficient. Legacy rows default to withheld, and no reviewer, date, source, or approval may be inferred or fabricated. State-law detail pages retain their existing primary-source and legal/editorial-review gate.

Until a record passes its applicable gate, it must carry `noindex, follow` in client, server, and prerendered metadata; stay out of XML sitemaps, `llms.txt`, and `llms-full.txt`; emit no Article or FAQ search schema; and receive no bulk promotional link from the homepage or HTML site map. `llms.txt` is an optional machine-readable convention, not a guaranteed crawler standard, indexing signal, or citation mechanism.
