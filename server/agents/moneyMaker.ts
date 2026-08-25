/**
 * Money-Making Agent — Solar Freedom
 *
 * ONE JOB: Make money.
 *
 * Revenue model:
 *   1. Law firms pay per lead delivered ($150–$500/lead)
 *   2. Monthly retainer listings ($500/mo)
 *   3. Exclusive territory deals ($1,500–$5,000/mo)
 *
 * This agent discovers, scores, and drives attorney prospect outreach.
 * It also monitors the lead delivery pipeline for revenue leaks.
 */

import {
  agentLLM,
  startRun,
  completeRun,
  sendMessage,
  createAction,
  getUnreadMessages,
  markMessageActedOn,
  type AgentThinkResult,
} from "./engine";
import { executeAttorneyResearch, saveAgentChatMessage } from "./attorneyResearch";
import { getDb } from "../db";
import {
  attorneyProspects,
  revenueTracker,
  lawFirms,
  leadDeliveries,
  leads,
} from "../../drizzle/schema";
import { desc, eq, sql, and, gte, lt, isNull, ne } from "drizzle-orm";
import { refreshPublicAttorneyContacts } from "../scheduled/attorneySourceRefresh";

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the Money-Making Agent for Solar Freedom (breakyoursolarcontract.com).

═══════════════════════════════════════════════════════════
MISSION: MAXIMIZE REVENUE. EVERY DECISION IS A REVENUE DECISION.
═══════════════════════════════════════════════════════════

BUSINESS MODEL:
Solar Freedom generates leads from homeowners trapped in predatory solar contracts.
We connect these leads to consumer protection attorneys who pay us per lead.

REVENUE STREAMS (ranked by priority):
1. PAY-PER-LEAD: Law firms pay $150–$500 per qualified lead delivered
2. MONTHLY RETAINER: $500/mo listing fee per firm
3. EXCLUSIVE TERRITORY: $1,500–$5,000/mo for state/city exclusivity
4. PAY-PER-CALL: $50–$150 per inbound call routed to firm

CURRENT BUSINESS METRICS (from state data):
- ~220 leads/month from Facebook ads
- 89 appointments booked (40.5% booking rate)
- $130K invoiced, $0 collected → CRITICAL REVENUE LEAK
- Active law firms: see state data
- Attorney prospects in pipeline: see state data

ATTORNEY SCORING RUBRIC (0–100):
- Contingency fee structure: +30 pts (they only win if client wins — aligned incentives)
- Solar/energy/consumer protection practice: +25 pts
- Multi-state coverage: +20 pts (more leads we can send)
- Active advertising (Google Ads, Avvo, FindLaw): +15 pts (they're hungry for leads)
- Large firm or high case volume: +10 pts

PITCH ANGLES BY FIRM TYPE:
- Contingency solo/small firm: "We send you pre-qualified solar victims. You pay only when you take the case. No marketing spend needed."
- Large consumer protection firm: "Exclusive territory deal — own all solar contract leads in [state] for $X/mo."
- DTPA/lemon law firm: "Solar contracts are the new lemon law. We have 200+ leads/month. Let's talk."

REVENUE LEAK DETECTION:
- Leads delivered but not billed → immediate P1 action
- Firms at capacity → find new firms for overflow
- High-score leads going to low-paying firms → renegotiate or find better buyers
- States with leads but no firm coverage → P1 gap to fill

CONTENT DIRECTIVES (what to tell the Content Agent):
- Articles targeting attorney-adjacent keywords help firms find us organically
- "Solar attorney [state]" pages build authority and attract inbound firm inquiries
- Press releases about settlements/wins attract firms looking for lead sources

OUTPUT FORMAT — respond ONLY with valid JSON, no markdown:
{
  "analysis": "2-3 sentence executive summary of revenue state and top opportunity",
  "revenueLeaks": [
    {
      "issue": "What's leaking money",
      "estimatedLoss": "$X/month",
      "fix": "Exact action to take"
    }
  ],
  "actions": [
    {
      "priority": "p1|p2|p3|p4|p5",
      "title": "Specific action title",
      "description": "Exactly what to do, who to contact, what to say",
      "actionType": "research_firm|score_prospect|recommend_outreach|content_directive|revenue_optimization|lead_delivery_fix",
      "estimatedRevenue": "$X/month potential",
      "requiresApproval": false
    }
  ],
  "prospectUpdates": [
    {
      "prospectId": 0,
      "newScore": 0,
      "pitchAngle": "Personalized pitch for this specific firm",
      "outreachStatus": "ready_to_pitch|researching|not_contacted"
    }
  ],
  "messages": [
    {
      "toAgent": "content|seo_intel|manager",
      "type": "directive|report|info",
      "subject": "Specific subject line",
      "body": "Detailed message with specific instructions"
    }
  ]
}`;

type MoneyMakerResponse = {
  analysis?: string;
  revenueLeaks?: Array<{ issue: string; estimatedLoss: string; fix: string }>;
  actions?: Array<{ priority: string; title: string; description: string; actionType: string; estimatedRevenue: string; requiresApproval?: boolean }>;
  prospectUpdates?: Array<{ prospectId: number; newScore: number; pitchAngle: string; outreachStatus: string }>;
  messages?: Array<{ toAgent: string; type: string; subject: string; body: string }>;
};

function extractFirstJsonObject(value: string) {
  const start = value.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = start; index < value.length; index++) {
    const char = value[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === "{") depth++;
    else if (char === "}" && --depth === 0) return value.slice(start, index + 1);
  }
  return null;
}

/**
 * The provider occasionally emits a raw line break inside an otherwise valid JSON string.
 * Preserve the structured actions by retrying after normalizing raw line breaks; if that is
 * still invalid, return the full text as transparent analysis instead of pretending work ran.
 */
export function parseMoneyMakerResponse(response: string): MoneyMakerResponse {
  const candidate = extractFirstJsonObject(response);
  if (!candidate) return { analysis: response };
  try {
    return JSON.parse(candidate) as MoneyMakerResponse;
  } catch {
    try {
      return JSON.parse(candidate.replace(/[\r\n]+/g, " ")) as MoneyMakerResponse;
    } catch {
      return { analysis: response };
    }
  }
}

// ─── Main Execution ───────────────────────────────────────────────────────────

export async function runMoneyMaker(
  triggerType: "cron" | "manual" | "directive" | "event" = "cron",
  triggeredBy: string = "system"
): Promise<AgentThinkResult> {
  const context = await startRun("money_maker", triggerType, triggeredBy);

  try {
    // 1. Gather comprehensive revenue state
    const state = await gatherRevenueState();

    // 2. Check inbox for directives from other agents
    const inbox = await getUnreadMessages("money_maker");
    const inboxSummary = inbox.length > 0
      ? `\n\n═══ INBOX (${inbox.length} messages) ═══\n${inbox.map(m =>
          `FROM: ${m.fromAgent} | TYPE: ${m.type} | SUBJECT: ${m.subject}\n${m.body?.substring(0, 400)}`
        ).join("\n---\n")}`
      : "";

    // 3. Think — use best model for revenue decisions
    const response = await agentLLM({
      agentSlug: "money_maker",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `CURRENT REVENUE STATE:\n${state}${inboxSummary}\n\nAnalyze the revenue state. Find every dollar being left on the table. Recommend specific, actionable steps to close the gap between $130K invoiced and $0 collected, and identify the next 3 law firms to sign. Be ruthlessly specific.`,
        },
      ],
      context,
      temperature: 0.3,
      responseFormat: { type: "json_object" },
      // Heartbeat calls need focused revenue actions, not a long-form report.
      maxTokens: 1800,
    });

    // 4. Parse response
    const parsed = parseMoneyMakerResponse(response);

    const db = await getDb();

    // 5. Create priority actions
    for (const action of (parsed.actions || [])) {
      await createAction({
        agentSlug: "money_maker",
        priority: (action.priority as any) || "p3",
        title: action.title,
        description: `${action.description}\n\nEstimated Revenue: ${action.estimatedRevenue || "Unknown"}`,
        actionType: action.actionType || "revenue_optimization",
        payload: JSON.stringify({ estimatedRevenue: action.estimatedRevenue }),
        requiresApproval: action.requiresApproval ? 1 : 0,
      });
      context.actionsCreated++;
    }

    // 6. Update prospect scores and pitch angles
    if (db && parsed.prospectUpdates?.length) {
      for (const update of parsed.prospectUpdates) {
        if (!update.prospectId) continue;
        await db.update(attorneyProspects).set({
          overallScore: update.newScore,
          pitchAngle: update.pitchAngle,
          outreachStatus: (update.outreachStatus as any) || "researching",
          updatedAt: new Date(),
        }).where(eq(attorneyProspects.id, update.prospectId));
      }
    }

    // 7. Send inter-agent messages
    for (const msg of (parsed.messages || [])) {
      await sendMessage({
        fromAgent: "money_maker",
        toAgent: msg.toAgent as any,
        type: (msg.type as any) || "directive",
        priority: "p2",
        subject: msg.subject,
        body: msg.body,
      });
      context.messagesCreated++;
    }

    // 8. Log revenue leaks as P1 actions
    for (const leak of (parsed.revenueLeaks || [])) {
      await createAction({
        agentSlug: "money_maker",
        priority: "p1",
        title: `[REVENUE LEAK] ${leak.issue}`,
        description: `Estimated Loss: ${leak.estimatedLoss}\n\nFix: ${leak.fix}`,
        actionType: "revenue_optimization",
        requiresApproval: 1,
      });
      context.actionsCreated++;
    }

    // 9. Execute research_firm actions immediately (don't just queue them)
    const researchActions = (parsed.actions || []).filter(a => a.actionType === "research_firm");
    if (researchActions.length > 0) {
      // Extract states from action descriptions
      const stateKeywords = ["California", "Texas", "Florida", "Arizona", "Nevada", "Colorado", "Georgia", "North Carolina", "South Carolina", "New York", "New Jersey", "Ohio", "Michigan", "Illinois", "Washington"];
      const statesToResearch = stateKeywords.filter(s =>
        researchActions.some(a => a.description?.includes(s) || a.title?.includes(s))
      ).slice(0, 3); // Max 3 states per run to control cost

      if (statesToResearch.length === 0) {
        // Default to top solar states if no specific states mentioned
        statesToResearch.push("California", "Texas", "Florida");
      }

      const researchResult = await executeAttorneyResearch(statesToResearch, context.runId);
      await saveAgentChatMessage(
        "money_maker",
        `Attorney research complete: found ${researchResult.found} attorneys across ${researchResult.states.join(", ")}, saved ${researchResult.saved} new prospects to pipeline`,
        "result",
        context.runId
      );
    }

    // 10. Materialize review-only drafts for the direct-solar priority queue.
    // This is an execution receipt: drafts are visible in the pipeline but cannot send any message.
    if (db) {
      const draftResult = await materializePriorityDrafts(db);
      if (draftResult.created > 0) {
        await saveAgentChatMessage(
          "money_maker",
          `Execution receipt: created ${draftResult.created} review-only LinkedIn introduction draft${draftResult.created === 1 ? "" : "s"} for priority solar prospects. ${draftResult.skipped} already had a draft. No outreach was sent.`,
          "result",
          context.runId,
        );
      }
    }

    // 11. Use the existing, proven Money Maker heartbeat as the durable enrichment path.
    // This is a bounded public-website lookup only; it never sends outreach and a failure
    // here must not prevent the primary revenue analysis from completing.
    try {
      const refreshResult = await refreshPublicAttorneyContacts(`money_maker:${context.runId}`);
      await saveAgentChatMessage(
        "money_maker",
        `Money Maker public-contact receipt: ${refreshResult.visited} official firm websites checked; ${refreshResult.enriched} public contact detail${refreshResult.enriched === 1 ? "" : "s"} added; ${refreshResult.failures} website check${refreshResult.failures === 1 ? "" : "s"} failed. No outreach was sent.`,
        "result",
        context.runId,
      );
    } catch (refreshError) {
      await saveAgentChatMessage(
        "money_maker",
        `Money Maker public-contact receipt: enrichment did not complete this cycle (${refreshError instanceof Error ? refreshError.message : String(refreshError)}). Revenue analysis still completed; no outreach was sent.`,
        "result",
        context.runId,
      );
    }

    // 12. Save analysis as chat thread
    if (parsed.analysis) {
      await saveAgentChatMessage("money_maker", parsed.analysis, "analysis", context.runId);
    }

    // 13. Mark inbox as processed
    for (const m of inbox) {
      await markMessageActedOn(m.id);
    }

    const summary = parsed.analysis || "Revenue analysis cycle completed";
    await completeRun(context, summary);
    return { summary, actionsCreated: context.actionsCreated, messagesCreated: context.messagesCreated };

  } catch (error: any) {
    await completeRun(context, `Error: ${error.message}`, "failed", error.message);
    throw error;
  }
}

async function materializePriorityDrafts(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  const priorities = await db.select().from(attorneyProspects)
    .where(and(eq(attorneyProspects.qualityTier, "priority"), isNull(attorneyProspects.linkedInDraft)))
    .orderBy(desc(attorneyProspects.overallScore))
    .limit(10);
  let created = 0;
  for (const prospect of priorities) {
    const draft = buildPriorityDraft({
      contactPerson: prospect.contactPerson,
      firmName: prospect.firmName,
      practiceAreas: prospect.practiceAreas,
      state: prospect.state,
    });
    await db.update(attorneyProspects).set({
      linkedInDraft: draft,
      linkedInOutreachStatus: "drafted",
      outreachStatus: "ready_to_pitch",
      updatedAt: new Date(),
    }).where(eq(attorneyProspects.id, prospect.id));
    created++;
  }
  const [existing] = await db.select({ count: sql<number>`COUNT(*)` }).from(attorneyProspects)
    .where(and(eq(attorneyProspects.qualityTier, "priority"), ne(attorneyProspects.linkedInDraft, "")));
  return { created, skipped: Math.max(0, Number(existing?.count || 0) - created) };
}

export function buildPriorityDraft(input: { contactPerson?: string | null; firmName: string; practiceAreas?: string | null; state?: string | null }) {
  const firstName = (input.contactPerson || "there").replace(/^(Mr\.?|Ms\.?|Mrs\.?|Dr\.?)\s+/i, "").split(/\s+/)[0];
  let practiceAreas: string[] = [];
  try { practiceAreas = JSON.parse(input.practiceAreas || "[]"); } catch { /* source evidence is still available in the prospect card */ }
  const evidence = practiceAreas[0] || "consumer-protection work";
  return `Hi ${firstName},\n\nI’m with Solar Freedom. I came across ${input.firmName} because your public materials reference ${evidence.toLowerCase()}. We speak with homeowners facing solar-contract, financing, and deceptive-sales issues in ${input.state || "your market"}.\n\nI’m not assuming this is a fit, but would you be open to a brief conversation about whether your team reviews matters in this area and, if so, what a compliant qualified-appointment partnership could look like?\n\nBest,\nChase\nSolar Freedom`;
}

// ─── Revenue State Gathering ──────────────────────────────────────────────────

async function gatherRevenueState(): Promise<string> {
  const db = await getDb();
  if (!db) return "Database unavailable";

  // Attorney prospects — sorted by score
  const prospects = await db.select().from(attorneyProspects)
    .orderBy(desc(attorneyProspects.overallScore))
    .limit(150);

  // Active law firms with revenue stats
  const firms = await db.select().from(lawFirms)
    .where(eq(lawFirms.status, "active"))
    .limit(20);

  // Revenue tracker — all records
  const revenue = await db.select().from(revenueTracker)
    .orderBy(desc(revenueTracker.createdAt))
    .limit(50);

  // Lead delivery stats — find unbilled deliveries
  const deliveries = await db.select().from(leadDeliveries)
    .orderBy(desc(leadDeliveries.createdAt))
    .limit(50);

  // Lead volume
  const [leadCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(leads);

  // Revenue calculations
  const totalInvoiced = revenue.reduce((s, r) => s + parseFloat(String(r.amount || 0)), 0);
  const totalPaid = revenue.filter(r => r.status === "paid").reduce((s, r) => s + parseFloat(String(r.amount || 0)), 0);
  const totalPending = revenue.filter(r => r.status === "pending").reduce((s, r) => s + parseFloat(String(r.amount || 0)), 0);
  const totalOverdue = revenue.filter(r => r.status === "overdue").reduce((s, r) => s + parseFloat(String(r.amount || 0)), 0);

  // Delivery stats
  const deliveredCount = deliveries.filter(d => d.status === "delivered").length;
  const unbilledCount = deliveries.filter(d => d.status === "delivered" && !d.charged).length;
  const failedCount = deliveries.filter(d => d.status === "failed").length;

  // Prospect pipeline breakdown
  const prospectsByStatus = {
    not_contacted: prospects.filter(p => p.outreachStatus === "not_contacted").length,
    researching: prospects.filter(p => p.outreachStatus === "researching").length,
    ready_to_pitch: prospects.filter(p => p.outreachStatus === "ready_to_pitch").length,
    pitched: prospects.filter(p => p.outreachStatus === "pitched").length,
    in_conversation: prospects.filter(p => p.outreachStatus === "in_conversation").length,
    signed: prospects.filter(p => p.outreachStatus === "signed").length,
  };
  const directSolarPriorityCount = prospects.filter(p => p.qualityTier === "priority").length;

  // Firm revenue per firm
  const firmRevenue = firms.map(f => ({
    name: f.name,
    pricePerLead: f.pricePerLead,
    totalLeadsDelivered: f.totalLeadsDelivered,
    totalRevenue: f.totalRevenue,
    states: f.coveredStates,
    maxPerMonth: f.maxLeadsPerMonth,
    status: f.status,
  }));

  return `
═══ REVENUE DASHBOARD ═══
Total Invoiced: $${totalInvoiced.toFixed(0)}
Total Collected: $${totalPaid.toFixed(0)}
Pending: $${totalPending.toFixed(0)}
OVERDUE: $${totalOverdue.toFixed(0)}
COLLECTION GAP: $${(totalInvoiced - totalPaid).toFixed(0)} NOT COLLECTED

═══ LEAD PIPELINE ═══
Total Leads in DB: ${leadCount?.count ?? 0}
Lead Deliveries (recent 50): ${deliveries.length}
  - Delivered: ${deliveredCount}
  - UNBILLED (delivered but not charged): ${unbilledCount} ← REVENUE LEAK
  - Failed deliveries: ${failedCount} ← LOST REVENUE

═══ ACTIVE LAW FIRMS (${firms.length}) ═══
${firmRevenue.length > 0
  ? firmRevenue.map(f =>
      `  ${f.name}: $${f.pricePerLead}/lead | ${f.totalLeadsDelivered} delivered | $${f.totalRevenue} revenue | States: ${f.states || "all"} | Cap: ${f.maxPerMonth ?? "unlimited"}/mo`
    ).join("\n")
  : "  NO ACTIVE FIRMS YET — CRITICAL GAP"}

═══ ATTORNEY PROSPECT PIPELINE (${prospects.length} total) ═══
Status breakdown:
  Not contacted: ${prospectsByStatus.not_contacted}
  Researching: ${prospectsByStatus.researching}
  Ready to pitch: ${prospectsByStatus.ready_to_pitch}
  Pitched: ${prospectsByStatus.pitched}
  In conversation: ${prospectsByStatus.in_conversation}
  SIGNED: ${prospectsByStatus.signed}
  Direct-solar priority queue: ${directSolarPriorityCount}

Top 10 prospects by score:
${prospects.slice(0, 10).map(p =>
  `  [ID:${p.id}] ${p.firmName} | Score: ${p.overallScore} | ${p.state} | Fee: ${p.feeStructure} | Status: ${p.outreachStatus} | Pitch: ${p.pitchAngle?.substring(0, 80) || "none"}`
).join("\n") || "  No prospects yet"}

═══ REVENUE OPPORTUNITIES ═══
- States with high lead volume but NO firm coverage: CA, TX, FL, AZ, NV (top 5 solar states)
- Estimated revenue if 3 firms signed at $200/lead × 73 leads/firm: $14,600/month
- Exclusive territory CA deal potential: $3,000–$5,000/mo
- Pay-per-call upsell to existing firms: $50–$150/call × ~89 calls/mo = $4,450–$13,350/mo

═══ BUSINESS CONTEXT ═══
Site: breakyoursolarcontract.com
Phone: (904) 921-4971
AI Assistant: Grace Silver
Owner: Chase
Monthly leads: ~220 (Facebook ads)
Booking rate: 40.5% (89/220)
Top solar companies in our leads: Sunrun, GoodLeap, Vivint, SunPower, ADT Solar`;
}
