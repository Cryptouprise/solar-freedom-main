import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ invokeLLM: vi.fn(), getDb: vi.fn() }));
vi.mock("../_core/llm", () => ({ invokeLLM: mocks.invokeLLM }));
vi.mock("../db", () => ({ getDb: mocks.getDb }));
vi.mock("../_core/env", () => ({ ENV: { openRouterApiKey: "test-key" } }));
import { AGENT_DEFAULT_MODELS, AVAILABLE_MODELS, callAgentLLM, FALLBACK_MODEL, OPENROUTER_MODELS, seedDefaultModelConfigs } from "./agentLLM";

const messages = [{ role: "user" as const, content: "Test fixture" }];
const completion = (model: string, content: unknown = "Valid output", finish = "stop", usage: object = {}) => ({
  model, choices: [{ message: { content }, finish_reason: finish }],
  usage: { prompt_tokens: 10, completion_tokens: 20, ...usage },
});
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getDb.mockResolvedValue(null);
  mocks.invokeLLM.mockImplementation(async (params: any) => completion(params.model));
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("autopilot explicit model routing", () => {
  it("passes the resolved built-in model AND camelCase maxTokens to invokeLLM", async () => {
    const result = await callAgentLLM({ modelOverride: "gpt-5", messages, maxTokens: 1600 });
    expect(mocks.invokeLLM).toHaveBeenCalledWith(expect.objectContaining({ model: "gpt-5", maxTokens: 1600 }));
    expect(mocks.invokeLLM.mock.calls[0][0]).not.toHaveProperty("max_tokens");
    expect(result.modelId).toBe("gpt-5");
  });

  it("bounds omitted maxTokens instead of allowing the core 32768-token default", async () => {
    await callAgentLLM({ messages });
    expect(mocks.invokeLLM).toHaveBeenCalledWith(expect.objectContaining({ model: FALLBACK_MODEL, maxTokens: 4000 }));
  });

  it("uses the actual fallback model and never reuses the OpenRouter override", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ error: "denied" }, 403));
    vi.stubGlobal("fetch", fetchMock);
    const result = await callAgentLLM({ modelOverride: "deepseek/deepseek-v4.1-flash", messages });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mocks.invokeLLM).toHaveBeenCalledWith(expect.objectContaining({ model: FALLBACK_MODEL }));
    expect(result).toMatchObject({ modelId: FALLBACK_MODEL, requestedModelId: FALLBACK_MODEL, fallbackFrom: "deepseek/deepseek-v4.1-flash" });
  });

  it("preserves the provider-reported response model rather than mislabeling it", async () => {
    mocks.invokeLLM.mockResolvedValue(completion("gpt-5-mini-provider-version"));
    const result = await callAgentLLM({ modelOverride: "gpt-5-mini", messages });
    expect(result.modelId).toBe("gpt-5-mini-provider-version");
    expect(result.requestedModelId).toBe("gpt-5-mini");
  });

  it("lets critical callers fail closed on a 403 without retry or fallback", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ error: "denied" }, 403)));
    await expect(callAgentLLM({ modelOverride: "google/gemini-4-argon", messages, allowFallback: false })).rejects.toThrow("403");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(mocks.invokeLLM).not.toHaveBeenCalled();
  });

  it.each(["deepseek/deepseek-v4.1-flash", "google/gemini-4-argon"])("routes exact ID %s to OpenRouter and includes actual usage.cost", async modelId => {
    const fetchMock = vi.fn().mockResolvedValue(response(completion(modelId, "OK", "stop", { cost: 0.0123 })));
    vi.stubGlobal("fetch", fetchMock);
    expect(OPENROUTER_MODELS.has(modelId)).toBe(true);
    expect(AVAILABLE_MODELS.find(m => m.id === modelId)).toMatchObject({ route: "openrouter" });
    const result = await callAgentLLM({ modelOverride: modelId, messages, maxTokens: 1600 });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ model: modelId, max_tokens: 1600 });
    expect(result).toMatchObject({ modelId, costUsd: 0.0123, costSource: "provider", usage: { costUsd: 0.0123 } });
    expect(mocks.invokeLLM).not.toHaveBeenCalled();
  });
});

describe("autopilot response quality gates", () => {
  it.each([null, "", "   ", [], [{ type: "image_url", image_url: { url: "x" } }]])("rejects empty built-in content %j", async content => {
    mocks.invokeLLM.mockResolvedValue(completion("gpt-5-mini", content));
    await expect(callAgentLLM({ messages })).rejects.toThrow("empty content");
  });
  it.each(["length", "max_tokens", "content_filter", "error"])("rejects partial built-in response with finish_reason=%s", async finish => {
    mocks.invokeLLM.mockResolvedValue(completion("gpt-5-mini", "Partial answer", finish));
    await expect(callAgentLLM({ messages })).rejects.toThrow("incomplete");
  });
  it("rejects truncated OpenRouter output without a success receipt", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(completion("deepseek/deepseek-v4.1-flash", "Partial", "length"))));
    await expect(callAgentLLM({ modelOverride: "deepseek/deepseek-v4.1-flash", executionMode: "scheduled", messages, allowFallback: false })).rejects.toThrow("incomplete");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("allows valid tool calls with null text", async () => {
    mocks.invokeLLM.mockResolvedValue({ model: "gpt-5-mini", choices: [{ finish_reason: "tool_calls", message: { content: null, tool_calls: [{ function: { name: "lookup", arguments: '{"id":1}' } }] } }] });
    const result = await callAgentLLM({ messages });
    expect(result.content).toBe("");
    expect(result.toolCalls).toEqual([{ name: "lookup", arguments: { id: 1 } }]);
  });
});

describe("autopilot shared total deadline", () => {
  it("gives fallback only remaining time, rather than a fresh timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(response({ error: "denied" }, 403)), 800))));
    mocks.invokeLLM.mockImplementation(() => new Promise(() => undefined));
    const call = callAgentLLM({ modelOverride: "deepseek/deepseek-v4.1-flash", messages, totalTimeoutMs: 1000 });
    const assertion = expect(call).rejects.toThrow("timed out");
    await vi.advanceTimersByTimeAsync(800);
    expect(mocks.invokeLLM).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(199);
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });

  it("aborts an OpenRouter stall at the deadline and does not start fallback", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    vi.stubGlobal("fetch", vi.fn().mockImplementation((_url, options) => { signal = options.signal; return new Promise(() => undefined); }));
    const call = callAgentLLM({ modelOverride: "google/gemini-4-argon", messages, totalTimeoutMs: 100 });
    const assertion = expect(call).rejects.toThrow("deadline exhausted");
    await vi.advanceTimersByTimeAsync(100);
    await assertion;
    expect(signal?.aborted).toBe(true);
    expect(mocks.invokeLLM).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("keeps one scheduled attempt and a role-aware budget only with an explicit total budget", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise(() => undefined)));
    mocks.invokeLLM.mockImplementation(() => new Promise(() => undefined));
    const call = callAgentLLM({ agentSlug: "content", modelOverride: "deepseek/deepseek-v4.1-flash", executionMode: "scheduled", totalTimeoutMs: 82_000, messages });
    const assertion = expect(call).rejects.toThrow("timed out");
    await vi.advanceTimersByTimeAsync(69_999);
    expect(mocks.invokeLLM).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(mocks.invokeLLM).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(12_000);
    await assertion;
  });

  it.each([0, -1, NaN, Infinity])("rejects invalid total budget %s without paid calls", async totalTimeoutMs => {
    await expect(callAgentLLM({ messages, totalTimeoutMs })).rejects.toThrow("finite positive");
    expect(mocks.invokeLLM).not.toHaveBeenCalled();
  });
});

it("seeds missing defaults atomically while preserving saved critical config on conflict", async () => {
  const critical = { agentSlug: "manager", modelId: "gpt-5", modelLabel: "Critical override", updatedAt: new Date(1) };
  const rows = new Map<string, object>([["manager", critical]]);
  const values = vi.fn(async (row: any) => { if (!rows.has(row.agentSlug)) rows.set(row.agentSlug, row); });
  const ignore = vi.fn(() => ({ values }));
  const onDuplicateKeyUpdate = vi.fn();
  mocks.getDb.mockResolvedValue({ insert: vi.fn(() => ({ ignore, onDuplicateKeyUpdate })) });
  await seedDefaultModelConfigs();
  expect(ignore).toHaveBeenCalledTimes(Object.keys(AGENT_DEFAULT_MODELS).length);
  expect(rows.get("manager")).toBe(critical);
  expect(rows.size).toBe(Object.keys(AGENT_DEFAULT_MODELS).length);
  expect(onDuplicateKeyUpdate).not.toHaveBeenCalled();
});
