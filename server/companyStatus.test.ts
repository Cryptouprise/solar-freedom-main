/**
 * Regression guard for company status facts.
 *
 * WHY THIS EXISTS
 * On 26 Nov 2026 an audit of client/src/data/companies.ts found five statuses
 * that were factually wrong, and two of them contradicted our own published
 * articles. The worst was Freedom Forever: the data file said "Active" while
 * our own blog described its bankruptcy. A reader comparing the two pages would
 * see the site disagree with itself, which is the fastest way to lose the trust
 * that this niche runs on.
 *
 * This is the fourth defect class where the site stated something the sources
 * did not support (see server/statuteCitations.test.ts for the citation class).
 * Per the standing rule in shared/changeLog.ts, a class that has failed more
 * than once gets a guard rather than another one-off correction.
 *
 * RULE FOR EDITING THIS FILE
 * Never change an expected status without also reading a primary source on the
 * day of the change and updating statusNote/statusSource in companies.ts.
 * A status with no source is not a fact; it is a guess with a deadline.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const FILE = path.resolve(process.cwd(), "client/src/data/companies.ts");
const src = fs.readFileSync(FILE, "utf8");

/** Extract one company object block by slug. */
function blockFor(slug: string): string {
  const start = src.indexOf(`slug: "${slug}"`);
  expect(start, `slug ${slug} must exist in companies.ts`).toBeGreaterThan(-1);
  const end = src.indexOf("\n  },", start);
  expect(end, `object for ${slug} must be terminated`).toBeGreaterThan(start);
  return src.slice(start, end);
}

function statusOf(slug: string): string {
  const m = blockFor(slug).match(/status:\s*"([^"]*)"/);
  expect(m, `${slug} must declare a status`).not.toBeNull();
  return m![1];
}

describe("company statuses match the verified record (as of 26 Nov 2026)", () => {
  // Each of these five was wrong before the 26 Nov 2026 audit. They are the
  // cases where our own pages would otherwise contradict each other.
  const MUST_BE_BANKRUPT: Array<[string, string]> = [
    ["titan-solar", "ceased operations 13 June 2024, Chapter 7"],
    ["freedom-forever", "Chapter 11 on 15 Apr 2026, converted to Chapter 7 on 7 Aug 2026"],
    ["sunnova", "Chapter 11 on 8 June 2025; ceased independent operations"],
    ["mosaic-solar", "Chapter 11 on 6 June 2025; plan effective 22 Sept 2025"],
  ];

  it.each(MUST_BE_BANKRUPT)("%s is marked Bankrupt (%s)", (slug) => {
    expect(statusOf(slug)).toBe("Bankrupt");
  });

  it("sunlight-financial is marked Acquired, not Bankrupt (it emerged and still services loans)", () => {
    expect(statusOf("sunlight-financial")).toBe("Acquired");
  });

  it("the four long-standing bankruptcies are still marked Bankrupt", () => {
    for (const slug of ["pink-energy", "sunpower", "adt-solar", "sungevity"]) {
      expect(statusOf(slug), `${slug} must stay Bankrupt`).toBe("Bankrupt");
    }
  });

  it("lenders that never entered bankruptcy are not marked Bankrupt", () => {
    // GoodLeap/Loanpal rebranded; Dividend Finance paused originations but did
    // not file; EverBright is a NextEra subsidiary. Marking any of these
    // bankrupt would be a false statement about a live company.
    for (const slug of ["goodleap", "loanpal", "dividend-finance", "everbright-solar"]) {
      expect(statusOf(slug), `${slug} must not be marked Bankrupt`).not.toBe("Bankrupt");
    }
  });
});

describe("every status that we corrected carries its evidence", () => {
  const CORRECTED = [
    "titan-solar",
    "freedom-forever",
    "sunnova",
    "mosaic-solar",
    "sunlight-financial",
  ];

  it.each(CORRECTED)("%s has a statusNote explaining why", (slug) => {
    const block = blockFor(slug);
    const note = block.match(/statusNote:\s*"((?:[^"\\]|\\.)*)"/);
    expect(note, `${slug} must carry a statusNote`).not.toBeNull();
    expect(note![1].length, `${slug} statusNote must be substantive`).toBeGreaterThan(60);
  });

  it.each(CORRECTED)("%s has a statusSource URL", (slug) => {
    const block = blockFor(slug);
    const source = block.match(/statusSource:\s*"(https?:\/\/[^"]+)"/);
    expect(source, `${slug} must carry an http(s) statusSource`).not.toBeNull();
  });

  it("every statusNote is dated by a concrete event, not a vague claim", () => {
    // A status note must name a date or a specific filing, otherwise it cannot
    // be re-verified later and will rot silently.
    for (const slug of CORRECTED) {
      const note = blockFor(slug).match(/statusNote:\s*"((?:[^"\\]|\\.)*)"/)![1];
      const hasDate =
        /\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/.test(
          note
        );
      const hasFiling = /Chapter (7|11)|plan took effect|emerged/i.test(note);
      expect(hasDate || hasFiling, `${slug} statusNote must name a dated event`).toBe(true);
    }
  });
});

describe("the data file itself stays honest", () => {
  it("declares statusNote and statusSource on the CompanyData interface", () => {
    expect(src).toMatch(/statusNote\?:\s*string/);
    expect(src).toMatch(/statusSource\?:\s*string/);
  });

  it("uses only the four known status values", () => {
    const found = [...src.matchAll(/status:\s*"([^"]*)"/g)].map((m) => m[1]);
    expect(found.length).toBeGreaterThanOrEqual(19);
    for (const value of found) {
      expect(["Active", "Bankrupt", "Acquired", "Closed"], `unexpected status "${value}"`).toContain(
        value
      );
    }
  });

  it("no company is left marked Active while its own note describes a shutdown", () => {
    // This is the exact contradiction that started the audit: a status of
    // "Active" sitting next to prose about ceasing operations.
    const blocks = src.split(/\n  \},\n/);
    for (const block of blocks) {
      const status = block.match(/status:\s*"([^"]*)"/)?.[1];
      if (status !== "Active") continue;
      const note = block.match(/statusNote:\s*"((?:[^"\\]|\\.)*)"/)?.[1] ?? "";
      expect(
        /ceased operations|converted to Chapter 7|filed Chapter/i.test(note),
        `an Active company must not have a shutdown note: ${note.slice(0, 80)}`
      ).toBe(false);
    }
  });
});

describe("the pre-rendered company shell carries the status and its source", () => {
  // A corrected status in the data file is worthless if the served HTML never
  // shows it. The React component only runs in a browser; crawlers and the
  // pre-rendered shell are what a reader lands on. This asserts the shell path.
  const PRERENDER = path.resolve(process.cwd(), "scripts/prerender.assembled.mjs");
  const prerenderSrc = fs.readFileSync(PRERENDER, "utf8");

  it("the parser extracts statusNote and statusSource from companies.ts", () => {
    expect(prerenderSrc).toMatch(/findStringProp\(chunk, "statusNote"\)/);
    expect(prerenderSrc).toMatch(/findStringProp\(chunk, "statusSource"\)/);
  });

  it("the company shell renders a status section with the source link", () => {
    expect(prerenderSrc).toMatch(/Current status of/);
    expect(prerenderSrc).toMatch(/Status: \$\{escapeHtml\(cd\.status\)\}/);
    expect(prerenderSrc).toMatch(/cd\.statusSource/);
  });

  it("companyData passes the two new fields through", () => {
    expect(prerenderSrc).toMatch(/companyData: \{[^}]*statusNote: company\.statusNote/);
    expect(prerenderSrc).toMatch(/companyData: \{[^}]*statusSource: company\.statusSource/);
  });
});
