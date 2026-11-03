import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { and, desc, eq, gte, like } from "drizzle-orm";
import { apiKeys } from "../drizzle/schema";
import { getDb } from "./db";
export const EXTERNAL_SEO_PERMISSIONS = ["posts:read", "drafts:write", "media:write", "visual:review", "seo:read", "agents:read"] as const;
const PREFIX = "external-seo:";
export async function listExternalAiKeys() {
  const db = await getDb(); if (!db) throw new Error("Key database unavailable");
  return db.select({ id: apiKeys.id, name: apiKeys.name, keyPrefix: apiKeys.keyPrefix, active: apiKeys.active, createdAt: apiKeys.createdAt, lastUsedAt: apiKeys.lastUsedAt }).from(apiKeys).where(like(apiKeys.name, `${PREFIX}%`)).orderBy(desc(apiKeys.createdAt)).limit(20);
}
export async function createExternalAiKey(name: string) {
  const db = await getDb(); if (!db) throw new Error("Key database unavailable");
  const today = await db.select({ id: apiKeys.id }).from(apiKeys).where(and(like(apiKeys.name, `${PREFIX}%`), gte(apiKeys.createdAt, new Date(Date.now() - 24 * 60 * 60_000)))).limit(10);
  if (today.length >= 10) throw new Error("Ten external keys created today; revoke/reuse one rather than minting more.");
  const key = `sf_${crypto.randomBytes(32).toString("hex")}`;
  const [saved] = await db.insert(apiKeys).values({ name: `${PREFIX}${name.trim()}`.slice(0, 100), keyHash: await bcrypt.hash(key, 12), keyPrefix: key.slice(0, 10), permissions: JSON.stringify(EXTERNAL_SEO_PERMISSIONS), active: 1 }).$returningId();
  return { id: saved.id, key, permissions: [...EXTERNAL_SEO_PERMISSIONS], message: "Copy once into your outside AI's secret manager. No live-post editing, publishing, delete, raw SQL, configuration, model/schedule control or CRM access is granted." };
}
export async function revokeExternalAiKey(id: number) {
  const db = await getDb(); if (!db) throw new Error("Key database unavailable");
  await db.update(apiKeys).set({ active: 0 }).where(and(eq(apiKeys.id, id), like(apiKeys.name, `${PREFIX}%`)));
  return { revoked: true, id };
}
