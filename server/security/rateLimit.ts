import type { Request } from "express";
import { TRPCError } from "@trpc/server";
import { createHash } from "node:crypto";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function clientAddress(req: Request): string {
  // Express derives req.ip from the socket and the configured trust-proxy
  // policy. Reading X-Forwarded-For directly would let a caller rotate a
  // spoofed header and evade this per-address limit.
  return req.ip || req.socket?.remoteAddress || "unknown";
}

/** Best-effort per-instance abuse control. Production ingress should also rate-limit. */
export function enforcePublicMutationLimit(req: Request, action: string, max = 10, windowMs = 10 * 60_000): void {
  const now = Date.now();
  const key = `${action}:${clientAddress(req)}`;
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [candidate, bucket] of Array.from(buckets.entries())) {
        if (bucket.resetAt <= now) buckets.delete(candidate);
      }
      if (buckets.size >= MAX_BUCKETS) buckets.delete(buckets.keys().next().value as string);
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (current.count >= max) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many requests. Please try again later." });
  }
  current.count += 1;
}

/** Rate-limit a normalized contact identifier without retaining the raw PII. */
export function enforcePublicIdentifierLimit(
  req: Request,
  action: string,
  identifier: string,
  max = 3,
  windowMs = 60 * 60_000,
): void {
  const digest = createHash("sha256").update(identifier).digest("hex").slice(0, 24);
  const now = Date.now();
  const key = `${action}:identifier:${clientAddress(req)}:${digest}`;
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (current.count >= max) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests for this contact. Please try again later.",
    });
  }
  current.count += 1;
}

export function clearRateLimitsForTests(): void {
  buckets.clear();
}
