/**
 * Attorney Research Executor
 *
 * When the Money Maker agent creates a research_firm action,
 * this module executes evidence-backed research only. It never accepts an LLM's
 * unsupported recollection as a real law-firm record. Once the Assistable web
 * research assistant is connected, it will return source URLs and an evidence
 * summary that the Money Maker stores beside each prospect.
 */

import { getDb } from "../db";
import { agentChatThreads } from "../../drizzle/schema";

// ─── Types ─────────────────────────────────────────────────────────────────────

// ─── Main Research Executor ────────────────────────────────────────────────────

export async function executeAttorneyResearch(
  states: string[],
  runId?: number
): Promise<{ found: number; saved: number; states: string[]; status: "blocked"; reason: string }> {
  const db = await getDb();
  const reason = "Attorney web research is intentionally blocked until the Assistable v3 research assistant and evidence source are connected. No unverified or LLM-invented firms were created.";
  if (!db) return { found: 0, saved: 0, states: [], status: "blocked", reason: "Database unavailable" };

  if (runId) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await db.insert(agentChatThreads).values({
      agentSlug: "money_maker",
      runId,
      role: "system",
      message: `${reason} Requested states: ${states.join(", ")}.`,
      messageType: "error",
      metadata: JSON.stringify({ operation: "attorney_research", status: "blocked", states }),
      createdAt: new Date(),
      expiresAt,
    });
  }

  return { found: 0, saved: 0, states, status: "blocked", reason };
}

// ─── Save Chat Thread Message ──────────────────────────────────────────────────

export async function saveAgentChatMessage(
  agentSlug: string,
  message: string,
  messageType: "analysis" | "action" | "result" | "error" | "directive" | "summary",
  runId?: number,
  metadata?: object
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await db.insert(agentChatThreads).values({
    agentSlug,
    runId: runId || null,
    role: "agent",
    message,
    messageType,
    metadata: metadata ? JSON.stringify(metadata) : null,
    createdAt: new Date(),
    expiresAt,
  });
}
