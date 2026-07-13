/**
 * Fail-closed scan of the files tracked in the current Git tree.
 *
 * Output is deliberately limited to rule identifiers and file paths. Secret,
 * token, credential, and personal-data values are never printed. This protects
 * the public repository's current tree; historical incident response remains a
 * separate, explicitly approved operation.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const PATH_RULES = [
  ["manus_database_artifact", /^\.manus\/(?:db|logs?)\//i],
  ["browser_session_artifact", /(?:^|\/)\.playwright-profile\//i],
  [
    "operational_analytics_export",
    /^(?:gsc_(?:all_pages\.json|data_metadata\.json|report\.csv)|indexing-(?:results(?:-full)?\.(?:txt|json)|status\.txt)|reports\/seo-agent\/)/i,
  ],
  [
    "browser_auth_state",
    /(?:^|\/)(?:storage[-_.]?state|auth[-_.]?state|browser[-_.]?session)[^/]*\.json$/i,
  ],
  ["private_environment_file", /(?:^|\/)\.env(?:\.[^/]+)?$/i],
  ["private_key_file", /\.(?:key|pem|p12|pfx)$/i],
  [
    "credential_file",
    /(?:^|\/)(?:credentials?|service[-_.]?account)[^/]*\.json$/i,
  ],
];

const CONTENT_RULES = [
  [
    "private_key_material",
    /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----(?:\r?\n|\\n)[A-Za-z0-9+/=]{40,}/,
  ],
  [
    "service_account_private_key",
    /["']private_key["']\s*:\s*["']-----BEGIN PRIVATE KEY-----(?:\\n|\r?\n)[A-Za-z0-9+/=]{40,}/i,
  ],
  [
    "github_token",
    /\b(?:github_pat_[A-Za-z0-9_]{20,}|gh[oprsu]_[A-Za-z0-9_]{20,})\b/,
  ],
  ["google_api_key", /\bAIza[0-9A-Za-z_-]{30,}\b/],
  ["aws_access_key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ["slack_token", /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
  ["admin_api_key", /\bsf_[a-f0-9]{32,}\b/i],
  [
    "crm_webhook",
    /https:\/\/services\.leadconnectorhq\.com\/hooks\/[a-z0-9/_-]{20,}/i,
  ],
];

const PLACEHOLDERS = new Set([
  "example",
  "password",
  "pass",
  "secret",
  "token",
  "username",
  "user",
  "your-password",
  "your_password",
  "your-secret",
  "your_secret",
]);

function normalize(filePath) {
  return filePath.replaceAll("\\", "/").replace(/^\.\//, "");
}

function hasCredentialedDatabaseUrl(source) {
  const expression =
    /\b(?:mysql|mariadb|postgres|postgresql):\/\/([^\s:@/]+):([^\s@/]+)@/gi;
  for (const match of source.matchAll(expression)) {
    const username = match[1].toLowerCase();
    const password = match[2].toLowerCase();
    if (!PLACEHOLDERS.has(username) && !PLACEHOLDERS.has(password)) return true;
  }
  return false;
}

function hasContactQueryResult(source) {
  return (
    /["']rows["']\s*:/i.test(source) &&
    /["']email["']\s*:/i.test(source) &&
    /["'](?:firstName|lastName|name|phone)["']\s*:/i.test(source)
  );
}

function scanArtifact(filePath, bytes) {
  const normalizedPath = normalize(filePath);
  const source = bytes.toString("utf8");
  const findings = [];

  for (const [rule, expression] of PATH_RULES) {
    if (
      normalizedPath === ".env.example" &&
      rule === "private_environment_file"
    )
      continue;
    if (expression.test(normalizedPath)) findings.push(rule);
  }
  for (const [rule, expression] of CONTENT_RULES) {
    if (expression.test(source)) findings.push(rule);
  }
  if (hasCredentialedDatabaseUrl(source))
    findings.push("credentialed_database_url");
  if (hasContactQueryResult(source)) findings.push("contact_query_result");

  return [...new Set(findings)].sort();
}

function trackedFiles() {
  const output = execFileSync("git", ["ls-files", "-z"], {
    cwd: ROOT,
    encoding: "buffer",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return output.toString("utf8").split("\0").filter(Boolean).map(normalize);
}

function runSelfTest() {
  const fixtures = [
    [".manus/db/db-query-1.json", "{}", ["manus_database_artifact"]],
    ["gsc_report.csv", "page,clicks,impressions", ["operational_analytics_export"]],
    [
      "tmp/release.key",
      `-----BEGIN PRIVATE KEY-----\n${"A".repeat(64)}`,
      ["private_key_file", "private_key_material"],
    ],
    [
      "tmp/query.json",
      ['{"ro', 'ws":[{"na', 'me":"Example","em', 'ail":"person@example.invalid"}]}'].join(""),
      ["contact_query_result"],
    ],
    [
      "docs/example.md",
      "Authorization: Bearer YOUR_KEY\nDATABASE_URL=mysql://user:password@example.invalid/db",
      [],
    ],
  ];

  for (const [filePath, source, expected] of fixtures) {
    const actual = scanArtifact(filePath, Buffer.from(source)).sort();
    if (JSON.stringify(actual) !== JSON.stringify([...expected].sort())) {
      throw new Error(
        `public-artifact scanner self-test failed for ${filePath}`
      );
    }
  }
  console.log("Public-artifact scanner self-test passed.");
}

function main() {
  if (process.argv.includes("--self-test")) {
    runSelfTest();
    return;
  }

  const findings = [];
  for (const filePath of trackedFiles()) {
    const absolutePath = path.resolve(ROOT, filePath);
    if (
      !absolutePath.startsWith(`${ROOT}${path.sep}`) ||
      !fs.existsSync(absolutePath)
    )
      continue;
    for (const rule of scanArtifact(filePath, fs.readFileSync(absolutePath))) {
      findings.push({ filePath, rule });
    }
  }

  findings.sort(
    (left, right) =>
      left.filePath.localeCompare(right.filePath) ||
      left.rule.localeCompare(right.rule)
  );
  if (findings.length) {
    console.error(
      `Public-artifact scan failed with ${findings.length} finding(s).`
    );
    for (const finding of findings)
      console.error(`[${finding.rule}] ${finding.filePath}`);
    console.error("Matched values are intentionally suppressed.");
    process.exitCode = 1;
    return;
  }
  console.log(
    "Public-artifact scan passed: tracked tree contains no blocked artifacts or credential patterns."
  );
}

main();

export { scanArtifact };
