/**
 * Manager Agent — Solar Freedom
 *
 * ONE JOB: Make sure the entire system is making money.
 *
 * The Manager is the CEO of the agent ecosystem. It doesn't do the work —
 * it makes sure the right work gets done, in the right order, at the right time.
 * It approves content for publishing, resolves agent conflicts, and escalates
 * revenue-critical decisions to Chase (the human owner).
 */

import {
  agentLLM,
  startRun,
  completeRun,
  sendMessage,
  createAction,
  getUnreadMessages,
  markMessageActedOn,
  getActionQueue,
  updateAction,
  getRunLog,
  listAgents,
  type AgentThinkResult,
} from "./engine";
import { getDb } from "../db";
import {
  contentPipeline,
  blogPosts,
  revenueTracker,
  lawFirms,
  agentActions,
} from "../../drizzle/schema";
import { desc, eq, and, sql } from "drizzle-orm";

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the Manager Agent for Solar Freedom (breakyoursolarcontract.com).

═══════════════════════════════════════════════════════════
MISSION: MAKE SURE THE SYSTEM IS MAKING MONEY.
You are the CEO of this agent ecosystem. Revenue is the only KPI that matters.
═══════════════════════════════════════════════════════════

BUSINESS CONTEXT:
- Solar Freedom connects distressed solar homeowners with consumer protection attorneys
- Revenue: $150–$500 per lead delivered to law firms
- Monthly leads: ~220 | Monthly booking rate: 40.5%
- CRITICAL ISSUE: $130K invoiced, $0 collected — this is your #1 priority
- Site recovering from Google penalty — content quality is existential
- Owner: Chase | Phone: (904) 921-4971

YOUR DECISION FRAMEWORK:

CONTENT PUBLISHING DECISIONS:
- Editor approved (SEO ≥ 75, E-E-A-T ≥ 70, Duplicate Risk ≤ 30) → AUTO-APPROVE, publish immediately
- Editor approved but scores borderline → Review draft yourself before approving
- Editor rejected → Trust the Editor, confirm rejection
- Content about legal claims or specific attorney results → ESCALATE to Chase

REVENUE DECISIONS:
- New law firm ready to pitch → APPROVE outreach, send Money Maker directive
- Lead delivery failures → P1 action, fix immediately
- Unbilled delivered leads → P1 action, bill immediately
- Revenue gap > $10K → ESCALATE to Chase with specific plan
- New exclusive territory deal > $2,000/mo → ESCALATE to Chase for approval

AGENT HEALTH DECISIONS:
- Agent hasn't run in 2× its scheduled interval → P1 alert
- Agent error rate > 20% → P1 alert, investigate
- Action queue growing without resolution → Investigate bottleneck
- Agents sending conflicting directives → Resolve based on revenue impact

ESCALATION TO CHASE (create P1 action with requiresApproval=1):
- Any decision involving > $5,000 in revenue
- Legal claims or attorney representation language in content
- Payment processing or billing disputes
- Content that could be defamatory
- Agent system errors that can't be auto-resolved
- New law firm partnership terms

DAILY REVENUE REPORT (send to Chase every morning):
- Total leads in last 24h
- Total revenue collected vs invoiced
- Top performing content (by leads generated)
- Agent system health summary
- Top 3 actions Chase needs to take today

PUBLISHING WORKFLOW:
When you approve content for publishing, create a P1 action with:
- title: "[PUBLISH] [Article Title]"
- description: Full article content + SEO metadata
- actionType: "publish_content"
- requiresApproval: 0 (auto-publish if Editor already approved)

OUTPUT FORMAT — respond ONLY with valid JSON, no markdown:
{
  "analysis": "2-3 sentence executive summary: revenue state, system health, top priority",
  "decisions": [
    {
      "actionId": 0,
      "decision": "approve|reject|escalate",
      "reason": "Specific reason — reference data, not opinions"
    }
  ],
  "publishApprovals": [
    {
      "pipelineId": 0,
      "title": "Article title",
      "decision": "publish|hold|reject",
      "reason": "Why"
    }
  ],
  "healthIssues": [
    {
      "agent": "agent_slug",
      "issue": "What's wrong",
      "severity": "critical|warning|info",
      "recommendation": "Specific fix"
    }
  ],
  "revenueActions": [
    {
      "priority": "p1|p2|p3",
      "title": "Specific revenue action",
      "description": "Exactly what to do",
      "estimatedImpact": "$X",
      "requiresChase": false
    }
  ],
  "messages": [
    {
      "toAgent": "money_maker|seo_intel|content|editor",
      "type": "directive|info",
      "subject": "Specific subject",
      "body": "Detailed message with specific instructions"
    }
  ]
}`;

// ─── Main Execution ───────────────────────────────────────────────────────────

export async function runManagerAgent(
  triggerType: "cron" | "manual" | "directive" | "event" = "cron",
  triggeredBy: string = "system"
): Promise<AgentThinkResult> {
  const context = await startRun("manager", triggerType, triggeredBy);

  try {
    // 1. Gather full system state
    const state = await gatherSystemState();

    // 2. Check inbox
    const inbox = await getUnreadMessages("manager");
    const inboxSummary = inbox.length > 0
      ? `\n\n═══ INBOX (${inbox.length} messages) ═══\n${inbox.map(m =>
          `FROM: ${m.fromAgent} | TYPE: ${m.type} | SUBJECT: ${m.subject}\n${m.body?.substring(0, 500)}`
        ).join("\n---\n")}`
      : "";

    // 3. Get pending approval actions
    const pendingActions = await getActionQueue({ status: "queued" });
    const approvalNeeded = pendingActions.filter(a => a.requiresApproval === 1);

    const approvalContext = approvalNeeded.length > 0
      ? `\n\n═══ ACTIONS AWAITING YOUR DECISION (${approvalNeeded.length}) ═══\n${approvalNeeded.map(a =>
          `[ID:${a.id}] [${a.priority.toUpperCase()}] ${a.agentSlug}: ${a.title}\n${a.description?.substring(0, 300)}`
        ).join("\n---\n")}`
      : "";

    // 4. Get content approved by editor, awaiting manager publish decision
    const db = await getDb();
    const awaitingPublish = db ? await db.select().from(contentPipeline)
      .where(eq(contentPipeline.stage, "approved"))
      .orderBy(desc(contentPipeline.updatedAt))
      .limit(5) : [];

    const publishContext = awaitingPublish.length > 0
      ? `\n\n═══ CONTENT AWAITING PUBLISH DECISION (${awaitingPublish.length}) ═══\n${awaitingPublish.map(p =>
          `[ID:${p.id}] "${p.title}"\nKeyword: ${p.targetKeyword} | SEO: ${p.seoScore}/100 | E-E-A-T: ${p.eatScore}/100 | Duplicate Risk: ${p.duplicateRisk}/100\nRevenue: ${p.revenueJustification?.substring(0, 150)}`
        ).join("\n---\n")}`
      : "";

    // 5. Think — use best model for final decisions
    const response = await agentLLM({
      agentSlug: "manager",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `SYSTEM STATE:\n${state}${inboxSummary}${approvalContext}${publishContext}\n\nReview the system. Make decisions. Approve content that's ready. Escalate what needs Chase. Send directives to agents that are underperforming. What is the #1 thing that will make the most money in the next 7 days?`,
        },
      ],
      context,
      temperature: 0.2,
      maxTokens: 6000,
    });

    // 6. Parse
    let parsed: {
      analysis?: string;
      decisions?: Array<{ actionId: number; decision: string; reason: string }>;
      publishApprovals?: Array<{ pipelineId: number; title: string; decision: string; reason: string }>;
      healthIssues?: Array<{ agent: string; issue: string; severity: string; recommendation: string }>;
      revenueActions?: Array<{ priority: string; title: string; description: string; estimatedImpact: string; requiresChase: boolean }>;
      messages?: Array<{ toAgent: string; type: string; subject: string; body: string }>;
    } = {};

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      parsed = { analysis: response };
    }

    // 7. Apply action decisions
    for (const decision of (parsed.decisions || [])) {
      if (!decision.actionId) continue;
      const newStatus = decision.decision === "approve" ? "approved"
        : decision.decision === "reject" ? "rejected"
        : "escalated";

      await updateAction(decision.actionId, {
        status: newStatus,
        approvedBy: "manager",
        approvedAt: new Date(),
        result: decision.reason,
      });
      context.actionsCreated++;
    }

    // 8. Handle publish approvals
    if (db) {
      for (const pub of (parsed.publishApprovals || [])) {
        if (!pub.pipelineId) continue;

        if (pub.decision === "publish") {
          // Mark as published in pipeline
          await db.update(contentPipeline).set({
            stage: "published",
            approvedBy: "manager",
            managerFeedback: pub.reason,
            publishedAt: new Date(),
            updatedAt: new Date(),
          }).where(eq(contentPipeline.id, pub.pipelineId));

          // Create a P1 publish action for the human/system to execute
          await createAction({
            agentSlug: "manager",
            priority: "p1",
            title: `[PUBLISH NOW] ${pub.title}`,
            description: `Manager approved for immediate publishing.\n\nReason: ${pub.reason}\n\nContent pipeline ID: ${pub.pipelineId}`,
            actionType: "publish_content",
            requiresApproval: 0,
            payload: JSON.stringify({ pipelineId: pub.pipelineId }),
          });
          context.actionsCreated++;
        } else if (pub.decision === "hold") {
          await db.update(contentPipeline).set({
            stage: "revision_needed",
            managerFeedback: `Manager hold: ${pub.reason}`,
            updatedAt: new Date(),
          }).where(eq(contentPipeline.id, pub.pipelineId));
        }
      }
    }

    // 9. Create revenue actions
    for (const action of (parsed.revenueActions || [])) {
      await createAction({
        agentSlug: "manager",
        priority: (action.priority as any) || "p2",
        title: action.title,
        description: `${action.description}\n\nEstimated Impact: ${action.estimatedImpact}`,
        actionType: "revenue_optimization",
        requiresApproval: action.requiresChase ? 1 : 0,
      });
      context.actionsCreated++;
    }

    // 10. Create escalations for critical health issues
    for (const issue of (parsed.healthIssues || [])) {
      if (issue.severity === "critical") {
        await createAction({
          agentSlug: "manager",
          priority: "p1",
          title: `[SYSTEM ALERT] ${issue.agent}: ${issue.issue}`,
          description: `Agent: ${issue.agent}\nIssue: ${issue.issue}\nRecommendation: ${issue.recommendation}`,
          actionType: "escalation",
          requiresApproval: 1,
        });
        context.actionsCreated++;
      }
    }

    // 11. Send messages to agents
    for (const msg of (parsed.messages || [])) {
      await sendMessage({
        fromAgent: "manager",
        toAgent: msg.toAgent as any,
        type: (msg.type as any) || "directive",
        priority: "p2",
        subject: msg.subject,
        body: msg.body,
      });
      context.messagesCreated++;
    }

    // 12. Mark inbox read
    for (const m of inbox) {
      await markMessageActedOn(m.id);
    }

    const summary = parsed.analysis || "System oversight cycle completed";
    await completeRun(context, summary);
    return { summary, actionsCreated: context.actionsCreated, messagesCreated: context.messagesCreated };

  } catch (error: any) {
    await completeRun(context, `Error: ${error.message}`, "failed", error.message);
    throw error;
  }
}

// ─── System State Gathering ───────────────────────────────────────────────────

async function gatherSystemState(): Promise<string> {
  const db = await getDb();

  // Agent health
  const agentList = await listAgents();
  const agentHealth = agentList.map(a => {
    const lastRun = a.lastRunAt ? new Date(a.lastRunAt).toISOString() : "NEVER";
    const minutesSince = a.lastRunAt
      ? Math.round((Date.now() - new Date(a.lastRunAt).getTime()) / 60000)
      : null;
    return `  ${a.name} (${a.slug}): status=${a.status} | lastRun=${lastRun} (${minutesSince ? minutesSince + "min ago" : "never"}) | totalRuns=${a.totalRuns}`;
  }).join("\n");

  // Recent runs
  const recentRuns = await getRunLog(undefined, 15);
  const runSummary = recentRuns.map(r => {
    const duration = r.durationMs ? `${(r.durationMs / 1000).toFixed(1)}s` : "?";
    const status = r.status === "failed" ? "❌ FAILED" : r.status === "completed" ? "✓" : r.status;
    return `  ${status} ${r.agentSlug} [${duration}]: ${r.summary?.substring(0, 100) || "no summary"}`;
  }).join("\n");

  // Action queue stats
  const allActions = await getActionQueue({ limit: 100 });
  const p1Actions = allActions.filter(a => a.priority === "p1" && a.status === "queued");
  const needsApproval = allActions.filter(a => a.requiresApproval === 1 && a.status === "queued");

  // Revenue state
  let revenueState = "Database unavailable";
  let contentState = "Database unavailable";

  if (db) {
    const revenue = await db.select().from(revenueTracker)
      .orderBy(desc(revenueTracker.createdAt))
      .limit(20);

    const totalInvoiced = revenue.reduce((s, r) => s + parseFloat(String(r.amount || 0)), 0);
    const totalPaid = revenue.filter(r => r.status === "paid").reduce((s, r) => s + parseFloat(String(r.amount || 0)), 0);
    const totalOverdue = revenue.filter(r => r.status === "overdue").reduce((s, r) => s + parseFloat(String(r.amount || 0)), 0);

    const firms = await db.select().from(lawFirms).where(eq(lawFirms.status, "active"));

    revenueState = `Total Invoiced: $${totalInvoiced.toFixed(0)} | Collected: $${totalPaid.toFixed(0)} | OVERDUE: $${totalOverdue.toFixed(0)} | GAP: $${(totalInvoiced - totalPaid).toFixed(0)}\nActive law firms: ${firms.length}`;

    // Content pipeline
    const pipeline = await db.select({
      stage: contentPipeline.stage,
      count: sql<number>`COUNT(*)`,
    }).from(contentPipeline)
      .groupBy(contentPipeline.stage);

    contentState = pipeline.map(p => `${p.stage}: ${p.count}`).join(" | ") || "Empty pipeline";
  }

  return `
═══ AGENT HEALTH ═══
${agentHealth || "  No agents registered yet"}

═══ RECENT RUNS (last 15) ═══
${runSummary || "  No runs recorded yet"}

═══ ACTION QUEUE ═══
  Total: ${allActions.length}
  P1 (urgent): ${p1Actions.length}
  Needs Chase Approval: ${needsApproval.length}
  Queued: ${allActions.filter(a => a.status === "queued").length}
  Approved: ${allActions.filter(a => a.status === "approved").length}
  Completed: ${allActions.filter(a => a.status === "completed").length}

${p1Actions.length > 0 ? `P1 ACTIONS:\n${p1Actions.map(a => `  [ID:${a.id}] ${a.agentSlug}: ${a.title}`).join("\n")}` : ""}

═══ REVENUE STATE ═══
${revenueState}

═══ CONTENT PIPELINE ═══
${contentState}

═══ BUSINESS CONTEXT ═══
Site: breakyoursolarcontract.com | Phone: (904) 921-4971
Owner: Chase | AI Assistant: Grace Silver
Monthly leads: ~220 | Booking rate: 40.5%
Status: Recovering from Google penalty
#1 Priority: Collect the $130K invoiced that hasn't been paid`;
}
