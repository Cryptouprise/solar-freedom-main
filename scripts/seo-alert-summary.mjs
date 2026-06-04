/**
 * SEO Alert Summary
 *
 * Reads generated SEO agent reports and writes a GitHub Issue-ready summary.
 * Used by the scheduled SEO heartbeat workflow.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEFAULT_AUDIT = path.resolve(ROOT, "reports/seo-agent/latest-agent-audit.json");
const DEFAULT_INDEXING = path.resolve(ROOT, "reports/seo-agent/latest-indexing-queue.json");
const DEFAULT_INTERNAL_LINKS = path.resolve(ROOT, "reports/seo-agent/latest-internal-links.json");
const DEFAULT_BACKLINKS = path.resolve(ROOT, "reports/seo-agent/latest-backlinks.json");
const DEFAULT_OUT_MD = path.resolve(ROOT, "reports/seo-agent/GITHUB_ISSUE.md");
const DEFAULT_OUT_JSON = path.resolve(ROOT, "reports/seo-agent/latest-alert-summary.json");

function parseArgs(argv) {
  const args = {
    audit: DEFAULT_AUDIT,
    indexing: DEFAULT_INDEXING,
    internalLinks: DEFAULT_INTERNAL_LINKS,
    backlinks: DEFAULT_BACKLINKS,
    outMd: DEFAULT_OUT_MD,
    outJson: DEFAULT_OUT_JSON,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--audit" && next) args.audit = path.resolve(ROOT, next);
    if (arg === "--indexing" && next) args.indexing = path.resolve(ROOT, next);
    if (arg === "--internal-links" && next) args.internalLinks = path.resolve(ROOT, next);
    if (arg === "--backlinks" && next) args.backlinks = path.resolve(ROOT, next);
    if (arg === "--out-md" && next) args.outMd = path.resolve(ROOT, next);
    if (arg === "--out-json" && next) args.outJson = path.resolve(ROOT, next);
  }

  return args;
}

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

function formatIssueList(issues = []) {
  if (!issues.length) return "- None";
  return issues.map((issue) => `- \`${issue.code}\`: ${issue.count} page(s)`).join("\n");
}

function formatPages(pages = []) {
  if (!pages.length) return "- None";
  return pages.slice(0, 10).map((page, index) => {
    const issues = page.issues?.map((issue) => `\`${issue.code || issue}\``).join(", ") || "no issue details";
    return `${index + 1}. \`${page.path}\` - ${page.score}/100 - ${issues}`;
  }).join("\n");
}

function formatIndexingItems(items = []) {
  if (!items.length) return "- None";
  return items.slice(0, 10).map((item, index) => {
    const perf = item.performance
      ? `${item.performance.impressions} impressions, ${(item.performance.ctr * 100).toFixed(2)}% CTR, avg position ${item.performance.position.toFixed(1)}`
      : "no GSC performance row";
    return `${index + 1}. \`${item.path}\` (${item.type}) - ${perf}`;
  }).join("\n");
}

function formatInternalLinks(items = []) {
  if (!items.length) return "- None";
  return items.slice(0, 10).map((item, index) => {
    const sources = (item.sources || []).map((s) => `\`${s.path}\``).join(", ") || "no source suggestion";
    return `${index + 1}. \`${item.target}\` (${item.type}, ${item.indexed ? "indexed" : "unindexed"}) ← ${sources}`;
  }).join("\n");
}

function formatBacklinks(items = []) {
  const flagged = items.filter((r) => ["domain-only", "missing", "unreachable"].includes(r.status));
  if (!flagged.length) return "- None needing attention";
  return flagged.slice(0, 10).map((r, index) => {
    return `${index + 1}. ${r.status} — ${r.url || "(no url)"} → \`${r.target || "(no target)"}\`: ${r.detail}`;
  }).join("\n");
}

function buildSummary({ audit, indexing, internalLinks, backlinks }) {
  const pagesWithIssues = Number(audit?.pagesWithIssues || 0);
  const requestIndexingCount = Number(indexing?.summary?.requestIndexing || 0);
  const refreshCount = Number(indexing?.summary?.refresh || 0);
  const indexNowCount = Number(indexing?.summary?.indexNow || 0);
  const internalLinkOpps = Number(internalLinks?.summary?.queued || 0);
  const unindexedTargets = Number(internalLinks?.summary?.unindexedQueued || 0);
  const backlinksTotal = Number(backlinks?.summary?.total || 0);
  const backlinksVerified = Number(backlinks?.summary?.verified || 0);
  const backlinksBroken =
    Number(backlinks?.summary?.domainOnly || 0) +
    Number(backlinks?.summary?.missing || 0) +
    Number(backlinks?.summary?.unreachable || 0);
  const actionRequired =
    pagesWithIssues > 0 ||
    requestIndexingCount > 0 ||
    refreshCount > 0 ||
    indexNowCount > 0 ||
    internalLinkOpps > 0 ||
    backlinksBroken > 0;
  const severity = pagesWithIssues > 0 ? "technical_issues" : actionRequired ? "indexing_opportunities" : "clean";

  return {
    generatedAt: new Date().toISOString(),
    actionRequired,
    severity,
    audit: {
      generatedAt: audit?.generatedAt || null,
      baseUrl: audit?.baseUrl || null,
      pageCount: audit?.pageCount || 0,
      avgScore: audit?.avgScore || 0,
      pagesWithIssues,
      topIssues: audit?.topIssues || [],
      priorityPages: audit?.priorityPages || [],
    },
    indexing: {
      generatedAt: indexing?.generatedAt || null,
      sitemapUrls: indexing?.summary?.sitemapUrls || 0,
      performanceRows: indexing?.summary?.performanceRows || 0,
      requestIndexing: requestIndexingCount,
      refresh: refreshCount,
      indexNow: indexNowCount,
      requestIndexingItems: indexing?.requestIndexing || [],
      refreshItems: indexing?.refresh || [],
      indexNowItems: indexing?.indexNow || [],
    },
    internalLinks: {
      generatedAt: internalLinks?.generatedAt || null,
      queued: internalLinkOpps,
      unindexedQueued: unindexedTargets,
      items: internalLinks?.queue || [],
    },
    backlinks: {
      generatedAt: backlinks?.generatedAt || null,
      total: backlinksTotal,
      verified: backlinksVerified,
      broken: backlinksBroken,
      items: backlinks?.results || [],
    },
  };
}

function formatMarkdown(summary) {
  const status = summary.severity === "technical_issues"
    ? "Technical SEO issues found"
    : summary.severity === "indexing_opportunities"
      ? "Indexing opportunities queued"
      : "Clean";

  return `# SEO Agent Daily Heartbeat

Status: **${status}**
Generated: ${summary.generatedAt}

## Technical Audit

- Base URL: ${summary.audit.baseUrl || "unknown"}
- Pages audited: ${summary.audit.pageCount}
- Average score: ${summary.audit.avgScore}/100
- Pages with issues: ${summary.audit.pagesWithIssues}

Top issues:

${formatIssueList(summary.audit.topIssues)}

Priority pages:

${formatPages(summary.audit.priorityPages)}

## Indexing Queue

- Sitemap URLs: ${summary.indexing.sitemapUrls}
- URLs with available GSC performance rows: ${summary.indexing.performanceRows}
- GSC request-indexing candidates: ${summary.indexing.requestIndexing}
- SERP/content refresh candidates: ${summary.indexing.refresh}
- IndexNow candidates: ${summary.indexing.indexNow}

Top GSC request-indexing candidates:

${formatIndexingItems(summary.indexing.requestIndexingItems)}

Top SERP/content refresh candidates:

${formatIndexingItems(summary.indexing.refreshItems)}

## Internal-Link Opportunities

- Opportunities queued: ${summary.internalLinks.queued} (unindexed targets: ${summary.internalLinks.unindexedQueued})

Top internal-link opportunities:

${formatInternalLinks(summary.internalLinks.items)}

## Backlinks

- Registered: ${summary.backlinks.total} | Verified: ${summary.backlinks.verified} | Needing attention: ${summary.backlinks.broken}

Backlinks needing attention:

${formatBacklinks(summary.backlinks.items)}

## What To Do

1. If technical issues are listed, ask Codex to fix the SEO heartbeat issue and open a PR.
2. If only indexing opportunities are listed, ask Manus to sync/publish latest main, then use the queue in GSC or Manus' authenticated GSC workflow.
3. After production publish, resubmit \`https://breakyoursolarcontract.com/sitemap.xml\` in Google Search Console.

## Commands Run

\`\`\`bash
pnpm seo:agent -- --base https://breakyoursolarcontract.com
pnpm seo:indexing
pnpm seo:internal-links
pnpm seo:backlinks
pnpm seo:alert-summary
\`\`\`
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const audit = await readJson(args.audit);
  const indexing = await readJson(args.indexing);
  const internalLinks = await readJson(args.internalLinks);
  const backlinks = await readJson(args.backlinks);
  const summary = buildSummary({ audit, indexing, internalLinks, backlinks });

  await fs.mkdir(path.dirname(args.outMd), { recursive: true });
  await fs.writeFile(args.outJson, `${JSON.stringify(summary, null, 2)}\n`, "utf-8");
  await fs.writeFile(args.outMd, formatMarkdown(summary), "utf-8");

  console.log("\nSEO Alert Summary");
  console.log("=================");
  console.log(`Action required: ${summary.actionRequired ? "yes" : "no"}`);
  console.log(`Severity: ${summary.severity}`);
  console.log(`Issue body: ${path.relative(ROOT, args.outMd)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
