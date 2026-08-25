import { describe, expect, it } from "vitest";
import { resolveScheduledAgentSlug, SCHEDULED_AGENT_SLUGS, shouldRunImmediateQualityRetry } from "./agentRun";

describe("scheduled agent slug resolution", () => {
  it("accepts every registered scheduled agent, including Revenue Intel", () => {
    for (const slug of SCHEDULED_AGENT_SLUGS) {
      expect(resolveScheduledAgentSlug(slug)).toBe(slug);
    }
  });

  it("rejects unknown, missing, and non-string agent payloads", () => {
    expect(resolveScheduledAgentSlug("unknown_agent")).toBeNull();
    expect(resolveScheduledAgentSlug(undefined)).toBeNull();
    expect(resolveScheduledAgentSlug({ slug: "seo_intel" })).toBeNull();
  });

  it("defers quality rework outside the scheduled callback budget", () => {
    expect(shouldRunImmediateQualityRetry(true)).toBe(false);
    expect(shouldRunImmediateQualityRetry(false)).toBe(true);
  });
});
