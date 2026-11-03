import fs from "node:fs/promises";
import path from "node:path";
import { callAgentLLM } from "../server/agents/agentLLM";
import { validateSeoOutput } from "../server/agents/seoOutputValidation";

// Explicit opt-in: two requests maximum; no fallback, no config writes or actions.
if (process.env.RUN_LIVE_AUTOPILOT_MODEL_TESTS !== "1") throw new Error("Set RUN_LIVE_AUTOPILOT_MODEL_TESTS=1 for two bounded paid OpenRouter probes.");
const out = "/home/ubuntu/solar-freedom-deliverables/autopilot-2026-11-02";
await fs.mkdir(out, { recursive: true });
const source = await fs.readFile(new URL("../server/agents/seoIntel.ts", import.meta.url), "utf8");
const prompt = source.match(/const SYSTEM_PROMPT = `([\s\S]*?)`;/)?.[1];
if (!prompt) throw new Error("Actual SEO prompt could not be loaded; do not substitute a bare smoke prompt.");
const context = `READ-ONLY VALIDATION FIXTURE, NOT A LIVE ANALYSIS OR PUBLISH REQUEST.
No fresh GSC metrics are supplied in this fixture. You must explicitly mark current rankings, clicks and forecasts unavailable and must not invent values or Google penalties.
Exact published blog routes supplied for target validation: /blog/goodleap-solar-loan-cancellation-hidden-fees-2026 and /blog/adt-solar-complaints.
Existing source-reviewed finding (November 2, 2026): GoodLeap's official complaint route is at https://www.goodleap.com/complaints; a complaint does not itself cancel a loan or pause payments. A useful proposed action is to review the official contact guidance against the existing article; this is a recommendation, not a completed change.
Return the normal bounded SEO analysis JSON with a real analysis summary, at most one action, no new content directive or optimizeExisting request, and at most one report message. No unmeasured numeric gain/traffic/revenue estimate. The action must use the exact supplied blog slug in pageSlug, if any. All proposed legal content requires qualified conditional wording and source verification.`;
const records: unknown[] = [];
for (const model of ["deepseek/deepseek-v4.1-flash", "google/gemini-4-argon"]) {
  const started = Date.now();
  try {
    const response = await callAgentLLM({ modelOverride: model, executionMode: "scheduled", totalTimeoutMs: 40_000, allowFallback: false, maxTokens: 1800, responseFormat: { type: "json_object" }, messages: [{ role: "system", content: prompt }, { role: "user", content: context }] });
    const parsed = validateSeoOutput(response.content);
    const record = { requestedModel: model, actualModel: response.modelId, capturedAt: new Date().toISOString(), latencyMs: Date.now() - started, structuredOutputValid: true, costUsd: response.costUsd ?? null, costSource: response.costSource, usage: response.usage, output: parsed, promotion: "not_promoted_one_fixture_not_production_validation" };
    records.push(record);
    console.log(JSON.stringify({ model, actualModel: response.modelId, latencyMs: record.latencyMs, valid: true, costUsd: record.costUsd, costSource: record.costSource }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Probe failed";
    // Never serialize request configuration or credentials from provider errors.
    const safe = message.replace(/Bearer\s+\S+|sk-[A-Za-z0-9_-]+/g, "[redacted]").slice(0, 500);
    records.push({ requestedModel: model, capturedAt: new Date().toISOString(), latencyMs: Date.now() - started, structuredOutputValid: false, error: safe, promotion: "not_promoted" });
    console.log(JSON.stringify({ model, latencyMs: Date.now() - started, valid: false, error: safe }));
    if (/401|402|403|insufficient credits|security policy/i.test(safe)) break;
  }
}
await fs.writeFile(path.join(out, "named-model-workload-probes.json"), JSON.stringify({ boundedRequests: 2, productionRoutingChanged: false, source: "Actual SEO system prompt with clearly labeled source-backed read-only fixture; no live GSC ranking claims", records }, null, 2) + "\n");
