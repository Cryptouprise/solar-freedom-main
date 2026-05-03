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
| GET | `/api/admin/posts` | `posts:read` | List all posts (no body) |
| GET | `/api/admin/posts/:slug` | `posts:read` | Get single post with full content |
| POST | `/api/admin/posts` | `posts:write` | Create new post |
| PUT | `/api/admin/posts/:slug` | `posts:write` | Update existing post |
| DELETE | `/api/admin/posts/:slug` | `posts:delete` | Delete a post |

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
| PUT | `/api/admin/config/:key` | `config:write` | Set a config value |

#### Example: Update Phone Number

```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"value": "(888) 555-0123", "description": "Main contact phone number"}' \
  https://breakyoursolarcontract.com/api/admin/config/phone_number
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
    "permissions": ["posts:read", "posts:write", "companies:read"]
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
1. Research the topic thoroughly
2. Write the full HTML content
3. POST to /api/admin/posts with all fields
4. Confirm the post was created successfully
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
