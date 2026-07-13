import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "../../..");

const leadFormFiles = [
  "client/src/components/QuickCallbackForm.tsx",
  "client/src/components/DoIQualifyQuiz.tsx",
  "client/src/pages/Home.tsx",
  "client/src/pages/CityPage.tsx",
  "client/src/pages/CompanyPage.tsx",
  "client/src/pages/SellingHouseWithSolar.tsx",
  "client/src/pages/SolarLoanHelp.tsx",
  "client/src/pages/SolarLienRemoval.tsx",
  "client/src/pages/SunrunPage.tsx",
  "client/src/pages/YouTubeLanding.tsx",
  "client/src/pages/Yt2Landing.tsx",
  "client/src/pages/Yt3Landing.tsx",
];

function read(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function mutationPayloads(source: string): string[] {
  const marker = ".mutateAsync({";
  const payloads: string[] = [];
  let cursor = 0;

  while ((cursor = source.indexOf(marker, cursor)) !== -1) {
    const start = source.indexOf("{", cursor);
    let depth = 0;
    let end = start;

    for (; end < source.length; end += 1) {
      if (source[end] === "{") depth += 1;
      if (source[end] === "}") depth -= 1;
      if (depth === 0) break;
    }

    payloads.push(source.slice(start, end + 1));
    cursor = end + 1;
  }

  return payloads;
}

describe("lead consent coverage", () => {
  it("sends the current version, separate permissions, and honeypot on every lead mutation", () => {
    let mutationCount = 0;

    for (const relativePath of leadFormFiles) {
      const source = read(relativePath);
      const payloads = mutationPayloads(source);

      expect(source, relativePath).toContain("<ContactConsentFields");
      expect(payloads.length, relativePath).toBeGreaterThan(0);
      expect(source, relativePath).not.toMatch(
        /\b(?:contactConsent|smsConsent)\s*:\s*true\b/
      );
      expect(source, relativePath).not.toMatch(
        /\[[^\]]*Consent,\s*set\w+Consent\]\s*=\s*useState\(true\)/
      );

      for (const payload of payloads) {
        mutationCount += 1;
        expect(payload, relativePath).toMatch(/\bcontactConsent\b/);
        expect(payload, relativePath).toMatch(/\bsmsConsent\b/);
        expect(payload, relativePath).toContain(
          "consentVersion: CONTACT_CONSENT_VERSION"
        );
        expect(payload, relativePath).toMatch(/\bwebsite\b/);
      }
    }

    expect(mutationCount).toBe(16);
  });

  it("requires explicit versioned guide consent and removes callback-time promises", () => {
    const exitIntentSource = read("client/src/components/ExitIntentPopup.tsx");
    const sharedDisclosureSource = read("shared/leadConsent.ts");
    const touchedFormSource = [
      ...leadFormFiles.map(read),
      exitIntentSource,
    ].join("\n");

    expect(exitIntentSource).toContain(
      "[marketingConsent, setMarketingConsent] = useState(false)"
    );
    expect(exitIntentSource).toContain("marketingConsent,");
    expect(exitIntentSource).toContain(
      "consentVersion: MARKETING_CONSENT_VERSION"
    );
    expect(exitIntentSource).toContain("website,");
    expect(exitIntentSource).toContain("unsubscribe");
    expect(sharedDisclosureSource).toMatch(/unsubscribe at any time/i);
    expect(touchedFormSource).not.toMatch(
      /60[ -]seconds|within (?:an )?hour|within minutes|call you shortly|reach out shortly/i
    );
  });
});
