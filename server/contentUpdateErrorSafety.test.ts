import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  updateBlogPost: vi.fn(),
  getSiteConfigValues: vi.fn().mockResolvedValue({}),
}));

vi.mock("./db", () => {
  class BlogEditorialReviewError extends Error {
    readonly issues: string[];

    constructor(issues: string[]) {
      super("Published blog posts require a complete evidence-first editorial review");
      this.name = "BlogEditorialReviewError";
      this.issues = [...issues];
    }
  }

  return {
    BlogEditorialReviewError,
    getDb: vi.fn().mockResolvedValue(null),
    getLeads: vi.fn().mockResolvedValue([]),
    insertExitIntentCapture: vi.fn(),
    insertLead: vi.fn(),
    markLeadGhlSent: vi.fn(),
    updateLeadStatus: vi.fn(),
    getDbBlogPosts: vi.fn().mockResolvedValue([]),
    getDbBlogPost: vi.fn().mockResolvedValue(null),
    getDbCompanies: vi.fn().mockResolvedValue([]),
    getDbCompany: vi.fn().mockResolvedValue(null),
    getSiteConfigValues: dbMocks.getSiteConfigValues,
    getAllBlogPostsAdmin: vi.fn().mockResolvedValue([]),
    getAdminBlogPost: vi.fn().mockResolvedValue(null),
    updateBlogPost: dbMocks.updateBlogPost,
  };
});

import { BlogEditorialReviewError } from "./db";
import { appRouter } from "./routers";

function makeAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-open-id",
      role: "admin",
      name: "Admin",
      email: "admin@example.test",
      loginMethod: null,
      createdAt: new Date("2026-07-13T00:00:00.000Z"),
      updatedAt: new Date("2026-07-13T00:00:00.000Z"),
      lastSignedIn: new Date("2026-07-13T00:00:00.000Z"),
    },
    req: { headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function makePublicContext(): TrpcContext {
  return {
    user: null,
    req: { headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("content.updatePost error boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("safe-logs an unknown failure and returns a stable internal error", async () => {
    const secret = [
      "mysql://admin:",
      "do-not-expose@",
      "database.internal/content",
    ].join("");
    dbMocks.updateBlogPost.mockRejectedValueOnce(new Error(secret));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const caller = appRouter.createCaller(makeAdminContext());

    await expect(caller.content.updatePost({ slug: "draft", title: "Updated title" }))
      .rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to update the blog post.",
      });

    expect(consoleError).toHaveBeenCalledOnce();
    const logged = consoleError.mock.calls.flat().join(" ");
    expect(logged).toContain("content.blog_post_update_failed");
    expect(logged).not.toContain(secret);
    expect(logged).not.toContain("do-not-expose");
    consoleError.mockRestore();
  });

  it("preserves stable editorial issue codes as a client-correctable error", async () => {
    dbMocks.updateBlogPost.mockRejectedValueOnce(
      new BlogEditorialReviewError(["editorial_primary_sources_invalid"]),
    );
    const caller = appRouter.createCaller(makeAdminContext());

    await expect(caller.content.updatePost({ slug: "draft", published: 1 }))
      .rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("editorial_primary_sources_invalid"),
      });
  });
});

describe("public company evidence boundary", () => {
  it("returns no database company records before an evidence schema exists", async () => {
    const caller = appRouter.createCaller(makePublicContext());

    await expect(caller.content.listCompanies()).resolves.toEqual([]);
    await expect(caller.content.getCompany({ slug: "legacy-company" })).resolves.toBeNull();
  });
});

describe("public site-config resilience", () => {
  it("returns safe compiled defaults when the config store is unavailable", async () => {
    const secret = [
      "mysql://admin:",
      "do-not-expose@",
      "database.internal/config",
    ].join("");
    dbMocks.getSiteConfigValues.mockRejectedValueOnce(new Error(secret));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const caller = appRouter.createCaller(makePublicContext());

    await expect(caller.content.getSiteConfig()).resolves.toMatchObject({
      phone_number: expect.any(String),
      phone_number_e164: expect.any(String),
      assistant_name: expect.any(String),
      assistant_title: expect.any(String),
    });

    const logged = consoleError.mock.calls.flat().join(" ");
    expect(logged).toContain("content.site_config_unavailable");
    expect(logged).not.toContain(secret);
    expect(logged).not.toContain("do-not-expose");
    consoleError.mockRestore();
  });
});
