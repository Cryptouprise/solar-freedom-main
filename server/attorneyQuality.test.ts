import { describe, expect, it } from "vitest";
import { buildLinkedInLookupUrl, reviewAttorneyQuality } from "./attorneyQuality";

describe("attorney partner quality matrix", () => {
  it("builds a firm-specific LinkedIn people-search link rather than inventing a profile", () => {
    const url = buildLinkedInLookupUrl("Example Consumer Law", "Texas");
    expect(url).toContain("linkedin.com/search/results/people");
    expect(decodeURIComponent(url)).toContain("Example Consumer Law Texas attorney");
  });

  it("uses a cautious deterministic review when a prospect lacks direct source evidence", async () => {
    const review = await reviewAttorneyQuality({
      firmName: "Example Law",
      state: "Texas",
      city: null,
      website: "https://example.com",
      phone: null,
      practiceAreas: null,
      sourceUrl: null,
      discoveredVia: null,
    });
    expect(review.tier).toBe("defer");
    expect(review.score).toBe(40);
    expect(review.gates.some(gate => gate.status === "blocked")).toBe(true);
    expect(review.nextActions.join(" ").toLowerCase()).toContain("approval");
  });
});
