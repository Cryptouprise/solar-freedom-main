import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sunrunPageSource = readFileSync(
  new URL("../client/src/pages/SunrunPage.tsx", import.meta.url),
  "utf8",
);

describe("Sunrun Relief contextual link", () => {
  it("keeps one direct, non-redirecting link to the Sunrun Relief subdomain", () => {
    expect(sunrunPageSource).toContain(
      'href: "https://sunrun.breakyoursolarcontract.com"',
    );
    expect(sunrunPageSource).toContain(
      'label: "Independent Help with Sunrun Solar Agreements"',
    );
  });
});
