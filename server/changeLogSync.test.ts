/**
 * Keeps shared/changeLog.ts and docs/CHANGE-LOG.md from drifting apart.
 *
 * WHY THIS EXISTS
 * The owner asked to always see what changed, why, and how the conclusion was
 * reached. Two files serve that: the typed log renders in the admin UI at
 * /admin/changelog, and the Markdown mirror is the version a human or another
 * agent reads without running the app. Maintained by hand, they diverge — and a
 * change log that is partly stale is worse than none, because it looks complete.
 *
 * This does not diff the prose (the two are written for different audiences).
 * It asserts the things that must match: every entry in the data file has a
 * heading in the Markdown file, the counts agree, and every Markdown entry
 * carries the fields the format promises.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { CHANGE_LOG } from "../shared/changeLog";

const MD = path.resolve(process.cwd(), "docs/CHANGE-LOG.md");
const md = fs.readFileSync(MD, "utf8");

/** Pull "## YYYY-MM-DD — Title" headings out of the Markdown file. */
function mdHeadings(): string[] {
  return md
    .split("\n")
    .filter((l) => /^## \d{4}-\d{2}-\d{2} — /.test(l))
    .map((l) => l.replace(/^## \d{4}-\d{2}-\d{2} — /, "").trim());
}

describe("the typed change log and its Markdown mirror stay in sync", () => {
  it("both files exist and are non-trivial", () => {
    expect(CHANGE_LOG.length).toBeGreaterThan(0);
    expect(md.length).toBeGreaterThan(1000);
  });

  it("has one Markdown heading per data entry", () => {
    expect(mdHeadings().length).toBe(CHANGE_LOG.length);
  });

  it("every data entry title appears as a Markdown heading", () => {
    const headings = mdHeadings();
    const missing = CHANGE_LOG.map((e) => e.title).filter((t) => !headings.includes(t));
    expect(missing, `missing from docs/CHANGE-LOG.md: ${missing.join(" | ")}`).toEqual([]);
  });

  it("every Markdown heading corresponds to a data entry", () => {
    const titles = new Set(CHANGE_LOG.map((e) => e.title));
    const orphans = mdHeadings().filter((h) => !titles.has(h));
    expect(orphans, `in the Markdown file but not the data: ${orphans.join(" | ")}`).toEqual([]);
  });

  it("every Markdown entry states its class, why and verification", () => {
    // The format promises four fields. An entry missing one is not readable
    // enough to learn from, which is the entire point of the file.
    const sections = md.split(/\n## \d{4}-\d{2}-\d{2} — /).slice(1);
    expect(sections.length).toBe(CHANGE_LOG.length);
    for (const section of sections) {
      const title = section.split("\n")[0];
      expect(section, `${title} is missing **Class:**`).toMatch(/\*\*Class:\*\*/);
      expect(section, `${title} is missing **Changed:**`).toMatch(/\*\*Changed:\*\*/);
      expect(section, `${title} is missing **Why:**`).toMatch(/\*\*Why:\*\*/);
      expect(section, `${title} is missing **Verified:**`).toMatch(/\*\*Verified:\*\*/);
    }
  });

  it("no Markdown entry has a heading merged into the previous line", () => {
    // A hand-prepended entry once landed as "f## 2026-..." and another merged
    // its **Class:** onto the heading line, which broke the readable format
    // while still passing a naive "does the heading exist" check.
    expect(md).not.toMatch(/[^\n]## \d{4}-\d{2}-\d{2}/);
    expect(md).not.toMatch(/^## \d{4}-\d{2}-\d{2} — [^\n]*\*\*Class:\*\*/m);
  });

  it("the standing rule about not claiming wins early is present in the Markdown", () => {
    expect(md).toMatch(/Never record a ranking, traffic or appointment improvement/);
  });
});
