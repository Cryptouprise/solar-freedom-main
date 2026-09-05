import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import {
  cityRecoveryPayloadSchema,
  getCityRecoveryWorkspace,
  getPublishedCityRecovery,
  listCityRecoveryTargets,
  publishCityRecovery,
  reviewCityRecovery,
  rollbackCityRecovery,
  saveCityRecoveryDraft,
} from "./cityRecovery";

export const cityRecoveryRouter = router({
  published: publicProcedure
    .input(z.object({ slug: z.string().trim().min(1).max(255) }))
    .query(({ input }) => getPublishedCityRecovery(input.slug)),

  targets: adminProcedure.query(() => listCityRecoveryTargets()),

  workspace: adminProcedure
    .input(z.object({ slug: z.string().trim().min(1).max(255) }))
    .query(({ input }) => getCityRecoveryWorkspace(input.slug)),

  saveDraft: adminProcedure
    .input(z.object({
      id: z.number().int().positive().optional(),
      slug: z.string().trim().min(1).max(255),
      payload: cityRecoveryPayloadSchema,
    }))
    .mutation(({ ctx, input }) => saveCityRecoveryDraft({
      ...input,
      actor: ctx.user.openId,
    })),

  review: adminProcedure
    .input(z.object({
      id: z.number().int().positive(),
      decision: z.enum(["approve", "revision_needed", "reject"]),
      feedback: z.string().trim().min(3).max(5_000),
    }))
    .mutation(({ ctx, input }) => reviewCityRecovery({
      ...input,
      actor: ctx.user.openId,
    })),

  publish: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ ctx, input }) => {
      if (!ENV.ownerOpenId || ctx.user.openId !== ENV.ownerOpenId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the configured owner can publish city pages." });
      }
      return publishCityRecovery(input.id, ctx.user.openId);
    }),

  rollback: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ ctx, input }) => {
      if (!ENV.ownerOpenId || ctx.user.openId !== ENV.ownerOpenId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the configured owner can roll back city pages." });
      }
      return rollbackCityRecovery(input.id, ctx.user.openId);
    }),
});
