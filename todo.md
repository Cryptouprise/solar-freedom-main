# SEO Autonomous Task List

## Phase 1 — State of Solar Fraud Report Page
- [x] Build /solar-fraud-report page (high-authority linkable asset)
- [x] Add to App.tsx routing
- [x] Add to main.tsx pre-registration
- [x] Add to sitemap.xml

## Phase 2 — AEO & Schema Stacking
- [x] Add breadcrumb schema to BlogPost, CityPage, CompanyPage
- [x] Add AEO Q&A speakable blocks to BlogPost
- [x] Add HowTo schema to process section on homepage
- [x] Add video schema placeholder for future YouTube content
- [x] Add Article schema to BlogPost pages
- [x] Add LocalBusiness schema to CityPage pages

## Phase 3 — Sitemaps & Bing Submission
- [x] Create image sitemap (image-sitemap.xml)
- [x] Create news sitemap (news-sitemap.xml)
- [x] Submit sitemap to Bing Webmaster Tools via API
- [x] Update robots.txt to reference all sitemaps

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
- [x] Add LegalService schema to all 53 state law pages (StateLawPage.tsx)
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
- [x] Fix conversion event tracking (fire gtag generate_lead on form submit)
- [x] Add siteEvents table to DB schema for click/engagement tracking

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

- [x] Add looping animated ambient light/glow effect to hero section background
- [x] Fix 404 on /blog/solar-contract-rescission-rights (create page or fix routing)
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

## Phase 20 — SEO Sprint: Quiz Placement, Author Bios, Company Hub
- [ ] Move DoIQualifyQuiz to top of blog posts (after lead paragraph) for higher conversion
- [ ] Add author/attorney bio section to blog posts for E-E-A-T signals
- [ ] Build Solar Company Hub page (/solar-companies) — master page with cards for all companies
- [ ] Generate 5 new articles via content pipeline (Vivint, Tesla, Sunnova, escalator clause, GoodLeap)
- [ ] Submit all new pages to Google Indexing API and IndexNow

## Phase 20 — SEO Sprint: Quiz Placement, Author Bio, Company Hub, Batch 10 Articles
- [x] Solar Company Hub page (/solar-companies) — master directory of all 13 companies
- [x] Added /solar-companies to sitemap, SEO meta, and homepage nav
- [x] Moved DoIQualifyQuiz to top of BlogPost (after lead paragraph, above fold)
- [x] Added AuthorBio E-E-A-T section to all blog posts
- [x] Enhanced Article schema with Organization author
- [x] Created batch 10: 5 new articles (Vivint 2026, escalator clause, Sunnova transfer, Tesla/SolarCity, GoodLeap fees)
- [x] Added all 5 new articles to sitemap
- [x] Submitted 6 new URLs to Bing IndexNow (202) and Yandex IndexNow (202)
- [x] Confirmed Bing IndexNow working: 924 URLs received in Bing Webmaster Tools
- [x] Google Indexing API: 145/462 done, scheduled batches for May 3 and May 4

## Bug Fix — Solar Company Pages 404
- [ ] Diagnose 404 errors when clicking company pages from /solar-companies hub
- [ ] Fix broken links/routes for all 13 company pages
- [ ] Verify all company pages load correctly
- [x] Fix company page 404 errors — root cause: regexparam doesn't support :slug in middle of path segment
- [x] Switch to RegExp route pattern for company pages
- [x] Fix TopicClusterWidget crash — missing "orange" color in COLOR_MAP

## Phase 21 — Admin Content API (Claude / External AI Integration)
- [x] Add blog_posts table to database schema
- [x] Add companies table to database schema
- [x] Add site_config table to database schema
- [x] Add api_keys table to database schema
- [ ] Seed database with all static blog posts (optional — static files still work)
- [ ] Seed database with all company data (optional — static files still work)
- [x] Build /api/admin/posts CRUD endpoints
- [x] Build /api/admin/companies CRUD endpoints
- [x] Build /api/admin/config endpoints
- [x] Build /api/admin/keys endpoint (generate/revoke API keys)
- [x] Secure all admin endpoints with API key auth middleware
- [x] Add tRPC content procedures (listPosts, getPost, listCompanies, getCompany)
- [x] Write API documentation and Claude usage guide (docs/ADMIN-API.md)

## Phase 22 — Admin Content Panel UI
- [x] Create /admin/content page (owner-only route)
- [x] Show DB-managed posts (Claude-published) with status badges
- [x] Show static posts count and list
- [x] Add publish/unpublish toggle for DB posts
- [x] Add delete button for DB posts
- [x] Add quick-view modal for post content
- [x] Add Content Manager nav link to AdminLeads header

## Phase 23 — Create Post Form + Full Content API
- [x] Add /api/admin/posts/all endpoint (static + DB posts combined)
- [x] Add /api/admin/posts/slugs endpoint (just slugs for interlinking)
- [x] Update Claude system prompt in AdminContent to reference /all endpoint
- [x] Build Create Post modal form in AdminContent
- [x] Form fields: title, slug, excerpt, content (HTML), category, tags, metaTitle, metaDescription, heroImage, readTime, relatedSlugs, published toggle
- [x] Auto-generate slug from title
- [ ] Preview related posts picker (search existing slugs)
- [x] Submit creates post via /api/admin/posts

## Phase 24 — Edit Post + SEO Audit + API Docs
- [x] Add Edit Post modal to AdminContent page
- [x] Run comprehensive SEO audit via Google Search Console
- [x] Compile full Admin API capabilities reference document (docs/CLAUDE-CAPABILITIES.md)

## Phase 25 — DB Post SEO Meta Fix
- [x] Fix prerender.mjs to fetch DB blog posts from database at build time
- [x] Add injectMetaDynamic() to seo-meta.ts for runtime DB post meta lookup
- [x] Update serveStatic() in vite.ts to use async injectMetaDynamic
- [x] Root cause: sunrun-solar-contract-cancellation-2026 had 2,994 impressions but 0.1% CTR due to generic homepage meta showing in Google

## Phase 26 — Post-Quiz GHL Booking Modal
- [x] Fix prerender.mjs DB connection timeout (deployment build hang)
- [x] Create BookingModal component with branded Solar Freedom design
- [x] Embed GHL calendar widget (ID: 3v6GXFtDrHMzs1j2DBkI) in modal
- [x] Show modal after quiz form submission (after "thank you" state) — auto-opens after 1.2s, also has manual button
- [x] Add call prep instructions inside modal (what to expect on the call)
- [x] Match site design: dark charcoal bg, amber accents, Bebas Neue headings
- [x] Wire modal to both MultiStepForm (homepage) and DoIQualifyQuiz (blog posts)

## Phase 27 — SEO CTR Optimization & Form UX
- [x] Rewrite meta description for cancel-solar-contract-boston (CTR improvement)
- [x] Rewrite meta description for selling-home-with-solar-ppa (CTR improvement)
- [x] Rewrite meta description for adt-solar-complaints (CTR improvement)
- [x] Rewrite meta description for sunlight-financial-solar-loan-complaints (CTR improvement)
- [x] Rewrite meta description for goodleap-solar-loan-hidden-dealer-fees-2024 (CTR improvement)
- [x] Fix state law prerender to use per-state metaTitle/metaDescription (51 pages now have unique meta)
- [x] Fix /state-solar-laws 301 redirect → /solar-contract-laws (GSC soft 404 fix)
- [x] Remove /state-solar-laws from sitemap.xml (was causing GSC soft 404)
- [x] Wire BookingModal + useContactInfo sticky pre-fill to SellingHouseWithSolar form
- [x] Wire BookingModal + useContactInfo sticky pre-fill to SolarLienRemoval form
- [x] Wire BookingModal + useContactInfo sticky pre-fill to SolarLoanHelp form
- [x] Add blog-articles-batch10.ts to prerender.mjs blog loading list

## Phase 28 — Comprehensive Meta Description Audit & Fix (All 87 Impression Pages)

- [x] Pulled full GSC impressions list (87 pages, last 90 days, 7,244 total impressions, 60 clicks, 0.8% avg CTR)
- [x] Identified all pages with 1+ impressions: 38 blog, 37 city, 10 state law, 2 static
- [x] Rewrote all 38 blog article meta descriptions with click-compelling, specific copy
- [x] Generated and applied 31 new city page meta overrides in seo-meta.ts (all cities with impressions)
- [x] Fixed 8 state law meta descriptions that were too long (150-160 char limit) or broken (Hawaii truncated)
- [x] Fixed all TypeScript syntax errors from apostrophes in single-quoted strings (batch5, batch6, batch9, state-laws.ts)
- [x] Fixed all corrupted metaDescription fields where new text was prepended to old text
- [x] Verified 0 TypeScript errors across all data files
- [x] Submitted all 87 pages to Google Indexing API for priority re-crawl

## Phase 29 — Sunrun Featured Placement & Dedicated Company Page

- [x] Check Google Indexing API submission results — top pages already indexed, new meta will be picked up on next crawl
- [x] Add sunrun-solar-contract-cancellation-2026 to homepage Featured Articles section with amber "Most Read" badge
- [x] Build dedicated /sunrun company page (cancellation focus, attorney CTAs, contract clause breakdown, case form)
- [x] Wire /sunrun into App.tsx routing
- [x] Add /sunrun to sitemap.xml (483 total URLs) and seo-meta.ts
- [x] Submit /sunrun to Google Indexing API (queued for crawl within 1-7 days)

## Phase 30 — Press Releases + Priority 200-URL Indexing API Submission

- [x] Identify 200 highest-priority unindexed URLs for Indexing API submission
- [x] Submit 104 priority URLs to Google Indexing API (real URL_UPDATED publish calls — hit 200/day quota at URL 104, 96 remaining for tomorrow)
- [x] Write Press Release 1: Broad awareness — solar contract cancellation cases surge 2026
- [x] Write Press Release 2: Sunrun escalator clause — payment increases
- [x] Write Press Release 3: State-by-state solar contract rights resource launch
- [x] Save all three press releases as downloadable Markdown files

## Phase 31 — Complete 200-URL Daily Quota + Schedule Monday/Tuesday Batches

- [ ] Submit remaining 96 high-priority city URLs to hit full 200/day quota today
- [ ] Schedule Monday batch: 200 URLs (remaining city pages + more state law pages)
- [ ] Schedule Tuesday batch: ~80 URLs (final remaining pages to complete all 483)

## Phase 25 — Press Release & Backlink Acquisition Engine

- [x] Add pressReleaseTopics, pressReleaseLogs, pressReleaseSettings DB tables
- [x] Add backlinkTargets, backlinkOpportunities DB tables
- [x] Run pnpm db:push to create all new tables
- [x] Build server/cron/pressRelease.ts — OpenRouter AI generation + PRLog + NewsByWire submitters
- [x] Build server/cron/backlinkDiscovery.ts — weekly backlink opportunity scanner
- [x] Wire cron jobs to server startup (server/_core/index.ts)
- [x] Add pressRelease.* and backlinks.* tRPC procedures to routers.ts
- [x] Build /admin/press-releases admin-only control panel page
- [x] Add route to App.tsx (/admin/press-releases)
- [x] Add OPENROUTER_API_KEY secret
- [x] Validate OpenRouter API key with vitest (2 tests passing)
- [x] Seed 7 default press release topics into DB
- [ ] Add more free PR distribution sites (1888PressRelease, OpenPR, PRFree, PRBuzz)
- [ ] Wire Playwright browser automation for sites requiring form-based submission
- [ ] Add PRLog and NewsByWire account credentials to settings
- [ ] Test end-to-end dry run from admin panel

## Phase 26 — Extended PR Distribution + High-DA Publishing

- [x] Add Playwright submitter for 1888PressRelease.com (form-based, no login)
- [x] Add Playwright submitter for OpenPR.com (form-based, no login)
- [x] Add Playwright submitter for PRFree.com (form-based, no login)
- [x] Add Playwright submitter for PRBuzz.com (form-based, no login)
- [x] Add Playwright submitter for Medium.com (Google OAuth login, DA 95)
- [x] Add Playwright submitter for LinkedIn Articles (Google OAuth login, DA 98)
- [x] Add Playwright submitter for Substack (Google OAuth login, DA 90)
- [x] Wire all new submitters into runPressReleaseCycle
- [x] Update admin panel to show all 9 distribution sites with per-site enable/disable toggles
- [x] Test dry run end-to-end from admin panel

## Phase 27 — Image Models, Embedding Models, Cost Tracking

- [x] Add ai_cost_log DB table (model, type, tokens_in, tokens_out, cost_usd, feature, createdAt)
- [x] Add image_model and embedding_model settings to pressReleaseSettings
- [x] Add image generation call to press release cycle using selected image model
- [x] Add embedding generation call using selected embedding model
- [x] Wire cost tracking into every LLM/image/embedding call
- [x] Add tRPC procedures: getCostSummary, getCostByModel, getCostByFeature
- [x] Add image model selector to admin Settings tab (Seedream 4.5, Gemini 3.1 Flash Image, Gemini 2.5 Flash Image)
- [x] Add embedding model selector to admin Settings tab (Qwen3 Embedding 8B nitro/exacto)
- [x] Add Cost Dashboard tab to admin panel (total spend, per-model breakdown, per-run cost)

## Phase 28 — Capabilities Manifest & AI API

- [x] Audit all routers, cron jobs, DB tables for full inventory
- [x] Write CAPABILITIES.md with full feature map, endpoint reference, AI usage guide
- [x] Add /api/capabilities public endpoint (returns JSON + Markdown)
- [x] Add /api/capabilities.md endpoint for raw Markdown fetch

## Phase 29 — Unified Admin Layout & Post Editor

- [x] Build AdminLayout sidebar component linking all admin pages
- [x] Wrap AdminAnalytics in AdminLayout
- [x] Wrap AdminLeads in AdminLayout
- [x] Wrap PressReleaseAdmin in AdminLayout
- [x] Add /admin/posts route for PostEditor
- [x] Add SEO Command Center to AdminLayout nav
- [x] Build PostEditor with TipTap rich text, image upload, link editing
- [x] Add listAllPosts and getAdminPost tRPC procedures
- [x] Add updatePost and uploadImage tRPC procedures

## Phase 30 — Blog Writing Studio

- [x] Add blogStudio.analyze tRPC procedure (fetch GSC top posts + run SEO analysis)
- [x] Add blogStudio.generate tRPC procedure (streaming AI writing with model switcher)
- [x] Add blogStudio.generateImage tRPC procedure (Seedream 4.5 / Gemini 2.5 Flash Image)
- [x] Build /admin/blog-studio 3-panel layout (editor | AI assistant | SEO analysis)
- [x] TipTap editor with full toolbar (headings, bold, italic, lists, blockquotes, links, code, images)
- [x] AI assistant panel: model selector (Owl Alpha, DeepSeek, Gemini, HunyuanT1, Claude Haiku), prompt input, streaming output
- [x] SEO analysis panel: top GSC posts, live keyword density, heading structure, internal link suggestions
- [x] Image panel: upload or AI-generate with prompt, insert into editor
- [x] Meta panel: title, slug, excerpt, category, tags, hero image, read time, publish status
- [x] Add /admin/blog-studio route to App.tsx and AdminLayout nav
- [x] TypeScript check, save checkpoint

## Phase 31 — UX Bug Fixes

- [ ] Audit all pages for form stickiness issues
- [ ] Fix form not sticky on scroll on non-homepage pages
- [ ] Wire GHL calendar booking widget to open after form submit (success state)
- [ ] Audit blog posts for CTA duplication (4+ instances)
- [ ] Consolidate blog post CTAs to max 2: one inline mid-post, one sticky bottom bar
- [ ] Remove duplicate "Get Your Free Review" CTAs from blog post template

## Phase 31 — UX Bug Fixes

- [x] Fix inline CTA duplication on blog posts — changed from every 4 paragraphs to ONE midpoint CTA only
- [x] Fix QuickCallbackForm — after submit, auto-opens GHL/Calendly calendar iframe inline
- [x] Confirmed form stickiness — StickyMobileBar is global in App.tsx, works on all pages

## Phase 32 — AdminContent Sidebar + Browser Login for High-DA Sites

- [x] Wrap AdminContent in AdminLayout sidebar (remove standalone header, fix div nesting)
- [x] Create server/cron/browserLoginSession.ts — Playwright login helper for Medium, LinkedIn, Substack
- [x] Add pressRelease.browserLogin tRPC mutation (opens visible browser for admin login)
- [x] Add pressRelease.checkLoginStatus tRPC query (reads cookies from storage state file)
- [x] Add Login with Browser buttons + Connected/Not logged in status indicators to Settings tab

## Phase 33 — Blog Studio: Insert Fix + Autosave + Drafts

- [x] Fix "Insert into body" — AI markdown output now converted to HTML via marked before TipTap insertion
- [x] Add autosave every 30s — silently saves to blogDrafts table as name="autosave"
- [x] Add beforeunload warning when there are unsaved changes
- [x] Add draft panel (Drafts button in top bar) — save named drafts, restore, delete
- [x] Add blogDrafts table to schema + db:push migration
- [x] Add blogDrafts tRPC procedures (save, list, get, delete)

## Phase 40 — YouTube Description + Media Hub Page

- [x] Write SEO/AEO/GEO-optimized YouTube description (both domains, all companies, 3 outcomes, hashtags, timestamps, CTA)
- [x] Build /media page (MediaHub.tsx) — standalone public page, no admin
- [x] Two sections: Explainer Videos + Podcast Episodes
- [x] VideoObject JSON-LD schema for each video (Googlebot-readable)
- [x] Massive cross-linking: 12 company pages, 10 blog posts, 12 state law pages, 10 landing/resource pages
- [x] Both domains featured: breakyoursolarcontract.com + cancelyoursolar.co
- [x] Three Outcomes section (Total Cancellation, 30-60% Loan Reduction, Credit Restoration)
- [x] Subscribe links (YouTube, Spotify, Apple Podcasts, cancelyoursolar.co)
- [x] Add /media + /watch routes to App.tsx
- [x] Add "Watch & Listen" to main nav in Home.tsx
- [x] Add /media SEO meta to seo-meta.ts
- [x] Add /media to sitemap.xml (priority 0.9, weekly)
- [x] Add /media to generate-sitemap.mjs (durable across regenerations)
- [x] Add /media to prerender.mjs (static HTML for Googlebot)

## Phase 41 — CRITICAL: Google Spam Penalty Recovery (July 2026)

- [x] Pull GSC 90-day performance data for all city pages
- [x] Identify top 25 city pages with actual search demand (clicks + high impressions)
- [x] Create client/src/data/indexed-cities.ts whitelist (25 slugs)
- [x] Update CityPage.tsx to use isCityIndexed() for noindex flag
- [x] Update server/seo-meta.ts to inject noindex for non-whitelisted city pages (server-side)
- [x] Update server/_core/vite.ts to inject noindex in dev mode via injectMetaDynamic
- [x] Update scripts/prerender.mjs to set noindex in prerendered HTML for non-whitelisted cities
- [x] Update scripts/generate-sitemap.mjs to exclude noindexed cities (276 removed, 25 remain)
- [x] Regenerate sitemap.xml — now 262 URLs (was 483+)
- [x] Verify noindex works: orlando-fl shows "noindex, follow", dallas-tx shows "index, follow"
- [x] PUBLISH — deployed, verified live: orlando-fl shows noindex, dallas-tx shows index
- [x] Submit updated sitemap.xml to GSC (submitted July 15)
- [x] Request re-crawl on top 20 priority URLs via Indexing API (15 city + homepage + 4 blog posts)
- [ ] Monitor: expect "Excluded by noindex" to appear for 276 city pages within 1-2 weeks
- [ ] Monitor: spam penalty should lift within 2-4 weeks after Google processes noindex signals

## Phase 42 — Attorney Language Compliance Cleanup (July 18, 2026)

- [x] Audit all pages/data files for claims of being attorneys/law firm
- [x] Fix Home.tsx footer: "Consumer protection attorneys" → "Consumer protection advocates"
- [x] Fix Home.tsx hero alt text: remove "attorneys" claim
- [x] Fix blog-articles-batch6.ts: 51 instances of "Our attorneys review your contract"
- [x] Fix blog-articles-batch7.ts: multiple "our attorneys" and "our legal team" claims
- [x] Fix blog-articles-batch8.ts: 30+ instances of "Our attorneys review your agreement"
- [x] Fix blog-articles-batch10.ts: 6 instances of "Our attorneys" claims
- [x] Fix blog-extra.ts: "our attorneys' experience" and "our attorneys evaluate"
- [x] Fix blog.ts: CTA subtext attorney claim
- [x] Fix companies.ts: "our attorneys specialize" and "our attorneys have successfully"
- [x] Fix blog-articles-batch5.ts: meta description "Our attorneys saved 50+"
- [x] Fix SolarCompanyHub.tsx: "Our legal team has handled cancellations"
- [x] Fix StateLawPage.tsx: "local attorney resources"
- [x] Fix state-laws.ts: "Free attorney review" → "Free case review"
- [x] Fix topicClusters.ts: "solar attorney free review"
- [x] Verify TypeScript compiles cleanly after all changes
- [x] Verify dev server runs correctly

## Phase 43 — FAQ Schema on All Blog Posts (SEO Recovery Sprint)

- [x] Audit BlogPost.tsx FAQ schema implementation — already reads from article data
- [x] Injected FAQs into 79 blog posts with empty faq arrays (batch6: 49, batch8: 30)
- [x] Added FAQPage schema to SunrunPage.tsx (5 Q&As via useEffect JSON-LD injection)
- [x] Added FAQPage schema to CompanyPage.tsx (4 dynamic Q&As per company via SchemaInjector)
- [x] Fixed trust proxy warning in server/_core/index.ts (always enabled now)
- [x] TypeScript compiles clean (0 errors)

## Phase 44 — Strengthen 25 Indexed City Pages

- [x] Identified 7 of 25 indexed cities missing depth data (no topComplaints, localStats, etc.)
- [x] Generated unique local depth content for 7 cities via LLM (state AG info, utility companies, local complaint stats, local attorneys)
- [x] Created client/src/data/city-content-depth-batch-f.ts with all 7 cities
- [x] Registered batch-f in city-content-depth-all.ts aggregator
- [x] All 25 indexed city pages now have full depth data
- [x] TypeScript compiles clean (0 errors)

## Phase 45 — Press Releases (Battle Plan Execution)

- [x] Write Press Release #1: Brand launch angle for EIN Presswire ($149) — saved to /home/ubuntu/press-release-1-ein-presswire.md
- [x] Write Press Release #2: Data story angle for Press Ranger ($299) — saved to /home/ubuntu/press-release-2-press-ranger.md
- [x] Both formatted per wire service requirements (600 words, boilerplate, contact info)

## Phase 46 — Lead Distribution Dashboard (Law Firm Partnerships)

- [x] Add lawFirms and leadDeliveries tables to drizzle/schema.ts
- [x] Run pnpm db:push to apply new tables
- [x] Build server/leadDistribution.ts with scoring, routing, and webhook delivery logic
- [x] Build firm management UI at /admin/lead-distribution (add/edit/delete firms, geographic coverage, pricing, status)
- [x] Lead quality scoring logic (payment amount, company, issue type, intent → score 1-10)
- [x] Geographic routing engine (state match + exclusive state priority → firm assignment)
- [x] Real-time webhook delivery to firm endpoints with HMAC signing
- [x] Billing dashboard (leads delivered, accepted, rejected, revenue per firm, mark-as-charged)
- [x] Admin-only access control (role check in UI + adminProcedure on all tRPC routes)
- [x] Auto-distribution wired into lead submission flow (fire-and-forget after GHL delivery)
- [x] TypeScript compiles clean (0 errors)

## Phase 47 — Content Calendar (8 Articles, 4 Weeks)

- [x] Week 1 Article 1: Sunnova Solar Contract cancellation after bankruptcy (~1,852 words)
- [x] Week 1 Article 2: ADT Solar complaints 2026 (~1,844 words)
- [x] Week 2 Article 1: Tesla Solar Roof cancellation guide 2026 (~2,122 words)
- [x] Week 2 Article 2: Freedom Forever solar contract problems (~2,328 words)
- [x] Week 3 Article 1: Solar loan vs solar lease — which is harder to cancel (~2,162 words)
- [x] Week 3 Article 2: Pink Energy bankruptcy — what customers can do (~1,915 words)
- [x] Week 4 Article 1: Solar contract cancellation letter template (~2,245 words)
- [x] Week 4 Article 2: Solar panel removal — who pays when you cancel (~2,009 words)
- [x] Add all 8 articles to sitemap.xml (271 URLs) and prerender.mjs
- [x] Submit all 8 URLs to Google Indexing API (8/8 success)

## Phase 48 — SEO Quick Wins & LinkedIn Templates

- [x] Write 5 LinkedIn post templates (story, list, controversy, data, personal narrative formats) — saved to /home/ubuntu/linkedin-post-templates.md
- [x] Internal linking audit — injected relatedSlugs into all 46 empty batch6 articles (0 remaining empty)
- [ ] Add cancelyoursolar.co 5-page landing site linking back to main domain (future task)

## Phase 49 — Schema Improvements & GSC Submissions (July 20, 2026)

- [x] Updated Phase 47 items: all 8 batch11 articles added to sitemap.xml (271 URLs) and prerender.mjs
- [x] Submitted all 8 batch11 article URLs to Google Indexing API (8/8 success)
- [x] Added Organization schema (with sameAs Medium) to homepage homeSchemas array
- [x] Added Service schema (Free Case Review) to homepage homeSchemas array
- [x] Added WebSite with SearchAction to homepage homeSchemas array
- [x] Updated meta title/description for homepage, /blog, /how-it-works, /solar-companies in seo-meta.ts
- [x] TypeScript compiles clean (0 errors)

## Phase 50 — City Page CTR Optimization & GSC Submissions (July 20, 2026)

- [x] Added CTR-optimized meta title/description overrides for all 25 indexed cities in seo-meta.ts (utility-specific, state-law-specific copy)
- [x] Submitted all 25 indexed city pages to Google Indexing API (25/25 success)
- [x] Submitted 6 key static pages to Google Indexing API (homepage, blog, how-it-works, solar-companies, solar-contract-laws, sunrun)
- [x] TypeScript compiles clean (0 errors)
