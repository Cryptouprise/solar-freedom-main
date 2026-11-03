import { ENV } from "../_core/env";

export interface AgentModelMetadata {
  id: string;
  label: string;
  provider: string;
  route: "openrouter" | "builtin";
  /** USD per million tokens; null means unavailable, not free. */
  costIn: number | null;
  costOut: number | null;
  costPer1MIn: number | null;
  costPer1MOut: number | null;
  priceUnit: "USD/1M tokens";
  pricingStatus: "estimate" | "unverified";
  metadataSource: "live-catalog" | "live-endpoints" | "endpoint-cache" | "stale-cache" | "unverified";
  verifiedAt?: string;
  status?: string;
  description?: string;
  contextLength?: number;
  maxCompletionTokens?: number;
  inputModalities?: string[];
  supportedParameters?: string[];
  /** Provider-dependent ranges, not a guarantee of the route's eventual bill. */
  priceRange?: { inputMin: number; inputMax: number; outputMin: number; outputMax: number };
}

const knownModels: Array<[string, string, "openrouter" | "builtin"]> = [
  ["qwen/qwen3-235b-a22b-thinking-2507", "Qwen3-235B Thinking 2507", "openrouter"],
  ["qwen/qwen3-235b-a22b-2507", "Qwen3-235B 2507", "openrouter"],
  ["qwen/qwen3-32b", "Qwen3-32B", "openrouter"],
  ["qwen/qwen3.7-flash", "Qwen3.7 Flash", "openrouter"],
  ["qwen/qwen3.7-plus", "Qwen3.7 Plus (OpenRouter)", "openrouter"],
  ["qwen/qwen3-max", "Qwen3 Max", "openrouter"],
  ["qwen/qwen3-max-thinking", "Qwen3 Max Thinking", "openrouter"],
  ["deepseek/deepseek-v4-pro", "DeepSeek V4 Pro", "openrouter"],
  ["deepseek/deepseek-v4-flash", "DeepSeek V4 Flash", "openrouter"],
  ["deepseek/deepseek-v4.1-flash", "DeepSeek V4.1 Flash (OpenRouter)", "openrouter"],
  ["deepseek/deepseek-v3.2", "DeepSeek V3.2", "openrouter"],
  ["deepseek/deepseek-r1", "DeepSeek R1", "openrouter"],
  ["google/gemini-4-argon", "Gemini 4 Argon (OpenRouter)", "openrouter"],
  ["gpt-5-mini", "GPT-5 Mini", "builtin"],
  ["gpt-5", "GPT-5", "builtin"],
  ["gemini-3-flash-preview", "Gemini 3 Flash", "builtin"],
  ["gemini-3.1-pro-preview", "Gemini 3.1 Pro", "builtin"],
  ["claude-haiku-4-5", "Claude Haiku 4.5", "builtin"],
  ["claude-sonnet-4-6", "Claude Sonnet 4.6", "builtin"],
];

export const OPENROUTER_MODELS = new Set(knownModels.filter(m => m[2] === "openrouter").map(m => m[0]));
export const AVAILABLE_MODELS: AgentModelMetadata[] = knownModels.map(([id, label, route]) => ({
  id, label, route, provider: route === "openrouter" ? id.split("/")[0] : id.startsWith("gemini") ? "google" : id.startsWith("claude") ? "anthropic" : "openai",
  costIn: null, costOut: null, costPer1MIn: null, costPer1MOut: null,
  priceUnit: "USD/1M tokens", pricingStatus: "unverified", metadataSource: "unverified",
}));

export const OPENROUTER_MODEL_PRICING: Record<string, { inputPer1M: number; outputPer1M: number }> = {};

function finitePrice(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function applyPrices(model: AgentModelMetadata, input: number | undefined, output: number | undefined) {
  model.costIn = model.costPer1MIn = input ?? null;
  model.costOut = model.costPer1MOut = output ?? null;
  model.pricingStatus = input !== undefined && output !== undefined ? "estimate" : "unverified";
  if (model.route === "openrouter" && input !== undefined && output !== undefined) {
    OPENROUTER_MODEL_PRICING[model.id] = { inputPer1M: input, outputPer1M: output };
  }
}

/** Normalize per-token OpenRouter prices exactly once. Never apply discount twice. */
export function applyOpenRouterMetadata(model: AgentModelMetadata, data: any, source: "live-catalog" | "live-endpoints" | "endpoint-cache", verifiedAt = new Date().toISOString()): boolean {
  if (data?.id !== model.id) return false;
  const hasEndpoints = Array.isArray(data.endpoints) && data.endpoints.some((e: any) => typeof e === "object");
  const endpoints = hasEndpoints ? data.endpoints.filter((e: any) => e.status === 0 && (!e.model_id || e.model_id === model.id)) : [];
  if (hasEndpoints && !endpoints.length) return false;
  // Use one paired regular-tier quote, not independent input/output minima from different providers.
  const regular = endpoints.filter((e: any) => !e.service_tier);
  const candidates = regular.length ? regular : endpoints;
  const priced = candidates.filter((e: any) => finitePrice(e.pricing?.prompt) !== undefined && finitePrice(e.pricing?.completion) !== undefined)
    .sort((a: any, b: any) => Number(a.pricing.prompt) - Number(b.pricing.prompt) || Number(a.pricing.completion) - Number(b.pricing.completion));
  const representative = priced[0];
  const pricing = representative?.pricing ?? data.pricing;
  const input = finitePrice(pricing?.prompt);
  const output = finitePrice(pricing?.completion);
  applyPrices(model, input === undefined ? undefined : input * 1_000_000, output === undefined ? undefined : output * 1_000_000);
  Object.assign(model, {
    metadataSource: source, verifiedAt, status: "active", description: data.description,
    contextLength: representative?.context_length ?? data.context_length ?? data.top_provider?.context_length,
    maxCompletionTokens: representative?.max_completion_tokens ?? data.top_provider?.max_completion_tokens,
    inputModalities: data.architecture?.input_modalities,
    supportedParameters: representative?.supported_parameters ?? data.supported_parameters,
  });
  if (priced.length) {
    model.priceRange = {
      inputMin: Math.min(...priced.map((e: any) => Number(e.pricing.prompt))) * 1_000_000,
      inputMax: Math.max(...priced.map((e: any) => Number(e.pricing.prompt))) * 1_000_000,
      outputMin: Math.min(...priced.map((e: any) => Number(e.pricing.completion))) * 1_000_000,
      outputMax: Math.max(...priced.map((e: any) => Number(e.pricing.completion))) * 1_000_000,
    };
  }
  return true;
}

// Compact, verified regular-tier endpoint snapshots from the parent's 2026-11-02
// endpoint GETs (full responses in solar-freedom-deliverables/autopilot-2026-11-02).
// They survive deployment without depending on sandbox absolute file paths.
const snapshotAt = "2026-11-03T00:00:00.000Z";
const snapshots = [
  { id: "deepseek/deepseek-v4.1-flash", architecture: { input_modalities: ["text", "image"] }, endpoints: [
    { model_id: "deepseek/deepseek-v4.1-flash", status: 0, context_length: 1048576, max_completion_tokens: 943718, pricing: { prompt: "0.000000035", completion: "0.0000005" }, supported_parameters: ["reasoning", "max_tokens", "response_format", "structured_outputs", "tools", "tool_choice", "reasoning_effort"] },
  ] },
  { id: "google/gemini-4-argon", architecture: { input_modalities: ["audio", "file", "image", "text", "video"] }, endpoints: [
    { model_id: "google/gemini-4-argon", status: 0, context_length: 1048576, max_completion_tokens: 943718, pricing: { prompt: "0.000002", completion: "0.00001" }, supported_parameters: ["reasoning", "max_tokens", "response_format", "structured_outputs", "tools", "tool_choice", "reasoning_effort"] },
  ] },
];
for (const snapshot of snapshots) applyOpenRouterMetadata(AVAILABLE_MODELS.find(m => m.id === snapshot.id)!, snapshot, "endpoint-cache", snapshotAt);

export const MODEL_CATALOG_TTL_MS = 5 * 60_000;
const FAILURE_TTL_MS = 60_000;
const FETCH_BUDGET_MS = 5_000;
let refreshAfter = 0;
let refreshPromise: Promise<void> | undefined;

async function readJson(url: string, signal: AbortSignal, headers?: Record<string, string>) {
  const response = await fetch(url, { signal, headers });
  if (!response.ok) throw new Error(`Model metadata GET failed: ${response.status}`);
  return response.json();
}

async function refreshCatalog() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_BUDGET_MS);
  let refreshed = false;
  const refresh = async () => {
    await Promise.all([
      (async () => {
        try {
          const aggregate = await readJson("https://openrouter.ai/api/v1/models", controller.signal);
          if (Array.isArray(aggregate?.data)) for (const model of AVAILABLE_MODELS.filter(m => m.route === "openrouter")) {
            const data = aggregate.data.find((d: any) => d.id === model.id);
            if (data && applyOpenRouterMetadata(model, data, "live-catalog")) refreshed = true;
          }
        } catch { /* Retain known IDs and explicitly marked cached estimates. */ }
        await Promise.all(snapshots.filter(s => AVAILABLE_MODELS.find(m => m.id === s.id)?.metadataSource !== "live-catalog")
          .map(async snapshot => {
            try {
              const payload = await readJson(`https://openrouter.ai/api/v1/models/${snapshot.id}/endpoints`, controller.signal);
              if (!controller.signal.aborted && applyOpenRouterMetadata(AVAILABLE_MODELS.find(m => m.id === snapshot.id)!, payload.data, "live-endpoints")) refreshed = true;
            } catch { /* Endpoint cache covers aggregate lag / temporary outages. */ }
          }));
      })(),
      (async () => {
        if (!ENV.forgeApiKey) return;
        try {
          const url = `${(ENV.forgeApiUrl || "https://forge.manus.im").replace(/\/$/, "")}/v1/models`;
          const payload = await readJson(url, controller.signal, { Authorization: `Bearer ${ENV.forgeApiKey}` });
          if (controller.signal.aborted || !Array.isArray(payload?.data)) return;
          for (const model of AVAILABLE_MODELS.filter(m => m.route === "builtin")) {
            const data = payload.data.find((d: any) => d.id === model.id);
            if (!data) continue;
            // Built-in catalog pricing, when present, is already USD / million tokens.
            applyPrices(model, finitePrice(data.pricing?.input_usd_per_million_tokens), finitePrice(data.pricing?.output_usd_per_million_tokens));
            Object.assign(model, { metadataSource: "live-catalog", verifiedAt: new Date().toISOString(), status: data.status ?? "listed", description: data.description });
            refreshed = true;
          }
        } catch { /* No fabricated built-in token prices. */ }
      })(),
    ]);
  };
  let deadlineTimer: ReturnType<typeof setTimeout> | undefined;
  try {
    // Race also bounds non-cooperative fetch implementations; abort handles native fetch.
    await Promise.race([refresh(), new Promise<void>(resolve => { deadlineTimer = setTimeout(resolve, FETCH_BUDGET_MS); })]);
  } finally {
    controller.abort();
    clearTimeout(timer);
    if (deadlineTimer) clearTimeout(deadlineTimer);
    refreshAfter = Date.now() + (refreshed ? MODEL_CATALOG_TTL_MS : FAILURE_TTL_MS);
  }
}

export async function getAvailableModels(): Promise<AgentModelMetadata[]> {
  if (Date.now() >= refreshAfter) {
    for (const m of AVAILABLE_MODELS) if (m.metadataSource.startsWith("live-")) m.metadataSource = "stale-cache";
    refreshPromise ??= refreshCatalog().finally(() => { refreshPromise = undefined; });
    await refreshPromise;
  }
  return AVAILABLE_MODELS.map(m => ({ ...m }));
}

/** Synchronous compatibility estimator. Unknown prices are undefined, never zero. */
export function estimateOpenRouterCost(modelId: string, usage?: { promptTokens: number; completionTokens: number; costUsd?: number }): number | undefined {
  if (usage?.costUsd !== undefined && Number.isFinite(usage.costUsd) && usage.costUsd >= 0) return usage.costUsd;
  const rate = OPENROUTER_MODEL_PRICING[modelId];
  if (!rate || !usage) return undefined;
  return (usage.promptTokens * rate.inputPer1M + usage.completionTokens * rate.outputPer1M) / 1_000_000;
}
