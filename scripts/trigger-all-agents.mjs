/**
 * Triggers all 6 agents immediately by POSTing to the live production endpoint.
 * Uses the Heartbeat-style auth via a direct internal call.
 */

const BASE_URL = "https://breakyoursolarcontract.com";
const AGENTS = ["infra", "seo_intel", "money_maker", "content", "editor", "manager"];

// Task UIDs from the registered heartbeat jobs
const TASK_UIDS = {
  infra: "67XiCWv44EX4YcvUP64Wmx",
  manager: "W9FgbqJSJVjMGzC4iGzSrM",
  editor: "crvyPkChoyZY3zdzPewZoM",
  content: "7CxqyvJWetaq3yPAfRMqkE",
  seo_intel: "Ccs2Doyq8XW9knTV2QFX5A",
  money_maker: "NaMsnsfTtJtPbxGvNJs6rS",
};

console.log("Triggering all agents via production API...\n");

for (const agent of AGENTS) {
  console.log(`Triggering ${agent}...`);
  try {
    const res = await fetch(`${BASE_URL}/api/agent/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentSlug: agent, triggeredBy: "admin-manual" }),
    });
    const data = await res.json();
    if (data.ok) {
      console.log(`  ✅ ${agent}: ${data.summary || "started"}`);
    } else {
      console.log(`  ⚠️  ${agent}: ${data.error || JSON.stringify(data)}`);
    }
  } catch (err) {
    console.log(`  ❌ ${agent}: ${err.message}`);
  }
  // Small delay between agents to avoid overwhelming the server
  await new Promise(r => setTimeout(r, 2000));
}
