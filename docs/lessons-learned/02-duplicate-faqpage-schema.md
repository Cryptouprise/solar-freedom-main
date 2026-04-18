# HIGH: Duplicate FAQPage JSON-LD Schema Blocks Rich Results

**Severity:** HIGH  
**Discovered:** April 18, 2026  
**Affected site:** breakyoursolarcontract.com  
**Result:** 86 invalid FAQ items in GSC — "Duplicate field 'FAQPage'" error on all pages

---

## What Happened

The site has two sources of FAQPage JSON-LD schema:

1. **A static FAQPage schema** hardcoded in `client/index.html` (the base HTML template loaded by every page)
2. **A dynamic FAQPage schema** injected by the `SchemaInjector` React component on individual pages (city pages, company pages, blog posts)

Because `index.html` is the base template for the entire SPA, **every single page** loads the static FAQPage schema from `index.html`. Then, when a city or company page renders, it also injects its own FAQPage schema via `SchemaInjector`. The result is **two `@type: "FAQPage"` blocks on the same page**, which Google's Rich Results validator flags as "Duplicate field 'FAQPage'".

---

## How to Diagnose This on Any Site

**Step 1 — Check GSC Enhancements → FAQ:**
Go to Google Search Console → Enhancements → FAQ. If you see "Invalid" items with the error "Duplicate field 'FAQPage'", this is the cause.

**Step 2 — Check `index.html` for hardcoded schema:**
```bash
grep -n "FAQPage\|@type" client/index.html
```
If you see `"@type": "FAQPage"` in `index.html`, and the site also injects FAQPage schema dynamically via React components, you have a duplicate.

**Step 3 — Check for dynamic schema injection:**
```bash
grep -rn "FAQPage\|SchemaInjector" client/src/
```
If both `index.html` and React components inject FAQPage, the problem is confirmed.

**Step 4 — Use Google's Rich Results Test:**
Go to https://search.google.com/test/rich-results and test any page URL. If it shows "Duplicate field" warnings, the schema is malformed.

---

## The Fix

**Remove the static FAQPage schema from `client/index.html`.**

The dynamic schema injected by React components (via `SchemaInjector`) is the correct one — it contains page-specific questions and answers. The static one in `index.html` is generic and applies to every page, causing the duplicate.

**What to keep in `index.html`:**
- `Organization` schema (site-wide, appropriate for every page)
- `WebSite` schema with `SearchAction` (site-wide)
- `LocalBusiness` schema if applicable (site-wide)

**What to remove from `index.html`:**
- Any `FAQPage` schema (should only be on pages that actually have FAQs)
- Any `Article` or `BlogPosting` schema (should only be on actual blog posts)
- Any `Product` or `Service` schema that is page-specific

**Rule of thumb:** Only put schema in `index.html` if it is genuinely true for **every single page** on the site.

---

## What Was Fixed on This Site

The FAQPage JSON-LD block was removed from `client/index.html`. The dynamic FAQPage schema injected by `SchemaInjector` on individual city, company, and blog pages remains intact and is correct.

After this fix is published, the 86 "Duplicate field 'FAQPage'" errors in GSC will resolve over the next 2–4 weeks as Google re-crawls the affected pages.

---

## Prevention: How to Avoid This on New Sites

1. **Never put page-type-specific schema in `index.html`** — only put truly site-wide schema there (Organization, WebSite)
2. **Audit schema before launch:** Run 3–5 pages through https://search.google.com/test/rich-results and verify no "Duplicate field" warnings
3. **One schema type per page:** A page should only have one `@type: "FAQPage"` block, one `@type: "Article"` block, etc.
4. **Use a single SchemaInjector component** for all dynamic schema — do not mix static `index.html` schema with dynamic React-injected schema for the same `@type`
