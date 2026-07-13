# Solar Freedom search case-study protocol

## Purpose

Use `breakyoursolarcontract.com` as the first approval-first proof site for ORBIT and the Solar Freedom SEO workflow. The case study tests whether a documented set of technical, content-trust, and conversion changes improves discoverability and qualified demand. It does not assume or guarantee a ranking, traffic, lead, or revenue result.

## Evidence boundary

Every reported value must be labeled as one of:

- **observed** — captured directly from a named source;
- **derived** — calculated deterministically from observed values;
- **modeled** — an estimate or priority score that is not an outcome;
- **measured** — a verified before/after result with dates and source integrity; or
- **unavailable** — the required source is not connected, fresh, or verifiable.

No dashboard may substitute repository page counts, modeled scores, sitemap membership, or IndexNow acceptance for Google indexing, rankings, clicks, leads, or revenue.

## Release prerequisites

The measurement clock begins only after all of these are recorded:

1. the production Git SHA and deployment identifier match;
2. additive database migrations have completed;
3. every previously exposed credential has been revoked and replaced;
4. production smoke, authenticated lead/CRM canary, analytics-consent, and sitemap checks pass;
5. Google Search Console and GA4 access use rotated credentials and a least-privilege principal;
6. the GSC export metadata is fresh, date-bounded, and hash-verified; and
7. the approved change set and rollback decision are attached to the release record.

If any prerequisite is missing, the case-study state is `measurement unavailable`, not zero.

## Baseline

Freeze a 28-day pre-release baseline in America/Denver time. Preserve source metadata and hashes for every export. Record:

- GSC web-search clicks, impressions, CTR, and average position by query and page;
- branded and non-branded query segments, with the exact brand filter retained;
- query clusters for contract help, company, financing, home-sale/lien, state, city, and educational guides;
- Google-indexed/canonical status from URL Inspection for the approved sample set;
- GA4 consented landing sessions and qualified form completions;
- server-side accepted lead records and successfully marked CRM deliveries;
- page-template crawl results, HTTP status, canonical, robots, H1, source-visible content, structured-data validation, and internal links;
- PageSpeed Insights field data when available and lab data otherwise, clearly labeled; and
- release-independent events that could confound results, including seasonality, paid campaigns, outages, migrations, major content removals, and public search updates.

Historical exports without a collection timestamp, date range, freshness record, and integrity hashes are context only. They are not an eligible baseline.

## Rollout and attribution

Use one immutable release record per deployment. Each approved change must identify:

- affected URLs and template;
- finding and captured evidence;
- expected mechanism, not a promised result;
- risk tier and approver;
- exact diff and release SHA;
- automated tests and manual checks;
- rollback instructions;
- recrawl verification; and
- outcome windows and source snapshots.

Avoid mixing unrelated paid-media, domain, conversion-flow, and large content changes into the same measurement window when practical. When that is unavoidable, disclose the confounder rather than assigning false causation.

## Evaluation windows

- **Day 0:** deploy, canary, release identity, sitemap, and crawl verification.
- **Days 1–7:** detect breakage, crawling changes, consent failures, lead-delivery regressions, or unexpected deindexing. Do not declare SEO success.
- **Days 8–28:** first directional comparison using day-of-week-matched data.
- **Days 29–56:** primary outcome window for query/page clusters and qualified conversions.
- **Days 57–84:** durability check and regression review.

Use both absolute and percentage changes. A large percentage from a tiny baseline must display the baseline denominator. Do not claim “100x” unless the same defined metric, source, filters, and comparable windows support it.

## Primary outcomes

1. Non-branded GSC clicks to approved indexable pages.
2. GSC impressions for the defined commercial and educational query clusters.
3. Qualified server-accepted intake submissions, deduplicated under a documented rule.
4. Successfully marked CRM deliveries from consented submissions.

## Diagnostic outcomes

- CTR and position distribution by query/page cluster;
- valid indexed canonical rate for the inspection sample;
- crawl and rendered trust-governance defect count;
- consented landing engagement and form-start-to-accepted-submit rate;
- Core Web Vitals pass rate where field data is available; and
- rollback, regression, and incident counts.

Diagnostic metrics explain a result; they must not be promoted to business outcomes.

## Comparison method

For every window, retain the raw export, metadata, and deterministic transform. Report:

| Field | Required value |
| --- | --- |
| Metric | Exact source field and unit |
| Segment | Query/page/device/country/search-type filters |
| Baseline | Start, end, value, and denominator |
| Comparison | Start, end, value, and denominator |
| Change | Absolute and percentage |
| Evidence | Export hash and release SHA |
| Confidence | Observed limitations and confounders |
| Decision | Keep, investigate, iterate, or roll back |

Do not use statistical language such as “significant” unless the test, assumptions, sample, and threshold are defined before inspecting the result.

## Learning-loop rule

A recommendation may enter the reusable playbook only when its implementation and verification record is complete. A measured outcome may update prioritization only for comparable templates, intents, risks, and data conditions. One site result must not be presented as a universal ranking rule.

Negative and neutral outcomes remain in the ledger. Deleting disappointing results would make the system less intelligent, not more.

## Publication standard

Any public case study must include the domain, dates, baseline denominator, release scope, measurement sources, material confounders, and what was not measured. It must distinguish correlation from causation and disclose that search engines control crawling, indexing, and ranking.
