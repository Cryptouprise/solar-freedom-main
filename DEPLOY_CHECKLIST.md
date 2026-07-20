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
- [ ] New pages remain `noindex` until the editorial gate in `docs/SEO-PENALTY-RECOVERY.md` is complete
- [ ] Approved pages are added to `shared/seo-policy.json`; generated inventories are never edited by hand
- [ ] Structured data contains only visible, verified facts supported by the content model
- [ ] Canonical URL format is always `https://breakyoursolarcontract.com/path` (no www, no trailing slash variation)

### After Publishing
- [ ] Verify live site with: `curl -sL https://breakyoursolarcontract.com/ | grep -i "msvalidate\|canonical\|description"`
- [ ] Confirm the generated sitemap contains only policy-retained URLs
- [ ] Do not submit URLs or sitemaps automatically while recovery mode is enabled

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
| `sitemap.xml` | `/client/public/sitemap.xml` | Generated | Policy-retained pages only |

The sitemap is generated from `shared/seo-policy.json`. No image or news sitemap is advertised during recovery.

---

## Schema Coverage Map

| Page Type | Schema Types Applied |
|---|---|
| Homepage | Conservative `Organization` identity only |
| Prerendered public pages | `WebPage`, `BreadcrumbList` |
| Blog posts | `BreadcrumbList` only until authorship and review evidence are modeled |
| Noindexed pages | No rich-result eligibility claims |

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

## Recovery constraint

Do not expand city, state, company, or blog templates while recovery mode is enabled. See `docs/SEO-PENALTY-RECOVERY.md` for evidence, editorial, link-remediation, and reconsideration requirements.

---

## Emergency Rollback

If a publish breaks the site:
1. Open Manus Management UI → Version History
2. Click Rollback on the last known good checkpoint
3. Publish the rolled-back version
4. Resubmit sitemaps to Google and Bing after rollback

---

*Last updated: 2026-07-20*
