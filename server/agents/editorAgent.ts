/**
 * Editor Agent
 * Quality gate for all content. Checks E-E-A-T compliance,
 * readability, duplicate risk, and SEO optimization before approval.
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
import { desc, eq, and, inArray } from "drizzle-orm";

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the Editor Agent for Solar Freedom (breakyoursolarcontract.com).

YOUR JOB: Quality-check content in the pipeline. You are the gatekeeper.

COMPLIANCE RULES (HARD REQUIREMENTS):
1. NEVER claim to be attorneys or a law firm — "consumer protection advocates" only
2. NEVER fabricate testimonials or reviews
3. Phone must be (904) 921-4971 — reject if 214-529-1631 appears
4. NEVER reference cancelyoursolar.co (dead domain)
5. Must include CTA with correct phone number
6. Must have proper H2/H3 structure
7. Must be 2000+ words for blog articles
8. Must include FAQ section
9. Must include internal links to city pages and related articles
10. No thin content — must provide genuine value and original insights

QUALITY METRICS:
- Readability: Flesch-Kincaid grade 8-10 (accessible but not dumbed down)
- Keyword density: 1-3% for primary keyword
- E-E-A-T signals: Experience markers, expertise claims backed by data, authority signals
- Uniqueness: No copy-paste from other articles on the site
- Tone: Empathetic, authoritative, slightly urgent but not fear-mongering

OUTPUT FORMAT (JSON):
{
  "analysis": "Summary of what you reviewed",
  "reviews": [
    {
      "contentId": 0,
      "title": "Article title",
      "verdict": "approve|reject|revision_needed",
      "score": 85,
      "issues": ["issue 1", "issue 2"],
      "suggestions": ["suggestion 1"],
      "compliancePass": true
    }
  ],
  "messages": [
    {
      "toAgent": "content|manager",
      "type": "report|directive",
      "subject": "Subject",
      "body": "Message"
    }
  ]
}`;

// ─── Main Execution ───────────────────────────────────────────────────────────

export async function runEditorAgent(
  triggerType: "cron" | "manual" | "directive" | "event" = "cron",
  triggeredBy: string = "system"
): Promise<AgentThinkResult> {
  const context = await startRun("editor", triggerType, triggeredBy);

  try {
    // 1. Get items awaiting review
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const reviewItems = await db.select().from(contentPipeline)
      .where(eq(contentPipeline.stage, "draft_complete"))
      .orderBy(desc(contentPipeline.updatedAt))
      .limit(5);

    // 2. Check inbox
    const inbox = await getUnreadMessages("editor");
    const inboxSummary = inbox.length > 0
      ? `\n\nINBOX (${inbox.length} messages):\n${inbox.map(m => `- [${m.type}] from ${m.fromAgent}: ${m.subject}`).join("\n")}`
      : "";

    if (reviewItems.length === 0 && inbox.length === 0) {
      const summary = "No content awaiting review. Pipeline clear.";
      await completeRun(context, summary);
      return { summary, actionsCreated: 0, messagesCreated: 0 };
    }

    // 3. Build review context
    const reviewContext = reviewItems.map(item => ({
      id: item.id,
      title: item.title,
      contentType: item.contentType,
      targetKeyword: item.targetKeyword,
      content: item.draft?.substring(0, 3000) || "No draft content available",
      outline: item.outline,
    }));

    // 4. Think
    const response = await agentLLM({
      agentSlug: "editor",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `ITEMS TO REVIEW (${reviewItems.length}):\n${JSON.stringify(reviewContext, null, 2)}${inboxSummary}\n\nReview each item and provide verdicts.` },
      ],
      context,
      temperature: 0.2,
      maxTokens: 3000,
    });

    // 5. Parse
    let parsed: any;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { analysis: response, reviews: [], messages: [] };
    } catch {
      parsed = { analysis: response, reviews: [], messages: [] };
    }

    // 6. Apply review verdicts
    for (const review of (parsed.reviews || [])) {
      if (!review.contentId) continue;
      const newStage = review.verdict === "approve" ? "approved"
        : review.verdict === "reject" ? "rejected"
        : "revision_needed";

      await db.update(contentPipeline).set({
        stage: newStage as any,
        seoScore: review.score,
        editorFeedback: JSON.stringify({ issues: review.issues, suggestions: review.suggestions }),
      }).where(eq(contentPipeline.id, review.contentId));
      context.actionsCreated++;
    }

    // 7. Send messages
    for (const msg of (parsed.messages || [])) {
      await sendMessage({
        fromAgent: "editor",
        toAgent: msg.toAgent,
        type: msg.type || "report",
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

    const summary = parsed.analysis || `Reviewed ${reviewItems.length} items`;
    await completeRun(context, summary);
    return { summary, actionsCreated: context.actionsCreated, messagesCreated: context.messagesCreated };

  } catch (error: any) {
    await completeRun(context, `Error: ${error.message}`, "failed", error.message);
    throw error;
  }
}
