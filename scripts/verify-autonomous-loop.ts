import fs from "node:fs";
import { enqueueAutonomousWork } from "../server/autonomousQueue";
import { runAutonomousTick } from "../server/autonomousWorker";
import { readAutonomousStatus } from "../server/autonomousStatus";

if (process.env.RUN_LIVE_AUTONOMOUS_ACCEPTANCE !== "1") throw new Error("Explicit live acceptance opt-in required.");
// Existing owner-requested Sunrun/California pipeline item. No fake leads or test publications.
const job = await enqueueAutonomousWork({ workKey: "owner-autonomy-initial-content:30001", kind: "content_plan", pipelineId: 30001, priority: 30,
  state: { source: "owner_authorized_autonomy_acceptance", publication: "not_authorized" } });
const first = await runAutonomousTick();
console.log(JSON.stringify({ phase: "saved_plan", jobId: job.id, ...first }));
const second = await runAutonomousTick();
console.log(JSON.stringify({ phase: "bounded_work_step", ...second }));
const status = await readAutonomousStatus();
const report = { capturedAt: new Date().toISOString(), schedulesCreated: 0, publicArticlesPublished: 0, outreachSent: 0,
  first, second, status };
fs.mkdirSync("docs/autonomous-2026-11-02", { recursive: true });
fs.writeFileSync("docs/autonomous-2026-11-02/live-acceptance.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ configured: status.configured, recentJobs: status.jobs.slice(0, 3) }));
process.exit(0);
