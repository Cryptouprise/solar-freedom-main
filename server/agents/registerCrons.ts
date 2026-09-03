/**
 * Agent Cron Registration
 *
 * The Manager starts the daily operating cycle at 8:00 AM America/Denver, but
 * each worker executes in its own Heartbeat callback. This preserves ordered
 * goals and quality contracts without turning the Manager into a timeout-prone
 * fan-out process with unobservable child runs.
 */

import {
  createHeartbeatJob,
  listHeartbeatJobs,
  deleteHeartbeatJob,
  updateHeartbeatJob,
  type HeartbeatJob,
} from "../_core/heartbeat";
import type { AgentSlug } from "./index";

export const AGENT_CRON_CONFIGS: Record<AgentSlug, { cron: string; description: string }> = {
  money_maker: {
    cron: "0 0 0,6,12,18 * * *",
    description: "Money Maker Agent — attorney discovery and revenue opportunities (every 6h)",
  },
  seo_intel: {
    cron: "0 0 2,6,10,14,18,22 * * *",
    description: "SEO Intel Agent — search performance monitoring (every 4h)",
  },
  content: {
    cron: "0 0 1,9,17 * * *",
    description: "Content Agent — article generation pipeline (every 8h)",
  },
  editor: {
    cron: "0 0 3,7,11,15,19,23 * * *",
    description: "Editor Agent — quality and compliance review (every 4h)",
  },
  manager: {
    cron: "8:00 AM America/Denver",
    description: "Manager Agent — daily goals, quality contracts, and oversight",
  },
  infra: {
    cron: "0 0 5 * * *",
    description: "Infrastructure Agent — system health, cost alert, and self-improvement (daily)",
  },
  revenue_intel: {
    cron: "0 0 6,14 * * *",
    description: "Revenue Intelligence Agent — GSC analysis, lead yield prediction, and action ranking (twice daily)",
  },
};

/**
 * Heartbeat accepts UTC-only cron. Both triggers are guarded inside the
 * callback so exactly one Manager cycle begins at 8:00 AM Mountain time across
 * daylight-saving changes.
 */
const DAILY_MANAGER_JOBS: HeartbeatJob[] = [
  {
    name: "agent-manager-mountain-8-dst",
    cron: "0 0 14 * * *",
    path: "/api/scheduled/agent-run",
    method: "POST",
    payload: { agentSlug: "manager", scheduleMode: "mountain_8" },
    description: "Solar Freedom Manager daily cycle — 8:00 AM America/Denver during daylight time; callback time-zone guard enabled",
  },
  {
    name: "agent-manager-mountain-8-standard",
    cron: "0 0 15 * * *",
    path: "/api/scheduled/agent-run",
    method: "POST",
    payload: { agentSlug: "manager", scheduleMode: "mountain_8" },
    description: "Solar Freedom Manager daily cycle — 8:00 AM America/Denver during standard time; callback time-zone guard enabled",
  },
];

/**
 * Drains the action queue after the analysis workers have had time to file
 * their recommendations. Without this, actions with a typed executor would sit
 * at "queued" until someone opened the Command Center and clicked each one.
 */
const JUSTIA_DISCOVERY_JOBS: HeartbeatJob[] = [
  {
    name: "agent-attorney-discovery-mountain-2-dst",
    cron: "0 0 8 * * *",
    path: "/api/scheduled/justia-attorney-discovery",
    method: "POST",
    payload: { scheduleMode: "mountain_2" },
    description: "Justia public attorney discovery — 2:00 AM America/Denver during daylight time; callback time-zone guard enabled",
  },
  {
    name: "agent-attorney-discovery-mountain-2-standard",
    cron: "0 0 9 * * *",
    path: "/api/scheduled/justia-attorney-discovery",
    method: "POST",
    payload: { scheduleMode: "mountain_2" },
    description: "Justia public attorney discovery — 2:00 AM America/Denver during standard time; callback time-zone guard enabled",
  },
];

const EXECUTOR_JOBS: HeartbeatJob[] = [
  {
    name: "agent-action-executor",
    cron: "0 30 3,9,15,21 * * *",
    path: "/api/scheduled/action-executor",
    method: "POST",
    payload: {},
    description:
      "Action Executor — applies queued SEO actions that have a typed executor to live pages (4x daily, bounded batch, every change logged and revertible)",
  },
];

const WORKER_JOBS: HeartbeatJob[] = (Object.entries(AGENT_CRON_CONFIGS) as [AgentSlug, { cron: string; description: string }][])
  .filter(([slug]) => slug !== "manager")
  .map(([slug, config]) => ({
    name: `agent-${slug}`,
    cron: config.cron,
    path: "/api/scheduled/agent-run",
    method: "POST",
    payload: { agentSlug: slug },
    description: config.description,
  }));

/**
 * Every Heartbeat job this project owns. Exported so scheduleHealth coverage can
 * be reconciled against it in a test — a job registered here but not monitored
 * there is invisible when it stalls, which is how the Manager went unwatched.
 */
export const DESIRED_AGENT_JOBS = [...DAILY_MANAGER_JOBS, ...WORKER_JOBS, ...EXECUTOR_JOBS, ...JUSTIA_DISCOVERY_JOBS];

/** List all project-owned agent schedules. */
export async function listAgentCrons(userSession = "") {
  try {
    const result = await listHeartbeatJobs(userSession, { page: 1, pageSize: 50 });
    return result.jobs.filter(job => job.name.startsWith("agent-"));
  } catch (error: any) {
    console.error("[AgentCrons] Failed to list schedules:", error.message);
    return [];
  }
}

/**
 * Reconcile Heartbeat with the daily operating model. It updates established
 * jobs, creates missing ones, and removes only obsolete agent schedules.
 */
export async function reconcileDailyOperatingCycle(userSession = ""): Promise<{ updated: string[]; errors: string[] }> {
  const updated: string[] = [];
  const errors: string[] = [];
  const existing = await listAgentCrons(userSession);
  const desiredByName = new Map(DESIRED_AGENT_JOBS.map(job => [job.name, job]));

  for (const job of existing) {
    const desired = desiredByName.get(job.name);
    try {
      if (!desired) {
        await deleteHeartbeatJob(job.taskUid, userSession);
        updated.push(`${job.name}: removed obsolete schedule`);
        continue;
      }
      await updateHeartbeatJob(job.taskUid, {
        cron: desired.cron,
        path: desired.path,
        method: desired.method,
        payload: desired.payload,
        description: desired.description,
        enable: true,
      }, userSession);
      updated.push(`${job.name}: updated`);
    } catch (error: any) {
      errors.push(`${job.name}: ${error.message}`);
    }
  }

  for (const desired of DESIRED_AGENT_JOBS) {
    if (existing.some(job => job.name === desired.name)) continue;
    try {
      const created = await createHeartbeatJob(desired, userSession);
      updated.push(`${desired.name}: created (next ${created.nextExecutionAt ?? "pending"})`);
    } catch (error: any) {
      errors.push(`${desired.name}: ${error.message}`);
    }
  }

  return { updated, errors };
}

/** Legacy alias kept for admin calls from older builds. */
export async function registerAllAgentCrons(userSession = ""): Promise<{ registered: string[]; errors: string[] }> {
  const result = await reconcileDailyOperatingCycle(userSession);
  return { registered: result.updated, errors: result.errors };
}

/** Remove all agent schedules if the owner explicitly pauses automation. */
export async function deregisterAllAgentCrons(userSession = ""): Promise<{ deleted: string[]; errors: string[] }> {
  const deleted: string[] = [];
  const errors: string[] = [];
  for (const job of await listAgentCrons(userSession)) {
    try {
      await deleteHeartbeatJob(job.taskUid, userSession);
      deleted.push(job.name);
    } catch (error: any) {
      errors.push(`${job.name}: ${error.message}`);
    }
  }
  return { deleted, errors };
}
