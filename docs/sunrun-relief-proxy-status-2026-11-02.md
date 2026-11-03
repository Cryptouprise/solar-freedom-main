# Sunrun Solar Relief proxy — November 2, 2026

The latest owner-provided AI Studio contract supersedes earlier prefix-stripping handoffs. The requested mapping is exclusively:

```text
https://breakyoursolarcontract.com/sunrun-solar-relief/<path>?<query>
→ https://sunrun-relief.vibepreview.app/sunrun-solar-relief/<path>?<query>
```

## Implemented in the managed project

`server/sunrunReliefProxy.ts` registers the maintained `http-proxy-middleware` before body parsing, legacy redirects, SEO injection, static delivery and the parent SPA. It preserves raw path prefix, suffix, query, request body, upstream status, content types, compressed response body and redirects. There is no DNS record, root-asset proxy, page merge or HTML/canonical rewrite. HTTPS terminates at the existing parent host's managed deployment; the outgoing TLS connection verifies the origin hostname using explicit origin SNI.

Both upstream `Host` and `X-Forwarded-Host` are set to `breakyoursolarcontract.com`, and `X-Forwarded-Proto` to `https`, exactly as the supplied contract specifies. Parent login/session cookies and API credentials are not disclosed to the external origin. Upstream cookies are confined to the subdirectory and cannot overwrite the parent session. Serving external JavaScript on the main domain nevertheless trusts that code as same-origin code; path separation is not a security sandbox.

The existing `/sunrun` → blog redirect is an exact Express route, not `/sunrun*`. Its actual compiled matcher does not match `/sunrun-solar-relief` or descendants. It is preserved; nothing conflicts with the new earlier proxy handler. Other routes, redirects, canonical tags, city eligibility and analytics remain unchanged.

## Actual readiness findings

Direct upstream checks on November 2, 2026 found:

- Origin `/`: HTTP 200.
- Origin `/sunrun-solar-relief/` with the normal origin Host: HTTP 307 to `/sunrun-solar-relief`.
- Origin `/sunrun-solar-relief` and the prefixed cancellation page: HTTP 404.
- Origin prefixed sitemap and robots files: HTTP 404.
- Origin requests with the requested public `Host: breakyoursolarcontract.com`: HTTP 403 from Cloudflare, even for `/`.

These results are not a parent redirect collision. A prefix-preserving proxy cannot return the correct homepage as 200 until the origin serves that prefixed page. It also cannot overcome the origin edge's rejection of the required Host header. Returning the root homepage or changing upstream 403/404 into 200 would misrepresent readiness and violate the preserved-prefix contract.

Browser inspection of the public `/sunrun-solar-relief/` before deployment still shows the parent 404. A saved checkpoint is not proof of public rollout. The preview proxy and public endpoints must be rechecked after the project is published and after AI Studio's origin changes.

## Exact message for AI Studio

> Manus has implemented a strictly prefix-preserving proxy for `/sunrun-solar-relief/`. Direct origin checks show two blockers: (1) `https://sunrun-relief.vibepreview.app/sunrun-solar-relief` and its cancellation/sitemap/robots routes currently return 404; (2) sending `Host: breakyoursolarcontract.com` to that origin returns Cloudflare 403 even at `/`. Please publish the prefixed routes now, or temporarily serve the same content at both root and prefixed paths; waiting for the proxy to return 200 first creates a circular dependency. Also confirm the origin supports the public Host header. If the platform requires `Host: sunrun-relief.vibepreview.app` for virtual-host routing, confirm that requirement so Manus can retain that transport Host while sending `X-Forwarded-Host: breakyoursolarcontract.com` and `X-Forwarded-Proto: https`. Do not ask for prefix stripping, parent root-asset rewrites, a redirect, or a fabricated 200. Return working origin test URLs and the supported Host-header contract.

## Tests

Fifteen local integration tests validate exact-prefix boundaries, both homepage slash variants, nested pages/assets, raw repeated/encoded query values, JSON POST streaming before parsers, public Host headers, unchanged exact legacy redirect, upstream redirect passthrough, gzip handling, credential isolation, cookie scoping, and actual upstream 403/connection-error propagation. Focused model/executor regressions also pass. Full release totals and final preview statuses are recorded with the checkpoint.

Middleware source: https://github.com/chimurai/http-proxy-middleware . The origin response checks, not general library documentation, establish the current external readiness blockers.

## Final preview verification

After the managed server restart, all four prefixed homepage/cancellation/sitemap/robots requests returned the upstream Cloudflare 403 with `X-Sunrun-Relief-Proxy: prefix-preserved`. This verifies that they reach the installed handler, not the parent SPA or blog redirect. The unrelated `/sunrun` still returns its original 301 to the Sunrun blog and carries no proxy header. The full regression suite passed **63 test files / 500 tests**, with three opt-in probes skipped; TypeScript and the production build passed. This is a verified staged proxy, **not a functioning public Sunrun homepage**.
