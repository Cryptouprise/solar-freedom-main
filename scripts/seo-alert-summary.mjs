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
const DEFAULT_GSC_STATUS = path.resolve(ROOT, "reports/seo-agent/gsc-status.json");
const DEFAULT_OUT_MD = path.resolve(ROOT, "reports/seo-agent/GITHUB_ISSUE.md");
const DEFAULT_OUT_JSON = path.resolve(ROOT, "reports/seo-agent/latest-alert-summary.json");

function parseArgs(argv) {
  const args = {
    audit: DEFAULT_AUDIT,
    indexing: DEFAULT_INDEXING,
    internalLinks: DEFAULT_INTERNAL_LINKS,
    backlinks: DEFAULT_BACKLINKS,
    gscStatus: DEFAULT_GSC_STATUS,
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
    if (arg === "--gsc-status" && next) args.gscStatus = path.resolve(ROOT, next);
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
    const visibility = item.performanceObserved ? "performance observed" : "performance unknown";
    return `${index + 1}. \`${item.target}\` (${item.type}, ${visibility}; index status not measured) ← ${sources}`;
  }).join("\n");
}

function formatBacklinks(items = []) {
  const flagged = items.filter((r) => ["domain-only", "missing", "unreachable"].includes(r.status));
  if (!flagged.length) return "- None needing attention";
  return flagged.slice(0, 10).map((r, index) => {
    return `${index + 1}. ${r.status} — ${r.url || "(no url)"} → \`${r.target || "(no target)"}\`: ${r.detail}`;
  }).join("\n");
}

function buildSummary({ audit, indexing, internalLinks, backlinks, gscStatus }) {
  const pagesWithIssues = Number(audit?.pagesWithIssues || 0);
  const requestIndexingCount = Number(indexing?.summary?.requestIndexing || 0);
  const refreshCount = Number(indexing?.summary?.refresh || 0);
  const indexNowCount = Number(indexing?.summary?.indexNow || 0);
  const internalLinkOpps = Number(internalLinks?.summary?.queued || 0);
  const performanceUnknownTargets = Number(internalLinks?.summary?.performanceUnknownQueued || 0);
  const measurementUsable = gscStatus?.usable === true;
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
    backlinksBroken > 0 ||
    !measurementUsable;
  const severity = pagesWithIssues > 0
    ? "technical_issues"
    : !measurementUsable
      ? "measurement_blocked"
      : actionRequired
        ? "search_opportunities"
        : "clean";

  return {
    generatedAt: new Date().toISOString(),
    actionRequired,
    severity,
    measurement: {
      usable: measurementUsable,
      state: gscStatus?.state || "unavailable",
      fetchedAt: gscStatus?.fetchedAt || null,
      property: gscStatus?.property || null,
      dateRange: gscStatus?.startDate && gscStatus?.endDate
        ? `${gscStatus.startDate} through ${gscStatus.endDate}`
        : null,
      rowCount: gscStatus?.rowCount ?? null,
      reasons: gscStatus?.reasons || ["freshness_status_missing"],
    },
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
      performanceUnknownQueued: performanceUnknownTargets,
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
    : summary.severity === "measurement_blocked"
      ? "Measurement blocked — live GSC refresh required"
      : summary.severity === "search_opportunities"
        ? "Search opportunities queued"
      : "Clean";

  return `# SEO Agent Daily Heartbeat

Status: **${status}**
Generated: ${summary.generatedAt}

## Measurement Evidence

- GSC state: ${summary.measurement.state}
- Safe to use for recommendations: ${summary.measurement.usable ? "yes" : "no"}
- Property: ${summary.measurement.property || "not verified"}
- Snapshot fetched: ${summary.measurement.fetchedAt || "unavailable"}
- Measurement window: ${summary.measurement.dateRange || "unavailable"}
- Page rows: ${summary.measurement.rowCount ?? "unavailable"}
- Blocking reasons: ${summary.measurement.reasons.length ? summary.measurement.reasons.map((reason) => `\`${reason}\``).join(", ") : "none"}

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

- Opportunities queued: ${summary.internalLinks.queued} (performance unknown: ${summary.internalLinks.performanceUnknownQueued})

Top internal-link opportunities:

${formatInternalLinks(summary.internalLinks.items)}

## Backlinks

- Registered: ${summary.backlinks.total} | Verified: ${summary.backlinks.verified} | Needing attention: ${summary.backlinks.broken}

Backlinks needing attention:

${formatBacklinks(summary.backlinks.items)}

## What To Do

1. If measurement is blocked, rotate and install \`GOOGLE_SERVICE_ACCOUNT_JSON\`; do not act on the legacy performance export.
2. If technical issues are listed, ask Codex to fix the SEO heartbeat issue and open a PR.
3. Use URL Inspection before treating a page as unindexed. Missing Search Analytics rows do not prove index status.

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
  const gscStatus = await readJson(args.gscStatus);
  const summary = buildSummary({ audit, indexing, internalLinks, backlinks, gscStatus });

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
