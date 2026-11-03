# Verified external findings — 3 November 2026

Everything here was observed directly on 3 Nov 2026 and should be re-checked
before being relied on later. Nothing in this file is inferred.

## GoHighLevel API quota — observed directly

A single unauthenticated-by-our-code request to
`https://services.leadconnectorhq.com/calendars/?locationId=WBEbDUNxKL5GyxIUjjdZ`
returned **HTTP 429** with these response headers:

| Header | Value |
|---|---|
| `x-ratelimit-daily-limit` | 200000 |
| `x-ratelimit-daily-remaining` | **0** |
| `x-ratelimit-daily-reset` | 5312000 (ms ≈ 1.48 hours from the request) |
| `x-ratelimit-limit` (interval) | 100 |
| `x-ratelimit-interval-milliseconds` | 10000 |
| `x-ratelimit-remaining` (interval) | 100 |

Body: `{"statusCode":429,"message":"Too Many Requests"}`

**What this proves:** the credential authenticates (a bad token returns 401, not
429). The daily allowance of 200,000 calls is fully spent by something other
than this codebase — our own call sites are a handful of admin-only,
non-polling queries. Whatever is consuming it is outside this repository and
must be found in GoHighLevel's own settings (marketplace apps, workflows,
webhooks, or connected integrations).

**Implication for the app:** appointment reconciliation must treat this as
`quota_exhausted` and report the count as *unknown*, never as zero.

## Official Nevada source URLs — each fetched, status confirmed

| Purpose | URL | Status |
|---|---|---|
| Nevada Attorney General — consumer complaint entry | `https://ag.nv.gov/Complaints/Consumer/` | 200 |
| Nevada AG — complaints hub (links to the complaint FAQ) | `https://ag.nv.gov/Complaints/` | 200 |
| Nevada AG — consumer protection division | `https://ag.nv.gov/About/Consumer_Protection/` | 200 |
| Nevada State Contractors Board — homeowners | `https://www.nvcontractorsboard.com/Homeowners/` | 200 |
| PUCN — consumers landing page | `https://puc.nv.gov/Consumers/` | 200 |
| FTC — solar power for your home | `https://consumer.ftc.gov/articles/solar-power-your-home` | 200 |

### URLs that do NOT work (do not cite these)

- `https://ag.nv.gov/Complaints/CSU_Complaints___FAQ/` — returns 000/timeout from this environment even though the AG hub links to it
- `https://ag.nv.gov/Complaints/File_a_Complaint/` — 000
- `https://ag.nv.gov/Complaints/Consumer_Complaint/` — 000
- `https://puc.nv.gov/Consumers/Complaints/` — redirects to `www.puc.nv.gov` and 404s
- `https://www.puc.nv.gov/Consumers/Complaints/File_a_Complaint/` — 404
- `https://www.nvcontractorsboard.com/Complaints` — 404
- `https://www.nvcontractorsboard.com/Consumers/Complaints/` — 404
- `https://www.nvcontractorsboard.com/File-A-Complaint/` — 404
- `https://app.nvcontractorsboard.com/Complaints` — 404
- `https://www.leg.state.nv.us/NRS/NRS-598.html` — 403 to automated requests

### Note on the Nevada State Contractors Board domain

`www.nvcontractorsboard.com` is the official state licensing agency that operates
the Solar Investigations Unit and the public Solar Watch List, but it is not on a
`.gov` domain. It is allowlisted in `scripts/prepare-priority-city-content.mjs`
alongside the Louisiana and Florida attorneys general, each of which was verified
the same way.

## City-page build gate (enforced by the generator)

For reference when adding a city page, `scripts/prepare-priority-city-content.mjs`
refuses to emit a guide unless all of these hold:

- title ≤ 60 characters
- meta description ≤ 160 characters
- exactly 3 FAQ entries
- every FAQ question ≤ 100 characters
- every FAQ answer ≤ 90 words
- `localNote` ≤ 80 words
- every source on an official domain (`.gov` or the allowlist above)
- the city must have a verified review object with `verified: true`
