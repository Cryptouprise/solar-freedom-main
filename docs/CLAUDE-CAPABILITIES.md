# External Agent Admin API Boundary

The Admin API can support a scoped external editing agent without granting
Manus access. [CAPABILITIES.md](../CAPABILITIES.md) and
[ADMIN-API.md](ADMIN-API.md) are the endpoint references.

## Allowed with a scoped key

- Read or edit database-backed drafts within the key's permissions.
- Create new posts as drafts.
- Attach editorial-review metadata and primary-source records.
- Request publication only with `posts:publish`; the server still rejects a
  post that fails the evidence-first publication gate.
- Read or edit company research records through admin-only endpoints. Public
  company API output remains withheld until a dedicated evidence gate exists.
- Read or update the small allowlist of public site configuration keys.
- Upload a validated image payload through the documented endpoint.
- Create, list, and revoke hashed, expiring API keys only with key-management
  permission.
- Submit a dry-run automation plan. The planning endpoint does not write files,
  run SQL, deploy, or execute arbitrary prose.

## Not authorized or not implemented

- Manus/GitHub deployment, branch merge, or migration execution.
- Automatic publication of AI-generated legal/YMYL copy.
- Live web research or proof of facts from model memory.
- Arbitrary filesystem, shell, database, browser, CRM, or analytics access.
- Public exposure of leads, credentials, operational measurements, or provider
  error details.
- Automatic press distribution, backlink placement, or arbitrary scheduled
  tool execution.
- A guarantee of indexing, ranking, traffic, leads, representation, or outcome.

## Safe article workflow

1. Read existing approved inventory and choose a non-duplicative question.
2. Record current primary sources with title, HTTPS URL, and access date.
3. Create an unverified draft with `published: false`.
4. Remove unsupported professional-identity, fee, outcome, timing, urgency,
   legal, company, and statistical claims.
5. Have a named human reviewer record role, review date, sources, and the page's
   unique value; keep `editorialFunnelOnlyDuplicate=false` only when true.
6. Request publication using a separate publish-capable credential.
7. Verify the public page, sitemap/AI inventory, schema, canonical, and
   production smoke against the exact release.

Use a unique least-privilege key, store it in a secret manager, set an expiry,
and revoke it after the task. Never paste a live key into documentation, source,
logs, screenshots, public issues, or chat.
