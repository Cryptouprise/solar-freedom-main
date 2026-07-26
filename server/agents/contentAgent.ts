/**
 * Content Agent — Solar Freedom
 *
 * ONE JOB: Write content that ranks, converts, and makes money.
 *
 * Every article this agent writes must:
 * 1. Rank on Google for a keyword that distressed homeowners search
 * 2. Convert those visitors into leads via the form/phone CTA
 * 3. Build authority that helps OTHER articles rank too
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
import { contentPipeline, blogPosts } from "../../drizzle/schema";
import { desc, eq, and, ne } from "drizzle-orm";

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the Content Agent for Solar Freedom (breakyoursolarcontract.com).

═══════════════════════════════════════════════════════════
MISSION: WRITE CONTENT THAT RANKS #1 AND CONVERTS LEADS.
Every article is a 24/7 salesperson. Make it count.
═══════════════════════════════════════════════════════════

BRAND IDENTITY:
- We are Solar Freedom — consumer protection advocates, NOT attorneys
- We help homeowners escape predatory solar contracts
- We connect them with consumer protection attorneys who fight for them
- Phone: (904) 921-4971 | AI Assistant: Grace Silver
- Site: breakyoursolarcontract.com

HARD COMPLIANCE RULES (NEVER VIOLATE):
✗ NEVER claim to be attorneys or a law firm
✗ NEVER fabricate testimonials, reviews, or case results
✗ NEVER use phone number 214-529-1631 (old number — WRONG)
✗ NEVER reference cancelyoursolar.co (dead domain)
✗ NEVER make specific legal guarantees ("you WILL win your case")
✓ USE: "consumer protection advocates", "case specialists", "we connect you with attorneys"
✓ USE: "may have legal options", "could qualify", "our attorneys may be able to help"

CONTENT FORMULA FOR MAXIMUM RANKINGS + CONVERSIONS:

ARTICLE STRUCTURE (2,500–3,500 words):
1. HOOK (150 words): Lead with the homeowner's pain. "You're paying $200/month for solar that doesn't work and you feel trapped. You're not alone — and you're not stuck."
2. PROBLEM VALIDATION (300 words): Validate their specific problem with data. Name the company. Cite real complaints (BBB, CFPB, state AG).
3. LEGAL RIGHTS SECTION (500 words): State-specific consumer protection laws. FTC Act. DTPA. Rescission rights. Be specific — this is what Google rewards.
4. COMPANY-SPECIFIC TACTICS (400 words): What works for THIS specific company. Their known weaknesses. Their complaint history.
5. STEP-BY-STEP PROCESS (400 words): Exactly what to do. Numbered list. Actionable.
6. CTA #1 — INLINE (mid-article): "If you're dealing with [company], our case specialists have helped hundreds of homeowners in your exact situation. Call (904) 921-4971 or fill out the form below for a free 15-minute case review."
7. FAQ SECTION (500 words): 6–8 questions that people actually search. Include the exact question as H3.
8. CITY/STATE INTERNAL LINKS (100 words): "If you're in [state], see our guide: [link to city page]"
9. CTA #2 — CLOSING (200 words): Strong close. Urgency without fear-mongering. "Solar contracts have statute of limitations. The longer you wait, the fewer options you have."

KEYWORD INTEGRATION:
- Primary keyword: use in H1, first 100 words, one H2, meta description
- Secondary keywords: use naturally in H2s and body text
- LSI keywords: related terms that signal topical authority to Google
- Avoid keyword stuffing — Google detects it and penalizes

E-E-A-T SIGNALS (Google's quality criteria):
- Experience: "We've reviewed hundreds of solar contracts"
- Expertise: Cite specific laws (Cal. Civ. Code § 1689, DTPA § 17.46)
- Authoritativeness: Link to BBB, CFPB, state AG complaint databases
- Trustworthiness: No exaggerated claims, cite sources, include disclaimer

INTERNAL LINKING REQUIREMENTS:
- Link to 2–3 related blog articles
- Link to 2 city pages relevant to the article's geography
- Link to homepage with anchor text "solar contract help"

CITY PAGES FOR INTERNAL LINKING:
/cancel-solar-contract/phoenix-az | /cancel-solar-contract/houston-tx
/cancel-solar-contract/dallas-tx | /cancel-solar-contract/los-angeles-ca
/cancel-solar-contract/las-vegas-nv | /cancel-solar-contract/denver-co
/cancel-solar-contract/san-antonio-tx | /cancel-solar-contract/jacksonville-fl
/cancel-solar-contract/tampa-fl | /cancel-solar-contract/orlando-fl

WHEN WRITING FULL DRAFTS:
- Write the complete article, not just an outline
- Use real company names, real complaint statistics, real laws
- Every H2 should be a question or contain the keyword
- The FAQ section H3s should be exact search queries people type
- End every article with the "From Trapped to Free" CTA section

OUTPUT FORMAT — respond ONLY with valid JSON, no markdown:
{
  "analysis": "What you worked on and why — be specific about revenue impact",
  "contentItems": [
    {
      "title": "Exact article title (include year if relevant)",
      "slug": "url-slug-with-hyphens",
      "contentType": "blog_article|medium_article|press_release|city_page",
      "targetKeyword": "primary keyword exact match",
      "secondaryKeywords": ["kw1", "kw2", "kw3", "kw4"],
      "searchVolume": 0,
      "searchIntent": "informational|transactional|navigational",
      "outline": "Full H2/H3 structure with brief notes on each section",
      "draft": "FULL ARTICLE DRAFT — write the complete article here if this is a p1 item",
      "estimatedWordCount": 2500,
      "estimatedMonthlyTraffic": 0,
      "estimatedLeadsPerMonth": 0,
      "revenueJustification": "Why this article makes money",
      "priority": "p1|p2|p3",
      "internalLinks": ["/blog/related", "/cancel-solar-contract/city-state"]
    }
  ],
  "messages": [
    {
      "toAgent": "editor|manager|seo_intel",
      "type": "report|info|directive",
      "subject": "Specific subject",
      "body": "Detailed message"
    }
  ]
}

IMPORTANT: For P1 items, write the FULL DRAFT in the "draft" field. For P2/P3, write the outline only.`;

// ─── Main Execution ───────────────────────────────────────────────────────────

export async function runContentAgent(
  triggerType: "cron" | "manual" | "directive" | "event" = "cron",
  triggeredBy: string = "system"
): Promise<AgentThinkResult> {
  const context = await startRun("content", triggerType, triggeredBy);

  try {
    // 1. Gather state
    const state = await gatherContentState();

    // 2. Check inbox for directives (from SEO Intel and Money Maker)
    const inbox = await getUnreadMessages("content");
    const inboxSummary = inbox.length > 0
      ? `\n\n═══ INBOX — DIRECTIVES TO EXECUTE (${inbox.length}) ═══\n${inbox.map(m =>
          `FROM: ${m.fromAgent} | PRIORITY: ${m.priority} | SUBJECT: ${m.subject}\n${m.body?.substring(0, 600)}`
        ).join("\n---\n")}`
      : "\n\n═══ INBOX: EMPTY ═══\nNo directives received. Identify the highest-value content gap from the state data and create a P1 brief for it.";

    // 3. Think — write actual content
    const response = await agentLLM({
      agentSlug: "content",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `CURRENT CONTENT STATE:\n${state}${inboxSummary}\n\nExecute your directives. For any P1 item, write the FULL article draft. For P2/P3, write the detailed outline. Every piece of content must be tied to a revenue outcome. What article, if published today, would generate the most leads in the next 30 days?`,
        },
      ],
      context,
      temperature: 0.5,
      maxTokens: 8000,
    });

    // 4. Parse
    let parsed: {
      analysis?: string;
      contentItems?: Array<{
        title: string;
        slug: string;
        contentType: string;
        targetKeyword: string;
        secondaryKeywords: string[];
        searchVolume?: number;
        searchIntent?: string;
        outline: string;
        draft?: string;
        estimatedWordCount?: number;
        estimatedMonthlyTraffic?: number;
        estimatedLeadsPerMonth?: number;
        revenueJustification?: string;
        priority: string;
        internalLinks?: string[];
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

    // 5. Create/update content pipeline items
    if (db) {
      for (const item of (parsed.contentItems || [])) {
        // Check if already exists
        const [existing] = await db.select({ id: contentPipeline.id })
          .from(contentPipeline)
          .where(eq(contentPipeline.targetKeyword, item.targetKeyword))
          .limit(1);

        if (existing) {
          // Update with new draft if we have one
          await db.update(contentPipeline).set({
            outline: item.outline || undefined,
            draft: item.draft || undefined,
            stage: item.draft ? "draft_complete" : "outlined",
            wordCount: item.estimatedWordCount,
            revenueJustification: item.revenueJustification,
            estimatedMonthlyTraffic: item.estimatedMonthlyTraffic,
            estimatedLeadsPerMonth: item.estimatedLeadsPerMonth,
            updatedAt: new Date(),
          }).where(eq(contentPipeline.id, existing.id));
        } else {
          await db.insert(contentPipeline).values({
            title: item.title,
            slug: item.slug,
            contentType: (item.contentType as any) || "blog_article",
            stage: item.draft ? "draft_complete" : "outlined",
            targetKeyword: item.targetKeyword,
            secondaryKeywords: JSON.stringify(item.secondaryKeywords || []),
            searchVolume: item.searchVolume,
            searchIntent: item.searchIntent,
            outline: item.outline,
            draft: item.draft,
            wordCount: item.estimatedWordCount || 2500,
            requestedBy: "seo_intel",
            assignedTo: "content",
            revenueJustification: item.revenueJustification,
            estimatedMonthlyTraffic: item.estimatedMonthlyTraffic,
            estimatedLeadsPerMonth: item.estimatedLeadsPerMonth,
          });
        }
        context.actionsCreated++;

        // Notify editor if draft is complete
        if (item.draft) {
          await sendMessage({
            fromAgent: "content",
            toAgent: "editor",
            type: "report",
            priority: (item.priority as any) || "p2",
            subject: `[DRAFT READY] "${item.title}"`,
            body: `Draft complete for: "${item.title}"\nKeyword: ${item.targetKeyword}\nEstimated traffic: ${item.estimatedMonthlyTraffic || "?"}/mo\nEstimated leads: ${item.estimatedLeadsPerMonth || "?"}/mo\nRevenue justification: ${item.revenueJustification || "N/A"}\n\nPlease review and score.`,
          });
          context.messagesCreated++;
        }
      }
    }

    // 6. Send other messages
    for (const msg of (parsed.messages || [])) {
      await sendMessage({
        fromAgent: "content",
        toAgent: msg.toAgent as any,
        type: (msg.type as any) || "report",
        priority: "p3",
        subject: msg.subject,
        body: msg.body,
      });
      context.messagesCreated++;
    }

    // 7. Mark inbox read
    for (const m of inbox) {
      await markMessageActedOn(m.id);
    }

    const summary = parsed.analysis || "Content creation cycle completed";
    await completeRun(context, summary);
    return { summary, actionsCreated: context.actionsCreated, messagesCreated: context.messagesCreated };

  } catch (error: any) {
    await completeRun(context, `Error: ${error.message}`, "failed", error.message);
    throw error;
  }
}

// ─── Content State Gathering ──────────────────────────────────────────────────

async function gatherContentState(): Promise<string> {
  const db = await getDb();
  if (!db) return "Database unavailable";

  const pipeline = await db.select().from(contentPipeline)
    .orderBy(desc(contentPipeline.updatedAt))
    .limit(20);

  const posts = await db.select({
    id: blogPosts.id,
    title: blogPosts.title,
    slug: blogPosts.slug,
    publishedAt: blogPosts.publishedAt,
  }).from(blogPosts)
    .where(eq(blogPosts.published, 1))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(30);

  const byStage = pipeline.reduce((acc, p) => {
    acc[p.stage] = (acc[p.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Find items ready for drafting
  const readyToDraft = pipeline.filter(p => p.stage === "outlined" || p.stage === "researching");
  const awaitingReview = pipeline.filter(p => p.stage === "draft_complete");
  const revisionNeeded = pipeline.filter(p => p.stage === "revision_needed");

  return `
═══ CONTENT PIPELINE STATUS ═══
${Object.entries(byStage).map(([stage, count]) => `  ${stage}: ${count}`).join("\n") || "  Empty pipeline"}

═══ READY TO DRAFT (${readyToDraft.length}) ═══
${readyToDraft.map(p =>
  `  [ID:${p.id}] "${p.title}" | kw: ${p.targetKeyword} | requested by: ${p.requestedBy}`
).join("\n") || "  None"}

═══ AWAITING EDITOR REVIEW (${awaitingReview.length}) ═══
${awaitingReview.map(p => `  [ID:${p.id}] "${p.title}"`).join("\n") || "  None"}

═══ NEEDS REVISION (${revisionNeeded.length}) ═══
${revisionNeeded.map(p =>
  `  [ID:${p.id}] "${p.title}" | Feedback: ${p.editorFeedback?.substring(0, 100) || "none"}`
).join("\n") || "  None"}

═══ PUBLISHED ARTICLES (${posts.length} total) ═══
${posts.slice(0, 25).map(p => `  /blog/${p.slug}`).join("\n")}

═══ KNOWN CONTENT GAPS (priority order) ═══
  P1: "cancel sunrun contract california" — 234 impr, pos 31 — NO ARTICLE
  P1: California solar cancellation hub page — no state-level CA page exists
  P2: "how to get out of sunrun contract" — 160 impr, pos 17.5 — optimize existing
  P2: "sunrun cancellation" — 130 impr, pos 30.8 — needs dedicated article
  P2: "cancel sunrun before installation" — 119 impr, pos 15.6 — rescission rights angle
  P3: "solar company went bankrupt" — common fear, no article
  P3: "solar contract transfer to new owner" — home sale blocker, high pain
  P3: "goodleap TILA violations" — legal angle, high authority signal`;
}
