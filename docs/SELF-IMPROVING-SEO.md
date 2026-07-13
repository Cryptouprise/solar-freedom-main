# Approval-First Search Improvement Loop

Solar Freedom uses a measured search-operations loop. It automates collection,
comparison, prioritization, drafting, and verification where evidence is
available. It does not automatically publish legal, company, local, or consumer
claims.

```text
measure -> diagnose -> draft -> review -> deploy -> verify -> compare
   ^                                                    |
   +----------------------------------------------------+
```

## Current operating boundary

- The public GitHub SEO heartbeat is paused. It is job-gated to private
  repositories and must not be enabled until a rotated least-privilege Search
  Console credential and an approved private evidence store are configured.
- Search Console and GA4 measurements are unknown when fresh private evidence is
  unavailable. A missing row is not treated as proof of indexing, traffic, or
  rank.
- Static city, company, state-detail, and legacy blog records remain out of the
  sitemap and AI inventory until their primary sources, reviewer, review date,
  and unique user value pass the publication gate.
- Blog Studio and the press workspace create unverified drafts. They do not
  browse independently, prove a fact, schedule publication, or distribute
  content.
- Prompt schedules record blocked evidence receipts. They cannot execute
  arbitrary prose as tools.
- IndexNow is an explicit post-deployment action for approved sitemap URLs. An
  accepted request is not proof that a search engine indexed or ranked a URL.

## What the loop can automate

1. `pnpm seo:audit` checks crawler-visible HTML, status, canonical, title,
   description, H1, structured-data, and internal-link signals.
2. `pnpm seo:gsc:status` verifies the age and completeness of a private
   Search Console snapshot before performance-derived recommendations run.
3. `pnpm seo:agent` writes a local action queue and comparison state. Its
   default mode is diagnostic.
4. `pnpm seo:indexing`, `pnpm seo:ctr`, and
   `pnpm seo:internal-links` create review queues. Unknown measurements remain
   labeled unknown.
5. OpenRouter can draft a strategy note, title/description options, blog copy,
   or an internal press draft. Model output is unverified and provider-reported
   billed cost is recorded only when the provider supplies it.
6. A reviewer approves sources, claims, uniqueness, privacy, legal/business
   language, and the exact diff.
7. CI type-checks, tests, builds, scans public artifacts, enforces the bundle
   budget, audits trust claims and dependencies, and requires reproducible
   generated files.
8. After an exact-commit deployment, production smoke tests and authenticated
   canaries verify delivery. Fresh GSC/GA4 data then measures the result under
   the case-study protocol.

## Explicit deterministic apply mode

`pnpm seo:agent -- --apply` is never run by the recurring workflow. It is a
manual source change and currently performs only the narrow canonical-domain
normalization documented in [SEO-GROWTH-AGENT.md](SEO-GROWTH-AGENT.md). Review
its diff and run the full release suite before committing.

## Search and AI presentation

- Conservative structured data is emitted only for content that passes its
  publication gate.
- `sitemap.xml`, `llms.txt`, and `llms-full.txt` are regenerated from the
  approved inventory. These files aid discovery; they do not guarantee crawling,
  indexing, ranking, attribution, or AI citation.
- There is no special AI-ranking switch. Helpful, original, source-backed
  content and sound crawl/index controls remain the operating standard.
- Local and company backlog pages may remain directly addressable for review,
  but they are `noindex` and are not linked as a bulk public crawl network.

## Commands

```bash
pnpm seo:audit
pnpm seo:agent
pnpm seo:gsc:refresh
pnpm seo:gsc:status
pnpm seo:indexing
pnpm seo:ctr
pnpm seo:internal-links
pnpm seo:backlinks
pnpm seo:alert-summary
pnpm seo:llms
pnpm submit:indexnow
```

Operational reports and raw search/analytics exports belong in an approved
private store, not this public repository.

## Release and learning rules

- No ranking, traffic, lead, revenue, legal, or AI-citation guarantee.
- No model-memory fact is a source.
- No unsupported testimonial, outcome, professional-identity, fee, timing,
  company allegation, local statistic, or urgency claim.
- No user-facing change bypasses review merely because a modeled score improved.
- Each experiment records the exact release, hypothesis, primary metric,
  guardrails, observation window, and rollback decision.
- Prefer causal language such as "observed after the change"; claim attribution
  only when the case-study design supports it.

See [CASE-STUDY-PROTOCOL.md](CASE-STUDY-PROTOCOL.md),
[RELEASE-GOVERNANCE.md](RELEASE-GOVERNANCE.md), and
[PRODUCTION-CUTOVER.md](PRODUCTION-CUTOVER.md) for the evidence and deployment
gates.
