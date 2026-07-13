# SEO Growth Agent

The SEO Growth Agent is a diagnostic and experiment-planning loop. It does not
promise rankings and does not publish content.

## Layers

1. `seo:audit` inspects crawler-visible HTML from the approved sitemap.
2. `seo:agent` compares the audit with prior local state and writes an action
   queue.
3. `seo:agent -- --apply` is an explicit manual mode limited to narrow,
   deterministic source fixes.
4. CI and production smoke tests verify a reviewed release.
5. Fresh private Search Console/GA4 evidence measures the post-deployment
   observation window.

## Commands

```bash
pnpm seo:audit -- --base http://localhost:3010 --out reports/seo-agent/latest.json
pnpm seo:agent -- --base http://localhost:3010
pnpm seo:agent -- --base https://breakyoursolarcontract.com --ai
pnpm seo:agent -- --apply --dry-run
pnpm seo:indexing
pnpm seo:alert-summary
pnpm submit:indexnow
```

Reports are written under the ignored `reports/seo-agent/` directory. They may
include page-level operational measurements and must not be committed to the
public repository.

## Checks

- sitemap URL status;
- redirect and canonical alignment;
- title, description, and H1 presence;
- source-visible body structure;
- structured-data coverage;
- internal links; and
- page-type-specific diagnostic signals.

These checks are observations, not Google rankings, traffic predictions, or
legal/content approval.

## Evidence gates

Performance-derived queues require a fresh, complete private Search Console
snapshot. Missing data remains unknown. URL index status requires URL Inspection
or equivalent direct evidence; Search Analytics rows alone do not establish it.

The optional OpenRouter strategy note is unverified narrative assistance. The
deterministic evidence and a human reviewer remain authoritative.

## Indexing queue

`pnpm seo:indexing` writes review queues for approved sitemap URLs. It does not
submit URLs to Google. `pnpm submit:indexnow` is a separate, explicit
post-deployment action for the approved sitemap. Acceptance by IndexNow is not
proof of crawling, indexing, or rank.

## Recurring workflow status

`.github/workflows/seo-heartbeat.yml` is intentionally paused while the
repository is public: the job runs only when the repository is private. Do not
re-enable it until a rotated least-privilege GSC credential and an approved
private evidence store are configured. The workflow must remain read-only and
must not open public issues containing operational measurements.

## Apply mode

Apply mode currently normalizes legacy
`https://www.breakyoursolarcontract.com` references under `client/`,
`server/`, and `scripts/` to the canonical origin. It does not rewrite
content, titles, schema, or internal links.

When used:

1. run `--dry-run`;
2. inspect the exact diff;
3. run type-check, tests, build, governance audit, artifact scan, dependency
   audits, and production smoke;
4. obtain the required review; and
5. deploy an exact commit with a rollback record.

See [SELF-IMPROVING-SEO.md](SELF-IMPROVING-SEO.md) and
[CASE-STUDY-PROTOCOL.md](CASE-STUDY-PROTOCOL.md).
