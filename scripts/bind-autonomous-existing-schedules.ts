import { listHeartbeatJobs } from "../server/_core/heartbeat";
import { DESIRED_AGENT_JOBS } from "../server/agents/registerCrons";
import { bindAutonomousSchedule } from "../server/autonomousActivation";

if (process.env.RUN_AUTONOMOUS_BINDING_MIGRATION !== "1") throw new Error("Opt in to existing-schedule binding migration explicitly.");
const inventory = await listHeartbeatJobs("", { page: 1, pageSize: 100 });
if (inventory.total > inventory.jobs.length) throw new Error("Incomplete schedule inventory; no bindings written.");
let bound = 0;
for (const spec of DESIRED_AGENT_JOBS) {
  const row = inventory.jobs.find(job => job.name === spec.name && job.callbackPath === spec.path && job.isEnable);
  if (!row) continue;
  await bindAutonomousSchedule(row.taskUid, spec);
  if (["/api/scheduled/agent-run", "/api/scheduled/action-executor"].includes(spec.path)) bound++;
}
console.log(JSON.stringify({ boundExistingSchedules: bound, schedulesCreated: 0, schedulesModified: 0, note: "Bindings only. Worker activation waits for deployed version proof." }));
process.exit(0);
