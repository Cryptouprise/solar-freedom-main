import { AXIOS_TIMEOUT_MS, COOKIE_NAME, SESSION_DURATION_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import axios, { type AxiosInstance } from "axios";
import { parse as parseCookieHeader } from "cookie";
import { randomUUID } from "node:crypto";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";

// ─── Cron identity support (§5c) ──────────────────────────────────────────────
const CRON_OPEN_ID_PREFIX = "cron_";

export type AuthenticatedUser = User & {
  taskUid?: string;
  isCron?: boolean;
};

function buildCronUser(userInfo: GetUserInfoWithJwtResponse): AuthenticatedUser {
  const now = new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? undefined,
    isCron: true,
  } as AuthenticatedUser;
}
import * as db from "../db";
import { ENV, isStrongSessionSecret, type RuntimeConfig } from "./env";
import { logSafeError } from "./safeLog";
import type {
  ExchangeTokenRequest,
  ExchangeTokenResponse,
  GetUserInfoResponse,
  GetUserInfoWithJwtRequest,
  GetUserInfoWithJwtResponse,
} from "./types/manusTypes";
// Utility function
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

type VerifiedSession = {
  openId: string;
  appId: string;
  name: string;
};

const EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
const GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
const GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;

class OAuthService {
  constructor(
    private client: ReturnType<typeof axios.create>,
    private config: RuntimeConfig,
  ) {}

  private decodeState(state: string): string {
    const redirectUri = atob(state);
    return redirectUri;
  }

  async getTokenByCode(
    code: string,
    state: string
  ): Promise<ExchangeTokenResponse> {
    const payload: ExchangeTokenRequest = {
      clientId: this.config.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state),
    };

    const { data } = await this.client.post<ExchangeTokenResponse>(
      EXCHANGE_TOKEN_PATH,
      payload
    );

    return data;
  }

  async getUserInfoByToken(
    token: ExchangeTokenResponse
  ): Promise<GetUserInfoResponse> {
    const { data } = await this.client.post<GetUserInfoResponse>(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken,
      }
    );

    return data;
  }
}

const createOAuthHttpClient = (config: RuntimeConfig): AxiosInstance =>
  axios.create({
    baseURL: config.oAuthServerUrl,
    timeout: AXIOS_TIMEOUT_MS,
  });

export class SDKServer {
  private readonly client: AxiosInstance;
  private readonly oauthService: OAuthService;

  constructor(
    client?: AxiosInstance,
    private readonly config: RuntimeConfig = ENV,
  ) {
    this.client = client ?? createOAuthHttpClient(this.config);
    this.oauthService = new OAuthService(this.client, this.config);
  }

  private deriveLoginMethod(
    platforms: unknown,
    fallback: string | null | undefined
  ): string | null {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set<string>(
      platforms.filter((p): p is string => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (
      set.has("REGISTERED_PLATFORM_MICROSOFT") ||
      set.has("REGISTERED_PLATFORM_AZURE")
    )
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }

  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(
    code: string,
    state: string
  ): Promise<ExchangeTokenResponse> {
    return this.oauthService.getTokenByCode(code, state);
  }

  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken: string): Promise<GetUserInfoResponse> {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken,
    } as ExchangeTokenResponse);
    const loginMethod = this.deriveLoginMethod(
      (data as any)?.platforms,
      (data as any)?.platform ?? data.platform ?? null
    );
    return {
      ...(data as any),
      platform: loginMethod,
      loginMethod,
    } as GetUserInfoResponse;
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    const secret = this.config.cookieSecret;
    if (!isStrongSessionSecret(secret)) {
      throw new Error("Session signing is not securely configured");
    }
    return new TextEncoder().encode(secret);
  }

  private getSessionIssuer() {
    return `urn:manus-app:${this.config.appId}:session`;
  }

  private readSessionIdentity(
    payload: Record<string, unknown>,
  ): VerifiedSession | null {
    const { openId, appId, name } = payload;
    if (
      !isNonEmptyString(openId)
      || appId !== this.config.appId
      || typeof name !== "string"
    ) {
      return null;
    }
    return { openId, appId, name };
  }

  /**
   * Manus scheduled-task cookies predate the app-specific iss/aud/jti claims.
   * Keep a narrow compatibility path for signed, unexpired cron identities;
   * authenticateRequest immediately validates the raw JWT with Manus and
   * requires a platform-issued taskUid before granting cron access.
   */
  private async verifyLegacyCronSession(
    cookieValue: string,
    secretKey: Uint8Array,
  ): Promise<VerifiedSession | null> {
    const { payload } = await jwtVerify(cookieValue, secretKey, {
      algorithms: ["HS256"],
      requiredClaims: ["exp"],
    });
    const identity = this.readSessionIdentity(payload as Record<string, unknown>);
    return identity?.openId.startsWith(CRON_OPEN_ID_PREFIX) ? identity : null;
  }

  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    return this.signSession(
      {
        openId,
        appId: this.config.appId,
        name: options.name || "",
      },
      options
    );
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    if (!isNonEmptyString(payload.openId)) {
      throw new Error("Session openId is required");
    }
    if (payload.appId !== this.config.appId) {
      throw new Error("Session appId does not match this application");
    }
    if (typeof payload.name !== "string") {
      throw new Error("Session name must be a string");
    }

    const requestedDuration = options.expiresInMs ?? SESSION_DURATION_MS;
    if (!Number.isFinite(requestedDuration) || requestedDuration <= 0) {
      throw new Error("Session duration must be positive");
    }
    const expiresInMs = Math.min(requestedDuration, SESSION_DURATION_MS);
    const issuedAtSeconds = Math.floor(Date.now() / 1000);
    const expirationSeconds = issuedAtSeconds + Math.ceil(expiresInMs / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuer(this.getSessionIssuer())
      .setAudience(this.config.appId)
      .setIssuedAt(issuedAtSeconds)
      .setJti(randomUUID())
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<VerifiedSession | null> {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }

    const secretKey = (() => {
      try {
        return this.getSessionSecret();
      } catch (error) {
        logSafeError("auth.session_verification_failed", error);
        return null;
      }
    })();
    if (!secretKey) return null;

    try {
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
        audience: this.config.appId,
        issuer: this.getSessionIssuer(),
        maxTokenAge: Math.floor(SESSION_DURATION_MS / 1000),
        requiredClaims: ["exp", "iat", "jti"],
        typ: "JWT",
      });
      const identity = this.readSessionIdentity(payload as Record<string, unknown>);

      if (
        !identity
        || typeof payload.iat !== "number"
        || !isNonEmptyString(payload.jti)
      ) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }

      return identity;
    } catch (strictError) {
      try {
        const legacyCron = await this.verifyLegacyCronSession(cookieValue, secretKey);
        if (legacyCron) return legacyCron;
      } catch {
        // Log only the already-redacted outer error classification below.
      }
      logSafeError("auth.session_verification_failed", strictError);
    }
    return null;
  }

  async getUserInfoWithJwt(
    jwtToken: string
  ): Promise<GetUserInfoWithJwtResponse> {
    const payload: GetUserInfoWithJwtRequest = {
      jwtToken,
      projectId: this.config.appId,
    };

    const { data } = await this.client.post<GetUserInfoWithJwtResponse>(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );

    const loginMethod = this.deriveLoginMethod(
      (data as any)?.platforms,
      (data as any)?.platform ?? data.platform ?? null
    );
    return {
      ...(data as any),
      platform: loginMethod,
      loginMethod,
    } as GetUserInfoWithJwtResponse;
  }

  async authenticateRequest(req: Request): Promise<AuthenticatedUser> {
    // Regular authentication flow
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    // === Cron short-circuit (§5c) ===
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
      if (!userInfo.taskUid) throw ForbiddenError("Cron session missing task_uid");
      return buildCronUser(userInfo);
    }
    // === End cron short-circuit ===

    const sessionUserId = session.openId;
    const signedInAt = new Date();
    let user = await db.getUserByOpenId(sessionUserId);

    // If user not in DB, sync from OAuth server automatically
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await db.upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt,
        });
        user = await db.getUserByOpenId(userInfo.openId);
      } catch (error) {
        logSafeError("auth.user_sync_failed", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }

    if (!user) {
      throw ForbiddenError("User not found");
    }

    await db.upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt,
    });

    return user;
  }
}

export const sdk = new SDKServer();
