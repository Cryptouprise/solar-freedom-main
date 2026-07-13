import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildSchedulerUrl, DEFAULT_SCHEDULER_URL } from "./scheduler";

const projectRoot = path.resolve(import.meta.dirname, "../../..");

describe("scheduler URL privacy", () => {
  it("strips contact data and caller-supplied query strings", () => {
    const result = new URL(buildSchedulerUrl(
      `${DEFAULT_SCHEDULER_URL}?first_name=Ada&last_name=Lovelace&phone=%2B19045550123&email=ada%40example.com#contact`,
      {
        source: "quick_callback",
        campaign: "sticky_blog_sidebar",
        location: "Denver, CO",
      },
    ));

    expect(result.protocol).toBe("https:");
    expect(result.hostname).toBe("link.myinfinite.ai");
    expect(result.hash).toBe("");
    expect(Object.fromEntries(result.searchParams)).toEqual({
      utm_source: "quick_callback",
      utm_campaign: "sticky_blog_sidebar",
      sf_location: "Denver, CO",
    });
    expect(result.toString()).not.toMatch(/Ada|Lovelace|19045550123|example\.com/i);
  });

  it("rejects PII-like context and untrusted scheduler endpoints", () => {
    const result = new URL(buildSchedulerUrl(
      "https://attacker.example/widget/booking/steal?email=victim@example.com",
      {
        source: "person@example.com",
        campaign: "+1 (904) 555-0123",
        location: "Jacksonville, FL",
      },
    ));

    expect(`${result.origin}${result.pathname}`).toBe(DEFAULT_SCHEDULER_URL);
    expect(Object.fromEntries(result.searchParams)).toEqual({
      sf_location: "Jacksonville, FL",
    });
  });

  it("keeps form contact fields out of every scheduler URL builder", () => {
    for (const relativePath of [
      "client/src/components/QuickCallbackForm.tsx",
      "client/src/pages/CityPage.tsx",
    ]) {
      const source = fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
      expect(source, relativePath).toContain("buildSchedulerUrl");
      expect(source, relativePath).not.toMatch(
        /(?:searchParams|params)\.set\(["'](?:first_name|last_name|name|phone|email)["']/i,
      );
      expect(source, relativePath).not.toMatch(
        /buildSchedulerUrl\([\s\S]{0,500}(?:firstName|lastName|phone|email)\s*:/,
      );
    }
  });
});
