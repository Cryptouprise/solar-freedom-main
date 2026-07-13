import { readFileSync } from "node:fs";
import { SignJWT, decodeJwt } from "jose";
import type { AxiosInstance } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SESSION_DURATION_MS } from "../shared/const";
import {
  assertProductionRuntimeConfig,
  ENV,
  getProductionConfigErrors,
  isStrongSessionSecret,
  type RuntimeConfig,
} from "./_core/env";
import { getSessionCookieOptions } from "./_core/cookies";
import { logSafeError } from "./_core/safeLog";
import { SDKServer } from "./_core/sdk";
import { registerStorageProxy } from "./_core/storageProxy";

const STRONG_SECRET = "A9f$2LmQ7xP4vN8cR1tY6uI3oK5jH0sZ";

function config(overrides: Partial<RuntimeConfig> = {}): RuntimeConfig {
  return {
    appId: "solar-freedom",
    cookieSecret: STRONG_SECRET,
    databaseUrl: "mysql://app-user:password@db.example.test/solar_freedom",
    oAuthServerUrl: "https://api.manus.im",
    ownerOpenId: "owner-123",
    isProduction: true,
    forgeApiUrl: "",
    forgeApiKey: "",
    ...overrides,
  };
}

function sdkFor(runtimeConfig = config()) {
  const client = { post: vi.fn() } as unknown as AxiosInstance;
  return new SDKServer(client, runtimeConfig);
}

async function createLegacySession(openId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    openId,
    appId: "solar-freedom",
    name: "Scheduled Task",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(now + 60)
    .sign(new TextEncoder().encode(STRONG_SECRET));
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("production authentication configuration", () => {
  it("accepts a strong session secret and credential-free HTTPS OAuth URL", () => {
    expect(isStrongSessionSecret(STRONG_SECRET)).toBe(true);
    expect(getProductionConfigErrors(config())).toEqual([]);
    expect(() => assertProductionRuntimeConfig(config())).not.toThrow();
  });

  it("rejects missing, placeholder, repetitive, and short JWT secrets", () => {
    for (const cookieSecret of [
      "",
      "short",
      "change-me-change-me-change-me-change-me",
      "a".repeat(64),
    ]) {
      expect(getProductionConfigErrors(config({ cookieSecret }))).toContain(
        "JWT_SECRET must be a strong, random value of at least 32 bytes",
      );
    }
  });

  it("rejects unsafe OAuth configuration without echoing secret values", () => {
    const unsafe = config({
      cookieSecret: "unsafe-secret-value-that-must-never-be-logged-123456",
      oAuthServerUrl: "http://user:password@example.com",
    });

    expect(() => assertProductionRuntimeConfig(unsafe)).toThrow(
      /JWT_SECRET|OAUTH_SERVER_URL/,
    );
    try {
      assertProductionRuntimeConfig(unsafe);
    } catch (error) {
      expect(String(error)).not.toContain(unsafe.cookieSecret);
      expect(String(error)).not.toContain("password@example.com");
    }
  });

  it("fails production readiness when persistence or the owner identity is missing", () => {
    expect(getProductionConfigErrors(config({ databaseUrl: "" }))).toContain(
      "DATABASE_URL must be a valid MySQL connection URL",
    );
    expect(getProductionConfigErrors(config({ ownerOpenId: "" }))).toContain(
      "OWNER_OPEN_ID is required",
    );
  });
});

describe("session JWTs", () => {
  it("adds issuer, audience, iat, and jti and accepts an empty display name", async () => {
    const sdk = sdkFor();
    const token = await sdk.createSessionToken("user-123", { name: "" });
    const payload = decodeJwt(token);

    expect(payload.iss).toBe("urn:manus-app:solar-freedom:session");
    expect(payload.aud).toBe("solar-freedom");
    expect(payload.iat).toEqual(expect.any(Number));
    expect(payload.jti).toEqual(expect.any(String));
    expect((payload.exp ?? 0) - (payload.iat ?? 0)).toBeLessThanOrEqual(
      SESSION_DURATION_MS / 1000,
    );
    await expect(sdk.verifySession(token)).resolves.toEqual({
      openId: "user-123",
      appId: "solar-freedom",
      name: "",
    });
  });

  it("caps caller-requested sessions at seven days", async () => {
    const token = await sdkFor().createSessionToken("user-123", {
      name: "User",
      expiresInMs: SESSION_DURATION_MS * 52,
    });
    const payload = decodeJwt(token);

    expect((payload.exp ?? 0) - (payload.iat ?? 0)).toBe(
      SESSION_DURATION_MS / 1000,
    );
  });

  it("rejects a token whose payload appId does not exactly match", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({
      openId: "user-123",
      appId: "another-app",
      name: "User",
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuer("urn:manus-app:solar-freedom:session")
      .setAudience("solar-freedom")
      .setIssuedAt(now)
      .setJti("6f50f56d-e32a-4d23-abaf-3fe462437f62")
      .setExpirationTime(now + 60)
      .sign(new TextEncoder().encode(STRONG_SECRET));

    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await expect(sdkFor().verifySession(token)).resolves.toBeNull();
  });

  it("refuses to sign with a weak non-empty HMAC key", async () => {
    await expect(
      sdkFor(config({ cookieSecret: "one-byte-is-not-safe" }))
        .createSessionToken("user-123", { name: "User" }),
    ).rejects.toThrow("Session signing is not securely configured");
  });

  it("keeps a narrow Manus legacy-token path for externally verified cron identities", async () => {
    const token = await createLegacySession("cron_platform-trigger");
    const post = vi.fn().mockResolvedValue({
      data: {
        openId: "cron_platform-trigger",
        name: "Scheduled Task",
        taskUid: "task_platform-verified",
      },
    });
    const sdk = new SDKServer({ post } as unknown as AxiosInstance, config());

    await expect(sdk.authenticateRequest({
      headers: { cookie: `app_session_id=${token}` },
    } as never)).resolves.toMatchObject({
      openId: "cron_platform-trigger",
      isCron: true,
      taskUid: "task_platform-verified",
    });
    expect(post).toHaveBeenCalledWith(
      "/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt",
      { jwtToken: token, projectId: "solar-freedom" },
    );
  });

  it("does not extend legacy claim compatibility to ordinary user sessions", async () => {
    const token = await createLegacySession("user-123");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(sdkFor().verifySession(token)).resolves.toBeNull();
  });
});

describe("session cookie defaults", () => {
  it("uses an HttpOnly same-site cookie and Secure on HTTPS", () => {
    const options = getSessionCookieOptions({
      protocol: "https",
      headers: {},
    } as never);

    expect(options).toMatchObject({
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
    expect(options.domain).toBeUndefined();
  });
});

describe("redacted structured logging", () => {
  it("does not serialize Axios-style request, response, token, cookie, or PII data", () => {
    const sentinel = "SENTINEL-private-token-user@example.com";
    const error = Object.assign(new Error(sentinel), {
      name: sentinel,
      code: sentinel,
      config: {
        headers: { Authorization: `Bearer ${sentinel}`, cookie: sentinel },
        data: { email: "user@example.com" },
      },
      response: { data: sentinel },
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logSafeError("oauth.callback_failed", error);

    expect(consoleError).toHaveBeenCalledTimes(1);
    const output = String(consoleError.mock.calls[0]?.[0]);
    expect(() => JSON.parse(output)).not.toThrow();
    expect(output).toContain('"event":"oauth.callback_failed"');
    expect(output).not.toContain("SENTINEL");
    expect(output).not.toContain("private-token");
    expect(output).not.toContain("user@example.com");
    expect(output).not.toContain("Authorization");
    expect(output).not.toContain("cookie");
  });

  it("does not read or log a rejected storage upstream response body", async () => {
    let handler: ((req: unknown, res: unknown) => Promise<void>) | undefined;
    const app = {
      get: vi.fn((_path: string, routeHandler: typeof handler) => {
        handler = routeHandler;
      }),
    };
    const bodyText = vi.fn(async () => "SENTINEL-upstream-private-body");
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 503,
      text: bodyText,
    }));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const originalForgeUrl = ENV.forgeApiUrl;
    const originalForgeKey = ENV.forgeApiKey;
    ENV.forgeApiUrl = "https://forge.example.test";
    ENV.forgeApiKey = "SENTINEL-forge-key";
    vi.stubGlobal("fetch", fetchMock);

    const response = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
      set: vi.fn(),
      redirect: vi.fn(),
    };

    try {
      registerStorageProxy(app as never);
      expect(handler).toBeTypeOf("function");
      await handler?.(
        { params: { 0: "ff-attorney-contracts-review_1d59e4bb.png" } },
        response,
      );
    } finally {
      ENV.forgeApiUrl = originalForgeUrl;
      ENV.forgeApiKey = originalForgeKey;
    }

    expect(bodyText).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(502);
    const output = consoleError.mock.calls.flat().join(" ");
    expect(output).toContain('"upstreamStatus":503');
    expect(output).not.toContain("SENTINEL");
    expect(output).not.toContain("private-body");
    expect(output).not.toContain("forge-key");
  });
});

describe("admin browser session handling", () => {
  it("never reads the HttpOnly session cookie from browser JavaScript", () => {
    const source = readFileSync(
      new URL("../client/src/pages/admin/AutomationBuilder.tsx", import.meta.url),
      "utf8",
    );

    expect(source).not.toMatch(/document\.cookie/);
    expect(source).not.toMatch(/app_session_id/);
  });
});
