import { AGENT_CRON_CONFIGS } from "./registerCrons";

type AgentRecord = {
  slug: string;
  lastRunAt: Date | string | null;
  totalRuns: number;
};

type HeartbeatRecord = {
  name: string;
  isEnable?: boolean;
  lastExecutedAt?: string | null;
  nextExecutionAt?: string | null;
  taskUid?: string;
};

type SeoMeasurementRecord = {
  gscLastChecked: Date | string | null;
  gscClicks: number | null;
  gscImpressions: number | null;
};

const EXPECTED_AGENT_SLUGS = Object.keys(AGENT_CRON_CONFIGS);
const STALE_AGENT_RUN_MS = 36 * 60 * 60 * 1000;
const STALE_GSC_MEASUREMENT_MS = 72 * 60 * 60 * 1000;

export type AgentScheduleHealth = {
  slug: string;
  configured: boolean;
  enabled: boolean;
  taskUid: string | null;
  lastScheduledExecutionAt: string | null;
  nextScheduledExecutionAt: string | null;
  lastRecordedAgentRunAt: Date | string | null;
  totalRuns: number;
  state: "missing" | "paused" | "migrated" | "awaiting_first_run" | "scheduled" | "stale";
};

export type SeoMeasurementHealth = {
  state: "missing" | "stale" | "current";
  trackedPageCount: number;
  lastCheckedAt: string | null;
};

export function buildAgentScheduleHealth(
  agents: AgentRecord[],
  jobs: HeartbeatRecord[],
  now = Date.now(),
): AgentScheduleHealth[] {
  return EXPECTED_AGENT_SLUGS.map((slug) => {
    const job = jobs.find((candidate) => candidate.name === `agent-${slug}`);
    const agent = agents.find((candidate) => candidate.slug === slug);
    const migrated = slug === "manager" && !job;
    const enabled = Boolean(job?.isEnable);
    const latestExecutionMs = job?.lastExecutedAt ? new Date(job.lastExecutedAt).getTime() : null;
    const state = migrated
      ? "migrated"
      : !job
      ? "missing"
      : !enabled
        ? "paused"
        : !job.lastExecutedAt
          ? "awaiting_first_run"
          : latestExecutionMs && now - latestExecutionMs > STALE_AGENT_RUN_MS
            ? "stale"
            : "scheduled";

    return {
      slug,
      configured: Boolean(job) || migrated,
      enabled,
      taskUid: job?.taskUid ?? null,
      lastScheduledExecutionAt: job?.lastExecutedAt ?? null,
      nextScheduledExecutionAt: job?.nextExecutionAt ?? null,
      lastRecordedAgentRunAt: agent?.lastRunAt ?? null,
      totalRuns: Number(agent?.totalRuns ?? 0),
      state,
    };
  });
}

export function buildSeoMeasurementHealth(
  pages: SeoMeasurementRecord[],
  now = Date.now(),
): SeoMeasurementHealth {
  const tracked = pages.filter((page) => (page.gscClicks ?? 0) > 0 || (page.gscImpressions ?? 0) > 0);
  const timestamps = pages
    .map((page) => page.gscLastChecked ? new Date(page.gscLastChecked).getTime() : Number.NaN)
    .filter(Number.isFinite);
  const latestMs = timestamps.length > 0 ? Math.max(...timestamps) : null;

  return {
    state: latestMs === null
      ? "missing"
      : now - latestMs > STALE_GSC_MEASUREMENT_MS
        ? "stale"
        : "current",
    trackedPageCount: tracked.length,
    lastCheckedAt: latestMs === null ? null : new Date(latestMs).toISOString(),
  };
}
