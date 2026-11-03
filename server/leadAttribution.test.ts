import { describe, it, expect } from "vitest";
import {
  classifyChannel,
  citySlugFromPath,
  deriveLeadAttribution,
  sanitizeAttributionValue,
} from "../shared/leadAttribution";

describe("lead attribution", () => {
  it("extracts a door-team rep and neighborhood from a field link", () => {
    const result = deriveLeadAttribution(
      "https://breakyoursolarcontract.com/cancel-solar-contract/las-vegas-nv?utm_source=door_knocking&utm_medium=offline&utm_campaign=las_vegas_field_team&utm_content=rep_marcus#city-form",
      "/cancel-solar-contract/las-vegas-nv",
    );
    expect(result).toMatchObject({
      utmSource: "door_knocking",
      utmMedium: "offline",
      utmCampaign: "las_vegas_field_team",
      utmContent: "rep_marcus",
      citySlug: "las-vegas-nv",
      channel: "door_team",
    });
  });

  it("separates organic search from paid and direct traffic", () => {
    expect(deriveLeadAttribution("https://x.com/?utm_source=google&utm_medium=organic").channel).toBe("organic_google");
    expect(deriveLeadAttribution("https://x.com/?utm_source=google&utm_medium=cpc").channel).toBe("paid_google");
    expect(deriveLeadAttribution("https://breakyoursolarcontract.com/").channel).toBe("direct_or_unattributed");
    expect(deriveLeadAttribution(null, null).channel).toBe("direct_or_unattributed");
  });

  it("never mislabels unknown campaign combinations as a known channel", () => {
    expect(classifyChannel("newsletter", "partner")).toBe("other");
    expect(classifyChannel("door_knocking", null)).toBe("door_team");
    expect(classifyChannel(null, "offline")).toBe("door_team");
  });

  it("rejects values that could carry markup or oversized payloads", () => {
    expect(sanitizeAttributionValue('<script>alert(1)</script>')).toBeNull();
    expect(sanitizeAttributionValue("rep marcus")).toBeNull();
    expect(sanitizeAttributionValue("a".repeat(500))).toBe("a".repeat(100));
    expect(sanitizeAttributionValue("  REP_Marcus  ")).toBe("rep_marcus");
    expect(sanitizeAttributionValue("")).toBeNull();
    expect(sanitizeAttributionValue(undefined)).toBeNull();
  });

  it("resolves the city slug from a page path or a full URL and ignores other paths", () => {
    expect(citySlugFromPath("/cancel-solar-contract/henderson-nv")).toBe("henderson-nv");
    expect(citySlugFromPath("/cancel-solar-contract/north-las-vegas-nv/")).toBe("north-las-vegas-nv");
    expect(citySlugFromPath("https://breakyoursolarcontract.com/cancel-solar-contract/paradise-nv?x=1")).toBe("paradise-nv");
    expect(citySlugFromPath("/blog/solar-contract-help")).toBeNull();
    expect(citySlugFromPath("not a url")).toBeNull();
    expect(citySlugFromPath(null)).toBeNull();
  });

  it("does not break lead capture when the submitted URL is malformed", () => {
    const result = deriveLeadAttribution("http://[invalid", "/cancel-solar-contract/las-vegas-nv");
    expect(result.utmSource).toBeNull();
    expect(result.channel).toBe("direct_or_unattributed");
    expect(result.citySlug).toBe("las-vegas-nv");
  });

  it("falls back to the source URL when no page path is supplied", () => {
    const result = deriveLeadAttribution("https://breakyoursolarcontract.com/cancel-solar-contract/spring-valley-nv?utm_source=door_knocking&utm_medium=offline");
    expect(result.citySlug).toBe("spring-valley-nv");
    expect(result.channel).toBe("door_team");
  });
});
