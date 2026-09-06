# Solar Freedom — Deployment Checklist & SEO Notes

> **Rule:** Every time code changes are published to `breakyoursolarcontract.com`, run through this checklist. Nothing ships without it.

---

## Pre-Publish Checklist

### Code Quality
- [ ] Run `pnpm test` — all tests pass
- [ ] Check devserver log for TypeScript errors: `grep "error TS" .manus-logs/devserver.log`
- [ ] No console errors in browser on homepage, a city page, and a blog post
- [ ] Save checkpoint via Manus UI before publishing

### SEO — Every Deploy
- [ ] Any new page has `useSeoMeta({ title, description, canonical })` set
- [ ] Any new page has a `<SchemaInjector schemas={[...]} />` with appropriate schema type
- [ ] Any new page is added to `client/public/sitemap.xml` with correct `<loc>`, `<lastmod>`, `<changefreq>`, `<priority>`
- [ ] Any new page is added to `client/public/image-sitemap.xml` if it has a hero image
- [ ] Canonical URL format is always `https://breakyoursolarcontract.com/path` (no www, no trailing slash variation)

### After Publishing
- [ ] Verify live site with: `curl -sL https://breakyoursolarcontract.com/ | grep -i "msvalidate\|canonical\|description"`
- [ ] Resubmit sitemap in Google Search Console: https://search.google.com/search-console/sitemaps?resource_id=sc-domain:breakyoursolarcontract.com
- [ ] Resubmit sitemap in Bing Webmaster Tools: https://www.bing.com/webmasters/sitemaps?siteUrl=https://www.breakyoursolarcontract.com/

### Existing-Traffic Growth Checks
- [ ] Refresh Search Console with `pnpm seo:gsc:refresh`, then run `pnpm seo:ctr --no-ai`. Credentials must be supplied through the runtime secret manager, never committed. The queue rejects missing, stale, truncated, wrong-property, or modified snapshots; an empty blocked queue is not evidence of no demand.
- [ ] When using custom exports, supply matching `--gsc-json`, `--gsc-csv`, and `--gsc-metadata` paths. Metadata hashes must describe those exact files. AI copy drafting is opt-in, requires review, and does not publish changes.
- [ ] Compare clicks and CTR over comparable Search Console periods before and after a snippet change; inspect query intent before attributing a change to copy. Average position alone does not explain CTR.
- [ ] Keep priority service snippets synchronized through `/home/runner/work/solar-freedom-main/solar-freedom-main/shared/priority-page-meta.json`. Shared preparation and referral disclosures live in `/home/runner/work/solar-freedom-main/solar-freedom-main/shared/service-guidance.json` and are rendered in both the React pages and initial HTML.
- [ ] Run `pnpm smoke:production`. For a local production build, run `pnpm smoke:production --base http://localhost:3000 --canonical-base https://breakyoursolarcontract.com --skip-assets`. Passing checks prove source delivery and directives, **not actual Google indexing**; verify the priority URLs in owner-authorized Search Console URL Inspection.
- [ ] Measure homepage and service-page mobile loading, layout stability, and interactions after deployment. Local measurements are not field Core Web Vitals, especially when remote fonts, images, or tracking requests cannot load.
- [ ] The existing sitemap generator also regenerates `/home/runner/work/solar-freedom-main/solar-freedom-main/shared/blog-route-slugs.json`. Keep that manifest in sync when article slugs change; route discovery must not download full article bodies on every homepage visit.
- [ ] Publish testimonials or outcomes only with documented evidence and permission. Verify fees, business/referral role, and any professional engagement terms. Request relevant editorial mentions manually; do not buy links or invent endorsements.
- [ ] In the admin outcome scorecard, review `home_intake_v1_five_step` versus `home_intake_v1_callback`. Assignment is stable in browser storage; blocked storage can make attribution incomplete. Report exposed sessions, durable leads, CRM-linked leads, qualified contacts, appointments, and closed outcomes—not just button clicks. Do not call a winner without adequate outcome evidence.
- [ ] Confirm GoHighLevel preserves `website_lead_id` and sends it with `contactId`, `eventType`, `occurredAt`, and a stable `eventId` to `/api/ghl/lifecycle`, using the `x-ghl-webhook-secret` header configured from `GHL_EVENT_WEBHOOK_SECRET`. This authenticated receipt links CRM outcomes to the original variant. Missing links are missing evidence, not proof that nobody qualified or booked.
- [ ] Confirm the callback workflow honors `requested_callback_only_v1`: the checked request authorizes that callback, not marketing texts, emails, or calls. Review the existing pending-delivery queue and retry procedure before enabling any follow-up automation.
- [ ] Preview unconfirmed deliveries with `node /home/runner/work/solar-freedom-main/solar-freedom-main/scripts/resend-missed-leads.mjs --limit=25`. Sending requires `--send --ack-crm-deduplication`; first configure CRM deduplication by `website_lead_id` and reconcile uncertain deliveries. An idempotency header alone does not guarantee GoHighLevel deduplicates. Recovery is bounded, excludes submissions younger than ten minutes, and requests no marketing or SMS.
- [ ] Keep campaign spend separate from event counts. Calculate cost per qualified lead only when actual spend and attributable qualified leads are available; do not interpret unknown cost or missing CRM evidence as zero.

Fresh Search Console/CRM credentials, owner-level URL Inspection, permissioned outcome evidence, and external outreach are deployment/operator requirements; code changes cannot establish those facts.

---

## Domain Configuration Notes

| Property | Value |
|---|---|
| **Canonical domain** | `https://breakyoursolarcontract.com` (no www) |
| **www redirect** | `www.breakyoursolarcontract.com` → 301 → `breakyoursolarcontract.com` |
| **GSC property** | `sc-domain:breakyoursolarcontract.com` (domain property, covers both www and non-www) |
| **Bing property** | `https://www.breakyoursolarcontract.com/` (registered as www — both are tracked) |
| **GA4** | Verify measurement ID in `client/index.html` matches the `breakyoursolarcontract.com` GA4 property |

**Why Bing shows www:** Bing registered the site as `www.breakyoursolarcontract.com` because that was the URL entered during setup. Since www 301-redirects to non-www, Bing still crawls the correct canonical URLs. Both sitemaps were submitted as `https://breakyoursolarcontract.com/sitemap.xml` (non-www), which is correct.

---

## Sitemap Inventory

| File | Location | URLs | Purpose |
|---|---|---|---|
| `sitemap.xml` | `/home/runner/work/solar-freedom-main/solar-freedom-main/client/public/sitemap.xml` | Generated | Eligible canonical pages, excluding redirects and quarantined URLs |
| `image-sitemap.xml` | `/client/public/image-sitemap.xml` | 68 | Blog hero images + homepage CDN images |

Both sitemaps are referenced in `robots.txt` and submitted to Google and Bing.

**Sitemap inventory:** Use the generator output and the current shared index-eligibility and redirect ledgers, not a historical URL-count target. A focused sitemap may deliberately omit many existing routes. Do not restore excluded URLs merely to increase the count.

---

## Schema Coverage Map

| Page Type | Schema Types Applied |
|---|---|
| Homepage | `Organization`, `FAQPage`, `HowTo` |
| City pages | `LegalService`, `FAQPage`, `BreadcrumbList` |
| Company pages | `LegalService`, `FAQPage`, `BreadcrumbList` |
| Blog posts | `Article`, `BreadcrumbList` |
| State law pages | Self-canonical only (no schema — add `LegalService` next) |
| Solar Fraud Report | `Report`, `BreadcrumbList` |
| Service pages (SolarContractHelp, etc.) | Self-canonical only |

---

## Canonical Tag Rules

1. **All pages must have a canonical.** The `useSeoMeta` hook auto-generates one from `window.location.pathname` if not explicitly set, but always set it explicitly for important pages.
2. **Blog posts that duplicate city pages** must set `canonicalUrl` in their blog data object pointing to the city page URL.
3. **Never use www in canonical URLs.** Always `https://breakyoursolarcontract.com/...`
4. **City pages** canonical is auto-set by `useSeoMeta` to the current path — no override needed.

---

## Third-Party Tracking

| Service | Status | Notes |
|---|---|---|
| Google Analytics 4 | Active | Tag in `client/index.html` |
| Google Search Console | Verified | Domain property covers all subdomains |
| Bing Webmaster Tools | Active | Sitemaps submitted 2026-03-28, data processing in 48h |
| Apollo.io Visitor Tracker | Active | Script in `client/index.html` head, appId: `69c6e8a64467ca0015fd2bc4` |

---

## Known Issues / Future Work

- **State law pages** lack structured schema (`LegalService` or `Article`). Adding schema to all 53 would improve rich result eligibility.
- **Bing verification** was completed via GSC import. If Bing ever shows "unauthorized," go to Bing Webmaster Tools → Configuration → Ownership Verification → HTML Meta Tag and click Verify (meta tag is already in `client/index.html`).
- **Company-targeted content:** Improve existing canonical guides using fresh search evidence before expanding the inventory. Internal links should point directly to canonical resources, not redirected company hubs.
- **Image sitemap** only covers blog hero images. If new CDN images are added to city or company pages, update `client/public/image-sitemap.xml`.

---

## Emergency Rollback

If a publish breaks the site:
1. Open Manus Management UI → Version History
2. Click Rollback on the last known good checkpoint
3. Publish the rolled-back version
4. Resubmit sitemaps to Google and Bing after rollback

---

*Last updated: 2026-03-28 by Manus*
