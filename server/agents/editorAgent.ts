/**
 * Editor Agent — Solar Freedom
 *
 * ONE JOB: Make sure nothing bad goes live. Make sure everything good goes live FAST.
 *
 * The Editor is the quality gate between the Content Agent and the live site.
 * It scores drafts, catches compliance issues, and sends approved content to Manager.
 * It is NOT a bottleneck — it is a fast-pass for good content and a hard stop for bad.
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
import { contentPipeline } from "../../drizzle/schema";
import { desc, eq, and } from "drizzle-orm";

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the Editor Agent for Solar Freedom (breakyoursolarcontract.com).

═══════════════════════════════════════════════════════════
MISSION: APPROVE GREAT CONTENT FAST. KILL BAD CONTENT HARD.
Every day a good article sits in review is a day we're not ranking.
Every bad article that goes live is a Google penalty waiting to happen.
═══════════════════════════════════════════════════════════

YOUR SCORING SYSTEM (0–100 each):

SEO SCORE (0–100):
- Primary keyword in H1: +15
- Primary keyword in first 100 words: +10
- Primary keyword in at least one H2: +10
- Secondary keywords used naturally: +15
- Word count 2,500+: +20
- Internal links (2+ blog, 2+ city pages): +15
- FAQ section with exact-match questions: +15

READABILITY SCORE (0–100):
- Short paragraphs (3-4 sentences max): +20
- H2/H3 structure every 300 words: +20
- Numbered/bulleted lists where appropriate: +20
- No jargon without explanation: +20
- Active voice dominant: +20

E-E-A-T SCORE (0–100):
- Cites specific laws (Cal. Civ. Code, DTPA, FTC Act): +25
- References real complaint data (BBB, CFPB, state AG): +20
- Specific, verifiable claims (not vague): +20
- No fabricated testimonials or case results: +20 (REQUIRED — fail if violated)
- Disclaimer present: +15

DUPLICATE RISK (0–100, lower is better):
- 0–20: Unique content, safe to publish
- 21–50: Some overlap, needs differentiation
- 51–100: Too similar to existing content, reject

COMPLIANCE CHECKLIST (HARD FAILS — reject immediately if any found):
✗ Claims to be an attorney or law firm
✗ Fabricated testimonials, reviews, or case results
✗ Phone number 214-529-1631 (wrong number)
✗ Reference to cancelyoursolar.co (dead domain)
✗ Specific legal guarantees ("you WILL win")
✗ Defamatory claims without evidence
✗ Missing disclaimer about not being legal advice

APPROVAL THRESHOLDS:
- SEO ≥ 75 + Readability ≥ 70 + E-E-A-T ≥ 70 + Duplicate Risk ≤ 30 → APPROVE
- Any hard fail → REJECT immediately, send back with specific fixes
- Scores close but not quite → REVISION NEEDED with specific line-by-line feedback

REVISION FEEDBACK FORMAT:
Be specific. Don't say "improve E-E-A-T." Say:
"Add California Civil Code § 1689 to the legal rights section. Add a link to the CFPB complaint database. The claim in paragraph 3 about 'most homeowners win' is unverifiable — change to 'many homeowners have successfully exited their contracts.'"

OUTPUT FORMAT — respond ONLY with valid JSON, no markdown:
{
  "analysis": "Summary of what you reviewed and decisions made",
  "reviews": [
    {
      "pipelineId": 0,
      "title": "Article title",
      "decision": "approve|reject|revision_needed",
      "seoScore": 0,
      "readabilityScore": 0,
      "eatScore": 0,
      "duplicateRisk": 0,
      "overallScore": 0,
      "hardFails": ["List any hard compliance failures"],
      "feedback": "Specific, actionable feedback. Line-by-line if revision needed.",
      "approvalReason": "Why approved (if approved)",
      "rejectionReason": "Why rejected (if rejected)"
    }
  ],
  "messages": [
    {
      "toAgent": "content|manager",
      "type": "directive|report|info",
      "subject": "Specific subject",
      "body": "Detailed message"
    }
  ]
}`;

// ─── Main Execution ───────────────────────────────────────────────────────────

export async function runEditorAgent(
  triggerType: "cron" | "manual" | "directive" | "event" = "cron",
  triggeredBy: string = "system"
): Promise<AgentThinkResult> {
  const context = await startRun("editor", triggerType, triggeredBy);

  try {
    // 1. Find drafts ready for review
    const db = await getDb();
    const draftsToReview = db ? await db.select().from(contentPipeline)
      .where(eq(contentPipeline.stage, "draft_complete"))
      .orderBy(desc(contentPipeline.updatedAt))
      .limit(5) : [];

    // 2. Check inbox
    const inbox = await getUnreadMessages("editor");
    const inboxSummary = inbox.length > 0
      ? `\n\n═══ INBOX (${inbox.length} messages) ═══\n${inbox.map(m =>
          `FROM: ${m.fromAgent} | SUBJECT: ${m.subject}\n${m.body?.substring(0, 300)}`
        ).join("\n---\n")}`
      : "";

    if (draftsToReview.length === 0 && inbox.length === 0) {
      const summary = "No drafts in queue. Editor idle.";
      await completeRun(context, summary);
      return { summary, actionsCreated: 0, messagesCreated: 0 };
    }

    // 3. Build review context
    const reviewContext = draftsToReview.map(d =>
      `\n\n═══ DRAFT FOR REVIEW [ID:${d.id}] ═══\nTitle: ${d.title}\nKeyword: ${d.targetKeyword}\nWord Count: ${d.wordCount || "unknown"}\nRevision #: ${d.revisionCount}\n\nDRAFT CONTENT:\n${d.draft?.substring(0, 3000) || d.outline?.substring(0, 1000) || "No content yet"}`
    ).join("\n");

    // 4. Think
    const response = await agentLLM({
      agentSlug: "editor",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `DRAFTS TO REVIEW:${reviewContext}${inboxSummary}\n\nReview each draft. Score it. Make a decision. Be fast and decisive — every day in review is a day we're not ranking.`,
        },
      ],
      context,
      temperature: 0.2,
      maxTokens: 5000,
    });

    // 5. Parse
    let parsed: {
      analysis?: string;
      reviews?: Array<{
        pipelineId: number;
        title: string;
        decision: string;
        seoScore: number;
        readabilityScore: number;
        eatScore: number;
        duplicateRisk: number;
        overallScore: number;
        hardFails?: string[];
        feedback?: string;
        approvalReason?: string;
        rejectionReason?: string;
      }>;
      messages?: Array<{ toAgent: string; type: string; subject: string; body: string }>;
    } = {};

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      parsed = { analysis: response };
    }

    // 6. Apply review decisions
    if (db) {
      for (const review of (parsed.reviews || [])) {
        if (!review.pipelineId) continue;

        const newStage = review.decision === "approve" ? "approved"
          : review.decision === "reject" ? "rejected"
          : "revision_needed";

        await db.update(contentPipeline).set({
          stage: newStage as any,
          seoScore: review.seoScore,
          readabilityScore: review.readabilityScore,
          eatScore: review.eatScore,
          duplicateRisk: review.duplicateRisk,
          editorFeedback: review.feedback || review.approvalReason || review.rejectionReason,
          reviewedBy: "editor",
          updatedAt: new Date(),
        }).where(eq(contentPipeline.id, review.pipelineId));

        context.actionsCreated++;

        // Notify appropriate agent
        if (review.decision === "approve") {
          await sendMessage({
            fromAgent: "editor",
            toAgent: "manager",
            type: "report",
            priority: "p2",
            subject: `[APPROVED] "${review.title}" — Ready for publish`,
            body: `Editor approved: "${review.title}"\n\nScores:\n- SEO: ${review.seoScore}/100\n- Readability: ${review.readabilityScore}/100\n- E-E-A-T: ${review.eatScore}/100\n- Duplicate Risk: ${review.duplicateRisk}/100\n- Overall: ${review.overallScore}/100\n\nApproval reason: ${review.approvalReason}\n\nReady for Manager final approval and publish.`,
          });
          context.messagesCreated++;
        } else if (review.decision === "revision_needed") {
          await sendMessage({
            fromAgent: "editor",
            toAgent: "content",
            type: "directive",
            priority: "p2",
            subject: `[REVISION NEEDED] "${review.title}"`,
            body: `Revision required for: "${review.title}"\n\nScores:\n- SEO: ${review.seoScore}/100\n- Readability: ${review.readabilityScore}/100\n- E-E-A-T: ${review.eatScore}/100\n- Duplicate Risk: ${review.duplicateRisk}/100\n\nSPECIFIC FIXES REQUIRED:\n${review.feedback}\n\nPlease revise and resubmit.`,
          });
          context.messagesCreated++;
        } else if (review.decision === "reject") {
          await sendMessage({
            fromAgent: "editor",
            toAgent: "content",
            type: "directive",
            priority: "p1",
            subject: `[REJECTED] "${review.title}" — Hard compliance failure`,
            body: `REJECTED: "${review.title}"\n\nHard failures found:\n${review.hardFails?.join("\n") || "See feedback"}\n\nRejection reason: ${review.rejectionReason}\n\nThis article cannot be published as-is. Requires full rewrite.`,
          });
          context.messagesCreated++;
        }
      }
    }

    // 7. Send other messages
    for (const msg of (parsed.messages || [])) {
      await sendMessage({
        fromAgent: "editor",
        toAgent: msg.toAgent as any,
        type: (msg.type as any) || "report",
        priority: "p3",
        subject: msg.subject,
        body: msg.body,
      });
      context.messagesCreated++;
    }

    // 8. Mark inbox read
    for (const m of inbox) {
      await markMessageActedOn(m.id);
    }

    const summary = parsed.analysis || `Reviewed ${draftsToReview.length} drafts`;
    await completeRun(context, summary);
    return { summary, actionsCreated: context.actionsCreated, messagesCreated: context.messagesCreated };

  } catch (error: any) {
    await completeRun(context, `Error: ${error.message}`, "failed", error.message);
    throw error;
  }
}
