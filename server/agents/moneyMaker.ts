/**
 * Money-Making Agent
 * Discovers attorney prospects, scores revenue opportunities,
 * and identifies the highest-value actions for business growth.
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
import { attorneyProspects, revenueTracker, lawFirms } from "../../drizzle/schema";
import { desc, eq, sql } from "drizzle-orm";

// ─── Agent System Prompt ──────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the Money-Making Agent for Solar Freedom (breakyoursolarcontract.com).

CONTEXT:
- Solar Freedom generates leads from homeowners wanting to cancel predatory solar contracts
- Revenue comes from connecting these leads with consumer protection attorneys
- Business model: law firms pay $500/mo listing fee + pay-per-lead/call
- Current metrics: ~220 leads/month from Facebook, 89 appointments booked, $130K invoiced

YOUR JOB:
Analyze the current state of attorney prospects and revenue, then recommend the highest-value actions.

OUTPUT FORMAT (JSON):
{
  "analysis": "Brief analysis of current state",
  "actions": [
    {
      "priority": "p1|p2|p3|p4|p5",
      "title": "Action title",
      "description": "What to do and why",
      "actionType": "research_firm|score_prospect|recommend_outreach|content_directive|revenue_optimization",
      "estimatedRevenue": "$X/month potential"
    }
  ],
  "messages": [
    {
      "toAgent": "content|seo_intel|manager",
      "type": "directive|report|info",
      "subject": "Message subject",
      "body": "Full message content"
    }
  ]
}`;

// ─── Main Execution ───────────────────────────────────────────────────────────

export async function runMoneyMaker(
  triggerType: "cron" | "manual" | "directive" | "event" = "cron",
  triggeredBy: string = "system"
): Promise<AgentThinkResult> {
  const context = await startRun("money_maker", triggerType, triggeredBy);

  try {
    // 1. Gather current state
    const state = await gatherState();

    // 2. Check inbox for directives
    const inbox = await getUnreadMessages("money_maker");
    const inboxSummary = inbox.length > 0
      ? `\n\nINBOX (${inbox.length} messages):\n${inbox.map(m => `- [${m.type}] from ${m.fromAgent}: ${m.subject}`).join("\n")}`
      : "";

    // 3. Think
    const response = await agentLLM({
      agentSlug: "money_maker",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `CURRENT STATE:\n${state}${inboxSummary}\n\nAnalyze and recommend actions.` },
      ],
      context,
      temperature: 0.4,
      maxTokens: 3000,
    });

    // 4. Parse and execute
    let parsed: any;
    try {
      // Extract JSON from response (may be wrapped in markdown code blocks)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { analysis: response, actions: [], messages: [] };
    } catch {
      parsed = { analysis: response, actions: [], messages: [] };
    }

    // 5. Create actions
    for (const action of (parsed.actions || [])) {
      await createAction({
        agentSlug: "money_maker",
        priority: action.priority || "p3",
        title: action.title,
        description: action.description,
        actionType: action.actionType || "revenue_optimization",
        payload: JSON.stringify({ estimatedRevenue: action.estimatedRevenue }),
        requiresApproval: action.priority === "p1" ? 1 : 0,
      });
      context.actionsCreated++;
    }

    // 6. Send messages to other agents
    for (const msg of (parsed.messages || [])) {
      await sendMessage({
        fromAgent: "money_maker",
        toAgent: msg.toAgent,
        type: msg.type || "directive",
        priority: "p3",
        subject: msg.subject,
        body: msg.body,
      });
      context.messagesCreated++;
    }

    // 7. Mark inbox messages as acted on
    for (const m of inbox) {
      await markMessageActedOn(m.id);
    }

    const summary = parsed.analysis || "Completed analysis cycle";
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

  const prospects = await db.select().from(attorneyProspects)
    .orderBy(desc(attorneyProspects.overallScore))
    .limit(10);

  const revenue = await db.select().from(revenueTracker)
    .orderBy(desc(revenueTracker.createdAt))
    .limit(10);

  const firms = await db.select().from(lawFirms).limit(10);

  const totalRevenue = revenue.reduce((sum, r) => sum + parseFloat(String(r.amount)), 0);
  const paidRevenue = revenue.filter(r => r.status === "paid").reduce((sum, r) => sum + parseFloat(String(r.amount)), 0);

  return `ATTORNEY PROSPECTS: ${prospects.length} in database (top score: ${prospects[0]?.overallScore ?? 0})
Top prospects: ${prospects.slice(0, 5).map(p => `${p.firmName} (score: ${p.overallScore}, status: ${p.outreachStatus})`).join(", ")}

SIGNED LAW FIRMS: ${firms.length} active
Firms: ${firms.map(f => f.name).join(", ") || "None yet"}

REVENUE: $${totalRevenue.toFixed(0)} total, $${paidRevenue.toFixed(0)} collected
Recent: ${revenue.slice(0, 3).map(r => `$${r.amount} (${r.status}) - ${r.source}`).join(", ") || "No revenue tracked yet"}

BUSINESS METRICS:
- ~220 leads/month from Facebook ads
- 89 appointments booked (40.5% conversion)
- $130K invoiced, $0 collected (payment collection issue)
- Phone: (904) 921-4971
- Site: breakyoursolarcontract.com`;
}
