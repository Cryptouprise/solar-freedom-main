# Sunrun Path-Proxy Readiness Status

**Checked:** 2026-09-14 19:30 UTC
**Requested public path:** `https://breakyoursolarcontract.com/sunrun/...`
**Requested upstream:** `https://sunrun-relief.vibepreview.app/sunrun/...`

## Result

The requested reverse proxy **must not be published yet**. The external app is live and its homepage is available at `https://sunrun-relief.vibepreview.app/`, but it is not deployed under the required `/sunrun/` upstream prefix.

| Required upstream URL | Actual result at time of check |
|---|---|
| `https://sunrun-relief.vibepreview.app/sunrun/` | `404` (the trailing-slash request redirects to `/sunrun`, which is also `404`) |
| `https://sunrun-relief.vibepreview.app/sunrun/sunrun-contract-cancellation` | `404` |
| `https://sunrun-relief.vibepreview.app/sunrun/sitemap.xml` | `404` |
| `https://sunrun-relief.vibepreview.app/sunrun/robots.txt` | `404` |

The equivalent app routes currently work only **without** the required prefix. For example, `/sunrun-contract-cancellation`, `/resources/find-sunrun-contract`, `/sitemap.xml`, and `/robots.txt` return `200` at the external host. The app also currently emits root-relative navigation and asset URLs such as `/assets/...` and `/resources/...`, along with canonical and sitemap references to `https://sunrunsolarrelief.com`; that domain does not resolve at the time of the check.

## Required external deployment change

Rebuild and publish the external application with `/sunrun/` as its public base path. Before the proxy is enabled, the external host must return `200` for all four required upstream URLs:

```text
https://sunrun-relief.vibepreview.app/sunrun/
https://sunrun-relief.vibepreview.app/sunrun/sunrun-contract-cancellation
https://sunrun-relief.vibepreview.app/sunrun/sitemap.xml
https://sunrun-relief.vibepreview.app/sunrun/robots.txt
```

The external deployment must also emit `/sunrun/`-prefixed internal navigation, form actions, JavaScript/CSS/asset paths, and `Location` redirects. Its canonical tags, Open Graph URLs, sitemap entries, and `robots.txt` sitemap declaration must name the final public path-domain URL, `https://breakyoursolarcontract.com/sunrun/...`.

## Safe local state

No CNAME, DNS change, reverse proxy, or new `/sunrun/` production rule was published. The existing `/sunrun` redirect to the established Sunrun blog remains in place. The previously added subdomain link was removed because the corrected scope explicitly prohibits a subdomain. No other routes, content, canonical tags, redirects, or analytics settings were changed.
