import { describe, expect, it } from "vitest";

const { buildSummary } = await import("../scripts/seo-alert-summary.mjs");

describe("SEO heartbeat alert summary", () => {
  it("requires action when CTR rescue has candidates", () => {
    const summary = buildSummary({
      audit: { pagesWithIssues: 0 },
      indexing: { summary: {} },
      ctr: {
        blocked: false,
        candidateCount: 1,
        candidates: [{
          url: "https://breakyoursolarcontract.com/blog/example",
          impressions: 100,
          ctr: 0.5,
          position: 7.2,
        }],
      },
      internalLinks: { summary: {} },
      backlinks: { summary: {} },
      gscStatus: { usable: true, state: "fresh", reasons: [] },
    });

    expect(summary.actionRequired).toBe(true);
    expect(summary.severity).toBe("search_opportunities");
    expect(summary.ctr.candidates).toBe(1);
  });
});
