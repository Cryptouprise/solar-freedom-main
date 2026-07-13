import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import PrivacyVideoEmbed, { buildPrivacyEnhancedYouTubeUrl } from "./PrivacyVideoEmbed";

describe("PrivacyVideoEmbed", () => {
  it("renders a network-neutral placeholder before the visitor chooses Play", () => {
    const html = renderToStaticMarkup(
      <PrivacyVideoEmbed videoId="s6V76pijGKI" title="Contract explainer" />,
    );

    expect(html).toContain('data-video-placeholder="youtube"');
    expect(html).toContain("privacy-enhanced player loads only after you choose Play");
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("youtube.com");
    expect(html).not.toContain("youtube-nocookie.com");
    expect(html).not.toContain("s6V76pijGKI");
  });

  it("only builds privacy-enhanced URLs for valid video IDs", () => {
    expect(buildPrivacyEnhancedYouTubeUrl("s6V76pijGKI")).toBe(
      "https://www.youtube-nocookie.com/embed/s6V76pijGKI?autoplay=1&rel=0&modestbranding=1",
    );
    expect(() => buildPrivacyEnhancedYouTubeUrl("../bad?video=1")).toThrow("Invalid YouTube video ID");
  });

  it("keeps every public video surface behind the shared click-to-load boundary", () => {
    const pageNames = ["YouTubeLanding", "Yt2Landing", "Yt3Landing", "MediaHub"];
    for (const pageName of pageNames) {
      const source = fs.readFileSync(new URL(`../pages/${pageName}.tsx`, import.meta.url), "utf8");
      expect(source, pageName).toContain("PrivacyVideoEmbed");
      expect(source, pageName).not.toContain("<iframe");
      expect(source, pageName).not.toContain("www.youtube.com/embed");
    }
  });
});
