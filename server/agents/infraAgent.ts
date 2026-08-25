/**
 * Infrastructure Agent
 * The system's immune system and institutional memory.
 * Runs daily at 5am UTC. Monitors all agents, logs changes,
 * sends daily cost alerts, and queues self-improvement actions.
 */

import { getDb } from "../db";
import {
  agentRunLog,
  agentHealthLog,
  systemChangeLog,
  aiCostLog,
  agents,
  contentPipeline,
} from "../../drizzle/schema";
import {
  agentLLM,
  createAction,
  startRun,
  completeRun,
} from "./engine";
import { desc, gte, eq, and, isNull } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";
import { upsertBlogDraft } from "../db";

const CALLBACK_BUDGET_MS = 25_000;

// ─── Daily Cost Alert ─────────────────────────────────────────────────────────

async function buildDailyCostAlert(): Promise<{
  totalUsd: number;
  byFeature: Record<string, number>;
  alerts: string[];
}> {
  const database = await getDb();
  if (!database) return { totalUsd: 0, byFeature: {}, alerts: [] };

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const logs = await database
    .select()
    .from(aiCostLog)
    .where(gte(aiCostLog.createdAt, yesterday));

  const byFeature: Record<string, number> = {};
  let totalUsd = 0;

  for (const log of logs) {
    const cost = parseFloat(String(log.costUsd ?? "0"));
    totalUsd += cost;
    const featureKey = log.feature ?? "unknown";
    byFeature[featureKey] = (byFeature[featureKey] ?? 0) + cost;
  }

  const alerts: string[] = [];
  if (totalUsd > 10) alerts.push(`🚨 Total spend $${totalUsd.toFixed(4)} exceeded $10 threshold`);

  return { totalUsd, byFeature, alerts };
}

// ─── System Health Check ──────────────────────────────────────────────────────

async function checkAgentHealth(): Promise<Array<{
  slug: string;
  name: string;
  lastRun: Date | null;
  lastStatus: string | null;
  consecutiveFailures: number;
  issues: string[];
}>> {
  const database = await getDb();
  if (!database) return [];

  const allAgents = await database.select().from(agents);
  const results = [];

  for (const agent of allAgents) {
    const recentRuns = await database
      .select()
      .from(agentRunLog)
      .where(eq(agentRunLog.agentSlug, agent.slug))
      .orderBy(desc(agentRunLog.startedAt))
      .limit(5);

    const issues: string[] = [];
    let consecutiveFailures = 0;

    for (const run of recentRuns) {
      const runningTooLong = run.status === "running"
        && Date.now() - new Date(run.startedAt).getTime() > CALLBACK_BUDGET_MS;
      if (run.status === "failed" || run.status === "timeout" || runningTooLong) {
        consecutiveFailures++;
      } else {
        break;
      }
    }

    if (consecutiveFailures >= 3) {
      issues.push(`${consecutiveFailures} consecutive failures — needs immediate attention`);
    }

    const lastRun = recentRuns[0] ?? null;
    if (!lastRun) {
      issues.push("Agent has never run — may not be registered");
    } else {
      if (lastRun.status === "running") {
        issues.push("Latest run is still marked running — completion was not recorded");
      }
      if (lastRun.durationMs && lastRun.durationMs > CALLBACK_BUDGET_MS) {
        issues.push(`Latest run took ${Math.round(lastRun.durationMs / 1000)}s, exceeding the 25s scheduler callback budget`);
      }
      const hoursSinceRun = (Date.now() - new Date(lastRun.startedAt).getTime()) / 3600000;
      if (hoursSinceRun > 48) {
        issues.push(`Last run was ${Math.round(hoursSinceRun)}h ago — may be stuck`);
      }
    }

    results.push({
      slug: agent.slug,
      name: agent.name,
      lastRun: lastRun ? new Date(lastRun.startedAt) : null,
      lastStatus: lastRun?.status ?? null,
      consecutiveFailures,
      issues,
    });
  }

  return results;
}

// ─── Content Pipeline Sync ────────────────────────────────────────────────────

async function syncContentPipelineToBlogs(): Promise<number> {
  const database = await getDb();
  if (!database) return 0;

  // Find approved content that hasn't been published yet
  const approved = await database
    .select()
    .from(contentPipeline)
    .where(
      and(
        eq(contentPipeline.stage, "approved"),
        isNull(contentPipeline.publishedAt)
      )
    )
    .limit(10);

  let synced = 0;
  for (const item of approved) {
    const content = item.finalContent ?? item.draft;
    if (content && item.targetKeyword) {
      const postSlug = item.slug ?? item.targetKeyword.toLowerCase().replace(/\s+/g, "-");
      await upsertBlogDraft({
        postSlug,
        name: "Agent Content Pipeline",
        content,
        targetKeyword: item.targetKeyword,
        title: item.title,
      });
      synced++;
    }
  }

  return synced;
}

// ─── Main Infrastructure Agent Run ───────────────────────────────────────────

export async function runInfraAgent(
  triggerType: "cron" | "manual" = "cron",
  triggeredBy = "heartbeat"
): Promise<{ summary: string; actionsCreated: number; messagesCreated: number }> {
  const context = await startRun("infra", triggerType, triggeredBy);

  try {
    // 1. Build daily cost report
    const costData = await buildDailyCostAlert();

    // 2. Check agent health
    const healthData = await checkAgentHealth();
    const criticalIssues = healthData.filter(h => h.issues.length > 0);

    // 3. Sync content pipeline to blog drafts
    const syncedDrafts = await syncContentPipelineToBlogs();

    // 4. Build system state summary for LLM
    const systemState = {
      date: new Date().toISOString().split("T")[0],
      costYesterday: {
        total: `$${costData.totalUsd.toFixed(4)}`,
        byFeature: Object.entries(costData.byFeature).map(([k, v]) => `${k}: $${v.toFixed(4)}`),
        alerts: costData.alerts,
      },
      agentHealth: healthData.map(h => ({
        agent: h.name,
        lastRun: h.lastRun?.toISOString() ?? "never",
        status: h.lastStatus ?? "unknown",
        consecutiveFailures: h.consecutiveFailures,
        issues: h.issues,
      })),
      syncedDrafts,
      criticalIssueCount: criticalIssues.length,
    };

    // 5. Ask LLM to generate daily briefing and improvement suggestions
    const llmResponse = await agentLLM({
      agentSlug: "infra",
      context,
      messages: [
        {
          role: "system",
          content: `You are the Infrastructure Agent for Solar Freedom (breakyoursolarcontract.com).
You monitor the entire autonomous agent system and send Chase a daily briefing.

YOUR VOICE: Talk like a real person. Not corporate. Not AI-robotic. Think: smart friend who runs ops.
- Use "I" not "The system"
- Be direct. Lead with what matters most.
- If nothing's wrong, say so and move on
- If something IS wrong, say it clearly and tell Chase what you need from him
- Use specific numbers, not vague summaries
- Keep it under 300 words

FIRST RUN BEHAVIOR: If this is the first run (no previous runs in history), introduce yourself warmly.
Say something like: "Hey Chase — I'm your Infrastructure Agent, just got set up. Here's what I'm seeing on day one..."

DAILY BRIEFING FORMAT:
1. One-line status (good/needs attention/critical)
2. Cost: yesterday's spend + any alerts
3. Agent health: who ran, who didn't, any failures
4. What got done (content synced, etc.)
5. What needs Chase's attention (if anything)
6. One improvement suggestion

OUTPUT: Return a JSON object with:
{
  "briefing": "the conversational message for Chase",
  "improvements": ["specific improvement 1", "specific improvement 2"],
  "criticalActions": ["P1 action if any"],
  "costSummary": "one line cost summary"
}`,
        },
        {
          role: "user",
          content: `Here is the current system state:\n\n${JSON.stringify(systemState, null, 2)}`,
        },
      ],
      temperature: 0.7,
      maxTokens: 1000,
    });

    // Parse LLM response
    let briefing = "";
    let improvements: string[] = [];
    let criticalActions: string[] = [];
    let costSummary = `$${costData.totalUsd.toFixed(4)} yesterday`;

    try {
      const parsed = JSON.parse(llmResponse.replace(/```json\n?|\n?```/g, "").trim());
      briefing = parsed.briefing ?? llmResponse;
      improvements = parsed.improvements ?? [];
      criticalActions = parsed.criticalActions ?? [];
      costSummary = parsed.costSummary ?? costSummary;
    } catch {
      briefing = llmResponse;
    }

    // 6. Send daily cost alert via notifyOwner
    const costAlertTitle = costData.alerts.length > 0
      ? `⚠️ Agent Cost Alert — ${costData.alerts.length} issue(s)`
      : `✅ Daily Agent Briefing — ${new Date().toLocaleDateString()}`;

    const costAlertContent = [
      briefing,
      "",
      `💰 Cost: ${costSummary}`,
      costData.alerts.length > 0 ? costData.alerts.join("\n") : "",
      criticalIssues.length > 0
        ? `\n🚨 Issues: ${criticalIssues.map(h => `${h.name}: ${h.issues.join(", ")}`).join(" | ")}`
        : "",
    ].filter(Boolean).join("\n");

    await notifyOwner({
      title: costAlertTitle,
      content: costAlertContent.slice(0, 2000),
    });

    // 7. Create improvement actions in queue
    let actionsCreated = 0;
    for (const improvement of improvements.slice(0, 3)) {
      await createAction({
        agentSlug: "infra",
        actionType: "system_improvement",
        title: `System Improvement: ${improvement.slice(0, 100)}`,
        description: improvement,
        priority: "p4",
        status: "queued",
        requiresApproval: 1,
      });
      actionsCreated++;
    }

    // 8. Create critical actions for P1 issues
    for (const action of criticalActions) {
      await createAction({
        agentSlug: "infra",
        actionType: "error_fix",
        title: `CRITICAL: ${action.slice(0, 100)}`,
        description: action,
        priority: "p1",
        status: "queued",
        requiresApproval: 1,
      });
      actionsCreated++;
    }

    // 9. Log health data for each agent
    const database = await getDb();
    if (database) {
      for (const health of healthData) {
        const healthStatus: "success" | "partial" | "failed" | "skipped" =
          health.consecutiveFailures >= 3 ? "failed"
          : health.lastStatus === "success" ? "success"
          : "partial";
        const qualityScore = health.consecutiveFailures === 0
          ? 90
          : Math.max(0, 90 - health.consecutiveFailures * 20);

        await database.insert(agentHealthLog).values({
          agentSlug: health.slug,
          status: healthStatus,
          qualityScore,
          improvementNotes: health.issues.length > 0 ? health.issues.join("; ") : null,
        });
      }

      // 10. Log system change (use 'other' category since 'monitoring' is not in the enum)
      await database.insert(systemChangeLog).values({
        actor: "infra",
        actorType: "agent",
        category: "other",
        description: `Daily infrastructure check: ${healthData.length} agents reviewed, $${costData.totalUsd.toFixed(4)} spent yesterday, ${syncedDrafts} drafts synced`,
      });
    }

    const summary = `Infrastructure check complete. Cost: $${costData.totalUsd.toFixed(4)}. ${criticalIssues.length} issues found. ${syncedDrafts} drafts synced. Briefing sent to Chase.`;

    await completeRun(context, summary, "completed");

    return { summary, actionsCreated, messagesCreated: 0 };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await completeRun(context, `Infrastructure Agent failed: ${errorMsg}`, "failed", errorMsg);
    throw error;
  }
}
