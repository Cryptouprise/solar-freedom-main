/**
 * Agent Cron Registration
 * 
 * Registers heartbeat cron jobs for each of the 5 agents.
 * Called once from the admin UI or manually to set up the scheduled runs.
 * 
 * Schedule (all UTC):
 * - Money Maker: Every 6 hours (0 0 0,6,12,18 * * *)
 * - SEO Intel: Every 4 hours (0 0 2,6,10,14,18,22 * * *)
 * - Content: Every 8 hours (0 0 1,9,17 * * *)
 * - Editor: Every 4 hours (0 0 3,7,11,15,19,23 * * *)
 * - Manager: Every 2 hours (0 0 every-2h * * *)
 */

import { createHeartbeatJob, listHeartbeatJobs, deleteHeartbeatJob } from "../_core/heartbeat";
import type { AgentSlug } from "./index";

export const AGENT_CRON_CONFIGS: Record<AgentSlug, { cron: string; description: string }> = {
  money_maker: {
    cron: "0 0 0,6,12,18 * * *",
    description: "Money Maker Agent — attorney discovery, revenue opportunities (every 6h)",
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
    description: "Editor Agent — quality review & compliance (every 4h)",
  },
  manager: {
    cron: "0 0 */2 * * *",
    description: "Manager Agent — oversight & final approval (every 2h)",
  },
  infra: {
    cron: "0 0 5 * * *",
    description: "Infrastructure Agent — system health check, cost alert, self-improvement (daily 5 AM UTC)",
  },
};

/**
 * Register all 5 agent cron jobs with the Heartbeat platform.
 * Uses empty userSession to register as project owner.
 */
export async function registerAllAgentCrons(): Promise<{ registered: string[]; errors: string[] }> {
  const registered: string[] = [];
  const errors: string[] = [];

  for (const [slug, config] of Object.entries(AGENT_CRON_CONFIGS)) {
    try {
      const result = await createHeartbeatJob(
        {
          name: `agent-${slug}`,
          cron: config.cron,
          path: "/api/scheduled/agent-run",
          method: "POST",
          payload: { agentSlug: slug },
          description: config.description,
        },
        "" // empty = project owner
      );
      registered.push(`${slug}: taskUid=${result.taskUid}, next=${result.nextExecutionAt}`);
    } catch (err: any) {
      // If already exists (409), that's fine
      if (err.message?.includes("409") || err.message?.includes("CONFLICT")) {
        registered.push(`${slug}: already registered`);
      } else {
        errors.push(`${slug}: ${err.message}`);
      }
    }
  }

  return { registered, errors };
}

/**
 * List all agent cron jobs currently registered.
 */
export async function listAgentCrons() {
  try {
    const result = await listHeartbeatJobs("", { page: 1, pageSize: 50 });
    return result.jobs.filter(j => j.name.startsWith("agent-"));
  } catch (err: any) {
    console.error("[AgentCrons] Failed to list:", err.message);
    return [];
  }
}

/**
 * Deregister all agent cron jobs.
 */
export async function deregisterAllAgentCrons(): Promise<{ deleted: string[]; errors: string[] }> {
  const deleted: string[] = [];
  const errors: string[] = [];

  try {
    const jobs = await listAgentCrons();
    for (const job of jobs) {
      try {
        await deleteHeartbeatJob(job.taskUid, "");
        deleted.push(job.name);
      } catch (err: any) {
        errors.push(`${job.name}: ${err.message}`);
      }
    }
  } catch (err: any) {
    errors.push(`list failed: ${err.message}`);
  }

  return { deleted, errors };
}
