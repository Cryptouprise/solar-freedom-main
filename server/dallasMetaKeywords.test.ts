import { describe, expect, it } from "vitest";
import * as cheerio from "cheerio";
import { getPageMetaKeywords } from "../shared/pageMetaKeywords";
import { injectMetaDynamic, injectPageMetaKeywords } from "./seo-meta";

const pagePath = "/cancel-solar-contract/dallas-tx";
const expectedKeywords = [
  "cancel solar contract Dallas",
  "Dallas solar contract cancellation",
  "Texas solar contract rights",
  "Dallas solar lease cancellation",
  "Dallas solar PPA cancellation",
];
const template = '<!doctype html><html><head><title>Dallas guide</title><meta name="description" content="Existing description"><meta name="robots" content="noindex, follow"><link rel="canonical" href="https://breakyoursolarcontract.com/cancel-solar-contract/dallas-tx"></head><body><h1>Existing heading</h1></body></html>';

function checkKeywords(html: string) {
  const $ = cheerio.load(html);
  expect($('meta[name="keywords"]')).toHaveLength(1);
  const terms = $('meta[name="keywords"]').attr("content")!.split(",").map(term => term.trim());
  expect(terms).toEqual(expectedKeywords);
  expect(terms.length).toBeGreaterThanOrEqual(3);
  expect(terms.length).toBeLessThanOrEqual(8);
  expect(new Set(terms).size).toBe(5);
  return $;
}

describe("Dallas meta keywords", () => {
  it("adds exactly five unique keywords without altering other page fields", () => {
    const $ = checkKeywords(injectPageMetaKeywords(template, pagePath));
    expect($("title").text()).toBe("Dallas guide");
    expect($('meta[name="description"]').attr("content")).toBe("Existing description");
    expect($('meta[name="robots"]').attr("content")).toBe("noindex, follow");
    expect($('link[rel="canonical"]').attr("href")).toBe(`https://breakyoursolarcontract.com${pagePath}`);
    expect($("h1").text()).toBe("Existing heading");
    expect(getPageMetaKeywords(`${pagePath}/?source=test`)).toBe(expectedKeywords.join(", "));
    expect(getPageMetaKeywords(`${pagePath}-other`)).toBeUndefined();
  });

  it("replaces stale city keywords and remains a single tag in server delivery", async () => {
    const stale = injectPageMetaKeywords(template, "/cancel-solar-contract/houston-tx");
    const result = injectPageMetaKeywords(stale, pagePath);
    checkKeywords(result);
    expect(injectPageMetaKeywords(result, pagePath)).toBe(result);
    checkKeywords(await injectMetaDynamic(template, pagePath));
    expect(getPageMetaKeywords("/cancel-solar-contract/houston-tx")).toContain("Houston");
  });

  it("emits the same Dallas keywords in build-time HTML", async () => {
    // @ts-expect-error The prerender implementation intentionally remains plain ESM.
    const prerender = await import("../scripts/prerender.mjs");
    const { cityEntries } = await prerender.loadData();
    const meta = prerender.buildMetaMap(cityEntries, [], [], {});
    checkKeywords(prerender.buildShellHtml(meta[pagePath], "app.js", "app.css", pagePath));
  });
});
