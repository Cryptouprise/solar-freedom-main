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
| `sitemap.xml` | `/client/public/sitemap.xml` | 487 | All pages |
| `image-sitemap.xml` | `/client/public/image-sitemap.xml` | 68 | Blog hero images + homepage CDN images |

Both sitemaps are referenced in `robots.txt` and submitted to Google and Bing.

**Sitemap URL breakdown:**
- Homepage + core service pages: ~10
- City pages (`/cancel-solar-contract/{slug}`): 301
- Company pages (`/solar-companies/{slug}`): 15
- State law pages (`/solar-contract-laws/{slug}`): 53
- Blog posts (`/blog/{slug}`): ~118
- Solar Fraud Report + other standalone pages: ~5

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
- **Company-targeted blog posts** (30–50 more) are the highest-ROI content expansion. Each post should target `[Company Name] solar contract cancel` and link to the corresponding company page.
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
