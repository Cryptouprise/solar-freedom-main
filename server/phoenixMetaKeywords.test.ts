import { describe, expect, it } from "vitest";
import * as cheerio from "cheerio";
import { getPageMetaKeywords } from "../shared/pageMetaKeywords";
import { injectMeta, injectMetaDynamic, injectPageMetaKeywords } from "./seo-meta";

const pagePath = "/cancel-solar-contract/phoenix-az";
const expectedKeywords = [
  "cancel solar contract Phoenix",
  "Phoenix solar contract cancellation",
  "Arizona solar contract rights",
  "Phoenix solar lease cancellation",
  "Phoenix solar PPA cancellation",
];
const template = '<!doctype html><html><head><title>Phoenix guide</title><meta name="description" content="Existing description"><meta name="robots" content="index, follow"><link rel="canonical" href="https://breakyoursolarcontract.com/cancel-solar-contract/phoenix-az"></head><body><h1>Existing heading</h1></body></html>';

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

describe("Phoenix meta keywords", () => {
  it("adds exactly five unique terms while preserving all other metadata and content", () => {
    const $ = checkKeywords(injectPageMetaKeywords(template, pagePath));
    expect($("title").text()).toBe("Phoenix guide");
    expect($('meta[name="description"]').attr("content")).toBe("Existing description");
    expect($('meta[name="robots"]').attr("content")).toBe("index, follow");
    expect($('link[rel="canonical"]').attr("href")).toBe(`https://breakyoursolarcontract.com${pagePath}`);
    expect($("h1").text()).toBe("Existing heading");
    expect(getPageMetaKeywords(`${pagePath}/?source=test`)).toBe(expectedKeywords.join(", "));
    expect(getPageMetaKeywords(`${pagePath}-other`)).toBeUndefined();
  });

  it("deduplicates stale tags and emits consistent static and dynamic metadata", async () => {
    const stale = template.replace("</head>", '<meta name="keywords" content="old"><meta name="keywords" content="duplicate"></head>');
    const result = injectPageMetaKeywords(stale, pagePath);
    checkKeywords(result);
    expect(injectPageMetaKeywords(result, pagePath)).toBe(result);
    checkKeywords(injectMeta(template, pagePath));
    checkKeywords(await injectMetaDynamic(template, pagePath));
    expect(getPageMetaKeywords("/cancel-solar-contract/houston-tx")).toContain("Houston");
    expect(getPageMetaKeywords("/cancel-solar-contract/dallas-tx")).toContain("Dallas");
  });

  it("emits the same five Phoenix keywords in build-time HTML", async () => {
    // @ts-expect-error The prerender implementation intentionally remains plain ESM.
    const prerender = await import("../scripts/prerender.mjs");
    const { cityEntries } = await prerender.loadData();
    const meta = prerender.buildMetaMap(cityEntries, [], [], {});
    checkKeywords(prerender.buildShellHtml(meta[pagePath], "app.js", "app.css", pagePath));
  });
});
