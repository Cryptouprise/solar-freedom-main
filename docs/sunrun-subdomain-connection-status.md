# Sunrun Subdomain Connection Status

**Checked:** 2026-09-14 18:32 UTC  
**Requested hostname:** `sunrun.breakyoursolarcontract.com`  
**Requested target:** `sunrun-relief.vibepreview.app`

## Current DNS and HTTP evidence

| Check | Result |
|---|---|
| Authoritative DNS | `ns1.globaldomaingroup.com` and `ns2.globaldomaingroup.com` (Global Domain Group) |
| Existing `sunrun` DNS record | None found; the hostname did not resolve at the time of the check |
| Requested target response | `https://sunrun-relief.vibepreview.app` returned HTTP `200` |
| Requested subdomain response | Could not resolve because no DNS record exists yet |
| Conflicting redirect in the Solar Freedom source | None found for `sunrun.breakyoursolarcontract.com` |
| Available DNS integration | No enabled Global Domain Group, Cloudflare, GoDaddy, or other DNS connector is available in this session |

## Required DNS action

Create this DNS-only record in the Global Domain Group DNS zone for `breakyoursolarcontract.com`:

| Host | Type | Target | TTL |
|---|---|---|---|
| `sunrun` | `CNAME` | `sunrun-relief.vibepreview.app` | Default / 3600 |

Do not create an A or AAAA record for `sunrun`; do not configure a redirect, reverse proxy, canonical rule, or subdirectory mapping. After DNS propagation, verify the custom domain in the external hosting platform if its Domain screen requires a validation step, then test `https://sunrun.breakyoursolarcontract.com` for a direct `200` response and the Sunrun Relief homepage.

## Main-site change

A single contextual card has been added to the existing `/sunrun` resource section. Its anchor text is **“Independent Help with Sunrun Solar Agreements”** and it links directly to `https://sunrun.breakyoursolarcontract.com`. It does not alter any existing URL, canonical tag, redirect, analytics setup, or content route.
