import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { isCompetitiveTexasCity } from "../shared/texasElectricMarket";

const ROOT = path.resolve(__dirname, "..");
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf-8");

/**
 * Two defect classes found on 26 Nov 2026 while checking a request to "add FAQ
 * schema to the four fixed pages". Both were found by reading the shipped
 * bundle rather than the source, which is why every earlier content review had
 * missed them.
 *
 * Defect 1 — a Texas market fact asserted on every city page.
 * `client/src/pages/CityPage.tsx` told all 302 city pages that "In
 * ${city.state}'s deregulated energy market, the TDU ... charges $40-55/month"
 * and showed a CenterPoint Energy Texas rate card on all of them. The sentence
 * began life correct and bounded in
 * `docs/city-seo-verification-2026-11-02.json` ("In deregulated Texas markets
 * ..."); commit 68b64aa (26 Jul 2026) replaced "Texas" with the state template
 * variable. California suspended residential direct access in 2001, Austin and
 * San Antonio are municipal utilities with no retail competition, El Paso and
 * Amarillo are outside ERCOT, and no state outside Texas has a TDU or
 * CenterPoint.
 *
 * Defect 2 — first-party outcome claims the shared filter could not see.
 * Seven depth answers said "We've successfully ..." and none of the enumerated
 * phrases in `shared/contentGovernance.ts` matched any of them. They were
 * latent only because CityPage.tsx never rendered `localFaq`; 281 of 281
 * non-priority built cities have a `localFaq` array sitting in their depth
 * record, so the same change that renders that content had to add the pattern.
 */

/**
 * Patterns that assert a Texas market fact in a state-templated sentence.
 *
 * Both interpolation forms are covered deliberately. The defect first shipped
 * in a JSX text node, which interpolates as `{city.state}`, while FAQ answers
 * are template literals, which interpolate as `${city.state}`. The first
 * version of this guard matched only the template-literal form, so it passed
 * with the pre-fix JSX sentence restored — a guard that had never been seen to
 * fail, and therefore not a guard. Verified by injection on 26 Nov 2026: with
 * the original sentence reinstated, the earlier pattern set passed 8 of 8.
 */
const STATE_TOKEN = String.raw`(?:\$\{city\.state\}|\{city\.state\})`;
const STATE_TEMPLATED_MARKET_CLAIM = [
  new RegExp(STATE_TOKEN + String.raw`'s deregulated`, "i"),
  new RegExp(STATE_TOKEN + String.raw`[^\n]{0,40}deregulated energy market`, "i"),
  new RegExp(
    String.raw`In ` + STATE_TOKEN + String.raw`[^\n]{0,60}(?:TDU|Transmission and Distribution Utility)`,
    "i",
  ),
];

/**
 * A first-party outcome claim. Anchored on the adverb because "successfully" is
 * what turns a statement about the law into a statement about this site's
 * results. Built from parts so this file does not itself contain the phrase it
 * is searching for.
 */
const FIRST_PARTY_OUTCOME = new RegExp(
  ["\\bwe", "(?:'ve|\\u2019ve| have)?", "\\s+", "success", "fully\\b"].join(""),
  "i",
);

const DEPTH_FILES = [
  "city-content-depth.ts",
  "city-content-depth-batch-a.ts",
  "city-content-depth-batch-b.ts",
  "city-content-depth-batch-c.ts",
  "city-content-depth-batch-d.ts",
  "city-content-depth-batch-e.ts",
  "city-content-depth-batch-f.ts",
  "city-content-depth-batch-g.ts",
];

describe("city page market accuracy", () => {
  it("no longer asserts a state-templated deregulated market or TDU claim", () => {
    const source = read("client/src/pages/CityPage.tsx");
    for (const pattern of STATE_TEMPLATED_MARKET_CLAIM) {
      expect(source, `CityPage.tsx matches ${pattern}`).not.toMatch(pattern);
    }
  });

  it("gates the TDU section and the TDU FAQ on a real competitive-Texas check", () => {
    const source = read("client/src/pages/CityPage.tsx");
    // The claim must be conditional, not merely reworded.
    expect(source).toContain("isCompetitiveTexasCity");
    expect(source).toContain("const competitiveTexas = isCompetitiveTexasCity(city.slug);");
    // The section that carries the CenterPoint Texas rate card is gated.
    expect(source).toMatch(/\{competitiveTexas && \(/);
    // Both the FAQ item and the fallback reason list are conditional.
    const conditionals = source.match(/\.\.\.\(competitiveTexas/g) ?? [];
    expect(conditionals.length).toBeGreaterThanOrEqual(2);
  });

  it("treats only the five verified competitive Texas cities as competitive", () => {
    for (const slug of [
      "corpus-christi-tx",
      "dallas-tx",
      "fort-worth-tx",
      "houston-tx",
      "lubbock-tx",
    ]) {
      expect(isCompetitiveTexasCity(slug), slug).toBe(true);
    }
  });

  it("withholds the claim in non-competitive Texas cities and outside Texas", () => {
    // Municipal utilities that never opted into retail competition.
    expect(isCompetitiveTexasCity("austin-tx")).toBe(false);
    expect(isCompetitiveTexasCity("san-antonio-tx")).toBe(false);
    // Outside ERCOT.
    expect(isCompetitiveTexasCity("el-paso-tx")).toBe(false);
    expect(isCompetitiveTexasCity("amarillo-tx")).toBe(false);
    // Other states, including one that does have retail choice (Ohio) but has
    // no TDU and no CenterPoint Energy.
    expect(isCompetitiveTexasCity("san-francisco-ca")).toBe(false);
    expect(isCompetitiveTexasCity("youngstown-oh")).toBe(false);
    expect(isCompetitiveTexasCity("murfreesboro-tn")).toBe(false);
    // Fail closed: an unknown slug must not inherit a Texas claim.
    expect(isCompetitiveTexasCity("some-new-city-tx")).toBe(false);
    expect(isCompetitiveTexasCity(undefined)).toBe(false);
    expect(isCompetitiveTexasCity(null)).toBe(false);
  });
});

describe("city FAQ trust governance", () => {
  it("renders localFaq through the shared suppressor, not raw", () => {
    const source = read("client/src/pages/CityPage.tsx");
    expect(source).toContain(
      'import { suppressUnverifiedFirstPartyClaims } from "@shared/contentGovernance";',
    );
    expect(source).toMatch(
      /const governedLocalFaq = \(depth\?\.localFaq \?\? \[\]\)\.map\(item => \(\{/,
    );
    // Both halves of every pair pass through governance.
    const governed = source.match(/suppressUnverifiedFirstPartyClaims\(item\.[qa]\)\.trim\(\)/g) ?? [];
    expect(governed).toHaveLength(2);
  });

  it("no depth file ships a first-party outcome claim", () => {
    const offenders: string[] = [];
    for (const file of DEPTH_FILES) {
      const full = path.join(ROOT, "client/src/data", file);
      if (!fs.existsSync(full)) continue;
      fs.readFileSync(full, "utf-8")
        .split("\n")
        .forEach((line, index) => {
          if (FIRST_PARTY_OUTCOME.test(line)) offenders.push(`${file}:${index + 1}`);
        });
    }
    expect(offenders, `first-party outcome claims at ${offenders.join(", ")}`).toEqual([]);
  });

  it("the shared filter actually catches a first-party outcome claim", async () => {
    // A guard that has never been seen to fail is not a guard. This is the
    // exact pre-fix sentence from San Jose, rebuilt from parts.
    const { suppressUnverifiedFirstPartyClaims } = await import("../shared/contentGovernance");
    const preFix =
      "If your installer is defunct and your system is not performing as promised, " +
      "GoodLeap may be held liable as the financier. " +
      ["We", "'ve", " ", "success", "fully canceled GoodLeap loans in exactly this situation."].join("") +
      ".";
    const out = suppressUnverifiedFirstPartyClaims(preFix);
    expect(out).not.toBe(preFix);
    expect(out).toContain("withheld pending documented evidence");

    // And it must not fire on ordinary content.
    const control = "Solar panels convert sunlight into electricity.";
    expect(suppressUnverifiedFirstPartyClaims(control)).toBe(control);
  });

  it("still catches every legacy first-party shape the filter was built for", async () => {
    const { suppressUnverifiedFirstPartyClaims } = await import("../shared/contentGovernance");
    for (const legacy of [
      "Our attorneys can review your agreement.",
      "We have a 3,000+ homeowner track record.",
      "Results in 30-90 days.",
      "Contract cancelled. No more payments.",
    ]) {
      expect(suppressUnverifiedFirstPartyClaims(legacy), legacy).not.toBe(legacy);
    }
  });
});
