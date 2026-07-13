import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "../..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

describe("public delivery performance guardrails", () => {
  it("keeps complete content catalogs out of the production entry module", () => {
    const main = read("client/src/main.tsx");

    expect(main).not.toContain('from "./data/cities"');
    expect(main).not.toContain('from "./data/companies"');
    expect(main).not.toContain('import("./data/blog")');
    expect(main).toContain('"/cancel-solar-contract/:slug"');
    expect(main).toContain('"/cancel-:slug-solar-contract"');
    expect(main).toContain('"/blog/:slug"');
  });

  it("loads Home as a route chunk instead of charging every route for it", () => {
    const app = read("client/src/App.tsx");

    expect(app).not.toContain('import Home from "./pages/Home"');
    expect(app).toContain('const Home = lazy(() => import("./pages/Home"))');
  });

  it("uses CSP-safe font loading in both document renderers", () => {
    const index = read("client/index.html");
    const prerender = read("scripts/prerender.mjs");

    expect(index).toContain("fonts.googleapis.com/css2");
    expect(index).not.toContain('media="print"');
    expect(index).not.toMatch(/\bonload=/i);
    expect(prerender).toContain("FONT_STYLESHEET_URL");
    expect(prerender).toContain(
      '<link rel="stylesheet" href="${FONT_STYLESHEET_URL}">'
    );
  });

  it("uses supported crawler directives without obsolete keyword or invented bot metadata", () => {
    const index = read("client/index.html");

    expect(index).toContain('name="robots"');
    expect(index).toContain('name="msvalidate.01"');
    expect(index).not.toContain('name="keywords"');
    for (const bot of [
      "perplexity-bot",
      "gptbot",
      "anthropic-ai",
      "google-extended",
      "cohere-ai",
    ]) {
      expect(index).not.toContain(`name="${bot}"`);
    }
  });

  it("does not promote unreviewed city or company detail inventories from the homepage", () => {
    const home = read("client/src/pages/Home.tsx");

    expect(home).not.toContain("featuredCities");
    expect(home).not.toContain("COMPANY_PAGES.map");
    expect(home).not.toContain("/cancel-solar-contract/${");
    expect(home).not.toContain("/cancel-${company.slug}-solar-contract");
    expect(home).toContain('href="/solar-contract-laws"');
    expect(home).toContain('href="/solar-companies"');
  });
});
