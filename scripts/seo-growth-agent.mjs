/**
 * SEO Growth Agent
 *
 * Agent loop:
 *   1. Run the sitemap SEO audit.
 *   2. Convert findings into a prioritized action queue.
 *   3. Write a heartbeat markdown file and machine-readable state.
 *   4. Optionally ask OpenRouter for a strategic narrative.
 *
 * This is intentionally safe-by-default: it diagnoses and queues work, but does
 * not apply content/code changes unless a future explicit apply mode is added.
 *
 * Examples:
 *   pnpm seo:agent
 *   pnpm seo:agent -- --base http://localhost:3010 --ai
 *   pnpm seo:agent -- --limit 100 --heartbeat reports/seo-agent/HEARTBEAT.md
 */
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEFAULT_BASE_URL = process.env.SEO_AGENT_BASE_URL || "http://localhost:3010";
const DEFAULT_REPORT = path.resolve(ROOT, "reports/seo-agent/latest-agent-audit.json");
const DEFAULT_STATE = path.resolve(ROOT, "reports/seo-agent/agent-state.json");
const DEFAULT_HEARTBEAT = path.resolve(ROOT, "reports/seo-agent/HEARTBEAT.md");
const DEFAULT_ACTION_QUEUE = path.resolve(ROOT, "reports/seo-agent/ACTION_QUEUE.md");
const DEFAULT_MODEL = process.env.SEO_AGENT_MODEL || "openrouter/owl-alpha";

const ACTION_LIBRARY = {
  source_semantic_shells: {
    title: "Upgrade prerendered shells with crawler-visible semantic HTML",
    category: "technical_seo",
    impact: "critical",
    why: "Most sitemap pages have unique metadata but empty body HTML before JavaScript. Crawlers and AI answer engines get a weak source document.",
    appliesTo: ["missing_h1", "thin_content", "missing_json_ld"],
    suggestedOwner: "scripts/prerender.mjs",
    acceptance: [
      "Prerendered page HTML includes one H1 matching the page intent.",
      "Each page has at least 350 words of source-visible body copy or an intentional exception.",
      "Each page includes page-specific JSON-LD before client JavaScript runs.",
    ],
  },
  internal_link_graph: {
    title: "Build source-visible internal link graph into prerendered pages",
    category: "internal_links",
    impact: "high",
    why: "Internal links are currently mostly React-rendered. The source HTML should expose related company, city, state law, and blog links.",
    appliesTo: ["low_internal_links"],
    suggestedOwner: "scripts/prerender.mjs",
    acceptance: [
      "Every city page links to its state law page, top company pages, and 3 related blog posts.",
      "Every company page links to related loan/lease/legal content and top affected cities.",
      "Every blog post exposes at least 5 relevant internal links in source HTML.",
    ],
  },
  metadata_tuning: {
    title: "Tune overlong, short, and duplicate SERP metadata",
    category: "on_page",
    impact: "medium",
    why: "Long titles/descriptions truncate in SERPs; duplicates waste query targeting and make GSC diagnosis noisy.",
    appliesTo: ["long_title", "short_title", "long_description", "short_description", "duplicate_title", "duplicate_description"],
    suggestedOwner: "scripts/prerender.mjs + client/src/data",
    acceptance: [
      "Priority titles land between 35 and 65 characters.",
      "Priority descriptions land between 110 and 165 characters.",
      "No duplicated title or description remains in the top-priority set.",
    ],
  },
  canonical_alignment: {
    title: "Keep sitemap, redirects, and canonicals aligned",
    category: "technical_seo",
    impact: "critical",
    why: "Sitemap URLs should return final 200 HTML and self-canonicalize. Redirect/canonical disagreement can slow or prevent indexing.",
    appliesTo: ["status_error", "canonical_mismatch", "missing_canonical"],
    suggestedOwner: "server/_core/vite.ts + scripts/generate-sitemap.mjs",
    acceptance: [
      "Sitemap URLs return 200 without redirect.",
      "Canonical paths match sitemap paths exactly.",
      "Trailing slash policy is consistent across generated files and runtime serving.",
    ],
  },
  indexability_guardrails: {
    title: "Add indexability guardrails to the build pipeline",
    category: "tooling",
    impact: "high",
    why: "SEO regressions keep reappearing. The build should fail or warn loudly when crawler-facing HTML regresses.",
    appliesTo: ["noindex", "status_error", "missing_title", "missing_description", "missing_h1"],
    suggestedOwner: "scripts/seo-agent-audit.mjs",
    acceptance: [
      "Production build runs the audit against the built server or static output.",
      "Critical issues produce a non-zero exit in CI once current known debt is baselined.",
      "Heartbeat stores trend deltas run over run.",
    ],
  },
};

function parseArgs(argv) {
  const args = {
    base: DEFAULT_BASE_URL,
    limit: Number(process.env.SEO_AGENT_LIMIT || 0),
    concurrency: Number(process.env.SEO_AGENT_CONCURRENCY || 10),
    report: DEFAULT_REPORT,
    state: DEFAULT_STATE,
    heartbeat: DEFAULT_HEARTBEAT,
    actionQueue: DEFAULT_ACTION_QUEUE,
    ai: process.env.SEO_AGENT_AI === "true",
    model: DEFAULT_MODEL,
    skipAudit: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--base" && next) args.base = next;
    if (arg === "--limit" && next) args.limit = Number(next);
    if (arg === "--concurrency" && next) args.concurrency = Number(next);
    if (arg === "--report" && next) args.report = path.resolve(ROOT, next);
    if (arg === "--state" && next) args.state = path.resolve(ROOT, next);
    if (arg === "--heartbeat" && next) args.heartbeat = path.resolve(ROOT, next);
    if (arg === "--action-queue" && next) args.actionQueue = path.resolve(ROOT, next);
    if (arg === "--model" && next) args.model = next;
    if (arg === "--ai") args.ai = true;
    if (arg === "--skip-audit") args.skipAudit = true;
  }

  return args;
}

function runNodeScript(scriptPath, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      cwd: ROOT,
      stdio: "inherit",
      shell: false,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(scriptPath)} exited with code ${code}`));
    });
  });
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

function groupIssueCounts(report) {
  const counts = new Map();
  for (const page of report.pages || []) {
    for (const issue of page.issues || []) {
      counts.set(issue.code, (counts.get(issue.code) || 0) + 1);
    }
  }
  return counts;
}

function scoreAction(action, issueCounts) {
  return action.appliesTo.reduce((sum, code) => sum + (issueCounts.get(code) || 0), 0);
}

function buildActionQueue(report) {
  const issueCounts = groupIssueCounts(report);
  const actions = Object.entries(ACTION_LIBRARY)
    .map(([id, action]) => ({
      id,
      ...action,
      affectedPages: scoreAction(action, issueCounts),
      issueCodes: action.appliesTo.filter((code) => issueCounts.has(code)),
    }))
    .filter((action) => action.affectedPages > 0)
    .sort((a, b) => {
      const impactRank = { critical: 3, high: 2, medium: 1, low: 0 };
      return impactRank[b.impact] - impactRank[a.impact] || b.affectedPages - a.affectedPages;
    });

  const pageQueue = [...(report.pages || [])]
    .filter((page) => page.issues?.length)
    .sort((a, b) => {
      const aImpact = a.issues.reduce((sum, issue) => sum + (issue.impact || 0), 0);
      const bImpact = b.issues.reduce((sum, issue) => sum + (issue.impact || 0), 0);
      return bImpact - aImpact || a.score - b.score;
    })
    .slice(0, 25)
    .map((page) => ({
      path: page.path,
      type: page.type,
      score: page.score,
      issues: page.issues.slice(0, 6).map((issue) => issue.code),
      title: page.metrics?.title || "",
    }));

  return { actions, pageQueue };
}

function diffRuns(current, previous) {
  if (!previous?.lastRun) return null;
  return {
    pageCount: current.pageCount - (previous.lastRun.pageCount || 0),
    avgScore: current.avgScore - (previous.lastRun.avgScore || 0),
    pagesWithIssues: current.pagesWithIssues - (previous.lastRun.pagesWithIssues || 0),
  };
}

async function maybeAskOpenRouter({ report, queue, args }) {
  if (!args.ai) return "";
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return "OpenRouter strategy skipped: OPENROUTER_API_KEY is not set in this environment.";
  }

  const payload = {
    generatedAt: report.generatedAt,
    pageCount: report.pageCount,
    avgScore: report.avgScore,
    pagesWithIssues: report.pagesWithIssues,
    topIssues: report.topIssues,
    byType: report.byType,
    topActions: queue.actions.slice(0, 5).map((action) => ({
      id: action.id,
      title: action.title,
      affectedPages: action.affectedPages,
      issueCodes: action.issueCodes,
    })),
    priorityPages: queue.pageQueue.slice(0, 10),
  };

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://breakyoursolarcontract.com",
      "X-Title": "Solar Freedom SEO Growth Agent",
    },
    body: JSON.stringify({
      model: args.model,
      temperature: 0.2,
      max_tokens: 1200,
      messages: [
        {
          role: "system",
          content: "You are the SEO growth strategist for Solar Freedom. Be concrete, skeptical, and implementation-oriented. Avoid generic SEO advice.",
        },
        {
          role: "user",
          content: `Turn this audit into a concise execution note for the next heartbeat. Include: highest leverage fix, why it matters, next 3 tasks, and risks.\n\n${JSON.stringify(payload, null, 2)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    return `OpenRouter strategy failed: ${response.status} ${response.statusText} - ${await response.text()}`;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "OpenRouter returned no strategy text.";
}

function formatIssueList(issues) {
  if (!issues?.length) return "- None";
  return issues.map((issue) => `- \`${issue.code}\`: ${issue.count} page(s)`).join("\n");
}

function formatHeartbeat({ report, queue, previous, strategyNote }) {
  const delta = diffRuns(report, previous);
  const deltaLine = delta
    ? `Score ${delta.avgScore >= 0 ? "+" : ""}${delta.avgScore}, pages with issues ${delta.pagesWithIssues >= 0 ? "+" : ""}${delta.pagesWithIssues}, page count ${delta.pageCount >= 0 ? "+" : ""}${delta.pageCount}`
    : "No previous heartbeat state found.";

  const topAction = queue.actions[0];
  const nextActions = queue.actions.slice(0, 5).map((action, index) => {
    return `${index + 1}. **${action.title}** (${action.impact}, ${action.affectedPages} issue hits)\n   - Why: ${action.why}\n   - Owner: \`${action.suggestedOwner}\`\n   - Issue codes: ${action.issueCodes.map((code) => `\`${code}\``).join(", ")}`;
  }).join("\n");

  const priorityPages = queue.pageQueue.slice(0, 12).map((page, index) => (
    `${index + 1}. \`${page.path}\` - ${page.score}/100 - ${page.issues.map((issue) => `\`${issue}\``).join(", ")}`
  )).join("\n");

  return `# SEO Growth Agent Heartbeat

Generated: ${report.generatedAt}
Base URL: ${report.baseUrl}

## Mission

Increase rankings for breakyoursolarcontract.com through a repeatable agent loop:

1. Crawl every sitemap URL.
2. Detect technical, on-page, schema, internal-link, and content gaps.
3. Prioritize actions by impact and page coverage.
4. Produce a queue the implementation agent can safely execute.
5. Track heartbeat deltas so regressions cannot hide.

## Current Pulse

- Pages audited: ${report.pageCount}
- Average score: ${report.avgScore}/100
- Pages with issues: ${report.pagesWithIssues}
- Delta: ${deltaLine}

## Top Issue Patterns

${formatIssueList(report.topIssues)}

## Highest Leverage Move

${topAction ? `**${topAction.title}**\n\n${topAction.why}\n\nAcceptance:\n${topAction.acceptance.map((item) => `- ${item}`).join("\n")}` : "No queued action."}

## Action Queue

${nextActions || "No actions queued."}

## Priority Pages

${priorityPages || "No priority pages queued."}

## AI Strategy Note

${strategyNote || "AI strategy not requested. Run with `--ai` when `OPENROUTER_API_KEY` is available."}

## Guardrails

- Diagnose by default; do not auto-apply broad edits until an explicit apply mode exists.
- Any future apply mode should write a patch pack, run \`pnpm check\`, rebuild, and rerun this heartbeat before marking work complete.
- Do not chase new content volume until crawler-visible HTML, schema, and internal links are healthy.
`;
}

function formatActionQueue(queue) {
  const actions = queue.actions.map((action, index) => {
    return `## ${index + 1}. ${action.title}

- ID: \`${action.id}\`
- Category: \`${action.category}\`
- Impact: \`${action.impact}\`
- Affected issue hits: ${action.affectedPages}
- Issue codes: ${action.issueCodes.map((code) => `\`${code}\``).join(", ")}
- Suggested owner: \`${action.suggestedOwner}\`

Why:
${action.why}

Acceptance:
${action.acceptance.map((item) => `- ${item}`).join("\n")}
`;
  }).join("\n");

  const pages = queue.pageQueue.map((page, index) => (
    `${index + 1}. \`${page.path}\` (${page.type}, ${page.score}/100): ${page.issues.map((issue) => `\`${issue}\``).join(", ")}`
  )).join("\n");

  return `# SEO Growth Agent Action Queue

This file is generated by \`pnpm seo:agent\`.

${actions || "No action groups queued."}

# Priority Page Queue

${pages || "No page-level actions queued."}
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await fs.mkdir(path.dirname(args.report), { recursive: true });

  if (!args.skipAudit) {
    const auditArgs = ["scripts/seo-agent-audit.mjs", "--base", args.base, "--concurrency", String(args.concurrency), "--out", args.report];
    if (args.limit > 0) auditArgs.push("--limit", String(args.limit));
    await runNodeScript(path.resolve(ROOT, auditArgs.shift()), auditArgs);
  }

  const report = await readJson(args.report, null);
  if (!report) throw new Error(`Could not read audit report at ${args.report}`);

  const previous = await readJson(args.state, null);
  const queue = buildActionQueue(report);
  const strategyNote = await maybeAskOpenRouter({ report, queue, args });

  const state = {
    version: 1,
    lastRun: {
      generatedAt: report.generatedAt,
      baseUrl: report.baseUrl,
      pageCount: report.pageCount,
      avgScore: report.avgScore,
      pagesWithIssues: report.pagesWithIssues,
      topIssues: report.topIssues,
      topAction: queue.actions[0]?.id || null,
    },
    actionCount: queue.actions.length,
    priorityPageCount: queue.pageQueue.length,
  };

  await fs.mkdir(path.dirname(args.state), { recursive: true });
  await fs.writeFile(args.state, `${JSON.stringify(state, null, 2)}\n`, "utf-8");
  await fs.writeFile(args.heartbeat, formatHeartbeat({ report, queue, previous, strategyNote }), "utf-8");
  await fs.writeFile(args.actionQueue, formatActionQueue(queue), "utf-8");

  console.log("\nSEO Growth Agent");
  console.log("================");
  console.log(`Heartbeat: ${path.relative(ROOT, args.heartbeat)}`);
  console.log(`Action queue: ${path.relative(ROOT, args.actionQueue)}`);
  console.log(`State: ${path.relative(ROOT, args.state)}`);
  console.log(`Top action: ${queue.actions[0]?.title || "none"}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
