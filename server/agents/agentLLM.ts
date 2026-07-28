/**
 * agentLLM.ts
 * Universal LLM helper for agents.
 * Routes to OpenRouter for Qwen/DeepSeek models, built-in proxy for others.
 * Reads per-agent model config from DB; falls back to defaults if not set.
 * Has 3-retry logic with exponential backoff + fallback to built-in on OpenRouter failure.
 */

import { getDb } from "../db";
import { agentModelConfig } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { ENV } from "../_core/env";

// ─── Model Catalog ─────────────────────────────────────────────────────────────
// Models available via OpenRouter (Qwen + DeepSeek)
const OPENROUTER_MODELS = new Set([
  "qwen/qwen3-235b-a22b-thinking-2507",
  "qwen/qwen3-235b-a22b-2507",
  "qwen/qwen3-32b",
  "qwen/qwen3.7-flash",
  "qwen/qwen3-max",
  "qwen/qwen3-max-thinking",
  "deepseek/deepseek-v4-pro",
  "deepseek/deepseek-v4-flash",
  "deepseek/deepseek-v3.2",
  "deepseek/deepseek-r1",
]);

// Default model per agent slug
export const AGENT_DEFAULT_MODELS: Record<string, { modelId: string; modelLabel: string }> = {
  manager:       { modelId: "qwen/qwen3-235b-a22b-thinking-2507", modelLabel: "Qwen3-235B Thinking (2507)" },
  revenue_intel: { modelId: "deepseek/deepseek-v4-pro",           modelLabel: "DeepSeek V4 Pro" },
  content:       { modelId: "qwen/qwen3-235b-a22b-2507",          modelLabel: "Qwen3-235B (2507)" },
  seo_intel:     { modelId: "qwen/qwen3-235b-a22b-thinking-2507", modelLabel: "Qwen3-235B Thinking (2507)" },
  editor:        { modelId: "deepseek/deepseek-v4-flash",         modelLabel: "DeepSeek V4 Flash" },
  money_maker:   { modelId: "deepseek/deepseek-v4-pro",           modelLabel: "DeepSeek V4 Pro" },
  infra:         { modelId: "qwen/qwen3-235b-a22b-2507",          modelLabel: "Qwen3-235B (2507)" },
};

// Fallback model when OpenRouter fails
const FALLBACK_MODEL = "gpt-5-mini";

// Full curated model list for the selector UI
export const AVAILABLE_MODELS = [
  // Qwen
  { id: "qwen/qwen3-235b-a22b-thinking-2507", label: "Qwen3-235B Thinking 2507", provider: "qwen", costIn: 0.30, costOut: 3.00 },
  { id: "qwen/qwen3-235b-a22b-2507",          label: "Qwen3-235B 2507",          provider: "qwen", costIn: 0.09, costOut: 0.55 },
  { id: "qwen/qwen3-32b",                     label: "Qwen3-32B",                provider: "qwen", costIn: 0.08, costOut: 0.28 },
  { id: "qwen/qwen3.7-flash",                 label: "Qwen3.7 Flash",            provider: "qwen", costIn: 0.03, costOut: 0.13 },
  { id: "qwen/qwen3-max-thinking",            label: "Qwen3 Max Thinking",       provider: "qwen", costIn: 0.78, costOut: 3.90 },
  // DeepSeek
  { id: "deepseek/deepseek-v4-pro",           label: "DeepSeek V4 Pro",          provider: "deepseek", costIn: 0.44, costOut: 0.87 },
  { id: "deepseek/deepseek-v4-flash",         label: "DeepSeek V4 Flash",        provider: "deepseek", costIn: 0.14, costOut: 0.28 },
  { id: "deepseek/deepseek-v3.2",             label: "DeepSeek V3.2",            provider: "deepseek", costIn: 0.27, costOut: 0.40 },
  { id: "deepseek/deepseek-r1",               label: "DeepSeek R1",              provider: "deepseek", costIn: 0.70, costOut: 2.50 },
  // Built-in (Manus proxy)
  { id: "gpt-5-mini",                         label: "GPT-5 Mini",               provider: "openai",   costIn: 0.25, costOut: 2.00 },
  { id: "gpt-5",                              label: "GPT-5",                    provider: "openai",   costIn: 1.25, costOut: 10.00 },
  { id: "gemini-3-flash-preview",             label: "Gemini 3 Flash",           provider: "google",   costIn: 0.50, costOut: 3.00 },
  { id: "gemini-3.1-pro-preview",             label: "Gemini 3.1 Pro",           provider: "google",   costIn: 2.00, costOut: 12.00 },
  { id: "claude-haiku-4-5",                   label: "Claude Haiku 4.5",         provider: "anthropic",costIn: 1.00, costOut: 5.00 },
  { id: "claude-sonnet-4-6",                  label: "Claude Sonnet 4.6",        provider: "anthropic",costIn: 3.00, costOut: 15.00 },
];

// ─── Get model for agent (reads DB, falls back to default) ─────────────────────
export async function getAgentModel(agentSlug: string): Promise<string> {
  const db = await getDb();
  if (db) {
    try {
      const [config] = await db
        .select()
        .from(agentModelConfig)
        .where(eq(agentModelConfig.agentSlug, agentSlug))
        .limit(1);
      if (config?.modelId) return config.modelId;
    } catch (_) {
      // Fall through to default
    }
  }
  return AGENT_DEFAULT_MODELS[agentSlug]?.modelId ?? FALLBACK_MODEL;
}

// ─── Seed default model configs ────────────────────────────────────────────────
export async function seedDefaultModelConfigs(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  for (const [slug, cfg] of Object.entries(AGENT_DEFAULT_MODELS)) {
    try {
      await db
        .insert(agentModelConfig)
        .values({ agentSlug: slug, modelId: cfg.modelId, modelLabel: cfg.modelLabel })
        .onDuplicateKeyUpdate({ set: { modelId: cfg.modelId, modelLabel: cfg.modelLabel } });
    } catch (_) {}
  }
}

// ─── Universal LLM call ────────────────────────────────────────────────────────
export interface AgentLLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AgentLLMOptions {
  agentSlug?: string;
  modelOverride?: string;
  messages: AgentLLMMessage[];
  tools?: object[];
  responseFormat?: object;
  maxTokens?: number;
}

export async function callAgentLLM(opts: AgentLLMOptions): Promise<{
  content: string;
  toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>;
  usage?: { promptTokens: number; completionTokens: number };
}> {
  const modelId = opts.modelOverride ?? (opts.agentSlug ? await getAgentModel(opts.agentSlug) : FALLBACK_MODEL);

  // Route to OpenRouter for Qwen/DeepSeek models — with retry + fallback
  if (OPENROUTER_MODELS.has(modelId)) {
    // Try OpenRouter up to 3 times with exponential backoff
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await callOpenRouter(modelId, opts);
        // Validate we got actual content back
        if (!result.content && !result.toolCalls?.length) {
          throw new Error("OpenRouter returned empty content");
        }
        return result;
      } catch (err: any) {
        lastError = err;
        console.error(`[agentLLM] OpenRouter attempt ${attempt}/${MAX_RETRIES} failed for ${modelId}: ${err.message}`);
        if (attempt < MAX_RETRIES) {
          // Exponential backoff: 2s, 4s, 8s
          await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt - 1)));
        }
      }
    }
    // All retries exhausted — fall back to built-in LLM
    console.error(`[agentLLM] OpenRouter failed after ${MAX_RETRIES} attempts for ${modelId}. Falling back to ${FALLBACK_MODEL}. Last error: ${lastError?.message}`);
    return callBuiltIn(opts);
  }

  // Use built-in proxy for everything else
  return callBuiltIn(opts);
}

// ─── Built-in LLM call (Manus proxy) ──────────────────────────────────────────
async function callBuiltIn(opts: AgentLLMOptions): Promise<{
  content: string;
  toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>;
  usage?: { promptTokens: number; completionTokens: number };
}> {
  const res = await invokeLLM({
    messages: opts.messages,
    ...(opts.tools ? { tools: opts.tools as any, tool_choice: "auto" } : {}),
    ...(opts.responseFormat ? { response_format: opts.responseFormat as any } : {}),
    ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
  });

  const msg = res.choices[0].message;
  const toolCalls = msg.tool_calls?.map((tc: any) => ({
    name: tc.function.name,
    arguments: JSON.parse(tc.function.arguments || "{}"),
  }));
  const rawContent = msg.content;
  const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent ?? "");

  return {
    content,
    toolCalls,
    usage: res.usage ? { promptTokens: res.usage.prompt_tokens, completionTokens: res.usage.completion_tokens } : undefined,
  };
}

// ─── OpenRouter call ───────────────────────────────────────────────────────────
async function callOpenRouter(
  modelId: string,
  opts: AgentLLMOptions
): Promise<{ content: string; toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>; usage?: { promptTokens: number; completionTokens: number } }> {
  const apiKey = ENV.openRouterApiKey;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const body: Record<string, unknown> = {
    model: modelId,
    messages: opts.messages,
  };
  if (opts.tools) {
    body.tools = opts.tools;
    body.tool_choice = "auto";
  }
  if (opts.responseFormat) body.response_format = opts.responseFormat;
  if (opts.maxTokens) body.max_tokens = opts.maxTokens;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://breakyoursolarcontract.com",
      "X-Title": "Solar Freedom Agent System",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${err}`);
  }

  // Guard against empty body (causes "Unexpected end of JSON input")
  const rawText = await res.text();
  if (!rawText || rawText.trim() === "") {
    throw new Error("OpenRouter returned empty response body");
  }

  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    throw new Error(`OpenRouter returned invalid JSON: ${rawText.substring(0, 200)}`);
  }

  // Check for OpenRouter error in body (some errors come as 200 with error field)
  if (data.error) {
    throw new Error(`OpenRouter API error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const msg = data.choices?.[0]?.message;
  if (!msg) throw new Error(`No message in OpenRouter response: ${JSON.stringify(data).substring(0, 200)}`);

  const toolCalls = msg.tool_calls?.map((tc: any) => ({
    name: tc.function.name,
    arguments: JSON.parse(tc.function.arguments || "{}"),
  }));

  return {
    content: msg.content ?? "",
    toolCalls,
    usage: data.usage ? { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens } : undefined,
  };
}
