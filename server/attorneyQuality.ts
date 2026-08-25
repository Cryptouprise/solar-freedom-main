import { callAgentLLM } from "./agents/agentLLM";

export type AttorneyQualityInput = {
  firmName: string;
  state: string | null;
  city: string | null;
  website: string | null;
  phone: string | null;
  practiceAreas: string | null;
  sourceUrl: string | null;
  discoveredVia: string | null;
};

export type AttorneyQualityReview = {
  tier: "priority" | "review" | "defer";
  score: number;
  confidence: number;
  scoreBreakdown: {
    evidenceIntegrity: number;
    leadMarketFit: number;
    reachability: number;
    capacityProxy: number;
    partnershipReadiness: number;
  };
  explanation: string;
  gates: Array<{ label: string; status: "pass" | "needs_review" | "blocked"; reason: string }>;
  suggestedPitch: string;
  nextActions: string[];
};

export function buildLinkedInLookupUrl(firmName: string, state?: string | null) {
  const query = [firmName, state || "", "attorney"].filter(Boolean).join(" ");
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
}

function deterministicFallback(input: AttorneyQualityInput): AttorneyQualityReview {
  const hasSource = Boolean(input.sourceUrl);
  const hasContact = Boolean(input.website || input.phone);
  const hasState = Boolean(input.state);
  const score = (hasSource ? 30 : 0) + (hasContact ? 25 : 0) + (hasState ? 15 : 0);
  return {
    tier: hasSource && hasContact && hasState ? "review" : "defer",
    score,
    confidence: hasSource ? 55 : 20,
    scoreBreakdown: { evidenceIntegrity: hasSource ? 30 : 0, leadMarketFit: hasState ? 15 : 0, reachability: hasContact ? 25 : 0, capacityProxy: 0, partnershipReadiness: 0 },
    explanation: "Baseline evidence review only. Public source and reachability signals are recorded, but partnership fit and decision-maker identity still need human verification.",
    gates: [
      { label: "Public source evidence", status: hasSource ? "pass" : "blocked", reason: hasSource ? "A direct source link is recorded." : "No direct source link is recorded." },
      { label: "Reachability", status: hasContact ? "pass" : "needs_review", reason: hasContact ? "A public website or phone is available." : "Find a public website or phone before outreach." },
      { label: "Decision-maker and commercial fit", status: "needs_review", reason: "Confirm the relevant partner and willingness to receive solar-contract leads before any pitch." },
    ],
    suggestedPitch: "Ask whether the firm reviews consumer or solar-contract disputes and would consider a brief conversation about qualified appointments in its service area.",
    nextActions: ["Verify the firm’s practice fit on its own website.", "Find a responsible decision-maker through a manual LinkedIn review.", "Obtain approval before sending any outreach."],
  };
}

export async function reviewAttorneyQuality(input: AttorneyQualityInput): Promise<AttorneyQualityReview> {
  if (!input.sourceUrl) return deterministicFallback(input);
  try {
    const response = await callAgentLLM({
      agentSlug: "money_maker",
      modelOverride: "deepseek/deepseek-v4-pro",
      maxTokens: 2200,
      messages: [
      {
        role: "system",
        content: "You are a cautious B2B partnership qualification reviewer. Evaluate only the supplied public evidence. Do not claim that a law firm handles solar matters, accepts referrals, has a decision-maker, has capacity, or wants leads unless the supplied evidence proves it. Your output prioritizes whether a human should investigate, not legal qualifications or consumer eligibility.",
      },
      {
        role: "user",
        content: `Review this public-source attorney prospect:\n${JSON.stringify(input, null, 2)}\n\nUse a 100-point matrix: evidence integrity (30), lead-market fit (20), public reachability (20), capacity proxy (15), partnership readiness (15). Unknown evidence must score 0 and be placed behind a manual-review gate.`,
      },
    ],
      responseFormat: {
      type: "json_schema",
      json_schema: {
        name: "attorney_partner_quality_review",
        strict: true,
        schema: {
          type: "object",
          properties: {
            tier: { type: "string", enum: ["priority", "review", "defer"] },
            score: { type: "integer", minimum: 0, maximum: 100 },
            confidence: { type: "integer", minimum: 0, maximum: 100 },
            scoreBreakdown: {
              type: "object",
              properties: {
                evidenceIntegrity: { type: "integer", minimum: 0, maximum: 30 },
                leadMarketFit: { type: "integer", minimum: 0, maximum: 20 },
                reachability: { type: "integer", minimum: 0, maximum: 20 },
                capacityProxy: { type: "integer", minimum: 0, maximum: 15 },
                partnershipReadiness: { type: "integer", minimum: 0, maximum: 15 },
              },
              required: ["evidenceIntegrity", "leadMarketFit", "reachability", "capacityProxy", "partnershipReadiness"],
              additionalProperties: false,
            },
            explanation: { type: "string" },
            gates: {
              type: "array",
              items: {
                type: "object",
                properties: { label: { type: "string" }, status: { type: "string", enum: ["pass", "needs_review", "blocked"] }, reason: { type: "string" } },
                required: ["label", "status", "reason"],
                additionalProperties: false,
              },
            },
            suggestedPitch: { type: "string" },
            nextActions: { type: "array", items: { type: "string" } },
          },
          required: ["tier", "score", "confidence", "scoreBreakdown", "explanation", "gates", "suggestedPitch", "nextActions"],
          additionalProperties: false,
        },
      },
      },
    });
    const review = JSON.parse(response.content) as AttorneyQualityReview;
    const practice = input.practiceAreas?.toLowerCase() || "";
    const directSolarSignal = /solar/.test(practice);
    // The model may describe an attractive firm but must not elevate it without
    // direct solar evidence, a strong evidence score, and a recorded route to reach it.
    const tier = directSolarSignal && review.score >= 65 && Boolean(input.phone || input.website)
      ? "priority"
      : review.score >= 50 && Boolean(input.sourceUrl)
        ? "review"
        : "defer";
    const gateReason = tier === "priority"
      ? "Direct solar-practice evidence, a strong evidence score, and a public contact route meet the priority gate."
      : directSolarSignal
        ? "Solar relevance is present, but the evidence score or public reachability did not meet the priority gate."
        : "No direct solar-practice evidence is recorded, so the record cannot be prioritized before manual verification.";
    return {
      ...review,
      tier,
      explanation: `${review.explanation}\n\nRanking gate: ${gateReason}`,
      gates: [...review.gates, { label: "Priority ranking gate", status: tier === "priority" ? "pass" : "needs_review", reason: gateReason }],
    };
  } catch (error) {
    console.warn("[attorneyQuality] Premium review unavailable; using evidence-only fallback", error);
    return deterministicFallback(input);
  }
}
