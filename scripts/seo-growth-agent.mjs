/**
 * SEO Growth Agent
 *
 * Agent loop:
 *   1. Run the sitemap SEO audit.
 *   2. Convert findings into a prioritized action queue.
 *   3. Write a heartbeat markdown file and machine-readable state.
 *   4. Optionally apply safe deterministic fixes.
 *   5. Optionally ask OpenRouter for a strategic narrative.
 *
 * This is intentionally safe-by-default: it diagnoses and queues work unless
 * --apply is passed. Apply mode is limited to deterministic, narrow fixers.
 *
 * Examples:
 *   pnpm seo:agent
 *   pnpm seo:agent -- --base http://localhost:3010 --ai
 *   pnpm seo:agent -- --base https://breakyoursolarcontract.com --apply --verify
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
const DEFAULT_APPLY_REPORT = path.resolve(ROOT, "reports/seo-agent/APPLY_REPORT.md");
const DEFAULT_APPLY_JSON = path.resolve(ROOT, "reports/seo-agent/latest-apply-result.json");
const DEFAULT_MODEL = process.env.SEO_AGENT_MODEL || "openrouter/free";
const CANONICAL_DOMAIN = "https://breakyoursolarcontract.com";
const LEGACY_WWW_DOMAIN = ["https://www", "breakyoursolarcontract.com"].join(".");
const SAFE_APPLY_DIRS = ["client", "server", "scripts"];
const SAFE_APPLY_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".md", ".html"]);

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
    appliesTo: ["status_error", "canonical_mismatch", "canonical_origin_mismatch", "missing_canonical"],
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
    apply: false,
    dryRun: false,
    verify: false,
    applyReport: DEFAULT_APPLY_REPORT,
    applyJson: DEFAULT_APPLY_JSON,
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
    if (arg === "--apply") args.apply = true;
    if (arg === "--dry-run") args.dryRun = true;
    if (arg === "--verify") args.verify = true;
    if (arg === "--apply-report" && next) args.applyReport = path.resolve(ROOT, next);
    if (arg === "--apply-json" && next) args.applyJson = path.resolve(ROOT, next);
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

function runCommand(command, args, label) {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === "win32";
    const child = spawn(
      isWindows ? process.env.ComSpec || "cmd.exe" : command,
      isWindows ? ["/d", "/s", "/c", [command, ...args].map(quoteWindowsShellArg).join(" ")] : args,
      {
        cwd: ROOT,
        stdio: "inherit",
        shell: false,
      }
    );
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label || command} exited with code ${code}`));
    });
  });
}

function quoteWindowsShellArg(value) {
  if (/^[A-Za-z0-9_./:=+-]+$/.test(value)) return value;
  let quoted = '"';
  let backslashes = 0;
  for (const character of value) {
    if (character === "\\") {
      backslashes += 1;
      continue;
    }
    if (character === '"') {
      quoted += "\\".repeat(backslashes * 2 + 1) + '"';
    } else {
      quoted += "\\".repeat(backslashes) + character;
    }
    backslashes = 0;
  }
  return quoted + "\\".repeat(backslashes * 2) + '"';
}

function corepackCommand() {
  return process.platform === "win32" ? "corepack.cmd" : "corepack";
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listSafeApplyFiles() {
  const files = [];

  async function walk(dirPath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === "reports") continue;
      const entryPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        await walk(entryPath);
      } else if (entry.isFile() && SAFE_APPLY_EXTENSIONS.has(path.extname(entry.name))) {
        files.push(entryPath);
      }
    }
  }

  for (const dir of SAFE_APPLY_DIRS) {
    const dirPath = path.resolve(ROOT, dir);
    if (await pathExists(dirPath)) await walk(dirPath);
  }

  return files;
}

async function normalizeCanonicalDomainReferences({ dryRun }) {
  const files = await listSafeApplyFiles();
  const changedFiles = [];
  let replacements = 0;

  for (const filePath of files) {
    const original = await fs.readFile(filePath, "utf-8");
    const matchCount = original.split(LEGACY_WWW_DOMAIN).length - 1;
    if (matchCount === 0) continue;

    replacements += matchCount;
    changedFiles.push(path.relative(ROOT, filePath));

    if (!dryRun) {
      await fs.writeFile(filePath, original.replaceAll(LEGACY_WWW_DOMAIN, CANONICAL_DOMAIN), "utf-8");
    }
  }

  return {
    id: "normalize_canonical_domain_references",
    title: "Normalize canonical domain references",
    changed: changedFiles.length > 0,
    replacements,
    files: changedFiles,
    dryRun,
    message: changedFiles.length
      ? `Replaced ${replacements} legacy www canonical domain reference(s).`
      : "No legacy www canonical domain references found.",
  };
}

async function runSafeApply({ args, queue }) {
  const relevantIssueCodes = new Set(queue.actions.flatMap((action) => action.issueCodes));
  const shouldRunCanonicalFixer = relevantIssueCodes.has("canonical_origin_mismatch") || relevantIssueCodes.size === 0;
  const fixes = [];

  if (shouldRunCanonicalFixer) {
    fixes.push(await normalizeCanonicalDomainReferences({ dryRun: args.dryRun }));
  }

  const result = {
    generatedAt: new Date().toISOString(),
    mode: "safe",
    dryRun: args.dryRun,
    changed: fixes.some((fix) => fix.changed),
    changedFiles: [...new Set(fixes.flatMap((fix) => fix.files))],
    fixes,
    verification: args.verify && !args.dryRun
      ? ["pnpm check", "pnpm build"]
      : [],
  };

  await fs.mkdir(path.dirname(args.applyJson), { recursive: true });
  await fs.writeFile(args.applyJson, `${JSON.stringify(result, null, 2)}\n`, "utf-8");
  await fs.writeFile(args.applyReport, formatApplyReport(result), "utf-8");

  if (args.verify && !args.dryRun) {
    await runCommand(corepackCommand(), ["pnpm", "check"], "pnpm check");
    await runCommand(corepackCommand(), ["pnpm", "build"], "pnpm build");
  }

  return result;
}

function formatApplyReport(result) {
  const fixes = result.fixes.map((fix) => {
    const files = fix.files.length ? fix.files.map((file) => `  - \`${file}\``).join("\n") : "  - None";
    return `## ${fix.title}

- ID: \`${fix.id}\`
- Changed: ${fix.changed ? "yes" : "no"}
- Replacements: ${fix.replacements}
- Dry run: ${fix.dryRun ? "yes" : "no"}
- Message: ${fix.message}

Files:
${files}
`;
  }).join("\n");

  return `# SEO Growth Agent Apply Report

Generated: ${result.generatedAt}
Mode: safe
Dry run: ${result.dryRun ? "yes" : "no"}
Changed files: ${result.changedFiles.length}

${fixes || "No safe fixers ran."}
`;
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
    return `OpenRouter strategy failed (HTTP ${response.status}).`;
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
5. Apply safe deterministic fixes when explicitly run with \`--apply\`.
6. Track heartbeat deltas so regressions cannot hide.

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

- Diagnose by default; apply fixes only when explicitly run with \`--apply\`.
- Apply mode is limited to deterministic, narrow fixers and writes \`reports/seo-agent/APPLY_REPORT.md\`.
- Verification mode runs \`pnpm check\` and \`pnpm build\` after a successful safe apply.
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
  const applyResult = args.apply ? await runSafeApply({ args, queue }) : null;

  const state = {
    version: 2,
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
    lastApply: applyResult ? {
      generatedAt: applyResult.generatedAt,
      mode: applyResult.mode,
      dryRun: applyResult.dryRun,
      changed: applyResult.changed,
      changedFiles: applyResult.changedFiles,
    } : previous?.lastApply || null,
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
  if (applyResult) {
    console.log(`Apply report: ${path.relative(ROOT, args.applyReport)}`);
    console.log(`Apply changed files: ${applyResult.changedFiles.length}`);
  }
  console.log(`Top action: ${queue.actions[0]?.title || "none"}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
