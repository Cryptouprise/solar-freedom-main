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
import { ensureDailyChecklists, reviewWorkerRun, type WorkerSlug } from "./managerQuality";

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

  const workers: WorkerSlug[] = ["revenue_intel", "seo_intel", "money_maker", "content", "editor", "infra"];
  const checklistIds = await ensureDailyChecklists();
  for (const worker of workers) {
    let result: AgentThinkResult | undefined;
    let error: Error | undefined;
    try {
      result = await runAgent(worker, "cron", triggeredBy);
      results[worker] = result;
    } catch (caught: any) {
      error = caught instanceof Error ? caught : new Error(String(caught));
      results[worker] = { summary: `Failed: ${error.message}`, actionsCreated: 0, messagesCreated: 0 };
    }

    const review = await reviewWorkerRun({
      agentSlug: worker,
      checklistId: checklistIds[worker],
      result,
      error,
      retryNumber: 0,
    });
    if (review.verdict !== "rework") continue;

    try {
      const retry = await runAgent(worker, "directive", `${triggeredBy}:manager_quality_rework`);
      results[`${worker}_rework`] = retry;
      await reviewWorkerRun({ agentSlug: worker, checklistId: checklistIds[worker], result: retry, retryNumber: 1 });
    } catch (caught: any) {
      const retryError = caught instanceof Error ? caught : new Error(String(caught));
      results[`${worker}_rework`] = { summary: `Rework failed: ${retryError.message}`, actionsCreated: 0, messagesCreated: 0 };
      await reviewWorkerRun({ agentSlug: worker, checklistId: checklistIds[worker], error: retryError, retryNumber: 1 });
    }
  }

  return results;
}
