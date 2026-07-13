import { COOKIE_NAME, SITE_CONFIG_DEFAULTS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { parse as parseCookieHeader } from "cookie";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { logSafeError } from "./_core/safeLog";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  getLeads,
  insertExitIntentCapture,
  insertLead,
  markLeadGhlSent,
  updateLeadStatus,
  getDbBlogPosts,
  getDbBlogPost,
  getSiteConfigValues,
  getAllBlogPostsAdmin,
  getAdminBlogPost,
  BlogEditorialReviewError,
  updateBlogPost,
} from "./db";
import { storagePut } from "./storage";
import { getGA4Report } from "./ga4";
import { decodeBase64Image, safeImageStem } from "./security/imageUpload";
import {
  enforcePublicIdentifierLimit,
  enforcePublicMutationLimit,
} from "./security/rateLimit";
import {
  CONTACT_CONSENT_VERSION,
  MARKETING_CONSENT_VERSION,
  consentFields,
  isBotSubmission,
  normalizeUsPhone,
  validateContactConsent,
  validateMarketingConsent,
} from "./security/leadConsent";
import {
  isAllowedPressReleaseSetting,
  PRESS_RELEASE_OPERATIONAL_KEYS,
  validatePressReleaseSetting,
} from "./security/configPolicy";
import { normalizeLeadSourceUrl } from "./security/leadSourceUrl";
import { callLLM } from "./cron/aiCostTracker";
import {
  isValidEditorialPrimarySource,
  parseEditorialPrimarySources,
} from "../shared/blogEditorialReview";

const editorialPrimarySourcesInput = z
  .union([z.string(), z.array(z.unknown())])
  .nullable()
  .optional()
  .refine((value) => {
    if (value === undefined || value === null) return true;
    const sources = parseEditorialPrimarySources(value);
    return Boolean(sources && sources.every(source => isValidEditorialPrimarySource(source)));
  }, "editorialPrimarySources must contain valid HTTPS sources with title and accessedAt");

function getServerSessionToken(cookieHeader: string | undefined): string {
  if (!cookieHeader) return "";
  try {
    return parseCookieHeader(cookieHeader)[COOKIE_NAME] ?? "";
  } catch {
    return "";
  }
}

// ─── GHL Webhook helper ────────────────────────────────────────────────────────
async function sendToGHL(payload: Record<string, string | undefined>) {
  const webhookUrl = process.env.GHL_WEBHOOK_URL;
  if (!webhookUrl) return false;
  try {
    const parsed = new URL(webhookUrl);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return false;
  } catch {
    return false;
  }
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      logSafeError("ghl.webhook_failed", new Error("Upstream rejected request"), {
        upstreamStatus: response.status,
      });
      return false;
    }
    return true;
  } catch (err) {
    logSafeError("ghl.webhook_failed", err);
    return false;
  }
}

async function recordGhlDelivery(leadId: number, crmSent: boolean) {
  if (!crmSent) {
    // The initial database value already truthfully records an unsent webhook.
    return { crmMarkerPending: false, syncWarning: null } as const;
  }

  try {
    await markLeadGhlSent(leadId);
    return { crmMarkerPending: false, syncWarning: null } as const;
  } catch (error) {
    logSafeError("ghl.delivery_marker_failed", error);
    return {
      crmMarkerPending: true,
      syncWarning: "crm_delivery_marker_pending",
    } as const;
  }
}

function buildSmsConfirmation(firstName?: string) {
  const safeName = firstName?.trim() ? firstName.trim() : "there";
  return `Hi ${safeName}, Solar Freedom received your request. We may contact you about it. Reply STOP to opt out or HELP for help. Msg & data rates may apply.`;
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
          firstName: z.string().trim().min(1).max(100),
          lastName: z.string().trim().min(1).max(100),
          email: z.string().email().max(320),
          phone: z.string().min(7).max(30),
          solarCompany: z.string().max(100).optional(),
          problemType: z.string().max(200).optional(),
          contractType: z.string().max(100).optional(),
          monthlyPayment: z.string().max(50).optional(),
          intent: z.string().max(100).optional(),
          formName: z.string().max(100).optional(),
          sourcePage: z.string().max(255).optional(),
          sourceUrl: z.string().max(2_000).optional(),
          ...consentFields,
        })
      )
      .mutation(async ({ ctx, input }) => {
        enforcePublicMutationLimit(ctx.req, "lead-submit");
        if (isBotSubmission(input.website)) {
          return {
            success: true,
            persisted: false,
            crmSent: false,
            crmPending: false,
            crmMarkerPending: false,
            syncWarning: null,
            leadId: null,
          } as const;
        }
        validateContactConsent(input);
        const normalizedPhone = normalizeUsPhone(input.phone);
        enforcePublicIdentifierLimit(ctx.req, "lead-submit", normalizedPhone);
        const {
          website: _website,
          sourceUrl: submittedSourceUrl,
          ...leadInput
        } = input;
        const sourceUrl = normalizeLeadSourceUrl(submittedSourceUrl);
        // 1. Persist to database
        const leadId = await insertLead({
          ...leadInput,
          sourceUrl,
          phone: normalizedPhone,
          contactConsent: input.contactConsent ? 1 : 0,
          smsConsent: input.smsConsent ? 1 : 0,
          consentVersion: input.contactConsent ? CONTACT_CONSENT_VERSION : null,
          consentRecordedAt: input.contactConsent ? new Date() : null,
          formName: input.formName ?? "main_contact_form",
          status: "new",
          ghlWebhookSent: 0,
        });

        const persisted = typeof leadId === "number" && leadId > 0;
        if (!persisted) {
          return {
            success: false,
            persisted: false,
            crmSent: false,
            crmPending: false,
            crmMarkerPending: false,
            syncWarning: null,
            leadId: null,
          } as const;
        }

        // 2. Forward to GHL webhook
        const crmEligible = input.contactConsent;
        const ghlSuccess = crmEligible && await sendToGHL({
          first_name: input.firstName,
          last_name: input.lastName,
          email: input.email,
          phone: normalizedPhone,
          full_name: `${input.firstName} ${input.lastName}`.trim(),
          solar_company: input.solarCompany,
          problem_type: input.problemType,
          contract_type: input.contractType,
          monthly_payment: input.monthlyPayment,
          intent: input.intent,
          source: input.sourcePage ?? "solar-freedom",
          form_name: input.formName ?? "main_contact_form",
          "contact.first_name": input.firstName,
          trigger_sms_confirmation: input.smsConsent ? "1" : "0",
          sms_confirmation_message: input.smsConsent
            ? buildSmsConfirmation(input.firstName)
            : undefined,
        });

        // 3. Record delivery without turning bookkeeping failure into lead failure.
        const crmMarker = await recordGhlDelivery(leadId, ghlSuccess);

        return {
          success: true,
          persisted: true,
          crmSent: ghlSuccess,
          crmPending: crmEligible && !ghlSuccess,
          ...crmMarker,
          leadId,
        } as const;
      }),

    /**
     * Quick callback capture — phone-first fallback for visitors who don't
     * want to complete the full multi-step flow yet.
     */
    quickCallback: publicProcedure
      .input(
        z.object({
          phone: z.string().min(7).max(30),
          name: z.string().max(200).optional(),
          intent: z.string().max(100).optional(),
          sourcePage: z.string().max(255).optional(),
          sourceUrl: z.string().max(2_000).optional(),
          formName: z.string().max(100).optional(),
          ...consentFields,
        })
      )
      .mutation(async ({ ctx, input }) => {
        enforcePublicMutationLimit(ctx.req, "lead-callback");
        if (isBotSubmission(input.website)) {
          return {
            success: true,
            persisted: false,
            crmSent: false,
            crmPending: false,
            crmMarkerPending: false,
            syncWarning: null,
            leadId: null,
          } as const;
        }
        validateContactConsent(input);
        const normalizedPhone = normalizeUsPhone(input.phone);
        enforcePublicIdentifierLimit(ctx.req, "lead-callback", normalizedPhone);
        const firstName = (input.name?.trim().split(" ")[0] || "").trim();
        const lastName = input.name?.trim().split(" ").slice(1).join(" ") || "";

        const leadId = await insertLead({
          firstName: firstName || null,
          lastName: lastName || null,
          phone: normalizedPhone,
          email: null,
          formName: input.formName ?? "quick_callback_request",
          intent: input.intent,
          sourcePage: input.sourcePage ?? "unknown",
          sourceUrl: normalizeLeadSourceUrl(input.sourceUrl),
          status: "new",
          ghlWebhookSent: 0,
          contactConsent: input.contactConsent ? 1 : 0,
          smsConsent: input.smsConsent ? 1 : 0,
          consentVersion: input.contactConsent ? CONTACT_CONSENT_VERSION : null,
          consentRecordedAt: input.contactConsent ? new Date() : null,
        });

        const persisted = typeof leadId === "number" && leadId > 0;
        if (!persisted) {
          return {
            success: false,
            persisted: false,
            crmSent: false,
            crmPending: false,
            crmMarkerPending: false,
            syncWarning: null,
            leadId: null,
          } as const;
        }

        const crmEligible = input.contactConsent;
        const ghlSuccess = crmEligible && await sendToGHL({
          phone: normalizedPhone,
          first_name: firstName || "Website",
          last_name: lastName || "Visitor",
          full_name: input.name?.trim() || "Website Visitor",
          source: input.sourcePage ?? "solar-freedom",
          form_name: input.formName ?? "quick_callback_request",
          intent: input.intent,
          callback_request: "1",
          callback_priority: "high",
          callback_follow_up_required: "1",
          callback_follow_up_deadline_minutes: "5",
          callback_follow_up_reason: input.intent
            ? `intent:${input.intent}`
            : "quick_callback_request",
          trigger_sms_confirmation: input.smsConsent ? "1" : "0",
          sms_confirmation_message: input.smsConsent
            ? buildSmsConfirmation(firstName)
            : undefined,
        });

        const crmMarker = await recordGhlDelivery(leadId, ghlSuccess);

        return {
          success: true,
          persisted: true,
          crmSent: ghlSuccess,
          crmPending: crmEligible && !ghlSuccess,
          ...crmMarker,
          leadId,
        } as const;
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
        try {
          return await getGA4Report(input.range, "today");
        } catch (error) {
          logSafeError("analytics.ga4_fetch_failed", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Analytics report is unavailable.",
          });
        }
      }),
  }),

  // ── Content (DB-backed blog posts + companies) ──────────────────────────────
  content: router({
    /**
     * List evidence-approved blog posts from full stored database rows.
     * Returns only lightweight card fields (no full content body).
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
     * Get an evidence-approved blog post by slug.
     */
    getPost: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return getDbBlogPost(input.slug);
      }),

    /** Company profiles remain private until dedicated evidence fields exist. */
    listCompanies: publicProcedure
      .query(() => []),

    /** Company profiles remain private until dedicated evidence fields exist. */
    getCompany: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(() => null),
    /**
     * Get runtime site config values used by public pages.
     * Values are managed through /api/admin/config/:key.
     */
    getSiteConfig: publicProcedure.query(async () => {
      try {
        const configured = await getSiteConfigValues([
          "phone_number",
          "phone_number_e164",
          "assistant_name",
          "assistant_title",
        ]);

        return { ...SITE_CONFIG_DEFAULTS, ...configured };
      } catch (error) {
        // Public pages have safe compiled defaults and must remain usable during
        // a transient config-store outage. Readiness still reports DB failure.
        logSafeError("content.site_config_unavailable", error);
        return { ...SITE_CONFIG_DEFAULTS };
      }
    }),

    /**
     * List ALL posts (including drafts) for admin editor.
     */
    listAllPosts: protectedProcedure
      .input(z.object({ limit: z.number().default(200), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        return getAllBlogPostsAdmin(input.limit, input.offset);
      }),

    /**
     * Get a single post by slug for admin editing (includes drafts + full content).
     */
    getAdminPost: protectedProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        return getAdminBlogPost(input.slug);
      }),

    /**
     * Update a blog post — admin only.
     */
    updatePost: protectedProcedure
      .input(z.object({
        slug: z.string(),
        title: z.string().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        heroImage: z.string().optional(),
        category: z.string().optional(),
        tags: z.string().optional(),
        content: z.string().optional(),
        excerpt: z.string().optional(),
        readTime: z.string().optional(),
        relatedSlugs: z.string().optional(),
        faqItems: z.string().optional(),
        canonicalUrl: z.string().optional(),
        editorialReviewerName: z.string().max(200).nullable().optional(),
        editorialReviewerRole: z.string().max(200).nullable().optional(),
        editorialReviewedAt: z.coerce.date().nullable().optional(),
        editorialPrimarySources: editorialPrimarySourcesInput,
        editorialUniqueValueSummary: z.string().max(20_000).nullable().optional(),
        editorialFunnelOnlyDuplicate: z.boolean().optional(),
        published: z.number().int().min(0).max(1).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const {
          slug,
          editorialPrimarySources,
          editorialFunnelOnlyDuplicate,
          ...data
        } = input;
        const normalizedData = {
          ...data,
          ...(editorialPrimarySources === undefined
            ? {}
            : {
                editorialPrimarySources: editorialPrimarySources === null
                  ? null
                  : JSON.stringify(parseEditorialPrimarySources(editorialPrimarySources)),
              }),
          ...(editorialFunnelOnlyDuplicate === undefined
            ? {}
            : { editorialFunnelOnlyDuplicate: editorialFunnelOnlyDuplicate ? 1 : 0 }),
        };
        try {
          return await updateBlogPost(slug, normalizedData);
        } catch (error) {
          if (error instanceof BlogEditorialReviewError) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `${error.message}: ${error.issues.join(", ")}`,
              cause: error,
            });
          }
          logSafeError("content.blog_post_update_failed", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unable to update the blog post.",
          });
        }
      }),

    /**
     * Upload an image to S3 and return the CDN URL.
     * Accepts base64-encoded file content.
     */
    uploadImage: protectedProcedure
      .input(z.object({
        filename: z.string(),
        contentType: z.string(),
        base64: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const image = decodeBase64Image(input.base64, input.contentType);
        const key = `blog-images/${Date.now()}-${safeImageStem(input.filename)}.${image.extension}`;
        const { url } = await storagePut(key, image.buffer, image.mimeType);
        return { url, key };
      }),
  }),

  // ── Exit intent captures ─────────────────────────────────────────────────────
  exitIntent: router({
    capture: publicProcedure
      .input(
        z.object({
          email: z.string().email().max(320),
          sourcePage: z.string().max(255).optional(),
          wantsGuide: z.boolean().optional(),
          marketingConsent: z.boolean().default(false),
          consentVersion: z.string().max(64).optional(),
          website: z.string().max(200).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        enforcePublicMutationLimit(ctx.req, "exit-intent");
        if (isBotSubmission(input.website)) {
          return {
            success: true,
            persisted: false,
            crmSent: false,
            crmPending: false,
            captureId: null,
          } as const;
        }
        validateMarketingConsent(input);
        const captureId = await insertExitIntentCapture({
          email: input.email,
          sourcePage: input.sourcePage,
          marketingConsent: input.marketingConsent ? 1 : 0,
          consentVersion: input.marketingConsent ? MARKETING_CONSENT_VERSION : null,
          consentRecordedAt: input.marketingConsent ? new Date() : null,
        });
        const persisted = typeof captureId === "number" && captureId > 0;
        if (!persisted) {
          return {
            success: false,
            persisted: false,
            crmSent: false,
            crmPending: false,
            captureId: null,
          } as const;
        }
        const crmSent = input.marketingConsent && await sendToGHL({
          email: input.email,
          source: "exit_intent_popup",
          form_name: "Exit Intent — Solar Freedom",
          intent: "exit_intent",
          lead_magnet: input.wantsGuide ? "solar_contract_escape_guide" : "none",
          workflow: input.wantsGuide ? "escape_guide_day1_day3_day7" : "standard_exit_intent",
        });
        return {
          success: true,
          persisted: true,
          crmSent,
          crmPending: input.marketingConsent && !crmSent,
          captureId,
        } as const;
      }),
  }),

  // ── Press Release Automation (admin only) ────────────────────────────────────
  pressRelease: router({
    /**
     * Get all topics in the queue.
     */
    getTopics: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const { getDb } = await import("./db");
      const { pressReleaseTopics } = await import("../drizzle/schema");
      const { asc } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return [];
      return db.select().from(pressReleaseTopics).orderBy(asc(pressReleaseTopics.sortOrder), asc(pressReleaseTopics.createdAt));
    }),

    /**
     * Add a new topic to the queue.
     */
    addTopic: protectedProcedure
      .input(z.object({
        title: z.string().min(5),
        angle: z.string().optional(),
        targetKeywords: z.string().optional(),
        targetUrl: z.string().optional(),
        sortOrder: z.number().default(50),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const { getDb } = await import("./db");
        const { pressReleaseTopics } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.insert(pressReleaseTopics).values({
          title: input.title,
          angle: input.angle ?? null,
          targetKeywords: input.targetKeywords ?? null,
          targetUrl: input.targetUrl ?? null,
          sortOrder: input.sortOrder,
          status: "pending",
        });
        return { success: true };
      }),

    /**
     * Delete a topic from the queue.
     */
    deleteTopic: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const { getDb } = await import("./db");
        const { pressReleaseTopics } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.delete(pressReleaseTopics).where(eq(pressReleaseTopics.id, input.id));
        return { success: true };
      }),

    /**
     * Update topic status (e.g. reset failed → pending).
     */
    updateTopicStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "running", "published", "failed"]),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const { getDb } = await import("./db");
        const { pressReleaseTopics } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.update(pressReleaseTopics).set({ status: input.status }).where(eq(pressReleaseTopics.id, input.id));
        return { success: true };
      }),

    /**
     * Get all press release logs.
     */
    getLogs: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const { getDb } = await import("./db");
        const { pressReleaseLogs } = await import("../drizzle/schema");
        const { desc } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) return [];
        return db.select().from(pressReleaseLogs).orderBy(desc(pressReleaseLogs.createdAt)).limit(input.limit).offset(input.offset);
      }),

    /**
     * Get press release settings.
     */
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const { getDb } = await import("./db");
      const { pressReleaseSettings } = await import("../drizzle/schema");
      const db = await getDb();
      if (!db) return {};
      const rows = await db.select().from(pressReleaseSettings);
      return Object.fromEntries(rows.filter((r) => PRESS_RELEASE_OPERATIONAL_KEYS.has(r.key)).map((r) => [r.key, r.value]));
    }),

    /**
     * Update a press release setting.
     */
    updateSetting: protectedProcedure
      .input(z.object({ key: z.string(), value: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        if (!isAllowedPressReleaseSetting(input.key)) throw new Error("Setting key is not allowlisted; secrets must be supplied through server environment variables");
        validatePressReleaseSetting(input.key, input.value);
        const { getDb } = await import("./db");
        const { pressReleaseSettings } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.insert(pressReleaseSettings).values({ key: input.key, value: input.value })
          .onDuplicateKeyUpdate({ set: { value: input.value } });
        return { success: true };
      }),

    /**
     * Manually trigger a press release run (runs next pending topic).
     * Returns the result immediately (runs synchronously for admin feedback).
     */
    runNow: protectedProcedure
      .input(z.object({
        topicId: z.number().optional(),
        dryRun: z.literal(true).default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const { runPressReleaseCycle } = await import("./cron/pressRelease");
        return runPressReleaseCycle({ topicId: input.topicId, dryRun: input.dryRun });
      }),

    /**
     * Generate an unverified backlink research queue for manual review.
     */
    runDiscovery: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      try {
        const { runBacklinkDiscovery } = await import("./cron/backlinkDiscovery");
        return await runBacklinkDiscovery();
      } catch (error) {
        logSafeError("backlink.discovery_failed", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Backlink research could not run.",
        });
      }
    }),

    /**
     * Disabled compatibility endpoint retained for older admin clients.
     * It does not launch a browser, authenticate, or persist a session.
     */
    browserLogin: protectedProcedure
      .input(z.object({
        site: z.enum(["medium", "linkedin", "substack"]),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        return {
          success: false,
          loginUrl: "",
          message: `${input.site} browser login is disabled until publishing runs in an isolated, approval-bound worker.`,
        };
      }),

    /**
     * Disabled compatibility status: all legacy distribution sessions report
     * disconnected while the isolated approval-bound worker is unavailable.
     */
    checkLoginStatus: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      return {
        medium: false,
        linkedin: false,
        substack: false,
        lastChecked: new Date().toISOString(),
      };
    }),
  }),

  // ── Backlink Manager (admin only) ─────────────────────────────────────────────
  backlinks: router({
    /**
     * Get all backlink opportunities (for review).
     */
    getOpportunities: protectedProcedure
      .input(z.object({
        status: z.enum(["new", "approved", "rejected", "promoted"]).optional(),
        limit: z.number().int().min(1).max(100).default(100),
        offset: z.number().int().min(0).max(10_000).default(0),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        try {
          const { getDb } = await import("./db");
          const { backlinkOpportunities } = await import("../drizzle/schema");
          const { eq, desc } = await import("drizzle-orm");
          const { normalizeBacklinkCandidateUrl } = await import("./cron/backlinkDiscovery");
          const db = await getDb();
          if (!db) throw new Error("Database unavailable");
          const rows = input.status
            ? await db.select().from(backlinkOpportunities)
              .where(eq(backlinkOpportunities.status, input.status))
              .orderBy(desc(backlinkOpportunities.relevanceScore))
              .limit(input.limit).offset(input.offset)
            : await db.select().from(backlinkOpportunities)
            .orderBy(desc(backlinkOpportunities.relevanceScore))
            .limit(input.limit).offset(input.offset);

          return rows.flatMap((row) => {
            const safeUrl = normalizeBacklinkCandidateUrl(row.url);
            return safeUrl ? [{ ...row, url: safeUrl }] : [];
          });
        } catch (error) {
          logSafeError("backlink.discovery_failed", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Backlink research queue is unavailable.",
          });
        }
      }),

    /**
     * Update opportunity status (approve/reject/promote).
     */
    updateOpportunity: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        status: z.enum(["new", "approved", "rejected", "promoted"]),
        reviewNotes: z.string().trim().max(2_000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        try {
          const { getDb } = await import("./db");
          const { backlinkOpportunities } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          const db = await getDb();
          if (!db) throw new Error("Database unavailable");
          await db.update(backlinkOpportunities)
            .set({ status: input.status, reviewNotes: input.reviewNotes ?? null, reviewedAt: new Date() })
            .where(eq(backlinkOpportunities.id, input.id));
          return { success: true };
        } catch (error) {
          logSafeError("backlink.discovery_failed", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Backlink review was not saved.",
          });
        }
      }),

    /**
     * Get all active backlink targets.
     */
    getTargets: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      try {
        const { getDb } = await import("./db");
        const { backlinkTargets } = await import("../drizzle/schema");
        const { asc } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        // Never select legacy plaintext credentials or unsupported modeled
        // authority/link metrics. They are not required by the approval-first
        // review UI and must not cross the API.
        return db.select({
          id: backlinkTargets.id,
          name: backlinkTargets.name,
          url: backlinkTargets.url,
          submitUrl: backlinkTargets.submitUrl,
          type: backlinkTargets.type,
          requiresAccount: backlinkTargets.requiresAccount,
          requiresPayment: backlinkTargets.requiresPayment,
          submissionMethod: backlinkTargets.submissionMethod,
          lastSubmittedAt: backlinkTargets.lastSubmittedAt,
          lastPublishedUrl: backlinkTargets.lastPublishedUrl,
          totalSubmissions: backlinkTargets.totalSubmissions,
          successfulSubmissions: backlinkTargets.successfulSubmissions,
          status: backlinkTargets.status,
          notes: backlinkTargets.notes,
          priority: backlinkTargets.priority,
          createdAt: backlinkTargets.createdAt,
          updatedAt: backlinkTargets.updatedAt,
        }).from(backlinkTargets).orderBy(asc(backlinkTargets.priority));
      } catch (error) {
        logSafeError("backlink.discovery_failed", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Backlink targets are unavailable.",
        });
      }
    }),

    /**
     * Queue historical backlink candidates as unverified research.
     */
    seedKnownSites: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      try {
        const { seedKnownPRSites } = await import("./cron/backlinkDiscovery");
        const queued = await seedKnownPRSites();
        return { success: true, queued };
      } catch (error) {
        logSafeError("backlink.discovery_failed", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Historical backlink candidates could not be queued.",
        });
      }
    }),
  }),

  // ─── Provider-reported AI cost tracking ──────────────────────────────────────
  aiCost: router({
    /**
     * Provider-reported billed cost: total and breakdown by day/call type.
     */
    getSummary: protectedProcedure
      .input(z.object({ days: z.number().default(30) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const db = await getDb();
        if (!db) return { totalUsd: 0, byDay: [], byCallType: [], totalCalls: 0 };
        const { aiCostLog } = await import("../drizzle/schema");
        const { gte, sql } = await import("drizzle-orm");
        const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
        const rows = await db
          .select()
          .from(aiCostLog)
          .where(gte(aiCostLog.createdAt, since))
          .orderBy(desc(aiCostLog.createdAt));
        const totalUsd = rows.reduce((sum, r) => sum + parseFloat(r.costUsd ?? "0"), 0);
        const totalCalls = rows.length;
        // Group by day
        const dayMap: Record<string, number> = {};
        for (const r of rows) {
          const day = r.createdAt.toISOString().slice(0, 10);
          dayMap[day] = (dayMap[day] ?? 0) + parseFloat(r.costUsd ?? "0");
        }
        const byDay = Object.entries(dayMap).map(([date, usd]) => ({ date, usd })).sort((a, b) => a.date.localeCompare(b.date));
        // Group by call type
        const typeMap: Record<string, number> = {};
        for (const r of rows) {
          typeMap[r.callType] = (typeMap[r.callType] ?? 0) + parseFloat(r.costUsd ?? "0");
        }
        const byCallType = Object.entries(typeMap).map(([type, usd]) => ({ type, usd }));
        return { totalUsd, byDay, byCallType, totalCalls };
      }),

    /**
     * Provider-reported cost breakdown by model.
     */
    getByModel: protectedProcedure
      .input(z.object({ days: z.number().default(30) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const db = await getDb();
        if (!db) return [];
        const { aiCostLog } = await import("../drizzle/schema");
        const { gte } = await import("drizzle-orm");
        const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
        const rows = await db.select().from(aiCostLog).where(gte(aiCostLog.createdAt, since));
        const modelMap: Record<string, { usd: number; calls: number; tokensIn: number; tokensOut: number }> = {};
        for (const r of rows) {
          if (!modelMap[r.model]) modelMap[r.model] = { usd: 0, calls: 0, tokensIn: 0, tokensOut: 0 };
          modelMap[r.model].usd += parseFloat(r.costUsd ?? "0");
          modelMap[r.model].calls += 1;
          modelMap[r.model].tokensIn += r.tokensIn ?? 0;
          modelMap[r.model].tokensOut += r.tokensOut ?? 0;
        }
        return Object.entries(modelMap)
          .map(([model, stats]) => ({ model, ...stats }))
          .sort((a, b) => b.usd - a.usd);
      }),

    /**
     * Provider-reported cost by feature (press_release, blog, embedding, etc.).
     */
    getByFeature: protectedProcedure
      .input(z.object({ days: z.number().default(30) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const db = await getDb();
        if (!db) return [];
        const { aiCostLog } = await import("../drizzle/schema");
        const { gte } = await import("drizzle-orm");
        const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
        const rows = await db.select().from(aiCostLog).where(gte(aiCostLog.createdAt, since));
        const featureMap: Record<string, { usd: number; calls: number }> = {};
        for (const r of rows) {
          if (!featureMap[r.feature]) featureMap[r.feature] = { usd: 0, calls: 0 };
          featureMap[r.feature].usd += parseFloat(r.costUsd ?? "0");
          featureMap[r.feature].calls += 1;
        }
        return Object.entries(featureMap)
          .map(([feature, stats]) => ({ feature, ...stats }))
          .sort((a, b) => b.usd - a.usd);
      }),

    /**
     * Recent cost log entries
     */
    getRecentLogs: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const db = await getDb();
        if (!db) return [];
        const { aiCostLog } = await import("../drizzle/schema");
        return db.select().from(aiCostLog).orderBy(desc(aiCostLog.createdAt)).limit(input.limit);
      }),
  }),
  blogStudio: router({
    /**
     * Get top-performing pages from GA4 for SEO analysis reference
     */
    getTopPages: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        try {
          const report = await getGA4Report("90daysAgo", "today");
          return report.topPages.slice(0, input.limit);
        } catch (err) {
          logSafeError("analytics.ga4_fetch_failed", err);
          return [];
        }
      }),

    /**
     * Analyze a post's SEO quality and return suggestions
     */
    analyzeSeo: protectedProcedure
      .input(z.object({
        title: z.string(),
        content: z.string(),
        targetKeyword: z.string().optional(),
        slug: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const { title, content, targetKeyword } = input;
        // Strip HTML tags for text analysis
        const text = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        const readingTime = Math.ceil(wordCount / 200);
        // Count headings
        const h2Count = (content.match(/<h2/gi) || []).length;
        const h3Count = (content.match(/<h3/gi) || []).length;
        // Count internal links
        const internalLinks = (content.match(/href="\//g) || []).length;
        const externalLinks = (content.match(/href="https?:\/\//g) || []).length;
        // Phrase presence is descriptive only; there is no universal target density.
        let keywordDensity = 0;
        let keywordCount = 0;
        if (targetKeyword && wordCount > 0) {
          const kw = targetKeyword.toLowerCase().trim();
          if (kw) {
            const haystack = text.toLowerCase();
            let cursor = 0;
            while ((cursor = haystack.indexOf(kw, cursor)) !== -1) {
              keywordCount += 1;
              cursor += kw.length;
            }
            keywordDensity = parseFloat(((keywordCount / wordCount) * 100).toFixed(2));
          }
        }
        // Neutral editorial checks. These describe the draft; they do not model rankings.
        const suggestions: Array<{ type: "warning" | "success" | "info"; message: string }> = [];
        suggestions.push({
          type: "info",
          message: `Word count: ${wordCount}. Adequate depth depends on search intent, evidence, and whether the draft answers the reader's question without filler.`,
        });
        if (h2Count === 0 && wordCount > 300) {
          suggestions.push({ type: "info", message: "No H2 headings detected. Add headings only where they make a longer draft easier to scan." });
        } else {
          suggestions.push({ type: "info", message: `Detected ${h2Count} H2 and ${h3Count} H3 heading(s); verify that each describes the section it introduces.` });
        }
        if (internalLinks === 0) {
          suggestions.push({ type: "info", message: "No internal links detected. Add only links that genuinely help the reader continue the same task." });
        } else {
          suggestions.push({ type: "info", message: `${internalLinks} internal link(s) detected; verify that every destination is relevant and approved.` });
        }
        if (externalLinks === 0) {
          suggestions.push({ type: "info", message: "No external source links detected. Evidence-dependent claims should cite relevant primary sources when available." });
        }
        if (targetKeyword) {
          if (keywordCount === 0) {
            suggestions.push({ type: "info", message: `The phrase "${targetKeyword}" was not detected. Confirm that the draft still answers the intended topic naturally.` });
          } else if (keywordCount >= 8 && keywordDensity > 3) {
            suggestions.push({ type: "warning", message: `The phrase "${targetKeyword}" appears ${keywordCount} times (${keywordDensity}% of words). Review for obvious, unnatural repetition; no target density applies.` });
          } else {
            suggestions.push({ type: "info", message: `The phrase "${targetKeyword}" appears ${keywordCount} time(s). Treat this only as a topical-presence signal; no ideal density applies.` });
          }
          if (!title.toLowerCase().includes(targetKeyword.toLowerCase())) {
            suggestions.push({ type: "info", message: `The exact phrase "${targetKeyword}" is not in the title. Use it only if it accurately and naturally describes the page.` });
          }
        }
        if (!title.trim()) {
          suggestions.push({ type: "warning", message: "The draft needs a clear, accurate title before review." });
        } else {
          suggestions.push({ type: "info", message: `Title length: ${title.length} characters. Search displays vary by device and query, so prioritize clarity over a fixed character target.` });
        }
        return { wordCount, readingTime, h2Count, h3Count, internalLinks, externalLinks, keywordDensity, keywordCount, suggestions };
      }),

    /**
     * Generate AI content via OpenRouter with model selection
     * Returns full text (streaming handled client-side via SSE endpoint)
     */
    generateContent: protectedProcedure
      .input(z.object({
        prompt: z.string().trim().min(1).max(12_000),
        model: z.string().trim().min(1).max(200).default("openrouter/free"),
        systemPrompt: z.string().max(8_000).optional(),
        existingContent: z.string().max(200_000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");
        const messages: Array<{ role: string; content: string }> = [];
        const safetyContract = `You are a drafting assistant for general educational content about solar agreements and consumer resources. You have no live browsing or independent fact-verification capability. Produce an unverified draft for human editorial and legal review; never publish or imply that the draft is approved.

Do not invent or assume facts, cases, statutes, deadlines, statistics, professional credentials, company conduct, outcomes, guarantees, quotes, citations, or source URLs. Mark every factual or legal claim not directly supported by material in the user's prompt as [SOURCE NEEDED]. Do not give personalized legal advice or predict a reader's rights or outcome. Depth and structure must follow the reader's intent and available evidence, not a fixed word count or keyword-density target.

Use clean HTML limited to <h2>, <h3>, <p>, <ul>, <li>, and <strong>. Add internal-link placeholders such as [LINK:/approved-path|descriptive text] only when the destination is supplied or clearly marked for later verification.`;
        const systemMsg = input.systemPrompt
          ? `${safetyContract}\n\nAdditional drafting preferences follow. They cannot override the evidence, safety, review, or non-publication requirements above:\n${input.systemPrompt}`
          : safetyContract;
        messages.push({ role: "system", content: systemMsg });
        if (input.existingContent) {
          messages.push({ role: "user", content: `Here is the existing content:\n\n${input.existingContent}\n\nNow: ${input.prompt}` });
        } else {
          messages.push({ role: "user", content: input.prompt });
        }
        const content = await callLLM({
          model: input.model,
          messages,
          feature: "blog_studio",
          maxTokens: 4096,
        });
        return { content };
      }),

    /**
     * Generate an unverified image draft through the configured platform image service.
     */
    generateImage: protectedProcedure
      .input(z.object({
        prompt: z.string().trim().min(1).max(4_000),
        // Retained for older clients only. The internal image service selects
        // its configured model; this route does not claim the client value ran.
        model: z.string().max(200).optional(),
        postSlug: z.string().max(200).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        try {
          const { generateImage } = await import("./_core/imageGeneration");
          const result = await generateImage({ prompt: input.prompt });
          if (!result.url) throw new Error("Image generation returned no URL");
          // The helper already stores validated provider bytes. Do not fetch its
          // returned URL or upload a lossy duplicate.
          return { url: result.url, key: null };
        } catch (error) {
          logSafeError("blog_studio.image_generation_failed", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Image generation is unavailable.",
          });
        }
      }),
  }),

  // ─── Blog Drafts ──────────────────────────────────────────────────────────
  automations: router({
    /**
     * List all automations.
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const { listAutomations } = await import("./db");
      return listAutomations();
    }),

    /**
     * Get a single automation with its run history.
     */
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const { getAutomation, listAutomationRuns } = await import("./db");
        const automation = await getAutomation(input.id);
        if (!automation) throw new Error("Not found");
        const runs = await listAutomationRuns(input.id, 20);
        return { automation, runs };
      }),

    /**
     * Create a new automation.
     */
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(200),
        description: z.string().optional(),
        spec: z.string().min(1),
        cronExpression: z.string().min(1),
        cronLabel: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const { createAutomation } = await import("./db");
        return createAutomation(input);
      }),

    /**
     * Update an automation spec, schedule, or enabled state.
     */
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        spec: z.string().min(1).optional(),
        cronExpression: z.string().optional(),
        cronLabel: z.string().optional(),
        isEnabled: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const { updateAutomation } = await import("./db");
        const { id, ...data } = input;
        return updateAutomation(id, data);
      }),

    /**
     * Delete an automation and its run logs.
     */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const { deleteAutomation } = await import("./db");
        return deleteAutomation(input.id);
      }),

    /**
     * Activate the cron schedule for an automation via the Heartbeat platform.
     * Requires the site to be deployed — the platform POSTs to the live URL.
     */
    activateSchedule: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const { getAutomation, updateAutomation } = await import("./db");
        const { createHeartbeatJob } = await import("./_core/heartbeat");
        const automation = await getAutomation(input.id);
        if (!automation) throw new Error("Automation not found");
        const job = await createHeartbeatJob({
          name: `automation-${automation.id}`,
          cron: automation.cronExpression,
          path: `/api/scheduled/automation-run`,
          payload: { automationId: automation.id },
          description: automation.name,
        }, getServerSessionToken(ctx.req.headers.cookie));
        await updateAutomation(input.id, { scheduleCronTaskUid: job.taskUid });
        return { taskUid: job.taskUid, nextExecutionAt: job.nextExecutionAt };
      }),

    /**
     * Deactivate (pause) the cron schedule for an automation.
     */
    deactivateSchedule: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const { getAutomation, updateAutomation } = await import("./db");
        const { updateHeartbeatJob } = await import("./_core/heartbeat");
        const automation = await getAutomation(input.id);
        if (!automation) throw new Error("Automation not found");
        if (!automation.scheduleCronTaskUid) throw new Error("No active schedule");
        await updateHeartbeatJob(
          automation.scheduleCronTaskUid,
          { enable: false },
          getServerSessionToken(ctx.req.headers.cookie),
        );
        await updateAutomation(input.id, { isEnabled: 0 });
        return { success: true };
      }),

    /**
     * Get run history for an automation.
     */
    runs: protectedProcedure
      .input(z.object({ id: z.number(), limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const { listAutomationRuns } = await import("./db");
        return listAutomationRuns(input.id, input.limit ?? 20);
      }),
  }),

  blogDrafts: router({
    /**
     * Upsert a draft (autosave or named). name="autosave" is reserved for autosave.
     */
    save: protectedProcedure
      .input(z.object({
        postSlug: z.string(),
        name: z.string().default("autosave"),
        title: z.string().optional(),
        content: z.string().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        excerpt: z.string().optional(),
        heroImage: z.string().optional(),
        targetKeyword: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const { upsertBlogDraft } = await import("./db");
        return upsertBlogDraft(input);
      }),

    /**
     * List all drafts for a post slug.
     */
    list: protectedProcedure
      .input(z.object({ postSlug: z.string() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const { listBlogDrafts } = await import("./db");
        return listBlogDrafts(input.postSlug);
      }),

    /**
     * Get a single draft by id.
     */
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const { getBlogDraft } = await import("./db");
        return getBlogDraft(input.id);
      }),

    /**
     * Delete a draft by id.
     */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const { deleteBlogDraft } = await import("./db");
        return deleteBlogDraft(input.id);
      }),
  }),
});
export type AppRouter = typeof appRouter;
