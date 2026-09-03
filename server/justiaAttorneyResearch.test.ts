import { describe, expect, it } from "vitest";
import {
  buildJustiaProspect,
  justiaListingUrl,
  listingHasNextPage,
  parseJustiaPeople,
  rotateJustiaState,
} from "./justiaAttorneyResearch";

const FIXTURE = `<html><head>
<script type="application/ld+json">[{"@context":"https://schema.org/","@type":"Person","url":"https://lawyers.justia.com/lawyer/russell-s-thompson-iv-1674037","name":"Russell S. Thompson IV","workLocation":{"@type":"LegalService","telephone":"(888) 595-9111","name":"Thompson Consumer Law Group, PC","address":{"@type":"PostalAddress","addressLocality":"Scottsdale","addressRegion":"AZ"}}}]</script>
<link rel="next" href="https://www.justia.com/lawyers/consumer-law/arizona?page=2" />
</head></html>`;

describe("Justia public directory parser", () => {
  it("extracts source-backed firm, phone, city, and profile URL from JSON-LD", () => {
    const people = parseJustiaPeople(FIXTURE);
    expect(people).toHaveLength(1);
    const prospect = buildJustiaProspect(people[0], "Arizona");
    expect(prospect).toMatchObject({
      firmName: "Thompson Consumer Law Group, PC",
      attorneyName: "Russell S. Thompson IV",
      city: "Scottsdale",
      state: "Arizona",
      phone: "(888) 595-9111",
      sourceUrl: "https://lawyers.justia.com/lawyer/russell-s-thompson-iv-1674037",
    });
  });

  it("rejects a person with no https source URL instead of inventing one", () => {
    expect(buildJustiaProspect({ name: "Nobody" }, "Texas")).toBeNull();
  });

  it("builds paginated listing URLs and detects a next page", () => {
    expect(justiaListingUrl("arizona")).toBe("https://www.justia.com/lawyers/consumer-law/arizona/");
    expect(justiaListingUrl("texas", 2)).toBe("https://www.justia.com/lawyers/consumer-law/texas?page=2");
    expect(listingHasNextPage(FIXTURE, 1)).toBe(true);
    expect(listingHasNextPage("<html></html>", 1)).toBe(false);
  });

  it("rotates states deterministically", () => {
    expect(rotateJustiaState(new Date(0))).toBe("arizona");
  });
});
