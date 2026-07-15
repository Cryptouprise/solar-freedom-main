/**
 * SEO CTR Rescue Agent
 *
 * The May 2026 audit found the site's #1 problem is NOT rankings — it is
 * click-through rate. Many pages rank on page 1 (position < 10) but earn a
 * <1% CTR because their title/description in search results are weak.
 *
 * This agent:
 *   1. Reads Google Search Console performance (gsc_all_pages.json or
 *      gsc_report.csv).
 *   2. Finds "CTR rescue" candidates: enough impressions to matter, a position
 *      good enough that the only thing missing is the click, and a CTR below a
 *      target threshold.
 *   3. Optionally drafts improved <title> + meta description variants via
 *      OpenRouter (when OPENROUTER_API_KEY is set). Without a key it still emits
 *      the prioritized queue so a human can rewrite the copy.
 *
 * The deterministic queue is the source of truth. OpenRouter only proposes copy
 * for human approval — nothing here publishes or edits source files.
 *
 * Output:
 *   reports/seo-agent/latest-ctr-rescue.json
 *   reports/seo-agent/CTR_RESCUE.md
 *
 * Run:
 *   node scripts/seo-ctr-rescue.mjs
 *   node scripts/seo-ctr-rescue.mjs --limit 25 --min-impressions 30 --max-ctr 1.5
 *   OPENROUTER_API_KEY=... node scripts/seo-ctr-rescue.mjs --ai
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readGscMeasurementGate } from "./lib/gsc-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEFAULT_BASE_URL = "https://breakyoursolarcontract.com";
const DEFAULT_GSC_JSON = path.resolve(ROOT, "gsc_all_pages.json");
const DEFAULT_GSC_CSV = path.resolve(ROOT, "gsc_report.csv");
const DEFAULT_OUT_JSON = path.resolve(ROOT, "reports/seo-agent/latest-ctr-rescue.json");
const DEFAULT_OUT_MD = path.resolve(ROOT, "reports/seo-agent/CTR_RESCUE.md");

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODELS = [
  process.env.OPENROUTER_MODEL || "openrouter/owl-alpha",
  "google/gemini-flash-1.5:free",
];

function parseArgs(argv) {
  const args = {
    base: (process.env.SEO_CTR_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, ""),
    gscJson: process.env.SEO_CTR_GSC_JSON || DEFAULT_GSC_JSON,
    gscCsv: process.env.SEO_CTR_GSC_CSV || DEFAULT_GSC_CSV,
    gscStatus: path.resolve(ROOT, process.env.SEO_GSC_STATUS_JSON || "reports/seo-agent/gsc-status.json"),
    requireFreshGsc: process.env.SEO_GSC_REQUIRE_FRESH === "true",
    outJson: process.env.SEO_CTR_OUT_JSON || DEFAULT_OUT_JSON,
    outMd: process.env.SEO_CTR_OUT_MD || DEFAULT_OUT_MD,
    limit: Number(process.env.SEO_CTR_LIMIT || 25),
    minImpressions: Number(process.env.SEO_CTR_MIN_IMPRESSIONS || 20),
    maxCtr: Number(process.env.SEO_CTR_MAX_CTR || 1.5), // percent
    maxPosition: Number(process.env.SEO_CTR_MAX_POSITION || 20),
    ai: process.env.SEO_CTR_AI === "true" || Boolean(process.env.OPENROUTER_API_KEY),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--base" && next) args.base = next.replace(/\/$/, "");
    if (arg === "--gsc-json" && next) args.gscJson = path.resolve(ROOT, next);
    if (arg === "--gsc-csv" && next) args.gscCsv = path.resolve(ROOT, next);
    if (arg === "--gsc-status" && next) args.gscStatus = path.resolve(ROOT, next);
    if (arg === "--out-json" && next) args.outJson = path.resolve(ROOT, next);
    if (arg === "--out-md" && next) args.outMd = path.resolve(ROOT, next);
    if (arg === "--limit" && next) args.limit = Number(next);
    if (arg === "--min-impressions" && next) args.minImpressions = Number(next);
    if (arg === "--max-ctr" && next) args.maxCtr = Number(next);
    if (arg === "--max-position" && next) args.maxPosition = Number(next);
    if (arg === "--ai") args.ai = true;
    if (arg === "--no-ai") args.ai = false;
  }

  args.limit = Math.max(1, args.limit || 25);
  return args;
}

async function readJson(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf-8"));
  } catch {
    return null;
  }
}

async function readText(filePath) {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return "";
  }
}

// Normalize GSC rows from either the JSON export or the CSV export.
async function loadPerformance(args) {
  const rows = [];
  const gate = await readGscMeasurementGate({
    statusPath: args.gscStatus,
    requireFresh: args.requireFreshGsc,
  });
  if (!gate.usable) return { rows, gate };

  const json = await readJson(args.gscJson);
  if (Array.isArray(json)) {
    for (const row of json) {
      const url = Array.isArray(row.keys) ? row.keys[0] : row.page || row.url;
      if (!url) continue;
      rows.push({
        url,
        clicks: Number(row.clicks || 0),
        impressions: Number(row.impressions || 0),
        // GSC JSON ctr is a 0..1 fraction; convert to percent.
        ctr: Number(row.ctr || 0) * 100,
        position: Number(row.position || 0),
      });
    }
  }

  if (rows.length === 0) {
    const csv = await readText(args.gscCsv);
    const lines = csv.split(/\r?\n/).filter(Boolean);
    if (lines.length > 1) {
      const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const idx = (name) => header.indexOf(name);
      for (const line of lines.slice(1)) {
        const cols = line.split(",");
        const url = cols[idx("page")] || cols[idx("url")];
        if (!url) continue;
        rows.push({
          url: url.trim(),
          clicks: Number(cols[idx("clicks")] || 0),
          impressions: Number(cols[idx("impressions")] || 0),
          // CSV ctr is already a percent value in this repo's export.
          ctr: Number(cols[idx("ctr")] || 0),
          position: Number(cols[idx("position")] || 0),
        });
      }
    }
  }

  return { rows, gate };
}

function topicFromUrl(url) {
  try {
    const { pathname } = new URL(url);
    const slug = pathname.replace(/\/$/, "").split("/").pop() || "home";
    return slug
      .split("-")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  } catch {
    return url;
  }
}

// Prioritize: page-1 positions with the most impressions and lowest CTR rise
// to the top, because those are the fastest clicks-per-effort wins.
function scoreCandidate(row) {
  const positionFactor = Math.max(0, 1 - row.position / 20);
  return row.impressions * (1 + positionFactor);
}

function selectCandidates(rows, args) {
  return rows
    .filter(
      (r) =>
        r.impressions >= args.minImpressions &&
        r.ctr <= args.maxCtr &&
        r.position > 0 &&
        r.position <= args.maxPosition
    )
    .map((r) => ({ ...r, score: scoreCandidate(r) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, args.limit);
}

async function draftCopyWithOpenRouter(candidate, apiKey) {
  const topic = topicFromUrl(candidate.url);
  const prompt = `You are an SEO copywriter for breakyoursolarcontract.com, a legal resource that helps homeowners cancel solar contracts, leases, PPAs, and loans.

A page is ranking at Google position ${candidate.position.toFixed(1)} with ${candidate.impressions} impressions but only a ${candidate.ctr.toFixed(2)}% click-through rate. The copy in search results is not compelling enough.

Page topic (from URL): ${topic}
URL: ${candidate.url}

Write 2 improved options. Each option needs:
- "title": an SEO title tag, max 60 characters, primary keyword first, compelling and specific.
- "description": a meta description, 140-155 characters, includes the primary keyword and a clear call to action (e.g. "Free case review").

Constraints: factual, no guarantees of outcome, no hype that violates legal-advertising norms. Return STRICT JSON only, no markdown:
{"options":[{"title":"...","description":"..."},{"title":"...","description":"..."}]}`;

  for (const model of OPENROUTER_MODELS) {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json",
          "HTTP-Referer": DEFAULT_BASE_URL,
          "X-Title": "Solar Freedom CTR Rescue",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 600,
          temperature: 0.7,
        }),
      });
      if (!response.ok) continue;
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content?.trim();
      if (!content) continue;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) continue;
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed.options) && parsed.options.length) {
        return { model, options: parsed.options };
      }
    } catch {
      // Try the next model in the fallback chain.
    }
  }
  return null;
}

function buildMarkdown(candidates, args, aiUsed, measurementGate) {
  const lines = [
    "# CTR Rescue Queue",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Measurement state: ${measurementGate.state}${measurementGate.usable ? "" : " (blocked; refresh required)"}`,
    "",
    `Filters: impressions >= ${args.minImpressions}, CTR <= ${args.maxCtr}%, position <= ${args.maxPosition}.`,
    aiUsed
      ? "OpenRouter drafted title/description options below. Review before applying — copy is a suggestion, not an auto-publish."
      : "Run with `--ai` and `OPENROUTER_API_KEY` set to auto-draft title/description options.",
    "",
    `Candidates: ${candidates.length}`,
    "",
  ];

  candidates.forEach((c, i) => {
    lines.push(`## ${i + 1}. ${topicFromUrl(c.url)}`);
    lines.push("");
    lines.push(`- URL: ${c.url}`);
    lines.push(
      `- Impressions: ${c.impressions} | Clicks: ${c.clicks} | CTR: ${c.ctr.toFixed(2)}% | Position: ${c.position.toFixed(1)}`
    );
    if (c.suggestions?.options?.length) {
      lines.push(`- Drafted by: ${c.suggestions.model}`);
      c.suggestions.options.forEach((opt, oi) => {
        lines.push(
          `  - Option ${oi + 1} title (${(opt.title || "").length} chars): ${opt.title}`
        );
        lines.push(
          `  - Option ${oi + 1} description (${(opt.description || "").length} chars): ${opt.description}`
        );
      });
    }
    lines.push("");
  });

  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { rows, gate: measurementGate } = await loadPerformance(args);
  if (rows.length === 0) {
    console.warn("[CTR Rescue] No usable GSC performance data. The queue will remain blocked until a fresh snapshot exists.");
  }

  const candidates = selectCandidates(rows, args);
  const apiKey = process.env.OPENROUTER_API_KEY;
  const aiRequested = args.ai && Boolean(apiKey);

  if (aiRequested) {
    for (const candidate of candidates) {
      candidate.suggestions = await draftCopyWithOpenRouter(candidate, apiKey);
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    filters: {
      minImpressions: args.minImpressions,
      maxCtr: args.maxCtr,
      maxPosition: args.maxPosition,
      limit: args.limit,
    },
    aiUsed: aiRequested,
    measurement: measurementGate,
    blocked: !measurementGate.usable,
    candidateCount: candidates.length,
    candidates,
  };

  await fs.mkdir(path.dirname(args.outJson), { recursive: true });
  await fs.writeFile(args.outJson, JSON.stringify(payload, null, 2), "utf-8");
  await fs.writeFile(args.outMd, buildMarkdown(candidates, args, aiRequested, measurementGate), "utf-8");

  console.log(`🎯 CTR Rescue: ${candidates.length} candidates`);
  console.log(`   ${args.outMd}`);
  if (!apiKey) {
    console.log("   (set OPENROUTER_API_KEY and pass --ai to auto-draft copy)");
  }
}

main().catch((err) => {
  console.error("[CTR Rescue] Failed:", err);
  process.exit(1);
});
