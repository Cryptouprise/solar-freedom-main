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
