# SEO Growth Agent

The SEO Growth Agent is the operating loop for increasing rankings on a regular basis.

It is intentionally split into two layers:

1. `seo:audit` crawls the sitemap and scores crawler-facing HTML.
2. `seo:agent` runs the audit, writes heartbeat state, and turns findings into an action queue.

## Commands

```bash
pnpm seo:audit -- --base http://localhost:3010 --out reports/seo-agent/latest.json
pnpm seo:agent -- --base http://localhost:3010
pnpm seo:agent -- --base https://breakyoursolarcontract.com --ai
```

Generated files are written under `reports/seo-agent/` and are ignored by git:

- `latest-agent-audit.json` - full machine-readable audit
- `agent-state.json` - last heartbeat state for deltas
- `HEARTBEAT.md` - human-readable pulse
- `ACTION_QUEUE.md` - prioritized implementation queue

## What It Checks

- Sitemap URL status
- Redirect/canonical alignment
- Title and meta description length
- Duplicate titles and descriptions
- Canonical tags
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

## Guardrails

- Diagnose by default.
- Do not auto-apply broad edits until an explicit apply mode exists.
- Future apply mode should generate a patch pack, run `pnpm check`, rebuild, restart production preview, rerun `pnpm seo:agent`, and only then mark work complete.
- Prioritize crawler-visible HTML, schema, canonicals, and internal links before publishing more content.
