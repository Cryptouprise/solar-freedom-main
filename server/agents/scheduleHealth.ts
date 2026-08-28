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

/**
 * Scheduled jobs that are not agents but must still be watched. The action
 * executor is the only path that applies queued SEO actions to live pages, so a
 * silent stall there stops every ranking change without stopping any agent.
 */
const SUPPORT_JOBS: Array<{ slug: string; jobName: string }> = [
  { slug: "action_executor", jobName: "agent-action-executor" },
];

/**
 * The Manager runs from two DST-paired Heartbeat jobs, not from `agent-manager`.
 * Looking up the single name meant the panel reported the Manager as "migrated"
 * whether its real triggers existed, were disabled, or were failing.
 */
const MANAGER_JOB_NAMES = ["agent-manager-mountain-8-dst", "agent-manager-mountain-8-standard"];

const MONITORED_JOBS: Array<{ slug: string; jobNames: string[] }> = [
  ...EXPECTED_AGENT_SLUGS.map((slug) => ({
    slug,
    jobNames: slug === "manager" ? MANAGER_JOB_NAMES : [`agent-${slug}`],
  })),
  ...SUPPORT_JOBS.map((job) => ({ slug: job.slug, jobNames: [job.jobName] })),
];
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
  return MONITORED_JOBS.map(({ slug, jobNames }) => {
    // Prefer an enabled job, then any that has run, so a DST pair reports the
    // trigger that is actually driving the schedule right now.
    const matches = jobs.filter((candidate) => jobNames.includes(candidate.name));
    const job =
      matches.find((candidate) => candidate.isEnable && candidate.lastExecutedAt) ??
      matches.find((candidate) => candidate.isEnable) ??
      matches[0];
    const agent = agents.find((candidate) => candidate.slug === slug);
    const migrated = slug === "manager" && !matches.length && Number(agent?.totalRuns ?? 0) > 0;
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
