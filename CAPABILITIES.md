# Solar Freedom — App Capabilities Manifest

**Site:** breakyoursolarcontract.com  
**Stack:** React 19 + Tailwind 4 + Express 4 + tRPC 11 + MySQL (TiDB) + Playwright  
**Last updated:** 2026-07-13<br>
**Manifest endpoint:** `GET /api/capabilities` (returns this document as JSON + Markdown)  
**Manifest Markdown:** `GET /api/capabilities.md` (returns raw Markdown for AI ingestion)

---

## Overview

Solar Freedom is a full-stack content, lead-intake, and search-operations application for breakyoursolarcontract.com. It provides authenticated administration, evidence-aware content tooling, read-only SEO monitoring, and review queues. It does **not** grant AI agents authority to deploy Manus, publish legal or marketing claims without approval, or submit content to third-party distribution services autonomously. External changes require a scoped credential, an explicit approved action, and post-change verification.

---

## Authentication

### Manus OAuth (User Sessions)
End-users authenticate via Manus OAuth. Session cookies are set at `/api/oauth/callback`. The `useAuth()` hook on the frontend reads auth state. Admin-only routes require `role === "admin"` in the user record.

### Admin API Authentication
All `/api/admin/*` REST endpoints require either an authenticated same-origin admin session or a scoped API key. API keys are stored as hashes in the `apiKeys` table and managed through authenticated admin controls. Raw keys are returned only once at creation and belong in an approved secret manager.

**Header format:**
```
Authorization: Bearer <your-scoped-api-key>
```

**Obtaining a key:** Log in as an authorized admin and use the API-key management control. Do not insert raw keys directly into the database, browser code, site configuration, source files, prompts, or logs.

---

## REST API — `/api/admin/*`

Base URL: `https://breakyoursolarcontract.com/api/admin`. External clients use `Authorization: Bearer <key>`; the browser admin may use its same-origin session cookie. Every key is permission-scoped.

### Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/status` | Authenticated API/DB check with post and company counts |

### Blog Posts

| Method | Endpoint | Permission | Description |
|--------|----------|-----------|-------------|
| GET | `/posts` | `posts:read` | List database posts (including drafts), paginated with `?limit=50&offset=0` |
| GET | `/posts/all` | `posts:read` | List database posts and the static content inventory |
| GET | `/posts/slugs` | `posts:read` | List all post slugs (lightweight, for sitemaps) |
| GET | `/posts/:slug` | `posts:read` | Get single post by slug |
| POST | `/posts` | `posts:write` | Create a draft; publication additionally requires `posts:publish` and complete editorial evidence |
| PUT | `/posts/:slug` | `posts:write` | Update a post; changing it to published additionally requires `posts:publish` and complete editorial evidence |
| DELETE | `/posts/:slug` | `posts:delete` | Delete post |

**POST/PUT body schema:**
```json
{
  "title": "string (required)",
  "slug": "string (required)",
  "content": "string — HTML or Markdown (required when creating)",
  "excerpt": "string",
  "metaTitle": "string",
  "metaDescription": "string",
  "heroImage": "string — approved image URL",
  "published": false,
  "tags": ["string"],
  "category": "string",
  "editorialReviewerName": "required to publish",
  "editorialReviewerRole": "required to publish",
  "editorialReviewedAt": "ISO 8601 date required to publish",
  "editorialPrimarySources": [{"url": "https://primary.example/record", "title": "Source title", "accessedAt": "YYYY-MM-DD"}],
  "editorialUniqueValueSummary": "at least 80 characters and 12 words",
  "editorialFunnelOnlyDuplicate": false
}
```

The API fails closed: `published: true` is not sufficient by itself. The caller must have the separately scoped
`posts:publish` permission and the content must pass the shared evidence and unsupported-claim checks. New records
default to draft, and no review identity, source, or approval is inferred.

### Companies

| Method | Endpoint | Permission | Description |
|--------|----------|-----------|-------------|
| GET | `/companies` | `companies:read` | List all solar companies |
| GET | `/companies/:slug` | `companies:read` | Get company by slug |
| POST | `/companies` | `companies:write` | Create company profile |
| PUT | `/companies/:slug` | `companies:write` | Update company profile |

### Site Configuration

| Method | Endpoint | Permission | Description |
|--------|----------|-----------|-------------|
| GET | `/config` | `config:read` | Get all site config key-value pairs |
| PUT | `/config/:key` | `config:write` | Update a config value |

### File Upload

| Method | Endpoint | Permission | Description |
|--------|----------|-----------|-------------|
| POST | `/upload` | `posts:write` | Upload single file to S3, returns `{ url, key }` |
| POST | `/upload/batch` | `posts:write` | Upload multiple files, returns array of `{ url, key }` |

**Upload format:** authenticated JSON containing base64 `data`, `filename`, and `contentType`. Remote URL imports are disabled; batch requests contain up to 10 base64 image objects.

### Automation

| Method | Endpoint | Permission | Description |
|--------|----------|-----------|-------------|
| POST | `/automation/apply` | `automation:execute` | Validate/hash a dry-run change plan; runtime execution is disabled |

### API Key Management

| Method | Endpoint | Permission | Description |
|--------|----------|-----------|-------------|
| GET | `/keys` | `keys:manage` | List all API keys |
| POST | `/keys` | `keys:manage` | Create new API key |
| DELETE | `/keys/:id` | `keys:manage` | Revoke API key |

---

## tRPC API — `/api/trpc`

tRPC uses `/api/trpc/<router>.<procedure>` with the standard tRPC HTTP transport (queries may use GET and mutations use POST). Authenticated calls require the session cookie; protected procedures also enforce the required user role. Use the generated client instead of hand-building transport payloads where possible.

**tRPC client setup (TypeScript):**
```typescript
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from './server/routers';

const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({
    url: 'https://breakyoursolarcontract.com/api/trpc',
    transformer: superjson,
    headers: { Cookie: '<session-cookie>' },
  })],
});
```

### `auth` Router

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `auth.me` | query | public | Returns current user object or null |
| `auth.logout` | mutation | public | Clears session cookie |

### `leads` Router

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `leads.submit` | mutation | public | Submit a new lead (name, phone, email, solar company, issue, etc.) |
| `leads.quickCallback` | mutation | public | Submit quick callback request (phone only) |
| `leads.list` | query | admin | List all leads with pagination |
| `leads.updateStatus` | mutation | admin | Update lead status |

**`leads.submit` input:**
```typescript
{
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  solarCompany?: string;
  problemType?: string;
  contractType?: string;
  monthlyPayment?: string;
  intent?: string;
  formName?: string;
  sourcePage?: string;
  sourceUrl?: string;
  contactConsent?: boolean;
  smsConsent?: boolean;
  consentVersion?: string;
  website?: string; // honeypot; leave empty
}
```

When `contactConsent` is true, `consentVersion` must equal the server's current disclosure version. SMS consent is optional and cannot be true unless contact consent is also true. Server-side validation, normalization, rate limits, and consent checks remain authoritative.

### `analytics` Router

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `analytics.report` | query | admin | Pull the fixed GA4 report for `{ range: "7daysAgo" \| "30daysAgo" \| "90daysAgo" }` |

### `content` Router

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `content.listPosts` | query | public | List only evidence-approved database posts (`{ limit, offset }`); full stored rows are checked before card fields are returned |
| `content.getPost` | query | public | Get an evidence-approved post by slug; unreviewed or unsupported records return `null` |
| `content.listCompanies` | query | public | Returns an empty list until company profiles have dedicated evidence and review fields |
| `content.getCompany` | query | public | Returns `null` until company profiles have dedicated evidence and review fields |
| `content.getSiteConfig` | query | public | Get the allowlisted public contact/assistant configuration only |

### `exitIntent` Router

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `exitIntent.capture` | mutation | public | Store a guide/email request; CRM delivery occurs only with current marketing consent |

### `pressRelease` Router (Admin only)

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `pressRelease.getTopics` | query | admin | List all press release topics in queue |
| `pressRelease.addTopic` | mutation | admin | Add topic to queue (`{ title, angle?, targetKeywords?, targetUrl?, sortOrder? }`) |
| `pressRelease.deleteTopic` | mutation | admin | Delete topic by ID |
| `pressRelease.updateTopicStatus` | mutation | admin | Set topic status (`pending \| running \| published \| failed`) |
| `pressRelease.getLogs` | query | admin | Get draft and historical adapter evidence (`{ limit, offset }`); a row is not proof of current publication |
| `pressRelease.getSettings` | query | admin | Get all press release settings as key-value map |
| `pressRelease.updateSetting` | mutation | admin | Update a setting (`{ key, value }`) |
| `pressRelease.runNow` | mutation | admin | Generate a reviewable dry-run preview; external submission is not autonomous publication authority |
| `pressRelease.runDiscovery` | mutation | admin | Build a backlink-opportunity review queue; it does not create backlinks |

**Allowlisted press-release setting keys:**

Only `model` currently affects the dry-run draft path. The other keys are retained for schema compatibility and are ignored by the release execution boundary. No third-party distribution credential values are accepted or stored. Release policy requires scheduled execution and external submission to remain disabled until an approved adapter enforces evidence, idempotency, verification, and rollback.

| Key | Default | Description |
|-----|---------|-------------|
| `model` | `openrouter/free` | No-spend default router for draft generation; availability and output model vary |
| `image_model` | `none` | Retained compatibility value; unused by the press-release draft path |
| `embedding_model` | `none` | Retained compatibility value; unused by the press-release draft path |
| `schedule_enabled` | `false` by release policy | Retained preference only; runtime scheduler is disabled regardless of value |
| `dry_run` | `true` by release policy | Retained preference only; `runNow` enforces a preview without submission |
| `site_prlog` | inactive | Retained compatibility value; no adapter is imported |
| `site_newsbywire` | inactive | Retained compatibility value; no adapter is imported |
| `site_1888pressrelease` | inactive | Retained compatibility value; no adapter is imported |
| `site_openpr` | inactive | Retained compatibility value; no adapter is imported |
| `site_prfree` | inactive | Retained compatibility value; no adapter is imported |
| `site_prbuzz` | inactive | Retained compatibility value; no adapter is imported |
| `site_medium` | inactive | Retained compatibility value; browser-login compatibility route is inert |
| `site_linkedin` | inactive | Retained compatibility value; browser-login compatibility route is inert |
| `site_substack` | inactive | Retained compatibility value; browser-login compatibility route is inert |
| `substack_url` | `` | Retained compatibility value; not used for navigation or publication |

### `backlinks` Router (Admin only)

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `backlinks.getOpportunities` | query | admin | List discovered backlink opportunities (`{ status?, limit, offset }`) |
| `backlinks.updateOpportunity` | mutation | admin | Update opportunity status/notes |
| `backlinks.getTargets` | query | admin | List only workflow/history fields for legacy research targets; plaintext credentials and unsupported authority/traffic/link metrics are omitted |
| `backlinks.seedKnownSites` | mutation | admin | Queue historical metric-free candidates as `new` for current human verification |

### `aiCost` Router (Admin only)

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `aiCost.getSummary` | query | admin | Tracked provider-reported billed-cost summary (`{ days: 30 }`) |
| `aiCost.getByModel` | query | admin | Tracked provider-reported cost by model with token counts |
| `aiCost.getByFeature` | query | admin | Tracked provider-reported cost by feature |
| `aiCost.getRecentLogs` | query | admin | Recent priced-call ledger entries (`{ limit: 50 }`) |

The ledger is partial by design: active Blog Studio text generation and press-release drafting route through `server/cron/aiCostTracker.ts`, and a record is written only when the provider returns a valid numeric `usage.cost`. Calls from direct or legacy adapters can be absent, so these procedures are not a complete invoice or all-call counter.

---

## Automation Safety Status

| Capability | Current authority | Safety boundary |
|------------|-------------------|-----------------|
| GitHub SEO heartbeat | Read-only audit and queue generation; recurring workflow is paused while the repository is public | Raw GSC evidence must stay in an approved private store; stale or unavailable measurement blocks recommendations |
| SEO growth agent | Manual analysis and reviewable plan generation | No Manus deploy, CMS publish, indexing claim, or ranking guarantee |
| `/api/admin/automation/apply` | Plan validation and hashing only | Runtime file, database-DDL, deployment, and publication execution are disabled |
| Press-release generation | Dry-run preview only under release policy | Third-party submission requires a future approved adapter and explicit human approval |
| Backlink discovery | Opportunity research and review queue | Does not create, buy, or submit backlinks |
| Manus production deployment | No API authority | A verified Manus release operator must deploy the reviewed commit |

The repository contains legacy integration adapters for evaluation. Their presence is not evidence that a destination accepts submissions, that an account is authenticated, or that publication is safe. Never enable them from a prompt, database flag, or unreviewed schedule.

---

## Database Tables

The schema defines the following operational tables. This manifest intentionally does not guess or publish row
counts; obtain counts only through an authorized, privacy-safe operational report.

| Table | Purpose |
|-------|---------|
| `users` | Authenticated users (Manus OAuth) |
| `leads` | Consented form submissions |
| `exitIntentCaptures` | Consented exit-intent requests |
| `blogPosts` | Draft and evidence-approved content records |
| `companies` | Solar-company research records |
| `siteConfig` | Allowlisted site configuration |
| `apiKeys` | Hashed, scoped, expiring/revocable Admin REST API keys |
| `siteEvents` | First-party operational events |
| `seoStrategy` | SEO strategy records |
| `seoPages` | Per-page SEO metadata |
| `pressReleaseTopics` | Review queue for press-release topics |
| `pressReleaseLogs` | Dry-run and approved adapter evidence |
| `pressReleaseSettings` | Allowlisted press-release settings |
| `backlinkTargets` | Research targets, not created backlinks |
| `backlinkOpportunities` | Reviewable opportunities, not submissions |
| `aiCostLog` | Priced-call records written by the provider-cost tracking wrapper |

---

## AI provider boundary

The repository contains legacy OpenRouter model identifiers and optional writing, image, and embedding adapters.
Their presence does not prove that a model is currently offered, free, suitable, approved, or available to the
configured account. Provider catalogs and prices change. The operator must verify the current provider response and
pricing before an approved run; the UI and cost ledger must not be treated as a live provider catalog or invoice.

---

## AI Agent Integration Guide

This section is written for AI agents (Claude, GPT-4, etc.) that need to interact with this system programmatically.

### Quickstart for Claude

To use this API, an external agent needs a newly generated, least-privilege API key supplied through an approved secret manager. Never paste the key into chat, source, logs, screenshots, or browser-bundled configuration.

**Fetch this manifest:**
```
GET https://breakyoursolarcontract.com/api/capabilities
```

**Create a draft blog post for review:**
```http
POST https://breakyoursolarcontract.com/api/admin/posts
Authorization: Bearer <scoped-key>
Content-Type: application/json

{
  "slug": "arizona-solar-contract-records-review-checklist",
  "title": "Arizona Solar Contract Records: A Review Checklist",
  "content": "<h2>Records to collect</h2><p>Draft content with direct primary sources...</p>",
  "published": false,
  "metaDescription": "A draft checklist of records to collect before requesting an individual review."
}
```

**Trigger a press release run:**
```http
POST https://breakyoursolarcontract.com/api/trpc/pressRelease.runNow
Cookie: <session-cookie>
Content-Type: application/json

{"json": {"dryRun": true}}
```

**Check AI costs:**
```typescript
const summary = await trpc.aiCost.getSummary.query({ days: 30 });
```

### Recommended Workflows for AI Agents

**Content approval workflow:**
1. Generate a draft with sources, review date, and claim-evidence metadata.
2. Optionally upload a verified featured image via `POST /api/admin/upload`.
3. Save with `published: false`; do not infer publication approval from API access.
4. Have an authorized human review legal, privacy, advertising, and factual claims.
5. Publish only through an explicit approved action, then fetch the public URL and verify status, canonical, source content, schema, and rollback state.

**Press release review workflow:**
1. Add a topic through the authenticated review queue.
2. Generate only a dry-run preview.
3. Review the draft and its evidence outside the publication adapter.
4. Keep external submission disabled until a separately approved, typed, idempotent adapter can verify and roll back its effect.

**SEO monitoring workflow:**
1. Pull GA4 data via `analytics.report`
2. Identify underperforming pages
3. Stage a draft update via `PUT /api/admin/posts/:slug`.
4. Record the proposed change, evidence, approver, and verification plan through an authenticated application surface; never write directly to the database.

**SEO growth agent workflow:**
1. Build and run a production preview.
2. Run `pnpm seo:agent -- --base <preview-or-live-url>`.
3. Review `reports/seo-agent/HEARTBEAT.md` and `reports/seo-agent/ACTION_QUEUE.md`.
4. Implement the top queued action, then rerun the heartbeat to verify score and issue deltas.
5. Add `--ai` when `OPENROUTER_API_KEY` is available for an OpenRouter-written strategy note.

---

## Public Discovery and Legacy Routes (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/capabilities` | This manifest as JSON |
| GET | `/api/capabilities.md` | This manifest as raw Markdown |
| GET | `/city/:slug` | Legacy redirect to `/cancel-solar-contract/:slug`; not a data API |
| GET | `/state-solar-laws` | Legacy redirect to `/solar-contract-laws`; not a data API |

---

## Environment Variables

The deployment may require the following server-side environment variables. This list documents names only and does not prove that a value is configured. AI agents must not request or handle these values directly; they interact through scoped API keys or authenticated sessions.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MySQL/TiDB connection |
| `JWT_SECRET` | Session signing |
| `OAUTH_SERVER_URL` | Manus OAuth server URL |
| `OWNER_OPEN_ID` | Authorized owner identity |
| `OPENROUTER_API_KEY` | All AI model calls |
| `VITE_APP_ID` | Manus OAuth app ID |
| `BUILT_IN_FORGE_API_URL` | Manus platform API URL |
| `BUILT_IN_FORGE_API_KEY` | Manus platform APIs |
| `GHL_WEBHOOK_URL` | Server-only CRM delivery endpoint |
| `GA4_PROPERTY_ID` | Google Analytics 4 |
| `GA4_SERVICE_ACCOUNT_JSON` | GA4 service account |

---

*This document is auto-served at `/api/capabilities.md` and `/api/capabilities` (JSON). Update this file whenever new features are added. The server reads it directly from disk — no rebuild required.*
