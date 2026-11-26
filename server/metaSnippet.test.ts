import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards against a snippet defect measured on 26 Nov 2026.
 *
 * scripts/prerender.assembled.mjs fitted meta titles and descriptions by slicing
 * the string and appending a literal "...". On a full build that shipped 37 titles
 * and 56 descriptions ending in an ellipsis — 74 of 583 pages, 12.7% of the site.
 * Every one of them showed a mid-phrase cut-off to Google and to the searcher, e.g.
 *
 *   "Titan Solar Power Complaints: How to Get Out of Your Contract..."
 *   "Solar Escalator Clause Explained — How to Fight Annual Payment..."
 *
 * A snippet that visibly stops mid-thought reads as broken and suppresses clicks.
 * /blog/solar-escalator-clause-what-it-is-how-to-fight held 80 impressions at
 * average position 6.95 with zero clicks and its title was one of the truncated 37.
 *
 * The fix was boundary-aware fitting (fitSnippet): every cut lands on a sentence
 * end, a strong clause mark, a coordinating conjunction, or a whole word, and a
 * trailing function word is dropped so nothing dangles. Separately, 20 article
 * records carried a "..." already baked into their metaDescription while the same
 * record held a complete `excerpt`; those were repaired from the excerpt.
 *
 * These tests fail the build if either half of the defect returns.
 */

const ROOT = join(__dirname, "..");
const PRERENDER = join(ROOT, "scripts/prerender.assembled.mjs");
const DATA_DIR = join(ROOT, "client/src/data");
const DIST = join(ROOT, "dist/public");

const FUNC_TAIL = new RegExp(
  // "it" is deliberately absent: it is a legitimate sentence-final object
  // ("...and How to Fix It", "...Before Solar Is Turned On"). Every other entry
  // here is a word that cannot end a complete English phrase.
  "\\s+(?:and|or|but|so|the|a|an|of|to|for|with|in|on|at|by|from|as|that|which|" +
    "your|is|are|be|its|their|this|these|those|how|what|when|why)$",
  "i"
);

function walkHtml(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, out);
    else if (entry.name === "index.html") out.push(full);
  }
  return out;
}

function unescapeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

describe("prerender snippet fitting never truncates mid-phrase", () => {
  const source = readFileSync(PRERENDER, "utf-8");

  it("defines a boundary-aware fitter", () => {
    expect(source).toContain("function fitSnippet(text, limit) {");
  });

  it("routes both the title and the description through it", () => {
    expect(source).toMatch(/return fitSnippet\(tightened, 70\);/);
    expect(source).toMatch(/return fitSnippet\(description, 160\);/);
  });

  it("contains no ellipsis-appending slice in a meta fitter", () => {
    // The original defect: `${x.slice(0, N).replace(...)}...`
    expect(source).not.toMatch(/slice\(0,\s*67\)/);
    expect(source).not.toMatch(/slice\(0,\s*162\)/);
    expect(source).not.toMatch(/\}\)\.\.\.`/);
  });

  it("still strips a dangling brand suffix before measuring", () => {
    expect(source).toContain("function stripBrand(title) {");
  });
});

describe("article source data carries no baked-in ellipsis in meta fields", () => {
  const files = readdirSync(DATA_DIR).filter((f) => f.endsWith(".ts"));

  it("has article data files to scan", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it("has no metaDescription or metaTitle ending in an ellipsis", () => {
    const offenders: string[] = [];
    const fieldRe =
      /(metaDescription|metaTitle):\s*(?:`([^`]*)`|"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')/g;

    for (const file of files) {
      const text = readFileSync(join(DATA_DIR, file), "utf-8");
      for (const match of text.matchAll(fieldRe)) {
        const value = match[2] ?? match[3] ?? match[4] ?? "";
        if (/\.\.\.\s*$/.test(value) || /\u2026\s*$/.test(value)) {
          offenders.push(`${file}: ${match[1]} ends with an ellipsis`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("the built site ships complete snippets", () => {
  const pages = walkHtml(DIST);

  it("has a built site to inspect", () => {
    // A missing dist is not a product defect; the build creates it.
    expect(pages.length).toBeGreaterThan(0);
  });

  it("ships no title or description ending in an ellipsis", () => {
    const offenders: string[] = [];
    for (const page of pages) {
      const html = readFileSync(page, "utf-8");
      const title = html.match(/<title>(.*?)<\/title>/s);
      const desc = html.match(/<meta name="description" content="(.*?)"/s);
      const url = "/" + page.replace(DIST + "/", "").replace(/\/index\.html$/, "");
      if (title && /\.\.\.$|\u2026$/.test(unescapeHtml(title[1]).trim())) {
        offenders.push(`${url} :: TITLE`);
      }
      if (desc && /\.\.\.$|\u2026$/.test(unescapeHtml(desc[1]).trim())) {
        offenders.push(`${url} :: DESCRIPTION`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("ships no title longer than the 70-character fitter limit", () => {
    const offenders: string[] = [];
    for (const page of pages) {
      const html = readFileSync(page, "utf-8");
      const title = html.match(/<title>(.*?)<\/title>/s);
      if (!title) continue;
      const rendered = unescapeHtml(title[1]).trim();
      if (rendered.length > 70) {
        const url = "/" + page.replace(DIST + "/", "").replace(/\/index\.html$/, "");
        offenders.push(`${url} :: ${rendered.length} chars`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("ships no title or description ending on a dangling function word", () => {
    const offenders: string[] = [];
    for (const page of pages) {
      const html = readFileSync(page, "utf-8");
      const title = html.match(/<title>(.*?)<\/title>/s);
      const desc = html.match(/<meta name="description" content="(.*?)"/s);
      const url = "/" + page.replace(DIST + "/", "").replace(/\/index\.html$/, "");
      // Titles are short noun phrases where a final preposition is often correct
      // ("...Before Solar Is Turned On", "...to Cancel and Why"), so the
      // function-word heuristic is applied to descriptions only, which are prose
      // sentences and therefore unambiguous when they stop on a function word.
      if (desc) {
        const d = unescapeHtml(desc[1]).trim();
        if (FUNC_TAIL.test(d)) offenders.push(`${url} :: DESC "${d.slice(-40)}"`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
