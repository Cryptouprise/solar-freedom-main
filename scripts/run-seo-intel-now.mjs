import { runSeoIntel } from "../server/agents/seoIntel.ts";

const result = await runSeoIntel("manual", "owner_requested_live_gsc_validation");
console.log(JSON.stringify({ completedAt: new Date().toISOString(), result }, null, 2));
