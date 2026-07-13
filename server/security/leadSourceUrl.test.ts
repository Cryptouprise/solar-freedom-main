import { describe, expect, it } from "vitest";
import {
  CANONICAL_LEAD_ORIGIN,
  normalizeLeadSourceUrl,
} from "./leadSourceUrl";

describe("lead source URL minimization", () => {
  it("canonicalizes origin and strips credentials, fragments, and non-allowlisted queries", () => {
    expect(normalizeLeadSourceUrl(
      "https://user:secret@www.breakyoursolarcontract.com/blog/guide"
      + "?utm_source=google&utm_medium=cpc&utm_campaign=summer-sale"
      + "&email=visitor%40example.com&phone=9049214971&gclid=private#contact",
    )).toBe(
      `${CANONICAL_LEAD_ORIGIN}/blog/guide?utm_source=google&utm_medium=cpc&utm_campaign=summer-sale`,
    );
  });

  it("accepts relative and local-development URLs but always emits the canonical origin", () => {
    expect(normalizeLeadSourceUrl("/solar-contract-help?utm_source=internal"))
      .toBe(`${CANONICAL_LEAD_ORIGIN}/solar-contract-help?utm_source=internal`);
    expect(normalizeLeadSourceUrl("http://localhost:3001/blog?utm_medium=preview"))
      .toBe(`${CANONICAL_LEAD_ORIGIN}/blog?utm_medium=preview`);
  });

  it("drops contact-like UTM values while preserving safe campaign context", () => {
    expect(normalizeLeadSourceUrl(
      "https://breakyoursolarcontract.com/?utm_source=person%40example.com"
      + "&utm_medium=904-921-4971&utm_campaign=brand_search",
    )).toBe(`${CANONICAL_LEAD_ORIGIN}/?utm_campaign=brand_search`);
  });

  it("rejects foreign origins, non-web schemes, malformed input, and contact-like paths", () => {
    expect(normalizeLeadSourceUrl("https://evil.example/private?utm_source=google")).toBeNull();
    expect(normalizeLeadSourceUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeLeadSourceUrl("not a URL")).toBeNull();
    expect(normalizeLeadSourceUrl("/visitor%40example.com?utm_source=google")).toBeNull();
    expect(normalizeLeadSourceUrl(undefined)).toBeNull();
  });
});
