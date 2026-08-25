import { runRevenueIntelAgent } from "../server/agents/revenueIntelAgent.ts";

const result = await runRevenueIntelAgent("manual", "owner_requested_fresh_gsc_validation");
console.log(JSON.stringify({ completedAt: new Date().toISOString(), result }, null, 2));
