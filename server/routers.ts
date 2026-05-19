import { COOKIE_NAME, SITE_CONFIG_DEFAULTS } from "@shared/const";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
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
  getDbCompanies,
  getDbCompany,
  getSiteConfigValues,
  getAllBlogPostsAdmin,
  getAdminBlogPost,
  updateBlogPost,
} from "./db";
import { storagePut } from "./storage";
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
        published: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const { slug, ...data } = input;
        return updateBlogPost(slug, data);
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
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.filename.split(".").pop() ?? "jpg";
        const key = `blog-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        return { url, key };
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
      return Object.fromEntries(rows.map((r) => [r.key, r.value]));
    }),

    /**
     * Update a press release setting.
     */
    updateSetting: protectedProcedure
      .input(z.object({ key: z.string(), value: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
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
        dryRun: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const { runPressReleaseCycle } = await import("./cron/pressRelease");
        return runPressReleaseCycle({ topicId: input.topicId, dryRun: input.dryRun });
      }),

    /**
     * Run backlink discovery now.
     */
    runDiscovery: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const { runBacklinkDiscovery } = await import("./cron/backlinkDiscovery");
      return runBacklinkDiscovery();
    }),

    /**
     * Open a Playwright browser window for the user to log in to Medium, LinkedIn, or Substack.
     * The session is saved to the persistent profile so future automated runs work without re-auth.
     */
    browserLogin: protectedProcedure
      .input(z.object({
        site: z.enum(["medium", "linkedin", "substack"]),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const { launchBrowserLoginSession } = await import("./cron/browserLoginSession");
        return launchBrowserLoginSession(input.site);
      }),

    /**
     * Check login status for Medium, LinkedIn, and Substack.
     */
    checkLoginStatus: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const { checkLoginStatus } = await import("./cron/browserLoginSession");
      return checkLoginStatus();
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
        limit: z.number().default(100),
        offset: z.number().default(0),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const { getDb } = await import("./db");
        const { backlinkOpportunities } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) return [];
        const query = db.select().from(backlinkOpportunities)
          .orderBy(desc(backlinkOpportunities.relevanceScore))
          .limit(input.limit).offset(input.offset);
        if (input.status) {
          return db.select().from(backlinkOpportunities)
            .where(eq(backlinkOpportunities.status, input.status))
            .orderBy(desc(backlinkOpportunities.relevanceScore))
            .limit(input.limit).offset(input.offset);
        }
        return query;
      }),

    /**
     * Update opportunity status (approve/reject/promote).
     */
    updateOpportunity: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["new", "approved", "rejected", "promoted"]),
        reviewNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const { getDb } = await import("./db");
        const { backlinkOpportunities } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.update(backlinkOpportunities)
          .set({ status: input.status, reviewNotes: input.reviewNotes ?? null, reviewedAt: new Date() })
          .where(eq(backlinkOpportunities.id, input.id));
        return { success: true };
      }),

    /**
     * Get all active backlink targets.
     */
    getTargets: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const { getDb } = await import("./db");
      const { backlinkTargets } = await import("../drizzle/schema");
      const { asc } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return [];
      return db.select().from(backlinkTargets).orderBy(asc(backlinkTargets.priority));
    }),

    /**
     * Seed known PR sites into the opportunities table.
     */
    seedKnownSites: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const { seedKnownPRSites } = await import("./cron/backlinkDiscovery");
      await seedKnownPRSites();
      return { success: true };
    }),
  }),

  // ─── AI Cost Tracking ────────────────────────────────────────────────────────
  aiCost: router({
    /**
     * Overall cost summary: total spend, breakdown by day/week/month
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
     * Cost breakdown by model
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
     * Cost breakdown by feature (press_release, blog, embedding, etc.)
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
          console.error("[BlogStudio] GA4 fetch failed:", err);
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
        // Keyword density
        let keywordDensity = 0;
        let keywordCount = 0;
        if (targetKeyword && wordCount > 0) {
          const kw = targetKeyword.toLowerCase();
          keywordCount = (text.toLowerCase().match(new RegExp(kw, "g")) || []).length;
          keywordDensity = parseFloat(((keywordCount / wordCount) * 100).toFixed(2));
        }
        // Build suggestions
        const suggestions: Array<{ type: "warning" | "success" | "info"; message: string }> = [];
        if (wordCount < 800) suggestions.push({ type: "warning", message: `Word count is ${wordCount} — aim for 1,200+ for competitive solar keywords` });
        else if (wordCount >= 1500) suggestions.push({ type: "success", message: `Great word count: ${wordCount} words` });
        else suggestions.push({ type: "info", message: `Word count: ${wordCount} — consider expanding to 1,500+ for better rankings` });
        if (h2Count === 0) suggestions.push({ type: "warning", message: "No H2 headings found — add at least 3 H2s with keyword variations" });
        else if (h2Count < 3) suggestions.push({ type: "info", message: `Only ${h2Count} H2 heading(s) — aim for 4-6 H2s to improve structure` });
        else suggestions.push({ type: "success", message: `Good heading structure: ${h2Count} H2s, ${h3Count} H3s` });
        if (internalLinks === 0) suggestions.push({ type: "warning", message: "No internal links — add links to city pages, state law pages, or company pages" });
        else if (internalLinks < 3) suggestions.push({ type: "info", message: `${internalLinks} internal link(s) — aim for 5-8 internal links per post` });
        else suggestions.push({ type: "success", message: `Good internal linking: ${internalLinks} internal links` });
        if (externalLinks === 0) suggestions.push({ type: "info", message: "No external links — add 1-2 authoritative sources (FTC, CFPB, state AG) for E-E-A-T" });
        if (targetKeyword) {
          if (keywordDensity === 0) suggestions.push({ type: "warning", message: `Target keyword "${targetKeyword}" not found in content` });
          else if (keywordDensity < 0.5) suggestions.push({ type: "info", message: `Keyword density ${keywordDensity}% — slightly low, aim for 0.8-1.5%` });
          else if (keywordDensity > 3) suggestions.push({ type: "warning", message: `Keyword density ${keywordDensity}% — too high, risk of keyword stuffing` });
          else suggestions.push({ type: "success", message: `Keyword density ${keywordDensity}% — in the ideal range` });
          if (!title.toLowerCase().includes(targetKeyword.toLowerCase())) {
            suggestions.push({ type: "warning", message: `Target keyword not in title — include "${targetKeyword}" in the title tag` });
          }
        }
        if (title.length < 30) suggestions.push({ type: "warning", message: `Title is too short (${title.length} chars) — aim for 50-60 characters` });
        else if (title.length > 65) suggestions.push({ type: "warning", message: `Title is too long (${title.length} chars) — keep under 65 characters to avoid truncation` });
        else suggestions.push({ type: "success", message: `Title length is good: ${title.length} characters` });
        return { wordCount, readingTime, h2Count, h3Count, internalLinks, externalLinks, keywordDensity, keywordCount, suggestions };
      }),

    /**
     * Generate AI content via OpenRouter with model selection
     * Returns full text (streaming handled client-side via SSE endpoint)
     */
    generateContent: protectedProcedure
      .input(z.object({
        prompt: z.string(),
        model: z.string().default("openrouter/owl-alpha"),
        systemPrompt: z.string().optional(),
        existingContent: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");
        const messages: Array<{ role: string; content: string }> = [];
        const systemMsg = input.systemPrompt || `You are an expert SEO content writer specializing in solar contract law, consumer protection, and homeowner rights. Write compelling, authoritative content for breakyoursolarcontract.com. Use proper HTML formatting with <h2>, <h3>, <p>, <ul>, <li>, <strong> tags. Target 1,200-2,000 words for full articles. Include internal link placeholders like [LINK:/city/phoenix-az|Phoenix homeowners] where relevant.`;
        messages.push({ role: "system", content: systemMsg });
        if (input.existingContent) {
          messages.push({ role: "user", content: `Here is the existing content:\n\n${input.existingContent}\n\nNow: ${input.prompt}` });
        } else {
          messages.push({ role: "user", content: input.prompt });
        }
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://breakyoursolarcontract.com",
            "X-Title": "Solar Freedom Blog Studio",
          },
          body: JSON.stringify({ model: input.model, messages, max_tokens: 4096 }),
        });
        if (!response.ok) {
          const err = await response.text();
          throw new Error(`OpenRouter error: ${response.status} ${err}`);
        }
        const data = await response.json() as { choices: Array<{ message: { content: string } }> };
        const content = data.choices[0]?.message?.content ?? "";
        return { content };
      }),

    /**
     * Generate an image for a blog post via OpenRouter image models
     */
    generateImage: protectedProcedure
      .input(z.object({
        prompt: z.string(),
        model: z.string().default("bytedance-seed/seedream-4.5"),
        postSlug: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        try {
          const { generateImage } = await import("./_core/imageGeneration");
          const result = await generateImage({ prompt: input.prompt });
          if (!result.url) throw new Error("Image generation returned no URL");
          // Store in S3 for reuse
          const imageResponse = await fetch(result.url);
          const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
          const key = `blog-images/${input.postSlug ?? "generated"}-${Date.now()}.jpg`;
          const { storagePut } = await import("./storage");
          const stored = await storagePut(key, imageBuffer, "image/jpeg");
          return { url: stored.url, key: stored.key };
        } catch (err) {
          throw new Error(`Image generation failed: ${err}`);
        }
      }),
  }),

  // ─── Blog Drafts ──────────────────────────────────────────────────────────
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
