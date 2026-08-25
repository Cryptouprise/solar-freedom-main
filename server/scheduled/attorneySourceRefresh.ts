/**
 * Public-contact enrichment for existing attorney prospects.
 *
 * This cron intentionally reads at most a small batch of official firm homepages,
 * keeps only visible business contact routes, and never contacts a prospect.
 */
import type { Request, Response } from "express";
import { and, asc, eq, isNotNull, isNull, or } from "drizzle-orm";
import { sdk } from "../_core/sdk";
import { getDb } from "../db";
import { agentChatThreads, attorneyProspects } from "../../drizzle/schema";

const MAX_PROSPECTS_PER_RUN = 8;
const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

export function isSafePublicWebsite(value: string | null | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const host = url.hostname.toLowerCase();
    if (BLOCKED_HOSTS.has(host) || host.endsWith(".local") || host.endsWith(".internal")) return false;
    if (/^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

export function extractPublicBusinessContacts(html: string) {
  const emails = Array.from(html.matchAll(/(?:mailto:|\b)([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi))
    .map(match => match[1].toLowerCase())
    .filter(email => !/\.(png|jpe?g|webp|svg|gif)$/i.test(email));
  const telMatch = html.match(/tel:\s*([+()\-\.\s\d]{7,})/i);
  const fallbackPhone = html.match(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]\d{4}/);
  return {
    email: emails[0] || null,
    phone: (telMatch?.[1] || fallbackPhone?.[0] || null)?.replace(/\s+/g, " ").trim() || null,
  };
}

async function fetchPublicContacts(website: string) {
  const response = await fetch(website, {
    redirect: "follow",
    signal: AbortSignal.timeout(8_000),
    headers: { "User-Agent": "SolarFreedomPartnerResearch/1.0 (+https://breakyoursolarcontract.com)" },
  });
  if (!response.ok) throw new Error(`Website returned HTTP ${response.status}`);
  const html = await response.text();
  return { ...extractPublicBusinessContacts(html), sourceUrl: response.url || website };
}

export async function attorneySourceRefreshHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only endpoint" });
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const candidates = await db.select().from(attorneyProspects)
      .where(and(isNotNull(attorneyProspects.website), or(isNull(attorneyProspects.email), isNull(attorneyProspects.phone))))
      .orderBy(asc(attorneyProspects.qualityTier), asc(attorneyProspects.createdAt))
      .limit(MAX_PROSPECTS_PER_RUN);

    let visited = 0;
    let enriched = 0;
    let skipped = 0;
    let failures = 0;
    for (const prospect of candidates) {
      if (!isSafePublicWebsite(prospect.website)) { skipped++; continue; }
      visited++;
      try {
        const found = await fetchPublicContacts(prospect.website!);
        const fields = {
          email: prospect.email || found.email,
          phone: prospect.phone || found.phone,
          verifiedAt: new Date(),
          updatedAt: new Date(),
          outreachNotes: `${prospect.outreachNotes || ""}\n[Public source refresh ${new Date().toISOString()}] Checked ${found.sourceUrl}; ${prospect.email || !found.email ? "email unchanged" : "public email added"}; ${prospect.phone || !found.phone ? "phone unchanged" : "public phone added"}.`.trim(),
        };
        if (fields.email !== prospect.email || fields.phone !== prospect.phone) enriched++;
        await db.update(attorneyProspects).set(fields).where(eq(attorneyProspects.id, prospect.id));
      } catch (error) {
        failures++;
        console.warn("[AttorneySourceRefresh] Public website check failed", { prospectId: prospect.id, error: String(error) });
      }
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await db.insert(agentChatThreads).values({
      agentSlug: "money_maker",
      runId: null,
      role: "agent",
      message: `Overnight public-source refresh completed: ${visited} official firm website${visited === 1 ? "" : "s"} checked; ${enriched} prospect${enriched === 1 ? "" : "s"} enriched with a previously missing public phone or email; ${skipped} unsafe or missing website${skipped === 1 ? "" : "s"} skipped; ${failures} website check${failures === 1 ? "" : "s"} failed. No outreach was sent.`,
      messageType: "result",
      metadata: JSON.stringify({ taskUid: user.taskUid, visited, enriched, skipped, failures }),
      createdAt: new Date(),
      expiresAt,
    });
    res.json({ ok: true, visited, enriched, skipped, failures, taskUid: user.taskUid });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[AttorneySourceRefresh] Error:", error);
    res.status(500).json({ ok: false, error: message, context: { path: req.path }, timestamp: new Date().toISOString() });
  }
}
