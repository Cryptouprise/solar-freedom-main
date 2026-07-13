# Solar Freedom — App Capabilities Manifest

**Site:** breakyoursolarcontract.com  
**Stack:** React 19 + Tailwind 4 + Express 4 + tRPC 11 + MySQL (TiDB) + Playwright  
**Last updated:** 2026-05-18  
**Manifest endpoint:** `GET /api/capabilities` (returns this document as JSON + Markdown)  
**Manifest Markdown:** `GET /api/capabilities.md` (returns raw Markdown for AI ingestion)

---

## Overview

Solar Freedom is a full-stack web application and autonomous content/backlink engine for breakyoursolarcontract.com. It serves as a lead generation site for homeowners seeking to exit solar contracts, and includes a server-side AI agent system that autonomously generates press releases, submits them to distribution networks, discovers backlink opportunities, tracks AI costs, and manages all site content via a REST API designed for AI agent access.

---

## Authentication

### Manus OAuth (User Sessions)
End-users authenticate via Manus OAuth. Session cookies are set at `/api/oauth/callback`. The `useAuth()` hook on the frontend reads auth state. Admin-only routes require `role === "admin"` in the user record.

### Admin API Key Authentication
All `/api/admin/*` REST endpoints use API key authentication. Keys are stored in the `apiKeys` DB table and managed via the admin panel.

**Header format:**
```
X-API-Key: <your-api-key>
```

**Obtaining a key:** Log in as admin → `/admin/press-releases` → Settings → API Keys section, or use the database UI to insert directly into the `apiKeys` table.

---

## REST API — `/api/admin/*`

All endpoints require `X-API-Key` header. Base URL: `https://breakyoursolarcontract.com/api/admin`

### Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/status` | Health check — returns server uptime, DB status, version |

### Blog Posts

| Method | Endpoint | Permission | Description |
|--------|----------|-----------|-------------|
| GET | `/posts` | `posts:read` | List published posts (paginated, `?page=1&limit=20`) |
| GET | `/posts/all` | `posts:read` | List all posts including drafts |
| GET | `/posts/slugs` | `posts:read` | List all post slugs (lightweight, for sitemaps) |
| GET | `/posts/:slug` | `posts:read` | Get single post by slug |
| POST | `/posts` | `posts:write` | Create new post |
| PUT | `/posts/:slug` | `posts:write` | Update existing post |
| DELETE | `/posts/:slug` | `posts:delete` | Delete post |

**POST/PUT body schema:**
```json
{
  "title": "string (required)",
  "slug": "string (auto-generated if omitted)",
  "content": "string — HTML or Markdown",
  "excerpt": "string",
  "metaTitle": "string",
  "metaDescription": "string",
  "featuredImage": "string — S3 URL",
  "status": "published | draft",
  "tags": ["string"],
  "category": "string",
  "author": "string",
  "publishedAt": "ISO 8601 timestamp"
}
```

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

**Upload format:** `multipart/form-data` with field `file` (single) or `files[]` (batch).

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

All tRPC calls use POST to `/api/trpc/<router>.<procedure>`. Authenticated calls require the session cookie (browser) or can be called server-side. Protected procedures require admin role for admin operations.

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
  issue?: string;
  monthlyPayment?: string;
  intent?: string;
  source?: string;
}
```

### `analytics` Router

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `analytics.report` | query | admin | Pull GA4 report (`{ startDate, endDate, metrics[], dimensions[] }`) |

### `content` Router

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `content.listPosts` | query | public | List published blog posts (`{ page, limit, category?, tag? }`) |
| `content.getPost` | query | public | Get post by slug |
| `content.listCompanies` | query | public | List solar company profiles |
| `content.getCompany` | query | public | Get company by slug |
| `content.getSiteConfig` | query | public | Get all site config values |

### `exitIntent` Router

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `exitIntent.capture` | mutation | public | Log exit intent capture event |

### `pressRelease` Router (Admin only)

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `pressRelease.getTopics` | query | admin | List all press release topics in queue |
| `pressRelease.addTopic` | mutation | admin | Add topic to queue (`{ title, keywords, angle, priority }`) |
| `pressRelease.deleteTopic` | mutation | admin | Delete topic by ID |
| `pressRelease.updateTopicStatus` | mutation | admin | Set topic status (`pending \| active \| done \| skip`) |
| `pressRelease.getLogs` | query | admin | Get submission logs (`{ limit, offset }`) |
| `pressRelease.getSettings` | query | admin | Get all press release settings as key-value map |
| `pressRelease.updateSetting` | mutation | admin | Update a setting (`{ key, value }`) |
| `pressRelease.runNow` | mutation | admin | Trigger immediate press release cycle (`{ dryRun?: boolean }`) |
| `pressRelease.runDiscovery` | mutation | admin | Trigger backlink discovery scan |

**Available setting keys:**

| Key | Default | Description |
|-----|---------|-------------|
| `model` | `openrouter/owl-alpha` | LLM model for writing |
| `image_model` | `none` | Image generation model |
| `embedding_model` | `none` | Embedding model |
| `schedule_enabled` | `true` | Enable weekly cron |
| `dry_run` | `false` | Generate without submitting |
| `site_prlog` | `true` | Enable PRLog submission |
| `site_newsbywire` | `true` | Enable NewsByWire submission |
| `site_1888pressrelease` | `true` | Enable 1888PressRelease |
| `site_openpr` | `true` | Enable OpenPR |
| `site_prfree` | `true` | Enable PRFree |
| `site_prbuzz` | `true` | Enable PRBuzz |
| `site_medium` | `true` | Enable Medium |
| `site_linkedin` | `true` | Enable LinkedIn Articles |
| `site_substack` | `false` | Enable Substack |
| `substack_url` | `` | Substack publication URL |

### `backlinks` Router (Admin only)

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `backlinks.getOpportunities` | query | admin | List discovered backlink opportunities (`{ status?, limit, offset }`) |
| `backlinks.updateOpportunity` | mutation | admin | Update opportunity status/notes |
| `backlinks.getTargets` | query | admin | List known PR/backlink target sites |
| `backlinks.seedKnownSites` | mutation | admin | Seed default PR sites into targets table |

### `aiCost` Router (Admin only)

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `aiCost.getSummary` | query | admin | Cost summary: total, by day, by call type (`{ days: 30 }`) |
| `aiCost.getByModel` | query | admin | Cost breakdown per model with token counts |
| `aiCost.getByFeature` | query | admin | Cost breakdown per feature (press_release, blog, etc.) |
| `aiCost.getRecentLogs` | query | admin | Recent API call log entries (`{ limit: 50 }`) |

---

## Cron Jobs (Server-Side Autonomous Agents)

All cron jobs run automatically on the server. They can also be triggered manually via the admin panel or the `pressRelease.runNow` / `pressRelease.runDiscovery` tRPC mutations.

| Job | Schedule | File | Description |
|-----|----------|------|-------------|
| Press Release Cycle | Every Monday 9am MT | `server/cron/pressRelease.ts` | Picks next pending topic, generates press release via LLM, optionally generates featured image, submits to all enabled distribution sites |
| Backlink Discovery | Every Sunday 8am MT | `server/cron/backlinkDiscovery.ts` | Uses AI to discover high-DA backlink opportunities in solar/legal/consumer protection niche, scores and stores them |
| SEO Growth Agent | Manual / schedulable | `scripts/seo-growth-agent.mjs` | Crawls sitemap URLs, scores crawler-facing HTML, writes heartbeat/action queue, and optionally uses OpenRouter for strategy notes |

### Press Release Distribution Sites

| Site | DA | Method | Auth Required |
|------|----|--------|--------------|
| PRLog | 73 | HTTP API | API key in settings |
| NewsByWire | 65 | HTTP API | API key in settings |
| 1888PressRelease | 58 | Playwright form | None |
| OpenPR | 62 | Playwright form | None |
| PRFree | 55 | Playwright form | None |
| PRBuzz | 52 | Playwright form | None |
| Medium | 95 | Playwright + Google OAuth | Saved browser session |
| LinkedIn Articles | 98 | Playwright + Google OAuth | Saved browser session |
| Substack | 90 | Playwright + Google OAuth | Saved browser session + URL setting |

---

## Database Tables

| Table | Rows (approx) | Purpose |
|-------|--------------|---------|
| `users` | — | Authenticated users (Manus OAuth) |
| `leads` | growing | Form submissions from site visitors |
| `exitIntentCaptures` | growing | Exit intent popup captures |
| `blogPosts` | growing | All blog/content posts |
| `companies` | ~50 | Solar company profiles |
| `siteConfig` | ~20 | Key-value site configuration |
| `apiKeys` | — | Admin REST API keys with permissions |
| `siteEvents` | growing | Analytics event log |
| `seoStrategy` | — | SEO strategy documents |
| `seoPages` | growing | Per-page SEO metadata |
| `pressReleaseTopics` | 7+ | Queue of topics for press releases |
| `pressReleaseLogs` | growing | Log of every press release run and submission |
| `pressReleaseSettings` | ~15 | Key-value settings for the PR engine |
| `backlinkTargets` | growing | Known PR/backlink target sites with DA scores |
| `backlinkOpportunities` | growing | AI-discovered backlink opportunities |
| `aiCostLog` | growing | Every LLM/image/embedding API call with cost |

---

## AI Models Available

### Writing (LLM)

| Model ID | Cost | Notes |
|----------|------|-------|
| `openrouter/owl-alpha` | Free | Default — high quality |
| `qwen/qwen3-8b:free` | Free | — |
| `google/gemini-flash-1.5:free` | Free | — |
| `meta-llama/llama-3.1-8b-instruct:free` | Free | — |
| `tencent/hunyuan-a13b-instruct:free` | Free | — |
| `deepseek/deepseek-chat-v3-0324:free` | Free | — |
| `google/gemini-2.5-flash-preview` | ~$0.001/run | Paid |
| `qwen/qwen3-14b` | ~$0.001/run | Paid |
| `google/gemini-flash-2.0` | ~$0.001/run | Paid |
| `anthropic/claude-3-haiku` | ~$0.005/run | Premium |

### Image Generation

| Model ID | Cost | Notes |
|----------|------|-------|
| `bytedance-seed/seedream-4.5` | ~$0.025/image | High quality |
| `google/gemini-3.1-flash-image-preview` | ~$0.020/image | — |
| `google/gemini-2.5-flash-image` | ~$0.020/image | — |

### Embeddings

| Model ID | Cost | Notes |
|----------|------|-------|
| `qwen/qwen3-embedding-8b:nitro` | ~$0.05/1M tokens | Fast |
| `qwen/qwen3-embedding-8b:exacto` | ~$0.05/1M tokens | Precise |

---

## AI Agent Integration Guide

This section is written for AI agents (Claude, GPT-4, etc.) that need to interact with this system programmatically.

### Quickstart for Claude

To use this API, Claude needs an API key. The owner can generate one at `/admin/press-releases` → Settings → API Keys.

**Fetch this manifest:**
```
GET https://breakyoursolarcontract.com/api/capabilities
```

**Publish a blog post:**
```http
POST https://breakyoursolarcontract.com/api/admin/posts
X-API-Key: <key>
Content-Type: application/json

{
  "title": "Why Solar Contracts Are Unenforceable in Arizona",
  "content": "<h2>The Problem</h2><p>...</p>",
  "status": "published",
  "metaDescription": "Learn why solar contracts may be unenforceable..."
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
```http
POST https://breakyoursolarcontract.com/api/trpc/aiCost.getSummary
Cookie: <session-cookie>
Content-Type: application/json

{"json": {"days": 30}}
```

### Recommended Workflows for AI Agents

**Content publishing workflow:**
1. Generate article content (title, body HTML, meta description, tags)
2. Optionally upload featured image via `POST /api/admin/upload`
3. Publish via `POST /api/admin/posts`
4. Verify with `GET /api/admin/posts/:slug`

**Press release workflow:**
1. Add topic via `pressRelease.addTopic` tRPC mutation
2. Trigger run via `pressRelease.runNow` with `dryRun: true`
3. Review output in `pressRelease.getLogs`
4. If satisfied, run again with `dryRun: false`

**SEO monitoring workflow:**
1. Pull GA4 data via `analytics.report`
2. Identify underperforming pages
3. Update content via `PUT /api/admin/posts/:slug`
4. Log strategy via `seoStrategy` table (direct DB or future tRPC)

**SEO growth agent workflow:**
1. Build and run a production preview.
2. Run `pnpm seo:agent -- --base <preview-or-live-url>`.
3. Review `reports/seo-agent/HEARTBEAT.md` and `reports/seo-agent/ACTION_QUEUE.md`.
4. Implement the top queued action, then rerun the heartbeat to verify score and issue deltas.
5. Add `--ai` when `OPENROUTER_API_KEY` is available for an OpenRouter-written strategy note.

---

## Public REST Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/capabilities` | This manifest as JSON |
| GET | `/api/capabilities.md` | This manifest as raw Markdown |
| GET | `/city/:slug` | City-specific solar law page data |
| GET | `/state-solar-laws` | State solar law index |

---

## Environment Variables

The following environment variables are configured on the server. AI agents should not need these directly — they interact via API keys or session cookies.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MySQL/TiDB connection |
| `JWT_SECRET` | Session signing |
| `OPENROUTER_API_KEY` | All AI model calls |
| `VITE_APP_ID` | Manus OAuth app ID |
| `BUILT_IN_FORGE_API_KEY` | Manus platform APIs |
| `GA4_PROPERTY_ID` | Google Analytics 4 |
| `GA4_SERVICE_ACCOUNT_JSON` | GA4 service account |

---

*This document is auto-served at `/api/capabilities.md` and `/api/capabilities` (JSON). Update this file whenever new features are added. The server reads it directly from disk — no rebuild required.*
