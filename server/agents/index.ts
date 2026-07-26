/**
 * Agent System — Index & Orchestrator
 * Exports all agent runners and provides the orchestration layer.
 */

export { runMoneyMaker } from "./moneyMaker";
export { runSeoIntel } from "./seoIntel";
export { runContentAgent } from "./contentAgent";
export { runEditorAgent } from "./editorAgent";
export { runManagerAgent } from "./managerAgent";
export {
  seedAgents,
  listAgents,
  getAgent,
  getActionQueue,
  updateAction,
  getRunLog,
  getUnreadMessages,
  sendMessage,
  getContentPipelineItems,
  getRevenueStats,
  type AgentSlug,
  type AgentThinkResult,
} from "./engine";

import { runMoneyMaker } from "./moneyMaker";
import { runSeoIntel } from "./seoIntel";
import { runContentAgent } from "./contentAgent";
import { runEditorAgent } from "./editorAgent";
import { runManagerAgent } from "./managerAgent";
import type { AgentSlug, AgentThinkResult } from "./engine";

/**
 * Run a specific agent by slug.
 */
export async function runAgent(
  slug: AgentSlug,
  triggerType: "cron" | "manual" | "directive" | "event" = "manual",
  triggeredBy: string = "admin"
): Promise<AgentThinkResult> {
  switch (slug) {
    case "money_maker":
      return runMoneyMaker(triggerType, triggeredBy);
    case "seo_intel":
      return runSeoIntel(triggerType, triggeredBy);
    case "content":
      return runContentAgent(triggerType, triggeredBy);
    case "editor":
      return runEditorAgent(triggerType, triggeredBy);
    case "manager":
      return runManagerAgent(triggerType, triggeredBy);
    default:
      throw new Error(`Unknown agent: ${slug}`);
  }
}

/**
 * Run ALL agents in sequence (Manager runs last to review).
 * Used for full system cycle.
 */
export async function runAllAgents(
  triggeredBy: string = "system_cycle"
): Promise<Record<AgentSlug, AgentThinkResult>> {
  const results: Partial<Record<AgentSlug, AgentThinkResult>> = {};

  // Run in dependency order:
  // 1. SEO Intel first (provides data for others)
  results.seo_intel = await runSeoIntel("cron", triggeredBy);

  // 2. Money Maker (uses SEO data + own research)
  results.money_maker = await runMoneyMaker("cron", triggeredBy);

  // 3. Content Agent (receives directives from 1 & 2)
  results.content = await runContentAgent("cron", triggeredBy);

  // 4. Editor (reviews content output)
  results.editor = await runEditorAgent("cron", triggeredBy);

  // 5. Manager last (reviews everything)
  results.manager = await runManagerAgent("cron", triggeredBy);

  return results as Record<AgentSlug, AgentThinkResult>;
}
