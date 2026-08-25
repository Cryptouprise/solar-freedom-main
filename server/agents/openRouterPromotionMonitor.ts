import { ENV } from "../_core/env";
import { getDb } from "../db";
import { getMemory, setMemory } from "./agentGoalEngine";
import { agentRunLog } from "../../drizzle/schema";
import { and, eq, gte, sql } from "drizzle-orm";

export const QWEN37_PLUS_MODEL_ID = "qwen/qwen3.7-plus";
export const PROMOTION_MEMORY_KEY = "qwen37_plus_openrouter_pricing";
export const QWEN37_PLUS_DAILY_SPEND_ALERT_USD = 5;

export type QwenPricingSnapshot = {
  modelId: string;
  inputPer1M: number;
  outputPer1M: number;
  checkedAt: string;
};

export function pricingChanged(previous: QwenPricingSnapshot | null, next: QwenPricingSnapshot) {
  return Boolean(previous && (
    previous.inputPer1M !== next.inputPer1M ||
    previous.outputPer1M !== next.outputPer1M
  ));
}

export async function monitorQwen37PlusPricing(): Promise<{ snapshot?: QwenPricingSnapshot; changed: boolean; dailySpendUsd: number; spendAlert: boolean; error?: string }> {
  let dailySpendUsd = 0;
  try {
    const db = await getDb();
    if (db) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [row] = await db.select({ total: sql<string>`COALESCE(SUM(${agentRunLog.costUsd}), 0)` })
        .from(agentRunLog)
        .where(and(eq(agentRunLog.model, QWEN37_PLUS_MODEL_ID), gte(agentRunLog.completedAt, since)));
      dailySpendUsd = Number(row?.total || 0);
    }
  } catch {
    // Pricing monitoring must never block the Manager cycle because cost history is unavailable.
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: ENV.openRouterApiKey ? { Authorization: `Bearer ${ENV.openRouterApiKey}` } : undefined,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`OpenRouter model catalog returned HTTP ${response.status}`);
    const payload = await response.json() as { data?: Array<{ id?: string; pricing?: { prompt?: string; completion?: string } }> };
    const model = payload.data?.find(item => item.id === QWEN37_PLUS_MODEL_ID);
    const inputPerToken = Number(model?.pricing?.prompt);
    const outputPerToken = Number(model?.pricing?.completion);
    if (!Number.isFinite(inputPerToken) || !Number.isFinite(outputPerToken)) {
      throw new Error("Qwen3.7 Plus pricing was missing from the live OpenRouter catalog");
    }
    const snapshot: QwenPricingSnapshot = {
      modelId: QWEN37_PLUS_MODEL_ID,
      inputPer1M: inputPerToken * 1_000_000,
      outputPer1M: outputPerToken * 1_000_000,
      checkedAt: new Date().toISOString(),
    };
    const priorText = await getMemory("manager", PROMOTION_MEMORY_KEY);
    let prior: QwenPricingSnapshot | null = null;
    try { prior = priorText ? JSON.parse(priorText) : null; } catch { /* Treat malformed history as a fresh baseline. */ }
    const changed = pricingChanged(prior, snapshot);
    await setMemory("manager", PROMOTION_MEMORY_KEY, JSON.stringify(snapshot));
    return { snapshot, changed, dailySpendUsd, spendAlert: dailySpendUsd >= QWEN37_PLUS_DAILY_SPEND_ALERT_USD };
  } catch (error) {
    return { changed: false, dailySpendUsd, spendAlert: dailySpendUsd >= QWEN37_PLUS_DAILY_SPEND_ALERT_USD, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timeout);
  }
}
