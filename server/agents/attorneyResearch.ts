/**
 * Attorney Research Executor
 *
 * Source of record is the public Justia consumer-law directory. It never writes
 * LLM-recalled firms, invented emails, fee arrangements, or outreach.
 */
import { getDb } from "../db";
import { agentChatThreads } from "../../drizzle/schema";
import { runJustiaAttorneyResearch, type JustiaResearchResult } from "../justiaAttorneyResearch";

export async function executeAttorneyResearch(
  states: string[] = [],
  runId?: number,
): Promise<JustiaResearchResult> {
  return runJustiaAttorneyResearch(states, runId);
}

export async function saveAgentChatMessage(
  agentSlug: string,
  message: string,
  messageType: "analysis" | "action" | "result" | "error" | "directive" | "summary",
  runId?: number,
  metadata?: object,
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
