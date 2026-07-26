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
import { registerAllAgentCrons, listAgentCrons, deregisterAllAgentCrons } from "./agents/registerCrons";
import { getDb } from "./db";
import { agentMessages, contentPipeline } from "../drizzle/schema";
import { desc, eq, and } from "drizzle-orm";

const agentSlugSchema = z.enum(["money_maker", "seo_intel", "content", "editor", "manager"]);

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
    const agents = await listAgents();
    const recentRuns = await getRunLog(undefined, 10);
    const actions = await getActionQueue({ limit: 10 });
    const pipeline = await getContentPipelineItems();
    return {
      agents,
      recentRuns,
      recentActions: actions,
      pipelinePreview: pipeline,
    };
  }),
});
