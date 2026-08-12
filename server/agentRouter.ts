/**
 * Agent System tRPC Router
 * Provides admin endpoints for managing, monitoring, and triggering agents.
 */

import { z } from "zod";
import { parse as parseCookie } from "cookie";
import { protectedProcedure, router } from "./_core/trpc";
import { COOKIE_NAME } from "@shared/const";
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
import { registerAllAgentCrons, listAgentCrons, deregisterAllAgentCrons } from "./agents/registerCrons";
import { buildAgentScheduleHealth, buildSeoMeasurementHealth } from "./agents/scheduleHealth";
import { getDb } from "./db";
import { agentMessages, contentPipeline, agentHealthLog, systemChangeLog, mediumArticles, discoveredBacklinks, agentModelConfig, seoPages } from "../drizzle/schema";
import { getAgentModel, seedDefaultModelConfigs, AGENT_DEFAULT_MODELS, AVAILABLE_MODELS } from "./agents/agentLLM";
import { desc, eq, and, gte } from "drizzle-orm";

const agentSlugSchema = z.enum(["money_maker", "seo_intel", "content", "editor", "manager", "infra", "revenue_intel"]);

function getSessionToken(cookieHeader: string | undefined): string {
  return parseCookie(cookieHeader ?? "")[COOKIE_NAME] ?? "";
}

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
    return registerAllAgentCrons(getSessionToken(ctx.req.headers.cookie));
  }),

  /**
   * List registered agent cron jobs.
   */
  listCrons: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    return listAgentCrons(getSessionToken(ctx.req.headers.cookie));
  }),

  /**
   * Deregister all agent cron jobs.
   */
  deregisterCrons: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    return deregisterAllAgentCrons(getSessionToken(ctx.req.headers.cookie));
  }),

  /**
   * Get system overview (all agents + recent activity).
   */
  overview: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    const db = await getDb();
    const sessionToken = getSessionToken(ctx.req.headers.cookie);
    const [agents, recentRuns, actions, pipeline, registeredCrons, seoMeasurements] = await Promise.all([
      listAgents(),
      getRunLog(undefined, 10),
      getActionQueue({ limit: 10 }),
      getContentPipelineItems(),
      listAgentCrons(sessionToken),
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

      const { callLLM } = await import("./cron/aiCostTracker");

      const AGENT_MODELS: Record<string, string> = {
        infra:       "anthropic/claude-opus-5",
        money_maker: "deepseek/deepseek-v4-pro",
        seo_intel:   "anthropic/claude-opus-5",
        content:     "anthropic/claude-opus-5",
        editor:      "anthropic/claude-opus-5",
        manager:     "anthropic/claude-opus-5",
      };

      const AGENT_PERSONAS: Record<string, string> = {
        content: `You are the Content Agent for Solar Freedom (breakyoursolarcontract.com). Your job is to write content that ranks #1 on Google and converts distressed solar homeowners into leads. You are an expert in solar contract law, consumer protection, and SEO. When asked to write an article, you write a full 2,500+ word article with proper structure, state-specific legal citations, and strong CTAs. You are direct, confident, and focused on revenue. Phone: (904) 921-4971. Never claim to be attorneys. Always say "consumer protection advocates" or "case specialists".`,
        seo_intel: `You are the SEO Intelligence Agent for Solar Freedom. You monitor Google rankings, analyze competitor content, identify high-value keywords, and give strategic recommendations on what content to create next. You have deep knowledge of solar company complaint trends, BBB data, CFPB complaints, and what homeowners search for when they're trapped in bad solar contracts. You think in terms of search volume, keyword difficulty, and revenue potential per article.`,
        money_maker: `You are the Money Maker Agent for Solar Freedom. You analyze leads, identify high-value prospects, track revenue metrics, and make recommendations on how to maximize case value. You know which solar companies have the most complaints, which states have the strongest consumer protection laws, and which leads are most likely to convert to attorney referrals. You think in dollars — every decision is about maximizing revenue.`,
        editor: `You are the Editor Agent for Solar Freedom. You review content for SEO quality, legal compliance, conversion effectiveness, and E-E-A-T signals. You score articles on a 100-point scale across 4 dimensions: SEO (25pts), Readability (25pts), Conversion (25pts), Compliance (25pts). You give specific, actionable feedback on how to improve each article. You are tough but fair.`,
        manager: `You are the Manager Agent for Solar Freedom — the CEO of the autonomous agent system. You have final authority over all agent decisions. You approve or reject content, coordinate between agents, set strategic priorities, and ensure the entire system is focused on revenue. You think at the system level: which agents are performing, what's the bottleneck, what should we do next week.`,
        infra: `You are the Infrastructure Agent for Solar Freedom. You monitor the health of all 6 agents, track system costs, detect errors, and recommend improvements. You have visibility into every agent's run history, error rates, LLM costs, and action completion rates. You are the system's immune system — you find problems before they become crises and propose solutions.`,
      };

      const systemPrompt = AGENT_PERSONAS[input.slug] || AGENT_PERSONAS.manager;
      const model = AGENT_MODELS[input.slug] || "anthropic/claude-opus-5";

      // Build messages with system prompt prepended
      const fullMessages = [
        { role: "system", content: systemPrompt },
        ...input.messages.filter(m => m.role !== "system"),
      ];

      const reply = await callLLM({
        model,
        messages: fullMessages,
        feature: `agent_chat_${input.slug}`,
        referenceId: 0,
        referenceType: "agent_chat",
        temperature: 0.7,
        maxTokens: 2000,
      });

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
});
