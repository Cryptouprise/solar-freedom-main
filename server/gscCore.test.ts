import { describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const core = await import("../scripts/lib/gsc-core.mjs");

describe("GSC measurement core", () => {
  it("builds a stable lagged date range", () => {
    expect(core.resolveDateRange({
      now: new Date("2026-07-12T18:00:00.000Z"),
      days: 28,
      dataLagDays: 3,
    })).toEqual({
      startDate: "2026-06-12",
      endDate: "2026-07-09",
    });
  });

  it("rejects incomplete service-account material", () => {
    expect(() => core.parseServiceAccountJson("{}"))
      .toThrow("complete Google service-account JSON");
    expect(() => core.parseServiceAccountJson("not-json"))
      .toThrow("not valid JSON");
  });

  it("marks old snapshots stale and fresh snapshots usable", () => {
    const metadata = {
      source: "google_search_console_api",
      fetchedAt: "2026-07-12T12:00:00.000Z",
      property: "sc-domain:breakyoursolarcontract.com",
      rowCount: 87,
      truncated: false,
    };

    expect(core.evaluateGscFreshness(metadata, {
      now: new Date("2026-07-12T18:00:00.000Z"),
      maxAgeHours: 36,
    }).usable).toBe(true);

    const stale = core.evaluateGscFreshness(metadata, {
      now: new Date("2026-07-15T18:00:00.000Z"),
      maxAgeHours: 36,
    });
    expect(stale.usable).toBe(false);
    expect(stale.reasons).toContain("snapshot_stale");
  });

  it("preserves fractional JSON CTR and emits percent CSV", () => {
    const rows = core.normalizeSearchAnalyticsRows([{
      keys: ["https://example.com/a,b"],
      clicks: 1,
      impressions: 100,
      ctr: 0.01,
      position: 4.25,
    }]);
    expect(rows[0].ctr).toBe(0.01);
    expect(core.toLegacyCsv(rows)).toContain('"https://example.com/a,b",1,100,1.0000,4.2500');
  });

  it("verifies measurement outputs against their recorded hashes", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "gsc-integrity-"));
    const json = "[]\n";
    const csv = "page,clicks,impressions,ctr,position\n";
    await fs.writeFile(path.join(root, "gsc.json"), json);
    await fs.writeFile(path.join(root, "gsc.csv"), csv);
    const metadata = {
      outputs: {
        json: "gsc.json",
        csv: "gsc.csv",
        jsonSha256: core.sha256(json),
        csvSha256: core.sha256(csv),
      },
    };
    expect(await core.verifyGscOutputHashes(metadata, { rootDir: root })).toEqual([]);
    await fs.writeFile(path.join(root, "gsc.json"), "tampered\n");
    expect(await core.verifyGscOutputHashes(metadata, { rootDir: root })).toContain("json_hash_mismatch");
    await fs.rm(root, { recursive: true, force: true });
  });
});
