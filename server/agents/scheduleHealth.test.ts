import { describe, expect, it } from "vitest";
import { buildAgentScheduleHealth, buildSeoMeasurementHealth } from "./scheduleHealth";

describe("agent schedule health", () => {
  it("flags a missing scheduled agent without hiding the configured agents", () => {
    const states = buildAgentScheduleHealth(
      [{ slug: "seo_intel", lastRunAt: "2026-08-12T07:00:00Z", totalRuns: 4 }],
      [{ name: "agent-seo_intel", isEnable: true, lastExecutedAt: "2026-08-12T07:00:00Z" }],
      Date.parse("2026-08-12T12:00:00Z"),
    );

    expect(states.find((state) => state.slug === "seo_intel")?.state).toBe("scheduled");
    expect(states.find((state) => state.slug === "revenue_intel")?.state).toBe("missing");
  });

  it("distinguishes a paused schedule from a job awaiting its first execution", () => {
    const states = buildAgentScheduleHealth(
      [],
      [
        { name: "agent-manager", isEnable: false },
        { name: "agent-infra", isEnable: true },
      ],
    );

    expect(states.find((state) => state.slug === "manager")?.state).toBe("paused");
    expect(states.find((state) => state.slug === "infra")?.state).toBe("awaiting_first_run");
  });

  it("marks the legacy Manager callback as migrated when automatic expert review replaces it", () => {
    const states = buildAgentScheduleHealth([], []);
    expect(states.find((state) => state.slug === "manager")).toMatchObject({
      configured: true,
      state: "migrated",
    });
    expect(states.find((state) => state.slug === "seo_intel")?.state).toBe("missing");
  });

  it("flags stale scheduler and Search Console measurement evidence", () => {
    const now = Date.parse("2026-08-12T12:00:00Z");
    const schedules = buildAgentScheduleHealth(
      [],
      [{ name: "agent-seo_intel", isEnable: true, lastExecutedAt: "2026-08-09T00:00:00Z" }],
      now,
    );
    const measurement = buildSeoMeasurementHealth(
      [{ gscLastChecked: "2026-08-08T00:00:00Z", gscClicks: 10, gscImpressions: 100 }],
      now,
    );

    expect(schedules.find((state) => state.slug === "seo_intel")?.state).toBe("stale");
    expect(measurement).toMatchObject({ state: "stale", trackedPageCount: 1 });
  });
  it("watches the action executor, so a stalled executor is visible even when every agent is healthy", () => {
    const now = Date.parse("2026-08-28T12:00:00Z");
    const healthy = buildAgentScheduleHealth(
      [],
      [{ name: "agent-action-executor", isEnable: true, lastExecutedAt: "2026-08-28T09:30:00Z" }],
      now,
    );
    expect(healthy.find((state) => state.slug === "action_executor")?.state).toBe("scheduled");

    const stalled = buildAgentScheduleHealth(
      [],
      [{ name: "agent-action-executor", isEnable: true, lastExecutedAt: "2026-08-25T09:30:00Z" }],
      now,
    );
    expect(stalled.find((state) => state.slug === "action_executor")?.state).toBe("stale");

    const unregistered = buildAgentScheduleHealth([], [], now);
    expect(unregistered.find((state) => state.slug === "action_executor")?.state).toBe("missing");
  });
});
