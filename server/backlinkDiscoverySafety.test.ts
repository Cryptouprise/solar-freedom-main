import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  backlinkCandidateUrlVariants,
  DEFAULT_BACKLINK_RESEARCH_MODEL,
  KNOWN_PR_SITES,
  normalizeBacklinkCandidateUrl,
  parseUnverifiedBacklinkSuggestions,
} from "./cron/backlinkDiscovery";

const ROOT = path.resolve(import.meta.dirname, "..");

describe("backlink research safety", () => {
  it("keeps historical seeds metric-free and uses the no-spend router", () => {
    expect(DEFAULT_BACKLINK_RESEARCH_MODEL).toBe("openrouter/free");
    expect(KNOWN_PR_SITES.length).toBeGreaterThan(0);

    for (const site of KNOWN_PR_SITES) {
      expect(normalizeBacklinkCandidateUrl(site.url), site.url).not.toBeNull();
      expect(site, site.name).not.toHaveProperty("da");
      expect(site, site.name).not.toHaveProperty("domainAuthority");
      expect(site, site.name).not.toHaveProperty("doFollow");
    }
  });

  it("accepts only public-host external HTTPS URLs", () => {
    expect(normalizeBacklinkCandidateUrl("https://consumer.example.edu/resources#links"))
      .toBe("https://consumer.example.edu/resources");

    const rejected = [
      "http://publisher.com/submit",
      "javascript:alert(1)",
      "https://user:secret@publisher.com/submit",
      "https://publisher.com:8443/submit",
      "https://localhost/submit",
      "https://admin.internal/submit",
      "https://127.0.0.1/submit",
      "https://[::1]/submit",
      "https://2130706433/submit",
      "https://breakyoursolarcontract.com/blog",
      "https://research.breakyoursolarcontract.com/blog",
      "https://example.com/submit",
      "//publisher.com/submit",
    ];

    for (const value of rejected) {
      expect(normalizeBacklinkCandidateUrl(value), value).toBeNull();
    }
  });

  it("queries both legacy raw and canonical URL spellings during seed repair", () => {
    expect(backlinkCandidateUrlVariants("https://publisher.com"))
      .toEqual(["https://publisher.com", "https://publisher.com/"]);
    expect(backlinkCandidateUrlVariants("https://publisher.com/"))
      .toEqual(["https://publisher.com/"]);
    expect(backlinkCandidateUrlVariants("http://publisher.com"))
      .toEqual([]);
  });

  it("drops malformed, unsafe, and duplicate model suggestions", () => {
    const parsed = parseUnverifiedBacklinkSuggestions(JSON.stringify({
      opportunities: [
        {
          name: "  Consumer\u0000 Resource   Hub  ",
          url: "https://publisher.com/resources#solar",
          type: "resource_page",
          relevanceScore: 180,
          relevanceReason: "Guaranteed active and high authority",
          domainAuthority: 99,
          doFollow: 1,
        },
        {
          name: "Duplicate",
          url: "https://publisher.com/resources",
          type: "resource_page",
          relevanceScore: 25,
        },
        {
          name: "Local service",
          url: "https://127.0.0.1/admin",
          type: "directory",
          relevanceScore: 50,
        },
        {
          name: "Unsupported type",
          url: "https://news-site.com/",
          type: "guaranteed_link",
          relevanceScore: 50,
        },
      ],
    }));

    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({
      name: "Consumer Resource Hub",
      url: "https://publisher.com/resources",
      type: "resource_page",
      relevanceScore: 100,
      domainAuthority: null,
      doFollow: null,
      discoveredVia: "ai_unverified_research",
    });
    expect(parsed[0].relevanceReason).toContain("Unverified research candidate");
    expect(parsed[0].relevanceReason).not.toContain("Guaranteed");
  });

  it("returns no candidates for invalid provider JSON", () => {
    expect(parseUnverifiedBacklinkSuggestions("not json")).toEqual([]);
    expect(parseUnverifiedBacklinkSuggestions(JSON.stringify({ opportunities: "nope" })))
      .toEqual([]);
  });

  it("never seeds approval or exposes raw exception strings", () => {
    const source = fs.readFileSync(
      path.join(ROOT, "server/cron/backlinkDiscovery.ts"),
      "utf8",
    );

    expect(source).not.toMatch(/status:\s*["']approved["']/);
    expect(source).not.toMatch(/String\s*\(\s*(?:err|error)\s*\)/);
    expect(source).not.toMatch(/(?:domainAuthority|doFollow):\s*site\./);
    expect(source).toContain('status: "new"');
    expect(source).toContain('domainAuthority: null');
    expect(source).toContain('doFollow: null');
    expect(source).toContain("backlinkCandidateUrlVariants(site.url)");
    expect(source).toContain("inArray(backlinkOpportunities.url, urlVariants)");
    expect(source).toContain("db.delete(backlinkOpportunities)");
  });

  it("migrates unsupported seed metrics without erasing real human review", () => {
    const migration = fs.readFileSync(
      path.join(ROOT, "drizzle/0014_reset_backlink_seed_claims.sql"),
      "utf8",
    );

    expect(migration).toContain("WHERE `discoveredVia` = 'initial seed'");
    expect(migration).toContain("`relevanceScore` = NULL");
    expect(migration).toContain("`domainAuthority` = NULL");
    expect(migration).toContain("`doFollow` = NULL");
    expect(migration).toMatch(/WHEN `reviewedAt` IS NULL[\s\S]+THEN 'new'[\s\S]+ELSE `status`/);
    expect(migration).not.toMatch(/`status`\s*=\s*'new'/);
  });

  it("never selects legacy backlink-target credential columns for the API", () => {
    const routers = fs.readFileSync(path.join(ROOT, "server/routers.ts"), "utf8");
    const getTargets = routers.slice(
      routers.indexOf("getTargets: protectedProcedure"),
      routers.indexOf("seedKnownSites: protectedProcedure"),
    );

    expect(getTargets).toContain("db.select({");
    expect(getTargets).not.toContain("db.select().from(backlinkTargets)");
    expect(getTargets).not.toContain("backlinkTargets.accountEmail");
    expect(getTargets).not.toContain("backlinkTargets.accountPassword");
    expect(getTargets).not.toContain("backlinkTargets.accountUsername");
    expect(getTargets).not.toContain("backlinkTargets.accountNotes");
    expect(getTargets).not.toContain("backlinkTargets.domainAuthority");
    expect(getTargets).not.toContain("backlinkTargets.domainRating");
    expect(getTargets).not.toContain("backlinkTargets.estimatedTraffic");
    expect(getTargets).not.toContain("backlinkTargets.doFollow");
  });
});
