# CRITICAL: SPA Architecture Causes Soft 404 — All Non-Homepage URLs Not Indexed

**Severity:** CRITICAL  
**Discovered:** April 18, 2026  
**Affected site:** breakyoursolarcontract.com  
**Result:** 283 out of 321 pages were "Discovered — currently not indexed" in Google Search Console

---

## What Happened

This site is built as a **React Single Page Application (SPA)** using Vite + React + Express. In production, the Express server serves a single `index.html` file for **every URL** — including `/cancel-sunrun-solar-contract`, `/cancel-solar-contract/dallas-tx`, `/blog/how-to-get-out-of-a-solar-contract`, and all 321 other pages.

The server code that causes this is in `server/_core/vite.ts`:

```ts
// This is the problem — every URL returns the same index.html
app.use("*", (_req, res) => {
  res.sendFile(path.resolve(distPath, "index.html"));
});
```

When React loads in the browser, it reads the URL and renders the correct page. **This works fine for human visitors.** However, **Googlebot cannot execute JavaScript**. When Googlebot crawls `/cancel-sunrun-solar-contract`, it receives the raw `index.html` which contains:

- `<title>Solar Freedom — Get Out of Your Solar Contract</title>` (the homepage title)
- `<meta name="description" content="...homepage description...">` (the homepage description)
- `<link rel="canonical" href="https://breakyoursolarcontract.com/">` (pointing to homepage)

Google sees this as a **Soft 404** — a page that returns HTTP 200 but appears to be a duplicate or empty page. Google rejects the indexing request with: *"Page cannot be indexed: Soft 404"*

---

## How to Diagnose This on Any Site

**Step 1 — Check GSC Pages report:**
Go to Google Search Console → Indexing → Pages. If you see a large number of pages under "Discovered — currently not indexed" or "Soft 404", this is likely the cause.

**Step 2 — Run a live test in GSC:**
Go to URL Inspection → enter any non-homepage URL → click "Test Live URL". If the result shows:
- `Page cannot be indexed: Soft 404`
- The `<title>` in the tested HTML is the homepage title (not the page-specific title)
- The `<link rel="canonical">` points to the homepage

...then you have this problem.

**Step 3 — Check the server code:**
Look for a catch-all route in the Express server that returns `index.html`:
```ts
app.use("*", (_req, res) => {
  res.sendFile(path.resolve(distPath, "index.html"));
});
```
If this exists with no meta injection before it, the site has the problem.

**Step 4 — Check the `<head>` of the built `index.html`:**
```bash
grep -A5 "<title\|canonical\|description" dist/public/index.html
```
If the title and canonical are hardcoded to the homepage values, the problem is confirmed.

---

## The Fix: Server-Side Meta Tag Injection

The solution is to intercept requests **before** sending `index.html` and inject the correct `<title>`, `<meta name="description">`, and `<link rel="canonical">` for each URL.

**How it works:**
1. Build a lookup map on the server: `slug → { title, description, canonical }`
2. When a request comes in, match the URL path to the lookup map
3. Read `index.html`, replace the placeholder meta tags with the correct values
4. Send the modified HTML

**Server code pattern (in `server/_core/vite.ts`):**

```ts
import fs from "fs";
import path from "path";

// Build your meta map from your data files
const metaMap: Record<string, { title: string; description: string; canonical: string }> = {
  "/cancel-sunrun-solar-contract": {
    title: "Cancel Sunrun Solar Contract | Solar Freedom",
    description: "Trapped in a Sunrun contract? Our attorneys have helped thousands cancel. Free case review.",
    canonical: "https://breakyoursolarcontract.com/cancel-sunrun-solar-contract",
  },
  "/cancel-solar-contract/dallas-tx": {
    title: "Cancel Solar Contract in Dallas, TX | Solar Freedom",
    description: "Dallas homeowners: cancel your solar contract with legal help. Free review.",
    canonical: "https://breakyoursolarcontract.com/cancel-solar-contract/dallas-tx",
  },
  // ... all other pages
};

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  app.use(express.static(distPath));

  app.use("*", (req, res) => {
    const htmlPath = path.resolve(distPath, "index.html");
    let html = fs.readFileSync(htmlPath, "utf-8");

    const meta = metaMap[req.path];
    if (meta) {
      html = html
        .replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`)
        .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${meta.description}"`)
        .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${meta.canonical}"`);
    }

    res.send(html);
  });
}
```

---

## What Was Fixed on This Site

The file `server/_core/vite.ts` was updated to:
1. Import all city, company, blog, and state law data at server startup
2. Build a complete `metaMap` with correct title, description, and canonical for all 321 URLs
3. Inject the correct meta tags before serving `index.html` for every request

After this fix is published, Googlebot will see unique, meaningful content for each URL and the Soft 404 errors will resolve.

---

## Prevention: How to Avoid This on New Sites

When building any React SPA that needs SEO:

1. **Always add server-side meta injection** from day one — do not wait until GSC shows problems
2. **Test with Googlebot simulation** before launch: use GSC URL Inspection "Test Live URL" on 3–5 non-homepage URLs and verify the title/description are page-specific
3. **Alternative:** Use a framework with built-in SSR or SSG (Next.js, Remix, Astro) for SEO-critical sites — these solve the problem at the framework level
4. **Check the `index.html` title:** If the built `index.html` has a generic title like "My App" or the homepage title, meta injection is not set up

---

## Impact Timeline

- Site launched with SPA architecture (no meta injection)
- Google discovered 321 URLs via sitemap
- Google crawled ~70 pages (homepage + some city pages that were already indexed from previous crawls)
- 283 pages stuck in "Discovered — currently not indexed" for weeks
- GSC showed "Soft 404" on live test for all company/blog/state-law pages
- Fix: server-side meta injection implemented and deployed
- Expected resolution: 2–4 weeks after deployment for Google to re-crawl and index
