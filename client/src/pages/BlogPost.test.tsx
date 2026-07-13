import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const unsafeDbPost = {
  slug: "unsafe-db-article",
  title: "Unsafe database article",
  excerpt: "Unreviewed article",
  content: "<p>Our attorneys have helped homeowners cancel contracts.</p>",
  published: 1,
  category: "Guide",
  tags: [],
  relatedSlugs: [],
  faqItems: [],
};

vi.mock("wouter", () => ({
  useParams: () => ({ slug: unsafeDbPost.slug }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/data/blog", () => ({
  getBlogPost: () => undefined,
  getRelatedPosts: () => [],
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    content: {
      getPost: {
        useQuery: () => ({ data: unsafeDbPost, isLoading: false }),
      },
    },
  },
}));

vi.mock("@/hooks/useSeoMeta", () => ({ useSeoMeta: () => undefined }));
vi.mock("@/hooks/useSiteConfig", () => ({
  useSiteConfig: () => ({
    phoneDisplay: "(904) 921-4971",
    phoneHref: "tel:+19049214971",
    phoneDigits: "+19049214971",
  }),
}));

vi.mock("@/components/SchemaInjector", () => ({ SchemaInjector: () => null }));
vi.mock("@/components/StickyMobileBar", () => ({ default: () => null }));
vi.mock("@/components/DoIQualifyQuiz", () => ({ default: () => null }));
vi.mock("@/components/QuickCallbackForm", () => ({ default: () => null }));

import BlogPost from "./BlogPost";

describe("BlogPost publication gate", () => {
  it("withholds an unsafe DB article before its HTML render path", () => {
    const html = renderToStaticMarkup(<BlogPost />);

    expect(html).toContain("This article is temporarily withheld.");
    expect(html).toContain("Editorial review pending");
    expect(html).not.toContain("Unsafe database article");
    expect(html).not.toContain("Our attorneys have helped");
    expect(html).not.toContain("data-content-source=\"database\"");
  });
});
