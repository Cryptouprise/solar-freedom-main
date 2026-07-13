import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("Home legal footer", () => {
  const source = fs.readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
  const legalFooter = source.slice(
    source.lastIndexOf('>LEGAL</div>'),
    source.lastIndexOf("Consumer information; not legal advice"),
  );

  it("links to the real privacy and terms routes without placeholder anchors", () => {
    expect(legalFooter).toContain('href="/privacy-policy"');
    expect(legalFooter).toContain('href="/terms"');
    expect(legalFooter).not.toContain('href="#"');
  });

  it("keeps hosted videos click-to-load and removes accusatory issue labels", () => {
    expect(source).toContain('data-video-placeholder="hosted-media"');
    expect(source).toContain("setLoaded(true)");
    expect(source).not.toContain('<video\n                      src={vid.src}');
    expect(source).not.toContain("TILA and consumer protection violations");
    expect(source).not.toContain("Right of rescission never properly disclosed");
  });
});
