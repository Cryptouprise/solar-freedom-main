import { describe, expect, it } from "vitest";
import {
  hasVerifiedQuoteEvidence,
  suppressUnverifiedQuoteMarkup,
} from "./contentGovernance";

describe("content governance", () => {
  it("requires a reviewable source, date, and consent for quotes", () => {
    expect(hasVerifiedQuoteEvidence(undefined)).toBe(false);
    expect(
      hasVerifiedQuoteEvidence({
        sourceUrl: "https://example.com/evidence/123",
        sourceLabel: "Consent record 123",
        verifiedAt: "2026-07-12T00:00:00.000Z",
        consentConfirmed: false,
      })
    ).toBe(false);
    expect(
      hasVerifiedQuoteEvidence({
        sourceUrl: "https://example.com/evidence/123",
        sourceLabel: "Consent record 123",
        verifiedAt: "2026-07-12T00:00:00.000Z",
        consentConfirmed: true,
      })
    ).toBe(true);
  });

  it("strips unverified quote containers while preserving surrounding content", () => {
    const html = '<p>Before</p><blockquote><p>Fabricated quote</p></blockquote><p data-content-type="quote">Another quote</p><p>After</p>';
    expect(suppressUnverifiedQuoteMarkup(html)).toBe("<p>Before</p><p>After</p>");
  });
});
