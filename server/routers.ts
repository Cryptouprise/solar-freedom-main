import { COOKIE_NAME, SITE_CONFIG_DEFAULTS } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getLeads,
  insertExitIntentCapture,
  insertLead,
  markLeadGhlSent,
  updateLeadStatus,
  getDbBlogPosts,
  getDbBlogPost,
  getDbCompanies,
  getDbCompany,
  getSiteConfigValues,
} from "./db";
import { getGA4Report } from "./ga4";

// ─── GHL Webhook helper ────────────────────────────────────────────────────────
const GHL_WEBHOOK_URL =
  "https://services.leadconnectorhq.com/hooks/WBEbDUNxKL5GyxIUjjdZ/webhook-trigger/ef73980f-0111-46a0-8bb9-1cbed104028b";

async function sendToGHL(payload: Record<string, string | undefined>) {
  try {
    await fetch(GHL_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (err) {
    console.error("[GHL] Webhook failed:", err);
    return false;
  }
}

function buildSmsConfirmation(firstName?: string) {
  const safeName = firstName?.trim() ? firstName.trim() : "there";
  return `Hi ${safeName}, this is Grace from Solar Freedom. Your case review request was received — I’ll be reaching out within the hour. Reply with any questions!`;
}

// ─── Routers ───────────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Lead submission ──────────────────────────────────────────────────────────
  leads: router({
    /**
     * Submit a lead from the multi-step form.
     * Persists to DB first, then forwards to GHL webhook.
     */
    submit: publicProcedure
      .input(
        z.object({
          firstName: z.string().min(1),
          lastName: z.string().min(1),
          email: z.string().email(),
          phone: z.string().min(7),
          solarCompany: z.string().optional(),
          problemType: z.string().optional(),
          contractType: z.string().optional(),
          monthlyPayment: z.string().optional(),
          intent: z.string().optional(),
          formName: z.string().optional(),
          sourcePage: z.string().optional(),
          sourceUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // 1. Persist to database
        const leadId = await insertLead({
          ...input,
          formName: input.formName ?? "main_contact_form",
          status: "new",
          ghlWebhookSent: 0,
        });

        // 2. Forward to GHL webhook
        const ghlSuccess = await sendToGHL({
          first_name: input.firstName,
          last_name: input.lastName,
          email: input.email,
          phone: input.phone,
          full_name: `${input.firstName} ${input.lastName}`.trim(),
          solar_company: input.solarCompany,
          problem_type: input.problemType,
          contract_type: input.contractType,
          monthly_payment: input.monthlyPayment,
          intent: input.intent,
          source: input.sourcePage ?? "solar-freedom",
          form_name: input.formName ?? "main_contact_form",
          "contact.first_name": input.firstName,
          trigger_sms_confirmation: "1",
          sms_confirmation_message: buildSmsConfirmation(input.firstName),
        });

        // 3. Mark GHL sent status in DB
        if (leadId && ghlSuccess) {
          await markLeadGhlSent(leadId);
        }

        return { success: true, leadId };
      }),

    /**
     * Quick callback capture — phone-first fallback for visitors who don't
     * want to complete the full multi-step flow yet.
     */
    quickCallback: publicProcedure
      .input(
        z.object({
          phone: z.string().min(7),
          name: z.string().optional(),
          sourcePage: z.string().optional(),
          sourceUrl: z.string().optional(),
          formName: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const firstName = (input.name?.trim().split(" ")[0] || "").trim();
        const lastName = input.name?.trim().split(" ").slice(1).join(" ") || "";

        const leadId = await insertLead({
          firstName: firstName || null,
          lastName: lastName || null,
          phone: input.phone,
          email: null,
          formName: input.formName ?? "quick_callback_request",
          sourcePage: input.sourcePage ?? "unknown",
          sourceUrl: input.sourceUrl,
          status: "new",
          ghlWebhookSent: 0,
        });

        const ghlSuccess = await sendToGHL({
          phone: input.phone,
          first_name: firstName || "Website",
          last_name: lastName || "Visitor",
          full_name: input.name?.trim() || "Website Visitor",
          source: input.sourcePage ?? "solar-freedom",
          form_name: input.formName ?? "quick_callback_request",
          callback_request: "1",
          callback_priority: "high",
          trigger_sms_confirmation: "1",
          sms_confirmation_message: buildSmsConfirmation(firstName),
        });

        if (leadId && ghlSuccess) {
          await markLeadGhlSent(leadId);
        }

        return { success: true, leadId };
      }),

    /**
     * List all leads — admin only.
     */
    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(500).default(100),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Forbidden");
        }
        return getLeads(input.limit, input.offset);
      }),

    /**
     * Update lead status — admin only.
     */
    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["new", "contacted", "qualified", "closed_won", "closed_lost"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Forbidden");
        }
        await updateLeadStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  // ── Analytics (GA4) ──────────────────────────────────────────────────────────
  analytics: router({
    /**
     * Pull a live GA4 report for breakyoursolarcontract.com.
     * Admin only. Supports 7d, 30d, 90d date ranges.
     */
    report: protectedProcedure
      .input(
        z.object({
          range: z.enum(["7daysAgo", "30daysAgo", "90daysAgo"]).default("7daysAgo"),
        })
      )
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        return getGA4Report(input.range, "today");
      }),
  }),

  // ── Content (DB-backed blog posts + companies) ──────────────────────────────
  content: router({
    /**
     * List published blog posts from the database.
     * Returns lightweight list (no full content body).
     */
    listPosts: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        return getDbBlogPosts(input.limit, input.offset);
      }),

    /**
     * Get a single blog post by slug.
     */
    getPost: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return getDbBlogPost(input.slug);
      }),

    /**
     * List all published companies from the database.
     */
    listCompanies: publicProcedure
      .query(async () => {
        return getDbCompanies();
      }),

    /**
     * Get a single company by slug.
     */
    getCompany: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return getDbCompany(input.slug);
      }),
    /**
     * Get runtime site config values used by public pages.
     * Values are managed through /api/admin/config/:key.
     */
    getSiteConfig: publicProcedure.query(async () => {
      const configured = await getSiteConfigValues([
        "phone_number",
        "phone_number_e164",
        "assistant_name",
        "assistant_title",
      ]);

      return { ...SITE_CONFIG_DEFAULTS, ...configured };
    }),
  }),

  // ── Exit intent captures ─────────────────────────────────────────────────────
  exitIntent: router({
    capture: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          sourcePage: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await insertExitIntentCapture(input);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
