/**
 * Journey Tracking DB Helpers
 * All database operations for lead sessions, journey events, and pipeline events.
 */

import { eq, desc, and } from "drizzle-orm";
import { getDb } from "./db";
import {
  leadSessions,
  leadJourneyEvents,
  ghlPipelineEvents,
  type InsertLeadSession,
  type InsertLeadJourneyEvent,
  type InsertGhlPipelineEvent,
} from "../drizzle/schema";

// ─── Lead Sessions ────────────────────────────────────────────────────────────

export async function upsertLeadSession(data: InsertLeadSession) {
  const db = await getDb();
  if (!db) return null;

  const existing = await db
    .select()
    .from(leadSessions)
    .where(eq(leadSessions.sessionId, data.sessionId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(leadSessions)
      .set({
        lastPage: data.lastPage ?? existing[0].lastPage,
        totalPages: data.totalPages ?? existing[0].totalPages,
        totalTimeMs: data.totalTimeMs ?? existing[0].totalTimeMs,
        ctaClickCount: data.ctaClickCount ?? existing[0].ctaClickCount,
        leadId: data.leadId ?? existing[0].leadId,
        ghlContactId: data.ghlContactId ?? existing[0].ghlContactId,
        submittedAt: data.submittedAt ?? existing[0].submittedAt,
      })
      .where(eq(leadSessions.sessionId, data.sessionId));
    return existing[0].id;
  } else {
    const [result] = await db.insert(leadSessions).values(data);
    return (result as any).insertId as number;
  }
}

export async function getLeadSession(sessionId: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(leadSessions)
    .where(eq(leadSessions.sessionId, sessionId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getLeadSessionByLeadId(leadId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(leadSessions)
    .where(eq(leadSessions.leadId, leadId))
    .limit(1);
  return rows[0] ?? null;
}

export async function incrementCtaClick(sessionId: string) {
  const db = await getDb();
  if (!db) return;
  const existing = await db
    .select({ ctaClickCount: leadSessions.ctaClickCount })
    .from(leadSessions)
    .where(eq(leadSessions.sessionId, sessionId))
    .limit(1);
  if (existing.length > 0) {
    await db
      .update(leadSessions)
      .set({ ctaClickCount: (existing[0].ctaClickCount ?? 0) + 1 })
      .where(eq(leadSessions.sessionId, sessionId));
  }
}

export async function linkSessionToLead(sessionId: string, leadId: number, submittedAt: Date) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(leadSessions)
    .set({ leadId, submittedAt })
    .where(eq(leadSessions.sessionId, sessionId));
}

export async function linkSessionToGhlContact(sessionId: string, ghlContactId: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(leadSessions)
    .set({ ghlContactId })
    .where(eq(leadSessions.sessionId, sessionId));
}

// ─── Journey Events ───────────────────────────────────────────────────────────

export async function insertJourneyEvent(data: InsertLeadJourneyEvent) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(leadJourneyEvents).values(data);
  return (result as any).insertId as number;
}

export async function getJourneyEventsBySession(sessionId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(leadJourneyEvents)
    .where(eq(leadJourneyEvents.sessionId, sessionId))
    .orderBy(leadJourneyEvents.createdAt);
}

export async function getJourneyEventsByLead(leadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(leadJourneyEvents)
    .where(eq(leadJourneyEvents.leadId, leadId))
    .orderBy(leadJourneyEvents.createdAt);
}

// ─── GHL Pipeline Events ──────────────────────────────────────────────────────

export async function insertGhlPipelineEvent(data: InsertGhlPipelineEvent) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(ghlPipelineEvents).values(data);
  return (result as any).insertId as number;
}

export async function getGhlPipelineEvents(ghlContactId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(ghlPipelineEvents)
    .where(eq(ghlPipelineEvents.ghlContactId, ghlContactId))
    .orderBy(ghlPipelineEvents.occurredAt);
}

// ─── Full Journey Fetch ───────────────────────────────────────────────────────

/**
 * Get the complete journey for a lead: session + page events + pipeline events.
 */
export async function getFullLeadJourney(leadId: number) {
  const [session, journeyEvents] = await Promise.all([
    getLeadSessionByLeadId(leadId),
    getJourneyEventsByLead(leadId),
  ]);

  let pipelineEvents: Awaited<ReturnType<typeof getGhlPipelineEvents>> = [];
  if (session?.ghlContactId) {
    pipelineEvents = await getGhlPipelineEvents(session.ghlContactId);
  }

  return { session, journeyEvents, pipelineEvents };
}

// ─── Website Leads List ───────────────────────────────────────────────────────

/**
 * Get all sessions that have been linked to a lead (form submitted from website).
 * Returns sessions sorted by most recent submission.
 */
export async function getWebsiteLeadSessions(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  const sessions = await db
    .select()
    .from(leadSessions)
    .orderBy(desc(leadSessions.createdAt))
    .limit(limit + offset);

  // Filter to only those with a leadId (form was submitted)
  return sessions.filter(s => s.leadId != null).slice(offset, offset + limit);
}

/**
 * Get aggregate journey metrics for the admin dashboard.
 */
export async function getJourneyMetrics() {
  const db = await getDb();
  if (!db) return { totalSessions: 0, convertedSessions: 0, conversionRate: 0 };

  const allSessions = await db.select().from(leadSessions);
  const totalSessions = allSessions.length;
  const convertedSessions = allSessions.filter(r => r.leadId != null).length;

  return {
    totalSessions,
    convertedSessions,
    conversionRate: totalSessions > 0 ? Math.round((convertedSessions / totalSessions) * 100) : 0,
  };
}
