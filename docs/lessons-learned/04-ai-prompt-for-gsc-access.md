# Safe AI Access to Search Console

Prefer a rotated, least-privilege service account for read-only Search Analytics
collection. Grant only the target property access needed for the task, store the
JSON in an approved secret manager, and never paste it into source, public
issues, screenshots, documentation, logs, or chat.

Browser access may be used for manual URL Inspection or validation when the
user is present. The user enters credentials; the agent must not record
passwords, recovery data, cookies, or browser storage. Do not reuse a personal
browser profile for unattended automation.

An AI audit should be authorized separately for:

- reading measurements;
- changing code;
- deploying an exact release;
- submitting a sitemap or validation action; and
- changing users, permissions, or credentials.

No access method authorizes arbitrary fixes, automatic publication, or bulk
indexing. Retain only redacted evidence and follow
[../SEO-MEASUREMENT.md](../SEO-MEASUREMENT.md) and
[../PRODUCTION-CUTOVER.md](../PRODUCTION-CUTOVER.md).
