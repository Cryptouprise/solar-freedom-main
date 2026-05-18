/**
 * AI Cost Tracker
 * Centralizes all OpenRouter API calls and logs cost to aiCostLog table.
 * Supports text (LLM), image generation, and embedding calls.
 *
 * Pricing reference (OpenRouter, May 2026 — update as needed):
 * https://openrouter.ai/models
 */

import { getDb } from "../db";
import { aiCostLog } from "../../drizzle/schema";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1";

// ─── Per-model pricing (USD per 1M tokens or per image) ───────────────────────
// Text models: { inputPer1M, outputPer1M }
// Image models: { perImage }
// Embedding models: { inputPer1M }
// Free models = 0

const MODEL_PRICING: Record<string, { inputPer1M?: number; outputPer1M?: number; perImage?: number }> = {
  // Free text models
  "openrouter/owl-alpha":                    { inputPer1M: 0,      outputPer1M: 0 },
  "qwen/qwen3-8b:free":                      { inputPer1M: 0,      outputPer1M: 0 },
  "google/gemini-flash-1.5:free":            { inputPer1M: 0,      outputPer1M: 0 },
  "meta-llama/llama-3.1-8b-instruct:free":   { inputPer1M: 0,      outputPer1M: 0 },
  "tencent/hunyuan-a13b-instruct:free":      { inputPer1M: 0,      outputPer1M: 0 },
  "deepseek/deepseek-chat-v3-0324:free":     { inputPer1M: 0,      outputPer1M: 0 },

  // Paid text models
  "google/gemini-2.5-flash-preview":         { inputPer1M: 0.15,   outputPer1M: 0.60 },
  "google/gemini-flash-2.0":                 { inputPer1M: 0.10,   outputPer1M: 0.40 },
  "qwen/qwen3-14b":                          { inputPer1M: 0.14,   outputPer1M: 0.14 },
  "anthropic/claude-3-haiku":                { inputPer1M: 0.25,   outputPer1M: 1.25 },

  // Image generation models (cost per image)
  "bytedance-seed/seedream-4.5":             { perImage: 0.025 },
  "google/gemini-3.1-flash-image-preview":   { perImage: 0.020 },
  "google/gemini-2.5-flash-image":           { perImage: 0.020 },

  // Embedding models
  "qwen/qwen3-embedding-8b:nitro":           { inputPer1M: 0.05 },
  "qwen/qwen3-embedding-8b:exacto":          { inputPer1M: 0.05 },
};

function estimateCost(
  model: string,
  type: "text" | "image" | "embedding",
  tokensIn = 0,
  tokensOut = 0,
  imageCount = 0
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;

  if (type === "image" && pricing.perImage) {
    return pricing.perImage * imageCount;
  }

  if ((type === "text" || type === "embedding") && pricing.inputPer1M !== undefined) {
    const inputCost = (tokensIn / 1_000_000) * pricing.inputPer1M;
    const outputCost = pricing.outputPer1M ? (tokensOut / 1_000_000) * pricing.outputPer1M : 0;
    return inputCost + outputCost;
  }

  return 0;
}

async function logCost(params: {
  feature: string;
  callType: "text" | "image" | "embedding";
  model: string;
  tokensIn?: number;
  tokensOut?: number;
  imageCount?: number;
  referenceId?: number;
  referenceType?: string;
}) {
  try {
    const db = await getDb();
    if (!db) return;
    const cost = estimateCost(
      params.model,
      params.callType,
      params.tokensIn ?? 0,
      params.tokensOut ?? 0,
      params.imageCount ?? 0
    );
    await db.insert(aiCostLog).values({
      feature: params.feature,
      callType: params.callType,
      model: params.model,
      tokensIn: params.tokensIn ?? 0,
      tokensOut: params.tokensOut ?? 0,
      imageCount: params.imageCount ?? 0,
      costUsd: cost.toFixed(6),
      referenceId: params.referenceId,
      referenceType: params.referenceType,
    });
  } catch (err) {
    console.error("[CostTracker] Failed to log cost:", err);
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
}): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const res = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://breakyoursolarcontract.com",
      "X-Title": "Solar Freedom Press Release Engine",
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 2000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter LLM error ${res.status}: ${err}`);
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
      "X-Title": "Solar Freedom Press Release Engine",
    },
    body: JSON.stringify({
      model: params.model,
      prompt: params.prompt,
      n: 1,
      size: `${params.width ?? 1024}x${params.height ?? 1024}`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter Image error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const imageUrl = data.data?.[0]?.url ?? data.data?.[0]?.b64_json ?? "";

  await logCost({
    feature: params.feature,
    callType: "image",
    model: params.model,
    imageCount: 1,
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
      "X-Title": "Solar Freedom Press Release Engine",
    },
    body: JSON.stringify({
      model: params.model,
      input: inputs,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter Embedding error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const embeddings: number[][] = data.data?.map((d: any) => d.embedding) ?? [];
  const tokensIn = data.usage?.prompt_tokens ?? inputs.join(" ").split(" ").length;

  await logCost({
    feature: params.feature,
    callType: "embedding",
    model: params.model,
    tokensIn,
    referenceId: params.referenceId,
    referenceType: params.referenceType,
  });

  return embeddings;
}

// ─── Cost query helpers ───────────────────────────────────────────────────────

export { estimateCost, MODEL_PRICING };
