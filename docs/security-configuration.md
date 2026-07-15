# Server secret configuration

Integration credentials and webhook endpoints must be supplied through the deployment platform's encrypted server environment. They must not be stored in `siteConfig`, `pressReleaseSettings`, browser code, API payload examples, or source-controlled `.env` files.

Required variables are documented in `.env.example`. After setting or rotating a value, restart/redeploy the server and exercise the relevant integration using a non-production test record.

The CRM webhook value that previously appeared in source history must be rotated at the provider before `GHL_WEBHOOK_URL` is enabled. Removing it from the current tree does not remove it from Git history.

The admin configuration API only accepts public runtime display fields. Press-release settings accept operational toggles and non-secret URLs only. Credential state should be managed in the hosting provider, not the application database.

`TRUST_PROXY` may contain a comma-separated allowlist of verified reverse-proxy IP addresses or CIDR ranges. Leave it empty when the application is directly reachable. Never set a blanket trust value merely to make forwarded client-IP headers work; public rate limits use Express's trusted-proxy result and production ingress should enforce a second limit.
