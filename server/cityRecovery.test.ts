import { describe, expect, it } from "vitest";
import {
  cityRecoveryPayloadSchema,
  evaluateCityRecovery,
  isRecoverableCitySlug,
  recoverableCities,
  type CityRecoveryPayload,
} from "./cityRecovery";

function payload(overrides: Partial<CityRecoveryPayload> = {}): CityRecoveryPayload {
  const localParagraph = "Phoenix homeowners should compare the written solar agreement, financing disclosures, installation records, utility statements, and communications before deciding what to do. Arizona requirements and available options depend on the facts, contract terms, timing, and current law. An individual review can identify questions to raise with the company or a qualified professional.";
  return cityRecoveryPayloadSchema.parse({
    title: "Phoenix, Arizona solar contract review guide",
    metaTitle: "Phoenix Solar Contract Review | Solar Freedom",
    metaDescription: "Phoenix homeowners can review solar contract terms, official Arizona resources, records to gather, and practical next steps before requesting help.",
    heroHeading: "Review a solar contract in Phoenix, Arizona",
    heroCopy: localParagraph,
    sections: [
      { heading: "Start with the written agreement", body: localParagraph },
      { heading: "Compare promises with the records", body: localParagraph },
      { heading: "Verify current Arizona information", body: localParagraph },
    ],
    faq: [
      { question: "Which solar records should Phoenix homeowners gather?", answer: localParagraph },
      { question: "Where can Arizona consumers verify current information?", answer: localParagraph },
      { question: "Does every Phoenix solar contract have the same options?", answer: localParagraph },
    ],
    sources: [
      { label: "Arizona Attorney General", url: "https://www.azag.gov/consumer" },
      { label: "Federal Trade Commission", url: "https://consumer.ftc.gov/" },
    ],
    internalLinks: [
      { label: "Solar contract help", url: "/solar-contract-help" },
      { label: "Solar loan help", url: "/solar-loan-help" },
    ],
    ctaHeading: "Request an individual contract review",
    ctaCopy: "Share the written agreement and relevant records for an individual review. Submission does not guarantee an outcome or create an attorney-client relationship.",
    targetKeyword: "Phoenix solar contract review",
    ...overrides,
  });
}

describe("city recovery governance", () => {
  it("limits recovery to canonical allowlisted city URLs", () => {
    expect(isRecoverableCitySlug("phoenix-az")).toBe(true);
    expect(isRecoverableCitySlug("houston-tx")).toBe(false);
    expect(isRecoverableCitySlug("made-up-city")).toBe(false);
    expect(recoverableCities()).toHaveLength(24);
  });

  it("blocks Texas-only language on non-Texas pages", async () => {
    const qa = await evaluateCityRecovery("phoenix-az", payload({
      heroCopy: `${payload().heroCopy} ERCOT and the Texas TDU should review this contract.`,
    }));
    expect(qa.passed).toBe(false);
    expect(qa.blockers).toContain("Texas-only language or assets cannot appear on a non-Texas city page.");
  });

  it("requires a government source and rejects unsupported outcomes", async () => {
    const qa = await evaluateCityRecovery("phoenix-az", payload({
      heroCopy: `${payload().heroCopy} You will win and always qualify.`,
      sources: [
        { label: "Consumer resource", url: "https://example.com/consumer" },
        { label: "Utility resource", url: "https://example.org/utility" },
      ],
    }));
    expect(qa.passed).toBe(false);
    expect(qa.blockers).toContain("At least one primary .gov source is required.");
    expect(qa.blockers).toContain("Draft contains an unsupported result, qualification, or enforcement claim.");
  });

  it("blocks redirected or ineligible internal links", async () => {
    const qa = await evaluateCityRecovery("phoenix-az", payload({
      internalLinks: [
        { label: "Houston page", url: "/cancel-solar-contract/houston-tx" },
        { label: "Solar loan help", url: "/solar-loan-help" },
      ],
    }));
    expect(qa.passed).toBe(false);
    expect(qa.blockers.some(item => item.includes("/cancel-solar-contract/houston-tx"))).toBe(true);
  });
});
