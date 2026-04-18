# How to Give an AI Agent Access to Google Search Console and Google Tools

**Type:** Reference / Prompt Template  
**Use case:** Giving another AI agent (Manus, Claude, ChatGPT, etc.) the ability to audit and fix GSC issues on a similar site

---

## What "Access" Means

An AI agent can access Google Search Console in two ways:

| Method | How | Best for |
|---|---|---|
| **Browser session** | Log into GSC in the browser the AI controls; the session cookie persists | Manual audits, clicking Validate Fix, requesting indexing for a few pages |
| **Search Console API** | Service account JSON key + Python script | Bulk operations, automated indexing requests, programmatic data pulls |

For most tasks, the browser session is sufficient. The API is needed for bulk indexing (100+ pages).

---

## Step 1: Log Into GSC in the AI's Browser (One-Time Setup)

1. Open a task with your AI agent
2. Tell the AI: *"Please open Google Search Console"*
3. The AI will navigate to https://search.google.com/search-console
4. It will see a login page — tell it: *"Please take over the browser so I can log in"*
5. Log in with your Google account (e.g., chasef1124@gmail.com)
6. After logging in, tell the AI: *"I've logged in, you can take over again"*
7. The session cookie persists — the AI will stay logged in for future tasks

**That's it.** The AI can now navigate GSC, read reports, click Validate Fix, and use URL Inspection.

---

## Step 2: Give the AI a Starting Prompt for GSC Audits

Copy and paste this prompt to any AI agent to have it audit and fix GSC issues on a site:

---

### PROMPT: Full GSC Audit and Fix

```
You have access to Google Search Console for [SITE DOMAIN] via the browser (already logged in as [EMAIL]).

Please do a complete GSC audit and fix all issues. Here is the process:

1. Navigate to https://search.google.com/search-console/index?resource_id=sc-domain:[DOMAIN]

2. Check the Pages indexing report and note:
   - How many pages are indexed vs not indexed
   - What are the specific "not indexed" reasons (Soft 404, Discovered, Canonical, Redirect, noindex, etc.)
   - For each error type, click into it and note which specific URLs are affected

3. Check the Enhancements section (FAQ, Breadcrumbs, Review snippets) for any "Invalid" items

4. Check Sitemaps — are all sitemaps showing "Success"? When were they last read?

5. For each issue found, diagnose the root cause:
   - Soft 404: Is the site a React SPA that serves index.html for all routes? If so, server-side meta injection is needed.
   - Duplicate FAQPage: Is there a FAQPage schema in index.html AND in a React component? Remove from index.html.
   - Canonical errors: Are HTTP versions of pages being crawled? Click Validate Fix.
   - Redirect errors: Are www versions being crawled? Click Validate Fix.

6. Fix the issues in the site code:
   - For Soft 404 / SPA issue: Add server-side meta tag injection in server/_core/vite.ts
   - For duplicate schema: Remove the duplicate from client/index.html
   - For redirect/canonical: These are already fixed by the server; just click Validate Fix in GSC

7. After fixing code issues, save a checkpoint and tell me to publish.

8. After publishing, return to GSC and:
   - Click Validate Fix on any canonical/redirect errors
   - Use URL Inspection to request indexing for the top 10 highest-priority pages
   - Resubmit all sitemaps

9. Document all findings and fixes in docs/lessons-learned/ as markdown files.

The site code is at /home/ubuntu/[PROJECT-FOLDER]/
Key files:
- server/_core/vite.ts — where the SPA fallback and meta injection live
- client/index.html — check for duplicate schema here
- client/src/data/ — all page data (cities, companies, blog posts, state laws)
```

---

## Step 3: Set Up the Indexing API (for bulk indexing)

If the site has 100+ unindexed pages, the browser UI is too slow. Set up the API:

### In Google Cloud Console:
1. Go to https://console.cloud.google.com
2. Select or create a project
3. Go to APIs & Services → Library → search "Search Console API" → Enable it
4. Go to APIs & Services → Credentials → Create Credentials → Service Account
5. Name it (e.g., "gsc-indexing-bot") → Create → Done
6. Click the service account → Keys tab → Add Key → JSON → Download

### In Google Search Console:
1. Go to GSC → Settings → Users and permissions
2. Click "Add user"
3. Enter the service account email (looks like: `name@project-id.iam.gserviceaccount.com`)
4. Set permission to **Full** (not Restricted)
5. Click Add

### Give the JSON key to the AI:
Store the JSON key as an environment variable or secret:
```
GSC_SERVICE_ACCOUNT_JSON = { ...contents of the downloaded JSON file... }
```

Then give the AI this prompt:

```
The GSC service account JSON is available as the environment variable GSC_SERVICE_ACCOUNT_JSON.
Please write a Python script that:
1. Loads all URLs from https://[DOMAIN]/sitemap.xml
2. For each URL, uses the Search Console API to check if it is indexed
3. For any URL that is not indexed, requests indexing via the API
4. Prints a summary of results

Use the google-api-python-client library. The site domain is [DOMAIN].
```

---

## What the AI Can and Cannot Do in GSC

| Can Do | Cannot Do |
|---|---|
| Read all indexing reports | Change GSC property settings |
| Click Validate Fix | Add/remove users from GSC |
| Request indexing via URL Inspection | Access GSC for properties it's not added to |
| Check sitemap status | Submit new sitemaps (requires clicking in UI) |
| Read performance/search queries data | Access Google Analytics (separate login) |
| Run live URL tests | |

---

## Checklist for a New Similar Site

Before launching any new site similar to breakyoursolarcontract.com, verify:

- [ ] Server-side meta injection is implemented (see lesson 01)
- [ ] No duplicate schema types in `index.html` (see lesson 02)
- [ ] Sitemap submitted to GSC
- [ ] GSC property verified
- [ ] At least 5 pages tested with GSC URL Inspection "Test Live URL" before launch
- [ ] All tested pages show page-specific title/description (not homepage title)
- [ ] No "Soft 404" errors on live test
- [ ] FAQ schema passes https://search.google.com/test/rich-results
