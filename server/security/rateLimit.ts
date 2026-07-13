import type { Request } from "express";
import { TRPCError } from "@trpc/server";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function clientAddress(req: Request): string {
  const forwarded = req.headers?.["x-forwarded-for"];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  return first?.trim() || req.ip || req.socket?.remoteAddress || "unknown";
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

export function clearRateLimitsForTests(): void {
  buckets.clear();
}
