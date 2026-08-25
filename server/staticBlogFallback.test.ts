import { describe, expect, it } from "vitest";
import { staticPostToHtml } from "./db";

describe("static blog fallback", () => {
  it("creates editable semantic HTML without allowing source markup injection", () => {
    const html = staticPostToHtml({
      slug: "test-static-post",
      title: "Test static post",
      metaTitle: "Test static post",
      metaDescription: "Test description",
      category: "Guide",
      readTime: "4 min read",
      publishDate: "August 2026",
      excerpt: "Test excerpt",
      heroImage: "https://example.com/image.jpg",
      heroAlt: "Test image",
      ctaText: "Review",
      ctaSubtext: "Test subtext",
      faq: [],
      relatedSlugs: [],
      content: [
        { type: "h2", content: "A heading" },
        { type: "p", content: "A <script>unsafe</script> paragraph" },
        { type: "list", items: ["First", "Second"] },
      ],
    });

    expect(html).toContain("<h2>A heading</h2>");
    expect(html).toContain("&lt;script&gt;unsafe&lt;/script&gt;");
    expect(html).toContain("<li>First</li>");
  });
});
