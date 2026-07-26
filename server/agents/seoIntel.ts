/**
 * SEO Intelligence Agent — Solar Freedom
 *
 * ONE JOB: Drive traffic that converts to leads that make money.
 *
 * This agent monitors GSC data, tracks ranking changes, identifies
 * keyword gaps, and sends content directives to the Content Agent.
 * Every SEO recommendation must be tied to lead generation potential.
 */

import {
  agentLLM,
  startRun,
  completeRun,
  sendMessage,
  createAction,
  getUnreadMessages,
  markMessageActedOn,
  type AgentThinkResult,
} from "./engine";
import { getDb } from "../db";
import { seoChangeLog, seoPages, blogPosts, contentPipeline } from "../../drizzle/schema";
import { desc, eq, sql, and, gte, lt } from "drizzle-orm";

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the SEO Intelligence Agent for Solar Freedom (breakyoursolarcontract.com).

═══════════════════════════════════════════════════════════
MISSION: EVERY RANKING POINT = MORE LEADS = MORE MONEY.
SEO is not vanity metrics. It is the lead generation engine.
═══════════════════════════════════════════════════════════

SITE CONTEXT:
- Solar Freedom helps homeowners escape predatory solar contracts
- We are NOT attorneys — we are "consumer protection advocates" and "case specialists"
- Revenue comes from connecting leads with law firms ($150–$500/lead)
- Site was hit by Google penalty (thin/AI content) — NOW RECOVERING
- Current domain: breakyoursolarcontract.com

KNOWN PERFORMANCE DATA (from last GSC pull):
TOP PAGES:
  1. /blog/goodleap-cancel-solar-loan-2026 → 54 clicks, 4,618 impr, pos 8.2
  2. /blog/sunrun-solar-contract-cancellation-2026 → 47 clicks, 8,473 impr, pos 9.0 ← BIGGEST OPPORTUNITY
  3. /blog/how-to-get-out-of-solar-contract → 27 clicks, 3,114 impr, pos 19.7
  4. /blog/new-jersey-solar-contract-cancellation → 19 clicks, 641 impr, pos 7.7
  5. /blog/blue-raven-solar-complaints → 15 clicks, 857 impr, pos 8.9

TOP 5 KEYWORD GAPS (high impressions, low rank, no dedicated article):
  1. "cancel sunrun contract california" → 234 impr, pos 31.3 — NO ARTICLE EXISTS
  2. "how to get out of sunrun contract" → 160 impr, pos 17.5
  3. "sunrun cancellation" → 130 impr, pos 30.8
  4. "cancel sunrun before installation" → 119 impr, pos 15.6
  5. "solar cancellation california" → 91 impr, pos 31.5

LEAD CONVERSION MATH:
- Position 1–3: ~30% CTR → 1,000 impressions = 300 clicks
- Position 4–10: ~5–10% CTR → 1,000 impressions = 50–100 clicks
- Position 11–30: ~1–3% CTR → 1,000 impressions = 10–30 clicks
- Site conversion rate: ~2% of visitors fill out form
- Each lead worth: $150–$500 to us

SUNRUN OPPORTUNITY CALCULATION:
- "sunrun-solar-contract-cancellation-2026" has 8,473 impressions at pos 9.0
- Moving from pos 9 to pos 3 = CTR from ~5% to ~30% = 6× more clicks
- 8,473 × 25% more CTR = ~2,118 additional clicks/month
- At 2% conversion = 42 more leads/month
- At $200/lead = $8,400/month additional revenue from ONE page improvement

CONTENT DIRECTIVES FORMAT:
When sending directives to Content Agent, include:
1. Primary keyword (exact match)
2. Secondary keywords (3–5)
3. Target word count (2,500+ for competitive keywords)
4. Specific sections to include (state laws, company-specific info, CTA placement)
5. Internal links to add (city pages, related articles)
6. Revenue justification (why this article makes money)

SEO RECOVERY PRIORITIES:
1. Quality signals — every article needs 2,500+ words, original research, specific data
2. E-E-A-T — add author bios, cite sources, include real case outcomes
3. Internal linking — every article should link to 3+ related articles and 2+ city pages
4. Backlinks — Medium syndication with canonical tags (DA 95), press releases, HARO
5. Technical — page speed, Core Web Vitals, schema markup

OUTPUT FORMAT — respond ONLY with valid JSON, no markdown:
{
  "analysis": "2-3 sentence executive summary of SEO state and top revenue opportunity",
  "topOpportunities": [
    {
      "keyword": "exact keyword",
      "currentPosition": 0,
      "impressions": 0,
      "estimatedMonthlyLeads": 0,
      "estimatedMonthlyRevenue": "$X",
      "action": "create_article|optimize_existing|build_backlinks|fix_technical",
      "priority": "p1|p2|p3"
    }
  ],
  "threats": [
    {
      "issue": "Specific ranking drop or penalty signal",
      "affectedPages": ["url1", "url2"],
      "impact": "high|medium|low",
      "fix": "Exact remediation steps"
    }
  ],
  "actions": [
    {
      "priority": "p1|p2|p3|p4|p5",
      "title": "Specific action title",
      "description": "Exactly what to do",
      "actionType": "content_gap|meta_fix|internal_link|backlink_needed|technical_fix|schema_markup"
    }
  ],
  "contentDirectives": [
    {
      "toAgent": "content",
      "keyword": "primary keyword",
      "title": "Suggested article title",
      "secondaryKeywords": ["kw1", "kw2", "kw3"],
      "wordCount": 2500,
      "urgency": "p1|p2|p3",
      "revenueJustification": "Why this makes money",
      "specificSections": ["section 1", "section 2"],
      "internalLinks": ["/blog/related-article", "/cancel-solar-contract/city-state"]
    }
  ],
  "messages": [
    {
      "toAgent": "content|money_maker|manager",
      "type": "directive|report|info",
      "subject": "Specific subject",
      "body": "Detailed message"
    }
  ]
}`;

// ─── Main Execution ───────────────────────────────────────────────────────────

export async function runSeoIntel(
  triggerType: "cron" | "manual" | "directive" | "event" = "cron",
  triggeredBy: string = "system"
): Promise<AgentThinkResult> {
  const context = await startRun("seo_intel", triggerType, triggeredBy);

  try {
    // 1. Gather state
    const state = await gatherSeoState();

    // 2. Check inbox
    const inbox = await getUnreadMessages("seo_intel");
    const inboxSummary = inbox.length > 0
      ? `\n\n═══ INBOX (${inbox.length} messages) ═══\n${inbox.map(m =>
          `FROM: ${m.fromAgent} | TYPE: ${m.type} | SUBJECT: ${m.subject}\n${m.body?.substring(0, 400)}`
        ).join("\n---\n")}`
      : "";

    // 3. Think
    const response = await agentLLM({
      agentSlug: "seo_intel",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `CURRENT SEO STATE:\n${state}${inboxSummary}\n\nAnalyze the SEO data. Calculate the revenue impact of each opportunity. Prioritize by money, not by vanity metrics. Send specific content directives to the Content Agent for the top 2–3 opportunities.`,
        },
      ],
      context,
      temperature: 0.25,
      maxTokens: 5000,
    });

    // 4. Parse
    let parsed: {
      analysis?: string;
      topOpportunities?: Array<{
        keyword: string;
        currentPosition: number;
        impressions: number;
        estimatedMonthlyLeads: number;
        estimatedMonthlyRevenue: string;
        action: string;
        priority: string;
      }>;
      threats?: Array<{ issue: string; affectedPages: string[]; impact: string; fix: string }>;
      actions?: Array<{ priority: string; title: string; description: string; actionType: string }>;
      contentDirectives?: Array<{
        toAgent: string;
        keyword: string;
        title: string;
        secondaryKeywords: string[];
        wordCount: number;
        urgency: string;
        revenueJustification: string;
        specificSections: string[];
        internalLinks: string[];
      }>;
      messages?: Array<{ toAgent: string; type: string; subject: string; body: string }>;
    } = {};

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      parsed = { analysis: response };
    }

    const db = await getDb();

    // 5. Create actions
    for (const action of (parsed.actions || [])) {
      await createAction({
        agentSlug: "seo_intel",
        priority: (action.priority as any) || "p3",
        title: action.title,
        description: action.description,
        actionType: action.actionType || "content_gap",
        requiresApproval: 0,
      });
      context.actionsCreated++;
    }

    // 6. Send content directives as structured messages to Content Agent
    for (const directive of (parsed.contentDirectives || [])) {
      const body = `CONTENT DIRECTIVE FROM SEO INTEL\n\nPrimary Keyword: ${directive.keyword}\nSuggested Title: ${directive.title}\nSecondary Keywords: ${directive.secondaryKeywords?.join(", ")}\nTarget Word Count: ${directive.wordCount || 2500}\nUrgency: ${directive.urgency}\n\nRevenue Justification:\n${directive.revenueJustification}\n\nRequired Sections:\n${directive.specificSections?.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nInternal Links to Include:\n${directive.internalLinks?.join("\n")}`;

      await sendMessage({
        fromAgent: "seo_intel",
        toAgent: "content",
        type: "directive",
        priority: (directive.urgency as any) || "p2",
        subject: `[SEO DIRECTIVE] Write: "${directive.title}"`,
        body,
      });
      context.messagesCreated++;

      // Also add to content pipeline
      if (db) {
        await db.insert(contentPipeline).values({
          title: directive.title,
          slug: directive.keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          contentType: "blog_article",
          stage: "idea",
          targetKeyword: directive.keyword,
          secondaryKeywords: JSON.stringify(directive.secondaryKeywords || []),
          wordCount: directive.wordCount || 2500,
          requestedBy: "seo_intel",
          assignedTo: "content",
          revenueJustification: directive.revenueJustification,
        }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
      }
    }

    // 7. Send general messages
    for (const msg of (parsed.messages || [])) {
      await sendMessage({
        fromAgent: "seo_intel",
        toAgent: msg.toAgent as any,
        type: (msg.type as any) || "report",
        priority: "p3",
        subject: msg.subject,
        body: msg.body,
      });
      context.messagesCreated++;
    }

    // 8. Mark inbox read
    for (const m of inbox) {
      await markMessageActedOn(m.id);
    }

    const summary = parsed.analysis || "SEO analysis cycle completed";
    await completeRun(context, summary);
    return { summary, actionsCreated: context.actionsCreated, messagesCreated: context.messagesCreated };

  } catch (error: any) {
    await completeRun(context, `Error: ${error.message}`, "failed", error.message);
    throw error;
  }
}

// ─── SEO State Gathering ──────────────────────────────────────────────────────

async function gatherSeoState(): Promise<string> {
  const db = await getDb();
  if (!db) return "Database unavailable";

  // Tracked pages sorted by impressions
  const pages = await db.select().from(seoPages)
    .orderBy(desc(seoPages.gscImpressions))
    .limit(30);

  // Recent SEO changes
  const changes = await db.select().from(seoChangeLog)
    .orderBy(desc(seoChangeLog.createdAt))
    .limit(15);

  // Published blog posts
  const posts = await db.select({
    id: blogPosts.id,
    title: blogPosts.title,
    slug: blogPosts.slug,
    publishedAt: blogPosts.publishedAt,
  }).from(blogPosts)
    .where(eq(blogPosts.published, 1))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(30);

  // Active content pipeline
  const pipeline = await db.select().from(contentPipeline)
    .orderBy(desc(contentPipeline.updatedAt))
    .limit(20);

  // Changes with measured impact
  const impactedChanges = changes.filter(c => c.impactMeasured === 1);

  return `
═══ TRACKED PAGES (${pages.length}) ═══
${pages.slice(0, 15).map(p =>
  `  ${p.url}: pos ${p.gscAvgPosition ?? "?"} | ${p.gscImpressions ?? 0} impr | ${p.gscClicks ?? 0} clicks`
).join("\n") || "  No pages tracked yet"}

═══ RECENT SEO CHANGES (${changes.length}) ═══
${changes.slice(0, 8).map(c =>
  `  [${c.changeType}] ${c.title}: ${c.description?.substring(0, 100)}`
  + (c.impactMeasured ? ` | Impact: ${(c.impactScore ?? 0) > 0 ? "+" : ""}${c.impactScore ?? 0} (${(c.impressionsDelta ?? 0) > 0 ? "+" : ""}${c.impressionsDelta ?? 0} impr, ${(c.clicksDelta ?? 0) > 0 ? "+" : ""}${c.clicksDelta ?? 0} clicks)` : " | Impact: not yet measured")
).join("\n") || "  No changes tracked yet"}

═══ PUBLISHED ARTICLES (${posts.length} total) ═══
${posts.slice(0, 20).map(p => `  /blog/${p.slug}`).join("\n")}

═══ CONTENT PIPELINE (${pipeline.length} items) ═══
${pipeline.slice(0, 10).map(p =>
  `  [${p.stage}] "${p.title}" | kw: ${p.targetKeyword || "none"} | requested by: ${p.requestedBy || "?"}`
).join("\n") || "  Empty pipeline"}

═══ KNOWN KEYWORD GAPS (hardcoded from last GSC analysis) ═══
  1. "cancel sunrun contract california" → 234 impr, pos 31.3 — NO ARTICLE
  2. "how to get out of sunrun contract" → 160 impr, pos 17.5
  3. "sunrun cancellation" → 130 impr, pos 30.8
  4. "cancel sunrun before installation" → 119 impr, pos 15.6
  5. "solar cancellation california" → 91 impr, pos 31.5
  6. "goodleap solar loan cancellation" → 4,618 impr, pos 8.2 (optimize existing)
  7. "sunrun solar contract cancellation" → 8,473 impr, pos 9.0 (BIGGEST OPPORTUNITY)

═══ CITY PAGES AVAILABLE FOR INTERNAL LINKING ═══
  /cancel-solar-contract/phoenix-az
  /cancel-solar-contract/houston-tx
  /cancel-solar-contract/dallas-tx
  /cancel-solar-contract/los-angeles-ca
  /cancel-solar-contract/las-vegas-nv
  /cancel-solar-contract/denver-co
  /cancel-solar-contract/san-antonio-tx
  /cancel-solar-contract/jacksonville-fl
  /cancel-solar-contract/tampa-fl
  /cancel-solar-contract/orlando-fl`;
}
