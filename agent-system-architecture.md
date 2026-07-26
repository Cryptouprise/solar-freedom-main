# Agent System Architecture Reference

## 5-Agent Ecosystem

1. **Money-Making Agent** (`money_maker`)
   - Finds law firms, scores them, identifies revenue opportunities
   - Directs what content to create based on revenue potential
   - Tracks revenue pipeline: leads sold, invoices, payments
   - North star: revenue generated

2. **SEO Intelligence Agent** (`seo_intel`)
   - Tracks every change made to the site with timestamps
   - Pulls GSC/GA4 data before/after each change
   - Correlates changes to outcomes (impressions, clicks, position)
   - Monitors algorithm updates
   - Recommends next moves based on what's working

3. **Content Agent** (`content`)
   - Takes directives from Money-Making Agent
   - Writes SEO-optimized articles, city pages, Medium articles
   - Targets keywords that will generate leads/money
   - Uses OpenRouter models (owl-alpha free, deepseek free, gemini flash)

4. **Editor Agent** (`editor`)
   - Quality gate on all content before publishing
   - Checks: duplicate content risk, E-E-A-T compliance, factual accuracy
   - SEO optimization verification
   - "Does this article serve a money-making purpose?"

5. **Manager Agent** (`manager`)
   - Oversees ALL agents, verifies their outputs
   - Double/triple checks work before anything goes live
   - Approves/rejects actions
   - Final checkpoint — nothing ships without sign-off
   - Priority ranking: Money first, then appointments at risk, then efficiency

## Design Philosophy (from Omega Dashboard)

- "If the strip is clean and tiles are green, you're done in 20 seconds"
- Priority-ranked action queue (P1-P5)
- Accountability layer — verify what ACTUALLY happened
- ALARM flags with targets (actual vs expected)
- Live + auto-refresh on cron schedule
- Tab-based navigation for different views
- Dark theme, Omega-style

## Technical Stack

- **LLM**: OpenRouter API (callLLM helper in server/cron/aiCostTracker.ts)
- **Models**: owl-alpha (free), deepseek-chat-v3 (free), gemini-flash (free/cheap)
- **Database**: MySQL/TiDB via Drizzle ORM
- **API**: tRPC procedures in server/routers.ts
- **Frontend**: React + Tailwind + shadcn/ui
- **Cron**: Heartbeat platform cron system

## Database Tables (added in migration 0012)

- `agents` — registry of all 5 agents with config
- `agentMessages` — inter-agent communication bus
- `agentActions` — prioritized action queue (P1-P5)
- `attorneyProspects` — firms discovered by Money-Making Agent
- `seoChangeLog` — every site change tracked for impact
- `contentPipeline` — articles flowing through agent system
- `agentRunLog` — execution history per agent
- `revenueTracker` — all revenue events

## Business Context

- Solar Freedom generates leads via website, Facebook, inbound calls
- Speed-to-lead system: AI voice, text, email sequences for 2 weeks
- 315 appointments booked from ~500 leads (63% booking rate)
- $60K collected, $488K in outstanding invoices (79 invoices)
- Average deal size: ~$6,000
- Law firms will pay per lead, per call, per appointment
- Site currently recovering from Google penalty (303 city pages + 171 articles)

## File Locations

- Schema: `drizzle/schema.ts` (lines 686+)
- LLM Helper: `server/cron/aiCostTracker.ts` (callLLM function)
- Admin Router: `server/adminRouter.ts`
- Admin Pages: `client/src/pages/admin/`
- Research Data: `research-attorney-firms.md`
