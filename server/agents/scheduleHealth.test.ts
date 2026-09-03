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
        { name: "agent-manager-mountain-8-dst", isEnable: false },
        { name: "agent-infra", isEnable: true },
      ],
    );

    expect(states.find((state) => state.slug === "manager")?.state).toBe("paused");
    expect(states.find((state) => state.slug === "infra")?.state).toBe("awaiting_first_run");
  });

  it("reports the Manager's real DST job pair rather than the name it never registers", () => {
    // registerCrons creates agent-manager-mountain-8-dst/-standard, never
    // "agent-manager". Looking up the latter made every Manager state render as
    // "migrated", hiding a disabled or stalled daily cycle.
    const now = Date.parse("2026-08-28T15:10:00Z");
    const healthy = buildAgentScheduleHealth(
      [{ slug: "manager", lastRunAt: "2026-08-28T14:05:00Z", totalRuns: 12 }],
      [
        { name: "agent-manager-mountain-8-dst", isEnable: true, lastExecutedAt: "2026-08-28T14:00:00Z" },
        { name: "agent-manager-mountain-8-standard", isEnable: true },
      ],
      now,
    );
    expect(healthy.find((state) => state.slug === "manager")?.state).toBe("scheduled");

    const stalled = buildAgentScheduleHealth(
      [{ slug: "manager", lastRunAt: "2026-08-24T14:05:00Z", totalRuns: 12 }],
      [{ name: "agent-manager-mountain-8-dst", isEnable: true, lastExecutedAt: "2026-08-24T14:00:00Z" }],
      now,
    );
    expect(stalled.find((state) => state.slug === "manager")?.state).toBe("stale");
  });

  it("keeps the migrated label only for a Manager that has actually been running", () => {
    const migrated = buildAgentScheduleHealth(
      [{ slug: "manager", lastRunAt: "2026-08-27T14:05:00Z", totalRuns: 9 }],
      [],
    );
    expect(migrated.find((state) => state.slug === "manager")).toMatchObject({
      configured: true,
      state: "migrated",
    });
    expect(migrated.find((state) => state.slug === "seo_intel")?.state).toBe("missing");
  });

  it("raises a Manager with no triggers and no runs as missing instead of reassuring the owner", () => {
    const states = buildAgentScheduleHealth([], []);
    expect(states.find((state) => state.slug === "manager")).toMatchObject({
      configured: false,
      state: "missing",
    });
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

  it("watches the Justia attorney-discovery DST pair", () => {
    const now = Date.parse("2026-09-03T08:10:00Z");
    const healthy = buildAgentScheduleHealth(
      [],
      [{ name: "agent-attorney-discovery-mountain-2-dst", isEnable: true, lastExecutedAt: "2026-09-03T08:00:00Z" }],
      now,
    );
    expect(healthy.find((state) => state.slug === "attorney_discovery")?.state).toBe("scheduled");

    const unregistered = buildAgentScheduleHealth([], [], now);
    expect(unregistered.find((state) => state.slug === "attorney_discovery")?.state).toBe("missing");
  });
});
