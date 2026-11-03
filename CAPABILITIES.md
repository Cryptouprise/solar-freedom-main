# Solar Freedom — External AI Operating Guide

Updated November 3, 2026. Site: **https://breakyoursolarcontract.com**. The business goal is qualified clicks, leads and verifiable appointments—not more generated articles or higher internal checklist scores.

## Connect without this Manus chat

For routine reviews, images and repair drafts, an external AI can call the site's own REST API. An authenticated browser AI can use the existing owner dashboards. These are two different access methods.

**API base:** `https://breakyoursolarcontract.com/api/admin`

```http
Authorization: Bearer <private-scoped-key>
Content-Type: application/json
```

`X-API-Key` is NOT the accepted authentication header. REST API keys do not authenticate protected tRPC calls. Browser dashboards use the existing admin OAuth session.

### Get a limited key

Open **/admin/outcomes → Page appearance—not just SEO wording → Connect another AI → Create limited access key**. Name it after the AI. Copy it once into that AI's secret manager; never into a repository, public chat or frontend code. The same section lists dedicated external keys and lets the owner revoke them.

The limited key grants `posts:read`, `drafts:write`, `media:write`, `visual:review`, `seo:read`, and `agents:read`. It does **not** grant live-post edits, publication, deletion, raw SQL, site configuration, schedule/model changes, key administration or CRM access. No key is created merely by reading this guide.

## API controls for the same review-and-improvement workflow

| Method | Endpoint under /api/admin | Permission | Actual effect |
|---|---|---|---|
| GET | `/status` | Authenticated key/session | Connection check |
| GET | `/posts/all` or `/posts/slugs` | `posts:read` | Existing static/DB article inventory; not city-page source |
| GET | `/posts/source/:slug` | `posts:read` | Exact editable blog source and `sourceFingerprint`; static sources are adapted to HTML |
| POST | `/media/upload` | `media:write` | Validate image bytes, store a managed asset, return URL; no page change |
| POST | `/presentation/review` | `visual:review` | Send supplied page captures to Gemini 4 Argon through OpenRouter and save an assessment receipt; no public repair |
| GET | `/presentation/reviews` | `posts:read` | Latest six saved capture-review receipts |
| POST | `/drafts` | `drafts:write` | Save an exact existing-blog repair draft with source-fingerprint check; never publish |
| GET | `/seo/outcomes` | `seo:read` | Latest persisted scorecard windows and sources; not a new Google query |
| GET | `/agents/work` | `agents:read` | Bounded durable worker status without customer records or provider secrets |

### Repair draft request

First read `/posts/source/:slug`. Send its fingerprint back unchanged. A changed source returns HTTP 409; re-read rather than overwriting blindly.

```json
{
  "postSlug": "existing-article-slug",
  "expectedSourceFingerprint": "<64-character sourceFingerprint from the source response>",
  "name": "Readable layout and CTA repair",
  "title": "<preserved article title>",
  "content": "<h2>Descriptive section</h2><p>One short idea.</p><p>Another short idea.</p>",
  "targetKeyword": "<verified target keyword>"
}
```

Required: postSlug, expectedSourceFingerprint, name, title, content. Optional: metaTitle (maximum 60 characters), metaDescription (maximum 160), heroImage, excerpt, targetKeyword. Additional fields such as `published` are rejected. Content is sanitized. The response contains the real draft ID, `published:false`, and an exact Blog Studio `reviewPath`. The draft opens for owner inspection; it does not alter the public article or restore an unrelated source. Live-source changes after draft creation still require owner review before applying.

### Managed image request

```json
{
  "data": "data:image/png;base64,<validated-image-bytes>",
  "contentType": "image/png",
  "filename": "solar-agreement-document-checklist"
}
```

Maximum decoded image size: 8 MB. PNG/JPEG/GIF/WebP only, checked against their signatures. Remote URL imports and SVG are not supported. Use the returned managed URL in the draft. Do not add fake attorney portraits, testimonials, invented results, misleading geographic imagery or decorative pictures merely to reach an image count. Useful process diagrams and document checklists can be better than stock photos.

### Real page-capture review request

An outside browser AI should capture the page at desktop and mobile widths and call this endpoint once per width. Each request contains 1–3 top/middle/bottom captures at that one viewport. Do not include form entries, CRM records, credentials or admin screens.

```json
{
  "path": "/cancel-solar-contract/houston-tx",
  "capturedAt": "<current ISO UTC timestamp>",
  "captureMethod": "browser_screenshot",
  "viewport": {"width": 390, "height": 844},
  "captures": [{"position":"top", "image":"data:image/png;base64,<screenshot-bytes>"}],
  "evidence": {
    "title":"<actual document title>",
    "headings":["<actual H1/H2/H3 text>"],
    "paragraphWords":[25,40,160],
    "imageCount":1,
    "brokenImages":0,
    "missingAlt":0,
    "horizontalOverflow":false,
    "ctas":[{"text":"Request case review","target":"https://breakyoursolarcontract.com/#form","top":500,"visible":true}],
    "limitations":["Only top region captured; remaining regions and other viewport widths unseen."]
  }
}
```

Only exact `/blog/slug` or `/cancel-solar-contract/city-slug` paths are accepted. No queries, arbitrary origins, API/admin paths or server-side screenshot URL fetching. PNG/JPEG data URIs only; maximum 2.8 million characters per capture, combined decoded size at most 4 MB. Viewport width 320–1920, height 480–1600. Captures must be less than 30 minutes old. Same path/width has a ten-minute duplicate-review cooldown. The service makes a bounded Argon call with no GPT fallback; failed or malformed responses do not become successful reviews.

The receipt distinguishes an **assessment** from a **public change** and records captured regions, evidence fingerprint, model, timestamps, provider/estimated/unknown cost, exact issues and limitations. Supplied screenshots are not independently verified by the server; never claim a nonexistent capture. Screenshot bytes are sent to the model but not stored in the action payload. Retain your original captures privately for comparison.

## Browser alternative

An external AI with browser tools can use an owner-authorized admin login:

1. Open `/admin/outcomes` to inspect dated measurements and saved work.
2. Enter an exact public path in **Page appearance** and open its review link.
3. On that public page, click the owner-only **Review this page with Argon** control. This captures the browser DOM at its current width; it is explicitly labeled DOM capture, not browser-native screenshot. Inputs, iframes and third-party chat are excluded. CDN images that cannot be embedded become explicitly disclosed neutral placeholders. Use browser-native screenshots through the API for full image/overlay review.
4. Use `/admin/blog-studio` for blog draft text and managed media, or `/admin/city-recovery` for approved city work. Never confuse a city landing route with a legacy blog record.
5. Inspect the exact repair, then ask the owner for publication approval. Browser access is powerful; give the external AI the same safety instructions as the scoped API.

The internal Content/Editor loop now also checks draft paragraph density, headings, list breaks and CTA structure. Those are **draft-only** checks, not proof of a rendered visual review. Automatic recurring browser screenshots are not supplied by the existing in-app five-minute worker. An outside browser AI can perform them in its own supported execution/scheduling environment; no new schedule is created by this guide.

## Existing broader Admin API

Older endpoints remain available to separately granted keys: `/posts` CRUD (`posts:write`, `posts:delete`, and explicit publishing permission where enforced), `/companies`, allowlisted `/config`, `/upload`, `/upload/batch`, and `/keys`. Do not grant `*`, `config:read`, `config:write` or `keys:manage` for routine page improvement. In particular, a legacy `posts:write` key can modify an already-live post body; it is not equivalent to the new draft-only permission. Use `/drafts` for reviewed repairs.

`POST /automation/apply` is **dry-run planning only**. It validates/hashes a proposed file/SQL plan. It does not execute file writes, SQL migrations, Git commits, publishing or deployment. Do not report its planned operations as applied.

## Code, city source and deployment boundaries

An outside coding AI can clone the authorized GitHub repository, edit the shared renderer/CSS/static city content, run tests and submit a pull request. API writes to database-managed content and assets normally do not require a code rebuild. React/CSS/routing, static articles and static city-source changes do.

The current host still has a managed build/publication step. A GitHub merge alone is **not** proof that this host deployed the change. No automatic GitHub-to-host deploy bridge is confirmed. Avoid migration or changing DNS merely to work around that distinction.

Keep the approved-city inventory unchanged: 25 eligible city URLs; the other 278 remain deliberately noindexed. Never redirect or canonicalize unrelated pages, change tracking, or mass-publish city rewrites to satisfy a checklist.

## Measurement and acceptance criteria

Daily work: diagnose exact current-page opportunities, repair actual problems, save before/after evidence and measure when finalized data exists. Weekly review: compare equal nonoverlapping periods, prioritize qualified organic clicks and first-party leads, inspect booked-appointment evidence, and keep/adjust work based on results.

Every report must include source, coverage dates, freshness, page/keyword, actual completed change, public verification, rollback/reference, next measurement date, and limitations. Persisted GSC scorecard dates are snapshot/run dates. Their totals cover the stated rolling period, not that day's clicks or leads. `/seo/outcomes` currently marks appointments as unverified rather than exposing an unsupported zero. It intentionally does not expose names, emails, phone numbers or CRM conversations.

CTA clicks, form records, appointments and qualified business outcomes are different measures. A screenshot pass, metadata tag, crawler allowance or internal SEO score does not prove more Google clicks, leads, bookings or AI citations. Do not guarantee daily ranking increases or number-one placement in Google, ChatGPT, Grok or Perplexity.

## Copy-ready instructions for an outside AI

> Work on breakyoursolarcontract.com to increase qualified organic clicks, durable leads and verifiable appointments. Read https://breakyoursolarcontract.com/api/capabilities.md first. Use my private scoped API key from your secret manager with Authorization: Bearer, or my owner-authorized browser session. Inspect actual desktop/mobile pages, including top/middle/bottom: short readable sections, purposeful visuals, working prominent review/booking actions and accessible controls. Never call a text-only audit visual verification. Use exact existing blog source fingerprints and save repairs through /drafts; use /media/upload for real managed imagery. Use City Recovery for city pages and Git PRs for compiled renderer/CSS/static-source changes. Preserve facts, claims, URLs, canonicals, redirects, index eligibility and analytics. Do not fabricate attorneys, testimonials, results, stats, geography or cancellation rights. No automatic outreach or substantive publication. Verify changes actually went live before calling them completed, then compare correctly dated source measurements. Report blockers honestly and recommend the single highest-value next action, not an unexplained queue.
