import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("./_core/env", () => ({ ENV: { forgeApiUrl: "https://example.invalid", forgeApiKey: "test-only-token" } }));
import { invokeLLM } from "./_core/llm";
afterEach(() => vi.unstubAllGlobals());
function capture() {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ model: "test", choices: [{ message: { content: "ok" }, finish_reason: "stop" }] }) });
  vi.stubGlobal("fetch", fetcher);
  return fetcher;
}
describe("scheduled core LLM request contract", () => {
  it("uses GPT completion cap and forwards explicit low reasoning and AbortSignal", async () => {
    const fetcher = capture(); const controller = new AbortController();
    await invokeLLM({ model: "gpt-5-mini", messages: [{ role: "user", content: "A mocked test; no provider call." }], maxTokens: 4096, reasoning: { effort: "low" }, signal: controller.signal });
    const body = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(body.model).toBe("gpt-5-mini"); expect(body.max_completion_tokens).toBe(4096); expect(body.max_tokens).toBeUndefined();
    expect(body.reasoning).toEqual({ effort: "low" }); expect(fetcher.mock.calls[0][1].signal).toBe(controller.signal);
  });
  it("uses Gemini max_tokens, never GPT max_completion_tokens", async () => {
    const fetcher = capture();
    await invokeLLM({ model: "gemini-2.5-flash", messages: [{ role: "user", content: "Mocked test" }], maxTokens: 1234 });
    const body = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(body.max_tokens).toBe(1234); expect(body.max_completion_tokens).toBeUndefined(); expect(body.reasoning).toBeUndefined();
  });
});
