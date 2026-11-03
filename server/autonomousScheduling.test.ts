import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ authenticate: vi.fn(), binding: vi.fn(), queue: vi.fn(), tick: vi.fn(), ensure: vi.fn() }));
vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: mocks.authenticate } }));
vi.mock("./autonomousQueue", async importOriginal => ({ ...await importOriginal<typeof import("./autonomousQueue")>(), readAutonomousScheduleBinding: mocks.binding }));
vi.mock("./autonomousWorker", () => ({ queueAutonomousRole: mocks.queue, runAutonomousTick: mocks.tick }));
vi.mock("./autonomousActivation", () => ({ ensureAutonomousWorkerStarted: mocks.ensure }));
import { agentRunHandler } from "./scheduled/agentRun";
import { autonomousTickHandler } from "./scheduled/autonomousTick";
import { autonomousFailureStatus, autonomousRetryDelayMs, AUTONOMOUS_STEP_MS, AUTONOMOUS_DAILY_STEP_LIMIT } from "./autonomousQueue";
const response = () => { const res: any = { status: vi.fn(), json: vi.fn() }; res.status.mockReturnValue(res); res.json.mockReturnValue(res); return res; };
beforeEach(() => { vi.resetAllMocks(); mocks.authenticate.mockResolvedValue({ isCron: true, taskUid: "trusted-task" }); mocks.ensure.mockResolvedValue(undefined); });
describe("durable autonomous scheduling", () => {
  it("does not dispatch regular signed-in requests", async () => {
    mocks.authenticate.mockResolvedValue({ isCron: false, taskUid: "trusted-task" }); const res = response();
    await agentRunHandler({ body: { agentSlug: "seo_intel" } } as any, res);
    expect(res.status).toHaveBeenCalledWith(403); expect(mocks.queue).not.toHaveBeenCalled(); expect(mocks.ensure).not.toHaveBeenCalled();
  });
  it("does not accept an arbitrary role from an unbound cron body", async () => {
    mocks.binding.mockResolvedValue(null); const res = response();
    await agentRunHandler({ body: { agentSlug: "manager" } } as any, res);
    expect(res.status).toHaveBeenCalledWith(403); expect(mocks.queue).not.toHaveBeenCalled();
  });
  it("uses only persisted role and mode, ignoring a forged body role", async () => {
    mocks.binding.mockResolvedValue({ agentSlug: "seo_intel", binding: { kind: "agent" } });
    mocks.queue.mockResolvedValue({ id: 41, status: "queued" }); const res = response();
    await agentRunHandler({ body: { agentSlug: "money_maker", scheduleMode: "mountain_8" } } as any, res);
    expect(mocks.queue).toHaveBeenCalledWith("seo_intel", "heartbeat:trusted-task");
    expect(res.status).toHaveBeenCalledWith(202); expect(res.json.mock.calls[0][0].summary).toMatch(/not a completed/);
  });
  it("refuses a non-worker schedule at the worker callback", async () => {
    mocks.binding.mockResolvedValue({ binding: { kind: "agent" } }); const res = response();
    await autonomousTickHandler({ body: { jobId: 1 } } as any, res);
    expect(res.status).toHaveBeenCalledWith(403); expect(mocks.tick).not.toHaveBeenCalled();
  });
  it("caps recovery and backs off without unlimited paid retries", () => {
    expect(AUTONOMOUS_STEP_MS).toBeLessThan(30_000); expect(AUTONOMOUS_DAILY_STEP_LIMIT).toBe(48);
    expect(autonomousFailureStatus(1)).toBe("queued"); expect(autonomousFailureStatus(2)).toBe("queued"); expect(autonomousFailureStatus(3)).toBe("failed");
    expect(autonomousRetryDelayMs(1)).toBe(300_000); expect(autonomousRetryDelayMs(2)).toBe(600_000); expect(autonomousRetryDelayMs(3)).toBe(1_200_000);
    expect(autonomousRetryDelayMs(100)).toBe(3_600_000);
  });
});
