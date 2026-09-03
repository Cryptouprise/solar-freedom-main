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
  ...PARTS.map(name => fs.statSync(path.join(__dirname, name)).mtimeMs)
);
const needsWrite =
  !fs.existsSync(assembledPath) || fs.statSync(assembledPath).mtimeMs < newestPart;
if (needsWrite) {
  const source =
    PARTS.map(name => fs.readFileSync(path.join(__dirname, name), "utf8")).join("") +
    "\nHUB_LINKS.push([\"/compare\", \"Compare solar company issues\"], [\"/solar-contract-laws/texas\", \"Texas solar contract laws\"], [\"/solar-contract-laws/california\", \"California solar contract laws\"], [\"/solar-contract-laws/arizona\", \"Arizona solar contract laws\"]);\n" +
    "\nexport { main };\n";
  fs.writeFileSync(assembledPath, source, "utf8");
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
