/**
 * Lead Distribution Engine
 * Scores incoming leads, matches them to law firms, and delivers via webhook or email.
 */

import { getDb } from "./db";
import { lawFirms, leadDeliveries, leads, LawFirm } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";

// ─── Lead Quality Scoring ──────────────────────────────────────────────────────

/**
 * Scores a lead 0-10 based on payment amount, company, problem type, and intent.
 * Higher score = more likely to convert = more valuable to law firms.
 */
export function scoreLead(lead: {
  monthlyPayment?: string | null;
  solarCompany?: string | null;
  problemType?: string | null;
  intent?: string | null;
}): { score: number; breakdown: Record<string, number> } {
  let score = 0;
  const breakdown: Record<string, number> = { payment: 0, company: 0, issue: 0, intent: 0 };

  // Payment amount (0-3 points) — higher payment = more motivated to cancel
  const payment = lead.monthlyPayment ?? "";
  if (payment.includes("Over $250")) { breakdown.payment = 3; }
  else if (payment.includes("$200")) { breakdown.payment = 2; }
  else if (payment.includes("$150")) { breakdown.payment = 2; }
  else if (payment.includes("$100")) { breakdown.payment = 1; }
  else if (payment) { breakdown.payment = 1; }
  score += breakdown.payment;

  // Solar company (0-2 points) — major companies with known legal exposure score higher
  const company = (lead.solarCompany ?? "").toLowerCase();
  const highValueCompanies = ["sunrun", "goodleap", "sunnova", "vivint", "adt solar", "tesla"];
  const medValueCompanies = ["freedom forever", "mosaic", "loanpal", "green sky"];
  if (highValueCompanies.some(c => company.includes(c))) { breakdown.company = 2; }
  else if (medValueCompanies.some(c => company.includes(c))) { breakdown.company = 1; }
  else if (company) { breakdown.company = 1; }
  score += breakdown.company;

  // Problem type (0-3 points) — misrepresentation and system failure are strongest cases
  const issue = (lead.problemType ?? "").toLowerCase();
  if (issue.includes("misled") || issue.includes("misrepresent")) { breakdown.issue = 3; }
  else if (issue.includes("doesn't work") || issue.includes("underperform")) { breakdown.issue = 3; }
  else if (issue.includes("can't sell") || issue.includes("sell my home")) { breakdown.issue = 2; }
  else if (issue.includes("hidden fees") || issue.includes("payment too high")) { breakdown.issue = 2; }
  else if (issue.includes("company went out") || issue.includes("bankrupt")) { breakdown.issue = 2; }
  else if (issue) { breakdown.issue = 1; }
  score += breakdown.issue;

  // Intent (0-2 points) — "want out ASAP" is the highest value signal
  const intent = (lead.intent ?? "").toLowerCase();
  if (intent.includes("asap") || intent.includes("immediately")) { breakdown.intent = 2; }
  else if (intent.includes("possibly") || intent.includes("options")) { breakdown.intent = 1; }
  else if (intent.includes("exploring")) { breakdown.intent = 0; }
  score += breakdown.intent;

  return { score: Math.min(score, 10), breakdown };
}

// ─── Geographic Matching ───────────────────────────────────────────────────────

/**
 * Extracts the 2-letter state code from a source page URL or city slug.
 * e.g. "/cancel-solar-contract/dallas-tx" → "TX"
 */
function extractStateFromSource(sourcePage?: string | null): string | null {
  if (!sourcePage) return null;
  // Match city slug pattern: city-name-XX where XX is 2-letter state
  const match = sourcePage.match(/-([a-z]{2})(?:\/|$)/i);
  if (match) return match[1].toUpperCase();
  // Match state law page: /solar-contract-laws/texas → "TX" (not implemented yet, return null)
  return null;
}

/**
 * Checks if a firm covers the given state.
 * Empty coveredStates array means the firm covers all states.
 */
function firmCoversState(firm: { coveredStates: string | null }, stateCode: string | null): boolean {
  if (!stateCode) return true; // No state info = don't filter
  if (!firm.coveredStates) return true; // null = all states
  try {
    const states: string[] = JSON.parse(firm.coveredStates);
    if (states.length === 0) return true; // empty array = all states
    return states.map(s => s.toUpperCase()).includes(stateCode.toUpperCase());
  } catch {
    return true;
  }
}

// ─── Firm Matching ─────────────────────────────────────────────────────────────

/**
 * Returns all active firms that should receive this lead, sorted by exclusivity then price.
 * Exclusive firms get the lead first; if they reject it, it cascades to non-exclusive firms.
 */
export async function matchFirmsForLead(lead: {
  solarCompany?: string | null;
  problemType?: string | null;
  sourcePage?: string | null;
}, leadScore: number): Promise<LawFirm[]> {
  const db = await getDb();
  if (!db) return [];
  const allFirms = await db.select().from(lawFirms).where(eq(lawFirms.status, "active"));
  const stateCode = extractStateFromSource(lead.sourcePage);

  return allFirms.filter((firm: LawFirm) => {
    // Geographic filter
    if (!firmCoversState(firm, stateCode)) return false;

    // Minimum lead score filter
    if (firm.minLeadScore && leadScore < firm.minLeadScore) return false;

    // Company filter
    if (firm.filterCompanies) {
      try {
        const companies: string[] = JSON.parse(firm.filterCompanies);
        if (companies.length > 0 && lead.solarCompany) {
          const matches = companies.some(c =>
            (lead.solarCompany ?? "").toLowerCase().includes(c.toLowerCase())
          );
          if (!matches) return false;
        }
      } catch { /* ignore parse errors */ }
    }

    // Problem type filter
    if (firm.filterProblemTypes) {
      try {
        const types: string[] = JSON.parse(firm.filterProblemTypes);
        if (types.length > 0 && lead.problemType) {
          const matches = types.some(t =>
            (lead.problemType ?? "").toLowerCase().includes(t.toLowerCase())
          );
          if (!matches) return false;
        }
      } catch { /* ignore parse errors */ }
    }

    return true;
  }).sort((a: LawFirm, b: LawFirm) => {
    // Exclusive firms first
    const aExclusive = a.exclusiveStates && stateCode
      ? (JSON.parse(a.exclusiveStates) as string[]).includes(stateCode)
      : false;
    const bExclusive = b.exclusiveStates && stateCode
      ? (JSON.parse(b.exclusiveStates) as string[]).includes(stateCode)
      : false;
    if (aExclusive && !bExclusive) return -1;
    if (!aExclusive && bExclusive) return 1;
    // Then by price descending (highest paying firm gets priority)
    return parseFloat(String(b.pricePerLead)) - parseFloat(String(a.pricePerLead));
  });
}

// ─── Webhook Delivery ──────────────────────────────────────────────────────────

/**
 * Delivers a lead to a firm's webhook endpoint.
 * Signs the payload with HMAC-SHA256 if the firm has a webhook secret.
 */
export async function deliverLeadToFirm(
  lead: typeof leads.$inferSelect,
  firm: typeof lawFirms.$inferSelect,
  leadScore: number,
  scoreBreakdown: Record<string, number>
): Promise<{ success: boolean; statusCode?: number; response?: string; error?: string }> {
  if (!firm.webhookUrl) {
    return { success: false, error: "No webhook URL configured for this firm" };
  }

  const payload = {
    event: "new_lead",
    lead: {
      id: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      solarCompany: lead.solarCompany,
      problemType: lead.problemType,
      contractType: lead.contractType,
      monthlyPayment: lead.monthlyPayment,
      intent: lead.intent,
      sourcePage: lead.sourcePage,
      createdAt: lead.createdAt,
    },
    quality: { score: leadScore, breakdown: scoreBreakdown },
    firm: { id: firm.id, name: firm.name },
    timestamp: new Date().toISOString(),
  };

  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "SolarFreedom-LeadDistribution/1.0",
  };

  // HMAC signing
  if (firm.webhookSecret) {
    const sig = crypto.createHmac("sha256", firm.webhookSecret).update(body).digest("hex");
    headers["X-Solar-Freedom-Signature"] = `sha256=${sig}`;
  }

  try {
    const res = await fetch(firm.webhookUrl, { method: "POST", headers, body });
    const responseText = await res.text().catch(() => "");
    return {
      success: res.ok,
      statusCode: res.status,
      response: responseText.slice(0, 1000),
    };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Main Distribution Function ────────────────────────────────────────────────

/**
 * Called after a lead is saved to the database.
 * Scores the lead, finds matching firms, and delivers to each.
 */
export async function distributeLeadToFirms(leadId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // Fetch the lead
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
  if (!lead) return;

  // Score the lead
  const { score, breakdown } = scoreLead({
    monthlyPayment: lead.monthlyPayment,
    solarCompany: lead.solarCompany,
    problemType: lead.problemType,
    intent: lead.intent,
  });

  // Find matching firms
  const matchedFirms: LawFirm[] = await matchFirmsForLead({
    solarCompany: lead.solarCompany,
    problemType: lead.problemType,
    sourcePage: lead.sourcePage,
  }, score);

  if (matchedFirms.length === 0) return;

  // Deliver to each matched firm
  for (const firm of matchedFirms) {
    // Check daily/monthly caps
    if (firm.maxLeadsPerDay) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(leadDeliveries)
        .where(
          and(
            eq(leadDeliveries.firmId, firm.id),
            sql`${leadDeliveries.createdAt} >= ${todayStart}`
          )
        );
      if ((count as number) >= firm.maxLeadsPerDay) continue;
    }

    // Create delivery record
    const [delivery] = await db.insert(leadDeliveries).values({
      leadId: lead.id,
      firmId: firm.id,
      leadScore: score,
      scoreBreakdown: JSON.stringify(breakdown),
      deliveryMethod: firm.webhookUrl ? "webhook" : "email",
      status: "pending",
    }).$returningId();

    // Attempt webhook delivery
    if (firm.webhookUrl) {
      const result = await deliverLeadToFirm(lead, firm, score, breakdown);
      await db.update(leadDeliveries)
        .set({
          status: result.success ? "delivered" : "failed",
          webhookStatusCode: result.statusCode,
          webhookResponse: result.response ?? undefined,
          deliveredAt: result.success ? new Date() : undefined,
          lastError: result.error,
        })
        .where(eq(leadDeliveries.id, delivery.id));

      // Update firm stats
      if (result.success) {
        await db.update(lawFirms)
          .set({
            totalLeadsDelivered: sql`${lawFirms.totalLeadsDelivered} + 1`,
          })
          .where(eq(lawFirms.id, firm.id));
      }
    }
  }
}
