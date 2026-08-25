/**
 * Overnight attorney discovery callback.
 *
 * An isolated scheduled research agent submits only public, source-backed firm
 * records here. The callback neither contacts a prospect nor reads LinkedIn.
 */
import type { Request, Response } from "express";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { sdk } from "../_core/sdk";
import { getDb } from "../db";
import { agentChatThreads, attorneyProspects } from "../../drizzle/schema";
import { buildLinkedInLookupUrl } from "../attorneyQuality";

const candidateSchema = z.object({
  firmName: z.string().min(2).max(300),
  state: z.string().min(2).max(50),
  city: z.string().max(100).optional(),
  website: z.string().url().max(500).optional(),
  phone: z.string().max(50).optional(),
  practiceAreas: z.array(z.string().min(2).max(120)).max(8).default([]),
  sourceUrl: z.string().url().max(1000),
  sourceNote: z.string().min(8).max(500),
});

const payloadSchema = z.object({
  results: z.array(candidateSchema).max(8),
  researchSummary: z.string().min(8).max(1500),
});

type AttorneyDiscoveryCandidate = z.infer<typeof candidateSchema>;

export function buildAttorneyDiscoveryRecord(candidate: AttorneyDiscoveryCandidate) {
  const overallScore = Math.min(
    100,
    30 +
      (candidate.website ? 15 : 0) +
      (candidate.phone ? 10 : 0) +
      15 +
      (candidate.practiceAreas.length ? 15 : 0),
  );
  return {
    firmName: candidate.firmName,
    state: candidate.state,
    city: candidate.city || null,
    website: candidate.website || null,
    phone: candidate.phone || null,
    practiceAreas: JSON.stringify(candidate.practiceAreas),
    overallScore,
    scoreBreakdown: JSON.stringify({
      directPublicEvidence: 30,
      website: candidate.website ? 15 : 0,
      phone: candidate.phone ? 10 : 0,
      geographicMatch: 15,
      statedPracticeSignal: candidate.practiceAreas.length ? 15 : 0,
      unknownPartnerFit: 0,
    }),
    outreachStatus: "researching" as const,
    outreachNotes: `Scheduled research evidence: ${candidate.sourceNote}\nSource: ${candidate.sourceUrl}\nNext step: run the partner quality review before drafting outreach.`,
    discoveredBy: "money_maker",
    discoveredVia: "scheduled_public_research",
    sourceUrl: candidate.sourceUrl,
    linkedInSearchUrl: buildLinkedInLookupUrl(candidate.firmName, candidate.state),
    linkedInResearchStatus: "research_ready" as const,
    verifiedAt: new Date(),
  };
}

export async function attorneyDiscoveryHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only endpoint" });

    const payload = payloadSchema.parse(req.body || {});
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    let saved = 0;
    let duplicates = 0;
    for (const candidate of payload.results) {
      const existing = await db.select({ id: attorneyProspects.id })
        .from(attorneyProspects)
        .where(and(eq(attorneyProspects.firmName, candidate.firmName), eq(attorneyProspects.state, candidate.state)))
        .limit(1);
      if (existing.length) {
        duplicates++;
        continue;
      }
      await db.insert(attorneyProspects).values(buildAttorneyDiscoveryRecord(candidate));
      saved++;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await db.insert(agentChatThreads).values({
      agentSlug: "money_maker",
      runId: null,
      role: "agent",
      message: `Overnight public attorney research completed: ${saved} new evidence-backed prospect${saved === 1 ? "" : "s"} saved; ${duplicates} duplicate${duplicates === 1 ? "" : "s"} skipped. No outreach was sent. ${payload.researchSummary}`,
      messageType: "result",
      metadata: JSON.stringify({ taskUid: user.taskUid, saved, duplicates, candidateCount: payload.results.length }),
      createdAt: new Date(),
      expiresAt,
    });

    return res.json({ ok: true, saved, duplicates, candidateCount: payload.results.length, taskUid: user.taskUid });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[AttorneyDiscovery] Error:", error);
    return res.status(500).json({ ok: false, error: message, context: { path: req.path }, timestamp: new Date().toISOString() });
  }
}
