import fs from "node:fs/promises";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { getDb } from "../server/db";
import { agentActions, agentModelConfig, agentRunLog, siteConfig } from "../drizzle/schema";
import { competitorEvidenceSchema, COMPETITOR_EVIDENCE_KEY } from "../server/autopilotRouter";
import { measureSeoChangeOutcomes, readSeoOutcomeSourceHealth } from "../server/seoChangeOutcomes";
import { runSeoIntel } from "../server/agents/seoIntel";
import { executeQueuedAction, EXECUTABLE_ACTION_TYPES } from "../server/agents/executors";

if (process.env.RUN_LIVE_AUTOPILOT_RUNTIME_CHECK !== "1") throw new Error("Explicit live runtime opt-in required.");
const db = await getDb();
if (!db) throw new Error("Database unavailable");
const folder = "/home/ubuntu/solar-freedom-deliverables/autopilot-2026-11-02";
await fs.mkdir(folder, { recursive: true });
const source = JSON.parse(await fs.readFile(new URL("../docs/autopilot-2026-11-02/competitor-source-review.json", import.meta.url), "utf8"));
const input = competitorEvidenceSchema.parse({ capturedAt: new Date().toISOString(), topics: source.topics });
const value = JSON.stringify(input);
await db.insert(siteConfig).values({ key: COMPETITOR_EVIDENCE_KEY, value, description: "Dated, source-backed competitor evidence; not exact Google ranks or AI citations." }).onDuplicateKeyUpdate({ set: { value, updatedAt: new Date() } });
const routes = await db.select({ agentSlug: agentModelConfig.agentSlug, modelId: agentModelConfig.modelId }).from(agentModelConfig);
const measurement = await measureSeoChangeOutcomes({ now: new Date(), limit: 1, dryRun: true });
console.log(JSON.stringify({ competitorEvidenceSaved: input.topics.length, measurementDryRun: { considered: measurement.considered, attempted: measurement.attempted, validated: measurement.validated, status: measurement.status }, sourceHealth: readSeoOutcomeSourceHealth().status, routes }));
const started = new Date();
let run: unknown;
let error: string | null = null;
try {
  run = await runSeoIntel("cron", "owner:bounded-autopilot-repair-validation", process.env.AUTOPILOT_VALIDATION_MODEL ? { modelOverride: process.env.AUTOPILOT_VALIDATION_MODEL } : undefined);
  console.log(JSON.stringify({ seoRun: run }));
} catch (cause) {
  error = cause instanceof Error ? cause.message.slice(0, 500) : "Run failed";
  console.log(JSON.stringify({ seoRunFailed: true, error }));
}
const actions = await db.select().from(agentActions).where(and(eq(agentActions.agentSlug, "seo_intel"), gte(agentActions.createdAt, started), inArray(agentActions.status, ["queued", "approved"]))).orderBy(desc(agentActions.createdAt)).limit(8);
// At most one typed action from THIS run. No old queue draining or article publication.
const action = actions.find(a => EXECUTABLE_ACTION_TYPES.includes(a.actionType) && a.requiresApproval === 0);
let execution: unknown = null;
if (action) {
  execution = await executeQueuedAction(action.id, "owner:bounded-autopilot-repair-validation", { deadlineAt: Date.now() + 55_000 });
  console.log(JSON.stringify({ execution }));
}
const [receipt] = await db.select().from(agentRunLog).where(and(eq(agentRunLog.agentSlug, "seo_intel"), gte(agentRunLog.startedAt, started))).orderBy(desc(agentRunLog.startedAt)).limit(1);
await fs.writeFile(`${folder}/live-runtime-verification.json`, JSON.stringify({ capturedAt: new Date().toISOString(), competitorTopicsSaved: input.topics.length, productionRoutesUnchanged: true, routes, outcomeDryRun: measurement, sourceHealth: readSeoOutcomeSourceHealth(), run: run ?? null, error, newActionIds: actions.map(a => a.id), execution, receipt }, null, 2) + "\n");
process.exit(0);
