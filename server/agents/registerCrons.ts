/**
 * Agent Cron Registration
 *
 * The Manager owns daily orchestration. Worker agents do not have independent
 * timers, which prevents unordered, duplicated, or unreviewed work.
 */

import {
  createHeartbeatJob,
  listHeartbeatJobs,
  deleteHeartbeatJob,
  updateHeartbeatJob,
  type HeartbeatJob,
} from "../_core/heartbeat";
import type { AgentSlug } from "./index";

/**
 * Informational worker configuration shown in the Admin UI. Workers are run by
 * the Manager in sequence after it creates their daily goals and checklists.
 */
export const AGENT_CRON_CONFIGS: Record<AgentSlug, { cron: string; description: string }> = {
  money_maker: { cron: "manager-led", description: "Manager-owned worker — prospecting and revenue actions" },
  seo_intel: { cron: "manager-led", description: "Manager-owned worker — ranking and SEO execution" },
  content: { cron: "manager-led", description: "Manager-owned worker — draft creation" },
  editor: { cron: "manager-led", description: "Manager-owned worker — quality and compliance review" },
  manager: { cron: "8:00 AM America/Denver", description: "Daily operating cycle, goal-setting, QA, and bounded rework" },
  infra: { cron: "manager-led", description: "Manager-owned worker — health, costs, and audit" },
  revenue_intel: { cron: "manager-led", description: "Manager-owned worker — predicted revenue ranking" },
};

/**
 * Heartbeat accepts UTC-only cron. These two triggers cover 8:00 AM in both
 * DST and standard time. The callback checks America/Denver and skips the
 * non-matching UTC trigger, so only one daily Manager cycle runs.
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

/** List all project-owned agent schedules. */
export async function listAgentCrons() {
  try {
    const result = await listHeartbeatJobs("", { page: 1, pageSize: 50 });
    return result.jobs.filter(job => job.name.startsWith("agent-"));
  } catch (error: any) {
    console.error("[AgentCrons] Failed to list schedules:", error.message);
    return [];
  }
}

/**
 * Reconcile Heartbeat to the manager-led operating model. Legacy individual
 * worker cron jobs are deleted. The two DST-safe Manager jobs are created or
 * updated in place.
 */
export async function reconcileDailyOperatingCycle(): Promise<{ updated: string[]; errors: string[] }> {
  const updated: string[] = [];
  const errors: string[] = [];
  const existing = await listAgentCrons();
  const desiredByName = new Map(DAILY_MANAGER_JOBS.map(job => [job.name, job]));

  for (const job of existing) {
    const desired = desiredByName.get(job.name);
    try {
      if (!desired) {
        await deleteHeartbeatJob(job.taskUid, "");
        updated.push(`${job.name}: removed legacy schedule`);
        continue;
      }
      await updateHeartbeatJob(job.taskUid, {
        cron: desired.cron,
        path: desired.path,
        method: desired.method,
        payload: desired.payload,
        description: desired.description,
        enable: true,
      }, "");
      updated.push(`${job.name}: updated`);
    } catch (error: any) {
      errors.push(`${job.name}: ${error.message}`);
    }
  }

  for (const desired of DAILY_MANAGER_JOBS) {
    if (existing.some(job => job.name === desired.name)) continue;
    try {
      const created = await createHeartbeatJob(desired, "");
      updated.push(`${desired.name}: created (next ${created.nextExecutionAt ?? "pending"})`);
    } catch (error: any) {
      errors.push(`${desired.name}: ${error.message}`);
    }
  }

  return { updated, errors };
}

/** Legacy alias kept for admin calls from older builds. */
export async function registerAllAgentCrons(): Promise<{ registered: string[]; errors: string[] }> {
  const result = await reconcileDailyOperatingCycle();
  return { registered: result.updated, errors: result.errors };
}

/** Remove all agent schedules if the owner explicitly pauses automation. */
export async function deregisterAllAgentCrons(): Promise<{ deleted: string[]; errors: string[] }> {
  const deleted: string[] = [];
  const errors: string[] = [];
  for (const job of await listAgentCrons()) {
    try {
      await deleteHeartbeatJob(job.taskUid, "");
      deleted.push(job.name);
    } catch (error: any) {
      errors.push(`${job.name}: ${error.message}`);
    }
  }
  return { deleted, errors };
}
