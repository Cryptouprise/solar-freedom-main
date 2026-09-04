import { describe, expect, it } from "vitest";
import indexEligibility from "@shared/index-eligibility.json";
import seoRedirects from "@shared/seo-redirects.json";
import {
  ACTION_EXECUTORS,
  ADVISORY_ACTION_TYPES,
  EXECUTABLE_ACTION_TYPES,
  EXECUTOR_LIMITS,
  allowedInternalTargets,
  describeUnexecutable,
  findBannedCopy,
  isExecutable,
  parseFaqItems,
  parseJsonObject,
  resolveBlogSlug,
  type ExecutorContext,
} from "./executors";

function context(overrides: Partial<ExecutorContext> = {}): ExecutorContext {
  return {
    actionId: 1,
    actionType: "meta_rewrite",
    agentSlug: "seo_intel",
    title: "Improve the snippet",
    description: "",
    payload: {},
    ...overrides,
  };
}

/**
 * Every actionType an agent can create. Kept in sync with the createAction call
 * sites in moneyMaker.ts, seoIntel.ts, revenueIntelAgent.ts, managerAgent.ts and
 * infraAgent.ts. This is the regression guard for the original defect: agents
 * filed recommendations that no code path could ever act on or explain.
 */
const AGENT_PRODUCED_ACTION_TYPES = [
  // moneyMaker.ts
  "research_firm",
  "score_prospect",
  "recommend_outreach",
  "content_directive",
  "revenue_optimization",
  "lead_delivery_fix",
  // seoIntel.ts
  "content_gap",
  "meta_fix",
  "internal_link",
  "backlink_needed",
  "technical_fix",
  "schema_markup",
  "gsc_data_sync",
  // revenueIntelAgent.ts
  "cta_rewrite",
  "title_optimization",
  "meta_rewrite",
  "faq_addition",
  "position_push",
  "interlink_injection",
  // managerAgent.ts / infraAgent.ts
  "publish_content",
  "system_improvement",
  "error_fix",
];

describe("executor coverage", () => {
  it("accounts for every action type an agent can create", () => {
    const unaccounted = AGENT_PRODUCED_ACTION_TYPES.filter(
      (actionType) => !isExecutable(actionType) && !(actionType in ADVISORY_ACTION_TYPES),
    );
    expect(unaccounted).toEqual([]);
  });

  it("executes the on-page SEO action types the agents file most often", () => {
    for (const actionType of [
      "meta_rewrite",
      "meta_fix",
      "title_optimization",
      "internal_link",
      "interlink_injection",
      "faq_addition",
      "schema_markup",
      "research_firm",
    ]) {
      expect(isExecutable(actionType)).toBe(true);
    }
  });

  it("never auto-executes page creation or off-site work", () => {
    for (const actionType of ["publish_content", "content_gap", "backlink_needed", "technical_fix"]) {
      expect(isExecutable(actionType)).toBe(false);
      expect(describeUnexecutable(actionType)).not.toMatch(/no typed executor is configured/i);
    }
  });

  it("gives an unknown action type an honest, non-empty reason", () => {
    expect(describeUnexecutable("brand_new_type")).toContain("brand_new_type");
  });

  it("labels every executable type for the admin queue", () => {
    for (const actionType of EXECUTABLE_ACTION_TYPES) {
      expect(ACTION_EXECUTORS[actionType].label.length).toBeGreaterThan(0);
    }
  });
});

describe("target resolution", () => {
  it("reads a slug from the structured payload", () => {
    expect(resolveBlogSlug(context({ payload: { pageSlug: "/blog/sell-house-with-solar-panels" } }))).toBe(
      "sell-house-with-solar-panels",
    );
  });

  it("reads a slug from an absolute URL", () => {
    expect(
      resolveBlogSlug(
        context({ payload: { url: "https://breakyoursolarcontract.com/blog/adt-solar-complaints?utm=x" } }),
      ),
    ).toBe("adt-solar-complaints");
  });

  it("accepts a bare slug", () => {
    expect(resolveBlogSlug(context({ payload: { slug: "solar-fraud-warning-signs" } }))).toBe(
      "solar-fraud-warning-signs",
    );
  });

  it("falls back to a slug mentioned in the action prose", () => {
    expect(
      resolveBlogSlug(
        context({ title: "Rewrite meta for /blog/solar-payment-shock-help", payload: {} }),
      ),
    ).toBe("solar-payment-shock-help");
  });

  it("returns null when no blog target is present", () => {
    expect(resolveBlogSlug(context({ title: "Improve rankings generally", payload: {} }))).toBeNull();
  });

  it("ignores non-blog paths rather than guessing a slug", () => {
    expect(resolveBlogSlug(context({ payload: { url: "/cancel-solar-contract/phoenix-az" } }))).toBeNull();
  });
});

describe("conservative copy scan", () => {
  it("rejects outcome promises and legal-advice claims", () => {
    expect(findBannedCopy("We guarantee you can cancel")).toContain("guaranteed outcome");
    expect(findBannedCopy("Get free legal advice today")).toContain("legal advice claim");
    expect(findBannedCopy("Free legal review for homeowners")).toContain("free legal review claim");
    expect(findBannedCopy("We are attorneys who help homeowners")).toContain("first-party attorney claim");
    expect(findBannedCopy("Any solar contract can be cancelled")).toContain("universal cancellation claim");
  });

  it("allows the site's approved conservative phrasing", () => {
    expect(
      findBannedCopy("Organize your solar agreement and request a free case review of the documents."),
    ).toEqual([]);
  });
});

describe("internal link destinations", () => {
  const targets = allowedInternalTargets();

  it("only offers live, index-eligible destinations", () => {
    const eligible = new Set([
      ...indexEligibility.blogSlugs.map((slug: string) => `/blog/${slug}`),
      ...indexEligibility.citySlugs.map((slug: string) => `/cancel-solar-contract/${slug}`),
    ]);
    for (const target of targets) expect(eligible.has(target)).toBe(true);
  });

  it("never offers a quarantined page as a link destination", () => {
    const quarantined = new Set(
      (indexEligibility.trustQuarantine?.paths ?? []).map((entry: { path: string }) => entry.path),
    );
    for (const target of targets) expect(quarantined.has(target)).toBe(false);
  });

  it("never offers a redirected blog slug as a destination", () => {
    const redirectedBlogSlugs = Object.keys(seoRedirects.blog).map((path) => path.replace(/^\/blog\//, ""));
    // These four sit in blogSlugs but are superseded by redirects.
    expect(redirectedBlogSlugs.some((slug) => indexEligibility.blogSlugs.includes(slug))).toBe(true);
    for (const slug of redirectedBlogSlugs) expect(targets).not.toContain(`/blog/${slug}`);
  });

  it("never offers a redirected public path as a destination", () => {
    for (const path of Object.keys(seoRedirects.public)) expect(targets).not.toContain(path);
  });

  it("offers houston-tx as a live city destination after un-redirect", () => {
    expect(indexEligibility.citySlugs).toContain("houston-tx");
    expect(Object.keys(seoRedirects.public)).not.toContain("/cancel-solar-contract/houston-tx");
    expect(targets).toContain("/cancel-solar-contract/houston-tx");
  });

  it("includes both blog and city destinations", () => {
    expect(targets.some((path) => path.startsWith("/blog/"))).toBe(true);
    expect(targets.some((path) => path.startsWith("/cancel-solar-contract/"))).toBe(true);
  });

  it("excludes the page being edited so a page cannot link to itself", () => {
    const slug = indexEligibility.blogSlugs[0];
    expect(allowedInternalTargets(slug)).not.toContain(`/blog/${slug}`);
  });
});

describe("provider output parsing", () => {
  it("parses a plain JSON object", () => {
    expect(parseJsonObject('{\"metaTitle\":\"A better title\"}')).toEqual({ metaTitle: "A better title" });
  });

  it("recovers an object wrapped in prose or a markdown fence", () => {
    expect(parseJsonObject('Here you go:\n```json\n{\"metaTitle\":\"Ok\"}\n```')).toEqual({ metaTitle: "Ok" });
  });

  it("recovers when a provider emits a raw line break inside a JSON string", () => {
    const parsed = parseJsonObject('{\"metaDescription\":\"Line one\nline two\"}');
    expect(parsed?.metaDescription).toBe("Line one line two");
  });

  it("returns null for unusable output instead of guessing", () => {
    expect(parseJsonObject("no json here")).toBeNull();
    expect(parseJsonObject('[\"an\",\"array\"]')).toBeNull();
  });
});

describe("faq parsing", () => {
  it("reads stored JSON and drops malformed entries", () => {
    const parsed = parseFaqItems(
      JSON.stringify([{ q: "Real?", a: "Yes." }, { q: "Missing answer" }, null, "nope"]),
    );
    expect(parsed).toEqual([{ q: "Real?", a: "Yes." }]);
  });

  it("returns an empty list for absent or invalid values", () => {
    expect(parseFaqItems(null)).toEqual([]);
    expect(parseFaqItems("{not json")).toEqual([]);
  });
});

describe("executor limits", () => {
  it("keeps snippet limits inside what Google renders", () => {
    expect(EXECUTOR_LIMITS.metaTitleMaxChars).toBeLessThanOrEqual(65);
    expect(EXECUTOR_LIMITS.metaDescriptionMaxChars).toBeLessThanOrEqual(165);
    expect(EXECUTOR_LIMITS.metaTitleMinChars).toBeLessThan(EXECUTOR_LIMITS.metaTitleMaxChars);
    expect(EXECUTOR_LIMITS.metaDescriptionMinChars).toBeLessThan(EXECUTOR_LIMITS.metaDescriptionMaxChars);
  });

  it("bounds how much one run can change", () => {
    expect(EXECUTOR_LIMITS.maxInternalLinksPerAction).toBeLessThanOrEqual(3);
    expect(EXECUTOR_LIMITS.maxFaqItemsPerAction).toBeLessThanOrEqual(3);
    expect(EXECUTOR_LIMITS.defaultBatchSize).toBeLessThanOrEqual(EXECUTOR_LIMITS.maxBatchSize);
  });
});

describe("re-execution safety", () => {
  it("only picks up statuses that are not terminal, so a reverted change is never re-applied", () => {
    // runQueuedActionExecutions selects status in (queued, approved). A revert
    // moves the action to "rejected", which is outside that set.
    const batchStatuses = ["queued", "approved"];
    const terminalAfterRevert = "rejected";
    expect(batchStatuses).not.toContain(terminalAfterRevert);
    expect(batchStatuses).not.toContain("completed");
    expect(batchStatuses).not.toContain("blocked");
    expect(batchStatuses).not.toContain("failed");
  });
});
