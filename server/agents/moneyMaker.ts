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
import { getDb } from "../db";
import {
  attorneyProspects,
  revenueTracker,
  lawFirms,
  leadDeliveries,
  leads,
} from "../../drizzle/schema";
import { desc, eq, sql, and, gte, lt, isNull, ne } from "drizzle-orm";

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
      // Heartbeat calls need focused revenue actions, not a long-form report.
      maxTokens: 1800,
    });

    // 4. Parse response
    let parsed: {
      analysis?: string;
      revenueLeaks?: Array<{ issue: string; estimatedLoss: string; fix: string }>;
      actions?: Array<{
        priority: string;
        title: string;
        description: string;
        actionType: string;
        estimatedRevenue: string;
        requiresApproval?: boolean;
      }>;
      prospectUpdates?: Array<{
        prospectId: number;
        newScore: number;
        pitchAngle: string;
        outreachStatus: string;
      }>;
      messages?: Array<{
        toAgent: string;
        type: string;
        subject: string;
        body: string;
      }>;
    } = {};

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      parsed = { analysis: response };
    }

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

    // 9. Mark inbox as processed
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

// ─── Revenue State Gathering ──────────────────────────────────────────────────

async function gatherRevenueState(): Promise<string> {
  const db = await getDb();
  if (!db) return "Database unavailable";

  // Attorney prospects — sorted by score
  const prospects = await db.select().from(attorneyProspects)
    .orderBy(desc(attorneyProspects.overallScore))
    .limit(20);

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
