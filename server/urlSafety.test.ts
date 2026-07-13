import { describe, expect, it } from "vitest";
import {
  hasExpectedCookieDomain,
  hasExpectedHostname,
  safeMediaUrl,
  vimeoEmbedUrl,
  youtubeEmbedUrl,
} from "../shared/urlSafety";

describe("URL safety", () => {
  it("matches exact hosts or real subdomains, not substring lookalikes", () => {
    expect(hasExpectedHostname("https://app.prlog.org/done", "prlog.org")).toBe(true);
    expect(hasExpectedHostname("https://prlog.org.evil.example/done", "prlog.org")).toBe(false);
    expect(hasExpectedCookieDomain(".medium.com", "medium.com")).toBe(true);
    expect(hasExpectedCookieDomain("evilmedium.com", "medium.com")).toBe(false);
  });

  it("allows only HTTP(S) media and builds constrained embed URLs", () => {
    expect(safeMediaUrl("javascript:alert(1)")).toBeNull();
    expect(safeMediaUrl("https://cdn.example/image.png")).toBe("https://cdn.example/image.png");
    expect(youtubeEmbedUrl("https://www.youtube.com/watch?v=abc_DEF-12")).toBe("https://www.youtube.com/embed/abc_DEF-12");
    expect(youtubeEmbedUrl("https://youtube.com.evil.example/watch?v=abc_DEF-12")).toBeNull();
    expect(vimeoEmbedUrl("https://vimeo.com/123456789")).toBe("https://player.vimeo.com/video/123456789");
  });
});
