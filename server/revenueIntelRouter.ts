/**
 * Revenue Intel Router
 * Exposes data from revenueIntelPredictions, revenueIntelRuns, and revenueTracker
 * for the /admin/revenue-intel dashboard.
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  revenueIntelPredictions,
  revenueIntelRuns,
  revenueTracker,
} from "../drizzle/schema";
import { desc, eq, sql, and, gte, lte, sum } from "drizzle-orm";

export const revenueIntelRouter = router({
  /**
   * Get the latest Revenue Intel run summary + top predictions.
   */
  getLatestRun: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    const db = await getDb();
    if (!db) return null;

    const [latestRun] = await db
      .select()
      .from(revenueIntelRuns)
      .orderBy(desc(revenueIntelRuns.runAt))
      .limit(1);

    return latestRun || null;
  }),

  /**
   * Get all Revenue Intel runs (for run history chart).
   */
  getRuns: protectedProcedure
    .input(z.object({ limit: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(revenueIntelRuns)
        .orderBy(desc(revenueIntelRuns.runAt))
        .limit(input.limit);
    }),

  /**
   * Get top revenue predictions sorted by predicted revenue gain.
   */
  getTopPredictions: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      status: z.enum(["queued", "executing", "done", "skipped", "failed", "all"]).default("all"),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = await getDb();
      if (!db) return [];

      const query = db
        .select()
        .from(revenueIntelPredictions)
        .orderBy(desc(revenueIntelPredictions.predictedRevenueGain))
        .limit(input.limit);

      if (input.status !== "all") {
        return db
          .select()
          .from(revenueIntelPredictions)
          .where(eq(revenueIntelPredictions.status, input.status))
          .orderBy(desc(revenueIntelPredictions.predictedRevenueGain))
          .limit(input.limit);
      }

      return query;
    }),

  /**
   * Get revenue summary stats: total predicted, total actual, by action type.
   */
  getSummaryStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    const db = await getDb();
    if (!db) return null;

    const [totals] = await db
      .select({
        totalPredictedRevenue: sql<string>`COALESCE(SUM(predictedRevenueGain), 0)`,
        totalActualRevenue: sql<string>`COALESCE(SUM(actualRevenueGain), 0)`,
        totalPredictedLeads: sql<string>`COALESCE(SUM(predictedLeadsGain), 0)`,
        totalActualLeads: sql<string>`COALESCE(SUM(actualLeadsGain), 0)`,
        totalActions: sql<number>`COUNT(*)`,
        queuedActions: sql<number>`SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END)`,
        doneActions: sql<number>`SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END)`,
      })
      .from(revenueIntelPredictions);

    // Revenue tracker totals
    const [revTrackerTotals] = await db
      .select({
        totalInvoiced: sql<string>`COALESCE(SUM(CASE WHEN status IN ('invoiced', 'paid') THEN amount ELSE 0 END), 0)`,
        totalPaid: sql<string>`COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0)`,
        totalOverdue: sql<string>`COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END), 0)`,
        totalPending: sql<string>`COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0)`,
      })
      .from(revenueTracker);

    return {
      predictions: totals,
      tracker: revTrackerTotals,
    };
  }),

  /**
   * Get predictions grouped by action type (for bar chart).
   */
  getByActionType: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    const db = await getDb();
    if (!db) return [];

    return db
      .select({
        actionType: revenueIntelPredictions.actionType,
        count: sql<number>`COUNT(*)`,
        totalPredictedRevenue: sql<string>`COALESCE(SUM(predictedRevenueGain), 0)`,
        avgConfidence: sql<number>`AVG(confidenceScore)`,
      })
      .from(revenueIntelPredictions)
      .groupBy(revenueIntelPredictions.actionType)
      .orderBy(desc(sql`SUM(predictedRevenueGain)`));
  }),

  /**
   * Get predictions by page (for top pages chart).
   */
  getByPage: protectedProcedure
    .input(z.object({ limit: z.number().default(15) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = await getDb();
      if (!db) return [];

      return db
        .select({
          pageSlug: revenueIntelPredictions.pageSlug,
          pageTitle: revenueIntelPredictions.pageTitle,
          totalPredictedRevenue: sql<string>`COALESCE(SUM(predictedRevenueGain), 0)`,
          totalPredictedLeads: sql<string>`COALESCE(SUM(predictedLeadsGain), 0)`,
          actionCount: sql<number>`COUNT(*)`,
          currentClicks: sql<number>`MAX(currentClicks)`,
          currentImpressions: sql<number>`MAX(currentImpressions)`,
        })
        .from(revenueIntelPredictions)
        .groupBy(revenueIntelPredictions.pageSlug, revenueIntelPredictions.pageTitle)
        .orderBy(desc(sql`SUM(predictedRevenueGain)`))
        .limit(input.limit);
    }),

  /**
   * Get revenue tracker entries (actual invoices/payments).
   */
  getRevenueTracker: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(revenueTracker)
        .orderBy(desc(revenueTracker.createdAt))
        .limit(input.limit);
    }),

  /**
   * Get revenue tracker grouped by month (for trend chart).
   */
  getRevenueByMonth: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    const db = await getDb();
    if (!db) return [];

    return db
      .select({
        month: sql<string>`DATE_FORMAT(createdAt, '%Y-%m')`,
        invoiced: sql<string>`COALESCE(SUM(CASE WHEN status IN ('invoiced', 'paid') THEN amount ELSE 0 END), 0)`,
        paid: sql<string>`COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(revenueTracker)
      .groupBy(sql`DATE_FORMAT(createdAt, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(createdAt, '%Y-%m')`);
  }),

  /**
   * Mark a prediction as executed (admin action).
   */
  markExecuted: protectedProcedure
    .input(z.object({
      id: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      await db
        .update(revenueIntelPredictions)
        .set({
          status: "done",
          executedAt: new Date(),
          executionNotes: input.notes || "Manually executed by admin",
          updatedAt: new Date(),
        })
        .where(eq(revenueIntelPredictions.id, input.id));

      return { success: true };
    }),
});
