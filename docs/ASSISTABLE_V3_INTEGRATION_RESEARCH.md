# Assistable AI v3 Integration Research

## Verified integration facts

Assistable’s supported public API is version 3 at `https://api.assistable.ai/v3`. It uses a scoped bearer key (`ask_live_…`) and, for a multi-subaccount key, the `X-Subaccount-Id` header. Responses use the envelope `{ data, error, request_id }`.[1]

The official TypeScript SDK is `@assistableai/sdk`. It supports `configure({ apiKey, subaccountId })` and exposes typed operations such as `listAssistants` and `createContact`.[2]

The official capability inventory includes contacts, contact notes/interactions, messages, conversations, calls, assistants, tools, flows, appointments, alerts, monitor rules, and knowledge bases. The documented required scopes include `contacts:list/create/read/update`, `messages:list/create`, `calls:list/create/read`, `conversations:list/read/update`, `chat:create`, `tools:create/update`, and relevant assistant scopes.[3]

## Safe architecture for Solar Freedom

The first activation must be **read-only and dry-run only**. The app will test `assistants:list` with the provided key/subaccount before enabling any workflow. Contact creation may be tested using owner-authorized test contacts, but no email, SMS, call, voicemail change, campaign enrollment, or external outreach can run until the owner explicitly activates the relevant control.

Assistable unifies phone, email, and website visitors into a single contact record and provides deduplicated CSV/contact management. Its outbound calling system obeys a contact-level DND flag. The Solar Freedom adapter should use this as a secondary safety control in addition to its own local contact-hour guard.[4]

The Money Maker research agent needs evidence-backed web search, not LLM recollection. Assistable documents a web-search custom tool pattern that uses a search backend (for example Bing) and returns results to the assistant. The configured research assistant must return source URLs and concise evidence for every attorney prospect before the app saves that prospect. The current app intentionally blocks attorney research until this is configured, instead of creating invented firms.[5]

Assistable supports pre-call and post-call webhooks that can carry a contact ID, call summary, outcome, transcript, recording URL, timestamps, and other metadata. These should update the local execution audit only after we have the provider signature/authentication requirements and test payloads.[6]

## Activation inputs required tomorrow

| Value | Purpose | Required scope / rule |
|---|---|---|
| `ASSISTABLE_API_KEY` | Authenticates the v3 adapter | Read scopes first; add write/send scopes only after explicit approval |
| `ASSISTABLE_SUBACCOUNT_ID` | Selects Solar Freedom’s target workspace/location | Required for multi-subaccount API keys |
| Research assistant ID | Runs evidence-backed attorney research | Must have approved web-search tool and no outbound permissions |
| Calling/SMS assistant IDs | Future voice/SMS execution | Keep disabled until local contact-hour and owner activation gates pass |
| Webhook signing details | Verify inbound call/conversation events | Do not enable webhook writes without verifying official signature contract |

## References

[1]: https://docs.assistable.ai/v3/introduction
[2]: https://docs.assistable.ai/v3/typescript-sdk
[3]: https://docs.assistable.ai/llms.txt
[4]: https://www.assistable.ai/platform/contacts
[5]: https://docs.assistable.ai/build/custom-tools/search-web
[6]: https://docs.assistable.ai/deploy/webhooks/pre-post-call
