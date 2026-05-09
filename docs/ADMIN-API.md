# Solar Freedom — Admin Content API

**Base URL:** `https://breakyoursolarcontract.com/api/admin`  
**Authentication:** `Authorization: Bearer <your-api-key>`  
**Content-Type:** `application/json`

This API allows external AI tools (Claude, Cursor, etc.) to fully manage the content of `breakyoursolarcontract.com` — creating, editing, and deleting blog posts, company pages, and site configuration — without requiring Manus access.

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
Authorization: Bearer sf_c95d0b522cf9d0f593e8dd9983fbcb217f13215a8e831cd434e3c69c771c6726
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
| GET | `/api/admin/posts/all` | `posts:read` | **All posts (static + DB)** — use for interlinking |
| GET | `/api/admin/posts/slugs` | `posts:read` | **Lightweight slug list** — all 160+ articles |
| GET | `/api/admin/posts` | `posts:read` | List DB-managed posts only |
| GET | `/api/admin/posts/:slug` | `posts:read` | Get single DB post with full content |
| POST | `/api/admin/posts` | `posts:write` | Create new post |
| PUT | `/api/admin/posts/:slug` | `posts:write` | Update existing post |
| DELETE | `/api/admin/posts/:slug` | `posts:delete` | Delete a post |

> **Interlinking Workflow:** Before writing a new article, call `GET /api/admin/posts/slugs` to get all 160+ existing article slugs and titles. Pick 3-5 relevant ones and include them in the `relatedSlugs` field and as `<a href="/blog/SLUG">` links within your content.

#### Create a Blog Post

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "how-to-cancel-sunrun-contract-2026",
    "title": "How to Cancel Your Sunrun Contract in 2026",
    "metaTitle": "Cancel Sunrun Contract 2026 | Solar Freedom",
    "metaDescription": "Learn how to legally cancel your Sunrun solar contract. Attorney-reviewed guide covering rescission rights, PACE loans, and complaint process.",
    "heroImage": "https://cdn.example.com/sunrun-cancel.jpg",
    "category": "Company Guides",
    "tags": ["Sunrun", "cancel solar contract", "solar complaints"],
    "excerpt": "Sunrun is the largest residential solar company in the US — and one of the most complained about. Here is how to get out.",
    "readTime": "8 min read",
    "content": "<h2>Understanding Your Sunrun Contract</h2><p>...</p>",
    "faqItems": [
      {"q": "Can I cancel my Sunrun contract?", "a": "Yes, under certain conditions..."},
      {"q": "What is the Sunrun cancellation fee?", "a": "Sunrun typically charges..."}
    ],
    "relatedSlugs": ["sunrun-solar-complaints", "solar-contract-rescission-rights"],
    "published": true
  }' \
  https://breakyoursolarcontract.com/api/admin/posts
```

#### Update a Blog Post

```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "content": "<h2>New Content</h2><p>Updated body...</p>",
    "published": true
  }' \
  https://breakyoursolarcontract.com/api/admin/posts/how-to-cancel-sunrun-contract-2026
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
| `faqItems` | array | No | Array of `{q, a}` objects for FAQ schema |
| `relatedSlugs` | array | No | Array of related post slugs |
| `canonicalUrl` | string | No | Override canonical URL if needed |
| `published` | boolean | No | `true` = live, `false` = draft (default: true) |

---

### Companies

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/admin/companies` | `companies:read` | List all companies |
| GET | `/api/admin/companies/:slug` | `companies:read` | Get single company |
| POST | `/api/admin/companies` | `companies:write` | Create company |
| PUT | `/api/admin/companies/:slug` | `companies:write` | Update company |
| POST | `/api/admin/companies/:slug/archive` | `companies:write` | Archive (soft-delete) a company |
| DELETE | `/api/admin/companies/:slug` | `companies:write` | Delete a company |

#### Create / Update a Company

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "sunnova",
    "name": "Sunnova Energy",
    "status": "active",
    "bbbRating": "B",
    "complaintCount": "800+",
    "heroHeadline": "Trapped in a Sunnova Contract?",
    "heroSubheadline": "Get a free case review from our solar attorneys",
    "customerComplaints": ["High monthly payments", "System underperformance"],
    "legalGrounds": ["Misrepresentation", "PACE loan violations"],
    "published": true
  }' \
  https://breakyoursolarcontract.com/api/admin/companies
```

---

### Site Configuration

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/admin/config` | `config:read` | Get all config key/value pairs |
| POST | `/api/admin/config` | `config:write` | Upsert one key/value (`{ key, value }`) |
| PUT | `/api/admin/config` | `config:write` | Bulk upsert key/value pairs from request body |
| DELETE | `/api/admin/config/:key` | `config:write` | Delete a config key |

#### Runtime keys currently wired into the website

| Key | Purpose | Example |
|-----|---------|---------|
| `phone_number` | Displayed contact phone in homepage schema + footer + sticky mobile CTA | `(888) 555-0123` |
| `phone_number_e164` | Dial/SMS phone for `tel:` and `sms:` links | `+18885550123` |
| `assistant_name` | Sticky mobile assistant name label | `Grace Silver` |
| `assistant_title` | Sticky mobile assistant title label | `AI Executive Assistant` |

#### Example: Upsert One Key

```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key": "phone_number", "value": "(888) 555-0123"}' \
  https://breakyoursolarcontract.com/api/admin/config
```

#### Example: Bulk Upsert

```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "(888) 555-0123", "phone_number_e164": "+18885550123"}' \
  https://breakyoursolarcontract.com/api/admin/config
```

---

### Automation (Allowlisted file edits + schema migrations)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| POST | `/api/admin/automation/apply` | `automation:execute` | Apply a batch of allowlisted file writes and/or schema migrations |

Safeguards:
- Max 20 operations per request
- File writes are restricted to allowlisted paths under `client/src`, `server`, `shared`, `drizzle`, and `docs`
- File extensions are restricted (`.ts`, `.tsx`, `.js`, `.mjs`, `.json`, `.md`, `.sql`, `.css`)
- Optional optimistic locking via `expectedSha256`
- SQL migrations only allow statements starting with `CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX`, `DROP INDEX`
- SQL containing destructive data/table commands (`DROP TABLE`, `TRUNCATE`, `DELETE`, `UPDATE`, `INSERT`) is blocked
- SQL comments and `CREATE TABLE ... AS SELECT` are blocked
- Every request is audit-logged to `siteConfig` under an `automation_audit_*` key

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

Claude can upload images in two ways:

#### Option 1: Upload from URL (recommended for AI-generated images)

If Claude generates an image via Gemini/DALL-E and has a temporary URL:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://generated-image-url.com/image.png",
    "filename": "solar-panel-hero"
  }' \
  https://breakyoursolarcontract.com/api/admin/upload
```

#### Option 2: Upload base64 data

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

#### Option 3: Batch upload (up to 10 images)

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      { "url": "https://example.com/img1.png", "filename": "hero" },
      { "url": "https://example.com/img2.png", "filename": "section-2" }
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
1. Generate image with Gemini/DALL-E → get temporary URL
2. POST /api/admin/upload with { url: "temp-url", filename: "descriptive-name" }
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
| `posts:delete` | Delete blog posts |
| `companies:read` | Read company data |
| `companies:write` | Create and update companies |
| `config:read` | Read site config values |
| `config:write` | Set site config values |
| `automation:execute` | Apply allowlisted file edits and schema migrations |
| `keys:manage` | List, create, and revoke API keys |
| `*` | All permissions |

---

## Using This API with Claude

### System Prompt for Claude

When starting a Claude conversation to manage this site, use this system prompt:

```
You are the content manager for breakyoursolarcontract.com, a legal resource site 
helping homeowners cancel predatory solar contracts.

You have access to the Admin API at:
  https://breakyoursolarcontract.com/api/admin

Your API key: sf_c95d0b522cf9d0f593e8dd9983fbcb217f13215a8e831cd434e3c69c771c6726

Content guidelines:
- All articles target homeowners trapped in solar contracts
- Tone: authoritative, empathetic, urgent but not alarmist
- Always include FAQ sections with 3-5 questions
- Use HTML for content (h2, h3, p, ul, li tags)
- Target 1,200-2,000 words per article
- Include a clear CTA to the free case review form
- Meta descriptions should be 150-160 characters
- Slugs should be lowercase, hyphenated, keyword-rich

When creating articles:
1. Call GET /api/admin/posts/slugs to get all existing article slugs for interlinking
2. Research the topic thoroughly
3. Generate a hero image with Gemini, then upload it:
   POST /api/admin/upload with { "url": "<gemini-image-url>", "filename": "descriptive-name" }
   Save the returned CDN url for the heroImage field
4. Write the full HTML content (1,200-2,000 words) with 3-5 internal links to existing articles
5. POST to /api/admin/posts with all fields including heroImage URL and relatedSlugs
6. Confirm the post was created and return the URL

When uploading images:
- POST /api/admin/upload with { "url": "<image-url>" } to store from a URL
- POST /api/admin/upload with { "data": "base64..." } to store from base64
- POST /api/admin/upload/batch with { "images": [...] } for multiple images (max 10)
- All uploads return a permanent CDN URL you can use in heroImage or <img> tags

When updating articles:
1. Call GET /api/admin/posts/all to find the post by slug
2. Call GET /api/admin/posts/:slug to read the current content
3. PUT to /api/admin/posts/:slug with only the changed fields
```

### Example Claude Workflow

**You:** "Write a new article about GoodLeap solar loan problems and publish it."

**Claude will:**
1. Research GoodLeap complaints and legal issues
2. Write a 1,500-word HTML article with FAQ
3. POST to `/api/admin/posts` with the full content
4. Return the confirmation with the new post's URL

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

<h2>Your Legal Rights</h2>
<p>Attorney-reviewed legal information...</p>

<h2>How to Get Out of Your Contract</h2>
<ol>
  <li>Step one...</li>
  <li>Step two...</li>
</ol>

<div class="cta-block">
  <h3>Get a Free Case Review</h3>
  <p>Our solar attorneys have helped 3,000+ homeowners...</p>
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

*Last updated: May 2026*
