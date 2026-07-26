/**
 * Content Agent
 * Writes SEO-optimized articles, generates content briefs,
 * and manages the content pipeline from idea to draft.
 */

import {
  agentLLM,
  startRun,
  completeRun,
  sendMessage,
  createAction,
  getUnreadMessages,
  markMessageActedOn,
  type AgentRunContext,
  type AgentThinkResult,
} from "./engine";
import { getDb } from "../db";
import { contentPipeline, blogPosts } from "../../drizzle/schema";
import { desc, eq, sql } from "drizzle-orm";

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the Content Agent for Solar Freedom (breakyoursolarcontract.com).

CONTEXT:
- Solar Freedom helps homeowners escape predatory solar contracts
- We are NOT attorneys — we are "consumer protection advocates" and "case specialists"
- Revenue comes from connecting leads with law firms
- Phone: (904) 921-4971
- Currently recovering from Google penalty — need high-quality, original content

CONTENT RULES:
1. NEVER claim to be attorneys or a law firm
2. Use "consumer protection advocates" and "case specialists"
3. Always include CTA with phone (904) 921-4971
4. Include links to city pages (e.g., /cancel-solar-contract/phoenix-az)
5. Include links to related blog articles
6. Write in empathetic but authoritative tone
7. Target distressed homeowners searching for help
8. Minimum 2000 words for blog articles
9. Include FAQ section with 5-8 questions
10. Use proper H2/H3 heading structure
11. NEVER reference cancelyoursolar.co (dead domain)
12. NEVER use phone number 214-529-1631 (wrong number)

YOUR JOB:
Check your inbox for content directives from SEO Intel and Money-Making agents.
If you have directives, create content briefs and draft outlines.
If no directives, identify content gaps based on existing articles and create new briefs.

OUTPUT FORMAT (JSON):
{
  "analysis": "What you decided to work on and why",
  "contentItems": [
    {
      "title": "Article title",
      "slug": "url-slug",
      "contentType": "blog_article|medium_article|press_release",
      "targetKeyword": "primary keyword",
      "secondaryKeywords": ["kw1", "kw2"],
      "outline": "H2 and H3 structure as markdown",
      "estimatedWordCount": 2500,
      "priority": "p1|p2|p3"
    }
  ],
  "messages": [
    {
      "toAgent": "editor|manager|seo_intel",
      "type": "report|info",
      "subject": "Subject",
      "body": "Message"
    }
  ]
}`;

// ─── Main Execution ───────────────────────────────────────────────────────────

export async function runContentAgent(
  triggerType: "cron" | "manual" | "directive" | "event" = "cron",
  triggeredBy: string = "system"
): Promise<AgentThinkResult> {
  const context = await startRun("content", triggerType, triggeredBy);

  try {
    // 1. Gather state
    const state = await gatherState();

    // 2. Check inbox for directives
    const inbox = await getUnreadMessages("content");
    const inboxSummary = inbox.length > 0
      ? `\n\nINBOX (${inbox.length} directives):\n${inbox.map(m => `- [${m.type}] from ${m.fromAgent}: ${m.subject}\n  ${m.body?.substring(0, 300)}`).join("\n")}`
      : "\n\nINBOX: Empty — identify content gaps on your own.";

    // 3. Think
    const response = await agentLLM({
      agentSlug: "content",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `CURRENT STATE:\n${state}${inboxSummary}\n\nCreate content briefs and outlines.` },
      ],
      context,
      temperature: 0.6,
      maxTokens: 4000,
    });

    // 4. Parse
    let parsed: any;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { analysis: response, contentItems: [], messages: [] };
    } catch {
      parsed = { analysis: response, contentItems: [], messages: [] };
    }

    // 5. Create content pipeline items
    const db = await getDb();
    if (db) {
      for (const item of (parsed.contentItems || [])) {
        await db.insert(contentPipeline).values({
          title: item.title,
          slug: item.slug,
          contentType: item.contentType || "blog_article",
          stage: "idea",
          targetKeyword: item.targetKeyword,
          secondaryKeywords: JSON.stringify(item.secondaryKeywords || []),
          outline: item.outline,
          wordCount: item.estimatedWordCount || 2500,
          assignedTo: "content",
        });
        context.actionsCreated++;
      }
    }

    // 6. Send messages
    for (const msg of (parsed.messages || [])) {
      await sendMessage({
        fromAgent: "content",
        toAgent: msg.toAgent,
        type: msg.type || "report",
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

    const summary = parsed.analysis || "Content planning cycle completed";
    await completeRun(context, summary);
    return { summary, actionsCreated: context.actionsCreated, messagesCreated: context.messagesCreated };

  } catch (error: any) {
    await completeRun(context, `Error: ${error.message}`, "failed", error.message);
    throw error;
  }
}

// ─── State Gathering ──────────────────────────────────────────────────────────

async function gatherState(): Promise<string> {
  const db = await getDb();
  if (!db) return "Database unavailable";

  // Get pipeline items
  const pipeline = await db.select().from(contentPipeline)
    .orderBy(desc(contentPipeline.updatedAt))
    .limit(15);

  // Get recent blog posts
  const posts = await db.select({
    id: blogPosts.id,
    title: blogPosts.title,
    slug: blogPosts.slug,
    publishedAt: blogPosts.publishedAt,
  }).from(blogPosts)
    .where(eq(blogPosts.published, 1))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(20);

  const byStage = {
    idea: pipeline.filter(p => p.stage === "idea").length,
    researching: pipeline.filter(p => p.stage === "researching").length,
    outlined: pipeline.filter(p => p.stage === "outlined").length,
    drafting: pipeline.filter(p => p.stage === "drafting").length,
    draft_complete: pipeline.filter(p => p.stage === "draft_complete").length,
    in_review: pipeline.filter(p => p.stage === "in_review").length,
    approved: pipeline.filter(p => p.stage === "approved").length,
    published: pipeline.filter(p => p.stage === "published").length,
  };

  return `CONTENT PIPELINE:
- Ideas: ${byStage.idea}
- Researching: ${byStage.researching}
- Outlined: ${byStage.outlined}
- Drafting: ${byStage.drafting}
- Draft Complete: ${byStage.draft_complete}
- In Review: ${byStage.in_review}
- Approved: ${byStage.approved}
- Published: ${byStage.published}

RECENT PIPELINE ITEMS:
${pipeline.slice(0, 8).map(p => `- [${p.stage}] "${p.title}" (${p.contentType}, keyword: ${p.targetKeyword || "none"})`).join("\n") || "Empty pipeline"}

PUBLISHED ARTICLES (${posts.length} total):
${posts.slice(0, 15).map(p => `- ${p.slug}`).join("\n")}

KNOWN KEYWORD GAPS (from SEO Intel):
- "cancel sunrun contract california" (234 impr, pos 31 — NO article)
- "how to get out of sunrun contract" (160 impr, pos 17.5)
- "sunrun cancellation" (130 impr, pos 30.8)
- "cancel sunrun before installation" (119 impr, pos 15.6)
- "solar cancellation california" (91 impr, pos 31.5)

CITY PAGES AVAILABLE FOR INTERNAL LINKING:
phoenix-az, houston-tx, dallas-tx, los-angeles-ca, las-vegas-nv, denver-co, san-antonio-tx, jacksonville-fl, tampa-fl, orlando-fl`;
}
