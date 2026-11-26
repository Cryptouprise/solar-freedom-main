import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { cities } from "../client/src/data/cities";
import { blogPosts } from "../client/src/data/blog";
import { isCityIndexed } from "../client/src/data/indexed-cities";
import { isBlogIndexed } from "../client/src/data/indexEligibility";
import { isVegasCityPath } from "../shared/vegasCampaign";

/**
 * These tests exist because the conversion gap they cover was invisible.
 *
 * Every blog article looked like it had a call to action. The article hero
 * said "Request a case review", the mid-article block said "Request Case
 * Review", and the final panel said "Request My Case Review". All three were
 * links to /#form, so the article had no booking action at all, and the only
 * lead form on the page was inside a `hidden lg:block` sidebar — meaning a
 * visitor on a phone had no on-page way to convert.
 *
 * City pages had the mirror problem: a form, but no calendar, except on the two
 * Las Vegas pages.
 *
 * A source-level assertion is the right tool here. Rendering these components in
 * a unit test would need a DOM, a tRPC provider and a router; the defect was
 * structural (which action exists in which layout), so the tests assert the
 * structure directly and fail loudly if it is removed again.
 */

const read = (path: string) => fs.readFileSync(path, "utf8");

describe("shared conversion actions", () => {
  const source = read("client/src/components/ConversionActions.tsx");

  it("opens the real GoHighLevel calendar rather than a placeholder", () => {
    // The calendar id lives in one shared constant so a typo cannot silently
    // send a booking to the wrong calendar. Assert both the import and the
    // constant's value.
    expect(source).toContain('import { VEGAS_BOOKING_URL, vegasCampaignParams } from "@shared/vegasCampaign"');
    expect(source).toContain("const GHL_CALENDAR_URL = VEGAS_BOOKING_URL");
    const campaign = read("shared/vegasCampaign.ts");
    expect(campaign).toContain("https://link.myinfinite.ai/widget/booking/Glvb9OZtDFHDMiwvHpli");
  });

  it("only mounts the calendar iframe after the visitor opens the dialog", () => {
    // An always-mounted iframe loads a third-party widget on every page view.
    expect(source).toContain("{open && (");
    expect(source).toContain("loading=\"lazy\"");
  });

  it("carries campaign attribution from the landing URL into the booking", () => {
    expect(source).toContain("vegasCampaignParams(window.location.search)");
  });

  it("does not claim a booking happened when only the dialog opened", () => {
    expect(source).toContain("only once the provider confirms it");
  });

  it("never reports a saved lead when the server did not persist it", () => {
    // recordLeadSubmission returns false when result.persisted is false; the
    // visitor must be told, not shown a thank-you screen.
    expect(source).toContain("if (!recordLeadSubmission(result, formName, path))");
    expect(source).toContain("We could not save your request");
  });

  it("adds no fixed or sticky positioning that could overlap existing widgets", () => {
    // The site already runs StickyMobileBar (z-9990), DesktopCallButton,
    // CallbackWidget and the Las Vegas sticky bar (z-10000). A new floating
    // control would collide with them.
    expect(source).not.toMatch(/className="[^"]*\bfixed\b/);
    expect(source).not.toContain("sticky bottom");
    // The dialog itself is allowed to be fixed; that is the existing pattern.
    expect(source).toContain("DialogContent");
  });

  it("makes no promise of a result, timeline or specific outcome", () => {
    for (const banned of [
      /guarantee(?:d)? (?:result|cancellation|outcome)/i,
      /we will cancel/i,
      /no upfront cost/i,
      /free legal/i,
    ]) {
      expect(source).not.toMatch(banned);
    }
    expect(source).toContain("No result is guaranteed");
  });
});

describe("blog articles carry booking and lead capture", () => {
  const source = read("client/src/pages/BlogPost.tsx");

  /**
   * PR #58 replaced the per-placement BookingButton approach with a single
   * booking block (`ArticleBookingBlock`) that every call to action scrolls to.
   * One block means one place to maintain, and the reader never leaves the page.
   * These assertions lock in that shipped shape: if someone reintroduces a
   * scattered booking action, or drops the block from a render branch, the
   * article loses its only conversion path and this fails.
   */
  it("renders exactly one booking block and anchors every CTA to it", () => {
    expect(source).toContain('id="case-review"');
    expect((source.match(/<ArticleBookingBlock\s*\/>/g) ?? []).length).toBe(2);
    // The hero, nav, inline and footer actions all scroll to the block.
    expect((source.match(/href="#case-review"/g) ?? []).length).toBeGreaterThanOrEqual(4);
    // No CTA may navigate away to the homepage form any more.
    expect(source).not.toContain('href="/#form"');
  });

  it("keeps the booking block's form and phone alternative on the page", () => {
    expect(source).toContain("blog_case_review");
    expect(source).toContain("blog_inline_cta");
    expect(source).toContain("phoneDisplay");
  });

  it("states the offer honestly in the booking block", () => {
    expect(source).toContain("Free, no-obligation review");
    expect(source).toContain("not a law firm");
  });
});

describe("city pages carry booking and lead capture", () => {
  const page = read("client/src/pages/CityPage.tsx");
  const guide = read("client/src/components/PriorityCityGuide.tsx");

  it("offers a booking inside the city form before any questions are answered", () => {
    // The calendar used to be reachable only after three questions plus name,
    // phone and email.
    expect(page).toContain('placement="city_form"');
    expect(page).toMatch(/Ready to talk it through\?/);
  });

  it("puts a booking action in the generic city hero and mid-page", () => {
    expect(page).toContain('placement="city_hero"');
    expect(page).toContain('placement="city_mid"');
    expect(page).toContain("<ConversionActions");
  });

  it("gives every priority city a booking, not only the Las Vegas pages", () => {
    // Non-Vegas priority cities previously had only an anchor to the form.
    const bookings = guide.match(/<BookingButton/g) ?? [];
    expect(bookings.length).toBeGreaterThanOrEqual(3);
    expect(guide).toContain("vegas ? <VegasBookingCTA");
  });

  it("preserves the Las Vegas-specific booking controls", () => {
    expect(guide).toContain("<VegasBookingCTA city={data.city} path={path} placement=\"hero\" />");
    expect(guide).toContain('placement="mid_page"');
    expect(guide).toContain('placement="sticky"');
  });

  it("passes the city path to every form instance for attribution", () => {
    const forms = page.match(/<CityForm[^>]*\/>/g) ?? [];
    expect(forms.length).toBe(3);
    for (const form of forms) {
      expect(form).toMatch(/path=\{(?:cityPath|path)\}/);
    }
  });
});

describe("index eligibility is untouched", () => {
  it("keeps the approved indexable city set unchanged", () => {
    // The conversion work must not promote any of the ~278 noindex city pages.
    const indexed = cities.filter((city) => isCityIndexed(city.slug));
    expect(indexed.length).toBe(27);
  });

  it("keeps the blog index eligibility ledger readable for every post", () => {
    const posts = blogPosts ?? [];
    expect(posts.length).toBeGreaterThan(100);
    // No post should throw while resolving eligibility.
    for (const post of posts.slice(0, 25)) {
      expect(() => isBlogIndexed(post.slug)).not.toThrow();
    }
  });

  it("still hides the global floating call controls only on the two Vegas pages", () => {
    expect(isVegasCityPath("/cancel-solar-contract/las-vegas-nv")).toBe(true);
    expect(isVegasCityPath("/cancel-solar-contract/north-las-vegas-nv")).toBe(true);
    // Henderson has booking controls now but the global call bar stays visible.
    expect(isVegasCityPath("/cancel-solar-contract/henderson-nv")).toBe(false);
    expect(isVegasCityPath("/blog/example")).toBe(false);
  });
});
