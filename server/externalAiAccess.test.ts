import { describe, it, expect, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({ insert: vi.fn(), lookup: vi.fn(), update: vi.fn(), hash: vi.fn() }));
vi.mock("bcryptjs", () => ({ default: { hash: mocks.hash } }));
vi.mock("./db", () => ({ getDb: vi.fn(async () => ({
  select: () => ({ from: () => ({ where: () => ({ limit: mocks.lookup, orderBy: () => ({ limit: mocks.lookup }) }) }) }),
  insert: () => ({ values: (data: unknown) => { mocks.insert(data); return { $returningId: async () => [{ id: 8 }] }; } }),
  update: () => ({ set: (data: unknown) => { mocks.update(data); return { where: async () => [{}] }; } }),
})) }));
import { createExternalAiKey, EXTERNAL_SEO_PERMISSIONS, revokeExternalAiKey, listExternalAiKeys } from "./externalAiAccess";
import { autopilotRouter } from "./autopilotRouter";
beforeEach(() => { vi.clearAllMocks(); mocks.lookup.mockResolvedValue([]); mocks.hash.mockResolvedValue("hashed-only"); });
describe("restricted outside AI access", () => {
  it("stores only a hashed key and the deliberate limited permission list", async () => { const result = await createExternalAiKey("My AI"); expect(result.key).toMatch(/^sf_[a-f0-9]{64}$/); expect(result.id).toBe(8); const stored = mocks.insert.mock.calls[0][0]; expect(stored.keyHash).toBe("hashed-only"); expect(JSON.stringify(stored)).not.toContain(result.key); expect(JSON.parse(stored.permissions)).toEqual(EXTERNAL_SEO_PERMISSIONS); for (const forbidden of ["*", "posts:write", "posts:publish", "posts:delete", "config:read", "config:write", "keys:manage", "automation:execute"]) expect(result.permissions).not.toContain(forbidden); });
  it("refuses excessive key creation without generating another row", async () => { mocks.lookup.mockResolvedValueOnce(Array.from({ length: 10 }, (_, id) => ({ id }))); await expect(createExternalAiKey("My AI")).rejects.toThrow("Ten external keys"); expect(mocks.insert).not.toHaveBeenCalled(); });
  it("does not show raw keys when listing and supports limited-key revocation", async () => { expect(await listExternalAiKeys()).toEqual([]); await revokeExternalAiKey(8); expect(mocks.update).toHaveBeenCalledWith({ active: 0 }); });
  it("blocks ordinary and signed-out users on every owner key control", async () => { const ordinary = autopilotRouter.createCaller({ user: { id: 7, role: "user" }, req: {}, res: {} } as any); const anonymous = autopilotRouter.createCaller({ user: null, req: {}, res: {} } as any); await expect(ordinary.externalKeys()).rejects.toThrow("Forbidden"); await expect(ordinary.createExternalKey({ name: "Unauthorized" })).rejects.toThrow("Forbidden"); await expect(ordinary.revokeExternalKey({ id: 8 })).rejects.toThrow("Forbidden"); await expect(anonymous.createExternalKey({ name: "Unauthorized" })).rejects.toThrow(); expect(mocks.insert).not.toHaveBeenCalled(); });
});
