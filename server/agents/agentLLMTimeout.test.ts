import { describe, expect, it } from "vitest";
import { resolveAgentTimeoutProfile, withTimeout } from "./agentLLM";

describe("agent LLM timeout guard", () => {
  it("returns a completed operation before the deadline", async () => {
    await expect(withTimeout(Promise.resolve("ready"), 50, "test operation")).resolves.toBe("ready");
  });

  it("fails a stalled operation with an actionable timeout", async () => {
    const never = new Promise<never>(() => undefined);
    await expect(withTimeout(never, 5, "test operation")).rejects.toThrow("test operation timed out after 0s");
  });

  it("uses a single bounded provider attempt for scheduled callbacks", () => {
    expect(resolveAgentTimeoutProfile("scheduled")).toEqual({
      openRouterAttemptTimeoutMs: 18_000,
      builtInAttemptTimeoutMs: 24_000,
      maxOpenRouterAttempts: 1,
    });
  });
});
