import { describe, expect, it } from "vitest";
import { classifyAppointmentFailure, reconcileAppointments } from "./appointmentReconciliation";

describe("GHL appointment reconciliation", () => {
  it("never reports a bare zero when the provider could not be asked", async () => {
    const result = await reconcileAppointments({ locationId: "loc_test", token: undefined });
    expect(result.state).toBe("unavailable");
    // The critical contract: unknown is not zero.
    expect(result.totalBooked).toBeNull();
    expect(result.detail).toContain("cannot be pulled");
    expect(result.source).toBe("direct GHL API");
  });

  it("distinguishes a spent daily quota from a broken credential", () => {
    const quota = classifyAppointmentFailure(429, 0);
    expect(quota.state).toBe("quota_exhausted");
    expect(quota.detail).toContain("unknown, not zero");
    expect(quota.detail).toContain("daily API quota");

    const auth = classifyAppointmentFailure(401, null);
    expect(auth.state).toBe("unavailable");
    expect(auth.detail).toContain("credential");

    const forbidden = classifyAppointmentFailure(403, null);
    expect(forbidden.state).toBe("unavailable");

    const other = classifyAppointmentFailure(500, null);
    expect(other.state).toBe("unavailable");
    expect(other.detail).toContain("unknown, not zero");
  });

  it("treats a rate limit without a daily-zero header as quota pressure, not success", () => {
    const limited = classifyAppointmentFailure(429, 42);
    expect(limited.state).toBe("quota_exhausted");
    expect(limited.detail).toContain("unknown, not zero");
  });

  it("keeps the three feed states mutually exclusive", () => {
    const states = new Set([
      classifyAppointmentFailure(429, 0).state,
      classifyAppointmentFailure(401, null).state,
      classifyAppointmentFailure(500, null).state,
    ]);
    // quota_exhausted and unavailable are the only failure states; ok is only
    // ever produced by a real successful provider response.
    expect(states.has("quota_exhausted")).toBe(true);
    expect(states.has("unavailable")).toBe(true);
    expect(states.has("ok")).toBe(false);
  });
});
