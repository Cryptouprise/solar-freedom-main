# Self-Improving SEO / AEO / GEO Loop

This document describes how Solar Freedom keeps improving its search, answer-engine,
and generative-engine visibility automatically, and where the human approval gates are.

The system is intentionally **"auto-draft + auto-queue + auto-measure"** rather than
fully autonomous publishing. For a legal/YMYL site, a human approves anything that
ships user-facing claims.

## The daily loop

```
measure ──▶ decide ──▶ draft ──▶ (human approve) ──▶ publish ──▶ re-measure
   ▲                                                                  │
   └──────────────────────────────────────────────────────────────────┘
```

1. **Measure** — `pnpm seo:agent` audits crawler-visible HTML; `pnpm seo:indexing`
   builds the indexing/refresh queue from sitemap + GSC exports.
2. **Decide** — `pnpm seo:ctr` ranks the highest-leverage CTR rescue opportunities
   (pages that rank but are not clicked). The deterministic queues are the source
   of truth for what to do next.
3. **Draft** — OpenRouter drafts copy/content:
   - Title + meta description variants via `pnpm seo:ctr -- --ai` (needs `OPENROUTER_API_KEY`).
   - Blog content via the admin Blog Studio (`blogStudio.generateContent`).
   - Press releases via the weekly `server/cron/pressRelease.ts` job.
4. **Approve** — a human reviews drafts in the admin UI before publishing.
5. **Publish & re-measure** — after publishing, IndexNow (`pnpm submit:indexnow`)
   and the next heartbeat run pick up the change and re-measure.

## AEO (Answer Engine Optimization)

- **Structured data**: prerendered pages now emit `FAQPage` JSON-LD from each
  article's `faq` data, plus `datePublished`/`dateModified` on `Article` schema.
  See `scripts/prerender.mjs` (`buildSchemaBlocks`).
- **AI index files**: `client/public/llms.txt` and `client/public/llms-full.txt`
  are regenerated from the live content inventory on every build by
  `scripts/generate-llms.mjs` (wired into `pnpm build`). They never drift from
  what is actually published, so new articles become citable immediately.
- **Crawler access**: `client/public/robots.txt` explicitly allows GPTBot,
  ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, and more.

## GEO (Generative / local)

- City and state-law pages emit `LegalService` schema with a per-page
  `areaServed` (`Place` → `PostalAddress` with locality/region) instead of a
  blanket "United States".
- 301 city pages + 51 state-law pages are listed in `llms.txt` for local
  generative coverage.

## SEO (traditional)

- The biggest lever is CTR, not rankings (see `docs/SEO-AUDIT-MAY-2026.md`).
  `pnpm seo:ctr` surfaces page-1 pages with weak CTR and drafts better titles
  and descriptions for one-click human application.
- The biggest *structural* lever is internal linking. The 301 city pages and 51
  state-law pages are thin and indexed slowly. `pnpm seo:internal-links` reads
  the sitemap + GSC and emits a deterministic queue that points the blog posts
  Google already trusts at the unindexed/under-performing city/state pages,
  with a suggested anchor for each. Adding those contextual links is the fastest
  fully-in-our-control way to get the thin pages discovered and ranked.
- Off-site backlinks (the 34 Medium articles and other placements) are tracked
  in `references/backlinks.json` and verified by `pnpm seo:backlinks`, which
  fetches each source and confirms it still deep-links to the intended page
  (not just the homepage). Add `--no-fetch` to validate the registry offline.

## Commands

```bash
pnpm seo:llms     # regenerate llms.txt + llms-full.txt
pnpm seo:ctr      # build CTR rescue queue (add --ai to draft copy via OpenRouter)
pnpm seo:internal-links # queue internal links from authority blog posts to thin city/state pages
pnpm seo:backlinks      # verify off-site backlinks in references/backlinks.json (add --no-fetch offline)
pnpm seo:agent    # audit crawler HTML + build action queue
pnpm seo:indexing # build indexing/refresh queue
pnpm submit:indexnow
```

## Automation surface

- **GitHub Actions** (`.github/workflows/seo-heartbeat.yml`) runs daily:
  audit → indexing queue → CTR rescue → internal-link queue → backlink check →
  alert summary → open/update one issue. Read-only; never publishes.
- **Heartbeat automations** (`server/scheduled/automationRun.ts` + the
  `automations` tRPC router) run user-defined LLM specs on a cron and log each
  run with cost tracking (`server/cron/aiCostTracker.ts`).

## Required secrets / env

- `OPENROUTER_API_KEY` — blog/PR/CTR drafting (and GitHub Actions secret for the
  CTR step).
- `FIRECRAWL_API_KEY` — `scripts/trending-content-pipeline.py` scraping (no longer
  hard-coded; supply via env).

## Guardrails

- Deterministic queues are the source of truth; OpenRouter only proposes copy.
- Nothing in the SEO scripts edits source files or publishes content.
- Human approval gates anything with user-facing legal claims.
