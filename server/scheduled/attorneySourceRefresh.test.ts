import { describe, expect, it } from "vitest";
import { extractPublicBusinessContacts, isSafePublicWebsite } from "./attorneySourceRefresh";

describe("attorney source refresh safety", () => {
  it("allows public websites and blocks local or private-network targets", () => {
    expect(isSafePublicWebsite("https://examplelaw.com/contact")).toBe(true);
    expect(isSafePublicWebsite("http://127.0.0.1:3000")).toBe(false);
    expect(isSafePublicWebsite("http://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isSafePublicWebsite("javascript:alert(1)")).toBe(false);
  });

  it("keeps only public email and phone routes exposed by a firm page", () => {
    const contacts = extractPublicBusinessContacts('<a href="mailto:intake@examplelaw.com">Email</a><a href="tel:+1 (904) 555-0199">Call</a>');
    expect(contacts.email).toBe("intake@examplelaw.com");
    expect(contacts.phone).toBe("+1 (904) 555-0199");
  });
});
