import { describe, expect, it } from "vitest";
import { isAllowedPressReleaseSetting, isAllowedPublicConfigKey } from "./configPolicy";

describe("configuration allowlists", () => {
  it("allows public display fields and rejects arbitrary or secret-looking keys", () => {
    expect(isAllowedPublicConfigKey("phone_number")).toBe(true);
    expect(isAllowedPublicConfigKey("webhook_url")).toBe(false);
    expect(isAllowedPublicConfigKey("api_key")).toBe(false);
  });

  it("allows operational PR settings but rejects credential storage", () => {
    expect(isAllowedPressReleaseSetting("schedule_enabled")).toBe(true);
    expect(isAllowedPressReleaseSetting("prlog_password")).toBe(false);
    expect(isAllowedPressReleaseSetting("newsbywire_api_key")).toBe(false);
  });
});
