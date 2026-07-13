# Periodic Work Safety Reference

The current Solar Freedom automation UI is plan/receipt-only. It does not turn
free-form prompts into tools, publish content, distribute press releases, change
source, run SQL, or access a browser.

Before enabling any recurring operation:

1. define a typed job and allowlisted input schema;
2. authenticate the caller and authorize the specific resource;
3. bind the job to an immutable owner and server-side identifier;
4. make execution idempotent and concurrency-safe;
5. use a durable external scheduler, not an in-process timer;
6. store secrets only in the platform secret manager;
7. emit stable client errors and redacted server logs without stacks, tokens,
   cookies, request bodies, personal data, or provider response text;
8. record the exact tool calls, state changes, verification evidence, cost, and
   rollback result;
9. add pause, revoke, retry, timeout, and dead-letter behavior; and
10. test duplicate delivery, stale authorization, partial failure, and rollback.

User-facing legal/YMYL copy always requires the publication gate even when the
draft was created on a schedule. A schedule is not approval.

The public GitHub SEO heartbeat is additionally paused until the repository is
private or its raw operational evidence is moved to an approved private store
and the exposed Search Console credential has been rotated.
