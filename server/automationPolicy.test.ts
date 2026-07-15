import { describe, expect, it } from "vitest";
import {
  createPromptOnlyReceipt,
  PROMPT_ONLY_POLICY_VERSION,
  summarizePromptOnlyReceipt,
  evaluateAdminAutomationRequest,
} from "./automationPolicy";

describe("prompt-only automation policy", () => {
  it("blocks execution and records zero tool calls or state changes", () => {
    const receipt = createPromptOnlyReceipt({
      automationId: 42,
      taskUid: "cron-task-secret-ish-id",
      spec: "Open GitHub and claim this was fixed.",
      startedAt: new Date("2026-07-12T12:00:00.000Z"),
      completedAt: new Date("2026-07-12T12:00:01.000Z"),
    });

    expect(receipt.outcome).toBe("blocked");
    expect(receipt.mode).toBe("simulation");
    expect(receipt.policyVersion).toBe(PROMPT_ONLY_POLICY_VERSION);
    expect(receipt.toolCalls).toEqual([]);
    expect(receipt.stateChanges).toEqual([]);
    expect(receipt.evidence).toEqual([]);
  });

  it("stores hashes rather than prompt or trigger contents", () => {
    const receipt = createPromptOnlyReceipt({
      automationId: 7,
      taskUid: "private-trigger-id",
      spec: "private prompt contents",
      startedAt: new Date("2026-07-12T12:00:00.000Z"),
      completedAt: new Date("2026-07-12T12:00:00.100Z"),
    });
    const serialized = JSON.stringify(receipt);

    expect(receipt.specSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(receipt.triggerTaskSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(serialized).not.toContain("private prompt contents");
    expect(serialized).not.toContain("private-trigger-id");
    expect(summarizePromptOnlyReceipt(receipt)).toContain("zero tool calls");
  });
});

describe("admin automation mutation policy", () => {
  it("allows reviewable planning but never runtime execution", () => {
    expect(evaluateAdminAutomationRequest(true)).toMatchObject({
      planningAllowed: true,
      executionEnabled: false,
      outcome: "plan_only",
    });
    expect(evaluateAdminAutomationRequest(false)).toMatchObject({
      planningAllowed: false,
      executionEnabled: false,
      outcome: "blocked",
      reasonCode: "DIRECT_RUNTIME_MUTATION_DISABLED",
    });
  });
});
