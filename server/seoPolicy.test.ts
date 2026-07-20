import { describe, expect, it } from "vitest";
import {
  RETAINED_BLOG_SLUGS,
  RETAINED_CITY_SLUGS,
  SEO_RECOVERY_MODE,
  isPathIndexable,
} from "../shared/seoPolicy";

describe("SEO recovery policy", () => {
  it("fails closed for unknown and unreviewed routes", () => {
    expect(SEO_RECOVERY_MODE).toBe(true);
    expect(isPathIndexable("/")).toBe(true);
    expect(isPathIndexable("/not-a-real-route")).toBe(false);
    expect(isPathIndexable("/cancel-solar-contract/miami-fl")).toBe(false);
    expect(isPathIndexable("/blog/how-to-get-out-of-a-solar-contract")).toBe(false);
  });

  it("retains only the evidence-backed recovery cohorts", () => {
    expect(RETAINED_CITY_SLUGS.size).toBe(20);
    expect(RETAINED_BLOG_SLUGS.size).toBe(8);
    expect(isPathIndexable("/cancel-solar-contract/phoenix-az")).toBe(true);
    expect(isPathIndexable("/blog/sunrun-solar-contract-cancellation-2026")).toBe(true);
  });
});
