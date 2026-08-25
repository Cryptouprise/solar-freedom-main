/**
 * Agent System tRPC Router
 * Provides admin endpoints for managing, monitoring, and triggering agents.
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  runAgent,
  runAllAgents,
  seedAgents,
  listAgents,
  getAgent,
  getActionQueue,
  updateAction,
  getRunLog,
  getUnreadMessages,
  sendMessage,
  getContentPipelineItems,
  getRevenueStats,
  type AgentSlug,
} from "./agents";
import { registerAllAgentCrons, listAgentCrons, deregisterAllAgentCrons, reconcileDailyOperatingCycle } from "./agents/registerCrons";
import { buildAgentScheduleHealth, buildSeoMeasurementHealth } from "./agents/scheduleHealth";
import { getDb } from "./db";
import { agentMessages, contentPipeline, agentHealthLog, systemChangeLog, mediumArticles, discoveredBacklinks, agentModelConfig, agentActions, attorneyProspects, agentChatThreads, agentDailyChecklists, agentQualityReviews, seoPages, seoScorecardSnapshots } from "../drizzle/schema";
import { getAgentModel, seedDefaultModelConfigs, AGENT_DEFAULT_MODELS, AVAILABLE_MODELS, callAgentLLM } from "./agents/agentLLM";
import { desc, eq, and, gte } from "drizzle-orm";
import { buildLinkedInLookupUrl, reviewAttorneyQuality } from "./attorneyQuality";
import { invokeLLM } from "./_core/llm";

const agentSlugSchema = z.enum(["money_maker", "seo_intel", "content", "editor", "manager", "infra", "revenue_intel"]);

export const agentRouter = router({
  /**
   * Seed/initialize all agents in the database.
   */
  seed: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    await seedAgents();
    return { success: true };
  }),

  /**
   * List all agents with their status and stats.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    return listAgents();
  }),

  /**
   * Get a single agent's details.
   */
  get: protectedProcedure
    .input(z.object({ slug: agentSlugSchema }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      return getAgent(input.slug);
    }),

  /**
   * Manually trigger a specific agent.
   */
  trigger: protectedProcedure
    .input(z.object({ slug: agentSlugSchema }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const result = await runAgent(input.slug, "manual", ctx.user.name || "admin");
      return result;
    }),

  /**
   * Run all agents in sequence.
   */
  triggerAll: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    const results = await runAllAgents(ctx.user.name || "admin");
    return results;
  }),

  /**
   * Get the action queue (filterable).
   */
  actions: protectedProcedure
    .input(z.object({
      status: z.enum(["queued", "running", "completed", "failed", "blocked", "approved", "rejected"]).optional(),
      agentSlug: agentSlugSchema.optional(),
      limit: z.number().min(1).max(200).default(50),
    }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      return getActionQueue({
        status: input?.status,
        agentSlug: input?.agentSlug,
        limit: input?.limit,
      });
    }),

  /**
   * Approve or reject an action.
   */
  decideAction: protectedProcedure
    .input(z.object({
      actionId: z.number(),
      decision: z.enum(["approved", "rejected"]),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      await updateAction(input.actionId, {
        status: input.decision,
        approvedBy: ctx.user.name || "admin",
        approvedAt: new Date(),
        result: input.reason || `${input.decision} by ${ctx.user.name}`,
      });
      return { success: true };
    }),

  /**
   * Get agent run history.
   */
  runs: protectedProcedure
    .input(z.object({
      agentSlug: agentSlugSchema.optional(),
      limit: z.number().min(1).max(100).default(20),
    }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      return getRunLog(input?.agentSlug, input?.limit);
    }),

  /**
   * Get inter-agent messages.
   */
  messages: protectedProcedure
    .input(z.object({
      agentSlug: agentSlugSchema.optional(),
      limit: z.number().min(1).max(100).default(30),
    }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = await getDb();
      if (!db) return [];
      let query = db.select().from(agentMessages).orderBy(desc(agentMessages.createdAt)).limit(input?.limit || 30);
      if (input?.agentSlug) {
        return db.select().from(agentMessages)
          .where(eq(agentMessages.toAgent, input.agentSlug))
          .orderBy(desc(agentMessages.createdAt))
          .limit(input?.limit || 30);
      }
      return query;
    }),

  /**
   * Get content pipeline items.
   */
  pipeline: protectedProcedure
    .input(z.object({
      stage: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
    }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      return getContentPipelineItems(input?.stage);
    }),

  /**
   * Get revenue stats.
   */
  revenue: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    return getRevenueStats();
  }),

  /**
   * Register all agent cron jobs with Heartbeat.
   */
  registerCrons: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    return registerAllAgentCrons();
  }),

  /**
   * List registered agent cron jobs.
   */
  listCrons: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    return listAgentCrons();
  }),

  /**
   * Deregister all agent cron jobs.
   */
  deregisterCrons: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    return deregisterAllAgentCrons();
  }),

  /**
   * Get system overview (all agents + recent activity).
   */
  overview: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    const db = await getDb();
    const [agents, recentRuns, actions, pipeline, registeredCrons, seoMeasurements] = await Promise.all([
      listAgents(),
      getRunLog(undefined, 10),
      getActionQueue({ limit: 10 }),
      getContentPipelineItems(),
      listAgentCrons(),
      db
        ? db.select({
          gscLastChecked: seoPages.gscLastChecked,
          gscClicks: seoPages.gscClicks,
          gscImpressions: seoPages.gscImpressions,
        }).from(seoPages).limit(500)
        : Promise.resolve([]),
    ]);
    return {
      agents,
      recentRuns,
      recentActions: actions,
      pipelinePreview: pipeline,
      scheduleHealth: buildAgentScheduleHealth(agents, registeredCrons),
      seoMeasurementHealth: buildSeoMeasurementHealth(seoMeasurements),
    };
  }),

  /** Returns an alert only when two verified SEO scorecards show material movement. */
  seoRankingAlert: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    const db = await getDb();
    if (!db) return { significant: false, reason: "Database unavailable" };
    const snapshots = await db.select({
      capturedAt: seoScorecardSnapshots.capturedAt,
      clicks: seoScorecardSnapshots.clicks,
      impressions: seoScorecardSnapshots.impressions,
      pageRows: seoScorecardSnapshots.pageRows,
    }).from(seoScorecardSnapshots).orderBy(desc(seoScorecardSnapshots.capturedAt)).limit(2);
    if (snapshots.length < 2) return { significant: false, reason: "Awaiting a second verified SEO snapshot" };
    const [latest, previous] = snapshots;
    const clickDelta = latest.clicks - previous.clicks;
    const impressionDelta = latest.impressions - previous.impressions;
    const clickPct = previous.clicks > 0 ? (clickDelta / previous.clicks) * 100 : 0;
    const impressionPct = previous.impressions > 0 ? (impressionDelta / previous.impressions) * 100 : 0;
    const significant = (Math.abs(clickDelta) >= 3 && Math.abs(clickPct) >= 15)
      || (Math.abs(impressionDelta) >= 50 && Math.abs(impressionPct) >= 15);
    const direction = (clickDelta >= 0 && impressionDelta >= 0) ? "up" : (clickDelta <= 0 && impressionDelta <= 0) ? "down" : "mixed";
    return {
      significant,
      direction,
      latestCapturedAt: latest.capturedAt,
      comparedToCapturedAt: previous.capturedAt,
      clicks: { current: latest.clicks, previous: previous.clicks, delta: clickDelta, percent: Number(clickPct.toFixed(1)) },
      impressions: { current: latest.impressions, previous: previous.impressions, delta: impressionDelta, percent: Number(impressionPct.toFixed(1)) },
      measuredPages: latest.pageRows,
    };
  }),

  /**
   * Chat with a specific agent — real AI response using the agent's model and persona.
   * Accepts a conversation history and returns the agent's reply.
   */
  chat: protectedProcedure
    .input(z.object({
      slug: agentSlugSchema,
      messages: z.array(z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");

      const AGENT_PERSONAS: Record<string, string> = {
        content: `You are the Content Agent for Solar Freedom (breakyoursolarcontract.com). Your job is to write content that ranks #1 on Google and converts distressed solar homeowners into leads. You are an expert in solar contract law, consumer protection, and SEO. When asked to write an article, you write a full 2,500+ word article with proper structure, state-specific legal citations, and strong CTAs. You are direct, confident, and focused on revenue. Phone: (904) 921-4971. Never claim to be attorneys. Always say "consumer protection advocates" or "case specialists".`,
        seo_intel: `You are the SEO Intelligence Agent for Solar Freedom. You monitor Google rankings, analyze competitor content, identify high-value keywords, and give strategic recommendations on what content to create next. You have deep knowledge of solar company complaint trends, BBB data, CFPB complaints, and what homeowners search for when they're trapped in bad solar contracts. You think in terms of search volume, keyword difficulty, and revenue potential per article.`,
        money_maker: `You are the Money Maker Agent for Solar Freedom. You analyze leads, identify high-value prospects, track revenue metrics, and make recommendations on how to maximize case value. You know which solar companies have the most complaints, which states have the strongest consumer protection laws, and which leads are most likely to convert to attorney referrals. You think in dollars — every decision is about maximizing revenue.`,
        editor: `You are the Editor Agent for Solar Freedom. You review content for SEO quality, legal compliance, conversion effectiveness, and E-E-A-T signals. You score articles on a 100-point scale across 4 dimensions: SEO (25pts), Readability (25pts), Conversion (25pts), Compliance (25pts). You give specific, actionable feedback on how to improve each article. You are tough but fair.`,
        manager: `You are the Manager Agent for Solar Freedom — the CEO of the autonomous agent system. You have final authority over all agent decisions. You approve or reject content, coordinate between agents, set strategic priorities, and ensure the entire system is focused on revenue. You think at the system level: which agents are performing, what's the bottleneck, what should we do next week.`,
        infra: `You are the Infrastructure Agent for Solar Freedom. You monitor the health of all 6 agents, track system costs, detect errors, and recommend improvements. You have visibility into every agent's run history, error rates, LLM costs, and action completion rates. You are the system's immune system — you find problems before they become crises and propose solutions.`,
      };

      const systemPrompt = AGENT_PERSONAS[input.slug] || AGENT_PERSONAS.manager;

      // Build messages with system prompt prepended
      const fullMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: systemPrompt },
        ...input.messages.filter(m => m.role !== "system"),
      ];

      const completion = await callAgentLLM({
        agentSlug: input.slug,
        messages: fullMessages,
        maxTokens: 2000,
      });

      const reply = completion.content;
      const db = await getDb();
      if (db) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        const lastUserMessage = [...input.messages].reverse().find(message => message.role === "user");
        if (lastUserMessage) {
          await db.insert(agentChatThreads).values({
            agentSlug: input.slug,
            role: "user",
            message: lastUserMessage.content,
            messageType: "directive",
            metadata: JSON.stringify({ source: "agent_command" }),
            createdAt: new Date(),
            expiresAt,
          });
        }
        await db.insert(agentChatThreads).values({
          agentSlug: input.slug,
          role: "agent",
          message: reply,
          messageType: "result",
          metadata: JSON.stringify({ source: "agent_command", model: await getAgentModel(input.slug) }),
          createdAt: new Date(),
          expiresAt,
        });
      }

      return { reply };
    }),

  /**
   * Get Infrastructure Agent data: health logs, change log, Medium backlinks.
   */
  infraStatus: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    const db = await getDb();
    if (!db) return { healthLogs: [], changeLogs: [], mediumArticles: [], backlinks: [], costSummary: null };

    // Recent health logs (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const healthLogs = await db
      .select()
      .from(agentHealthLog)
      .orderBy(desc(agentHealthLog.createdAt))
      .limit(50);

    // Recent system changes
    const changeLogs = await db
      .select()
      .from(systemChangeLog)
      .orderBy(desc(systemChangeLog.createdAt))
      .limit(30);

    // Medium articles with crawl status
    const mediumArticleList = await db
      .select()
      .from(mediumArticles)
      .orderBy(desc(mediumArticles.updatedAt))
      .limit(30);

    // Recent discovered backlinks from Medium
    const backlinkList = await db
      .select()
      .from(discoveredBacklinks)
      .where(eq(discoveredBacklinks.sourceType, "medium"))
      .orderBy(desc(discoveredBacklinks.firstDiscoveredAt))
      .limit(50);

    return {
      healthLogs,
      changeLogs,
      mediumArticles: mediumArticleList,
      backlinks: backlinkList,
    };
  }),

  /**
   * Get model configs for all agents.
   */
  getModelConfigs: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    const db = await getDb();
    if (!db) return [];
    const configs = await db.select().from(agentModelConfig);
    const slugs = ["manager", "revenue_intel", "content", "seo_intel", "editor", "money_maker", "infra"] as const;
    return slugs.map(slug => {
      const saved = configs.find(c => c.agentSlug === slug);
      const modelId = saved?.modelId ?? AGENT_DEFAULT_MODELS[slug as keyof typeof AGENT_DEFAULT_MODELS] ?? "gpt-5-mini";
      const catalog = AVAILABLE_MODELS.find((m: any) => m.id === modelId);
      return {
        agentSlug: slug,
        modelId,
        modelLabel: saved?.modelLabel ?? catalog?.label ?? modelId,
        isDefault: !saved,
      };
    });
  }),

  /**
   * Update model config for a specific agent.
   */
  updateModelConfig: protectedProcedure
    .input(z.object({
      agentSlug: z.string(),
      modelId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const catalog = AVAILABLE_MODELS.find((m: any) => m.id === input.modelId);
      const modelLabel = catalog?.label ?? input.modelId;
      await db.insert(agentModelConfig).values({
        agentSlug: input.agentSlug,
        modelId: input.modelId,
        modelLabel,
        updatedAt: new Date(),
      }).onDuplicateKeyUpdate({
        set: { modelId: input.modelId, modelLabel, updatedAt: new Date() },
      });
      return { success: true, agentSlug: input.agentSlug, modelId: input.modelId, modelLabel };
    }),

  /**
   * Seed default model configs for all agents.
   */
  seedModelConfigs: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    await seedDefaultModelConfigs();
    return { success: true };
  }),

  /**
   * Get the full model catalog.
   */
  getModelCatalog: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    return AVAILABLE_MODELS;
  }),

  /**
   * Dismiss an action (marks as rejected so it leaves the queue).
   */
  dismissAction: protectedProcedure
    .input(z.object({ actionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      await updateAction(input.actionId, {
        status: "rejected",
        result: `Dismissed by ${ctx.user.name || "admin"} at ${new Date().toISOString()}`,
        completedAt: new Date(),
      });
      return { success: true };
    }),

  /**
   * Mark an action as manually completed.
   */
  markActionDone: protectedProcedure
    .input(z.object({ actionId: z.number(), note: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      await updateAction(input.actionId, {
        status: "completed",
        result: input.note || `Manually completed by ${ctx.user.name || "admin"} at ${new Date().toISOString()}`,
        completedAt: new Date(),
      });
      return { success: true };
    }),

  /**
   * Execute an action where an execution adapter is available.  Each run stores
   * its evidence on the action instead of leaving a permanent opaque "queued" row.
   */
  executeAction: protectedProcedure
    .input(z.object({ actionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const action = (await db.select().from(agentActions)
        .where(eq(agentActions.id, input.actionId)).limit(1))[0];
      if (!action) throw new Error("Action not found");
      if (action.requiresApproval && action.status !== "approved") {
        throw new Error("This action needs approval before it can run");
      }

      const startedAt = new Date();
      await db.update(agentActions).set({ status: "running", startedAt, errorMessage: null })
        .where(eq(agentActions.id, input.actionId));

      try {
        let result: unknown;
        if (action.actionType === "research_firm") {
          const { executeAttorneyResearch } = await import("./agents/attorneyResearch");
          const payload = action.payload ? JSON.parse(action.payload) : {};
          const states = Array.isArray(payload.states) && payload.states.length
            ? payload.states.slice(0, 5)
            : ["California", "Texas", "Florida"];
          result = await executeAttorneyResearch(states);
        } else {
          throw new Error(`No safe execution adapter is configured for ${action.actionType}. This remains a planning task until its integration is connected.`);
        }

        const researchBlocked = typeof result === "object" && result !== null && "status" in result && (result as { status?: string }).status === "blocked";
        await db.update(agentActions).set({
          status: researchBlocked ? "blocked" : "completed",
          result: JSON.stringify(result),
          completedAt: new Date(),
          durationMs: Date.now() - startedAt.getTime(),
        }).where(eq(agentActions.id, input.actionId));
        return { success: !researchBlocked, blocked: researchBlocked, result };
      } catch (error: any) {
        await db.update(agentActions).set({
          status: "failed",
          errorMessage: error.message || "Execution failed",
          retryCount: (action.retryCount || 0) + 1,
          completedAt: new Date(),
          durationMs: Date.now() - startedAt.getTime(),
        }).where(eq(agentActions.id, input.actionId));
        throw error;
      }
    }),

  /** List scored attorney prospects for the attorney pipeline board. */
  listAttorneys: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    const db = await getDb();
    if (!db) return [];
    return db.select().from(attorneyProspects)
      .orderBy(desc(attorneyProspects.overallScore))
      .limit(250);
  }),

  /** Move a prospect through the human-controlled attorney partnership pipeline. */
  updateAttorney: protectedProcedure
    .input(z.object({
      id: z.number(),
      outreachStatus: z.enum(["not_contacted", "researching", "ready_to_pitch", "pitched", "in_conversation", "signed", "rejected", "not_interested"]),
      outreachNotes: z.string().max(10_000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.update(attorneyProspects).set({
        outreachStatus: input.outreachStatus,
        outreachNotes: input.outreachNotes,
        lastContactedAt: ["pitched", "in_conversation"].includes(input.outreachStatus) ? new Date() : undefined,
        updatedAt: new Date(),
      }).where(eq(attorneyProspects.id, input.id));
      return { success: true };
    }),

  /** Run a bounded, evidence-only partner-quality review for one prospect. */
  reviewAttorneyQuality: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const prospect = (await db.select().from(attorneyProspects).where(eq(attorneyProspects.id, input.id)).limit(1))[0];
      if (!prospect) throw new Error("Attorney prospect not found");
      const review = await reviewAttorneyQuality({
        firmName: prospect.firmName,
        state: prospect.state,
        city: prospect.city,
        website: prospect.website,
        phone: prospect.phone,
        practiceAreas: prospect.practiceAreas,
        sourceUrl: prospect.sourceUrl,
        discoveredVia: prospect.discoveredVia,
      });
      const linkedInSearchUrl = prospect.linkedInSearchUrl || buildLinkedInLookupUrl(prospect.firmName, prospect.state);
      await db.update(attorneyProspects).set({
        overallScore: review.score,
        scoreBreakdown: JSON.stringify(review.scoreBreakdown),
        qualityTier: review.tier,
        qualityConfidence: review.confidence,
        qualityExplanation: review.explanation,
        qualityGates: JSON.stringify(review.gates),
        qualityReviewedAt: new Date(),
        pitchAngle: review.suggestedPitch,
        linkedInSearchUrl,
        linkedInResearchStatus: "research_ready",
        updatedAt: new Date(),
      }).where(eq(attorneyProspects.id, input.id));
      return { success: true, review, linkedInSearchUrl };
    }),

  /** Create a personalized LinkedIn introduction for review. It never sends a message. */
  draftLinkedInOutreach: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const prospect = (await db.select().from(attorneyProspects).where(eq(attorneyProspects.id, input.id)).limit(1))[0];
      if (!prospect) throw new Error("Attorney prospect not found");
      if (!prospect.qualityReviewedAt || prospect.qualityTier === "defer") {
        throw new Error("Run the quality review and address its gates before drafting outreach.");
      }
      const response = await invokeLLM({
        model: "claude-sonnet-4-6",
        maxTokens: 700,
        messages: [{
          role: "system",
          content: "Write a concise, respectful LinkedIn connection note for a possible B2B law-firm partnership. Do not claim the recipient handles solar cases, accepts referrals, or has a particular role unless those facts were provided. Do not promise leads. Ask whether they are open to a brief conversation about consumer/solar-contract dispute appointments in their service area. Output the note only, under 500 characters.",
        }, {
          role: "user",
          content: JSON.stringify({ firmName: prospect.firmName, state: prospect.state, city: prospect.city, publicPracticeSignal: prospect.practiceAreas, pitchAngle: prospect.pitchAngle }),
        }],
      });
      const content = response.choices[0]?.message.content;
      if (typeof content !== "string" || !content.trim()) throw new Error("Draft generation returned no usable content");
      const draft = content.trim().slice(0, 500);
      await db.update(attorneyProspects).set({
        linkedInDraft: draft,
        linkedInOutreachStatus: "drafted",
        updatedAt: new Date(),
      }).where(eq(attorneyProspects.id, input.id));
      return { success: true, draft };
    }),

  /** Record an owner-verified LinkedIn profile or research outcome without scraping LinkedIn. */
  updateLinkedInResearch: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["not_started", "research_ready", "verified", "not_found"]),
      profileUrl: z.string().url().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.update(attorneyProspects).set({
        linkedInResearchStatus: input.status,
        linkedInProfileUrl: input.profileUrl,
        updatedAt: new Date(),
      }).where(eq(attorneyProspects.id, input.id));
      return { success: true };
    }),

  /** Owner approval unlocks a draft for external sending; the platform still sends nothing. */
  approveLinkedInOutreach: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const prospect = (await db.select().from(attorneyProspects).where(eq(attorneyProspects.id, input.id)).limit(1))[0];
      if (!prospect?.linkedInDraft) throw new Error("Create and review a LinkedIn draft before approving it.");
      await db.update(attorneyProspects).set({
        linkedInOutreachStatus: "approved",
        outreachApprovedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(attorneyProspects.id, input.id));
      return { success: true };
    }),

  /** Run verified attorney prospect research manually for selected states. */
  runAttorneyResearch: protectedProcedure
    .input(z.object({ states: z.array(z.string()).min(1).max(5) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const { executeAttorneyResearch } = await import("./agents/attorneyResearch");
      return executeAttorneyResearch(input.states);
    }),

  /** Return the persistent 30-day evidence trail for an agent. */
  chatThreads: protectedProcedure
    .input(z.object({ agentSlug: agentSlugSchema, limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = await getDb();
      if (!db) return [];
      return db.select().from(agentChatThreads)
        .where(and(eq(agentChatThreads.agentSlug, input.agentSlug), gte(agentChatThreads.expiresAt, new Date())))
        .orderBy(desc(agentChatThreads.createdAt))
        .limit(input.limit);
    }),

  /** Reconcile Heartbeat to the single daily 8:00 AM America/Denver Manager cycle. */
  reconcileDailySchedule: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    return reconcileDailyOperatingCycle();
  }),

  /** Return today’s manager-owned checklist and QA decisions for the operating cycle. */
  dailyQuality: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    const db = await getDb();
    if (!db) return { date: null, checklists: [], reviews: [] };
    const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Denver" }).format(new Date());
    const [checklists, reviews] = await Promise.all([
      db.select().from(agentDailyChecklists).where(eq(agentDailyChecklists.date, date)).orderBy(desc(agentDailyChecklists.createdAt)),
      db.select().from(agentQualityReviews).where(eq(agentQualityReviews.date, date)).orderBy(desc(agentQualityReviews.createdAt)),
    ]);
    return { date, checklists, reviews };
  }),

  /** Preview a DND-protected owner-authorized contact payload; does not write to Assistable. */
  assistableContactDryRun: protectedProcedure
    .input(z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      companyName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const { buildAssistableContactDryRun } = await import("./assistableClient");
      return buildAssistableContactDryRun(input);
    }),

  /** Read-only Assistable v3 health check. It does not create contacts or send anything. */
  testAssistableConnection: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    const { testAssistableConnection } = await import("./assistableClient");
    return testAssistableConnection();
  }),
});
