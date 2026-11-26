/**
 * First-party outcome claims and truncated snippets.
 *
 * Two defects found on 26 Nov 2026 by scanning the built output rather than the
 * source, which is why neither had been caught before.
 *
 * 1. Unsourced first-party outcome claims. Four INDEXABLE pages promised a
 *    result in their meta description: "We've helped 50+ GA homeowners save
 *    thousands", "Our firm helped 200+ homeowners cancel", and two "save
 *    thousands" lines. No source exists in the repo for any of them, and the
 *    Boston line says "Our firm" on a site whose own /how-it-works page states
 *    it is not a law firm. A checkable first-party claim is the single most
 *    damaging thing an attorney or a sharp homeowner can find.
 *
 * 2. Descriptions cut mid-phrase by the 160-character fitter. The source
 *    strings were complete sentences; the fitter cut them at a word boundary,
 *    so the served snippet stopped mid-thought ("...closing records" with no
 *    object). 35 pages matched, 5 indexable. Same failure mode as the 74 pages
 *    of ellipsis-terminated snippets fixed earlier the same day.
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DATA_DIR = path.join(ROOT, "client/src/data");
const DIST = path.join(ROOT, "dist/public");
const ELIGIBILITY = JSON.parse(
  fs.readFileSync(path.join(ROOT, "shared/index-eligibility.json"), "utf8"),
);
const INDEXED_BLOG_SLUGS: Set<string> = new Set(ELIGIBILITY.blogSlugs);

/** Patterns that promise a first-party outcome with no source anywhere in the repo. */
const FIRST_PARTY_CLAIM_PATTERNS: Array<[RegExp, string]> = [
  [/\bwe(?:'ve| have)\s+helped\s+\d+/i, "we've helped <n>"],
  [/\bour\s+(?:firm|team|company)\s+helped\s+\d+/i, "our firm helped <n>"],
  [/\bhelped\s+\d{2,}\+?\s+(?:homeowners|families|clients|people)\b/i, "helped <n> homeowners"],
  [/\b\d{2,}\+?\s+(?:homeowners|families)\s+(?:save|cancel|get out|escape)\b/i, "<n> homeowners save/cancel"],
  [/\bsave\s+(?:you\s+)?thousands\b/i, "save thousands"],
  [/\b\d{1,3}%\s+success\s+rate\b/i, "<n>% success rate"],
  [/\bwon\s+\d{2,}\s+cases\b/i, "won <n> cases"],
  [/\bmoney[- ]back\s+guarantee\b/i, "money-back guarantee"],
];

/** Files where the pattern is legitimate because it is the subject, not a promise. */
const ALLOWED_FILES = new Set<string>([
  "companies.ts", // describes third-party companies, not us
  "faq.ts",
]);

function sourceFiles(): string[] {
  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => path.join(DATA_DIR, f));
}

function builtPages(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === "index.html") out.push(p);
    }
  };
  if (fs.existsSync(DIST)) walk(DIST);
  return out;
}

function isIndexable(html: string): boolean {
  const m = html.match(/<meta name="robots" content="([^"]*)"/);
  return !!m && m[1].startsWith("index");
}

describe("first-party outcome claims", () => {
  it("no article meta field promises a result we cannot source", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles()) {
      if (ALLOWED_FILES.has(path.basename(file))) continue;
      const text = fs.readFileSync(file, "utf8");
      for (const [re, label] of FIRST_PARTY_CLAIM_PATTERNS) {
        const m = text.match(re);
        if (m) {
          offenders.push(`${path.basename(file)} :: ${label} :: ${m[0]}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("no indexable built page serves a first-party outcome claim", () => {
    const offenders: string[] = [];
    for (const page of builtPages()) {
      const html = fs.readFileSync(page, "utf8");
      if (!isIndexable(html)) continue;
      const body = html
        .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ");
      for (const [re, label] of FIRST_PARTY_CLAIM_PATTERNS) {
        const m = body.match(re);
        if (m) {
          offenders.push(`${page.replace(DIST, "")} :: ${label} :: ${m[0]}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("the site does not call itself a law firm anywhere indexable", () => {
    // /how-it-works states "Solar Freedom is not a law firm." Any indexable page
    // that says "our firm" contradicts the service page a visitor can read.
    const offenders: string[] = [];
    for (const page of builtPages()) {
      const html = fs.readFileSync(page, "utf8");
      if (!isIndexable(html)) continue;
      const body = html
        .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ");
      const m = body.match(/\bour\s+(?:firm|law\s+firm|attorneys?)\b/i);
      if (m) offenders.push(`${page.replace(DIST, "")} :: ${m[0]}`);
    }
    expect(offenders).toEqual([]);
  });
});

describe("snippet completeness", () => {
  it("no indexable description ends mid-phrase", () => {
    const offenders: string[] = [];
    for (const page of builtPages()) {
      const html = fs.readFileSync(page, "utf8");
      if (!isIndexable(html)) continue;
      const m = html.match(/<meta name="description" content="([^"]*)"/);
      if (!m) continue;
      const d = m[1].trim();
      if (d && !/[.!?]$/.test(d)) {
        offenders.push(`${page.replace(DIST, "")} :: ${d.slice(-60)}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("no source metaDescription is longer than the 160-character fitter", () => {
    // A source string over the limit is not automatically a defect, but it will
    // be cut, so it must be checked by hand. This test surfaces them rather than
    // letting them ship silently.
    const over: string[] = [];
    for (const file of sourceFiles()) {
      const text = fs.readFileSync(file, "utf8");
      const re = /metaDescription:\s*([`'"])([\s\S]*?)\1/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text))) {
        const value = m[2];
        if (value.length > 160 && !value.includes("\n")) {
          over.push(`${path.basename(file)} :: ${value.length} chars`);
        }
      }
    }
    // Informational: the fitter handles these, but they must end in a sentence
    // end so the cut lands cleanly. Assert the count is not growing.
    // Pinned at the measured value rather than left as a loose bound, so a new
    // over-limit description forces a decision instead of being absorbed by
    // headroom. Measured 26 Nov 2026: 34. The real protection is the built-output
    // test above, which asserts no INDEXABLE page serves a description that ends
    // mid-phrase; this one exists so the source list cannot grow unnoticed.
    expect(
      over.length,
      `Source descriptions over 160 chars grew to ${over.length} (was 34 on 26 Nov 2026). ` +
        `Each must still end in sentence punctuation after the fitter runs: ${over.join(" | ")}`,
    ).toBeLessThanOrEqual(34);
  });
});

describe("Atlanta index-eligibility discrepancy", () => {
  it("records that the Atlanta article ships robots=index without being in INDEXED_BLOG_SLUGS", () => {
    // Found 26 Nov 2026: /blog/cancel-solar-contract-atlanta-ga ships
    // robots=index in the built output while its slug is absent from
    // INDEXED_BLOG_SLUGS in shared/index-eligibility.json. Whatever the cause,
    // the built output is what Google reads, so this test documents the state
    // rather than asserting a fix that has not been made.
    const page = path.join(DIST, "blog/cancel-solar-contract-atlanta-ga/index.html");
    if (!fs.existsSync(page)) return; // build not run
    const html = fs.readFileSync(page, "utf8");
    const builtIndexable = isIndexable(html);
    const listedIndexable = INDEXED_BLOG_SLUGS.has("cancel-solar-contract-atlanta-ga");
    if (builtIndexable !== listedIndexable) {
      // Known and recorded. This assertion exists so the discrepancy cannot
      // change silently in either direction without a test failure.
      expect({ builtIndexable, listedIndexable }).toEqual({
        builtIndexable: true,
        listedIndexable: false,
      });
    }
  });
});
