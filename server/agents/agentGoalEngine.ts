/**
 * Agent Goal Engine — Solar Freedom
 *
 * Provides the deterministic goal-setting, outcome-recording, memory, and
 * learning infrastructure that powers all 6 agents.
 *
 * PHILOSOPHY:
 * - Every agent run starts with a goal (set by Manager or self-generated)
 * - Every agent run ends with a recorded outcome (hit / miss + why)
 * - Every agent reads its memory before acting (what did I do last time?)
 * - Every agent writes a lesson after acting (what should I do differently?)
 * - Manager reads all outcomes and adjusts tomorrow's goals accordingly
 */

import { getDb } from "../db";
import { agentGoals, agentMemory, agentLearning } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export type AgentSlug = "manager" | "money_maker" | "seo_intel" | "content" | "editor" | "infra";

// ─── Goal Management ──────────────────────────────────────────────────────────

/**
 * Set a goal for an agent for today.
 * Called by Manager at the start of each daily cycle.
 */
export async function setGoal(params: {
  agentSlug: AgentSlug;
  goalType: string;
  metric: string;
  target: string;
  directive: string;
  date?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const date = params.date || new Date().toISOString().slice(0, 10);

  // Upsert: if a goal for this agent+date+goalType already exists, update it
  const existing = await db.select({ id: agentGoals.id })
    .from(agentGoals)
    .where(and(
      eq(agentGoals.agentSlug, params.agentSlug),
      eq(agentGoals.date, date),
      eq(agentGoals.goalType, params.goalType)
    ))
    .limit(1);

  if (existing.length > 0) {
    await db.update(agentGoals).set({
      metric: params.metric,
      target: params.target,
      directive: params.directive,
      hit: null,
      actual: null,
      updatedAt: new Date(),
    }).where(eq(agentGoals.id, existing[0].id));
    return existing[0].id;
  }

  const result = await db.insert(agentGoals).values({
    agentSlug: params.agentSlug,
    date,
    goalType: params.goalType,
    metric: params.metric,
    target: params.target,
    directive: params.directive,
  });
  return (result as any).insertId || 0;
}

/**
 * Record the outcome of a goal after an agent run.
 * Called by each agent at the end of its run.
 */
export async function recordOutcome(params: {
  agentSlug: AgentSlug;
  goalType: string;
  actual: string;
  hit: boolean;
  notes?: string;
  date?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const date = params.date || new Date().toISOString().slice(0, 10);

  await db.update(agentGoals).set({
    actual: params.actual,
    hit: params.hit ? 1 : 0,
    notes: params.notes,
    updatedAt: new Date(),
  }).where(and(
    eq(agentGoals.agentSlug, params.agentSlug),
    eq(agentGoals.date, date),
    eq(agentGoals.goalType, params.goalType)
  ));
}

/**
 * Get today's goals for an agent (with directives from Manager).
 */
export async function getTodaysGoals(agentSlug: AgentSlug): Promise<typeof agentGoals.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];

  const today = new Date().toISOString().slice(0, 10);
  return db.select().from(agentGoals)
    .where(and(eq(agentGoals.agentSlug, agentSlug), eq(agentGoals.date, today)))
    .orderBy(agentGoals.createdAt);
}

/**
 * Get goal history for the last N days (for Manager to review performance).
 */
export async function getGoalHistory(agentSlug: AgentSlug, days = 7): Promise<typeof agentGoals.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(agentGoals)
    .where(eq(agentGoals.agentSlug, agentSlug))
    .orderBy(desc(agentGoals.createdAt))
    .limit(days * 5); // up to 5 goals per day
}

/**
 * Get goal hit rate for all agents over the last N days (for Manager briefing).
 */
export async function getAllAgentGoalStats(days = 7): Promise<Record<string, { total: number; hit: number; rate: number }>> {
  const db = await getDb();
  if (!db) return {};

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const rows = await db.select({
    agentSlug: agentGoals.agentSlug,
    total: sql<number>`COUNT(*)`,
    hit: sql<number>`SUM(CASE WHEN hit = 1 THEN 1 ELSE 0 END)`,
  }).from(agentGoals)
    .where(sql`date >= ${cutoffStr} AND hit IS NOT NULL`)
    .groupBy(agentGoals.agentSlug);

  const stats: Record<string, { total: number; hit: number; rate: number }> = {};
  for (const row of rows) {
    const total = Number(row.total);
    const hit = Number(row.hit);
    stats[row.agentSlug] = { total, hit, rate: total > 0 ? Math.round((hit / total) * 100) : 0 };
  }
  return stats;
}

// ─── Memory ───────────────────────────────────────────────────────────────────

/**
 * Set a persistent memory value for an agent.
 * Upserts by agentSlug + key.
 */
export async function setMemory(agentSlug: AgentSlug, key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select({ id: agentMemory.id })
    .from(agentMemory)
    .where(and(eq(agentMemory.agentSlug, agentSlug), eq(agentMemory.key, key)))
    .limit(1);

  if (existing.length > 0) {
    await db.update(agentMemory).set({ value, updatedAt: new Date() })
      .where(eq(agentMemory.id, existing[0].id));
  } else {
    await db.insert(agentMemory).values({ agentSlug, key, value });
  }
}

/**
 * Get a memory value for an agent.
 */
export async function getMemory(agentSlug: AgentSlug, key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const rows = await db.select({ value: agentMemory.value })
    .from(agentMemory)
    .where(and(eq(agentMemory.agentSlug, agentSlug), eq(agentMemory.key, key)))
    .limit(1);

  return rows[0]?.value ?? null;
}

/**
 * Get all memory for an agent (for context injection).
 */
export async function getAllMemory(agentSlug: AgentSlug): Promise<Record<string, string>> {
  const db = await getDb();
  if (!db) return {};

  const rows = await db.select({ key: agentMemory.key, value: agentMemory.value })
    .from(agentMemory)
    .where(eq(agentMemory.agentSlug, agentSlug));

  const mem: Record<string, string> = {};
  for (const row of rows) mem[row.key] = row.value;
  return mem;
}

// ─── Learning ─────────────────────────────────────────────────────────────────

/**
 * Add a lesson learned after a run.
 */
export async function addLesson(params: {
  agentSlug: AgentSlug;
  lessonType: "success" | "failure" | "observation";
  lesson: string;
  impact?: string;
  relatedGoalId?: number;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(agentLearning).values({
    agentSlug: params.agentSlug,
    lessonType: params.lessonType,
    lesson: params.lesson,
    impact: params.impact,
    relatedGoalId: params.relatedGoalId,
  });
}

/**
 * Get the last N lessons for an agent (injected into context before each run).
 */
export async function getLessons(agentSlug: AgentSlug, limit = 10): Promise<typeof agentLearning.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(agentLearning)
    .where(eq(agentLearning.agentSlug, agentSlug))
    .orderBy(desc(agentLearning.learnedAt))
    .limit(limit);
}

/**
 * Format lessons for injection into an agent's LLM context.
 */
export function formatLessonsForContext(lessons: typeof agentLearning.$inferSelect[]): string {
  if (lessons.length === 0) return "No lessons recorded yet — this is your first run.";

  return lessons.map(l => {
    const emoji = l.lessonType === "success" ? "✅" : l.lessonType === "failure" ? "❌" : "📌";
    const impact = l.impact ? ` | Impact: ${l.impact}` : "";
    return `${emoji} [${l.lessonType.toUpperCase()}] ${l.lesson}${impact}`;
  }).join("\n");
}

/**
 * Format today's goals for injection into an agent's LLM context.
 */
export function formatGoalsForContext(goals: typeof agentGoals.$inferSelect[]): string {
  if (goals.length === 0) return "No goals set for today — use your best judgment based on business priorities.";

  return goals.map(g => {
    return `🎯 GOAL: ${g.goalType}\n   Metric: ${g.metric}\n   Target: ${g.target}\n   Directive: ${g.directive}`;
  }).join("\n\n");
}
