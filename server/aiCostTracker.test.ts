import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  logSafeError: vi.fn(),
}));

vi.mock("./db", () => ({ getDb: mocks.getDb }));
vi.mock("./_core/safeLog", () => ({ logSafeError: mocks.logSafeError }));

import { callLLM, readProviderCost } from "./cron/aiCostTracker";

const originalApiKey = process.env.OPENROUTER_API_KEY;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.OPENROUTER_API_KEY = "test-key";
  mocks.getDb.mockResolvedValue(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalApiKey === undefined) delete process.env.OPENROUTER_API_KEY;
  else process.env.OPENROUTER_API_KEY = originalApiKey;
});

describe("provider-reported AI cost", () => {
  it("accepts finite non-negative provider usage cost", () => {
    expect(readProviderCost(0)).toBe(0);
    expect(readProviderCost(0.00014)).toBe(0.00014);
  });

  it("does not turn absent, malformed, or negative cost into a false zero", () => {
    expect(readProviderCost(undefined)).toBeNull();
    expect(readProviderCost("0.00014")).toBeNull();
    expect(readProviderCost(Number.NaN)).toBeNull();
    expect(readProviderCost(Number.POSITIVE_INFINITY)).toBeNull();
    expect(readProviderCost(-0.01)).toBeNull();
  });
});

describe("tracked OpenRouter text calls", () => {
  it("passes JSON response format through and returns generated content", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: '{"headline":"Draft"}' } }],
        usage: { prompt_tokens: 12, completion_tokens: 4, cost: 0.00014 },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const content = await callLLM({
      model: "openrouter/free",
      messages: [{ role: "user", content: "Draft it" }],
      feature: "press_release_draft",
      responseFormat: { type: "json_object" },
      maxTokens: 321,
    });

    expect(content).toBe('{"headline":"Draft"}');
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(request.body));
    expect(body).toMatchObject({
      model: "openrouter/free",
      max_tokens: 321,
      response_format: { type: "json_object" },
    });
  });

  it("stores the provider-reported cost and usage without estimating it", async () => {
    const values = vi.fn().mockResolvedValue(undefined);
    mocks.getDb.mockResolvedValue({
      insert: vi.fn(() => ({ values })),
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: "Draft" } }],
        usage: { prompt_tokens: 40, completion_tokens: 10, cost: 0.0001467 },
      }),
    }));

    await callLLM({
      model: "test/model",
      messages: [{ role: "user", content: "Draft it" }],
      feature: "blog_studio",
      referenceId: 7,
      referenceType: "blog_post",
    });

    expect(values).toHaveBeenCalledWith(expect.objectContaining({
      feature: "blog_studio",
      model: "test/model",
      tokensIn: 40,
      tokensOut: 10,
      costUsd: "0.000147",
      referenceId: 7,
      referenceType: "blog_post",
    }));
  });

  it("does not create a misleading zero-cost record when usage.cost is absent", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: "Draft" } }],
        usage: { prompt_tokens: 8, completion_tokens: 2 },
      }),
    }));

    await callLLM({
      model: "test/model",
      messages: [{ role: "user", content: "Draft it" }],
      feature: "blog_studio",
    });

    expect(mocks.getDb).not.toHaveBeenCalled();
    expect(mocks.logSafeError).toHaveBeenCalledWith(
      "ai_cost.provider_cost_unavailable",
      expect.any(Error),
    );
  });

  it("exposes only the upstream status when OpenRouter rejects a request", async () => {
    const text = vi.fn(() => {
      throw new Error("provider body must not be read");
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text,
    }));

    await expect(callLLM({
      model: "test/model",
      messages: [{ role: "user", content: "Draft it" }],
      feature: "blog_studio",
    })).rejects.toThrow("OpenRouter LLM request failed (HTTP 429)");
    expect(text).not.toHaveBeenCalled();
  });
});
