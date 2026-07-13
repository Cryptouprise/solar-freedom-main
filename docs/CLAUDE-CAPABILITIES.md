# What Claude Can (and Cannot) Do via the Admin API

**Site:** breakyoursolarcontract.com  
**API Base:** `https://breakyoursolarcontract.com/api/admin`  
**Auth:** `Authorization: Bearer <scoped-api-key-from-your-secret-manager>`

This document is a quick-reference for what is and is not possible through the Admin Content API without Manus access.

---

## What Claude CAN Do

### Content Creation & Management

| Action | How | Notes |
|--------|-----|-------|
| **Create a new blog post** | `POST /api/admin/posts` | Full HTML content, meta tags, hero image, FAQs, tags, related slugs |
| **Edit an existing DB post** | `PUT /api/admin/posts/:slug` | Partial updates — only send changed fields |
| **Delete a DB post** | `DELETE /api/admin/posts/:slug` | Permanent — no undo |
| **Publish / unpublish a post** | `PUT /api/admin/posts/:slug` with `{"published": false}` | Toggles live status |
| **List all DB posts** | `GET /api/admin/posts` | Returns all Claude-published posts |
| **Read a single DB post** | `GET /api/admin/posts/:slug` | Returns full content + all fields |
| **See all 162+ articles** | `GET /api/admin/posts/all` | Static + DB combined — use for interlinking |
| **Get all article slugs** | `GET /api/admin/posts/slugs` | Lightweight list — use before writing new articles |

### Company Pages

| Action | How | Notes |
|--------|-----|-------|
| **Create a company page** | `POST /api/admin/companies` | Adds to the 13-company directory |
| **Update a company page** | `PUT /api/admin/companies/:slug` | Edit any field |
| **Read company data** | `GET /api/admin/companies` or `GET /api/admin/companies/:slug` | Full company object |

### Site Configuration

| Action | How | Notes |
|--------|-----|-------|
| **Update phone number** | `PUT /api/admin/config/phone_number` | Updates homepage, footer, sticky CTA |
| **Update E.164 phone** | `PUT /api/admin/config/phone_number_e164` | Updates `tel:` and `sms:` links |
| **Update assistant name** | `PUT /api/admin/config/assistant_name` | Sticky mobile widget label |
| **Read all config** | `GET /api/admin/config` | Returns all key/value pairs |

### Image Management

| Action | How | Notes |
|--------|-----|-------|
| **Upload image from URL** | `POST /api/admin/upload` with `{"url": "..."}` | Fetches and stores to CDN |
| **Upload image from base64** | `POST /api/admin/upload` with `{"data": "data:image/..."}` | Stores to CDN |
| **Batch upload (up to 10)** | `POST /api/admin/upload/batch` | Returns array of CDN URLs |
| **Use CDN URL in posts** | Set `heroImage` field or use `<img src="...">` in content | Permanent CloudFront URL |

### API Key Management

| Action | How | Notes |
|--------|-----|-------|
| **Generate a new API key** | `POST /api/admin/keys` | Specify name + permissions |
| **List existing keys** | `GET /api/admin/keys` | No secrets exposed |
| **Revoke a key** | `DELETE /api/admin/keys/:id` | Immediate effect |

### Automation (Advanced — Use with Care)

The `/api/admin/automation/apply` endpoint allows **allowlisted file writes** and **schema migrations**. This is powerful but has strict safety constraints:

- File writes are restricted to specific directories (`client/src`, `server`, `shared`, `drizzle`, `docs`)
- Only safe file extensions: `.ts`, `.tsx`, `.js`, `.mjs`, `.json`, `.md`, `.sql`, `.css`
- SQL is restricted to `CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX`, `DROP INDEX` only
- Max 20 operations per request
- Every request is audit-logged

**Practical uses for this endpoint:**
- Adding a new static data file (e.g., a new batch of city data)
- Updating shared constants
- Adding a new DB column (via `ALTER TABLE`)

---

## What Claude CANNOT Do

These limitations are by design — they require Manus access or direct server-side execution.

| Limitation | Why | Workaround |
|-----------|-----|-----------|
| **Modify React/TypeScript components** | Code changes require a dev server rebuild + deployment | Use Manus for UI changes |
| **Change site routing** | Routes are defined in `App.tsx` — requires code change + redeploy | Use Manus |
| **Run database migrations for new tables** | `pnpm db:push` must be run in the dev environment | Use Manus for schema changes |
| **Deploy/publish the site** | Deployment is triggered via the Manus UI Publish button | Click Publish in Manus after Manus makes code changes |
| **Modify static blog articles** | Static articles are TypeScript files compiled into the build | Use Manus to add new static batches; use the API for new dynamic posts |
| **Update CSS/design/styling** | CSS is compiled at build time | Use Manus |
| **Add new API endpoints** | Server code changes require rebuild | Use Manus |
| **Access the database directly** | No direct SQL access via API | Use the CRUD endpoints; use Manus for raw DB queries |
| **Read server logs or analytics** | No log endpoint | Check Manus dashboard or GSC |
| **Modify the sitemap** | `client/public/sitemap.xml` is a static file | Use Manus to update sitemap after adding new content types |
| **Update SEO meta for static pages** | `server/seo-meta.ts` is server code | Use Manus; DB posts get SEO meta automatically |
| **Trigger Google Indexing API** | Requires server-side service account auth | Use Manus to submit new URLs |
| **Access leads/CRM data** | No leads endpoint in Admin API | Use Manus or GHL directly |

---

## Recommended Claude Workflow

### Writing a New Article

```
1. GET /api/admin/posts/slugs          → Get all existing slugs for interlinking
2. Research the topic                   → Use web search
3. Generate hero image                  → Use image tool, then:
   POST /api/admin/upload { "url": "<generated-image-url>" }
4. Write full HTML content (1,200–2,000 words)
5. POST /api/admin/posts {
     slug, title, metaTitle, metaDescription,
     heroImage (CDN URL from step 3),
     content (HTML), category, tags,
     relatedSlugs (3–5 from step 1),
     faqItems (3–5 Q&A pairs),
     published: true
   }
6. Confirm: GET /api/admin/posts/:slug
```

### Updating an Existing Article

```
1. GET /api/admin/posts/all            → Find the post slug
2. GET /api/admin/posts/:slug          → Read current content
3. PUT /api/admin/posts/:slug {        → Send only changed fields
     title: "Updated Title",
     content: "<updated HTML>",
     metaDescription: "Updated description"
   }
```

### Content Quality Checklist

Every article published via the API should include:

- [ ] `slug` — lowercase, hyphenated, keyword-rich (e.g., `cancel-sunrun-contract-2026`)
- [ ] `title` — H1 with primary keyword near the front
- [ ] `metaTitle` — 50–60 characters, keyword + brand
- [ ] `metaDescription` — 150–160 characters, includes CTA
- [ ] `heroImage` — CDN URL from `/api/admin/upload`
- [ ] `content` — 1,200–2,000 words of HTML with H2/H3 structure
- [ ] `faqItems` — 3–5 Q&A pairs (renders as FAQ schema for Google)
- [ ] `relatedSlugs` — 3–5 existing article slugs for interlinking
- [ ] `category` — one of: `Legal Guide`, `Company Specific`, `Consumer Alert`, `Home Sale`, `Cost & Finance`, `Solar Fraud`
- [ ] `published: true`

---

## Content HTML Structure

```html
<p class="lead">Opening hook — establish the problem in 2–3 sentences.</p>

<h2>What Is [Topic]?</h2>
<p>Clear explanation...</p>

<h2>Common Problems with [Company/Topic]</h2>
<ul>
  <li><strong>Issue 1:</strong> Description...</li>
  <li><strong>Issue 2:</strong> Description...</li>
</ul>

<h2>Your Legal Rights</h2>
<p>Attorney-reviewed information...</p>

<h2>How to Get Out of Your Contract</h2>
<ol>
  <li>Step one...</li>
  <li>Step two...</li>
</ol>

<h2>Frequently Asked Questions</h2>
<!-- faqItems array handles FAQ schema automatically — no need to repeat in HTML -->

<div class="cta-block">
  <h3>Get a Free Case Review</h3>
  <p>Our solar attorneys have helped 3,000+ homeowners escape predatory contracts.
  <a href="/#contact">Start your free case review today.</a></p>
</div>
```

---

## API Key Permissions

Do not use a broad `*` key for routine automation. Grant only the permissions required for the task.

To create a restricted key for a specific use case:

```bash
curl -X POST \
  -H "Authorization: Bearer <scoped-api-key-from-your-secret-manager>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Content Writer (read + write only)",
    "permissions": ["posts:read", "posts:write", "companies:read"]
  }' \
  https://breakyoursolarcontract.com/api/admin/keys
```

| Permission | Allows |
|-----------|--------|
| `posts:read` | Read all posts |
| `posts:write` | Create and update posts |
| `posts:delete` | Delete posts |
| `companies:read` | Read company pages |
| `companies:write` | Create and update companies |
| `config:read` | Read site config |
| `config:write` | Update site config |
| `automation:execute` | Allowlisted file writes and schema migrations |
| `keys:manage` | Create, list, revoke API keys |
| `*` | All of the above |

---

*Last updated: May 2026*
