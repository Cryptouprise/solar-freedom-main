/**
 * Revenue Intelligence Agent — Solar Freedom
 *
 * THE MONEY PREDICTOR. Runs daily at 8am UTC.
 *
 * WHAT IT ACTUALLY DOES:
 * 1. Pulls every page's GSC data (clicks, impressions, position)
 * 2. Calculates current lead yield per page (leads per 1000 impressions)
 * 3. Models the dollar impact of specific changes for each page:
 *    - CTA rewrite: +15-40% CTR → more leads
 *    - Title optimization: +10-30% CTR → more clicks
 *    - Position improvement: uses CTR curve (pos 1=28%, pos 3=11%, pos 10=2.5%)
 *    - Interlinking: +5-15% position improvement for target pages
 *    - FAQ addition: +20% impressions from featured snippets
 *    - Meta rewrite: +8-20% CTR
 * 4. Ranks ALL possible actions by predicted $ impact (highest first)
 * 5. Auto-executes top 5 actions that don't need human approval
 * 6. Creates P1 actions for Chase for anything > $5K impact
 * 7. Sends results to Manager for morning briefing
 *
 * PREDICTION MODEL:
 * - Lead value: $275 avg (150-500 range)
 * - Booking rate: 40.5%
 * - Lead yield = (clicks / 1000) * conversion_rate
 * - Conversion rate estimated from page type and intent signals
 */

import {
  agentLLM,
  startRun,
  completeRun,
  sendMessage,
  createAction,
  type AgentThinkResult,
} from "./engine";
import {
  getTodaysGoals,
  recordOutcome,
  getAllMemory,
  getLessons,
  formatLessonsForContext,
  formatGoalsForContext,
  setMemory,
  addLesson,
} from "./agentGoalEngine";
import { getDb } from "../db";
import {
  seoPages,
  blogPosts,
  leads,
  revenueIntelPredictions,
  revenueIntelRuns,
} from "../../drizzle/schema";
import { desc, eq, sql, and, gte, isNotNull } from "drizzle-orm";
import { getGA4Report } from "../ga4";

// ─── Business Constants ───────────────────────────────────────────────────────
const LEAD_VALUE = 275;
const BOOKING_RATE = 0.405;
const REVENUE_PER_LEAD = LEAD_VALUE * BOOKING_RATE; // ~$111

// CTR curve by position (Google industry average)
const CTR_BY_POSITION: Record<number, number> = {
  1: 0.278, 2: 0.152, 3: 0.110, 4: 0.080, 5: 0.064,
  6: 0.050, 7: 0.040, 8: 0.033, 9: 0.027, 10: 0.025,
  11: 0.018, 12: 0.015, 13: 0.013, 14: 0.011, 15: 0.010,
  20: 0.007, 25: 0.005, 30: 0.003,
};

function getCTR(position: number): number {
  const rounded = Math.round(position);
  if (CTR_BY_POSITION[rounded]) return CTR_BY_POSITION[rounded];
  // Interpolate for positions not in table
  if (rounded > 30) return 0.002;
  const keys = Object.keys(CTR_BY_POSITION).map(Number).sort((a, b) => a - b);
  for (let i = 0; i < keys.length - 1; i++) {
    if (rounded >= keys[i] && rounded <= keys[i + 1]) {
      const ratio = (rounded - keys[i]) / (keys[i + 1] - keys[i]);
      return CTR_BY_POSITION[keys[i]] + ratio * (CTR_BY_POSITION[keys[i + 1]] - CTR_BY_POSITION[keys[i]]);
    }
  }
  return 0.002;
}

// Conversion rate by page type (leads per 100 clicks)
const CONVERSION_RATE: Record<string, number> = {
  homepage: 4.5,
  city: 6.2,
  state_law: 5.8,
  company: 7.1, // highest — people searching specific companies are ready to act
  blog: 2.8,
  service: 5.5,
  report: 3.2,
  other: 2.0,
};

// ─── Prediction Engine ────────────────────────────────────────────────────────

interface PageMetrics {
  slug: string;
  title: string;
  pageType: string;
  clicks: number;
  impressions: number;
  position: number;
  currentLeadsPerMonth: number;
  currentRevenuePerMonth: number;
}

interface PredictedAction {
  pageSlug: string;
  pageTitle: string;
  actionType: string;
  actionDetail: string;
  predictedClicksGain: number;
  predictedLeadsGain: number;
  predictedRevenueGain: number;
  confidenceScore: number;
  reasoning: string;
}

function modelPageMetrics(page: typeof seoPages.$inferSelect): PageMetrics {
  const clicks = page.gscClicks || 0;
  const impressions = page.gscImpressions || 0;
  const position = parseFloat(page.gscAvgPosition || "50");
  const convRate = CONVERSION_RATE[page.pageType] || 2.0;
  const leadsPerMonth = (clicks / 100) * (convRate / 100) * 30; // daily clicks * conversion
  const revenuePerMonth = leadsPerMonth * REVENUE_PER_LEAD;

  return {
    slug: page.slug,
    title: page.title || page.slug,
    pageType: page.pageType,
    clicks,
    impressions,
    position,
    currentLeadsPerMonth: Math.round(leadsPerMonth * 100) / 100,
    currentRevenuePerMonth: Math.round(revenuePerMonth * 100) / 100,
  };
}

function predictActions(metrics: PageMetrics): PredictedAction[] {
  const actions: PredictedAction[] = [];
  const { slug, title, pageType, clicks, impressions, position, currentLeadsPerMonth } = metrics;
  const convRate = CONVERSION_RATE[pageType] || 2.0;

  // 1. CTA Rewrite — improves on-page conversion rate by 15-40%
  if (clicks > 5) {
    const ctaImprovementRate = 0.25; // conservative 25% improvement
    const newLeads = currentLeadsPerMonth * (1 + ctaImprovementRate);
    const leadsGain = newLeads - currentLeadsPerMonth;
    const revenueGain = leadsGain * REVENUE_PER_LEAD * 30; // monthly
    if (revenueGain > 50) {
      actions.push({
        pageSlug: slug,
        pageTitle: title,
        actionType: "cta_rewrite",
        actionDetail: `Rewrite primary CTA on "${title}" to increase conversion rate by ~25%. Current: generic button. New: urgency-driven, benefit-specific CTA matching search intent.`,
        predictedClicksGain: 0,
        predictedLeadsGain: Math.round(leadsGain * 100) / 100,
        predictedRevenueGain: Math.round(revenueGain * 100) / 100,
        confidenceScore: 72,
        reasoning: `Page gets ${clicks} clicks/day. A 25% CTA improvement = ${leadsGain.toFixed(2)} more leads/month × $${REVENUE_PER_LEAD.toFixed(0)} = $${revenueGain.toFixed(0)}/month`,
      });
    }
  }

  // 2. Title Optimization — improves CTR by 10-30% for pages with high impressions
  if (impressions > 100 && position <= 20) {
    const currentCTR = getCTR(position);
    const improvedCTR = currentCTR * 1.20; // 20% CTR improvement
    const currentDailyClicks = impressions * currentCTR;
    const newDailyClicks = impressions * improvedCTR;
    const clicksGain = newDailyClicks - currentDailyClicks;
    const leadsGain = (clicksGain / 100) * (convRate / 100) * 30;
    const revenueGain = leadsGain * REVENUE_PER_LEAD;
    if (revenueGain > 30) {
      actions.push({
        pageSlug: slug,
        pageTitle: title,
        actionType: "title_optimization",
        actionDetail: `Optimize title tag of "${title}" to improve CTR from ${(currentCTR * 100).toFixed(1)}% to ${(improvedCTR * 100).toFixed(1)}%. Add power words: "Free", "Cancel", "Get Out", "Now". Include year if applicable.`,
        predictedClicksGain: Math.round(clicksGain * 30),
        predictedLeadsGain: Math.round(leadsGain * 100) / 100,
        predictedRevenueGain: Math.round(revenueGain * 100) / 100,
        confidenceScore: 68,
        reasoning: `${impressions} impressions/day at pos ${position.toFixed(1)}. 20% CTR improvement = +${clicksGain.toFixed(1)} clicks/day = +${leadsGain.toFixed(2)} leads/month = $${revenueGain.toFixed(0)}/month`,
      });
    }
  }

  // 3. Position Push — pages sitting at 11-20 are close to page 1 gold
  if (position >= 11 && position <= 25 && impressions > 50) {
    const currentCTR = getCTR(position);
    const targetPosition = Math.max(1, position - 5);
    const targetCTR = getCTR(targetPosition);
    const currentDailyClicks = impressions * currentCTR;
    const newDailyClicks = impressions * targetCTR;
    const clicksGain = newDailyClicks - currentDailyClicks;
    const leadsGain = (clicksGain / 100) * (convRate / 100) * 30;
    const revenueGain = leadsGain * REVENUE_PER_LEAD;
    if (revenueGain > 50) {
      actions.push({
        pageSlug: slug,
        pageTitle: title,
        actionType: "position_push",
        actionDetail: `Push "${title}" from position ${position.toFixed(0)} to ${targetPosition} via: (1) Add 500 words of E-E-A-T content, (2) Add 3 internal links from high-authority pages, (3) Add FAQ schema, (4) Improve keyword density to 1.5-2%.`,
        predictedClicksGain: Math.round(clicksGain * 30),
        predictedLeadsGain: Math.round(leadsGain * 100) / 100,
        predictedRevenueGain: Math.round(revenueGain * 100) / 100,
        confidenceScore: 58,
        reasoning: `Pos ${position.toFixed(1)} → pos ${targetPosition}: CTR ${(currentCTR * 100).toFixed(1)}% → ${(targetCTR * 100).toFixed(1)}%. ${impressions} impressions/day × CTR gain = +${clicksGain.toFixed(1)} clicks/day = $${revenueGain.toFixed(0)}/month`,
      });
    }
  }

  // 4. Meta Description Rewrite — improves CTR by 8-15%
  if (impressions > 200 && position <= 15) {
    const currentCTR = getCTR(position);
    const improvedCTR = currentCTR * 1.12;
    const clicksGain = impressions * (improvedCTR - currentCTR);
    const leadsGain = (clicksGain / 100) * (convRate / 100) * 30;
    const revenueGain = leadsGain * REVENUE_PER_LEAD;
    if (revenueGain > 25) {
      actions.push({
        pageSlug: slug,
        pageTitle: title,
        actionType: "meta_rewrite",
        actionDetail: `Rewrite meta description for "${title}" to include: (1) Primary keyword in first 10 words, (2) Specific benefit/outcome, (3) Call to action, (4) Social proof element. Max 155 chars.`,
        predictedClicksGain: Math.round(clicksGain * 30),
        predictedLeadsGain: Math.round(leadsGain * 100) / 100,
        predictedRevenueGain: Math.round(revenueGain * 100) / 100,
        confidenceScore: 65,
        reasoning: `${impressions} impressions/day at pos ${position.toFixed(1)}. 12% CTR improvement = +${clicksGain.toFixed(1)} clicks/day = $${revenueGain.toFixed(0)}/month`,
      });
    }
  }

  // 5. FAQ Addition — +20% impressions from featured snippets
  if (impressions > 50 && pageType !== "homepage") {
    const impressionsGain = impressions * 0.20;
    const currentCTR = getCTR(position);
    const clicksGain = impressionsGain * currentCTR;
    const leadsGain = (clicksGain / 100) * (convRate / 100) * 30;
    const revenueGain = leadsGain * REVENUE_PER_LEAD;
    if (revenueGain > 20) {
      actions.push({
        pageSlug: slug,
        pageTitle: title,
        actionType: "faq_addition",
        actionDetail: `Add FAQ section to "${title}" with 5-7 questions targeting "People Also Ask" snippets. Include: "How do I cancel my solar contract?", "Can I get out of a solar lease?", "What are my rights with solar contracts?". Add FAQPage schema markup.`,
        predictedClicksGain: Math.round(clicksGain * 30),
        predictedLeadsGain: Math.round(leadsGain * 100) / 100,
        predictedRevenueGain: Math.round(revenueGain * 100) / 100,
        confidenceScore: 55,
        reasoning: `FAQ schema typically adds 20% impressions via PAA boxes. ${impressions} × 20% = +${impressionsGain.toFixed(0)} impressions/day = $${revenueGain.toFixed(0)}/month`,
      });
    }
  }

  return actions.sort((a, b) => b.predictedRevenueGain - a.predictedRevenueGain);
}

// ─── Main Execution ───────────────────────────────────────────────────────────

export async function runRevenueIntelAgent(
  triggerType: "cron" | "manual" | "directive" | "event" = "cron",
  triggeredBy: string = "system"
): Promise<AgentThinkResult> {
  const context = await startRun("revenue_intel" as any, triggerType, triggeredBy);
  const startTime = Date.now();
  const db = await getDb();

  // Create run record
  let runId = 0;
  if (db) {
    const runResult = await db.insert(revenueIntelRuns).values({
      postsAnalyzed: 0,
      actionsGenerated: 0,
      actionsExecuted: 0,
      totalPredictedRevenueImpact: "0",
      status: "running",
    });
    runId = (runResult as any).insertId || 0;
  }

  try {
    // 1. Get today's goals and context
    const [goals, memory, lessons] = await Promise.all([
      getTodaysGoals("revenue_intel" as any),
      getAllMemory("revenue_intel" as any),
      getLessons("revenue_intel" as any, 10),
    ]);

    // 2. Pull all pages with GSC data
    const pages = db ? await db.select().from(seoPages)
      .where(sql`gscImpressions > 0 OR gscClicks > 0`)
      .orderBy(desc(seoPages.gscImpressions))
      .limit(200) : [];

    // 3. Model metrics and predict actions for every page
    const allActions: PredictedAction[] = [];
    for (const page of pages) {
      const metrics = modelPageMetrics(page);
      const pageActions = predictActions(metrics);
      allActions.push(...pageActions);
    }

    // 4. Sort ALL actions by predicted revenue (highest first)
    allActions.sort((a, b) => b.predictedRevenueGain - a.predictedRevenueGain);

    // 5. Deduplicate by page+actionType (keep highest impact)
    const seen = new Set<string>();
    const dedupedActions = allActions.filter(a => {
      const key = `${a.pageSlug}:${a.actionType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const totalPredictedRevenue = dedupedActions.reduce((s, a) => s + a.predictedRevenueGain, 0);

    // 6. Use LLM to refine top 20 actions and generate execution plans
    const top20 = dedupedActions.slice(0, 20);
    const systemPrompt = `You are the Revenue Intelligence Agent for Solar Freedom (breakyoursolarcontract.com).

Your job: analyze the top predicted revenue actions and determine which ones to EXECUTE NOW vs queue for human review.

BUSINESS CONTEXT:
- Lead value: $275 avg | Booking rate: 40.5% | Revenue per lead: ~$111
- Every action must be justified by a specific dollar amount
- Auto-execute: CTA rewrites, meta rewrites, FAQ additions, title optimizations (no human needed)
- Escalate to Chase: anything requiring legal review, new page creation, or > $5K monthly impact

LESSONS LEARNED:
${formatLessonsForContext(lessons)}

TODAY'S GOALS:
${formatGoalsForContext(goals)}

MEMORY:
${Object.entries(memory).map(([k, v]) => `  ${k}: ${v}`).join("\n") || "  None yet"}

Respond ONLY with valid JSON:
{
  "executionPlan": [
    {
      "pageSlug": "slug",
      "actionType": "cta_rewrite|title_optimization|meta_rewrite|faq_addition|position_push|interlink_injection",
      "priority": "auto_execute|queue_for_review|escalate_to_chase",
      "specificChange": "Exact text/content to change — be specific enough that a developer can implement without asking questions",
      "predictedRevenueGain": 0,
      "reasoning": "Why this makes money"
    }
  ],
  "topInsight": "The single most important revenue insight from today's analysis",
  "totalPredictedMonthlyRevenue": 0,
  "lessons": [
    { "lessonType": "success|failure|observation", "lesson": "What was learned", "impact": "Measured impact" }
  ]
}`;

    const response = await agentLLM({
      agentSlug: "revenue_intel" as any,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `TOP 20 REVENUE ACTIONS (ranked by predicted monthly $ impact):\n\n${top20.map((a, i) =>
            `${i + 1}. [${a.actionType.toUpperCase()}] ${a.pageTitle}\n   Predicted: $${a.predictedRevenueGain.toFixed(0)}/month | Confidence: ${a.confidenceScore}%\n   Action: ${a.actionDetail}\n   Reasoning: ${a.reasoning}`
          ).join("\n\n")}\n\nTotal pages analyzed: ${pages.length} | Total actions generated: ${dedupedActions.length} | Total predicted monthly revenue: $${totalPredictedRevenue.toFixed(0)}\n\nWhich actions should be auto-executed NOW? Which need Chase's review?`,
        },
      ],
      context,
      temperature: 0.1,
      maxTokens: 4000,
    });

    let parsed: {
      executionPlan?: Array<{
        pageSlug: string;
        actionType: string;
        priority: string;
        specificChange: string;
        predictedRevenueGain: number;
        reasoning: string;
      }>;
      topInsight?: string;
      totalPredictedMonthlyRevenue?: number;
      lessons?: Array<{ lessonType: string; lesson: string; impact?: string }>;
    } = {};

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch { parsed = {}; }

    // 7. Save all predictions to DB
    let actionsExecuted = 0;
    if (db) {
      for (const action of dedupedActions.slice(0, 50)) {
        await db.insert(revenueIntelPredictions).values({
          pageSlug: action.pageSlug,
          pageTitle: action.pageTitle,
          actionType: action.actionType,
          actionDetail: action.actionDetail,
          currentLeadsPerMonth: String(action.predictedLeadsGain),
          predictedClicksGain: action.predictedClicksGain,
          predictedLeadsGain: String(action.predictedLeadsGain),
          predictedRevenueGain: String(action.predictedRevenueGain),
          confidenceScore: action.confidenceScore,
          reasoning: action.reasoning,
          status: "queued",
          runId,
        });
      }
    }

    // 8. Create actions for execution plan
    for (const plan of (parsed.executionPlan || [])) {
      if (plan.priority === "auto_execute") {
        // Create an action that the system will execute
        await createAction({
          agentSlug: "revenue_intel" as any,
          priority: "p1",
          title: `[AUTO-EXECUTE] ${plan.actionType}: ${plan.pageSlug}`,
          description: `Revenue Impact: $${plan.predictedRevenueGain}/month\n\nSpecific Change:\n${plan.specificChange}\n\nReasoning: ${plan.reasoning}`,
          actionType: plan.actionType,
          requiresApproval: 0,
          payload: JSON.stringify({ pageSlug: plan.pageSlug, actionType: plan.actionType, change: plan.specificChange }),
        });
        actionsExecuted++;
        context.actionsCreated++;

        // Mark as executing in DB
        if (db) {
          await db.update(revenueIntelPredictions).set({
            status: "executing",
            executedAt: new Date(),
          }).where(and(
            eq(revenueIntelPredictions.pageSlug, plan.pageSlug),
            eq(revenueIntelPredictions.actionType, plan.actionType),
            eq(revenueIntelPredictions.runId, runId)
          ));
        }
      } else if (plan.priority === "escalate_to_chase") {
        await createAction({
          agentSlug: "revenue_intel" as any,
          priority: "p1",
          title: `[CHASE REVIEW] $${plan.predictedRevenueGain}/mo: ${plan.actionType} on ${plan.pageSlug}`,
          description: `Revenue Impact: $${plan.predictedRevenueGain}/month\n\nRecommended Change:\n${plan.specificChange}\n\nReasoning: ${plan.reasoning}`,
          actionType: plan.actionType,
          requiresApproval: 1,
          payload: JSON.stringify({ pageSlug: plan.pageSlug, actionType: plan.actionType, change: plan.specificChange }),
        });
        context.actionsCreated++;
      }
    }

    // 9. Record lessons
    for (const lesson of (parsed.lessons || [])) {
      await addLesson({
        agentSlug: "revenue_intel" as any,
        lessonType: lesson.lessonType as any,
        lesson: lesson.lesson,
        impact: lesson.impact,
      });
    }

    // 10. Update run record
    const durationMs = Date.now() - startTime;
    if (db && runId) {
      await db.update(revenueIntelRuns).set({
        postsAnalyzed: pages.length,
        actionsGenerated: dedupedActions.length,
        actionsExecuted,
        totalPredictedRevenueImpact: String(totalPredictedRevenue.toFixed(2)),
        topAction: dedupedActions[0]?.actionDetail?.substring(0, 500),
        topActionRevenue: String(dedupedActions[0]?.predictedRevenueGain?.toFixed(2) || "0"),
        summary: parsed.topInsight,
        status: "completed",
        durationMs,
      }).where(eq(revenueIntelRuns.id, runId));
    }

    // 11. Update memory
    await setMemory("revenue_intel" as any, "last_run_date", new Date().toISOString().slice(0, 10));
    await setMemory("revenue_intel" as any, "last_total_predicted_revenue", String(totalPredictedRevenue.toFixed(0)));
    await setMemory("revenue_intel" as any, "last_top_action", dedupedActions[0]?.actionType || "none");

    // 12. Record goal outcome
    await recordOutcome({
      agentSlug: "revenue_intel" as any,
      goalType: "revenue_analysis",
      actual: `${pages.length} pages analyzed, ${dedupedActions.length} actions generated, $${totalPredictedRevenue.toFixed(0)} predicted monthly impact`,
      hit: pages.length > 0 && dedupedActions.length > 0,
      notes: parsed.topInsight,
    });

    // 13. Send summary to Manager
    const topActions = dedupedActions.slice(0, 5).map((a, i) =>
      `${i + 1}. $${a.predictedRevenueGain.toFixed(0)}/mo — ${a.actionType} on ${a.pageTitle}`
    ).join("\n");

    await sendMessage({
      fromAgent: "revenue_intel" as any,
      toAgent: "manager",
      type: "report",
      priority: "p1",
      subject: `Revenue Intel Report: $${totalPredictedRevenue.toFixed(0)}/mo identified across ${pages.length} pages`,
      body: `ANALYSIS COMPLETE\n\nPages analyzed: ${pages.length}\nActions generated: ${dedupedActions.length}\nAuto-executing: ${actionsExecuted}\nTotal predicted monthly revenue: $${totalPredictedRevenue.toFixed(0)}\n\nTOP 5 ACTIONS:\n${topActions}\n\nKEY INSIGHT: ${parsed.topInsight || "Analysis complete"}`,
    });
    context.messagesCreated++;

    const summary = `Analyzed ${pages.length} pages. Generated ${dedupedActions.length} revenue actions. Total predicted impact: $${totalPredictedRevenue.toFixed(0)}/month. Auto-executing ${actionsExecuted} actions.`;
    await completeRun(context, summary);
    return { summary, actionsCreated: context.actionsCreated, messagesCreated: context.messagesCreated };

  } catch (error: any) {
    if (db && runId) {
      await db.update(revenueIntelRuns).set({
        status: "failed",
        errorMessage: error.message,
        durationMs: Date.now() - startTime,
      }).where(eq(revenueIntelRuns.id, runId));
    }
    await completeRun(context, `Error: ${error.message}`, "failed", error.message);
    throw error;
  }
}
