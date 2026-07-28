/**
 * Journey Tracking Router
 * - Public REST endpoint for receiving client-side events (POST /api/journey/event)
 * - Admin tRPC procedures for querying journey data
 */

import type { Express } from "express";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  upsertLeadSession,
  insertJourneyEvent,
  getFullLeadJourney,
  getWebsiteLeadSessions,
  getJourneyMetrics,
  getLeadSession,
  linkSessionToLead,
  linkSessionToGhlContact,
} from "./journeyDb";
import { getDb } from "./db";
import { leads } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// ─── REST endpoint (public, fire-and-forget) ──────────────────────────────────

const eventSchema = z.object({
  type: z.enum(["session_start", "pageview", "page_exit", "form_start", "form_submit", "click_cta", "exit_intent"]),
  sessionId: z.string().min(1).max(100),
  page: z.string().max(500).optional(),
  pageTitle: z.string().max(300).optional(),
  timeOnPageMs: z.number().int().min(0).max(3_600_000).optional(),
  scrollDepthPct: z.number().int().min(0).max(100).optional(),
  leadId: z.number().int().positive().optional(),
  detail: z.string().max(2000).optional(),
  // Session start fields
  firstPage: z.string().max(500).optional(),
  referrer: z.string().max(2000).optional(),
  userAgent: z.string().max(500).optional(),
  deviceType: z.enum(["mobile", "tablet", "desktop"]).optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(200).optional(),
});

export function registerJourneyEndpoint(app: Express) {
  app.post("/api/journey/event", async (req, res) => {
    try {
      const parsed = eventSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid payload" });
        return;
      }

      const data = parsed.data;

      if (data.type === "session_start") {
        // Create or update the session record
        await upsertLeadSession({
          sessionId: data.sessionId,
          firstPage: data.firstPage ?? data.page,
          lastPage: data.page,
          totalPages: 1,
          totalTimeMs: 0,
          referrer: data.referrer,
          userAgent: data.userAgent,
          deviceType: data.deviceType,
          utmSource: data.utmSource,
          utmMedium: data.utmMedium,
          utmCampaign: data.utmCampaign,
        });
      } else if (data.type === "pageview") {
        // Update session last page and page count
        const existing = await getLeadSession(data.sessionId);
        if (existing) {
          await upsertLeadSession({
            sessionId: data.sessionId,
            lastPage: data.page,
            totalPages: (existing.totalPages ?? 0) + 1,
            totalTimeMs: existing.totalTimeMs ?? 0,
          });
        } else {
          // Session not found — create it
          await upsertLeadSession({
            sessionId: data.sessionId,
            firstPage: data.page,
            lastPage: data.page,
            totalPages: 1,
            totalTimeMs: 0,
          });
        }

        // Record the pageview event
        if (data.page) {
          await insertJourneyEvent({
            sessionId: data.sessionId,
            leadId: data.leadId,
            eventType: "pageview",
            page: data.page,
            pageTitle: data.pageTitle,
            timeOnPageMs: 0,
            scrollDepthPct: 0,
          });
        }
      } else if (data.type === "page_exit") {
        // Update total time and record the page exit with time + scroll
        const existing = await getLeadSession(data.sessionId);
        if (existing) {
          await upsertLeadSession({
            sessionId: data.sessionId,
            totalTimeMs: (existing.totalTimeMs ?? 0) + (data.timeOnPageMs ?? 0),
          });
        }

        if (data.page) {
          await insertJourneyEvent({
            sessionId: data.sessionId,
            leadId: data.leadId,
            eventType: "page_exit",
            page: data.page,
            timeOnPageMs: data.timeOnPageMs ?? 0,
            scrollDepthPct: data.scrollDepthPct ?? 0,
          });
        }
      } else if (data.type === "form_submit") {
        // Link the session to the lead
        if (data.leadId) {
          await linkSessionToLead(data.sessionId, data.leadId, new Date());
        }

        await insertJourneyEvent({
          sessionId: data.sessionId,
          leadId: data.leadId,
          eventType: "form_submit",
          page: data.page ?? "/",
          detail: data.detail,
        });
      } else {
        // form_start, click_cta, exit_intent
        await insertJourneyEvent({
          sessionId: data.sessionId,
          leadId: data.leadId,
          eventType: data.type,
          page: data.page ?? "/",
          detail: data.detail,
          timeOnPageMs: data.timeOnPageMs,
          scrollDepthPct: data.scrollDepthPct,
        });
      }

      res.status(200).json({ ok: true });
    } catch (err) {
      console.error("[Journey] Event error:", err);
      res.status(500).json({ error: "Internal error" });
    }
  });
}

// ─── tRPC Admin Router ────────────────────────────────────────────────────────

function requireAdmin(role: string) {
  if (role !== "admin") throw new Error("Forbidden");
}

export const journeyRouter = router({
  /**
   * Get journey metrics summary.
   */
  metrics: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    return getJourneyMetrics();
  }),

  /**
   * List all website leads with their session data.
   */
  websiteLeads: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const sessions = await getWebsiteLeadSessions(input.limit, input.offset);

      // Enrich with lead data
      const db = await getDb();
      if (!db || sessions.length === 0) return { sessions: [], total: 0 };

      const leadIds = sessions.map(s => s.leadId!).filter(Boolean);
      let leadRows: Array<{ id: number; firstName: string | null; lastName: string | null; email: string | null; phone: string | null; solarCompany: string | null; problemType: string | null; monthlyPayment: string | null; intent: string | null; sourcePage: string | null; status: string; ghlWebhookSent: number; createdAt: Date; updatedAt: Date }> = [];
      if (leadIds.length > 0) {
        try {
          const rows = await db.select().from(leads).where(eq(leads.id, leadIds[0]));
          leadRows = Array.isArray(rows) ? rows : [];
          // For multiple leads, fetch them individually and merge
          if (leadIds.length > 1) {
            for (const lid of leadIds.slice(1)) {
              const r = await db.select().from(leads).where(eq(leads.id, lid));
              if (Array.isArray(r)) leadRows.push(...r);
            }
          }
        } catch {
          leadRows = [];
        }
      }

      // Build a map for fast lookup
      const leadMap = new Map(leadRows.map((l: any) => [l.id, l]));

      const enriched = sessions.map(session => ({
        ...session,
        lead: session.leadId ? leadMap.get(session.leadId) ?? null : null,
      }));

      return { sessions: enriched, total: enriched.length };
    }),

  /**
   * Get the full journey for a specific lead.
   */
  leadJourney: protectedProcedure
    .input(z.object({ leadId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      const journey = await getFullLeadJourney(input.leadId);

      // Also fetch the lead record
      const db = await getDb();
      let lead = null;
      if (db) {
        const rows = await db.select().from(leads).where(eq(leads.id, input.leadId)).limit(1);
        lead = rows[0] ?? null;
      }

      return { ...journey, lead };
    }),

  /**
   * Link a GHL contact ID to a session (called after GHL sync).
   */
  linkGhlContact: protectedProcedure
    .input(z.object({ sessionId: z.string(), ghlContactId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      await linkSessionToGhlContact(input.sessionId, input.ghlContactId);
      return { ok: true };
    }),
});
