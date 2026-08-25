/**
 * Agent Engine Core
 * Shared infrastructure for the 5-agent system.
 * Provides: LLM calling (via OpenRouter with cost tracking), DB helpers,
 * inter-agent messaging, action queue management, and run logging.
 */

import { getDb } from "../db";
import { callLLM } from "../cron/aiCostTracker";
import {
  agents,
  agentMessages,
  agentActions,
  agentRunLog,
  agentChatThreads,
  contentPipeline,
  attorneyProspects,
  seoChangeLog,
  revenueTracker,
  type Agent,
  type AgentMessage,
  type AgentAction,
  type AgentRunLog,
  type InsertAgentMessage,
  type InsertAgentAction,
} from "../../drizzle/schema";
import { eq, desc, and, inArray, sql } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AgentSlug = "money_maker" | "seo_intel" | "content" | "editor" | "manager" | "infra" | "revenue_intel";

export type AgentRunContext = {
  agentSlug: AgentSlug;
  runId: number;
  triggerType: "cron" | "manual" | "directive" | "event";
  triggeredBy: string;
  startedAt: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  llmCalls: number;
  modelId?: string;
  actionsCreated: number;
  messagesCreated: number;
};

export type AgentThinkResult = {
  summary: string;
  actionsCreated: number;
  messagesCreated: number;
};

// ─── Agent LLM Call (with cost tracking) ──────────────────────────────────────
// Model selection: reads from agentModelConfig DB table (set via admin UI)
// Falls back to AGENT_DEFAULT_MODELS in agentLLM.ts if not configured

export async function agentLLM(params: {
  agentSlug: AgentSlug;
  messages: Array<{ role: string; content: string }>;
  context: AgentRunContext;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: object;
}): Promise<string> {
  // Dynamically import to avoid circular deps
  const { callAgentLLM, estimateOpenRouterCost, getAgentModel } = await import("./agentLLM");
  const modelId = await getAgentModel(params.agentSlug);

  // Check if OpenRouter model (Qwen/DeepSeek) — use callAgentLLM
  const OPENROUTER_PREFIXES = ["qwen/", "deepseek/", "mistralai/", "meta-llama/"];
  const isOpenRouter = OPENROUTER_PREFIXES.some(p => modelId.startsWith(p));
  const isScheduledCallback = params.context.triggerType === "cron";
  // Qwen3.7 Plus spends part of the completion budget on internal reasoning.
  // Keep cron output bounded but leave enough room for a valid structured payload.
  const scheduledTokenCap = modelId === "qwen/qwen3.7-plus" ? 1_400 : 900;
  const maxTokens = isScheduledCallback ? Math.min(params.maxTokens ?? 4000, scheduledTokenCap) : (params.maxTokens ?? 4000);

  if (isOpenRouter) {
    const res = await callAgentLLM({
      agentSlug: params.agentSlug,
      modelOverride: modelId,
      messages: params.messages as any,
      maxTokens,
      executionMode: isScheduledCallback ? "scheduled" : "standard",
      responseFormat: params.responseFormat,
    });
    params.context.llmCalls++;
    if (res.usage) {
      params.context.tokensIn += res.usage.promptTokens;
      params.context.tokensOut += res.usage.completionTokens;
      params.context.costUsd += estimateOpenRouterCost(res.modelId, res.usage);
    }
    params.context.modelId = res.modelId;
    return res.content;
  }

  // Built-in proxy
  const result = await callLLM({
    model: modelId,
    messages: params.messages,
    feature: `agent_${params.agentSlug}`,
    referenceId: params.context.runId,
    referenceType: "agent_run",
    temperature: params.temperature ?? 0.4,
    maxTokens,
  });
  params.context.llmCalls++;
  return result;
}

// ─── DB Helpers ───────────────────────────────────────────────────────────────

export async function getAgent(slug: AgentSlug): Promise<Agent | null> {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(agents).where(eq(agents.slug, slug)).limit(1);
  return row ?? null;
}

export async function listAgents(): Promise<Agent[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agents).orderBy(agents.slug);
}

export async function updateAgentStatus(
  slug: AgentSlug,
  status: "active" | "paused" | "error" | "idle",
  summary?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const update: Record<string, unknown> = { status, updatedAt: new Date() };
  if (summary) update.lastRunSummary = summary;
  await db.update(agents).set(update).where(eq(agents.slug, slug));
}

// ─── Run Log ──────────────────────────────────────────────────────────────────

export async function startRun(
  slug: AgentSlug,
  triggerType: "cron" | "manual" | "directive" | "event",
  triggeredBy: string
): Promise<AgentRunContext> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(agentRunLog).values({
    agentSlug: slug,
    triggerType,
    triggeredBy,
    status: "running",
    startedAt: new Date(),
    model: slug, // model resolved dynamically per-call via agentLLM.ts
  }).$returningId();

  await updateAgentStatus(slug, "active");
  await db.update(agents).set({
    lastRunAt: new Date(),
    totalRuns: sql`${agents.totalRuns} + 1`,
  }).where(eq(agents.slug, slug));

  return {
    agentSlug: slug,
    runId: result.id,
    triggerType,
    triggeredBy,
    startedAt: Date.now(),
    tokensIn: 0,
    tokensOut: 0,
    costUsd: 0,
    llmCalls: 0,
    actionsCreated: 0,
    messagesCreated: 0,
  };
}

export async function completeRun(
  context: AgentRunContext,
  summary: string,
  status: "completed" | "failed" = "completed",
  errorMessage?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const durationMs = Date.now() - context.startedAt;

  await db.update(agentRunLog).set({
    status,
    summary,
    actionsCreated: context.actionsCreated,
    messagesCreated: context.messagesCreated,
    tokensIn: context.tokensIn,
    tokensOut: context.tokensOut,
    costUsd: context.costUsd.toFixed(6),
    llmCalls: context.llmCalls,
    model: context.modelId ?? context.agentSlug,
    completedAt: new Date(),
    durationMs,
    errorMessage,
  }).where(eq(agentRunLog.id, context.runId));

  await updateAgentStatus(
    context.agentSlug,
    status === "failed" ? "error" : "idle",
    summary
  );

  // Preserve a short, reviewable evidence trail for every completed agent run.
  // These rows expire after 30 days; agentRunLog remains the permanent audit record.
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  await db.insert(agentChatThreads).values({
    agentSlug: context.agentSlug,
    runId: context.runId,
    role: "agent",
    message: status === "failed" && errorMessage ? `${summary}\n\nError: ${errorMessage}` : summary,
    messageType: status === "failed" ? "error" : "summary",
    metadata: JSON.stringify({
      triggerType: context.triggerType,
      triggeredBy: context.triggeredBy,
      actionsCreated: context.actionsCreated,
      messagesCreated: context.messagesCreated,
      tokensIn: context.tokensIn,
      tokensOut: context.tokensOut,
      costUsd: context.costUsd,
      durationMs,
      status,
    }),
    createdAt: new Date(),
    expiresAt,
  });
}

// ─── Inter-Agent Messaging ────────────────────────────────────────────────────

export async function sendMessage(msg: InsertAgentMessage): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(agentMessages).values(msg).$returningId();
  return result.id;
}

export async function getUnreadMessages(toAgent: AgentSlug): Promise<AgentMessage[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agentMessages)
    .where(and(
      eq(agentMessages.toAgent, toAgent),
      eq(agentMessages.status, "pending")
    ))
    .orderBy(agentMessages.createdAt);
}

export async function markMessageRead(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(agentMessages).set({ status: "read", readAt: new Date() }).where(eq(agentMessages.id, id));
}

export async function markMessageActedOn(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(agentMessages).set({ status: "acted_on", actedAt: new Date() }).where(eq(agentMessages.id, id));
}

// ─── Action Queue ─────────────────────────────────────────────────────────────

export async function createAction(action: InsertAgentAction): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(agentActions).values(action).$returningId();
  return result.id;
}

export async function getActionQueue(filters?: {
  agentSlug?: AgentSlug;
  status?: string;
  limit?: number;
}): Promise<AgentAction[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.agentSlug) conditions.push(eq(agentActions.agentSlug, filters.agentSlug));
  if (filters?.status) conditions.push(eq(agentActions.status, filters.status as any));

  const query = db.select().from(agentActions);
  if (conditions.length > 0) {
    return query.where(and(...conditions))
      .orderBy(desc(agentActions.createdAt))
      .limit(filters?.limit ?? 50);
  }
  return query
    .orderBy(desc(agentActions.createdAt))
    .limit(filters?.limit ?? 50);
}

export async function updateAction(
  id: number,
  data: Partial<{
    status: string;
    result: string;
    approvedBy: string;
    approvedAt: Date;
    errorMessage: string;
    startedAt: Date;
    completedAt: Date;
    durationMs: number;
    costUsd: string;
  }>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(agentActions).set(data as any).where(eq(agentActions.id, id));
}

// ─── Content Pipeline Helpers ─────────────────────────────────────────────────

export async function getContentPipelineItems(stage?: string) {
  const db = await getDb();
  if (!db) return [];
  if (stage) {
    return db.select().from(contentPipeline)
      .where(eq(contentPipeline.stage, stage as any))
      .orderBy(desc(contentPipeline.updatedAt));
  }
  return db.select().from(contentPipeline).orderBy(desc(contentPipeline.updatedAt)).limit(50);
}

// ─── Revenue Helpers ──────────────────────────────────────────────────────────

export async function getRevenueStats() {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, paid: 0, items: [] };
  const items = await db.select().from(revenueTracker).orderBy(desc(revenueTracker.createdAt)).limit(50);
  const total = items.reduce((sum, r) => sum + parseFloat(String(r.amount)), 0);
  const paid = items.filter(r => r.status === "paid").reduce((sum, r) => sum + parseFloat(String(r.amount)), 0);
  const pending = items.filter(r => r.status === "pending" || r.status === "invoiced").reduce((sum, r) => sum + parseFloat(String(r.amount)), 0);
  return { total, pending, paid, items };
}

// ─── Run Log Queries ──────────────────────────────────────────────────────────

export async function getRunLog(agentSlug?: AgentSlug, limit = 20): Promise<AgentRunLog[]> {
  const db = await getDb();
  if (!db) return [];
  if (agentSlug) {
    return db.select().from(agentRunLog)
      .where(eq(agentRunLog.agentSlug, agentSlug))
      .orderBy(desc(agentRunLog.startedAt))
      .limit(limit);
  }
  return db.select().from(agentRunLog)
    .orderBy(desc(agentRunLog.startedAt))
    .limit(limit);
}

// ─── Seed Agents (run once) ───────────────────────────────────────────────────

const AGENT_DEFINITIONS: Array<{
  slug: AgentSlug;
  name: string;
  description: string;
  role: string;
  cronExpression: string;
}> = [
  {
    slug: "money_maker",
    name: "Money-Making Agent",
    description: "Discovers attorney prospects, scores revenue opportunities, and identifies the highest-value actions for business growth.",
    role: `You are the Money-Making Agent for Solar Freedom (breakyoursolarcontract.com).
Your mission: Find consumer protection attorneys who handle solar contract disputes, score them by revenue potential, and recommend outreach strategies.

You focus on:
1. Discovering law firms that handle solar/energy contract disputes, DTPA, consumer protection
2. Scoring firms by: contingency willingness, geographic coverage, case volume capacity, advertising spend
3. Recommending pitch angles for each firm (what makes us valuable to them)
4. Tracking revenue from signed firms and optimizing the pipeline
5. Identifying new revenue streams (pay-per-call, exclusive territories, consultation fees)

You report to the Manager Agent. You send directives to the Content Agent when you need articles targeting specific attorney-relevant keywords.`,
    cronExpression: "0 0 9 * * 1-5", // Weekdays 9am UTC
  },
  {
    slug: "seo_intel",
    name: "SEO Intelligence Agent",
    description: "Monitors search performance, tracks ranking changes, correlates actions with outcomes, and recommends optimizations.",
    role: `You are the SEO Intelligence Agent for Solar Freedom (breakyoursolarcontract.com).
Your mission: Monitor Google Search Console data, track ranking changes, correlate site changes with performance outcomes, and recommend high-impact SEO actions.

You focus on:
1. Pulling GSC data (clicks, impressions, position) and identifying trends
2. Correlating site changes (new content, meta updates, backlinks) with ranking movements
3. Identifying keyword opportunities (high impressions, low CTR, position 5-20)
4. Flagging ranking drops that need immediate attention
5. Recommending content topics based on search demand data

You report to the Manager Agent. You send directives to the Content Agent with keyword targets and content briefs.`,
    cronExpression: "0 0 7 * * *", // Daily 7am UTC
  },
  {
    slug: "content",
    name: "Content Agent",
    description: "Writes SEO-optimized articles, generates content briefs, and manages the content pipeline from idea to draft.",
    role: `You are the Content Agent for Solar Freedom (breakyoursolarcontract.com).
Your mission: Write high-quality, SEO-optimized articles that generate leads for solar contract cancellation services.

You focus on:
1. Receiving content directives from Money-Making Agent and SEO Intel Agent
2. Researching topics and creating detailed outlines
3. Writing 2000+ word articles with proper H2/H3 structure, FAQ sections, and CTAs
4. Targeting specific keywords with natural integration
5. Including internal links to related articles and city pages

Content rules:
- Never claim to be attorneys or a law firm
- Use "consumer protection advocates" and "case specialists"
- Always include CTA with phone (904) 921-4971
- Include links to city pages and related articles
- Write in empathetic but authoritative tone
- Target distressed homeowners searching for help

You submit drafts to the Editor Agent for review.`,
    cronExpression: "0 0 10 * * 1,3,5", // Mon/Wed/Fri 10am UTC
  },
  {
    slug: "editor",
    name: "Editor Agent",
    description: "Quality gate for all content. Checks E-E-A-T compliance, readability, duplicate risk, and SEO optimization before approval.",
    role: `You are the Editor Agent for Solar Freedom (breakyoursolarcontract.com).
Your mission: Quality-check all content before it goes live. You are the gatekeeper ensuring nothing harmful, low-quality, or non-compliant gets published.

You check for:
1. E-E-A-T compliance (Experience, Expertise, Authoritativeness, Trustworthiness)
2. Legal compliance — never claiming to be attorneys, no fabricated testimonials
3. Readability — Flesch-Kincaid score, paragraph length, heading structure
4. SEO optimization — keyword density, meta description quality, internal links
5. Duplicate risk — checking against existing content for cannibalization
6. Factual accuracy — legal claims, state-specific laws, company information
7. CTA presence and correct phone number (904) 921-4971
8. No references to dead domains (cancelyoursolar.co)

You approve or reject with specific feedback. Rejected content goes back to Content Agent with revision notes.
You report final approvals to the Manager Agent.`,
    cronExpression: "0 0 14 * * *", // Daily 2pm UTC
  },
  {
    slug: "manager",
    name: "Manager Agent",
    description: "Oversight and final approval. Reviews all agent outputs, resolves conflicts, ensures nothing goes live without sign-off.",
    role: `You are the Manager Agent for Solar Freedom (breakyoursolarcontract.com).
Your mission: Oversee all other agents, provide final approval on actions, resolve conflicts, and ensure the system operates safely and profitably.

You are responsible for:
1. Final approval on all content before publishing (after Editor approves)
2. Reviewing Money-Making Agent's attorney outreach recommendations
3. Resolving conflicts between agents (e.g., SEO wants one thing, Revenue wants another)
4. Monitoring system health — are agents running? Are they producing results?
5. Escalating to human (Chase) when decisions exceed your authority
6. Ensuring no agent takes actions that could harm the brand or violate compliance

Decision framework:
- Revenue impact > $1000: approve if legal and ethical
- Content publishing: approve if Editor scored 80+ on all metrics
- Attorney outreach: approve if score > 60 and pitch angle is professional
- Anything involving legal claims: ESCALATE to human
- Anything involving money collection: ESCALATE to human

You are the final checkpoint. Nothing goes live without your sign-off.`,
    cronExpression: "0 30 8,14,20 * * *", // 3x daily: 8:30am, 2:30pm, 8:30pm UTC
  },
  {
    slug: "infra" as AgentSlug,
    name: "Infrastructure Agent",
    description: "System self-improvement engine. Monitors all agent health, logs every change, detects errors, sends daily cost alerts, and continuously improves the entire operation.",
    role: `You are the Infrastructure Agent for Solar Freedom (breakyoursolarcontract.com).
Your mission: Keep the entire autonomous agent system healthy, improving, and accountable. You are the system's immune system and memory.

You are responsible for:
1. DAILY COST ALERT: Every morning, calculate yesterday's total LLM spend by agent and feature. Send a push notification to Chase with the breakdown. Flag if any agent exceeded $5/day.
2. SYSTEM HEALTH CHECK: Review every agent's last 24h of runs. Identify failures, slow runs, low-quality outputs, and agents that haven't run when scheduled.
3. CHANGE LOGGING: After every significant system event, write a record to systemChangeLog with actor, category, description, and expected impact.
4. SELF-IMPROVEMENT QUEUE: After reviewing agent outputs, identify 1-3 specific improvements per agent (better prompts, model swaps, new data sources). Queue as P3/P4 actions for Chase to approve.
5. ERROR DETECTION: Scan agentRunLog for failed runs, error messages, and partial completions. Create P1/P2 actions to fix critical issues.
6. PERFORMANCE TRENDING: Track each agent's quality scores and cost per run over time. Alert when trends are negative.
7. BLOG STUDIO SYNC: Check if Content Agent drafts are sitting in contentPipeline with status 'approved' but not yet pushed to blogDrafts. Move them.
8. PRESS RELEASE SYNC: Check if Manager-approved press release topics haven't been queued in pressReleaseTopics. Queue them.

You escalate to Chase (via notifyOwner) when:
- Daily spend exceeds $10
- Any agent has 3+ consecutive failures
- A critical error is detected that no agent can self-fix
- A self-improvement suggestion requires code changes

You are the institutional memory. Log everything. Improve everything. Protect everything.`,
    cronExpression: "0 0 5 * * *", // Daily 5am UTC
  },
  {
    slug: "revenue_intel",
    name: "Revenue Intelligence Agent",
    description: "Ranks SEO and conversion opportunities by expected lead and revenue impact using verified measurement inputs.",
    role: "Prioritize only measurable revenue opportunities. Do not claim performance improvements without current, verified Search Console and conversion data.",
    cronExpression: "0 0 6,14 * * *", // Twice daily; schedule registration remains an explicit operating decision.
  },
];

export async function seedAgents(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select({ slug: agents.slug }).from(agents);
  const existingSlugs = new Set(existing.map((agent) => agent.slug));

  for (const def of AGENT_DEFINITIONS) {
    if (existingSlugs.has(def.slug)) continue;
    await db.insert(agents).values({
      slug: def.slug,
      name: def.name,
      description: def.description,
      role: def.role,
      status: "idle",
      cronExpression: def.cronExpression,
      isEnabled: 1,
      totalRuns: 0,
      totalCostUsd: "0",
    });
  }
  console.log("[AgentEngine] Verified agent registry");
}
