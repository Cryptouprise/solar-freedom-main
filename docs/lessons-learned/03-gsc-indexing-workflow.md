# GSC Indexing Workflow, Limits, and Best Practices

**Severity:** MEDIUM (operational reference)  
**Discovered:** April 18, 2026  
**Applies to:** Any site using Google Search Console

---

## GSC Indexing Request Limits

Google imposes strict rate limits on indexing requests made through the URL Inspection tool:

| Method | Limit | Notes |
|---|---|---|
| URL Inspection UI (browser) | ~10 requests/day per property | Resets daily; exact limit not published by Google |
| Google Indexing API | 200 requests/day per service account | For job postings and live streams only officially; works for other pages in practice |
| Sitemap submission | Unlimited | Google crawls at its own pace; no guarantee of timing |

**Key insight:** For a site with 283+ unindexed pages, the URL Inspection UI is too slow (28+ days at 10/day). The most effective approach is:
1. Fix the underlying technical issue first (Soft 404, schema errors, etc.)
2. Resubmit the sitemap in GSC → Sitemaps → Resubmit
3. Use the Indexing API for the highest-priority pages (requires service account setup)

---

## Why "Request Indexing" Gets Rejected

When you click "Request Indexing" in GSC and get "Indexing request rejected — During live testing, indexing issues were detected", it means:

1. Google ran a live crawl of the page at that moment
2. The live crawl found a technical issue (Soft 404, noindex tag, canonical mismatch, etc.)
3. Google refuses to queue the page until the issue is fixed

**You cannot bypass this by clicking Request Indexing repeatedly.** Fix the underlying issue first, then request indexing.

---

## Common GSC Error Types and What They Mean

| Error | Meaning | Fix |
|---|---|---|
| **Discovered — currently not indexed** | Google found the URL but hasn't crawled it yet | Fix technical issues, resubmit sitemap, request indexing for priority pages |
| **Soft 404** | Page returns 200 but appears empty/duplicate to Google | Add server-side meta injection (see lesson 01) or implement SSR |
| **Alternate page with proper canonical tag** | Google found an HTTP version; canonical points to HTTPS | Already handled by HTTPS redirect; click "Validate Fix" |
| **Page with redirect** | Google found a www version; redirects to non-www | Already handled by www redirect; click "Validate Fix" |
| **Duplicate field 'FAQPage'** | Two FAQPage schemas on same page | Remove static FAQPage from index.html (see lesson 02) |
| **Excluded by noindex tag** | Page has `<meta name="robots" content="noindex">` | Intentional for thin pages; do not fix unless you want the page indexed |

---

## Validate Fix Workflow

When you fix a technical issue that was causing errors in GSC:

1. Deploy the fix to production (publish the site)
2. Go to GSC → Indexing → Pages → click the error type
3. Click "Validate Fix" — this tells Google to re-crawl the affected URLs
4. Google typically takes 1–2 weeks to re-validate; you'll get an email when done
5. Do NOT click Validate Fix before deploying the fix — it will fail and reset the timer

---

## Sitemap Best Practices

- Submit all sitemaps at GSC → Indexing → Sitemaps
- For a site with 300+ pages, use multiple sitemaps: one for city pages, one for blog posts, one for company pages
- Resubmit sitemaps after major content additions (new pages, URL changes)
- Check sitemap status weekly — a "Couldn't fetch" error means the sitemap URL is broken

---

## Setting Up the Google Indexing API (for bulk indexing)

The Indexing API allows programmatic indexing requests — much faster than the UI for large sites.

**Requirements:**
1. A Google Cloud project with the Search Console API enabled
2. A service account with Search Console access
3. The service account added as a **Full user** (not just Restricted) in GSC → Settings → Users and permissions

**Steps:**
1. Go to https://console.cloud.google.com → APIs & Services → Enable "Google Search Console API"
2. Create a service account → download the JSON key
3. In GSC → Settings → Users and permissions → Add user → enter the service account email → set permission to "Full"
4. Use the Python client: `google-api-python-client` with `searchconsole` service

**Python example:**
```python
from google.oauth2 import service_account
from googleapiclient.discovery import build
import json

sa_info = json.loads(open("service-account.json").read())
credentials = service_account.Credentials.from_service_account_info(
    sa_info,
    scopes=["https://www.googleapis.com/auth/webmasters"]
)
service = build("searchconsole", "v1", credentials=credentials)

# Request indexing for a URL
service.urlInspection().index().inspect(
    body={
        "inspectionUrl": "https://yoursite.com/your-page",
        "siteUrl": "sc-domain:yoursite.com"
    }
).execute()
```

---

## Priority Order for Indexing Requests

When you have limited indexing request budget, prioritize in this order:

1. **Homepage** — always indexed first
2. **High-intent conversion pages** — company cancel pages, service pages (highest revenue impact)
3. **City pages** — location-specific, high local search volume
4. **State law pages** — informational but high authority-building value
5. **Blog posts** — informational, long-tail traffic; Google will find these via sitemap over time
