import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { BlogEditorialReviewError } from "./db";
import {
  AdminBlogMutationPolicyError,
  authorizePublishedPostMutation,
  normalizeAdminCanonicalUrl,
} from "./adminRouter";

const NOW = new Date("2026-07-13T19:00:00.000Z");
const PREVIOUS_REVIEW = new Date("2026-07-12T18:00:00.000Z");

function renewedReview(reviewedAt = "2026-07-13T18:00:00.000Z") {
  return {
    editorialReviewerName: "Jordan Rivera",
    editorialReviewerRole: "Consumer information editor",
    editorialReviewedAt: reviewedAt,
    editorialPrimarySources: [
      {
        url: "https://www.ftc.gov/legal-library/browse/rules/cooling-off-rule",
        title: "FTC Cooling-Off Rule",
        accessedAt: "2026-07-13T17:00:00.000Z",
      },
    ],
    editorialUniqueValueSummary:
      "This revision adds a source-specific records checklist and a distinct decision path for homeowners reviewing an agreement.",
    editorialFunnelOnlyDuplicate: false,
  };
}

describe("published REST post mutation boundary", () => {
  const published = { published: 1, editorialReviewedAt: PREVIOUS_REVIEW };

  it("lets a write-only key draft content and emergency-unpublish without changing live copy", () => {
    expect(() =>
      authorizePublishedPostMutation(
        { published: 0, editorialReviewedAt: null },
        { title: "Draft title" },
        false,
        NOW
      )
    ).not.toThrow();
    expect(() =>
      authorizePublishedPostMutation(
        published,
        { published: false },
        false,
        NOW
      )
    ).not.toThrow();
  });

  it("blocks every material published-row edit from a key without posts:publish", () => {
    for (const body of [
      { title: "Changed title" },
      { content: "Changed body" },
      { canonicalUrl: "/blog/changed" },
      { published: false, excerpt: "Changed while quarantining" },
      renewedReview(),
    ]) {
      try {
        authorizePublishedPostMutation(published, body, false, NOW);
        throw new Error("expected the published mutation to be rejected");
      } catch (error) {
        expect(error).toBeInstanceOf(AdminBlogMutationPolicyError);
        expect((error as AdminBlogMutationPolicyError).statusCode).toBe(403);
      }
    }
  });

  it("requires a complete review snapshot even when the key can publish", () => {
    try {
      authorizePublishedPostMutation(
        published,
        {
          title: "Changed title",
          editorialReviewedAt: "2026-07-13T18:00:00.000Z",
        },
        true,
        NOW
      );
      throw new Error("expected the incomplete review to be rejected");
    } catch (error) {
      expect(error).toBeInstanceOf(BlogEditorialReviewError);
      expect((error as BlogEditorialReviewError).issues).toContain(
        "editorial_review_snapshot_required"
      );
    }
  });

  it("requires the supplied review timestamp to be newer than the stored review", () => {
    try {
      authorizePublishedPostMutation(
        published,
        {
          title: "Changed title",
          ...renewedReview(PREVIOUS_REVIEW.toISOString()),
        },
        true,
        NOW
      );
      throw new Error("expected the stale review to be rejected");
    } catch (error) {
      expect(error).toBeInstanceOf(BlogEditorialReviewError);
      expect((error as BlogEditorialReviewError).issues).toContain(
        "editorial_review_not_renewed"
      );
    }
  });

  it("allows a publisher to make a material edit with a complete renewed review", () => {
    const fields = authorizePublishedPostMutation(
      published,
      { title: "Changed title", ...renewedReview() },
      true,
      NOW
    );

    expect(fields.editorialReviewedAt).toEqual(
      new Date("2026-07-13T18:00:00.000Z")
    );
    expect(fields.editorialFunnelOnlyDuplicate).toBe(0);
  });

  it("wires the policy into the REST update path", () => {
    const source = fs.readFileSync(
      new URL("./adminRouter.ts", import.meta.url),
      "utf8"
    );
    const updateRoute = source.slice(
      source.indexOf("// PUT /api/admin/posts/:slug"),
      source.indexOf("// DELETE /api/admin/posts/:slug")
    );

    expect(updateRoute).toContain("published: blogPosts.published");
    expect(updateRoute).toContain(
      "editorialReviewedAt: blogPosts.editorialReviewedAt"
    );
    expect(updateRoute).toContain("authorizePublishedPostMutation(");
    expect(updateRoute).toContain('hasPermission(req, "posts:publish")');
  });
});

describe("admin canonical URL input", () => {
  it("normalizes root-relative and allowlisted legacy-host URLs to one origin", () => {
    expect(normalizeAdminCanonicalUrl("/blog/records-guide/")).toBe(
      "https://breakyoursolarcontract.com/blog/records-guide"
    );
    expect(
      normalizeAdminCanonicalUrl(
        "https://www.breakyoursolarcontract.com/blog/records-guide"
      )
    ).toBe("https://breakyoursolarcontract.com/blog/records-guide");
    expect(normalizeAdminCanonicalUrl(null)).toBeNull();
    expect(normalizeAdminCanonicalUrl("  ")).toBeNull();
  });

  it("rejects foreign, ambiguous, credentialed, and stateful canonical URLs", () => {
    for (const candidate of [
      "https://example.com/blog/records-guide",
      "//example.com/blog/records-guide",
      "blog/records-guide",
      "http://breakyoursolarcontract.com/blog/records-guide",
      "https://user:secret@breakyoursolarcontract.com/blog/records-guide",
      "https://breakyoursolarcontract.com/blog/records-guide?draft=1",
      "https://breakyoursolarcontract.com/blog/records-guide#section",
      "/blog/%2e%2e/admin",
      "/blog\\..\\admin",
    ]) {
      expect(() => normalizeAdminCanonicalUrl(candidate), candidate).toThrow();
    }
  });

  it("wires canonical validation into both REST create and update paths", () => {
    const source = fs.readFileSync(
      new URL("./adminRouter.ts", import.meta.url),
      "utf8"
    );
    const routes = source.slice(
      source.indexOf("// POST /api/admin/posts"),
      source.indexOf("// DELETE /api/admin/posts/:slug")
    );

    expect(routes.match(/normalizeAdminCanonicalUrl\(/g)).toHaveLength(2);
  });
});
