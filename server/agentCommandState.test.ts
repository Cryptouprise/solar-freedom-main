import { describe, expect, it } from "vitest";
import { fullCycleRunError } from "../client/src/pages/admin/agentCommandState";

describe("agent command run state", () => {
  it("uses the actual mutation error instead of fabricating successful agent progress", () => {
    expect(fullCycleRunError(new Error("Scheduler rejected the run"))).toBe("Scheduler rejected the run");
  });

  it("gives an explicit failure state for non-Error mutation failures", () => {
    expect(fullCycleRunError({ reason: "timeout" })).toContain("did not complete");
  });
});
