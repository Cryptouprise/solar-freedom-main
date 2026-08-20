import { runSeoIntel } from "../server/agents/seoIntel.ts";

const startedAt = Date.now();
try {
  const result = await runSeoIntel("cron", "owner_requested_bounded_runtime_verification");
  console.log(JSON.stringify({
    ok: true,
    durationMs: Date.now() - startedAt,
    completedAt: new Date().toISOString(),
    result,
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    durationMs: Date.now() - startedAt,
    completedAt: new Date().toISOString(),
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exitCode = 1;
}
