# Security policy

## Supported version

Security fixes are made on the current `main` branch. Older deployments and
historical commits are not supported release artifacts.

## Report a vulnerability privately

Use this repository's **Security** tab and select **Report a vulnerability** so
the report is handled through a private GitHub security advisory. Do not put a
credential, personal record, private URL, session cookie, database excerpt, or
proof-of-concept containing user data in a public issue, pull request, build
log, screenshot, or chat.

Include the affected route or component, impact, minimum reproduction steps,
and a redacted example. Use synthetic records whenever possible. The project
owner will coordinate triage, remediation, credential rotation, disclosure,
and any required user or regulatory notification through private channels.

## Repository and credential incidents

Removing a sensitive file from the current branch does not remove it from Git
history, forks, caches, deployment artifacts, or third-party logs. Treat every
published credential as compromised: revoke or rotate it at the provider,
deploy a clean release, verify public assets, and then evaluate a coordinated
history rewrite. Never restore a revoked value during rollback.

Keep incident records free of secret values and unnecessary personal data.
Record only credential names, provider-side rotation identifiers, timestamps,
affected release identifiers, and redacted evidence.
