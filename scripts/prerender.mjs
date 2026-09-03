/**
 * Assembles the full prerender implementation from split source parts.
 * GitHub file-write tools cap a single body; the real script is scripts/prerender.p1-p4.txt.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PARTS = ["prerender.p1.txt", "prerender.p2.txt", "prerender.p3.txt", "prerender.p4.txt"];
const assembledPath = path.join(__dirname, "prerender.assembled.mjs");

const newestPart = Math.max(
  ...PARTS.map(name => fs.statSync(path.join(__dirname, name)).mtimeMs),
  fs.statSync(path.join(__dirname, "prerender.mjs")).mtimeMs
);
const needsWrite =
  !fs.existsSync(assembledPath) || fs.statSync(assembledPath).mtimeMs < newestPart;
if (needsWrite) {
  const qualifyHelper = `
function qualifyVisibleTrustClaims(input) {
  return String(input ?? "")
    .replace(/if it's missing or invalid, the contract is void/gi, "if it is missing or invalid, California law may treat the agreement as unenforceable")
    .replace(/claiming panels will eliminate your electric bill/gi, "claiming panels remove the electric bill entirely")
    .replace(/all provide grounds for post-install cancellation in Texas\\./gi, "may be relevant to a post-install dispute in Texas, depending on the documents and facts.")
    .replace(/all provide grounds for post-install cancellation in Arizona\\./gi, "may be relevant to a post-install dispute in Arizona, depending on the documents and facts.");
}
function qualifyTrustTree(value) {
  if (typeof value === "string") return qualifyVisibleTrustClaims(value);
  if (Array.isArray(value)) return value.map(qualifyTrustTree);
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, child] of Object.entries(value)) out[key] = qualifyTrustTree(child);
    return out;
  }
  return value;
}
`;
  const source =
    PARTS.map(name => fs.readFileSync(path.join(__dirname, name), "utf8")).join("") +
    qualifyHelper +
    "\nHUB_LINKS.push([\"/compare\", \"Compare solar company issues\"], [\"/solar-contract-laws/texas\", \"Texas solar contract laws\"], [\"/solar-contract-laws/california\", \"California solar contract laws\"], [\"/solar-contract-laws/arizona\", \"Arizona solar contract laws\"]);\n" +
    "\nexport { main };\n";
  const wrapped = source.replace(
    "function buildStateUniqueContent(meta) {",
    "function buildStateUniqueContent(meta) {\n  if (meta?.stateData) meta = { ...meta, stateData: qualifyTrustTree(meta.stateData) };"
  );
  if (wrapped === source) {
    throw new Error("prerender assembler: buildStateUniqueContent hook missing");
  }
  fs.writeFileSync(assembledPath, wrapped, "utf8");
}

const mod = await import(`${pathToFileURL(assembledPath).href}?v=${newestPart}`);

export const buildMetaMap = mod.buildMetaMap;
export const buildShellHtml = mod.buildShellHtml;
export const loadBlogData = mod.loadBlogData;
export const loadData = mod.loadData;
export const renderContentSections = mod.renderContentSections;

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  mod.main().catch(err => {
    console.error("Pre-render failed:", err);
    process.exit(1);
  });
}
