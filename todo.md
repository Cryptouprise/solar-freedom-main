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
- [ ] Save checkpoint with all SEO changes for publish
- [ ] Fix Bing registration to non-www domain (breakyoursolarcontract.com)
- [ ] Complete Bing ownership verification after publish
- [ ] Submit sitemap.xml and image-sitemap.xml to Bing
- [ ] Resubmit sitemap.xml to Google Search Console
- [ ] Write DEPLOY_CHECKLIST.md to prevent future missed steps
