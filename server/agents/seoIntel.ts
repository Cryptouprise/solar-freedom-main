/**
 * SEO Intelligence Agent
 * Monitors search performance, tracks ranking changes,
 * correlates actions with outcomes, and recommends optimizations.
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
import { seoChangeLog, seoPages, blogPosts, contentPipeline } from "../../drizzle/schema";
import { desc, eq, sql } from "drizzle-orm";

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the SEO Intelligence Agent for Solar Freedom (breakyoursolarcontract.com).

CONTEXT:
- Site was hit by a Google penalty (thin content / AI content detection)
- Currently recovering — need to build authority through quality content + backlinks
- Primary keywords: "cancel solar contract", "get out of solar contract", "sunrun cancellation"
- Top traffic pages: GoodLeap cancellation guide, Sunrun contract cancellation, NJ solar rights
- Biggest opportunity: California + Sunrun keywords (234 impressions, position 31)

YOUR JOB:
Analyze SEO data, identify opportunities and threats, and recommend actions.

OUTPUT FORMAT (JSON):
{
  "analysis": "Brief analysis of current SEO state",
  "opportunities": [
    {
      "keyword": "target keyword",
      "currentPosition": 0,
      "impressions": 0,
      "action": "what to do",
      "priority": "p1|p2|p3"
    }
  ],
  "threats": [
    {
      "issue": "what's wrong",
      "impact": "high|medium|low",
      "fix": "recommended fix"
    }
  ],
  "actions": [
    {
      "priority": "p1|p2|p3|p4|p5",
      "title": "Action title",
      "description": "What to do",
      "actionType": "content_gap|meta_fix|internal_link|backlink_needed|technical_fix"
    }
  ],
  "messages": [
    {
      "toAgent": "content|money_maker|manager",
      "type": "directive|report|info",
      "subject": "Subject",
      "body": "Full message"
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
    const state = await gatherState();

    // 2. Check inbox
    const inbox = await getUnreadMessages("seo_intel");
    const inboxSummary = inbox.length > 0
      ? `\n\nINBOX (${inbox.length} messages):\n${inbox.map(m => `- [${m.type}] from ${m.fromAgent}: ${m.subject}\n  ${m.body?.substring(0, 200)}`).join("\n")}`
      : "";

    // 3. Think
    const response = await agentLLM({
      agentSlug: "seo_intel",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `CURRENT SEO STATE:\n${state}${inboxSummary}\n\nAnalyze and recommend actions.` },
      ],
      context,
      temperature: 0.3,
      maxTokens: 4000,
    });

    // 4. Parse
    let parsed: any;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { analysis: response, actions: [], messages: [] };
    } catch {
      parsed = { analysis: response, actions: [], messages: [] };
    }

    // 5. Create actions
    for (const action of (parsed.actions || [])) {
      await createAction({
        agentSlug: "seo_intel",
        priority: action.priority || "p3",
        title: action.title,
        description: action.description,
        actionType: action.actionType || "content_gap",
        requiresApproval: 0,
      });
      context.actionsCreated++;
    }

    // 6. Send messages
    for (const msg of (parsed.messages || [])) {
      await sendMessage({
        fromAgent: "seo_intel",
        toAgent: msg.toAgent,
        type: msg.type || "directive",
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

    const summary = parsed.analysis || "SEO analysis cycle completed";
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

  // Get tracked pages
  const pages = await db.select().from(seoPages)
    .orderBy(desc(seoPages.gscImpressions))
    .limit(20);

  // Get recent changes
  const changes = await db.select().from(seoChangeLog)
    .orderBy(desc(seoChangeLog.createdAt))
    .limit(10);

  // Get published blog posts
  const posts = await db.select({
    id: blogPosts.id,
    title: blogPosts.title,
    slug: blogPosts.slug,
    publishedAt: blogPosts.publishedAt,
  }).from(blogPosts)
    .where(eq(blogPosts.published, 1))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(15);

  // Get content pipeline items
  const pipeline = await db.select().from(contentPipeline)
    .orderBy(desc(contentPipeline.updatedAt))
    .limit(10);

  return `TRACKED PAGES (${pages.length}):
${pages.slice(0, 10).map(p => `- ${p.url}: pos ${p.gscAvgPosition ?? "?"}, ${p.gscImpressions ?? 0} impr, ${p.gscClicks ?? 0} clicks`).join("\n")}

RECENT CHANGES (${changes.length}):
${changes.slice(0, 5).map(c => `- [${c.changeType}] ${c.title}: ${c.description}`).join("\n") || "None tracked yet"}

PUBLISHED ARTICLES (${posts.length}):
${posts.slice(0, 10).map(p => `- ${p.slug} (${p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : "no date"})`).join("\n")}

CONTENT PIPELINE (${pipeline.length} items):
${pipeline.slice(0, 5).map(p => `- [${p.stage}] ${p.title}`).join("\n") || "Empty"}

KEY METRICS FROM LAST GSC PULL:
- Top page: /blog/goodleap-cancel-solar-loan-2026 (54 clicks, 4618 impressions, pos 8.2)
- #2: /blog/sunrun-solar-contract-cancellation-2026 (47 clicks, 8473 impressions, pos 9.0)
- #3: /blog/how-to-get-out-of-solar-contract (27 clicks, 3114 impressions, pos 19.7)
- Biggest gap: "cancel sunrun contract california" (234 impr, pos 31.3 — NO dedicated article)
- Recovery status: Still recovering from Google penalty (thin content flagging)`;
}
