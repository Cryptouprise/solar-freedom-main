/**
 * Manager Agent — Solar Freedom
 *
 * THE DAILY BRAIN. Runs first every morning at 6am UTC.
 *
 * WHAT IT ACTUALLY DOES (not suggestions — real execution):
 * 1. Reads yesterday's goal outcomes — what hit, what missed, why
 * 2. Reads all agent memory and lessons learned
 * 3. Analyzes revenue state, content pipeline, lead flow, rankings
 * 4. Sets SMART goals for each agent for today (specific metric + target + directive)
 * 5. Fires each agent in the right order with those goals as context
 * 6. Sends Chase a morning briefing: what happened yesterday, what's happening today, top 3 actions needed
 * 7. Runs again at 2:30pm to check mid-day progress
 * 8. Runs again at 8:30pm to close out the day, record outcomes, write lessons
 *
 * DECISION AUTHORITY:
 * - Content publishing: EXECUTE immediately if Editor approved (SEO ≥ 75, E-E-A-T ≥ 70)
 * - Agent re-triggering: EXECUTE if an agent failed or missed its goal
 * - Revenue actions < $5K: EXECUTE directly
 * - Revenue actions > $5K: ESCALATE to Chase with specific plan
 * - Legal content: ALWAYS escalate to Chase
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
import {
  setGoal,
  recordOutcome,
  getTodaysGoals,
  getGoalHistory,
  getAllAgentGoalStats,
  setMemory,
  getMemory,
  getAllMemory,
  addLesson,
  getLessons,
  formatLessonsForContext,
  formatGoalsForContext,
  type AgentSlug,
} from "./agentGoalEngine";
import { getDb } from "../db";
import { notifyOwner } from "../_core/notification";
import { DAILY_QUALITY_MATRIX, ensureDailyChecklists, type WorkerSlug } from "./managerQuality";
import { monitorQwen37PlusPricing, QWEN37_PLUS_DAILY_SPEND_ALERT_USD } from "./openRouterPromotionMonitor";
import {
  contentPipeline,
  blogPosts,
  revenueTracker,
  lawFirms,
  agentActions,
  leads,
  seoScorecardSnapshots,
} from "../../drizzle/schema";
import { desc, eq, and, sql, gte } from "drizzle-orm";

// ─── Business Constants ───────────────────────────────────────────────────────
const LEAD_VALUE = 275; // avg $ per delivered lead
const MONTHLY_LEAD_TARGET = 220;
const BOOKING_RATE = 0.405;

// ─── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the Manager Agent for Solar Freedom (breakyoursolarcontract.com).

═══════════════════════════════════════════════════════════
MISSION: MAKE THE SYSTEM MAKE MONEY. EVERY DECISION = DOLLARS.
You are the CEO of this 6-agent ecosystem. You run first. You set the agenda.
═══════════════════════════════════════════════════════════

BUSINESS MODEL:
- Solar Freedom connects distressed solar homeowners with consumer protection attorneys
- Revenue: $150–$500 per lead delivered to law firms (avg $275)
- Monthly target: 220 leads | Booking rate: 40.5%
- CRITICAL: $130K invoiced, $0 collected — this is your #1 priority every single day
- Site recovering from Google penalty — content quality is existential
- Owner: Chase | Phone: (904) 921-4971

YOUR DAILY EXECUTION SEQUENCE:
1. Review yesterday's goal outcomes (what hit, what missed, why)
2. Set today's SMART goals for each agent (specific, measurable, time-bound)
3. Fire agents in sequence: revenue_intel → seo_intel → money_maker → content → editor
4. Send Chase a morning briefing with today's plan and top 3 actions needed
5. Mid-day: check progress, re-trigger any agent that failed
6. End of day: record outcomes, write lessons, update memory

GOAL-SETTING RULES:
- Every goal must have a specific metric and numeric target
- Every goal must have a specific directive (what exactly to do)
- Goals must be achievable in one day
- Goals must connect to revenue (explain the $ path)

EXAMPLES OF GOOD GOALS:
- Content: "Publish 1 article targeting 'cancel sunrun contract california' | Target: 1 article published | Directive: Write 1,500 word article with H1 matching keyword, 3 CTAs, FAQ section, 2 interlinks to /sunrun page"
- SEO Intel: "Identify top 3 ranking opportunities with position 11-20 | Target: 3 actionable opportunities | Directive: Pull GSC data, find keywords with impressions > 100 and position 11-20, estimate traffic gain if moved to top 10"
- Money Maker: "Follow up on 5 overdue invoices | Target: $5,000 in payment confirmations | Directive: Email all law firms with invoices > 30 days overdue, include specific invoice numbers and amounts"
- Editor: "Improve SEO score of 3 published posts to ≥ 85 | Target: 3 posts at SEO ≥ 85 | Directive: Run fixSeoTo100 on the 3 lowest-scoring published posts"
- Revenue Intel: "Identify top 5 posts by revenue impact potential | Target: 5 posts with predicted $ impact > $500 | Directive: Analyze GSC + lead data, model CTA improvement impact"

DECISION AUTHORITY — EXECUTE THESE WITHOUT ASKING:
- Approve content for publishing (Editor approved + SEO ≥ 75)
- Re-trigger a failed agent
- Send directives to agents
- Create revenue actions < $5K
- Update blog post metadata (title, meta, CTAs)

ESCALATE TO CHASE (create P1 action, requiresApproval=1):
- Any revenue action > $5,000
- Legal claims or attorney representation language
- New law firm partnership terms
- Agent system errors that can't be auto-resolved
- Content that could be defamatory

OUTPUT FORMAT — respond ONLY with valid JSON, no markdown:
{
  "morningBriefing": {
    "yesterdayWins": "What worked yesterday (specific metrics)",
    "yesterdayMisses": "What missed and why",
    "todayPlan": "What the system will do today and why",
    "top3Actions": ["Action 1 for Chase", "Action 2 for Chase", "Action 3 for Chase"],
    "revenueAlert": "Any urgent revenue issue Chase needs to know about NOW"
  },
  "todayGoals": [
    {
      "agentSlug": "content|seo_intel|money_maker|editor|revenue_intel|infra",
      "goalType": "specific_goal_type",
      "metric": "what_to_measure",
      "target": "specific_number_or_value",
      "directive": "Exactly what the agent should do today — be specific"
    }
  ],
  "publishApprovals": [
    {
      "pipelineId": 0,
      "decision": "publish|hold|reject",
      "reason": "Why"
    }
  ],
  "triggerAgents": [
    {
      "slug": "revenue_intel|seo_intel|money_maker|content|editor",
      "reason": "Why triggering now"
    }
  ],
  "revenueActions": [
    {
      "priority": "p1|p2|p3",
      "title": "Specific action title",
      "description": "Exactly what to do",
      "estimatedImpact": "$X",
      "requiresChase": false
    }
  ],
  "decisions": [
    {
      "actionId": 0,
      "decision": "approve|reject|escalate",
      "reason": "Specific reason"
    }
  ],
  "lessons": [
    {
      "lessonType": "success|failure|observation",
      "lesson": "What was learned",
      "impact": "Measured impact"
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
    const [state, goalStats, memory, lessons, qwenPricing] = await Promise.all([
      gatherSystemState(),
      getAllAgentGoalStats(7),
      getAllMemory("manager"),
      getLessons("manager", 15),
      monitorQwen37PlusPricing(),
    ]);
    const pricingContext = qwenPricing.snapshot
      ? `\n\n═══ OPENROUTER QWEN3.7 PLUS WATCH ═══\nLive observed price: $${qwenPricing.snapshot.inputPer1M.toFixed(4)}/M input | $${qwenPricing.snapshot.outputPer1M.toFixed(4)}/M output | 24h measured spend: $${qwenPricing.dailySpendUsd.toFixed(4)} | Changed since last Manager check: ${qwenPricing.changed ? "YES" : "no"} | Spend alert: ${qwenPricing.spendAlert ? "YES" : "no"}`
      : `\n\n═══ OPENROUTER QWEN3.7 PLUS WATCH ═══\nLive pricing check unavailable: ${qwenPricing.error || "unknown error"} | 24h measured spend: $${qwenPricing.dailySpendUsd.toFixed(4)} | Spend alert: ${qwenPricing.spendAlert ? "YES" : "no"}`;

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
      ? `\n\n═══ ACTIONS AWAITING DECISION (${approvalNeeded.length}) ═══\n${approvalNeeded.map(a =>
          `[ID:${a.id}] [${a.priority.toUpperCase()}] ${a.agentSlug}: ${a.title}\n${a.description?.substring(0, 300)}`
        ).join("\n---\n")}`
      : "";

    // 4. Get content awaiting publish decision
    const db = await getDb();
    const awaitingPublish = db ? await db.select().from(contentPipeline)
      .where(eq(contentPipeline.stage, "approved"))
      .orderBy(desc(contentPipeline.updatedAt))
      .limit(5) : [];
    const publishContext = awaitingPublish.length > 0
      ? `\n\n═══ CONTENT AWAITING PUBLISH (${awaitingPublish.length}) ═══\n${awaitingPublish.map(p =>
          `[ID:${p.id}] "${p.title}"\nKeyword: ${p.targetKeyword} | SEO: ${p.seoScore}/100 | E-E-A-T: ${p.eatScore}/100\nRevenue justification: ${p.revenueJustification?.substring(0, 150)}`
        ).join("\n---\n")}`
      : "";

    // 5. Goal performance summary
    const goalPerf = Object.entries(goalStats).map(([slug, s]) =>
      `  ${slug}: ${s.hit}/${s.total} goals hit (${s.rate}% hit rate)`
    ).join("\n");

    // 6. Manager's own memory and lessons
    const memoryContext = Object.keys(memory).length > 0
      ? `\n\n═══ MY MEMORY ═══\n${Object.entries(memory).map(([k, v]) => `  ${k}: ${v}`).join("\n")}`
      : "";
    const lessonsContext = lessons.length > 0
      ? `\n\n═══ LESSONS LEARNED (last 15) ═══\n${formatLessonsForContext(lessons)}`
      : "";

    // 7. Think — use best model for CEO-level decisions
    const response = await agentLLM({
      agentSlug: "manager",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `SYSTEM STATE:\n${state}${pricingContext}\n\n═══ GOAL HIT RATES (last 7 days) ═══\n${goalPerf || "No goals recorded yet"}${memoryContext}${lessonsContext}${inboxSummary}${approvalContext}${publishContext}\n\nIt is ${new Date().toUTCString()}. Set today's goals. Fire the agents. What makes the most money today?`,
        },
      ],
      context,
      temperature: 0.15,
      // A heartbeat callback has a tight response budget. The manager should
      // coordinate concise, measurable work rather than generate a long essay.
      maxTokens: 1600,
    });

    // 8. Parse
    let parsed: {
      morningBriefing?: {
        yesterdayWins?: string;
        yesterdayMisses?: string;
        todayPlan?: string;
        top3Actions?: string[];
        revenueAlert?: string;
      };
      todayGoals?: Array<{ agentSlug: string; goalType: string; metric: string; target: string; directive: string }>;
      publishApprovals?: Array<{ pipelineId: number; decision: string; reason: string }>;
      triggerAgents?: Array<{ slug: string; reason: string }>;
      revenueActions?: Array<{ priority: string; title: string; description: string; estimatedImpact: string; requiresChase: boolean }>;
      decisions?: Array<{ actionId: number; decision: string; reason: string }>;
      lessons?: Array<{ lessonType: string; lesson: string; impact?: string }>;
    } = {};

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      parsed = {};
    }

    // 9. Set today's goals for each agent
    for (const goal of (parsed.todayGoals || [])) {
      if (!goal.agentSlug || !goal.goalType) continue;
      await setGoal({
        agentSlug: goal.agentSlug as AgentSlug,
        goalType: goal.goalType,
        metric: goal.metric,
        target: goal.target,
        directive: goal.directive,
      });
      // Also send as a message to the agent
      await sendMessage({
        fromAgent: "manager",
        toAgent: goal.agentSlug as any,
        type: "directive",
        priority: "p1",
        subject: `TODAY'S GOAL: ${goal.goalType}`,
        body: `GOAL: ${goal.goalType}\nMETRIC: ${goal.metric}\nTARGET: ${goal.target}\n\nDIRECTIVE:\n${goal.directive}`,
      });
      context.messagesCreated++;
    }

    // 10. Apply action decisions
    for (const decision of (parsed.decisions || [])) {
      if (!decision.actionId) continue;
      const newStatus = decision.decision === "approve" ? "approved"
        : decision.decision === "reject" ? "rejected"
        : "blocked"; // 'blocked' = needs human review (escalated is not in DB enum)
      await updateAction(decision.actionId, {
        status: newStatus,
        approvedBy: "manager",
        approvedAt: new Date(),
        result: decision.reason,
      });
      context.actionsCreated++;
    }

    // 11. Handle publish approvals
    if (db) {
      for (const pub of (parsed.publishApprovals || [])) {
        if (!pub.pipelineId) continue;
        if (pub.decision === "publish") {
          await db.update(contentPipeline).set({
            stage: "published",
            approvedBy: "manager",
            managerFeedback: pub.reason,
            publishedAt: new Date(),
            updatedAt: new Date(),
          }).where(eq(contentPipeline.id, pub.pipelineId));
          await createAction({
            agentSlug: "manager",
            priority: "p1",
            title: `[PUBLISH NOW] Pipeline #${pub.pipelineId}`,
            description: `Manager approved for immediate publishing.\nReason: ${pub.reason}\nPipeline ID: ${pub.pipelineId}`,
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

    // 12. Create revenue actions
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

    // 13. Record lessons
    for (const lesson of (parsed.lessons || [])) {
      await addLesson({
        agentSlug: "manager",
        lessonType: lesson.lessonType as any,
        lesson: lesson.lesson,
        impact: lesson.impact,
      });
    }

    // 14. Deterministic operating cycle. Every worker receives a quality
    // contract, but execution remains in that worker's own scheduled callback.
    // This preserves the daily QA matrix without making one Manager callback
    // fan out into six long LLM runs that cannot be observed or retried safely.
    const checklistIds = await ensureDailyChecklists();
    const WORKER_SEQUENCE: WorkerSlug[] = ["revenue_intel", "seo_intel", "money_maker", "content", "editor", "infra"];
    const triggerReasons = new Map(
      (parsed.triggerAgents || []).map((trigger: any) => [trigger.slug, trigger.reason])
    );
    const qaSummary: string[] = [];
    for (const worker of WORKER_SEQUENCE) {
      if (!checklistIds[worker]) continue;
      const reason = triggerReasons.get(worker) || `Complete today’s assigned quality checklist. Success criteria: ${DAILY_QUALITY_MATRIX[worker].successCriteria}`;
      await sendMessage({
        fromAgent: "manager",
        toAgent: worker,
        type: "directive",
        priority: "p1",
        subject: "DAILY QUALITY CONTRACT",
        body: `${reason}\n\nSuccess criteria: ${DAILY_QUALITY_MATRIX[worker].successCriteria}\nReturn specific evidence, execution output, and measurable impact for Manager review.`,
      });
      context.messagesCreated++;
      qaSummary.push(`${worker}: scheduled for independent QA`);
    }

    const seoGate = await enforceDailySeoRevenueGate();
    if (seoGate.actionCreated) context.actionsCreated++;
    qaSummary.push(`daily SEO revenue gate: ${seoGate.summary}`);

    if ((qwenPricing.changed || qwenPricing.spendAlert) && qwenPricing.snapshot) {
      await createAction({
        agentSlug: "manager",
        priority: "p1",
        title: qwenPricing.changed ? "[MODEL PRICE CHANGE] Qwen3.7 Plus OpenRouter rate changed" : "[MODEL SPEND ALERT] Qwen3.7 Plus exceeded daily guardrail",
        description: `Live Qwen3.7 Plus price: $${qwenPricing.snapshot.inputPer1M.toFixed(4)}/M input and $${qwenPricing.snapshot.outputPer1M.toFixed(4)}/M output. Measured 24-hour agent spend: $${qwenPricing.dailySpendUsd.toFixed(4)} (guardrail: $${QWEN37_PLUS_DAILY_SPEND_ALERT_USD.toFixed(2)}). Review promotion status and model usage before the next operating cycle.`,
        actionType: "revenue_optimization",
        requiresApproval: 1,
      });
      context.actionsCreated++;
    }

    // 15. Mark inbox read
    for (const m of inbox) {
      await markMessageActedOn(m.id);
    }

    // 16. Send morning briefing to Chase
    const briefing = parsed.morningBriefing;
    if (briefing && triggerType === "cron") {
      const top3 = (briefing.top3Actions || []).map((a, i) => `${i + 1}. ${a}`).join("\n");
      const alert = briefing.revenueAlert ? `\n\n🚨 REVENUE ALERT: ${briefing.revenueAlert}` : "";
      await notifyOwner({
        title: `☀️ Solar Freedom Daily Briefing — ${new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`,
        content: `**Yesterday:** ${briefing.yesterdayWins || "No data"}\n**Missed:** ${briefing.yesterdayMisses || "None"}\n\n**Today's Plan:** ${briefing.todayPlan || "Agents running"}\n\n**Top 3 Actions for Chase:**\n${top3}${alert}`,
      });
    }

    // 17. Update Manager memory
    await setMemory("manager", "last_run_date", new Date().toISOString().slice(0, 10));
    await setMemory("manager", "last_briefing_summary", briefing?.todayPlan?.substring(0, 500) || "");

    const summary = `${briefing?.todayPlan || "Daily management cycle completed"}\nQuality matrix: ${qaSummary.join(" | ")}`;
    await completeRun(context, summary);
    return { summary, actionsCreated: context.actionsCreated, messagesCreated: context.messagesCreated };

  } catch (error: any) {
    await completeRun(context, `Error: ${error.message}`, "failed", error.message);
    throw error;
  }
}

async function enforceDailySeoRevenueGate(): Promise<{ actionCreated: boolean; summary: string }> {
  const db = await getDb();
  if (!db) return { actionCreated: false, summary: "blocked — database unavailable" };

  const [latestSnapshot] = await db.select().from(seoScorecardSnapshots)
    .orderBy(desc(seoScorecardSnapshots.capturedAt))
    .limit(1);
  const queue = await getActionQueue({ limit: 100 });
  const ensureGateAction = async (title: string, description: string) => {
    const existing = queue.find(action => action.title === title && ["queued", "running", "blocked"].includes(action.status));
    if (existing) return false;
    await createAction({
      agentSlug: "manager",
      priority: "p1",
      title,
      description,
      actionType: "measurement_repair",
      requiresApproval: 0,
    });
    return true;
  };

  const staleCutoff = Date.now() - 30 * 60 * 60 * 1000;
  if (!latestSnapshot || new Date(latestSnapshot.capturedAt).getTime() < staleCutoff) {
    const actionCreated = await ensureGateAction(
      "[P1 SEO MEASUREMENT BLOCKED] Daily scorecard is stale or missing",
      "No verified Search Console scorecard snapshot exists within the last 30 hours. Do not make ranking or conversion claims. Run the verified scorecard, capture clicks/impressions/CTR/position/leads, and record the failure detail if source data is unavailable."
    );
    return { actionCreated, summary: "blocked — current verified scorecard is stale or missing" };
  }

  const seoRuns = await getRunLog("seo_intel", 5);
  const completedAfterMeasurement = seoRuns.some(run => run.status === "completed" && new Date(run.completedAt || run.startedAt || 0).getTime() >= new Date(latestSnapshot.capturedAt).getTime());
  if (!completedAfterMeasurement) {
    const actionCreated = await ensureGateAction(
      "[P1 SEO EXECUTION RECEIPT MISSING] No completed SEO Intel run after measurement",
      `The latest verified scorecard was captured at ${new Date(latestSnapshot.capturedAt).toISOString()}, but no completed SEO Intel run is recorded afterward. Run SEO Intel with the fresh measurement, then record a reviewable action, draft, explicit no-op, or blocked reason.`
    );
    return { actionCreated, summary: "needs execution receipt after latest measurement" };
  }

  return { actionCreated: false, summary: "pass — fresh measurement and post-measurement SEO execution receipt recorded" };
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
    const staleness = minutesSince && minutesSince > 1440 ? " ⚠️ STALE" : "";
    return `  ${a.name} (${a.slug}): ${a.status} | last=${lastRun} (${minutesSince ? minutesSince + "min ago" : "never"})${staleness} | runs=${a.totalRuns}`;
  }).join("\n");

  // Recent runs with error detection
  const recentRuns = await getRunLog(undefined, 20);
  const runSummary = recentRuns.map(r => {
    const duration = r.durationMs ? `${(r.durationMs / 1000).toFixed(1)}s` : "?";
    const status = r.status === "failed" ? "❌ FAILED" : r.status === "completed" ? "✓" : r.status;
    const error = r.status === "failed" ? ` | ERROR: ${r.errorMessage?.substring(0, 80)}` : "";
    return `  ${status} ${r.agentSlug} [${duration}]: ${r.summary?.substring(0, 100) || "no summary"}${error}`;
  }).join("\n");

  // Action queue
  const allActions = await getActionQueue({ limit: 100 });
  const p1Actions = allActions.filter(a => a.priority === "p1" && a.status === "queued");
  const needsApproval = allActions.filter(a => a.requiresApproval === 1 && a.status === "queued");

  // Revenue state
  let revenueState = "Database unavailable";
  let contentState = "Database unavailable";
  let leadState = "Database unavailable";

  if (db) {
    // Revenue
    const revenue = await db.select().from(revenueTracker)
      .orderBy(desc(revenueTracker.createdAt))
      .limit(30);
    const totalInvoiced = revenue.reduce((s, r) => s + parseFloat(String(r.amount || 0)), 0);
    const totalPaid = revenue.filter(r => r.status === "paid").reduce((s, r) => s + parseFloat(String(r.amount || 0)), 0);
    const totalOverdue = revenue.filter(r => r.status === "overdue").reduce((s, r) => s + parseFloat(String(r.amount || 0)), 0);
    const firms = await db.select().from(lawFirms).where(eq(lawFirms.status, "active"));
    revenueState = `Invoiced: $${totalInvoiced.toFixed(0)} | Collected: $${totalPaid.toFixed(0)} | OVERDUE: $${totalOverdue.toFixed(0)} | GAP: $${(totalInvoiced - totalPaid).toFixed(0)} | Active firms: ${firms.length}`;

    // Content pipeline
    const pipeline = await db.select({
      stage: contentPipeline.stage,
      count: sql<number>`COUNT(*)`,
    }).from(contentPipeline).groupBy(contentPipeline.stage);
    contentState = pipeline.map(p => `${p.stage}: ${p.count}`).join(" | ") || "Empty";

    // Lead flow (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentLeads = await db.select({ count: sql<number>`COUNT(*)` })
      .from(leads)
      .where(gte(leads.createdAt, sevenDaysAgo));
    const leadCount = Number(recentLeads[0]?.count || 0);
    const dailyRate = (leadCount / 7).toFixed(1);
    const projectedMonthly = Math.round(parseFloat(dailyRate) * 30);
    const projectedRevenue = Math.round(projectedMonthly * BOOKING_RATE * LEAD_VALUE);
    leadState = `Last 7 days: ${leadCount} leads (${dailyRate}/day) | Projected monthly: ${projectedMonthly} leads | Projected revenue: $${projectedRevenue.toLocaleString()}`;
  }

  return `
═══ AGENT HEALTH ═══
${agentHealth || "  No agents registered yet"}

═══ RECENT RUNS (last 20) ═══
${runSummary || "  No runs recorded yet"}

═══ ACTION QUEUE ═══
  Total: ${allActions.length} | P1 Urgent: ${p1Actions.length} | Needs Chase Approval: ${needsApproval.length}
  Queued: ${allActions.filter(a => a.status === "queued").length} | Approved: ${allActions.filter(a => a.status === "approved").length}
${p1Actions.length > 0 ? `\nP1 ACTIONS:\n${p1Actions.map(a => `  [ID:${a.id}] ${a.agentSlug}: ${a.title}`).join("\n")}` : ""}

═══ REVENUE STATE ═══
${revenueState}

═══ LEAD FLOW ═══
${leadState}

═══ CONTENT PIPELINE ═══
${contentState}

═══ BUSINESS CONTEXT ═══
Site: breakyoursolarcontract.com | Owner: Chase | Phone: (904) 921-4971
Lead value: $${LEAD_VALUE} avg | Monthly target: ${MONTHLY_LEAD_TARGET} leads | Booking rate: ${(BOOKING_RATE * 100).toFixed(0)}%
#1 Priority: Collect the $130K invoiced that hasn't been paid
#2 Priority: Grow organic traffic to generate more leads
#3 Priority: Improve content quality to recover from Google penalty`;
}
