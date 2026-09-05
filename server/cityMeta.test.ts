import { describe, expect, it } from "vitest";
import { findDuplicateCityMeta, generateCityMeta } from "./cityMeta";

describe("city metadata generation", () => {
  it("creates deterministic location-specific metadata", () => {
    const phoenix = generateCityMeta({ slug: "phoenix-az", name: "Phoenix", state: "Arizona", stateCode: "AZ" });
    expect(phoenix.title).toContain("Phoenix");
    expect(phoenix.description).toContain("Arizona");
    expect(generateCityMeta({ slug: "phoenix-az", name: "Phoenix", state: "Arizona", stateCode: "AZ" })).toEqual(phoenix);
  });

  it("reports duplicate metadata pairs", () => {
    expect(findDuplicateCityMeta([
      { slug: "a", title: "Same", description: "Unique a" },
      { slug: "b", title: "same", description: "Unique b" },
    ])).toContain("Duplicate title: a and b");
  });
});
