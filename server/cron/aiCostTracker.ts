/**
 * AI usage tracker
 * Centralizes OpenRouter API calls and logs provider-reported billed cost.
 * Supports text (LLM), image generation, and embedding calls.
 */

import { getDb } from "../db";
import { aiCostLog } from "../../drizzle/schema";
import { logSafeError } from "../_core/safeLog";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1";

export function readProviderCost(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

async function logCost(params: {
  feature: string;
  callType: "text" | "image" | "embedding";
  model: string;
  tokensIn?: number;
  tokensOut?: number;
  imageCount?: number;
  providerCostUsd?: unknown;
  referenceId?: number;
  referenceType?: string;
}) {
  try {
    const providerCostUsd = readProviderCost(params.providerCostUsd);
    if (providerCostUsd === null) {
      // Never turn missing or stale pricing into a false $0 record. OpenRouter
      // non-streaming responses normally include usage.cost; an absent value is
      // an observability gap, not proof that the request was free.
      logSafeError(
        "ai_cost.provider_cost_unavailable",
        new Error("Provider response omitted billed cost"),
      );
      return;
    }
    const db = await getDb();
    if (!db) return;
    await db.insert(aiCostLog).values({
      feature: params.feature,
      callType: params.callType,
      model: params.model,
      tokensIn: params.tokensIn ?? 0,
      tokensOut: params.tokensOut ?? 0,
      imageCount: params.imageCount ?? 0,
      costUsd: providerCostUsd.toFixed(6),
      referenceId: params.referenceId,
      referenceType: params.referenceType,
    });
  } catch (err) {
    logSafeError("ai_cost.log_failed", err);
  }
}

// ─── Text / LLM call ─────────────────────────────────────────────────────────

export async function callLLM(params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  feature: string;
  referenceId?: number;
  referenceType?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" };
}): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const res = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://breakyoursolarcontract.com",
      "X-Title": "Solar Freedom Search Operations",
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 2000,
      ...(params.responseFormat
        ? { response_format: params.responseFormat }
        : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter LLM request failed (HTTP ${res.status})`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  const tokensIn = data.usage?.prompt_tokens ?? 0;
  const tokensOut = data.usage?.completion_tokens ?? 0;

  await logCost({
    feature: params.feature,
    callType: "text",
    model: params.model,
    tokensIn,
    tokensOut,
    providerCostUsd: data.usage?.cost,
    referenceId: params.referenceId,
    referenceType: params.referenceType,
  });

  return content;
}

// ─── Image generation call ───────────────────────────────────────────────────

export async function callImageGen(params: {
  model: string;
  prompt: string;
  feature: string;
  referenceId?: number;
  referenceType?: string;
  width?: number;
  height?: number;
}): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const res = await fetch(`${OPENROUTER_API_URL}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://breakyoursolarcontract.com",
      "X-Title": "Solar Freedom Search Operations",
    },
    body: JSON.stringify({
      model: params.model,
      prompt: params.prompt,
      n: 1,
      size: `${params.width ?? 1024}x${params.height ?? 1024}`,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter image request failed (HTTP ${res.status})`);
  }

  const data = await res.json();
  const imageUrl = data.data?.[0]?.url ?? data.data?.[0]?.b64_json ?? "";

  await logCost({
    feature: params.feature,
    callType: "image",
    model: params.model,
    imageCount: 1,
    providerCostUsd: data.usage?.cost,
    referenceId: params.referenceId,
    referenceType: params.referenceType,
  });

  return imageUrl;
}

// ─── Embedding call ──────────────────────────────────────────────────────────

export async function callEmbedding(params: {
  model: string;
  input: string | string[];
  feature: string;
  referenceId?: number;
  referenceType?: string;
}): Promise<number[][]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const inputs = Array.isArray(params.input) ? params.input : [params.input];

  const res = await fetch(`${OPENROUTER_API_URL}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://breakyoursolarcontract.com",
      "X-Title": "Solar Freedom Search Operations",
    },
    body: JSON.stringify({
      model: params.model,
      input: inputs,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter embedding request failed (HTTP ${res.status})`);
  }

  const data = await res.json();
  const embeddings: number[][] = data.data?.map((d: any) => d.embedding) ?? [];
  const tokensIn = data.usage?.prompt_tokens ?? inputs.join(" ").split(" ").length;

  await logCost({
    feature: params.feature,
    callType: "embedding",
    model: params.model,
    tokensIn,
    providerCostUsd: data.usage?.cost,
    referenceId: params.referenceId,
    referenceType: params.referenceType,
  });

  return embeddings;
}
