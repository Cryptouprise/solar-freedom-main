# OpenRouter Qwen3.7 Routing Audit

**Reviewed:** August 25, 2026

## Verified Model Route

The model identifier already accepted by the agent gateway is:

```text
qwen/qwen3.7-flash
```

The agent gateway sends OpenRouter-compatible chat-completions requests to:

```text
https://openrouter.ai/api/v1/chat/completions
```

with `Authorization: Bearer <OPENROUTER_API_KEY>`, `HTTP-Referer: https://breakyoursolarcontract.com`, and the model identifier in the request body.

## Public Model Page Evidence

OpenRouter’s public Qwen3.7 Flash listing identifies the model as `qwen/qwen3.7-flash` and lists observed token pricing of **$0.03 per million input tokens** and **$0.13 per million output tokens** at review time. The public listing must be rechecked before treating any temporary promotion as active.

The supplied user observation referred to a **75% promotion**. The public search result did not establish that this promotion applied to the Qwen3.7 Flash route specifically, so the implementation must distinguish a verified live discount from a user-entered promotional baseline and alert when live pricing changes.

## Sources

1. [OpenRouter: Qwen3.7 Flash model page](https://openrouter.ai/qwen/qwen3.7-flash)
2. [OpenRouter: Qwen3.7 Plus model page](https://openrouter.ai/qwen/qwen3.7-plus)
3. [OpenRouter: Models catalog](https://openrouter.ai/models)
