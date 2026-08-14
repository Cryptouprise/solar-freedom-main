import { describe, expect, it } from "vitest";
import { withTimeout } from "./agentLLM";

describe("agent LLM timeout guard", () => {
  it("returns a completed operation before the deadline", async () => {
    await expect(withTimeout(Promise.resolve("ready"), 50, "test operation")).resolves.toBe("ready");
  });

  it("fails a stalled operation with an actionable timeout", async () => {
    const never = new Promise<never>(() => undefined);
    await expect(withTimeout(never, 5, "test operation")).rejects.toThrow("test operation timed out after 0s");
  });
});
