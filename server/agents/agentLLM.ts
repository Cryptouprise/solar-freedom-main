/** Universal agent LLM dispatch. Existing selections are never changed by seeding. */
import { getDb } from "../db";
import { agentModelConfig } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { ENV } from "../_core/env";
import { OPENROUTER_MODELS, estimateOpenRouterCost } from "./openRouterCatalog";
import { getAutonomousInvocation, remainingAutonomousBudgetMs, type AutonomousInvocation } from "../autonomousBudget";
export { AVAILABLE_MODELS, OPENROUTER_MODELS, OPENROUTER_MODEL_PRICING, getAvailableModels, estimateOpenRouterCost } from "./openRouterCatalog";

// Other roles retain their defaults. Owner approved Argon for SEO after workload validation.
export const AGENT_DEFAULT_MODELS: Record<string, { modelId: string; modelLabel: string }> = {
  manager:       { modelId: "qwen/qwen3-32b", modelLabel: "Qwen3-32B" },
  revenue_intel: { modelId: "deepseek/deepseek-v4-pro", modelLabel: "DeepSeek V4 Pro" },
  content:       { modelId: "qwen/qwen3.7-flash", modelLabel: "Qwen3.7 Flash (OpenRouter)" },
  seo_intel:     { modelId: "google/gemini-4-argon", modelLabel: "Gemini 4 Argon (OpenRouter)" },
  editor:        { modelId: "qwen/qwen3.7-flash", modelLabel: "Qwen3.7 Flash (OpenRouter)" },
  money_maker:   { modelId: "qwen/qwen3.7-plus", modelLabel: "Qwen3.7 Plus (OpenRouter)" },
  infra:         { modelId: "qwen/qwen3.7-flash", modelLabel: "Qwen3.7 Flash (OpenRouter)" },
};

export const FALLBACK_MODEL = "gpt-5-mini";
export const AUTONOMOUS_LLM_MAX_MS = 16_000;
export const AUTONOMOUS_DB_RESERVE_MS = 8_000;
// Keyed by the request-local invocation, not jobId: a durable retry on a later
// tick gets one new attempt, but nested/concurrent calls in this tick cannot.
const attemptedInvocations = new WeakSet<AutonomousInvocation>();
export type AgentExecutionMode = "standard" | "scheduled";
export function resolveAgentTimeoutProfile(mode: AgentExecutionMode = "standard") {
  return mode === "scheduled"
    ? { openRouterAttemptTimeoutMs: 18_000, builtInAttemptTimeoutMs: 24_000, maxOpenRouterAttempts: 1 }
    : { openRouterAttemptTimeoutMs: 45_000, builtInAttemptTimeoutMs: 60_000, maxOpenRouterAttempts: 3 };
}

export async function withTimeout<T>(operation: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)}s`)), Math.max(0, timeoutMs));
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function getAgentModel(agentSlug: string): Promise<string> {
  const db = await getDb();
  if (db) {
    try {
      const [config] = await db.select().from(agentModelConfig).where(eq(agentModelConfig.agentSlug, agentSlug)).limit(1);
      if (config?.modelId) return config.modelId;
    } catch { /* Fall through to the existing configured default. */ }
  }
  return AGENT_DEFAULT_MODELS[agentSlug]?.modelId ?? FALLBACK_MODEL;
}

export async function seedDefaultModelConfigs(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  for (const [slug, cfg] of Object.entries(AGENT_DEFAULT_MODELS)) {
    try {
      // INSERT IGNORE is atomic on the unique agentSlug key and does not touch
      // modelId, modelLabel, or updatedAt on an existing administrator selection.
      await db.insert(agentModelConfig).ignore().values({ agentSlug: slug, modelId: cfg.modelId, modelLabel: cfg.modelLabel });
    } catch { /* Match startup seeding's existing best-effort semantics. */ }
  }
}

export type AgentLLMContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string; detail?: "auto" | "low" | "high" } };
export interface AgentLLMMessage {
  role: "system" | "user" | "assistant";
  content: string | AgentLLMContentPart[];
}
export interface AgentLLMOptions {
  agentSlug?: string;
  modelOverride?: string;
  executionMode?: AgentExecutionMode;
  /** Total wall-clock budget for lookup, attempts, backoff AND fallback. */
  totalTimeoutMs?: number;
  /** Critical callers may fail closed instead of allowing the existing fallback. */
  allowFallback?: boolean;
  /** Provider-specific, capability-verified override for short bounded tasks. */
  openRouterReasoning?: { enabled?: boolean; effort?: "none" | "minimal" | "low"; max_tokens?: number };
  messages: AgentLLMMessage[];
  tools?: object[];
  responseFormat?: object;
  maxTokens?: number;
}
export interface AgentLLMUsage {
  promptTokens: number;
  completionTokens: number;
  /** Actual provider-reported USD cost; do not replace with a token estimate. */
  costUsd?: number;
}
export interface AgentLLMResult {
  content: string;
  toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>;
  usage?: AgentLLMUsage;
  /** Response model when reported, otherwise the explicitly requested model. */
  modelId: string;
  requestedModelId: string;
  fallbackFrom?: string;
  costUsd?: number;
  costSource: "provider" | "estimate" | "unverified";
}

export async function callAgentLLM(opts: AgentLLMOptions): Promise<AgentLLMResult> {
  const invocation = getAutonomousInvocation();
  if (invocation) {
    if (attemptedInvocations.has(invocation)) {
      throw new Error("Autonomous step permits only one LLM call; persist continuation for the next worker tick.");
    }
    // Reserve synchronously, before any await, so Promise.all cannot bypass it.
    attemptedInvocations.add(invocation);
    opts = { ...opts, executionMode: "scheduled", allowFallback: false };
  }
  const profile = resolveAgentTimeoutProfile(opts.executionMode);
  const scheduled = opts.executionMode === "scheduled";
  const defaultTotal = scheduled ? 42_000 : 201_000;
  const hardCeiling = invocation ? AUTONOMOUS_LLM_MAX_MS : scheduled ? 90_000 : defaultTotal;
  if (opts.totalTimeoutMs !== undefined && (!Number.isFinite(opts.totalTimeoutMs) || opts.totalTimeoutMs <= 0)) {
    throw new Error("Agent LLM totalTimeoutMs must be a finite positive budget");
  }
  const available = remainingAutonomousBudgetMs(AUTONOMOUS_DB_RESERVE_MS);
  if (available !== undefined && (!Number.isFinite(available) || available < 1_000)) {
    throw new Error("Autonomous deadline exhausted before model call; database receipt time is reserved.");
  }
  const deadline = Date.now() + Math.min(opts.totalTimeoutMs ?? defaultTotal, hardCeiling, available ?? Infinity);
  const remaining = () => {
    const ms = deadline - Date.now();
    if (ms <= 0) throw new Error("Agent LLM total deadline exhausted; no further attempts or fallback permitted");
    return ms;
  };
  const modelId = opts.modelOverride ?? (opts.agentSlug
    ? await withTimeout(getAgentModel(opts.agentSlug), remaining(), "Agent model lookup") : FALLBACK_MODEL);
  if (opts.agentSlug === "seo_intel" && !["google/gemini-4-argon", "deepseek/deepseek-v4.1-flash"].includes(modelId)) {
    throw new Error("Owner model policy: SEO requires Gemini 4 Argon or DeepSeek V4.1 Flash; GPT Mini and other routes are not permitted.");
  }
  const boundedRoleAttempt = invocation ? AUTONOMOUS_LLM_MAX_MS : scheduled && opts.totalTimeoutMs !== undefined
    ? opts.agentSlug === "content" || opts.agentSlug === "editor" ? 70_000 : opts.agentSlug === "seo_intel" ? 45_000 : profile.openRouterAttemptTimeoutMs
    : profile.openRouterAttemptTimeoutMs;
  const boundedBuiltInAttempt = invocation ? AUTONOMOUS_LLM_MAX_MS : scheduled && opts.totalTimeoutMs !== undefined && (opts.agentSlug === "content" || opts.agentSlug === "editor") ? 70_000 : profile.builtInAttemptTimeoutMs;
  if (!OPENROUTER_MODELS.has(modelId)) {
    return callBuiltIn(modelId, opts, Math.min(boundedBuiltInAttempt, remaining()));
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= profile.maxOpenRouterAttempts; attempt++) {
    const attemptBudget = Math.min(boundedRoleAttempt, remaining());
    try {
      return await callOpenRouter(modelId, opts, attemptBudget);
    } catch (error: any) {
      lastError = error;
      console.error(`[agentLLM] OpenRouter attempt ${attempt}/${profile.maxOpenRouterAttempts} failed for ${modelId}: ${error?.message}`);
      const nonRetryable = /\b(?:400|401|402|403|404|422)\b|access denied|security policy|invalid api key|model.*not found|OPENROUTER_API_KEY not set/i.test(error?.message ?? "");
      if (nonRetryable || attempt === profile.maxOpenRouterAttempts) break;
      const backoff = 2000 * Math.pow(2, attempt - 1);
      // Do not consume the rest of a short run sleeping before a doomed retry.
      if (remaining() <= backoff) break;
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
  // Owner policy: SEO must not silently downgrade to GPT Mini.
  if (invocation || opts.allowFallback === false || opts.agentSlug === "seo_intel") throw lastError;
  const fallbackBudget = Math.min(boundedBuiltInAttempt, remaining());
  console.error(`[agentLLM] Falling back from ${modelId} to ${FALLBACK_MODEL} within ${fallbackBudget}ms remaining budget.`);
  const result = await callBuiltIn(FALLBACK_MODEL, opts, fallbackBudget);
  return { ...result, fallbackFrom: modelId };
}

/** Reject truncation/empty outputs before they can be recorded as successful work. */
function parseResponse(data: any, requestedModelId: string): AgentLLMResult {
  if (data?.error) throw new Error(`Model API error ${data.error.code ?? ""}: ${data.error.message ?? "Unknown model failure"}`);
  const choice = data?.choices?.[0];
  const message = choice?.message;
  if (!message) throw new Error("Model returned no response message");
  if (["length", "max_tokens", "content_filter", "error"].includes(choice.finish_reason)) {
    throw new Error(`Model response incomplete: finish_reason=${choice.finish_reason}`);
  }
  const content = typeof message.content === "string" ? message.content
    : Array.isArray(message.content) ? message.content.filter((part: any) => part?.type === "text" && typeof part.text === "string").map((part: any) => part.text).join("\n") : "";
  const toolCalls = message.tool_calls?.map((tc: any) => {
    if (typeof tc?.function?.name !== "string" || !tc.function.name.trim()) throw new Error("Invalid model tool call name");
    const args = JSON.parse(tc.function.arguments || "{}");
    if (!args || typeof args !== "object" || Array.isArray(args)) throw new Error("Invalid model tool call arguments");
    return { name: tc.function.name, arguments: args };
  });
  if (!content.trim() && !toolCalls?.length) throw new Error("Model returned empty content");
  const rawCost = data.usage?.cost;
  const actualCost = rawCost !== null && rawCost !== undefined && rawCost !== "" && Number.isFinite(Number(rawCost)) && Number(rawCost) >= 0 ? Number(rawCost) : undefined;
  const usage = data.usage ? {
    promptTokens: Number(data.usage.prompt_tokens) || 0,
    completionTokens: Number(data.usage.completion_tokens) || 0,
    ...(actualCost !== undefined ? { costUsd: actualCost } : {}),
  } : undefined;
  const actualModelId = typeof data.model === "string" && data.model.trim() ? data.model : requestedModelId;
  // A response's concrete provider version may differ from the requested alias;
  // never substitute the alias on the receipt, but use its rate for estimates.
  const costUsd = actualCost ?? estimateOpenRouterCost(requestedModelId, usage);
  return {
    content, toolCalls, usage, modelId: actualModelId, requestedModelId,
    costUsd, costSource: actualCost !== undefined ? "provider" : costUsd !== undefined ? "estimate" : "unverified",
  };
}

async function callBuiltIn(modelId: string, opts: AgentLLMOptions, timeoutMs: number): Promise<AgentLLMResult> {
  const controller = new AbortController();
  try {
  const res = await withTimeout(invokeLLM({
    model: modelId,
    messages: opts.messages,
    ...(opts.tools ? { tools: opts.tools as any, tool_choice: "auto" } : {}),
    ...(opts.responseFormat ? { response_format: opts.responseFormat as any } : {}),
    // IMPORTANT: core helper reads maxTokens, NOT max_tokens. Always bound it.
    maxTokens: opts.maxTokens ?? 4000,
    ...(opts.executionMode === "scheduled" && /^gpt-/i.test(modelId) ? { reasoning: { effort: "low" as const } } : {}),
    signal: controller.signal,
  }), timeoutMs, `Built-in agent model ${modelId}`);
  return parseResponse(res, modelId);
  } finally { controller.abort(); }
}

async function callOpenRouter(modelId: string, opts: AgentLLMOptions, timeoutMs: number): Promise<AgentLLMResult> {
  if (!ENV.openRouterApiKey) throw new Error("OPENROUTER_API_KEY not set");
  const body: Record<string, unknown> = {
    model: modelId, messages: opts.messages, max_tokens: opts.maxTokens ?? 4000,
    // Include actual billed USD usage when supported by OpenRouter.
    usage: { include: true },
  };
  if (opts.tools) Object.assign(body, { tools: opts.tools, tool_choice: "auto" });
  if (opts.responseFormat) body.response_format = opts.responseFormat;
  if (opts.openRouterReasoning) {
    body.reasoning = opts.openRouterReasoning;
  } else if (opts.executionMode === "scheduled" && /^(qwen\/qwen3\.7-|deepseek\/deepseek-v4|google\/gemini-4-argon)/.test(modelId)) {
    body.reasoning = { effort: "low" };
  }
  const controller = new AbortController();
  try {
    return await withTimeout((async () => {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ENV.openRouterApiKey}`, "Content-Type": "application/json",
          "HTTP-Referer": "https://breakyoursolarcontract.com", "X-Title": "Solar Freedom Agent System",
        },
        body: JSON.stringify(body), signal: controller.signal,
      });
      if (!res.ok) throw new Error(`OpenRouter error ${res.status}: ${(await res.text()).slice(0, 400)}`);
      const raw = await res.text();
      if (!raw.trim()) throw new Error("OpenRouter returned empty response body");
      let data: unknown;
      try { data = JSON.parse(raw); } catch { throw new Error("OpenRouter returned invalid JSON"); }
      return parseResponse(data, modelId);
    })(), timeoutMs, `OpenRouter model ${modelId}`);
  } finally {
    // Abort includes body streaming, and also runs when the total/attempt race wins.
    controller.abort();
  }
}
