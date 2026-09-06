import { beforeEach, describe, expect, it, vi } from "vitest";
import { CALLBACK_SCOPE, HOME_EXPERIMENT, HOME_FORM_VARIANTS } from "../shared/homeExperiment";
import { calculateHomeExperiment } from "./homeExperimentReport";
import { normalizeGhlLifecyclePayload } from "./ghlLifecycleWebhook";

const createdAt = new Date("2026-09-01T12:00:00Z");
const after = new Date("2026-09-02T12:00:00Z");
const leads = HOME_FORM_VARIANTS.map((formName, i) => ({ id: i + 1, formName, createdAt }));
const link = (leadId: number, ghlContactId: string) => ({ leadId, detail: JSON.stringify({ ghlContactId }) });
const event = (eventType: string, ghlContactId = "c1", stageName: string | null = null) => ({ eventType, ghlContactId, stageName, occurredAt: after });

describe("durable homepage experiment outcomes", () => {
  it("has no winner or invented rates when no leads exist", () => {
    const report = calculateHomeExperiment([], [], [], []);
    expect(report.winner).toBeNull();
    expect(report.rows).toEqual(HOME_FORM_VARIANTS.map(formName => ({
      formName, exposedSessions: 0, leads: 0, linkedLeads: 0, qualified: 0, booked: 0, closedWon: 0, closedLost: 0,
      qualifiedRate: null, bookedRate: null, closedWonRate: null,
    })));
  });
  it("deduplicates exposures by original session and outcomes by original linked contact", () => {
    const exposures = [HOME_FORM_VARIANTS[0], HOME_FORM_VARIANTS[0], HOME_FORM_VARIANTS[1]].map(formName => ({
      sessionId: "s1", detail: JSON.stringify({ experimentId: HOME_EXPERIMENT, formName }), createdAt,
    }));
    const repeat = { id: 3, formName: HOME_FORM_VARIANTS[1], createdAt: after };
    const report = calculateHomeExperiment([...leads, repeat], exposures,
      [link(1, "c1"), link(1, "c1"), link(3, "c1"), link(2, "c2")],
      [event("qualified"), event("qualified"), event("appointment_booked"), event("appointment_booked"),
        event("appointment_cancelled"), event("won"), event("won"), event("lost", "c2")]);
    expect(report.rows[0]).toMatchObject({ exposedSessions: 1, qualified: 1, booked: 1, closedWon: 1, qualifiedRate: 1 });
    expect(report.rows[1]).toMatchObject({ exposedSessions: 0, leads: 2, qualified: 0, booked: 0, closedWon: 0, closedLost: 1 });
    expect(report.winner).toBeNull();
  });
  it("excludes unlinked/conflicting contacts, pre-intake events and unqualified stages", () => {
    const report = calculateHomeExperiment(leads, [], [link(1, "c1"), link(2, "c2"), link(2, "conflict")], [
      event("stage_change", "c1", "Unqualified"), event("won", "unknown"),
      { ...event("qualified"), occurredAt: new Date("2026-01-01") }, event("won", "c2"),
    ]);
    expect(report.rows[0]).toMatchObject({ qualified: 0, closedWon: 0 });
    expect(report.rows[1]).toMatchObject({ linkedLeads: 0, closedWon: 0 });
  });
  it("requires explicit qualification evidence rather than inferring it from a win", () => {
    const report = calculateHomeExperiment(leads, [], [link(1, "c1"), link(2, "c2")], [
      event("won"), event("stage_change", "c2", "Qualified"),
    ]);
    expect(report.rows[0]).toMatchObject({ qualified: 0, closedWon: 1 });
    expect(report.rows[1]).toMatchObject({ qualified: 1, closedWon: 0 });
  });
  it("normalizes explicit qualified events with a durable website lead reference", () => {
    expect(normalizeGhlLifecyclePayload({ website_lead_id: "42", contact_id: "c1", event_type: "qualified", event_id: "e1" }))
      .toMatchObject({ websiteLeadId: 42, eventType: "qualified", externalEventId: "ghl:e1" });
    expect(() => normalizeGhlLifecyclePayload({ website_lead_id: -1, contact_id: "c1", event_type: "qualified" })).toThrow();
  });
});

describe("stable assignment with blocked storage and PII-free exposure", () => {
  beforeEach(() => { vi.resetModules(); vi.unstubAllGlobals(); });
  function browser(randomValue: number, blocked = false) {
    const store = new Map<string, string>();
    const random = vi.fn((buffer: Uint32Array) => { buffer[0] = randomValue; return buffer; });
    const gtag = vi.fn();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => { if (blocked) throw new Error("blocked"); return store.get(key) ?? null; },
        setItem: (key: string, value: string) => { if (blocked) throw new Error("blocked"); store.set(key, value); },
      },
      crypto: { getRandomValues: random, randomUUID: () => "anonymous-test" }, gtag,
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    return { random, store, gtag };
  }
  it.each([0, 0xffffffff])("persists randomized assignment %s and retains it after reload", async value => {
    const { random } = browser(value);
    const helper = await import("../client/src/lib/homeExperiment");
    const first = helper.getHomeFormVariant();
    expect(first).toBe(HOME_FORM_VARIANTS[value === 0 ? 0 : 1]);
    expect(helper.getHomeFormVariant()).toBe(first);
    vi.resetModules();
    expect((await import("../client/src/lib/homeExperiment")).getHomeFormVariant()).toBe(first);
    expect(random).toHaveBeenCalledOnce();
  });
  it("remains usable and stable when storage is blocked", async () => {
    browser(0xffffffff, true);
    const helper = await import("../client/src/lib/homeExperiment");
    expect(helper.getHomeFormVariant()).toBe(HOME_FORM_VARIANTS[1]);
    expect(helper.getHomeFormVariant()).toBe(HOME_FORM_VARIANTS[1]);
    expect(helper.getExperimentSessionId()).toBeUndefined();
    helper.recordHomeExposure(HOME_FORM_VARIANTS[1]);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("records only an anonymous session and explicit experiment fields", async () => {
    const { gtag } = browser(0);
    const helper = await import("../client/src/lib/homeExperiment");
    helper.recordHomeExposure(HOME_FORM_VARIANTS[0]);
    const payload = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    expect(payload).toEqual({
      type: "experiment_exposure", sessionId: "sf_anonymous-test", page: "/",
      detail: JSON.stringify({ experimentId: HOME_EXPERIMENT, formName: HOME_FORM_VARIANTS[0] }),
    });
    expect(gtag).toHaveBeenCalledWith("event", "experiment_exposure", expect.objectContaining({ form_name: HOME_FORM_VARIANTS[0] }));
    expect(CALLBACK_SCOPE).toBe("requested_callback_only_v1");
  });
});
