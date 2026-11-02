import { describe, expect, it } from "vitest";
import * as cheerio from "cheerio";
import { getPageMetaKeywords } from "../shared/pageMetaKeywords";
import { injectMeta, injectMetaDynamic, injectPageMetaKeywords } from "./seo-meta";

const pagePath = "/cancel-solar-contract/houston-tx";
const template = '<!doctype html><html><head><title>Original</title><meta name="description" content="Original description"><link rel="canonical" href="https://breakyoursolarcontract.com/cancel-solar-contract/houston-tx"><meta name="robots" content="index, follow"></head><body><h1>Houston guide</h1></body></html>';

function expectHoustonKeywords(html: string) {
  const $ = cheerio.load(html);
  expect($('meta[name="keywords"]')).toHaveLength(1);
  const terms = $('meta[name="keywords"]').attr("content")!.split(",").map(term => term.trim());
  expect(terms).toHaveLength(5);
  expect(terms.length).toBeGreaterThanOrEqual(3);
  expect(terms.length).toBeLessThanOrEqual(8);
  expect(new Set(terms).size).toBe(terms.length);
  expect(terms.every(term => term && /solar/i.test(term))).toBe(true);
  expect(terms).toEqual([
    "cancel solar contract Houston",
    "Houston solar contract cancellation",
    "Texas solar contract rights",
    "Houston solar lease cancellation",
    "Houston solar PPA cancellation",
  ]);
}

describe("Houston page meta keywords", () => {
  it("adds exactly five focused keywords without changing other metadata or body", () => {
    const result = injectPageMetaKeywords(template, pagePath);
    expectHoustonKeywords(result);
    const $ = cheerio.load(result);
    expect($("title").text()).toBe("Original");
    expect($('meta[name="description"]').attr("content")).toBe("Original description");
    expect($('link[rel="canonical"]').attr("href")).toBe(`https://breakyoursolarcontract.com${pagePath}`);
    expect($('meta[name="robots"]').attr("content")).toBe("index, follow");
    expect($("h1").text()).toBe("Houston guide");
  });

  it("deduplicates existing tags and remains idempotent", () => {
    const result = injectPageMetaKeywords(template.replace("</head>", '<meta name="keywords" content="old"><meta name="keywords" content="duplicate"></head>'), pagePath);
    expectHoustonKeywords(result);
    expect(injectPageMetaKeywords(result, pagePath)).toBe(result);
  });

  it("supports query strings and trailing slashes without affecting other routes", () => {
    expect(getPageMetaKeywords(`${pagePath}/?source=test`)).toBe(getPageMetaKeywords(pagePath));
    expect(getPageMetaKeywords("/cancel-solar-contract/phoenix-az")).toBeUndefined();
    expect(injectPageMetaKeywords(template, "/cancel-solar-contract/phoenix-az")).toBe(template);
    expect(getPageMetaKeywords(`${pagePath}-other`)).toBeUndefined();
  });

  it("includes the same tag in static and dynamic server metadata injection", async () => {
    expectHoustonKeywords(injectMeta(template, pagePath));
    expectHoustonKeywords(await injectMetaDynamic(template, pagePath));
  });

  it("includes Houston keywords in build-time HTML, but not another city", async () => {
    // @ts-expect-error The build-time module intentionally remains plain ESM.
    const prerender = await import("../scripts/prerender.mjs");
    const { cityEntries } = await prerender.loadData();
    const meta = prerender.buildMetaMap(cityEntries, [], [], {});
    expectHoustonKeywords(prerender.buildShellHtml(meta[pagePath], "app.js", "app.css", pagePath));
    const otherPath = "/cancel-solar-contract/phoenix-az";
    const $ = cheerio.load(prerender.buildShellHtml(meta[otherPath], "app.js", "app.css", otherPath));
    expect($('meta[name="keywords"]')).toHaveLength(0);
  });
});
