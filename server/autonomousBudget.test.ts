import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), invokeLLM: vi.fn() }));
vi.mock("./db", () => ({ getDb: mocks.getDb }));
vi.mock("./_core/llm", () => ({ invokeLLM: mocks.invokeLLM }));
vi.mock("./_core/env", () => ({ ENV: { openRouterApiKey: "test-key" } }));
vi.mock("./agents/agentGoalEngine", () => ({
  getTodaysGoals: vi.fn(async () => []), getAllMemory: vi.fn(async () => ({})),
  getLessons: vi.fn(async () => []), formatLessonsForContext: vi.fn(() => ""),
  formatGoalsForContext: vi.fn(() => ""), recordOutcome: vi.fn(async () => undefined),
  setMemory: vi.fn(async () => undefined), addLesson: vi.fn(async () => undefined),
}));

import { getAutonomousInvocation, remainingAutonomousBudgetMs, withAutonomousBudget } from "./autonomousBudget";
import { callAgentLLM } from "./agents/agentLLM";
import { agentLLM, completeRun, startRun, type AgentRunContext } from "./agents/engine";
import { AUTONOMOUS_REVENUE_PLAN_LIMIT, AUTONOMOUS_REVENUE_PREDICTION_LIMIT, modelPageMetrics, predictActions, runRevenueIntelAgent, selectAutonomousRevenuePlans } from "./agents/revenueIntelAgent";
import { agentActions, agentChatThreads, agentModelConfig, agentRunLog, agents, blogDrafts, revenueIntelPredictions, revenueIntelRuns, seoPages } from "../drizzle/schema";

const messages = [{ role: "user" as const, content: "Fixture, never a live request" }];
const completion = (content = "Valid output", model = "google/gemini-4-argon") => ({
  model, choices: [{ finish_reason: "stop", message: { content } }],
});
const invocation = (ms = 24_000) => ({ jobId: 1, deadlineAt: Date.now() + ms });
const context = (): AgentRunContext => ({ agentSlug: "seo_intel", runId: 1, triggerType: "cron", triggeredBy: "test",
  startedAt: Date.now(), tokensIn: 0, tokensOut: 0, costUsd: 0, llmCalls: 0, actionsCreated: 0,
  messagesCreated: 0, costSource: "unavailable" });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getDb.mockResolvedValue(null);
  mocks.invokeLLM.mockResolvedValue(completion());
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("autonomous request budget", () => {
  it("sends the verified Qwen non-reasoning override without a second call or hidden fallback", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(completion("Complete short section", "qwen/qwen3.7-flash")))));
    await withAutonomousBudget(invocation(), () => callAgentLLM({ agentSlug: "content", modelOverride: "qwen/qwen3.7-flash", maxTokens: 1000,
      openRouterReasoning: { enabled: false }, messages }));
    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(body.reasoning).toEqual({ enabled: false }); expect(body.max_tokens).toBe(1000); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("reserves DB time and isolates invocation state from manual work", async () => {
    vi.useFakeTimers();
    expect(getAutonomousInvocation()).toBeUndefined();
    await withAutonomousBudget(invocation(), async () => {
      expect(remainingAutonomousBudgetMs(8_000)).toBe(16_000);
      await vi.advanceTimersByTimeAsync(1_000);
      expect(remainingAutonomousBudgetMs(8_000)).toBe(15_000);
    });
    expect(remainingAutonomousBudgetMs()).toBeUndefined();
  });

  it("aborts at 16 seconds with no retry or fallback even in standard mode", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    vi.stubGlobal("fetch", vi.fn((_url, options) => { signal = options.signal; return new Promise(() => undefined); }));
    const work = withAutonomousBudget(invocation(), () => callAgentLLM({
      agentSlug: "content", modelOverride: "qwen/qwen3.7-flash", executionMode: "standard", allowFallback: true, messages,
    }));
    const assertion = expect(work).rejects.toThrow("timed out");
    await vi.advanceTimersByTimeAsync(15_999);
    expect(signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await assertion;
    expect(signal?.aborted).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(mocks.invokeLLM).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("uses only the remaining time minus the DB reserve for built-in models", async () => {
    vi.useFakeTimers();
    mocks.invokeLLM.mockImplementation(() => new Promise(() => undefined));
    const work = withAutonomousBudget(invocation(13_000), () => callAgentLLM({ modelOverride: "gpt-5-mini", totalTimeoutMs: 80_000, messages }));
    const assertion = expect(work).rejects.toThrow("timed out");
    await vi.advanceTimersByTimeAsync(5_000);
    await assertion;
    expect(mocks.invokeLLM).toHaveBeenCalledTimes(1);
    expect(mocks.invokeLLM.mock.calls[0][0].signal.aborted).toBe(true);
  });

  it("rejects an exhausted invocation without a lookup or paid call", async () => {
    await expect(withAutonomousBudget(invocation(8_500), () => callAgentLLM({ agentSlug: "seo_intel", messages }))).rejects.toThrow("reserved");
    expect(mocks.getDb).not.toHaveBeenCalled();
    expect(mocks.invokeLLM).not.toHaveBeenCalled();
  });

  it("rejects a second call after provider failure rather than trying another model", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("unavailable", { status: 503 })));
    await withAutonomousBudget(invocation(), async () => {
      await expect(callAgentLLM({ modelOverride: "deepseek/deepseek-v4.1-flash", allowFallback: true, messages })).rejects.toThrow("503");
      await expect(callAgentLLM({ modelOverride: "gpt-5-mini", messages })).rejects.toThrow("only one LLM call");
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(mocks.invokeLLM).not.toHaveBeenCalled();
  });

  it("reserves the single call synchronously across concurrent/nested roles", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(completion()))));
    const results = await withAutonomousBudget(invocation(), () => Promise.allSettled([
      callAgentLLM({ agentSlug: "seo_intel", messages }),
      callAgentLLM({ agentSlug: "manager", messages }),
    ]));
    expect(results.map(result => result.status)).toEqual(["fulfilled", "rejected"]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(mocks.invokeLLM).not.toHaveBeenCalled();
    // The same durable job can retry in a NEW request-local invocation.
    await withAutonomousBudget(invocation(), () => callAgentLLM({ agentSlug: "seo_intel", messages }));
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("preserves configured SEO selection first and never falls through to GPT", async () => {
    mocks.getDb.mockResolvedValue({ select: () => ({ from: () => ({ where: () => ({ limit: async () => [{ modelId: "deepseek/deepseek-v4.1-flash" }] }) }) }) });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("denied", { status: 403 })));
    await expect(withAutonomousBudget(invocation(), () => callAgentLLM({ agentSlug: "seo_intel", allowFallback: true, messages }))).rejects.toThrow("403");
    expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string).model).toBe("deepseek/deepseek-v4.1-flash");
    expect(mocks.invokeLLM).not.toHaveBeenCalled();
  });

  it("rejects forbidden SEO model overrides before any provider call", async () => {
    vi.stubGlobal("fetch", vi.fn());
    await expect(withAutonomousBudget(invocation(), () => callAgentLLM({ agentSlug: "seo_intel", modelOverride: "gpt-5-mini", messages }))).rejects.toThrow("Owner model policy");
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.invokeLLM).not.toHaveBeenCalled();
  });

  it("engine counts the attempt, preserves unknown cost, and labels static financial assumptions", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(completion()))));
    const ctx = context();
    await withAutonomousBudget(invocation(), async () => {
      await agentLLM({ agentSlug: "seo_intel", context: ctx, messages });
      await expect(agentLLM({ agentSlug: "seo_intel", context: ctx, messages })).rejects.toThrow("only one LLM call");
    });
    expect(ctx.llmCalls).toBe(1);
    expect(ctx.costSource).toBe("unavailable");
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    expect(body.messages.at(-1).content).toContain("unverified assumptions, not current facts");
  });
});

function fakeDb(pages: object[] = [], affectedRows = 1) {
  const inserts: Array<{ table: unknown; value: any }> = [];
  const updates: Array<{ table: unknown; value: any; where?: unknown }> = [];
  let id = 1;
  const db = {
    select: vi.fn(() => ({ from: (table: unknown) => {
      const rows = table === seoPages ? pages : table === agentModelConfig ? [{ modelId: "deepseek/deepseek-v4-pro" }] : [];
      const chain: any = { then: (resolve: (value: object[]) => unknown) => Promise.resolve(rows).then(resolve),
        where: () => chain, orderBy: () => chain, limit: async () => rows };
      return chain;
    } })),
    update: vi.fn((table: unknown) => ({ set: (value: object) => ({ where: async (where: unknown) => {
      updates.push({ table, value, where }); return [{ affectedRows }];
    } }) })),
    insert: vi.fn((table: unknown) => ({ values: (value: object) => {
      inserts.push({ table, value });
      const insertId = id++;
      return { then: (resolve: (value: unknown) => unknown) => Promise.resolve([{ insertId }, {}]).then(resolve),
        $returningId: async () => [{ id: insertId }] };
    } })),
  };
  return { db, inserts, updates };
}

describe("bounded run receipts", () => {
  it("inherits the invocation deadline, not a fresh 90-second run budget", async () => {
    const { db } = fakeDb(); mocks.getDb.mockResolvedValue(db);
    const tick = invocation();
    const ctx = await withAutonomousBudget(tick, () => startRun("manager", "cron", "test"));
    expect(ctx.deadlineAt).toBe(tick.deadlineAt);
    expect(ctx.claimedAt).toBeInstanceOf(Date);
  });

  it("honors a busy claim and creates no replacement run receipt", async () => {
    const { db, inserts } = fakeDb([], 0); mocks.getDb.mockResolvedValue(db);
    await expect(withAutonomousBudget(invocation(), () => startRun("manager", "cron", "test"))).rejects.toThrow("another run is already active");
    expect(inserts).toHaveLength(0);
  });

  it("does not release an agent or write a success thread for a stale run ID", async () => {
    const { db, inserts, updates } = fakeDb([], 0); mocks.getDb.mockResolvedValue(db);
    const receipt = await completeRun(context(), "late completion");
    expect(receipt.status).toBe("failed");
    expect(updates.filter(row => row.table === agents)).toHaveLength(0);
    expect(inserts.filter(row => row.table === agentChatThreads)).toHaveLength(0);
  });

  it("records unknown cost as null, not zero", async () => {
    const { db, updates } = fakeDb(); mocks.getDb.mockResolvedValue(db);
    await completeRun(context(), "No work");
    expect(updates.find(row => row.table === agentRunLog)?.value.costUsd).toBeNull();
  });
});

describe("autonomous revenue planning limits", () => {
  it("caps plans at three unique supplied targets and refuses invented targets/dollars", () => {
    const candidates = Array.from({ length: 97 }, (_, i) => ({ pageSlug: `/blog/page-${i}`, pageTitle: `Page ${i}`,
      actionType: "title_optimization", actionDetail: "Optimize title", predictedClicksGain: 2,
      predictedLeadsGain: 0.1, predictedRevenueGain: 11, confidenceScore: 68, reasoning: "Scenario" }));
    const plans = [{ pageSlug: "/blog/invented", actionType: "title_optimization", specificChange: "Invented", priority: "auto_execute" },
      ...candidates.map(item => ({ ...item, specificChange: "Useful title", priority: "auto_execute", predictedRevenueGain: 9_999_999 }))];
    const selected = selectAutonomousRevenuePlans(plans, candidates);
    expect(selected).toHaveLength(AUTONOMOUS_REVENUE_PLAN_LIMIT);
    expect(selected.every(item => item.predictedRevenueGain === 11 && item.reasoning.includes("unverified assumptions"))).toBe(true);
    expect(selected.some(item => item.pageSlug === "/blog/invented")).toBe(false);
  });

  it("saves at most five predictions and three queued plans with one LLM and no draft execution", async () => {
    const pages = Array.from({ length: 12 }, (_, i) => ({ slug: `/blog/test-${i}`, title: `Test ${i}`, pageType: "blog",
      gscClicks: 100, gscImpressions: 1_000, gscAvgPosition: "12.0" }));
    const supported = new Set(["title_optimization", "meta_rewrite", "faq_addition", "interlink_injection"]);
    const all = pages.flatMap(page => predictActions(modelPageMetrics(page as any))).sort((a, b) =>
      Number(supported.has(b.actionType)) - Number(supported.has(a.actionType)) || b.predictedRevenueGain - a.predictedRevenueGain);
    const plans = all.slice(0, AUTONOMOUS_REVENUE_PREDICTION_LIMIT).map(item => ({ ...item, specificChange: "Make a verified metadata improvement", priority: "auto_execute" }));
    const { db, inserts, updates } = fakeDb(pages); mocks.getDb.mockResolvedValue(db);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(completion(JSON.stringify({ executionPlan: plans, topInsight: "Scenario only", lessons: [] }), "deepseek/deepseek-v4-pro")))));
    const result = await withAutonomousBudget(invocation(), () => runRevenueIntelAgent("cron", "test"));
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(mocks.invokeLLM).not.toHaveBeenCalled();
    expect(inserts.filter(row => row.table === revenueIntelPredictions)).toHaveLength(AUTONOMOUS_REVENUE_PREDICTION_LIMIT);
    const queued = inserts.filter(row => row.table === agentActions);
    expect(queued).toHaveLength(AUTONOMOUS_REVENUE_PLAN_LIMIT);
    expect(queued.every(row => row.value.status === "queued")).toBe(true);
    expect(queued.every(row => supported.has(row.value.actionType) && row.value.costUsd === null)).toBe(true);
    expect(queued.every(row => JSON.parse(row.value.payload).impactBasis === "unverified_scenario")).toBe(true);
    expect(inserts.filter(row => row.table === blogDrafts)).toHaveLength(0);
    expect(updates.find(row => row.table === revenueIntelRuns)?.value.actionsExecuted).toBe(0);
    expect(result.summary).toContain("no public changes or measured revenue gain claimed");
    expect(result.runId).toBeGreaterThan(0);
  });
});
