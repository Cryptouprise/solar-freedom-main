import { describe, expect, it } from "vitest";
import { evaluateDailyQuality } from "./agents/managerQuality";
import { isWithinAssistableContactWindow } from "./assistableClient";

describe("manager daily quality matrix", () => {
  it("passes a worker only when it produces adequate evidence and required output", () => {
    const result = evaluateDailyQuality({
      agentSlug: "seo_intel",
      summary: "The agent analyzed real published posts, identified a ranking gap, created a BlogStudio optimization draft, and recorded the target keyword, internal-link plan, expected click gain, and evidence source for the manager review.",
      runStatus: "completed",
      actionsCreated: 1,
      messagesCreated: 1,
    });

    expect(result.verdict).toBe("passed");
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it("requests rework when a content run omits the required action output", () => {
    const result = evaluateDailyQuality({
      agentSlug: "content",
      summary: "A draft concept was considered, but the agent did not save a complete BlogStudio draft or provide the evidence required by the daily operating checklist.",
      runStatus: "completed",
      actionsCreated: 0,
      messagesCreated: 1,
    });

    expect(result.verdict).toBe("rework");
    expect(result.feedback).toContain("below the 70-point acceptance threshold");
  });

  it("records an external integration dependency as blocked instead of pretending work completed", () => {
    const result = evaluateDailyQuality({
      agentSlug: "money_maker",
      summary: "Attorney research is blocked because the Assistable evidence-backed research assistant is not configured. No unverified prospects were created.",
      runStatus: "completed",
      actionsCreated: 1,
      messagesCreated: 1,
    });

    expect(result.verdict).toBe("blocked");
    expect(result.score).toBeGreaterThanOrEqual(50);
  });

  it("marks a failed worker run as failed rather than retrying it indefinitely", () => {
    const result = evaluateDailyQuality({
      agentSlug: "editor",
      summary: "",
      runStatus: "failed",
      errorMessage: "Provider timeout",
      actionsCreated: 0,
      messagesCreated: 0,
    });

    expect(result.verdict).toBe("failed");
    expect(result.score).toBeLessThanOrEqual(25);
  });
});

describe("Assistable outbound safety window", () => {
  it("allows only weekday contact hours in America/Denver", () => {
    expect(isWithinAssistableContactWindow(new Date("2026-08-12T14:00:00.000Z"))).toBe(true); // 8 AM MDT Wednesday
    expect(isWithinAssistableContactWindow(new Date("2026-08-12T22:59:00.000Z"))).toBe(true); // 4:59 PM MDT
    expect(isWithinAssistableContactWindow(new Date("2026-08-12T23:00:00.000Z"))).toBe(false); // 5 PM MDT
    expect(isWithinAssistableContactWindow(new Date("2026-08-15T16:00:00.000Z"))).toBe(false); // Saturday
  });
});
