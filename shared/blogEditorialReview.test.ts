import { describe, expect, it } from "vitest";
import {
  getBlogEditorialReviewIssues,
  hasPublishableEditorialReview,
  parseEditorialPrimarySources,
} from "./blogEditorialReview";

const NOW = new Date("2026-07-13T18:00:00.000Z");

function validReview() {
  return {
    editorialReviewerName: "Jordan Rivera",
    editorialReviewerRole: "Consumer information editor",
    editorialReviewedAt: new Date("2026-07-12T17:00:00.000Z"),
    editorialPrimarySources: JSON.stringify([
      {
        url: "https://www.ftc.gov/legal-library/browse/rules/cooling-off-rule",
        title: "FTC Cooling-Off Rule",
        accessedAt: "2026-07-12T16:00:00.000Z",
      },
    ]),
    editorialUniqueValueSummary:
      "This article compares the reader's specific document-review steps and evidence checklist without duplicating a generic conversion page.",
    editorialFunnelOnlyDuplicate: 0,
  };
}

describe("blog editorial review gate", () => {
  it("accepts a complete flat database review record", () => {
    expect(hasPublishableEditorialReview(validReview(), NOW)).toBe(true);
    expect(getBlogEditorialReviewIssues(validReview(), NOW)).toEqual([]);
  });

  it("accepts Editor as a legitimate reviewer role, but not as a reviewer name", () => {
    expect(hasPublishableEditorialReview({
      ...validReview(),
      editorialReviewerRole: "Editor",
    }, NOW)).toBe(true);
    expect(hasPublishableEditorialReview({
      ...validReview(),
      editorialReviewerName: "Editor",
    }, NOW)).toBe(false);
  });

  it("fails legacy and incomplete records closed", () => {
    expect(hasPublishableEditorialReview({}, NOW)).toBe(false);
    expect(getBlogEditorialReviewIssues({}, NOW)).toEqual(expect.arrayContaining([
      "editorial_reviewer_name_required",
      "editorial_reviewer_role_required",
      "editorial_reviewed_at_invalid",
      "editorial_primary_sources_invalid",
      "editorial_unique_value_summary_required",
      "editorial_funnel_only_duplicate_must_be_false",
    ]));
  });

  it("rejects placeholders, non-HTTPS sources, future dates, and funnel duplicates", () => {
    const review = {
      ...validReview(),
      editorialReviewerName: "TBD",
      editorialReviewedAt: "2026-08-01T00:00:00.000Z",
      editorialPrimarySources: [{
        url: "http://example.com/source",
        title: "Example source",
        accessedAt: "2026-08-01T00:00:00.000Z",
      }],
      editorialFunnelOnlyDuplicate: true,
    };

    expect(getBlogEditorialReviewIssues(review, NOW)).toEqual(expect.arrayContaining([
      "editorial_reviewer_name_required",
      "editorial_reviewed_at_invalid",
      "editorial_primary_sources_invalid",
      "editorial_funnel_only_duplicate_must_be_false",
    ]));
  });

  it("supports the nested editorialReview shape used by static articles", () => {
    const review = validReview();
    expect(hasPublishableEditorialReview({
      editorialReview: {
        reviewer: {
          name: review.editorialReviewerName,
          role: review.editorialReviewerRole,
        },
        reviewedAt: review.editorialReviewedAt,
        primarySources: parseEditorialPrimarySources(review.editorialPrimarySources),
        uniqueValueSummary: review.editorialUniqueValueSummary,
        funnelOnlyDuplicate: false,
      },
    }, NOW)).toBe(true);
  });
});
