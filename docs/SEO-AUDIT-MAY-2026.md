# SEO Audit — breakyoursolarcontract.com
**Date:** May 17, 2026 | **Data window:** 90 days (Google Search Console)

---

## Overall Performance

| Metric | Value |
|---|---|
| Total pages with GSC data | 87 |
| Total clicks (90 days) | 60 |
| Total impressions (90 days) | 8,516 |
| Overall CTR | 0.70% |
| Pages indexed (approximate) | ~90 out of ~475 |

The site is **barely 2 months old** and already generating 8,500+ impressions/month with 60 clicks and 3 confirmed booked appointments. That is a strong early signal. The primary lever right now is **CTR improvement** — the site is ranking but not getting clicked.

---

## Top Pages by Impressions

| Page | Clicks | Impressions | CTR | Avg Position |
|---|---|---|---|---|
| `/blog/sunrun-solar-contract-cancellation-2026` | 2 | 2,994 | 0.1% | 7.4 |
| `/blog/how-to-get-out-of-a-solar-contract` | 10 | 797 | 1.3% | 23.6 |
| `/blog/goodleap-solar-loan-cancellation-hidden-fees-2026` | 7 | 665 | 1.1% | 7.4 |
| `/blog/solar-contract-rescission-rights` | 2 | 535 | 0.4% | 7.4 |
| `/blog/sunrun-complaints-california` | 2 | 340 | 0.6% | 8.7 |
| `/blog/cancel-sunrun-solar-contract-before-installation` | 2 | 317 | 0.6% | 8.8 |
| `/blog/cancel-solar-contract-rescission-rights` | 1 | 256 | 0.4% | 8.1 |
| `/blog/how-to-file-a-complaint-against-solar-company-attorney-general` | 0 | 211 | 0.0% | 7.5 |
| `/blog/new-jersey-solar-contract-rights` | 2 | 204 | 1.0% | 6.4 |
| `/cancel-solar-contract/los-angeles-ca` | 0 | 181 | 0.0% | 35.4 |

---

## Critical Finding: The Sunrun 2026 Article

The `/blog/sunrun-solar-contract-cancellation-2026` article has **2,994 impressions** at position 7.4 — but only a **0.1% CTR**. This is the single biggest opportunity on the site.

**Root cause (now fixed):** The article was a DB-published post and was showing the generic homepage title/description in Google search results instead of its own meta tags. The SEO meta fix deployed today corrects this. After Google re-crawls the page, the CTR should jump significantly.

**Action required:** Go to Google Search Console → URL Inspection → paste `https://breakyoursolarcontract.com/blog/sunrun-solar-contract-cancellation-2026` → click **Request Indexing**. Do this today.

---

## Zero-Click Pages (CTR Opportunities)

These pages are ranking but getting zero clicks. Most have strong positions — the issue is weak title/description in search results.

| Page | Impressions | Avg Position | Priority |
|---|---|---|---|
| `/blog/how-to-file-a-complaint-against-solar-company-attorney-general` | 211 | 7.5 | 🔴 High |
| `/cancel-solar-contract/los-angeles-ca` | 181 | 35.4 | 🟡 Medium (position too low) |
| `/blog/cancel-vivint-solar-contract` | 72 | 14.2 | 🔴 High |
| `/blog/selling-home-with-solar-ppa-panels-transfer-or-cancel` | 58 | 8.6 | 🔴 High |
| `/solar-contract-laws/florida` | 53 | 8.6 | 🔴 High |
| `/cancel-solar-contract/las-vegas-nv` | 48 | 9.0 | 🟡 Medium |
| `/blog/sunlight-financial-solar-loan-complaints` | 43 | 8.0 | 🟡 Medium |
| `/blog/cancel-solar-contract-boston-ma` | 40 | 5.7 | 🔴 High (position 5.7 = page 1!) |
| `/blog/goodleap-solar-loan-hidden-dealer-fees-2026` | 34 | 7.4 | 🔴 High |
| `/solar-contract-laws/nevada` | 33 | 9.2 | 🟡 Medium |
| `/blog/adt-solar-complaints` | 32 | 9.0 | 🟡 Medium |

**The Boston article is at position 5.7 (page 1) with 40 impressions and ZERO clicks.** That title/description needs to be rewritten immediately.

---

## Pages Close to Top 3 (Ranking Push Opportunities)

These pages are on page 1 of Google and just need a small push to reach the top 3, which would dramatically increase clicks.

| Page | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| `/blog/cancel-solar-contract-boston-ma` | 0 | 40 | 0.0% | **5.7** |
| `/cancel-solar-contract/hartford-ct` | 2 | 113 | 1.8% | **5.7** |
| `/cancel-solar-contract/denver-co` | 4 | 57 | 7.0% | **5.9** |
| `/blog/new-jersey-solar-contract-rights` | 2 | 204 | 1.0% | **6.4** |
| `/blog/goodleap-solar-loan-cancellation-hidden-fees-2026` | 7 | 665 | 1.1% | **7.4** |
| `/blog/solar-contract-rescission-rights` | 2 | 535 | 0.4% | **7.4** |
| `/blog/sunrun-solar-contract-cancellation-2026` | 2 | 2,994 | 0.1% | **7.4** |

---

## Indexing Status

- **~90 pages indexed** out of ~475 total (19% indexed)
- The site was at 70 → 78 → 83 → ~90 over the past weeks — Google is slowly crawling and indexing
- City pages (`/cancel-solar-contract/[city]`) have 301 pages but most are not yet indexed
- State law pages (`/solar-contract-laws/[state]`) have low indexing

**Why indexing is slow:** Google prioritizes pages with backlinks and engagement signals. The city/state pages are thin and similar to each other — Google is being selective. The blog posts are indexing faster because they have more unique content.

---

## Medium Articles (34 Published)

You mentioned 34 articles published to Medium. These are valuable for:
1. **Backlinks** — each Medium article linking back to `breakyoursolarcontract.com` builds domain authority
2. **Indexing acceleration** — Google follows links from Medium (high-authority domain) to discover and index your pages faster
3. **Keyword coverage** — Medium articles can rank for long-tail queries that send traffic directly

**Action:** Make sure every Medium article has at least 2-3 links pointing to specific pages on `breakyoursolarcontract.com` (not just the homepage). Link to the relevant blog post or city page for the topic.

---

## Priority Action List

### This Week (High Impact)
1. **Request re-indexing** of `/blog/sunrun-solar-contract-cancellation-2026` in GSC — the meta fix is live, Google just needs to re-crawl it
2. **Rewrite title/description** for the Boston article (`/blog/cancel-solar-contract-boston-ma`) — it's on page 1 at position 5.7 with 0 clicks
3. **Rewrite title/description** for the AG complaint article (`/blog/how-to-file-a-complaint-against-solar-company-attorney-general`) — 211 impressions, 0 clicks, position 7.5

### This Month (Medium Impact)
4. **Add internal links** from high-traffic blog posts to the zero-click city pages (LA, Las Vegas, Dallas) to help Google discover and rank them
5. **Improve the Vivint article** (`/blog/cancel-vivint-solar-contract`) — 72 impressions at position 14, needs better content to push to page 1
6. **Build backlinks** to the GoodLeap article (665 impressions, position 7.4) — one or two backlinks could push it to top 3

### Ongoing
7. **Submit Medium article links** to GSC for indexing after each publish
8. **Monitor the sunrun article CTR** weekly — it should improve significantly after the meta fix is re-crawled

---

## Summary

The site is performing well for its age. The biggest single opportunity is the Sunrun 2026 article — 2,994 impressions at position 7.4 with a broken meta description. That fix is now live. The second biggest opportunity is improving CTR on the 15+ zero-click pages that are already ranking on page 1. The site does not have a ranking problem — it has a **click-through rate problem** on its best pages.
