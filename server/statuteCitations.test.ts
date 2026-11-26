import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Statute citations are factual claims about a document, and they get the same
 * treatment as a statistic: never written down without being read from the
 * official source.
 *
 * This file exists because the same class of defect shipped three times:
 *
 *   1. "AB 458 protects you from deceptive solar contracts" — AB 458 (2025,
 *      Ch. 254) is the solar-powered affordable housing net-metering bill.
 *   2. "Nevada solar disclosure requirements under NRS 704.7801" — 704.7801 is a
 *      definitions section ("As used in NRS 704.7801 to 704.7828...").
 *   3. Four wrong sections in the Sunrun state-rights list: Cal. Civ. Code
 *      1689.5 (legislative intent) instead of 1689.6 (the right to cancel);
 *      Fla. Stat. 501.021 (definitions) instead of 501.025 (right to cancel);
 *      A.R.S. 44-5001 (definitions) instead of 44-5002 (cancellation period);
 *      and NRS 598.2821, which does not govern solar agreements at all, instead
 *      of NRS 598.98216.
 *
 * The pattern in every case is the same: a plausible-looking number that belongs
 * to the definitions or intent section of the right chapter, rather than the
 * operative section. Each of these was corrected against the official text.
 *
 * See docs/CHANGE-LOG.md for the source URL and read date behind each correction.
 */

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "client", "src", "data");

function allContentSource(): string {
  return fs
    .readdirSync(DATA)
    .filter(name => name.endsWith(".ts"))
    .map(name => fs.readFileSync(path.join(DATA, name), "utf-8"))
    .join("\n");
}

describe("statute citations are the operative section, not a neighbouring one", () => {
  const source = allContentSource();

  /**
   * Wrong section -> the correct one. Asserting on the wrong string is what
   * actually prevents a regression; asserting the right one alone would still
   * pass if both appeared.
   */
  const corrected: Array<[wrong: string, right: string, note: string]> = [
    [
      "Cal. Civ. Code Section 1689.5",
      "Cal. Civ. Code Section 1689.6",
      "1689.5 is legislative intent; 1689.6 is the right to cancel",
    ],
    [
      "Fla. Stat. Section 501.021",
      "Fla. Stat. Section 501.025",
      "501.021 is definitions; 501.025 is the buyer's right to cancel",
    ],
    [
      "A.R.S. Section 44-5001.",
      "A.R.S. Section 44-5002",
      "44-5001 is definitions; 44-5002 is the cancellation period",
    ],
    [
      "NRS 598.2821",
      "NRS 598.98216",
      "598.2821 does not govern solar agreements; 598.98216 does",
    ],
  ];

  for (const [wrong, right, note] of corrected) {
    it(`does not cite ${wrong} (${note})`, () => {
      expect(source).not.toContain(wrong);
    });

    it(`cites ${right}`, () => {
      expect(source).toContain(right);
    });
  }

  it("does not attribute AB 458 to solar contract deception protections", () => {
    // AB 458 (2025, Ch. 254) is the solar-powered affordable housing
    // net-metering bill. It is not a solar contract cancellation statute.
    expect(source).not.toMatch(/AB\s*458[^.]{0,80}(deceptive|deception|cancellation right)/i);
  });

  it("does not present NRS 704.7801 as a disclosure requirement", () => {
    // NRS 704.7801 opens with "As used in NRS 704.7801 to 704.7828..." — it is
    // a definitions section.
    expect(source).not.toMatch(/NRS\s*704\.7801[^.]{0,80}(disclosure requirement|requires disclosure)/i);
  });

  it("keeps the corrected California senior extension in the Sunrun state list", () => {
    // The fifth business day for senior citizens was missing entirely before the
    // 26 Nov 2026 correction.
    expect(source).toMatch(/fifth business day if the buyer is a senior citizen/);
  });

  it("keeps the Nevada ten-business-day window for borrowers aged 60 or over", () => {
    expect(source).toContain("NRS 598.982149");
    expect(source).toMatch(/tenth business day/);
  });

  it("still cites the citations that were verified correct", () => {
    // These were read from official sources and are correct as written. They are
    // asserted so a future sweep cannot silently drop them.
    for (const good of [
      "Tex. Bus. & Com. Code Chapter 601",
      "Va. Code § 59.1-196",
      "W. Va. Code § 46A-6-104",
      "Cal. Civ. Code § 1750",
      "Fla. Stat. § 501.201",
      "A.R.S. § 44-1521",
      "NRS 598.982148",
      "NRS 624.875",
    ]) {
      expect(source).toContain(good);
    }
  });
});
