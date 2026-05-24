# SEO Growth Agent

The SEO Growth Agent is the operating loop for increasing rankings on a regular basis.

It is intentionally split into two layers:

1. `seo:audit` crawls the sitemap and scores crawler-facing HTML.
2. `seo:agent` runs the audit, writes heartbeat state, and turns findings into an action queue.
3. `seo:agent -- --apply` runs guarded deterministic fixers for safe recurring issues.

## Commands

```bash
pnpm seo:audit -- --base http://localhost:3010 --out reports/seo-agent/latest.json
pnpm seo:agent -- --base http://localhost:3010
pnpm seo:agent -- --base https://breakyoursolarcontract.com --ai
pnpm seo:agent -- --apply --dry-run
pnpm seo:agent:apply
```

Generated files are written under `reports/seo-agent/` and are ignored by git:

- `latest-agent-audit.json` - full machine-readable audit
- `agent-state.json` - last heartbeat state for deltas
- `HEARTBEAT.md` - human-readable pulse
- `ACTION_QUEUE.md` - prioritized implementation queue
- `APPLY_REPORT.md` - safe fixer changes made by apply mode

## What It Checks

- Sitemap URL status
- Redirect/canonical alignment
- Title and meta description length
- Duplicate titles and descriptions
- Canonical tags
- Canonical origin alignment (`www` vs non-www)
- H1 coverage
- Source-visible body depth
- JSON-LD coverage
- Internal link coverage
- Page type scoring

## Current Strategic Finding

The first run found that production Express was redirecting sitemap URLs to trailing-slash directory URLs while canonicals used no trailing slash. That has been fixed by disabling `express.static` directory redirects.

The second major finding was that non-homepage prerendered pages were metadata-only shells. They now include crawler-visible semantic HTML, H1s, JSON-LD, and related internal links before React loads.

## OpenRouter Strategy Notes

The agent supports optional OpenRouter strategy notes:

```bash
OPENROUTER_API_KEY=... pnpm seo:agent -- --base https://breakyoursolarcontract.com --ai
```

Use this for narrative prioritization, not for blind application. The deterministic queue remains the source of truth for what the agent should do next.

## Apply Mode

Apply mode is explicit and guarded:

```bash
pnpm seo:agent -- --apply --dry-run
pnpm seo:agent -- --base https://breakyoursolarcontract.com --apply --verify
```

Current safe fixer:

- Normalize legacy `https://www.breakyoursolarcontract.com` references in source files under `client/`, `server/`, and `scripts/` to the canonical `https://breakyoursolarcontract.com`.

When `--verify` is used, the agent runs `pnpm check` and `pnpm build` after it changes files. Broad content rewrites, title rewrites, schema rewrites, and internal-link rewrites still require a future source-aware fixer because those changes can affect user-facing copy and conversion behavior.

## Guardrails

- Diagnose by default.
- Apply only when `--apply` is explicitly passed.
- Apply mode is limited to deterministic, narrow fixers and writes an apply report.
- Verification mode runs `pnpm check` and `pnpm build` after a successful safe apply.
- Prioritize crawler-visible HTML, schema, canonicals, and internal links before publishing more content.
