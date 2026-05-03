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
import { eq } from "drizzle-orm";

export interface AdminRequest extends Request {
  apiKey?: {
    id: number;
    name: string;
    permissions: string[];
  };
}

export async function adminAuthMiddleware(
  req: AdminRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid Authorization header. Use: Authorization: Bearer <your-api-key>",
    });
  }

  const rawKey = authHeader.slice(7).trim();

  if (!rawKey.startsWith("sf_")) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid API key format. Keys must start with 'sf_'",
    });
  }

  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    // Get all active keys and check against bcrypt hash
    const activeKeys = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.active, 1));

    let matchedKey = null;
    for (const key of activeKeys) {
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
