import { describe, expect, it } from "vitest";
import { extractAgentJson, normalizeSeoPublishedSlug, validateSeoOutput } from "./agents/seoOutputValidation";
import { scheduledOutputTokenCap, SCHEDULED_RUN_BUDGET_MS } from "./agents/engine";

const valid = { analysis: "Verified search measurements identify a specific page to review without promising a ranking improvement.", actions: [] };
describe("autopilot run delivery safeguards", () => {
  it("fails plain text and malformed JSON instead of marking it successful", () => {
    expect(() => validateSeoOutput("Everything is great. Done.")).toThrow("no complete JSON");
    expect(() => validateSeoOutput('{"analysis": "checked", | "actions": []}')).toThrow("malformed JSON");
  });
  it("requires a real summary and explicit action array", () => {
    expect(() => validateSeoOutput(JSON.stringify({ analysis: "done" }))).toThrow("SEO delivery invalid");
    expect(validateSeoOutput(JSON.stringify(valid)).actions).toEqual([]);
  });
  it("enforces strict metadata maxima and bounded action quantities", () => {
    expect(() => validateSeoOutput(JSON.stringify({ ...valid, optimizeExisting: [{ postSlug: "sunrun", keyword: "Sunrun", metaTitle: "x".repeat(61) }] }))).toThrow();
    expect(() => validateSeoOutput(JSON.stringify({ ...valid, optimizeExisting: [{ postSlug: "sunrun", keyword: "Sunrun", metaDescription: "x".repeat(156) }] }))).toThrow();
    expect(() => validateSeoOutput(JSON.stringify({ ...valid, actions: Array.from({ length: 4 }, () => ({ title: "Review", description: "Specific change", actionType: "meta_fix" })) }))).toThrow();
  });
  it("extracts balanced JSON with quoted braces", () => {
    expect(extractAgentJson('```json\n{"analysis":"a } in text","actions":[]}\n```')).toBe('{"analysis":"a } in text","actions":[]}');
  });
  it("accepts exact own-site blog paths but rejects external and ambiguous targets", () => {
    expect(normalizeSeoPublishedSlug("/blog/cancel-sunrun-contract")).toBe("cancel-sunrun-contract");
    expect(normalizeSeoPublishedSlug("https://breakyoursolarcontract.com/blog/cancel-sunrun-contract")).toBe("cancel-sunrun-contract");
    expect(normalizeSeoPublishedSlug("https://evil.example/blog/cancel-sunrun-contract")).toBeNull();
    expect(normalizeSeoPublishedSlug("/cancel-solar-contract/houston-tx")).toBeNull();
    expect(normalizeSeoPublishedSlug("//evil.example/blog/sunrun")).toBeNull();
  });
  it("allows actual content delivery while keeping scheduled requests below platform timeout", () => {
    expect(scheduledOutputTokenCap("content")).toBe(6000);
    expect(scheduledOutputTokenCap("editor")).toBe(4000);
    expect(scheduledOutputTokenCap("seo_intel")).toBe(4096);
    expect(SCHEDULED_RUN_BUDGET_MS).toBeLessThan(120_000);
  });
});
