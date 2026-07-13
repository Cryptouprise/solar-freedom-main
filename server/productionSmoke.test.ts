import { describe, expect, it } from "vitest";
import {
  extractJsAssetPaths,
  findSecretMarkerCodes,
} from "../scripts/production-smoke.mjs";

describe("production smoke safety helpers", () => {
  it("extracts unique same-origin JavaScript asset paths", () => {
    expect(
      extractJsAssetPaths(`
        <script src="/assets/index-abc.js"></script>
        import("assets/AdminContent-def.js");
        import("/assets/index-abc.js");
      `)
    ).toEqual(["/assets/index-abc.js", "/assets/AdminContent-def.js"]);
  });

  it("reports marker codes without returning matched secret values", () => {
    const source = [
      "sf_" + "a".repeat(64),
      "https://services." + "leadconnectorhq.com/hooks/" + "x".repeat(32),
      "-----BEGIN PRIVATE KEY-----",
    ].join("\n");
    const codes = findSecretMarkerCodes(source);

    expect(codes).toEqual([
      "embedded_admin_api_key",
      "embedded_crm_webhook",
      "embedded_private_key",
    ]);
    expect(JSON.stringify(codes)).not.toContain("sf_");
    expect(JSON.stringify(codes)).not.toContain("leadconnectorhq");
  });

  it("does not flag documented placeholders", () => {
    expect(findSecretMarkerCodes("Authorization: Bearer <scoped-key-from-your-secret-manager>")).toEqual([]);
  });
});
