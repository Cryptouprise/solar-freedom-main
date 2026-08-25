import { runAllAgents } from "../server/agents/index.ts";

const startedAt = new Date().toISOString();
const results = await runAllAgents("owner_requested_final_validation");
console.log(JSON.stringify({ startedAt, completedAt: new Date().toISOString(), results }, null, 2));
