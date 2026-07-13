import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const policySource = fs.readFileSync(
  path.resolve(import.meta.dirname, "PrivacyPolicy.tsx"),
  "utf8",
);

describe("privacy-policy retention truth", () => {
  it("does not promise an automatic deletion schedule the application lacks", () => {
    expect(policySource).toContain(
      "does not automatically expire lead, guide-request, or consent records",
    );
    expect(policySource).toContain(
      "may remain in the primary database and provider backups until an authorized deletion is completed",
    );
    expect(policySource).not.toContain(
      "Information is retained only as long as reasonably needed",
    );
  });
});
