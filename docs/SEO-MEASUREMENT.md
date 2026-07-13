# Live SEO measurement

The daily heartbeat can refresh page-level Google Search Console Search
Analytics before it calculates CTR, refresh, and internal-link opportunities.
The service-account private key is consumed from the environment and is never
written to logs, artifacts, reports, or the database.

## Required external connection

Add this rotated GitHub Actions secret:

- `GOOGLE_SERVICE_ACCOUNT_JSON`: the complete JSON for a dedicated Google
  service account that has read access to the target Search Console property.

Do not reuse the credential that was exposed in chat. Revoke it in Google Cloud
IAM, create a replacement, and install the replacement directly in GitHub's
encrypted Actions secrets. The script also accepts `GSC_SERVICE_ACCOUNT_JSON`
as a legacy local-runtime alias, but the workflow intentionally uses the single
canonical secret name above.

These non-secret GitHub Actions variables are supported:

- `GSC_PROPERTY_URL` (default `sc-domain:breakyoursolarcontract.com`)
- `GSC_DATE_RANGE_DAYS` (default `28`)
- `GSC_DATA_LAG_DAYS` (default `3`)
- `GSC_MAX_AGE_HOURS` (default `36`)

Explicit `GSC_START_DATE` and `GSC_END_DATE` environment variables can be used
for a one-off local backfill. Dates use `YYYY-MM-DD`.

## Commands

```bash
pnpm seo:gsc:refresh
pnpm seo:gsc:status -- --max-age-hours 36 --fail-on-stale
```

The refresh writes compatibility datasets (`gsc_all_pages.json` and
`gsc_report.csv`) plus `gsc_data_metadata.json`. The metadata records the
property, measurement window, fetch time, row count, truncation state, and
content hashes. It contains no private key.

These files and the generated `reports/seo-agent/` directory are private
operational evidence. They are ignored by Git. Because this repository is
public, the heartbeat does not cache, open public issues, or upload artifacts
containing those measurements. Connect a private operations repository or an
approved private evidence store before enabling recurring GSC collection. Do
not copy page/query performance into a public issue as a workaround.

For a private repository, every workflow run uploads machine-readable evidence
and restores the previous `reports/seo-agent/state.json` through a
branch-scoped cache so heartbeat deltas have a real prior observation. In a
public repository, those publication steps stay disabled. If the secret is
absent, the technical audit can still run, but stale performance data is blocked
from CTR/internal-link recommendations and the heartbeat reports
`measurement_blocked`.

## Important boundary

Search Analytics reports clicks, impressions, CTR, and average position. A
missing row does not mean a URL is unindexed: it may simply have received no
search impressions during the selected window. Only explicit URL Inspection or
coverage evidence may drive the request-indexing queue.

Prompt-only schedules in the admin Automation Builder remain simulation-only.
They record `blocked` evidence receipts and cannot claim GitHub, GSC, Manus, or
production actions. Real execution requires a future typed, authenticated,
allowlisted tool adapter with verifiable receipts.
