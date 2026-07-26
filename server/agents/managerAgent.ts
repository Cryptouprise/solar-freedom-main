/**
 * Manager Agent
 * Oversight and final approval. Reviews all agent outputs,
 * resolves conflicts, ensures nothing goes live without sign-off.
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
  type AgentRunContext,
  type AgentThinkResult,
} from "./engine";
import { getDb } from "../db";
import { agentActions, agentRunLog, contentPipeline } from "../../drizzle/schema";
import { desc, eq, and } from "drizzle-orm";

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the Manager Agent for Solar Freedom (breakyoursolarcontract.com).

YOUR JOB: Oversee all other agents, provide final approval on actions, resolve conflicts, and ensure the system operates safely and profitably.

DECISION FRAMEWORK:
- Revenue impact > $1000: approve if legal and ethical
- Content publishing: approve if quality score >= 80
- Attorney outreach: approve if prospect score > 60 and pitch is professional
- Anything involving legal claims: ESCALATE to human (flag for Chase)
- Anything involving money collection: ESCALATE to human
- Conflicting agent directives: resolve based on revenue impact

ESCALATION TRIGGERS (create P1 action with requiresApproval=1):
- Legal claims or attorney representation language
- Payment processing or billing decisions
- Content that could be defamatory
- Actions costing > $50 in API spend
- Disagreements between agents that can't be resolved by data

SYSTEM HEALTH CHECKS:
- Are all agents running on schedule?
- Are there error states that need attention?
- Is the action queue growing without resolution?
- Are inter-agent messages being processed?

OUTPUT FORMAT (JSON):
{
  "analysis": "System health summary and decisions made",
  "decisions": [
    {
      "actionId": 0,
      "decision": "approve|reject|escalate",
      "reason": "Why this decision"
    }
  ],
  "healthIssues": [
    {
      "agent": "agent_slug",
      "issue": "What's wrong",
      "severity": "critical|warning|info",
      "recommendation": "What to do"
    }
  ],
  "messages": [
    {
      "toAgent": "money_maker|seo_intel|content|editor",
      "type": "directive|info",
      "subject": "Subject",
      "body": "Message"
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
    // 1. Gather system state
    const state = await gatherSystemState();

    // 2. Check inbox
    const inbox = await getUnreadMessages("manager");
    const inboxSummary = inbox.length > 0
      ? `\n\nINBOX (${inbox.length} messages):\n${inbox.map(m => `- [${m.type}] from ${m.fromAgent}: ${m.subject}\n  ${m.body?.substring(0, 200)}`).join("\n")}`
      : "";

    // 3. Get pending approval actions
    const pendingActions = await getActionQueue({ status: "queued" });
    const approvalNeeded = pendingActions.filter(a => a.requiresApproval === 1);

    const approvalContext = approvalNeeded.length > 0
      ? `\n\nACTIONS AWAITING YOUR APPROVAL (${approvalNeeded.length}):\n${approvalNeeded.map(a => `- [ID:${a.id}] [${a.priority}] ${a.agentSlug}: ${a.title}\n  ${a.description?.substring(0, 200)}`).join("\n")}`
      : "";

    // 4. Think
    const response = await agentLLM({
      agentSlug: "manager",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `SYSTEM STATE:\n${state}${inboxSummary}${approvalContext}\n\nReview system health, make decisions, and provide directives.` },
      ],
      context,
      temperature: 0.2,
      maxTokens: 3000,
    });

    // 5. Parse
    let parsed: any;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { analysis: response, decisions: [], messages: [], healthIssues: [] };
    } catch {
      parsed = { analysis: response, decisions: [], messages: [], healthIssues: [] };
    }

    // 6. Apply decisions
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

    // 7. Send messages
    for (const msg of (parsed.messages || [])) {
      await sendMessage({
        fromAgent: "manager",
        toAgent: msg.toAgent,
        type: msg.type || "directive",
        priority: "p2",
        subject: msg.subject,
        body: msg.body,
      });
      context.messagesCreated++;
    }

    // 8. Create escalation actions for health issues
    for (const issue of (parsed.healthIssues || [])) {
      if (issue.severity === "critical") {
        await createAction({
          agentSlug: "manager",
          priority: "p1",
          title: `[ESCALATE] ${issue.issue}`,
          description: `Agent: ${issue.agent}\nIssue: ${issue.issue}\nRecommendation: ${issue.recommendation}`,
          actionType: "escalation",
          requiresApproval: 1,
        });
        context.actionsCreated++;
      }
    }

    // 9. Mark inbox read
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
  // Agent health
  const agentList = await listAgents();
  const agentHealth = agentList.map(a => {
    const lastRun = a.lastRunAt ? new Date(a.lastRunAt).toISOString() : "never";
    return `- ${a.name} (${a.slug}): status=${a.status}, lastRun=${lastRun}, totalRuns=${a.totalRuns}`;
  }).join("\n");

  // Recent runs across all agents
  const recentRuns = await getRunLog(undefined, 10);
  const runSummary = recentRuns.map(r => {
    const duration = r.durationMs ? `${(r.durationMs / 1000).toFixed(1)}s` : "?";
    return `- ${r.agentSlug} [${r.status}] ${duration}: ${r.summary?.substring(0, 80) || "no summary"}`;
  }).join("\n");

  // Action queue stats
  const allActions = await getActionQueue({ limit: 100 });
  const actionStats = {
    total: allActions.length,
    queued: allActions.filter(a => a.status === "queued").length,
    approved: allActions.filter(a => a.status === "approved").length,
    rejected: allActions.filter(a => a.status === "rejected").length,
    completed: allActions.filter(a => a.status === "completed").length,
    needsApproval: allActions.filter(a => a.requiresApproval === 1 && a.status === "queued").length,
  };

  return `AGENT HEALTH:
${agentHealth || "No agents registered yet"}

RECENT RUNS (last 10):
${runSummary || "No runs recorded yet"}

ACTION QUEUE:
- Total: ${actionStats.total}
- Queued: ${actionStats.queued}
- Needs Manager Approval: ${actionStats.needsApproval}
- Approved: ${actionStats.approved}
- Rejected: ${actionStats.rejected}
- Completed: ${actionStats.completed}

SYSTEM METRICS:
- Site: breakyoursolarcontract.com
- Phone: (904) 921-4971
- Owner: Chase
- Status: Recovering from Google penalty, building authority`;
}
