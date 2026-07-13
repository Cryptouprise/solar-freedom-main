import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  assertPublishableBlogPostReview,
  BlogEditorialReviewError,
  filterPublishableBlogPostPage,
} from "./db";

const NOW = new Date("2026-07-13T18:00:00.000Z");

function validPublishedRecord() {
  return {
    published: 1,
    editorialReviewerName: "Jordan Rivera",
    editorialReviewerRole: "Consumer information editor",
    editorialReviewedAt: new Date("2026-07-12T17:00:00.000Z"),
    editorialPrimarySources: JSON.stringify([{
      url: "https://www.ftc.gov/legal-library/browse/rules/cooling-off-rule",
      title: "FTC Cooling-Off Rule",
      accessedAt: "2026-07-12T16:00:00.000Z",
    }]),
    editorialUniqueValueSummary:
      "This article supplies a document-specific evidence checklist and decision path that is not duplicated by a generic conversion page.",
    editorialFunnelOnlyDuplicate: 0,
  };
}

describe("database blog publication boundary", () => {
  it("allows incomplete drafts but blocks incomplete published rows", () => {
    expect(() => assertPublishableBlogPostReview({ published: 0 }, NOW)).not.toThrow();
    expect(() => assertPublishableBlogPostReview({ published: 1 }, NOW))
      .toThrow(BlogEditorialReviewError);
  });

  it("accepts a complete evidence-first published row", () => {
    expect(() => assertPublishableBlogPostReview(validPublishedRecord(), NOW)).not.toThrow();
  });

  it("blocks publication when reviewed fields accompany unsupported first-party claims", () => {
    expect(() => assertPublishableBlogPostReview({
      ...validPublishedRecord(),
      content: "Our attorneys helped homeowners cancel agreements.",
    }, NOW)).toThrow(BlogEditorialReviewError);

    try {
      assertPublishableBlogPostReview({
        ...validPublishedRecord(),
        content: "Our attorneys helped homeowners cancel agreements.",
      }, NOW);
    } catch (error) {
      expect((error as BlogEditorialReviewError).issues).toContain("unsupported_first_party_claims");
    }
  });

  it("reports stable issue codes without echoing review content", () => {
    try {
      assertPublishableBlogPostReview({ published: 1 }, NOW);
      throw new Error("expected the publication boundary to reject the row");
    } catch (error) {
      expect(error).toBeInstanceOf(BlogEditorialReviewError);
      expect((error as BlogEditorialReviewError).issues).toContain("editorial_primary_sources_invalid");
      expect(String(error)).not.toContain("undefined");
    }
  });

  it("filters full stored rows for evidence and unsupported claims before pagination", () => {
    const approvedFirst = {
      ...validPublishedRecord(),
      slug: "approved-first",
      title: "Agreement records checklist",
      content: "Gather the signed agreement, invoices, and written communications before review.",
    };
    const unreviewed = {
      ...approvedFirst,
      slug: "unreviewed",
      editorialReviewerName: null,
    };
    const unsupported = {
      ...approvedFirst,
      slug: "unsupported",
      content: "Our attorneys helped homeowners cancel agreements.",
    };
    const approvedSecond = {
      ...approvedFirst,
      slug: "approved-second",
      content: "Compare the signed agreement with dated billing and installation records.",
    };

    expect(filterPublishableBlogPostPage(
      [unreviewed, approvedFirst, unsupported, approvedSecond],
      1,
      1,
    )).toEqual([approvedSecond]);
  });
});

describe("public database content reads", () => {
  const dbSource = fs.readFileSync(new URL("./db.ts", import.meta.url), "utf8");
  const listRead = dbSource.slice(
    dbSource.indexOf("export async function getDbBlogPosts("),
    dbSource.indexOf("export async function getDbBlogPostsForPublication("),
  );
  const rawStatusRead = dbSource.slice(
    dbSource.indexOf("export async function getDbBlogPostStatus("),
    dbSource.indexOf("export async function getDbBlogPost("),
  );
  const publicPostRead = dbSource.slice(
    dbSource.indexOf("export async function getDbBlogPost("),
    dbSource.indexOf("export async function getDbCompanies("),
  );

  it("checks full stored rows before returning public blog cards", () => {
    expect(listRead).toContain("getDbBlogPostsForPublication(5000, 0)");
    expect(listRead).toContain("filterPublishableBlogPostPage(rows, limit, offset)");
    expect(listRead).not.toContain(".select({");
  });

  it("filters the public single-post helper but preserves raw status for quarantine delivery", () => {
    expect(publicPostRead).toContain("isBlogPostPublishable(post) ? post : null");
    expect(rawStatusRead).not.toContain("isBlogPostPublishable");
  });
});

describe("admin publication paths", () => {
  const adminSource = fs.readFileSync(new URL("./adminRouter.ts", import.meta.url), "utf8");
  const trpcSource = fs.readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
  const adminPostRoutes = adminSource.slice(
    adminSource.indexOf('// POST /api/admin/posts'),
    adminSource.indexOf('// DELETE /api/admin/posts/:slug'),
  );

  it("routes REST creates and updates through the centralized database helpers", () => {
    expect(adminPostRoutes).toContain("await createBlogPost(");
    expect(adminPostRoutes).toContain("await updateBlogPost(");
    expect(adminPostRoutes).not.toMatch(/db\s*\.\s*insert\s*\(\s*blogPosts\s*\)/);
    expect(adminPostRoutes).not.toMatch(/db\s*\.\s*update\s*\(\s*blogPosts\s*\)/);
  });

  it("gives publishing its own non-default permission", () => {
    const allowlist = adminSource.slice(
      adminSource.indexOf("const API_KEY_PERMISSIONS"),
      adminSource.indexOf("const DEFAULT_API_KEY_PERMISSIONS"),
    );
    const defaults = adminSource.slice(
      adminSource.indexOf("const DEFAULT_API_KEY_PERMISSIONS"),
      adminSource.indexOf("type EditorialWriteFields"),
    );
    expect(allowlist).toContain('"posts:publish"');
    expect(defaults).not.toContain('"posts:publish"');
  });

  it("routes the protected tRPC update through the same helper", () => {
    const updateRoute = trpcSource.slice(
      trpcSource.indexOf("updatePost: protectedProcedure"),
      trpcSource.indexOf("uploadImage: protectedProcedure"),
    );
    expect(updateRoute).toContain("await updateBlogPost(");
    expect(updateRoute).toContain("BlogEditorialReviewError");
  });
});

describe("editorial review migration", () => {
  const migration = fs.readFileSync(
    new URL("../drizzle/0013_editorial_blog_review.sql", import.meta.url),
    "utf8",
  );

  it("adds all review fields and fails legacy rows closed", () => {
    for (const column of [
      "editorialReviewerName",
      "editorialReviewerRole",
      "editorialReviewedAt",
      "editorialPrimarySources",
      "editorialUniqueValueSummary",
      "editorialFunnelOnlyDuplicate",
    ]) {
      expect(migration).toContain(`\`${column}\``);
    }
    expect(migration).toMatch(/editorialFunnelOnlyDuplicate` tinyint DEFAULT 1 NOT NULL/);
  });
});
