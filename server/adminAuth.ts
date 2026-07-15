/**
 * Admin API Key Authentication Middleware
 * 
 * Validates Bearer tokens for external AI tools (Claude, Cursor, etc.)
 * API keys are stored as bcrypt hashes in the apiKeys table.
 * 
 * Usage: Include in Express routes before admin handlers
 * Header: Authorization: Bearer sf_<key>
 */

import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { getDb } from "./db";
import { apiKeys } from "../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { sdk } from "./_core/sdk";

export interface AdminRequest extends Request {
  apiKey?: {
    id: number;
    name: string;
    permissions: string[];
  };
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const MAX_KEY_LENGTH = 128;
const MAX_PREFIX_CANDIDATES = 5;

function isSameOrigin(req: Request): boolean {
  const origin = req.headers.origin;
  const forwardedHost = req.headers["x-forwarded-host"];
  const rawHost = Array.isArray(forwardedHost)
    ? forwardedHost[0]
    : forwardedHost?.split(",")[0]?.trim() || req.headers.host;

  if (!origin || !rawHost) return false;
  try {
    return new URL(origin).host === rawHost;
  } catch {
    return false;
  }
}

async function authenticateAdminSession(req: AdminRequest): Promise<boolean> {
  if (!req.headers.cookie) return false;
  if (!SAFE_METHODS.has(req.method) && !isSameOrigin(req)) return false;

  try {
    const user = await sdk.authenticateRequest(req);
    if (user.role !== "admin") return false;
    req.apiKey = {
      id: user.id,
      name: `admin-session:${user.openId}`,
      permissions: ["*"],
    };
    return true;
  } catch {
    return false;
  }
}

export async function adminAuthMiddleware(
  req: AdminRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    if (await authenticateAdminSession(req)) return next();
    return res.status(401).json({
      error: "Unauthorized",
      message: "Use an authenticated admin session or a scoped Bearer API key.",
    });
  }

  const rawKey = authHeader.slice(7).trim();

  if (!rawKey.startsWith("sf_") || rawKey.length > MAX_KEY_LENGTH) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid API key format. Keys must start with 'sf_'",
    });
  }

  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    // Prefix selection bounds expensive bcrypt work. Prefixes are random and
    // non-secret; an unexpected collision fan-out is rejected instead of
    // allowing one request to consume unbounded CPU.
    const candidates = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.active, 1), eq(apiKeys.keyPrefix, rawKey.slice(0, 10))))
      .limit(MAX_PREFIX_CANDIDATES + 1);

    if (candidates.length > MAX_PREFIX_CANDIDATES) {
      console.error("[AdminAuth] Refusing ambiguous API key prefix");
      return res.status(503).json({ error: "API key index requires maintenance" });
    }

    let matchedKey = null;
    for (const key of candidates) {
      const matches = await bcrypt.compare(rawKey, key.keyHash);
      if (matches) {
        matchedKey = key;
        break;
      }
    }

    if (!matchedKey) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid API key",
      });
    }

    // Update last used timestamp (fire and forget)
    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, matchedKey.id))
      .catch(() => {});

    // Attach key info to request
    req.apiKey = {
      id: matchedKey.id,
      name: matchedKey.name,
      permissions: JSON.parse(matchedKey.permissions),
    };

    next();
  } catch (err) {
    console.error("[AdminAuth] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export function requirePermission(permission: string) {
  return (req: AdminRequest, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const perms = req.apiKey.permissions;
    if (!perms.includes(permission) && !perms.includes("*")) {
      return res.status(403).json({
        error: "Forbidden",
        message: `This API key does not have '${permission}' permission`,
      });
    }
    next();
  };
}
