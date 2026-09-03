import { describe, expect, it } from "vitest";
import { DESIRED_AGENT_JOBS } from "./agents/registerCrons";
import {
  dedupeJustiaListings,
  formatJustiaReceipt,
  isJustiaBlockedPage,
  isTwoAmMountain,
  justiaListingUrl,
  nextRotatingJustiaState,
  parseJustiaConsumerLawListings,
  resolveJustiaState,
} from "./justiaAttorneyResearch";

const SAMPLE_HTML = `<div id="results">
  <div class="jld-card -organic" id="lawyer_1">
    <strong class="name "><a href="https://lawyers.justia.com/lawyer/abby-l-efron-1823124">Abby L. Efron</a></strong>
    <div class="rating">SAN ANTONIO, TX Consumer Law Lawyer</div>
    <strong class="phone"><a href="tel:+1-210-864-2015">(210) 864-2015</a></strong>
    <a aria-label="Abby L. Efron Website" data-vars-action="OrganicListingWebsite" href="https://abbyefronlaw.com/">View Website</a>
  </div>
  <div class="jld-card -organic" id="lawyer_2">
    <strong class="name "><a href="https://lawyers.justia.com/lawyer/patrick-daniel-707515">Patrick Daniel</a></strong>
    <div class="rating">HOUSTON, TX Consumer Law Lawyer</div>
    <strong class="phone"><a href="tel:+1-713-555-0100">(713) 555-0100</a></strong>
  </div>
  <div class="jld-card -organic" id="lawyer_1_dup">
    <strong class="name "><a href="https://lawyers.justia.com/lawyer/abby-l-efron-1823124">Abby L. Efron</a></strong>
  </div>
</div>`;

describe("Justia consumer-law parser", () => {
  it("reads firm name, source URL, city, phone, and website from directory cards", () => {
    const listings = parseJustiaConsumerLawListings(SAMPLE_HTML, "Texas");
    expect(listings).toHaveLength(2);
    expect(listings[0]).toMatchObject({
      firmName: "Abby L. Efron",
      state: "Texas",
      city: "San Antonio",
      phone: "(210) 864-2015",
      website: "https://abbyefronlaw.com/",
      sourceUrl: "https://lawyers.justia.com/lawyer/abby-l-efron-1823124",
    });
    expect(listings[1].website).toBeUndefined();
    expect(listings[1].city).toBe("Houston");
  });

  it("never invents emails", () => {
    const listings = parseJustiaConsumerLawListings(SAMPLE_HTML, "Texas");
    expect(listings.every(row => !("email" in row) || (row as { email?: string }).email == null)).toBe(true);
  });
});

describe("Justia dedupe and block", () => {
  it("dedupes on firmName + state against existing prospects", () => {
    const listings = parseJustiaConsumerLawListings(SAMPLE_HTML, "Texas");
    const { toInsert, duplicates } = dedupeJustiaListings(listings, [
      { firmName: "Abby L. Efron", state: "Texas" },
    ]);
    expect(duplicates).toBe(1);
    expect(toInsert.map(row => row.firmName)).toEqual(["Patrick Daniel"]);
  });

  it("treats Cloudflare challenges and non-200 pages as blocked", () => {
    expect(isJustiaBlockedPage(403, "<html>nope</html>")).toBe(true);
    expect(isJustiaBlockedPage(200, "Performing security verification Enable JavaScript and cookies to continue")).toBe(true);
    expect(isJustiaBlockedPage(200, SAMPLE_HTML)).toBe(false);
  });

  it("writes a blocked receipt with zero inserts", () => {
    expect(formatJustiaReceipt({
      found: 0,
      saved: 0,
      duplicates: 0,
      states: ["Texas"],
      status: "blocked",
      blockedReason: "Justia consumer-law listing for Texas was empty. No attorney records were created.",
      sourceUrls: [],
      listingUrl: justiaListingUrl("texas"),
    })).toContain("No attorney records were created");
  });
});

describe("Justia rotation and cron presence", () => {
  it("uses one requested state when valid, otherwise rotates by Denver date", () => {
    expect(resolveJustiaState(["Texas"]).slug).toBe("texas");
    expect(resolveJustiaState(["TX"]).name).toBe("Texas");
    const rotated = nextRotatingJustiaState(new Date("2026-09-03T08:00:00Z"));
    expect(rotated.slug).toMatch(/^[a-z-]+$/);
    expect(justiaListingUrl(rotated.slug)).toBe(`https://www.justia.com/lawyers/consumer-law/${rotated.slug}/`);
  });

  it("registers the 2am America/Denver Heartbeat pair", () => {
    const jobs = DESIRED_AGENT_JOBS.filter(job => job.name.startsWith("agent-attorney-research-mountain-2"));
    expect(jobs.map(job => job.name).sort()).toEqual([
      "agent-attorney-research-mountain-2-dst",
      "agent-attorney-research-mountain-2-standard",
    ]);
    expect(jobs.every(job => job.path === "/api/scheduled/attorney-research")).toBe(true);
    expect(jobs.every(job => job.payload?.scheduleMode === "mountain_2")).toBe(true);
    expect(jobs.find(job => job.name.endsWith("-dst"))?.cron).toBe("0 0 8 * * *");
    expect(jobs.find(job => job.name.endsWith("-standard"))?.cron).toBe("0 0 9 * * *");
  });

  it("accepts 2:00 AM America/Denver and rejects the off-hour pair member", () => {
    expect(isTwoAmMountain(new Date("2026-09-03T08:10:00Z"))).toBe(true);
    expect(isTwoAmMountain(new Date("2026-09-03T09:10:00Z"))).toBe(false);
  });
});
