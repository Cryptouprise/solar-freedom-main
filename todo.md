# SEO Autonomous Task List

## Phase 1 — State of Solar Fraud Report Page
- [ ] Build /solar-fraud-report page (high-authority linkable asset)
- [ ] Add to App.tsx routing
- [ ] Add to main.tsx pre-registration
- [ ] Add to sitemap.xml

## Phase 2 — AEO & Schema Stacking
- [ ] Add breadcrumb schema to BlogPost, CityPage, CompanyPage
- [ ] Add AEO Q&A speakable blocks to BlogPost
- [ ] Add HowTo schema to process section on homepage
- [ ] Add video schema placeholder for future YouTube content
- [ ] Add Article schema to BlogPost pages
- [ ] Add LocalBusiness schema to CityPage pages

## Phase 3 — Sitemaps & Bing Submission
- [ ] Create image sitemap (image-sitemap.xml)
- [ ] Create news sitemap (news-sitemap.xml)
- [ ] Submit sitemap to Bing Webmaster Tools via API
- [ ] Update robots.txt to reference all sitemaps

## Phase 4 — SEO Command Center Update
- [ ] Update /seo-command-center with all newly completed tasks
- [ ] Add Bing submission status
- [ ] Add new pages to the asset inventory

## Phase 5 — Database & Lead Persistence
- [x] Upgrade project to full-stack with database (web-db-user)
- [x] Create leads table in drizzle/schema.ts (17 columns: contact info, solar details, status, GHL sync)
- [x] Create exitIntentCaptures table in drizzle/schema.ts
- [x] Run pnpm db:push to apply migrations
- [x] Add insertLead, getLeads, updateLeadStatus, markLeadGhlSent helpers to server/db.ts
- [x] Add insertExitIntentCapture helper to server/db.ts
- [x] Add leads.submit tRPC procedure (persists to DB + forwards to GHL)
- [x] Add leads.list tRPC procedure (admin only)
- [x] Add leads.updateStatus tRPC procedure (admin only)
- [x] Add exitIntent.capture tRPC procedure
- [x] Update Home.tsx MultiStepForm to use tRPC mutation
- [x] Update ExitIntentPopup.tsx to use tRPC mutation
- [x] Update DoIQualifyQuiz.tsx to use tRPC mutation
- [x] Update SellingHouseWithSolar.tsx form to use tRPC mutation
- [x] Update SolarLienRemoval.tsx form to use tRPC mutation
- [x] Update SolarLoanHelp.tsx form to use tRPC mutation
- [x] Write vitest tests for leads and exitIntent routers (11 tests passing)

## Phase 6 — Apollo.io Visitor Tracking
- [x] Add Apollo.io tracker script to client/index.html head

## Phase 7 — SEO Indexing Fixes
- [x] Check GSC performance data to protect ranking pages
- [x] Audit 185 ghost city URLs in sitemap vs cities.ts data
- [x] Added data for all 185 ghost cities (303 total cities now in cities.ts)
- [x] Add canonicalUrl field support to BlogPost.tsx
- [x] Canonicalize 17 duplicate blog posts to city pages (skipped houston-tx and sacramento-ca with GSC impressions)
- [x] Add canonical tags to StateLawPage.tsx (52 pages)
- [x] Add canonical tags to SolarContractHelp, SolarPanelScam, SolarExitOptions, StateLawsIndex
- [x] Add /solar-lien-removal, /solar-loan-help, /solar-exit-options to sitemap (486 total URLs)

## Phase 8 — High-Impact SEO Execution
- [x] Add city→state law internal links in CityPage.tsx (303 pages)
- [x] Add state law→city internal links in StateLawPage.tsx (53 pages)
- [x] Add Organization schema to homepage
- [x] Add FAQPage schema to homepage
- [x] Add HowTo schema to homepage process section
- [x] Add BreadcrumbList schema to BlogPost.tsx (already existed)
- [x] Add FAQPage schema to CompanyPage.tsx
- [x] Create image-sitemap.xml (68 image URLs)
- [x] Update robots.txt to reference image sitemap
- [x] Add Bing verification meta tag to index.html
- [x] Register breakyoursolarcontract.com in Bing Webmaster Tools
- [x] Add SolarFraudReport canonical tag and Dataset schema

## Phase 9 — Bing Verification & Deployment Checklist
- [x] Save checkpoint with all SEO changes for publish
- [x] Fix Bing registration to non-www domain (breakyoursolarcontract.com)
- [x] Complete Bing ownership verification after publish
- [x] Submit sitemap.xml and image-sitemap.xml to Bing
- [x] Write DEPLOY_CHECKLIST.md to prevent future missed steps

## Phase 10 — Schema Expansion, Content, Admin Dashboard & SEO Documentation
- [ ] Design and push seo_strategy + seo_pages database tables
- [ ] Add LegalService schema to all 53 state law pages (StateLawPage.tsx)
- [ ] Write 30 company-targeted blog posts (cancel/complaints per company)
- [ ] Add all 30 new blog posts to sitemap.xml and image-sitemap.xml
- [x] Build /admin/leads protected dashboard with filters and status management
- [x] Add admin leads tRPC procedures (list with filters, updateStatus)
- [ ] Populate SEO strategy database with full journey + page inventory
- [ ] Write PLAYBOOK.md — full duplication guide for replicating this site on any niche
- [ ] Write vitest tests for admin leads procedures

## Phase 11 — Analytics Audit & Tracking Infrastructure
- [ ] Full site audit: webhook submissions, GHL contacts, indexing status, ranking, tracking gaps
- [ ] Build persistent DB tracking for: page views, CTA clicks, form submissions, webhook fires, GHL sync
- [ ] Add analytics/tracking tab to admin dashboard
- [ ] Wire GA4 Data API once service account key is provided
- [ ] Fix conversion event tracking (fire gtag generate_lead on form submit)
- [ ] Add siteEvents table to DB schema for click/engagement tracking

## Phase 12 — Keyword Ranking Reports
- [x] Build keyword ranking Excel report (40 keywords, Mar 30 2026 baseline, matches leadflowpartners.com format)
- [ ] Add monthly snapshot update script (run 1st of each month, appends new column)
- [ ] Wire GA4 API to auto-populate positions when service account key is provided
- [ ] Add keyword ranking tab to admin dashboard

## Phase 14 — Form UX Redesign

- [x] Add glowing amber border to multi-step form container
- [x] Add clear form header with instructions ("Step 1 of 5 — Tell us about your situation")
- [x] Improve visual hierarchy so form is unmistakably a form, not a content section
- [x] Add visual step indicator with labels

## Phase 15 — Hero Animation & Blog Fixes

- [ ] Add looping animated ambient light/glow effect to hero section background
- [ ] Fix 404 on /blog/solar-contract-rescission-rights (create page or fix routing)
- [ ] Audit all blog URLs for 404s and fix any broken routes

## Phase 16 — GSC Indexing Fixes (490 pages not indexed)

- [x] Fix "Page with redirect" issues — image-sitemap.xml had www URLs causing 301 redirects; fixed to non-www
- [x] Fix "Alternate page with proper canonical tag" — removed 18 blog posts with canonical overrides from sitemap
- [x] Fix "Discovered - currently not indexed" — added noindex to 179 thin city pages (no depth data) to preserve crawl budget
- [x] Fix "Duplicate, Google chose different canonical than user" — removed 18 duplicate blog posts from sitemap
- [x] Fix robots.txt — removed www image-sitemap reference, cleaned up non-existent sitemap-index.xml
- [x] Update all sitemap lastmod dates to 2026-04-02 for freshness signal
- [x] Sitemap now has 321 clean URLs (123 city, 127 blog, 51 state law, 13 company, misc)
- [ ] Submit updated sitemap.xml to GSC for re-crawl
- [ ] Use GSC URL Inspection to request indexing on top 10 city pages
- [ ] Monitor indexing report in 2 weeks

## Phase 17 — SEO Audit Implementation (Priority Action Plan)

- [x] Create/fix LLMs.txt — already comprehensive; updated coverage numbers to 123 cities, 51 states, 127 blog posts
- [x] Verify OG tags on all page types — useSeoMeta dynamically updates og:title, og:description, og:url, og:image on all pages
- [x] Add og:type support to useSeoMeta — blog posts now set og:type=article; all others use website
- [x] Add ogImage to BlogPost.tsx — blog hero image now used as og:image
- [x] BreadcrumbList schema — already on BlogPost, CityPage, CompanyPage, StateLawPage; added to StateLawsIndex
- [x] FAQPage schema — added to StateLawsIndex (2 questions); already on all other key page types
- [x] Add AggregateRating schema to all 13 company pages — BBB grade converted to 1-5 numeric score; reviewCount from complaint count
- [x] Verify unique title tags — all page types use dynamic titles via useSeoMeta
- [x] Verify meta descriptions — all page types have unique descriptions via useSeoMeta

## Phase 19 — GSC Full Audit & Indexing Push

- [x] Audit canonical errors (6 pages) — HTTP versions; clicked Validate Fix in GSC
- [x] Audit redirect issues (3 pages) — www versions; clicked Validate Fix in GSC
- [x] Audit soft 404 (1 page) — /city/west-valley-city-ut old route; added 301 redirect in server
- [x] Fix FAQ schema — 86 invalid items (duplicate FAQPage); removed static FAQPage from client/index.html
- [x] Check sitemap status in GSC — all 3 sitemaps Success, 321 pages discovered
- [x] ROOT CAUSE FOUND: SPA Soft 404 — all non-homepage pages invisible to Googlebot (no JS execution)
- [x] Fix: server-side meta injection (server/seo-meta.ts + server/_core/vite.ts) — 469 URLs mapped
- [x] Write reusable AI prompt guide + 4 lesson files in docs/lessons-learned/
- [ ] Publish site so fixes go live
- [ ] After publish: validate Soft 404 fix via GSC URL Inspection on company pages
- [ ] After publish: request indexing for top 20 priority pages (company + state law)
- [ ] Monitor indexing report in 2 weeks — expect 200+ pages to move to Indexed
