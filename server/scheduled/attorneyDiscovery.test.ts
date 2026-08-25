import { describe, expect, it } from "vitest";
import { buildAttorneyDiscoveryRecord } from "./attorneyDiscovery";

describe("overnight attorney discovery records", () => {
  it("stores a source-backed research card without claiming partnership readiness", () => {
    const record = buildAttorneyDiscoveryRecord({
      firmName: "Example Consumer Law",
      state: "Texas",
      city: "Dallas",
      website: "https://example.com",
      phone: "555-0100",
      practiceAreas: ["consumer protection"],
      sourceUrl: "https://example.com/contact",
      sourceNote: "Firm website lists consumer protection services and a public contact page.",
    });
    expect(record.outreachStatus).toBe("researching");
    expect(record.linkedInResearchStatus).toBe("research_ready");
    expect(record.overallScore).toBe(85);
    expect(record.outreachNotes).toContain("quality review");
    expect(record.linkedInSearchUrl).toContain("linkedin.com/search/results/people");
  });
});
