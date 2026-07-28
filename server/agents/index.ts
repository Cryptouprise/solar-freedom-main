/**
 * Agent System — Index & Orchestrator
 * Exports all agent runners and provides the orchestration layer.
 */

export { runMoneyMaker } from "./moneyMaker";
export { runSeoIntel } from "./seoIntel";
export { runContentAgent } from "./contentAgent";
export { runEditorAgent } from "./editorAgent";
export { runManagerAgent } from "./managerAgent";
export { runInfraAgent } from "./infraAgent";
export { runRevenueIntelAgent } from "./revenueIntelAgent";
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
import { runInfraAgent } from "./infraAgent";
import { runRevenueIntelAgent } from "./revenueIntelAgent";
import type { AgentSlug, AgentThinkResult } from "./engine";

/**
 * Run a specific agent by slug.
 */
export async function runAgent(
  slug: AgentSlug | "revenue_intel",
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
    case "revenue_intel":
      return runRevenueIntelAgent(triggerType, triggeredBy);
    case "infra": {
      const infraTrigger = triggerType === "directive" || triggerType === "event" ? "manual" : triggerType;
      return runInfraAgent(infraTrigger, triggeredBy);
    }
    default:
      throw new Error(`Unknown agent: ${slug}`);
  }
}

/**
 * Run ALL agents in sequence — Manager runs first to set goals, then workers, then infra.
 * Used for full system cycle.
 */
export async function runAllAgents(
  triggeredBy: string = "system_cycle"
): Promise<Record<string, AgentThinkResult>> {
  const results: Record<string, AgentThinkResult> = {};

  // 0. Manager runs FIRST — sets goals and fires agents with directives
  results.manager = await runManagerAgent("cron", triggeredBy);

  // 1. Revenue Intel — identifies highest-value opportunities
  results.revenue_intel = await runRevenueIntelAgent("cron", triggeredBy);

  // 2. SEO Intel — provides ranking data
  results.seo_intel = await runSeoIntel("cron", triggeredBy);

  // 3. Money Maker — uses SEO + revenue intel data
  results.money_maker = await runMoneyMaker("cron", triggeredBy);

  // 4. Content Agent — receives directives from Manager + Revenue Intel
  results.content = await runContentAgent("cron", triggeredBy);

  // 5. Editor — reviews and improves content output
  results.editor = await runEditorAgent("cron", triggeredBy);

  // 6. Infrastructure Agent — monitors the full cycle
  results.infra = await runInfraAgent("cron", triggeredBy);

  return results;
}
