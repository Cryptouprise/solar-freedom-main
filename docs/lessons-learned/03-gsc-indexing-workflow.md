# Search Console Indexing Workflow

Use Google Search Console to observe and validate; do not treat “request
indexing” as a ranking mechanism.

1. Fix status, canonical, robots, rendering, content, and server errors first.
2. Deploy an exact reviewed commit.
3. Verify representative URLs with direct HTTP/browser tests.
4. Submit the approved sitemap in Search Console.
5. Use URL Inspection for a small number of important URLs and preserve the
   result as private evidence.
6. Start “Validate fix” only after the production correction is live.
7. Recheck after Google's own recrawl window; no timing is guaranteed.

Google's Indexing API is intended for supported `JobPosting` and
`BroadcastEvent` pages, not general SEO bulk submission. Solar Freedom must
not use it to push ordinary contract, city, company, state, or blog URLs.

Search Analytics reports observed clicks, impressions, CTR, and average
position for its selected window. It does not directly prove index status.
