# Solar Freedom — Admin Content API

**Base URL:** `https://breakyoursolarcontract.com/api/admin`  
**Authentication:** `Authorization: Bearer <your-api-key>`  
**Content-Type:** `application/json`

This API allows approved external tools to create and edit review-gated content records without requiring Manus access. It does not deploy code, bypass publication evidence checks, or make a draft publicly discoverable by itself.

---

## Quick Start

```bash
# Test your connection
curl -H "Authorization: Bearer YOUR_KEY" \
     https://breakyoursolarcontract.com/api/admin/status
```

A successful response looks like:
```json
{
  "status": "ok",
  "site": "breakyoursolarcontract.com",
  "apiKey": "Claude Desktop",
  "permissions": ["posts:read", "posts:write", ...],
  "stats": { "blogPosts": 102, "companies": 13 }
}
```

---

## Authentication

Every request must include an `Authorization` header with a Bearer token:

```
Authorization: Bearer <scoped-api-key-from-your-secret-manager>
```

Keys begin with `sf_` followed by 64 hex characters. If the key is invalid or missing, the API returns `401 Unauthorized`. If the key lacks the required permission for an endpoint, it returns `403 Forbidden`.

---

## Endpoints

### Status

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/admin/status` | any | Health check + site stats |

---

### Blog Posts

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/admin/posts/all` | `posts:read` | Research inventory (static + DB); presence does not mean public approval |
| GET | `/api/admin/posts/slugs` | `posts:read` | Lightweight research inventory; cross-check links against the public sitemap |
| GET | `/api/admin/posts` | `posts:read` | List DB-managed posts only |
| GET | `/api/admin/posts/:slug` | `posts:read` | Get single DB post with full content |
| POST | `/api/admin/posts` | `posts:write` | Create new post |
| PUT | `/api/admin/posts/:slug` | `posts:write` | Update existing post |
| DELETE | `/api/admin/posts/:slug` | `posts:delete` | Delete a post |

> **Interlinking workflow:** Use the inventory to detect overlap, then check the public sitemap. Add only genuinely relevant destinations that are currently approved and public; do not link users or crawlers to withheld research records.

#### Create a Blog Post

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "solar-agreement-records-checklist",
    "title": "Solar Agreement Records Checklist",
    "metaTitle": "Solar Agreement Records Checklist",
    "metaDescription": "A practical checklist for organizing a signed solar agreement, disclosures, bills, performance records, and written communications.",
    "category": "Agreement Records",
    "tags": ["solar agreement", "document checklist"],
    "excerpt": "Organize the records needed to understand the agreement and document the timeline.",
    "readTime": "6 min read",
    "content": "<h2>Start with the signed agreement</h2><p>...</p>",
    "relatedSlugs": [],
    "published": false
  }' \
  https://breakyoursolarcontract.com/api/admin/posts
```

#### Update a Blog Post

```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Draft Title",
    "content": "<h2>Updated draft</h2><p>...</p>",
    "published": false
  }' \
  https://breakyoursolarcontract.com/api/admin/posts/solar-agreement-records-checklist
```

Only include the fields you want to change — all other fields are preserved.

#### Blog Post Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | string | Yes (create) | URL-safe identifier, e.g. `cancel-sunrun-contract` |
| `title` | string | Yes | Page H1 heading |
| `content` | string | Yes | Full HTML body of the article |
| `metaTitle` | string | No | SEO title tag (defaults to title) |
| `metaDescription` | string | No | SEO meta description (150–160 chars) |
| `heroImage` | string | No | CDN URL for the hero image |
| `category` | string | No | Category label, e.g. `Company Guides` |
| `tags` | array | No | Array of tag strings |
| `excerpt` | string | No | Short summary for blog index cards |
| `readTime` | string | No | e.g. `7 min read` |
| `faqItems` | array | No | Useful, source-supported `{q, a}` content; schema is emitted only when the page passes the public gate |
| `relatedSlugs` | array | No | Array of related post slugs |
| `canonicalUrl` | string | No | Override canonical URL if needed |
| `published` | boolean | No | `true` requests publication; new posts default to draft |

Publication also requires a named reviewer and role, a non-future review date,
valid HTTPS primary sources with access dates, a substantive unique-value
summary, and `editorialFunnelOnlyDuplicate=false`. A publish-capable key cannot
bypass this server-side gate.

---

### Companies

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/admin/companies` | `companies:read` | List all companies |
| GET | `/api/admin/companies/:slug` | `companies:read` | Get single company |
| POST | `/api/admin/companies` | `companies:write` | Create company |
| PUT | `/api/admin/companies/:slug` | `companies:write` | Update company |

#### Create / Update a Company

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "sunnova",
    "name": "Sunnova Energy",
    "status": "active",
    "heroHeadline": "Sunnova Agreement Research Draft",
    "heroSubheadline": "Organize the agreement, disclosures, bills, performance records, and communications.",
    "customerComplaints": [],
    "documentedIssues": [],
    "legalGrounds": [],
    "published": false
  }' \
  https://breakyoursolarcontract.com/api/admin/companies
```

---

### Site Configuration

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/admin/config` | `config:read` | Get all config key/value pairs |
| PUT | `/api/admin/config/:key` | `config:write` | Set a config value |

#### Runtime keys currently wired into the website

| Key | Purpose | Example |
|-----|---------|---------|
| `phone_number` | Displayed contact phone in homepage schema + footer + sticky mobile CTA | `(888) 555-0123` |
| `phone_number_e164` | Dial/SMS phone for `tel:` and `sms:` links | `+18885550123` |
| `assistant_name` | Sticky mobile assistant name label | `Grace Silver` |
| `assistant_title` | Sticky mobile assistant title label | `AI Executive Assistant` |

#### Example: Update Phone Number

```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"value": "(888) 555-0123", "description": "Main contact phone number"}' \
  https://breakyoursolarcontract.com/api/admin/config/phone_number
```

```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"value": "+18885550123", "description": "Dial/SMS phone in E.164 format"}' \
  https://breakyoursolarcontract.com/api/admin/config/phone_number_e164
```

---

### Automation change planning (dry-run only)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| POST | `/api/admin/automation/apply` | `automation:execute` | Validate and hash a proposed batch without changing runtime state |

Safeguards:
- `dryRun` must be exactly `true`; non-dry-run requests return HTTP 409
- The endpoint never writes files, executes SQL, publishes content, commits Git, deploys, or reports an operation as applied
- Max 20 operations per request
- File writes are restricted to allowlisted paths under `client/src`, `server`, `shared`, `drizzle`, and `docs`
- File extensions are restricted (`.ts`, `.tsx`, `.js`, `.mjs`, `.json`, `.md`, `.sql`, `.css`)
- Optional optimistic locking via `expectedSha256`
- SQL migrations only allow statements starting with `CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX`, `DROP INDEX`
- SQL containing destructive data/table commands (`DROP TABLE`, `TRUNCATE`, `DELETE`, `UPDATE`, `INSERT`) is blocked
- SQL comments and `CREATE TABLE ... AS SELECT` are blocked
- Every request is audit-logged to `siteConfig` under an `automation_audit_*` key

The response reports `executionEnabled: false`, `applied: 0`, and a `planned` count. Execute an approved plan through a Git pull request or a typed deployment/CMS adapter that records verification and rollback evidence.

#### Example: Dry run

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "dryRun": true,
    "operations": [
      {
        "type": "write_file",
        "path": "shared/const.ts",
        "content": "export const EXAMPLE = true;"
      },
      {
        "type": "sql_migration",
        "statement": "ALTER TABLE siteConfig ADD COLUMN source varchar(100) NULL"
      }
    ]
  }' \
  https://breakyoursolarcontract.com/api/admin/automation/apply
```

---

### Image Upload

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| POST | `/api/admin/upload` | `posts:write` | Upload a single image, get CDN URL |
| POST | `/api/admin/upload/batch` | `posts:write` | Upload up to 10 images at once |

Remote URL imports are intentionally disabled because fetching an agent-supplied URL from the server creates a DNS-rebinding/SSRF boundary. Upload validated image bytes as base64 data.

#### Upload base64 data

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "data:image/png;base64,iVBORw0KGgo...",
    "filename": "hero-image"
  }' \
  https://breakyoursolarcontract.com/api/admin/upload
```

#### Batch upload (up to 10 images)

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      { "data": "data:image/png;base64,iVBORw0KGgo...", "filename": "hero" },
      { "data": "data:image/webp;base64,UklGRi...", "filename": "section-2" }
    ]
  }' \
  https://breakyoursolarcontract.com/api/admin/upload/batch
```

#### Response

```json
{
  "success": true,
  "url": "https://d2xsxph8kpxj0f.cloudfront.net/.../blog-images/solar-panel-hero-a1b2c3d4.jpg",
  "key": "blog-images/solar-panel-hero-a1b2c3d4.jpg",
  "mimeType": "image/jpeg",
  "size": 27424,
  "filename": "solar-panel-hero.jpg"
}
```

Use the returned `url` in your blog post's `heroImage` field or inline as `<img src="URL">`.

#### Complete Workflow: Generate Image + Create Post

```
1. Generate or obtain an image, then read its bytes in the trusted client
2. POST /api/admin/upload with base64 `data`, `contentType`, and a descriptive filename
3. Get back permanent CDN URL
4. POST /api/admin/posts with heroImage set to the CDN URL
```

---

### API Key Management

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/admin/keys` | `keys:manage` | List all API keys (no hashes) |
| POST | `/api/admin/keys` | `keys:manage` | Generate a new API key |
| DELETE | `/api/admin/keys/:id` | `keys:manage` | Revoke an API key |

#### Generate a New Key

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
     "name": "Cursor IDE",
     "permissions": ["posts:read", "posts:write", "companies:read", "automation:execute"]
   }' \
  https://breakyoursolarcontract.com/api/admin/keys
```

The response includes the full key — **save it immediately, it will not be shown again**.

---

## Permissions Reference

| Permission | What It Allows |
|-----------|----------------|
| `posts:read` | Read blog posts |
| `posts:write` | Create and update blog posts |
| `posts:publish` | Request publication; the evidence gate still applies and this permission is excluded from new keys by default |
| `posts:delete` | Delete blog posts |
| `companies:read` | Read company data |
| `companies:write` | Create and update companies |
| `config:read` | Read site config values |
| `config:write` | Set site config values |
| `automation:execute` | Validate and hash dry-run change plans; direct execution is disabled |
| `keys:manage` | List, create, and revoke API keys |
| `*` | All permissions |

---

## Using This API with an External Draft Agent

### Draft-Agent Prompt

Use a scoped `posts:read,posts:write` key and this prompt. Keep `posts:publish`
out of the drafting key so the human review gate cannot be bypassed.

```
You are a draft assistant for breakyoursolarcontract.com, a consumer-information
site that accepts individual solar-agreement document-review requests.

You have access to the Admin API at:
  https://breakyoursolarcontract.com/api/admin

Authentication: Authorization: Bearer <scoped-key-from-your-secret-manager>

Content and evidence rules:
- Create drafts only; never treat model memory, search-result snippets, or another article as a source
- Use a calm, factual, source-conscious tone; do not manufacture urgency
- Include an FAQ only when useful and every answer is supported by visible approved sources
- Use HTML for content (h2, h3, p, ul, li tags)
- Use the length needed to answer the reader's question; do not pad to a word quota
- Invite an individual document-review request without promising price, representation, outcome, or timing
- Do not invent professional identities, fees, results, timing, legal conclusions, company misconduct, or statistics
- Link only to current primary sources and approved pages present in the public sitemap
- New records must use published: false until the editorial evidence gate is complete

When creating a draft:
1. Define a nonduplicative reader question and a primary-source plan
2. Collect current primary sources outside the model
3. Optionally generate a hero-image draft, then upload its trusted bytes:
   POST /api/admin/upload with { "data": "<base64>", "contentType": "image/png", "filename": "descriptive-name" }
   Save the returned CDN url for the heroImage field
4. Write the HTML draft and mark unresolved statements [SOURCE REQUIRED]
5. POST with published: false and only relevant, approved relatedSlugs
6. Confirm persistence and hand the draft to a named reviewer

When uploading images:
- POST /api/admin/upload with { "data": "base64...", "contentType": "image/png" }
- Remote URL imports are rejected; fetch bytes only in a trusted client
- POST /api/admin/upload/batch with { "images": [...] } for multiple images (max 10)
- All uploads return a permanent CDN URL you can use in heroImage or <img> tags

When updating articles:
1. Call GET /api/admin/posts/all to find the post by slug
2. Call GET /api/admin/posts/:slug to read the current content
3. PUT to /api/admin/posts/:slug with only the changed fields
```

### Example Draft Workflow

**You:** "Prepare a sourced draft explaining records a homeowner may want to gather before reviewing a solar loan agreement."

**The draft agent will:**
1. Propose a primary-source plan and identify overlap with existing approved pages
2. Write a calm HTML draft, leaving unsupported statements visibly unresolved
3. POST to `/api/admin/posts` with `published: false`
4. Return the draft identifier and source checklist for human review

---

## Content Format Guide

Blog post `content` should be valid HTML. Example structure:

```html
<p class="lead">Opening hook paragraph that establishes the problem...</p>

<h2>What Is [Topic]?</h2>
<p>Explanation paragraph...</p>

<h2>Common Problems with [Company]</h2>
<ul>
  <li><strong>Issue 1:</strong> Description...</li>
  <li><strong>Issue 2:</strong> Description...</li>
</ul>

<h2>Primary Sources and Scope</h2>
<p>Summarize only the current primary sources recorded in the editorial review.</p>

<h2>Questions for an Individual Review</h2>
<ol>
  <li>Which termination, dispute, financing, and transfer provisions appear in the signed documents?</li>
  <li>Which written records support or contradict the issue being described?</li>
</ol>

<div class="cta-block">
  <h3>Request a Document Review</h3>
  <p>Options and outcomes depend on the agreement, facts, and jurisdiction. No representation or result is promised.</p>
</div>
```

---

## Error Responses

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request — missing required fields |
| 401 | Unauthorized — invalid or missing API key |
| 403 | Forbidden — key lacks required permission |
| 404 | Resource not found |
| 409 | Conflict — slug already exists |
| 503 | Database unavailable |

---

*Last updated: July 2026*
