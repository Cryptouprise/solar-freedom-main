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
import { agentRouter } from "./agentRouter";
import { ghlRouter } from "./ghlRouter";
import { journeyRouter } from "./journeyRouter";
import { revenueIntelRouter } from "./revenueIntelRouter";
import { getGA4Report } from "./ga4";
import { decodeBase64Image, safeImageStem } from "./security/imageUpload";
import { enforcePublicMutationLimit } from "./security/rateLimit";
import { isAllowedPressReleaseSetting, PRESS_RELEASE_OPERATIONAL_KEYS } from "./security/configPolicy";

// ─── GHL Webhook helper ────────────────────────────────────────────────────────
async function sendToGHL(payload: Record<string, string | undefined>) {
  const webhookUrl = process.env.GHL_WEBHOOK_URL;
  if (!webhookUrl) return false;
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      console.error(`[GHL] Webhook returned HTTP ${response.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[GHL] Webhook failed:", err);
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
    console.error("[GHL] Delivery marker update failed after a successful webhook", {
      leadId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return {
      crmMarkerPending: true,
      syncWarning: "crm_delivery_marker_pending",
    } as const;
  }
}

function buildSmsConfirmation(firstName?: string) {
  const safeName = firstName?.trim() ? firstName.trim() : "there";
  return `Hi ${safeName}, this is Grace from Solar Freedom. Your case review request was received — I’ll be reaching out within the hour. Reply with any questions!`;
}

// ─── Routers ───────────────────────────────────────────────────────────────────
export const appRouter = router({
  agents: agentRouter,
  ghl: ghlRouter,
  journey: journeyRouter,
  revenueIntel: revenueIntelRouter,
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
          phone: z.string().min(7).max(40),
          solarCompany: z.string().max(200).optional(),
          problemType: z.string().max(200).optional(),
          contractType: z.string().max(200).optional(),
          monthlyPayment: z.string().max(100).optional(),
          intent: z.string().max(200).optional(),
          formName: z.string().max(200).optional(),
          sourcePage: z.string().max(500).optional(),
          sourceUrl: z.string().max(2_000).optional(),
          sessionId: z.string().max(100).optional(), // journey tracking session
        })
      )
      .mutation(async ({ ctx, input }) => {
        enforcePublicMutationLimit(ctx.req, "lead-submit");
        // 1. Persist to database
        const leadId = await insertLead({
          ...input,
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

        // 1b. Link journey session to this lead (fire-and-forget)
        if (persisted && input.sessionId) {
          import("./journeyDb")
            .then(({ linkSessionToLead }) => linkSessionToLead(input.sessionId!, leadId, new Date()))
            .catch((err) => console.error("[Journey] Failed to link session:", err));
        }

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

        // 3. Record delivery without turning bookkeeping failure into lead failure.
        const crmMarker = await recordGhlDelivery(leadId, ghlSuccess);

        // 4. Distribute to law firm partners (fire-and-forget — never block the response).
        import("./leadDistribution")
          .then(({ distributeLeadToFirms }) => distributeLeadToFirms(leadId))
          .catch((err) => console.error("[LeadDistribution] Failed to distribute lead:", err));

        return {
          success: true,
          persisted: true,
          crmSent: ghlSuccess,
          crmPending: !ghlSuccess,
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
          phone: z.string().min(7).max(40),
          name: z.string().max(200).optional(),
          intent: z.string().max(200).optional(),
          sourcePage: z.string().max(500).optional(),
          sourceUrl: z.string().max(2_000).optional(),
          formName: z.string().max(200).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        enforcePublicMutationLimit(ctx.req, "lead-callback");
        const firstName = (input.name?.trim().split(" ")[0] || "").trim();
        const lastName = input.name?.trim().split(" ").slice(1).join(" ") || "";

        const leadId = await insertLead({
          firstName: firstName || null,
          lastName: lastName || null,
          phone: input.phone,
          email: null,
          formName: input.formName ?? "quick_callback_request",
          intent: input.intent,
          sourcePage: input.sourcePage ?? "unknown",
          sourceUrl: input.sourceUrl,
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

        const ghlSuccess = await sendToGHL({
          phone: input.phone,
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
          trigger_sms_confirmation: "1",
          sms_confirmation_message: buildSmsConfirmation(firstName),
        });

        const crmMarker = await recordGhlDelivery(leadId, ghlSuccess);

        return {
          success: true,
          persisted: true,
          crmSent: ghlSuccess,
          crmPending: !ghlSuccess,
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
     * Get the Strategy & SEO brief for a post by slug.
     * Checks blogDrafts (agent-written) first, then contentPipeline, returns null if none found.
     */
    getPostBrief: protectedProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const db = await getDb();
        if (!db) return null;
        const { blogDrafts, contentPipeline } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");

        // 1. Check blogDrafts for agent-written brief (most recent with contentBrief)
        const drafts = await db
          .select()
          .from(blogDrafts)
          .where(eq(blogDrafts.postSlug, input.slug))
          .orderBy(desc(blogDrafts.updatedAt))
          .limit(10);
        const draftWithBrief = drafts.find(d => d.contentBrief);
        if (draftWithBrief?.contentBrief) {
          try {
            const brief = JSON.parse(draftWithBrief.contentBrief);
            return {
              source: "draft" as const,
              targetKeyword: draftWithBrief.targetKeyword ?? null,
              brief,
            };
          } catch { /* fall through */ }
        }

        // 2. Check contentPipeline by slug
        const pipeline = await db
          .select()
          .from(contentPipeline)
          .where(eq(contentPipeline.slug, input.slug))
          .orderBy(desc(contentPipeline.updatedAt))
          .limit(1);
        const pipeItem = pipeline[0];
        if (pipeItem?.contentBrief) {
          try {
            const brief = JSON.parse(pipeItem.contentBrief);
            return {
              source: "pipeline" as const,
              targetKeyword: pipeItem.targetKeyword ?? null,
              brief,
            };
          } catch { /* fall through */ }
        }

        // 3. Return structured fields from pipeline even without a full brief
        if (pipeItem) {
          return {
            source: "pipeline" as const,
            targetKeyword: pipeItem.targetKeyword ?? null,
            brief: {
              keywordStrategy: pipeItem.targetKeyword
                ? `Primary keyword: ${pipeItem.targetKeyword}${pipeItem.secondaryKeywords ? `. Secondary: ${pipeItem.secondaryKeywords}` : ""}`
                : null,
              whyNow: null,
              trendingSignals: null,
              competitorGap: null,
              serpAnalysis: null,
              leadPlan: null,
              revenueCase: null,
              hotCompanies: [],
              hotKeywords: pipeItem.targetKeyword ? [pipeItem.targetKeyword] : [],
            },
          };
        }

        return null;
      }),

    /**
     * Audit a blog post for SEO, copy quality, spacing, interlinking, and image placement.
     * Returns actionable issues with severity and fix suggestions.
     */
    seoAudit: protectedProcedure
      .input(z.object({ slug: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const { blogPosts } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const posts = await db.select().from(blogPosts).where(eq(blogPosts.slug, input.slug)).limit(1);
        const post = posts[0];
        if (!post) throw new Error("Post not found");

        const { callLLM } = await import("./cron/aiCostTracker");

        const auditPrompt = `You are an elite SEO and content quality auditor. Analyze this blog post and return a JSON audit report.

Post Title: ${post.title}
Post Slug: ${post.slug}
Meta Description: ${post.metaDescription || "MISSING"}
Content (first 8000 chars):
${(post.content || "").slice(0, 8000)}

Return ONLY valid JSON in this exact structure:
{
  "overallScore": <0-100 integer>,
  "seoScore": <0-25>,
  "readabilityScore": <0-25>,
  "conversionScore": <0-25>,
  "complianceScore": <0-25>,
  "issues": [
    {
      "id": "unique_snake_case_id",
      "severity": "critical" | "warning" | "info",
      "category": "seo" | "readability" | "conversion" | "images" | "interlinking" | "structure",
      "title": "Short issue title",
      "description": "Specific description of the problem",
      "fix": "Exact actionable fix instruction",
      "autoFixable": true | false
    }
  ],
  "targetKeyword": "best guess at primary keyword",
  "wordCount": <integer>,
  "h2Count": <integer>,
  "h3Count": <integer>,
  "imageCount": <integer>,
  "internalLinkCount": <integer>,
  "externalLinkCount": <integer>,
  "hasMetaDescription": <boolean>,
  "hasFocusKeywordInTitle": <boolean>,
  "hasFocusKeywordInMeta": <boolean>,
  "hasFocusKeywordInFirstParagraph": <boolean>,
  "recommendations": ["Top 3-5 highest-impact improvements as plain strings"]
}`;

        const result = await callLLM({
          model: "anthropic/claude-opus-5",
          messages: [{ role: "user", content: auditPrompt }],
          feature: "seo_audit",
          referenceId: post.id,
          referenceType: "blog_post",
          maxTokens: 3000,
        });

        try {
          // Extract JSON from response
          const jsonMatch = result.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("No JSON in response");
          return JSON.parse(jsonMatch[0]);
        } catch {
          throw new Error("Failed to parse audit response");
        }
      }),

    /**
     * Rewrite and optimize a blog post to achieve maximum SEO score.
     * Fixes spacing, structure, CTAs, interlinking, and copy quality in one shot.
     */
    optimizeTo100: protectedProcedure
      .input(z.object({
        slug: z.string(),
        issues: z.array(z.object({
          id: z.string(),
          title: z.string(),
          fix: z.string(),
          autoFixable: z.boolean(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const { blogPosts } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const posts = await db.select().from(blogPosts).where(eq(blogPosts.slug, input.slug)).limit(1);
        const post = posts[0];
        if (!post) throw new Error("Post not found");

        const { callLLM } = await import("./cron/aiCostTracker");

        const issueList = (input.issues || [])
          .filter(i => i.autoFixable)
          .map(i => `- ${i.title}: ${i.fix}`)
          .join("\n");

        const optimizePrompt = `You are an elite SEO content optimizer and viral copywriter. Rewrite and improve this blog post to achieve a PERFECT score. You must specifically fix three critical areas: PARAGRAPH SPACING, IMAGE PLACEMENT, and INTERNAL BACKLINKS.

Current Title: ${post.title}
Current Meta Description: ${post.metaDescription || "MISSING"}

Issues to fix:
${issueList || "General optimization: fix spacing, images, interlinking, H2/H3 structure, CTAs, keyword density, paragraph flow, make it viral."}

Current Content:
${(post.content || "").slice(0, 6000)}

=== PARAGRAPH SPACING RULES (CRITICAL) ===
- MAXIMUM 3 sentences per paragraph. If a paragraph has 4+ sentences, SPLIT IT.
- Add a blank line between EVERY paragraph — no exceptions.
- After every H2 or H3 heading, start a new short paragraph (1-2 sentences max as intro).
- Use one-sentence "power paragraphs" for emphasis (bold the key phrase).
- Never have more than 3 paragraphs in a row without a heading, image, blockquote, or list.
- Lists should have no more than 5-7 items. Break longer lists into multiple sections.

=== IMAGE PLACEMENT RULES (CRITICAL) ===
- Place one image every 300 words of text. NEVER go 400+ words without an image.
- NEVER stack two images back-to-back — always have at least one paragraph between images.
- First image MUST appear within the first 200 words (below the opening hook).
- Each image must have descriptive alt text with the target keyword or a variation.
- Use this format: <img src="IMAGE_PLACEHOLDER_[description]" alt="descriptive alt text" />
- Place images BETWEEN sections (after an H2/H3, before the next paragraph) — never mid-paragraph.
- If the post has fewer than 3 images total, ADD image placeholders where they belong.

=== INTERNAL BACKLINKS RULES (CRITICAL) ===
- Add MINIMUM 5 internal links throughout the article. Target 7-10 for longer posts.
- Link to relevant CITY pages: /cancel-solar-contract/[city-slug] (e.g., /cancel-solar-contract/jacksonville-fl)
- Link to relevant COMPANY pages: /solar-company/[company-slug] (e.g., /solar-company/sunrun)
- Link to relevant STATE LAW pages: /solar-contract-laws/[state] (e.g., /solar-contract-laws/florida)
- Link to relevant BLOG posts: /blog/[slug] (e.g., /blog/solar-contract-rescission-rights)
- Use natural anchor text — NOT "click here" or "read more". Use descriptive phrases like "Florida solar contract cancellation laws" or "Sunrun complaint patterns".
- Spread links throughout the article — not all in one section.
- At least 1 link in the first 200 words, at least 1 in the last 200 words.
- Add a "Related Resources" or "Learn More" section before the FAQ with 3-4 internal links.

=== ADDITIONAL RULES ===
- Keep all factual claims, legal citations, and phone number (904) 921-4971
- Add H2 headings every 300-400 words
- Add H3 subheadings within sections
- Bold key terms, company names, and dollar amounts
- Strengthen CTAs — make them urgent, specific, and emotional
- Add a FAQ section at the end with 3-5 questions (with FAQPage schema-friendly format)
- Make the opening hook more compelling — use a statistic, question, or bold claim
- Use power words: "exposed," "trapped," "escape," "freedom," "fight back," "your rights"
- Never claim to be attorneys — use "consumer protection advocates" or "case specialists"
- Add a strong CTA after every 2-3 sections (not just at the end)

Return ONLY valid JSON:
{
  "title": "optimized title (keep if already good)",
  "metaDescription": "optimized meta description (150-160 chars, includes keyword)",
  "content": "full optimized HTML/markdown content with all spacing, images, and links fixed",
  "improvements": ["list of specific changes made — mention spacing fixes, image placements added, and internal links added"]
}`;

        const result = await callLLM({
          model: "anthropic/claude-opus-5",
          messages: [{ role: "user", content: optimizePrompt }],
          feature: "optimize_to_100",
          referenceId: post.id,
          referenceType: "blog_post",
          maxTokens: 4000,
        });

        try {
          const jsonMatch = result.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("No JSON in response");
          const optimized = JSON.parse(jsonMatch[0]);

          // Save the optimized content back to the post
          await db.update(blogPosts)
            .set({
              title: optimized.title || post.title,
              metaDescription: optimized.metaDescription || post.metaDescription,
              content: optimized.content || post.content,
              updatedAt: new Date(),
            })
            .where(eq(blogPosts.id, post.id));

          return {
            success: true,
            title: optimized.title,
            metaDescription: optimized.metaDescription,
            improvements: optimized.improvements || [],
          };
        } catch {
          throw new Error("Failed to parse optimization response");
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
          sourcePage: z.string().max(500).optional(),
          wantsGuide: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        enforcePublicMutationLimit(ctx.req, "exit-intent");
        const captureId = await insertExitIntentCapture({ email: input.email, sourcePage: input.sourcePage });
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
        const crmSent = await sendToGHL({
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
          crmPending: !crmSent,
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

  // ─── Fix SEO to 100 ───────────────────────────────────────────────────────
  fixSeo: router({
    /**
     * Auto-fix all SEO issues in a blog post:
     * - Keyword density (title, H1, first paragraph, body)
     * - Heading structure (H2/H3 hierarchy, keyword in headings)
     * - Internal interlinking (inject relevant links from site)
     * - Meta title & description optimization
     * - FAQ section injection if missing
     * - CTA injection if missing
     * - Word count expansion if under 1200
     * Returns the fixed content + updated meta fields + a change summary
     */
    fixSeoTo100: protectedProcedure
      .input(z.object({
        slug: z.string(),
        title: z.string(),
        content: z.string(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        targetKeyword: z.string(),
        model: z.string().default("openrouter/owl-alpha"),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

        // ── 1. Gather all published slugs for interlinking ──────────────────
        const { getAllBlogPostsAdmin } = await import("./db");
        const allPosts = await getAllBlogPostsAdmin(500, 0);
        const otherSlugs = allPosts
          .filter((p: any) => p.slug !== input.slug && p.published)
          .map((p: any) => ({ slug: p.slug, title: p.title }))
          .slice(0, 60); // cap to avoid huge prompts

        // ── 2. Build the fix prompt ─────────────────────────────────────────
        const interlinks = otherSlugs
          .map((p: any) => `  /blog/${p.slug} — "${p.title}"`)
          .join("\n");

        const systemPrompt = `You are an expert SEO editor for breakyoursolarcontract.com — a legal services site helping homeowners escape predatory solar contracts.

Your job is to rewrite the provided article to achieve a perfect SEO score of 100/100. Apply ALL of the following fixes:

1. KEYWORD DENSITY: The target keyword is "${input.targetKeyword}". Ensure it appears:
   - In the <h1> or title
   - In the first <p> paragraph
   - In at least 2 <h2> headings
   - At a density of 0.8-1.5% throughout the body
   - Naturally — no stuffing

2. HEADING STRUCTURE:
   - Must have 4-6 <h2> headings with keyword variations
   - Must have 2-4 <h3> subheadings under each major section
   - First heading must be an <h2> (not h1 — that's the title)

3. INTERNAL INTERLINKING:
   - Add 5-8 internal links to relevant pages on the site
   - Use ONLY slugs from this list (pick the most relevant ones):
${interlinks}
   - Format links as: <a href="/blog/SLUG">anchor text</a> or <a href="/city/SLUG">anchor text</a>
   - Also link to /solar-contract-laws, /solar-companies, or /solar-fraud-report where relevant
   - Anchor text must be natural and descriptive (not "click here")

4. META TITLE (return in JSON):
   - 50-60 characters
   - Must include "${input.targetKeyword}"
   - Must include a power word (e.g., "How to", "Guide", "2025", "Free")

5. META DESCRIPTION (return in JSON):
   - 150-160 characters
   - Must include "${input.targetKeyword}"
   - Must include a clear CTA (e.g., "Get a free case review today")
   - Must create urgency or curiosity

6. FAQ SECTION:
   - If no FAQ section exists, add one with 4-5 questions and answers
   - Questions must be long-tail keyword variations of "${input.targetKeyword}"
   - Wrap in <div class="faq-section"><h2>Frequently Asked Questions</h2>...

7. CTA SECTION:
   - If no CTA exists at the end, add one:
   <div class="cta-box"><h3>Get Your Free Solar Contract Review</h3><p>Our attorneys have helped hundreds of homeowners escape predatory solar contracts. Get a free case evaluation today.</p></div>

8. WORD COUNT:
   - If under 1,200 words, expand with additional relevant sections
   - Target 1,500-2,000 words

Return your response as valid JSON with this exact structure:
{
  "content": "<full rewritten HTML content>",
  "metaTitle": "optimized meta title",
  "metaDescription": "optimized meta description",
  "changes": [
    { "type": "keyword", "description": "Added keyword to first paragraph" },
    { "type": "heading", "description": "Added 3 new H2 headings" },
    { "type": "link", "description": "Added 6 internal links" },
    { "type": "meta", "description": "Rewrote meta title and description" },
    { "type": "faq", "description": "Added FAQ section with 5 questions" },
    { "type": "cta", "description": "Added CTA section at end" }
  ]
}`;

        const userPrompt = `Title: ${input.title}
Current Meta Title: ${input.metaTitle || "(none)"}
Current Meta Description: ${input.metaDescription || "(none)"}
Target Keyword: ${input.targetKeyword}

Current Content:
${input.content}

Fix all SEO issues and return the improved version as JSON.`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://breakyoursolarcontract.com",
            "X-Title": "Solar Freedom Blog Studio SEO Fixer",
          },
          body: JSON.stringify({
            model: input.model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            max_tokens: 8192,
            response_format: { type: "json_object" },
          }),
        });

        if (!response.ok) {
          const err = await response.text();
          throw new Error(`OpenRouter error: ${response.status} ${err}`);
        }

        const data = await response.json() as { choices: Array<{ message: { content: string } }> };
        const raw = data.choices[0]?.message?.content ?? "{}";

        let parsed: {
          content: string;
          metaTitle: string;
          metaDescription: string;
          changes: Array<{ type: string; description: string }>;
        };

        try {
          parsed = JSON.parse(raw);
        } catch {
          // Fallback: try to extract JSON from the response
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("AI returned invalid JSON");
          parsed = JSON.parse(jsonMatch[0]);
        }

        if (!parsed.content) throw new Error("AI returned empty content");

        return {
          content: parsed.content,
          metaTitle: parsed.metaTitle || input.metaTitle || "",
          metaDescription: parsed.metaDescription || input.metaDescription || "",
          changes: parsed.changes || [],
        };
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
      .input(z.object({
        id: z.number(),
        sessionToken: z.string(), // app_session_id cookie value from frontend
      }))
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
        }, input.sessionToken);
        await updateAutomation(input.id, { scheduleCronTaskUid: job.taskUid });
        return { taskUid: job.taskUid, nextExecutionAt: job.nextExecutionAt };
      }),

    /**
     * Deactivate (pause) the cron schedule for an automation.
     */
    deactivateSchedule: protectedProcedure
      .input(z.object({
        id: z.number(),
        sessionToken: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const { getAutomation, updateAutomation } = await import("./db");
        const { updateHeartbeatJob } = await import("./_core/heartbeat");
        const automation = await getAutomation(input.id);
        if (!automation) throw new Error("Automation not found");
        if (!automation.scheduleCronTaskUid) throw new Error("No active schedule");
        await updateHeartbeatJob(automation.scheduleCronTaskUid, { enable: false }, input.sessionToken);
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

  /**
   * Lead Distribution — law firm management, lead routing, and billing dashboard.
   * All procedures are admin-only.
   */
  leadDistribution: router({
    // ─── Firm Management ────────────────────────────────────────────────────────
    listFirms: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = await getDb();
      if (!db) return [];
      const { lawFirms } = await import("../drizzle/schema");
      return db.select().from(lawFirms).orderBy(lawFirms.name);
    }),

    getFirm: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const db = await getDb();
        if (!db) return null;
        const { lawFirms } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [firm] = await db.select().from(lawFirms).where(eq(lawFirms.id, input.id));
        return firm ?? null;
      }),

    createFirm: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        contactName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        website: z.string().optional(),
        coveredStates: z.string().optional(),   // JSON array string
        exclusiveStates: z.string().optional(),
        pricePerLead: z.string().default("0"),
        billingCycle: z.enum(["per_lead", "weekly", "monthly"]).default("per_lead"),
        webhookUrl: z.string().optional(),
        webhookSecret: z.string().optional(),
        emailDelivery: z.number().default(1),
        minLeadScore: z.number().default(0),
        filterCompanies: z.string().optional(),
        filterProblemTypes: z.string().optional(),
        maxLeadsPerDay: z.number().optional(),
        maxLeadsPerMonth: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        const { lawFirms } = await import("../drizzle/schema");
        const [result] = await db.insert(lawFirms).values(input).$returningId();
        return result;
      }),

    updateFirm: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        contactName: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        website: z.string().optional(),
        coveredStates: z.string().optional(),
        exclusiveStates: z.string().optional(),
        pricePerLead: z.string().optional(),
        billingCycle: z.enum(["per_lead", "weekly", "monthly"]).optional(),
        webhookUrl: z.string().optional(),
        webhookSecret: z.string().optional(),
        emailDelivery: z.number().optional(),
        minLeadScore: z.number().optional(),
        filterCompanies: z.string().optional(),
        filterProblemTypes: z.string().optional(),
        maxLeadsPerDay: z.number().optional(),
        maxLeadsPerMonth: z.number().optional(),
        status: z.enum(["active", "paused", "inactive"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        const { lawFirms } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { id, ...data } = input;
        await db.update(lawFirms).set(data).where(eq(lawFirms.id, id));
        return { success: true };
      }),

    deleteFirm: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        const { lawFirms } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.delete(lawFirms).where(eq(lawFirms.id, input.id));
        return { success: true };
      }),

    // ─── Lead Deliveries ────────────────────────────────────────────────────────
    listDeliveries: protectedProcedure
      .input(z.object({
        firmId: z.number().optional(),
        leadId: z.number().optional(),
        status: z.enum(["pending", "delivered", "failed", "retrying"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const db = await getDb();
        if (!db) return [];
        const { leadDeliveries, lawFirms, leads } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        const conditions = [];
        if (input.firmId) conditions.push(eq(leadDeliveries.firmId, input.firmId));
        if (input.leadId) conditions.push(eq(leadDeliveries.leadId, input.leadId));
        if (input.status) conditions.push(eq(leadDeliveries.status, input.status));
        return db.select({
          delivery: leadDeliveries,
          firmName: lawFirms.name,
          leadFirstName: leads.firstName,
          leadLastName: leads.lastName,
          leadPhone: leads.phone,
        })
          .from(leadDeliveries)
          .leftJoin(lawFirms, eq(leadDeliveries.firmId, lawFirms.id))
          .leftJoin(leads, eq(leadDeliveries.leadId, leads.id))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(leadDeliveries.createdAt))
          .limit(input.limit)
          .offset(input.offset);
      }),

    updateDeliveryAcceptance: protectedProcedure
      .input(z.object({
        id: z.number(),
        accepted: z.enum(["accepted", "rejected", "duplicate"]),
        rejectionReason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        const { leadDeliveries, lawFirms } = await import("../drizzle/schema");
        const { eq, sql } = await import("drizzle-orm");
        const [delivery] = await db.select().from(leadDeliveries).where(eq(leadDeliveries.id, input.id));
        if (!delivery) throw new Error("Delivery not found");
        await db.update(leadDeliveries).set({
          accepted: input.accepted,
          rejectionReason: input.rejectionReason,
          acceptedAt: input.accepted === "accepted" ? new Date() : undefined,
        }).where(eq(leadDeliveries.id, input.id));
        if (input.accepted === "accepted") {
          await db.update(lawFirms)
            .set({ totalLeadsAccepted: sql`${lawFirms.totalLeadsAccepted} + 1` })
            .where(eq(lawFirms.id, delivery.firmId));
        } else if (input.accepted === "rejected") {
          await db.update(lawFirms)
            .set({ totalLeadsRejected: sql`${lawFirms.totalLeadsRejected} + 1` })
            .where(eq(lawFirms.id, delivery.firmId));
        }
        return { success: true };
      }),

    // ─── Billing ────────────────────────────────────────────────────────────────
    markCharged: protectedProcedure
      .input(z.object({
        deliveryId: z.number(),
        chargeAmount: z.string(),
        invoiceRef: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        const { leadDeliveries, lawFirms } = await import("../drizzle/schema");
        const { eq, sql } = await import("drizzle-orm");
        const [delivery] = await db.select().from(leadDeliveries).where(eq(leadDeliveries.id, input.deliveryId));
        if (!delivery) throw new Error("Delivery not found");
        await db.update(leadDeliveries).set({
          charged: 1,
          chargeAmount: input.chargeAmount,
          chargedAt: new Date(),
          invoiceRef: input.invoiceRef,
        }).where(eq(leadDeliveries.id, input.deliveryId));
        await db.update(lawFirms)
          .set({ totalRevenue: sql`${lawFirms.totalRevenue} + ${input.chargeAmount}` })
          .where(eq(lawFirms.id, delivery.firmId));
        return { success: true };
      }),

    // ─── Dashboard Stats ────────────────────────────────────────────────────────
    getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = await getDb();
      if (!db) return null;
      const { lawFirms, leadDeliveries } = await import("../drizzle/schema");
      const { sql } = await import("drizzle-orm");
      const [totals] = await db.select({
        totalFirms: sql<number>`count(distinct ${lawFirms.id})`,
        activeFirms: sql<number>`sum(case when ${lawFirms.status} = 'active' then 1 else 0 end)`,
        totalDelivered: sql<number>`sum(${lawFirms.totalLeadsDelivered})`,
        totalAccepted: sql<number>`sum(${lawFirms.totalLeadsAccepted})`,
        totalRevenue: sql<number>`sum(${lawFirms.totalRevenue})`,
      }).from(lawFirms);
      const [recentDeliveries] = await db.select({
        count: sql<number>`count(*)`,
      }).from(leadDeliveries)
        .where(sql`${leadDeliveries.createdAt} >= date_sub(now(), interval 7 day)`);
      return {
        ...totals,
        deliveriesLast7Days: recentDeliveries?.count ?? 0,
      };
    }),

    // ─── Manual Distribution ─────────────────────────────────────────────────────
    distributeNow: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const { distributeLeadToFirms } = await import("./leadDistribution");
        await distributeLeadToFirms(input.leadId);
        return { success: true };
      }),

    scoreLead: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const db = await getDb();
        if (!db) return null;
        const { leads } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [lead] = await db.select().from(leads).where(eq(leads.id, input.leadId));
        if (!lead) return null;
        const { scoreLead } = await import("./leadDistribution");
        return scoreLead({
          monthlyPayment: lead.monthlyPayment,
          solarCompany: lead.solarCompany,
          problemType: lead.problemType,
          intent: lead.intent,
        });
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
