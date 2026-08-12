# Project TODO

- [x] Capture verified Search Console performance, index coverage, sitemap, and GA4 configuration evidence.
- [x] Verify the disabled SEO heartbeat and the silent Revenue Intel cron skip.
- [x] Allow the scheduled handler to execute every registered agent, including Revenue Intel, and fail invalid jobs visibly.
- [x] Add an accountable agent-health endpoint that identifies missing schedules, stale runs, and unusable SEO measurement snapshots.
- [x] Replace the dashboard’s simulated full-cycle progress with real mutation outcomes and error reporting.
- [x] Add unit tests covering cron slug validation, health-state derivation, and dashboard-run safeguards.
- [x] Audit sitemap/canonical/robots generation and isolate legacy or error-producing sitemap signals.
- [x] Reduce indexable URL exposure to priority lead-generating content without suppressing valuable city or core service pages.
- [ ] Validate build, tests, production smoke checks, and rendered recovery dashboard behavior.
- [ ] Save a production checkpoint and confirm the published release.
- [x] Compare the incoming autonomous-revenue checkpoint against the local recovery edits and preserve both intents.
- [x] Merge the overlapping agent, dashboard, sitemap, and measurement changes without dropping either workflow.
- [x] Re-run the combined validation suite and production checks after integration.
- [x] Restore the missing project-owner worker schedules and verify their registered jobs and execution readiness.
- [x] Make the admin scheduler view read the project-owner agent registry so restored jobs do not display as false missing states.
- [x] Render newly restored schedules as an ‘awaiting first run’ state instead of a red error while preserving real failure visibility.
- [x] Expand crawler-visible content on the focused city-page template so priority city URLs provide meaningful source-visible local context.
- [ ] Resolve the remaining live smoke failures by preventing admin canonical leakage and filtering redirected dynamic blog URLs from the sitemap response.
