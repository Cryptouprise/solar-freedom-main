import { afterEach, describe, expect, it, vi } from "vitest";
import { ENV } from "./_core/env";
import {
  isPublicStorageKey,
  registerStorageProxy,
} from "./_core/storageProxy";

const PUBLIC_KEY = "ff-attorney-contracts-review_1d59e4bb.png";

function captureHandler() {
  let handler: ((req: unknown, res: unknown) => Promise<void>) | undefined;
  const app = {
    get: vi.fn((_path: string, routeHandler: typeof handler) => {
      handler = routeHandler;
    }),
  };
  registerStorageProxy(app as never);
  if (!handler) throw new Error("storage route was not registered");
  return handler;
}

function mockResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    send: vi.fn(),
    set: vi.fn().mockReturnThis(),
    redirect: vi.fn(),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("public storage proxy boundary", () => {
  it("allows only the immutable public-asset manifest", () => {
    expect(isPublicStorageKey(PUBLIC_KEY)).toBe(true);
    expect(isPublicStorageKey("blog-images/private-draft.png")).toBe(false);
    expect(isPublicStorageKey("../private/customer-export.json")).toBe(false);
    expect(isPublicStorageKey(`${PUBLIC_KEY}/extra`)).toBe(false);
  });

  it("rejects arbitrary keys before contacting the privileged storage backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = mockResponse();

    await captureHandler()(
      { params: { 0: "blog-images/private-draft.png" } },
      response,
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.send).toHaveBeenCalledWith("Asset not found");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("presigns and redirects an allowlisted public asset", async () => {
    const originalForgeUrl = ENV.forgeApiUrl;
    const originalForgeKey = ENV.forgeApiKey;
    ENV.forgeApiUrl = "https://forge.example.test";
    ENV.forgeApiKey = "test-forge-key";
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ url: "https://cdn.example.test/signed/public.png?token=opaque" }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const response = mockResponse();

    try {
      await captureHandler()({ params: { 0: PUBLIC_KEY } }, response);
    } finally {
      ENV.forgeApiUrl = originalForgeUrl;
      ENV.forgeApiKey = originalForgeKey;
    }

    expect(fetchMock).toHaveBeenCalledOnce();
    const [requestUrl, requestInit] = fetchMock.mock.calls[0];
    expect(String(requestUrl)).toContain(`path=${PUBLIC_KEY}`);
    expect(requestInit.headers).toEqual({ Authorization: "Bearer test-forge-key" });
    expect(response.set).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(response.set).toHaveBeenCalledWith("Referrer-Policy", "no-referrer");
    expect(response.redirect).toHaveBeenCalledWith(
      307,
      "https://cdn.example.test/signed/public.png?token=opaque",
    );
  });

  it("refuses unsafe signed redirect URLs", async () => {
    const originalForgeUrl = ENV.forgeApiUrl;
    const originalForgeKey = ENV.forgeApiKey;
    ENV.forgeApiUrl = "https://forge.example.test";
    ENV.forgeApiKey = "test-forge-key";
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ url: "http://user:secret@cdn.example.test/private" }),
    })));
    const response = mockResponse();

    try {
      await captureHandler()({ params: { 0: PUBLIC_KEY } }, response);
    } finally {
      ENV.forgeApiUrl = originalForgeUrl;
      ENV.forgeApiKey = originalForgeKey;
    }

    expect(response.status).toHaveBeenCalledWith(502);
    expect(response.redirect).not.toHaveBeenCalled();
  });
});
