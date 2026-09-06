import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import mysql from "mysql2/promise";

const connection = vi.hoisted(() => ({ execute: vi.fn(), query: vi.fn(), end: vi.fn() }));
vi.mock("mysql2/promise", () => ({ default: { createConnection: vi.fn().mockResolvedValue(connection) } }));

describe("manual CRM recovery", () => {
  const argv = process.argv;
  const lead = {
    id: 42, formName: "home_intake_v1_callback", intent: "requested_callback_only_v1",
    firstName: "Test", lastName: "Visitor", phone: "5551234567", ghlWebhookSent: 0,
  };
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("DATABASE_URL", "mysql://example.invalid/test");
    vi.stubEnv("GHL_WEBHOOK_URL", "https://example.invalid/webhook");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    connection.query.mockResolvedValue([[lead]]);
    vi.mocked(mysql.createConnection).mockResolvedValue(connection as any);
    connection.end.mockResolvedValue(undefined);
    connection.execute.mockImplementation(async (query: string) => {
      if (query.includes("GET_LOCK")) return [[{ acquired: 1 }]];
      if (query.includes("SELECT ghlWebhookSent")) return [[{ ghlWebhookSent: 0 }]];
      return [[]];
    });
  });
  afterEach(() => {
    process.argv = argv;
    process.exitCode = 0;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
  const run = () => import("../scripts/resend-missed-leads.mjs");

  it("defaults to a bounded preview without contacting CRM or updating markers", async () => {
    process.argv = ["node", "resend-missed-leads.mjs"];
    await run();
    expect(fetch).not.toHaveBeenCalled();
    expect(connection.execute).not.toHaveBeenCalled();
    expect(connection.query.mock.calls[0][0]).toContain("LIMIT 25");
    expect(connection.query.mock.calls[0][0]).toContain("INTERVAL 10 MINUTE");
    expect(connection.end).toHaveBeenCalledOnce();
  });
  it("requires explicit deduplication acknowledgement before any send", async () => {
    process.argv = ["node", "resend-missed-leads.mjs", "--send"];
    vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    await expect(run()).rejects.toThrow("exit");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("preserves attribution and scoped consent, serializes recovery, and marks only confirmed delivery", async () => {
    process.argv = ["node", "resend-missed-leads.mjs", "--send", "--ack-crm-deduplication", "--limit=1"];
    await run();
    const options = vi.mocked(fetch).mock.calls[0][1]!;
    expect(options.headers).toMatchObject({ "Idempotency-Key": "sf-lead-42" });
    expect(JSON.parse(options.body as string)).toMatchObject({
      website_lead_id: "42", form_name: lead.formName, consent_scope: lead.intent,
      callback_request: "1", marketing_consent: "0", trigger_sms_confirmation: "0",
    });
    expect(connection.execute.mock.calls.some(([query]) => query.includes("GET_LOCK"))).toBe(true);
    expect(connection.execute.mock.calls.some(([query]) => query.includes("UPDATE leads SET ghlWebhookSent = 1"))).toBe(true);
    expect(connection.execute.mock.calls.some(([query]) => query.includes("INSERT"))).toBe(false);
    expect(connection.execute.mock.calls.some(([query]) => query.includes("RELEASE_LOCK"))).toBe(true);
  });
  it("retains unsent markers on CRM failure and exits unsuccessfully for operator visibility", async () => {
    process.argv = ["node", "resend-missed-leads.mjs", "--send", "--ack-crm-deduplication"];
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);
    await run();
    expect(connection.execute.mock.calls.some(([query]) => query.includes("UPDATE leads"))).toBe(false);
    expect(process.exitCode).toBe(1);
    expect(connection.end).toHaveBeenCalledOnce();
  });
  it("does not resend leads whose delivery marker was already reconciled", async () => {
    process.argv = ["node", "resend-missed-leads.mjs", "--send", "--ack-crm-deduplication"];
    connection.execute.mockImplementation(async (query: string) => query.includes("GET_LOCK") ? [[{ acquired: 1 }]] : [[{ ghlWebhookSent: 1 }]]);
    await run();
    expect(fetch).not.toHaveBeenCalled();
  });
});
