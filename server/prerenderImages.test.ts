import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * The pre-rendered shell is what a crawler receives for every page. It used to be
 * built from text only, so every page shipped zero <img> tags even though the
 * article data contained image blocks and every city had an approved hero. That is
 * the "wall of text" defect the owner reported. These tests lock in image markup
 * so a future refactor cannot silently drop it again.
 *
 * These assertions read the built output, so they run against dist/public. When the
 * build has not been produced in the current checkout they skip rather than fail,
 * because a missing build directory is not a code defect.
 */
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist", "public");
const PRERENDER_SOURCE = path.join(ROOT, "scripts", "prerender.assembled.mjs");

function readPage(relative: string): string | null {
  const file = path.join(DIST, relative);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, "utf-8");
}

describe("pre-rendered shell carries real image markup", () => {
  const source = fs.readFileSync(PRERENDER_SOURCE, "utf-8");

  it("renders image content blocks instead of dropping them", () => {
    expect(source).toMatch(/section\.type === "image"/);
    // Only absolute http(s) sources may be emitted for in-body images.
    expect(source).toContain("/^https?:\\/\\//i.test(section.src)");
  });

  it("captures image src, alt and caption when parsing content sections", () => {
    expect(source).toMatch(/findStringProp\(object,\s*"src"\)/);
    expect(source).toMatch(/findStringProp\(object,\s*"alt"\)/);
    expect(source).toMatch(/findStringProp\(object,\s*"caption"\)/);
  });

  it("captures the article hero image so it can be emitted", () => {
    expect(source).toMatch(/heroImage:\s*findStringProp\(chunk,\s*"heroImage"\)/);
  });

  it("emits a hero figure in the shell body", () => {
    expect(source).toContain("${heroFigure}");
    expect(source).toMatch(/const heroFigure = heroIsSafe/);
  });

  it("loads the approved city hero registry", () => {
    expect(source).toMatch(/function cityHeroFor\(slug\)/);
    expect(source).toMatch(/city-heroes\.ts/);
  });

  it("gives the homepage a hero image", () => {
    const homepageBlock = source.slice(
      source.indexOf('map["/"]'),
      source.indexOf('map["/"]') + 500
    );
    expect(homepageBlock).toMatch(/heroImage:/);
  });

  describe("built output", () => {
    const cases: Array<[string, string]> = [
      ["index.html", "homepage"],
      ["blog/adt-solar-complaints/index.html", "blog post"],
      ["cancel-solar-contract/phoenix-az/index.html", "city page"],
      ["cancel-solar-contract/houston-tx/index.html", "city page"],
    ];

    for (const [relative, label] of cases) {
      it(`${label} ships at least one img tag (${relative})`, () => {
        const html = readPage(relative);
        if (html === null) {
          // No build in this checkout; the source-level assertions above still ran.
          return;
        }
        const images = html.match(/<img\b/gi) ?? [];
        expect(images.length).toBeGreaterThan(0);
        // Every emitted image must have alt text and a real source.
        for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
          expect(match[0]).toMatch(/\balt="/);
          expect(match[0]).toMatch(/\bsrc="(https?:\/\/|\/)/);
        }
      });
    }
  });
});
