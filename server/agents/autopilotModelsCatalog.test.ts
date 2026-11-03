import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("../_core/env", () => ({ ENV: { forgeApiKey: "" } }));
import { AVAILABLE_MODELS, applyOpenRouterMetadata, estimateOpenRouterCost, getAvailableModels, MODEL_CATALOG_TTL_MS } from "./openRouterCatalog";

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("autopilot model catalog metadata", () => {
  it("retains both verified exact IDs even before any catalog GET and exposes per-million units", () => {
    const deepseek = AVAILABLE_MODELS.find(m => m.id === "deepseek/deepseek-v4.1-flash")!;
    const argon = AVAILABLE_MODELS.find(m => m.id === "google/gemini-4-argon")!;
    expect(deepseek).toMatchObject({ costPer1MIn: 0.035, costPer1MOut: 0.5, priceUnit: "USD/1M tokens", metadataSource: "endpoint-cache", contextLength: 1048576 });
    expect(argon).toMatchObject({ costPer1MIn: 2, costPer1MOut: 10, priceUnit: "USD/1M tokens", metadataSource: "endpoint-cache" });
    expect(argon.inputModalities).toContain("video");
    expect(deepseek.supportedParameters).toContain("tools");
  });

  it("converts OpenRouter per-token prices once and uses a paired regular-tier provider quote", () => {
    const model = { ...AVAILABLE_MODELS.find(m => m.id === "google/gemini-4-argon")! };
    const accepted = applyOpenRouterMetadata(model, {
      id: model.id, endpoints: [
        { status: 0, service_tier: "flex", pricing: { prompt: "0.000001", completion: "0.000005" } },
        { status: 0, pricing: { prompt: "0.000002", completion: "0.00001", discount: 0.5 }, context_length: 1048576 },
        { status: 0, pricing: { prompt: "0.000003", completion: "0.000008" } },
        { status: 1, pricing: { prompt: "0", completion: "0" } },
      ],
    }, "live-endpoints");
    expect(accepted).toBe(true);
    expect(model).toMatchObject({ costIn: 2, costOut: 10, pricingStatus: "estimate", metadataSource: "live-endpoints" });
    expect(model.priceRange).toEqual({ inputMin: 2, inputMax: 3, outputMin: 8, outputMax: 10 });
    expect(estimateOpenRouterCost(model.id, { promptTokens: 1_000_000, completionTokens: 1_000_000 })).toBe(12);
  });

  it("rejects wrong model or inactive endpoint metadata", () => {
    const model = { ...AVAILABLE_MODELS[0] };
    expect(applyOpenRouterMetadata(model, { id: "wrong-id", pricing: { prompt: "0", completion: "0" } }, "live-catalog")).toBe(false);
    expect(applyOpenRouterMetadata(model, { id: model.id, endpoints: [{ status: 1, pricing: { prompt: "0", completion: "0" } }] }, "live-endpoints")).toBe(false);
  });

  it("does not invent free prices when metadata is missing, and prefers actual provider costs", () => {
    const model = { ...AVAILABLE_MODELS.find(m => m.id === "gpt-5-mini")! };
    expect(model).toMatchObject({ costIn: null, costOut: null, pricingStatus: "unverified" });
    expect(estimateOpenRouterCost("unknown/model", { promptTokens: 10, completionTokens: 20 })).toBeUndefined();
    expect(estimateOpenRouterCost("unknown/model", { promptTokens: 10, completionTokens: 20, costUsd: 0.007 })).toBe(0.007);
    expect(estimateOpenRouterCost("unknown/model", { promptTokens: 10, completionTokens: 20, costUsd: 0 })).toBe(0);
  });

  it("uses per-model endpoint GET fallback for aggregate omissions and deduplicates refreshes for TTL", async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith("/api/v1/models")) return new Response(JSON.stringify({ data: [] }));
      const id = url.includes("deepseek/") ? "deepseek/deepseek-v4.1-flash" : "google/gemini-4-argon";
      return new Response(JSON.stringify({ data: { id, endpoints: [{ status: 0, pricing: { prompt: "0.000002", completion: "0.00001" }, context_length: 1048576 }] } }));
    });
    vi.stubGlobal("fetch", fetchMock);
    const [first, second] = await Promise.all([getAvailableModels(), getAvailableModels()]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(first.find(m => m.id === "google/gemini-4-argon")).toMatchObject({ metadataSource: "live-endpoints", costIn: 2 });
    expect(second.length).toBe(first.length);
    await getAvailableModels();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(MODEL_CATALOG_TTL_MS).toBe(300_000);
  });

  it("bounds unresponsive metadata fetches and retains known IDs as cached estimates", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + MODEL_CATALOG_TTL_MS + 1);
    let signal: AbortSignal | undefined;
    vi.stubGlobal("fetch", vi.fn().mockImplementation((_url, options) => { signal = options.signal; return new Promise(() => undefined); }));
    const pending = getAvailableModels();
    await vi.advanceTimersByTimeAsync(5000);
    const catalog = await pending;
    expect(signal?.aborted).toBe(true);
    expect(catalog.find(m => m.id === "google/gemini-4-argon")).toMatchObject({ metadataSource: "stale-cache", pricingStatus: "estimate" });
    expect(vi.getTimerCount()).toBe(0);
  });
});
