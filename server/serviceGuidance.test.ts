import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { suppressUnverifiedFirstPartyClaims } from "../shared/contentGovernance";
import {
  getRelatedServiceLinks,
  getServiceGuidance,
  SERVICE_REVIEW_DISCLOSURE,
  SERVICE_REVIEW_FEES,
  type ServiceIntent,
} from "../shared/serviceGuidance";
import eligibility from "../shared/index-eligibility.json";
import redirects from "../shared/seo-redirects.json";
import guidanceData from "../shared/service-guidance.json";

const intents: ServiceIntent[] = ["company", "loan", "lien", "sale"];

describe("intent-specific service guidance", () => {
  it("keeps the client and prerender JSON copy identical", () => {
    for (const intent of intents) {
      expect(getServiceGuidance(intent, "{companyName}")).toEqual(guidanceData.intents[intent]);
    }
    expect(getServiceGuidance("company", "Example $& Solar").heading).toBe("Before requesting a Example $& Solar contract review");
    expect(SERVICE_REVIEW_DISCLOSURE).toBe(guidanceData.disclosure);
  });

  it.each(intents)("supplies complete, governed %s review guidance", intent => {
    const guidance = getServiceGuidance(intent);
    expect(guidance.eligibility.length).toBeGreaterThan(100);
    expect(guidance.records).toHaveLength(3);
    expect(guidance.nextSteps).toHaveLength(3);
    expect(guidance.fees).toContain(SERVICE_REVIEW_FEES);
    expect(guidance.limitations.length).toBeGreaterThan(100);
    const text = JSON.stringify(guidance);
    expect(suppressUnverifiedFirstPartyClaims(text)).toBe(text);
    expect(guidance.links.length).toBeGreaterThanOrEqual(2);
  });

  it("distinguishes the referral role, costs, payment duties, title and sale limits", () => {
    expect(SERVICE_REVIEW_DISCLOSURE).toContain("not a law firm");
    expect(SERVICE_REVIEW_DISCLOSURE).toContain("does not create an attorney-client relationship");
    expect(getServiceGuidance("company", "Example Solar").heading).toContain("Example Solar");
    expect(getServiceGuidance("loan").limitations).toContain("Do not stop payments");
    expect(getServiceGuidance("lien").limitations).toContain("does not necessarily forgive");
    expect(getServiceGuidance("sale").eligibility).toContain("not a lease/PPA transfer service");
  });

  it("uses distinct guidance with canonical, non-quarantined internal destinations", () => {
    expect(new Set(intents.map(intent => getServiceGuidance(intent).eligibility)).size).toBe(4);
    const links = intents.flatMap(intent => getServiceGuidance(intent).links);
    for (const { href } of links) {
      expect(eligibility.trustQuarantine.paths.map(entry => entry.path)).not.toContain(href);
      expect(eligibility.retiredPublicPaths).not.toContain(href);
      expect(Object.keys(redirects.blog)).not.toContain(href);
      if (href.startsWith("/blog/")) expect(eligibility.blogSlugs).toContain(href.slice(6));
      if (href.startsWith("https:")) expect(new URL(href).hostname).toBe("www.consumerfinance.gov");
    }
  });

  it.each([
    ["selling-house-with-solar-loan", "/selling-house-with-solar"],
    ["solar-ucc-filing", "/solar-lien-removal"],
    ["goodleap-solar-loan-cancellation-hidden-fees-2026", "/solar-loan-help"],
    ["solar-payment-shock-help", "/solar-loan-help"],
    ["sunrun-solar-contract-cancellation-2026", "/blog/how-to-get-out-of-a-solar-contract"],
  ])("links %s to the relevant review guidance", (slug, target) => {
    const links = getRelatedServiceLinks(slug);
    expect(links.map(link => link.href)).toContain(target);
    expect(links.map(link => link.href)).not.toContain(`/blog/${slug}`);
    expect(new Set(links.map(link => link.href)).size).toBe(links.length);
  });

  it("avoids unrelated recommendations and self-links", () => {
    expect(getRelatedServiceLinks("unrelated-topic")).toEqual([]);
    expect(getRelatedServiceLinks("how-to-get-out-of-a-solar-contract").map(link => link.href))
      .not.toContain("/blog/how-to-get-out-of-a-solar-contract");
  });

  it("mounts guidance on all four service pages and both blog render paths", () => {
    for (const [page, intent] of [
      ["CompanyPage", "company"], ["SolarLoanHelp", "loan"],
      ["SolarLienRemoval", "lien"], ["SellingHouseWithSolar", "sale"],
    ]) {
      const source = readFileSync(`client/src/pages/${page}.tsx`, "utf8");
      expect(source).toContain(`<ServiceReviewGuidance intent="${intent}"`);
    }
    const blog = readFileSync("client/src/pages/BlogPost.tsx", "utf8");
    expect(blog).toContain("<RelatedServiceLinks slug={slug} />");
    expect(blog).toContain("<RelatedServiceLinks slug={post.slug} />");
  });
});
