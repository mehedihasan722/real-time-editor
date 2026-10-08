# Hermes Agent and AI board generation

Gemini setup: add `GEMINI_API_KEY` as a server-only Vercel Secret for Production and Preview, then redeploy. The same key enables Gemini chat, board generation and Nano Banana image requests, subject to model access and quota. Never use a `NEXT_PUBLIC_` prefix. Rotate any key shared in screenshots or chat. Local loopback endpoints cannot serve a Vercel deployment. Custom models also support chat without an API key where the configured service permits it; automatic chat selection falls back to a configured custom model when Hermes and hosted providers are absent.

Assist has three modes: AI board generation, Hermes chat, and starter templates. AI board generation returns a title and up to 40 notes. Users review the result and explicitly add it to the board. Starter templates work without an AI service.

## Hermes chat

The default Gemini chat model is `gemini-3.1-flash-lite`, verified with a complete streamed multi-turn response on October 8, 2026. `GEMINI_MODEL` overrides it. The previous 3.8 Flash default timed out in streaming checks. Model discovery alone does not prove generation access. Assist retries temporary 502/503/504 failures once before streaming starts; quota and credential errors are not retried. Image generation still requires its own available quota.

The provider selector lists configured services. Setup instructions stay in this documentation; unavailable chat shows a compact availability check. Mobile chat hides the conversation sidebar and provides a New chat button. The board starter scrolls within the available viewport, below the mobile header and file controls.

Run a dedicated Hermes Agent API server and configure its model provider. Enable the API server and set a strong `API_SERVER_KEY` in the Hermes environment. Start `hermes gateway`. Hermes exposes an OpenAI-compatible `/v1/chat/completions` endpoint.

In Vercel's server environment set:

```env
HERMES_BASE_URL=https://your-hermes-host/v1
HERMES_API_KEY=your-hermes-api-server-key
```

For local development, loopback HTTP is supported. Vercel cannot contact your laptop's localhost. The production endpoint must be an authenticated HTTPS service reachable from Vercel.

Use a dedicated isolated Hermes installation/profile for this app. With `hermes tools`, disable terminal, file, browser, memory, session-search, delegation, and external-action tools on the API-server platform unless you deliberately intend to expose them to every signed-in workspace user. Do not connect a personal unrestricted Hermes installation to a multi-user app. The app's system prompt requests plain chat; actual tool permissions are controlled by Hermes configuration, not by that prompt. Configure provider concurrency limits on the Hermes server.

Reference: [official Hermes API server documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server) and [tool configuration](https://hermes-agent.nousresearch.com/docs/user-guide/features/tools/).

## Free model option for commands

Self-hosted Ollama can provide inference without a per-message provider charge. It still needs enough hardware, electricity, and hosting capacity. No free hosted provider is promised to have unlimited usage.

For local development:

```sh
ollama pull qwen3.5:2b
ollama serve
```

```env
AI_BASE_URL=http://127.0.0.1:11434/v1
AI_MODEL=qwen3.5:2b
AI_API_KEY=
AI_REASONING_EFFORT=none
```

For production, host the model separately behind HTTPS and authentication and set `AI_BASE_URL`, `AI_MODEL`, and `AI_API_KEY` in Vercel. Alternatively use another OpenAI-compatible provider with its own quotas and pricing. Hermes also needs its own configured inference provider.

Reference: [Ollama OpenAI compatibility](https://docs.ollama.com/api/openai-compatibility).

## Request and output boundaries

Requests require a signed-in user, an active organization, and access to the requested board. Only submitted conversation messages and a fixed system instruction go to the configured AI endpoint. Existing board contents, board IDs, and Clerk tokens are not sent. Provider keys remain server-only.

Each request accepts at most 20 messages, each at most 4,000 characters. The current composer supports 280-character prompts. Responses time out after 50 seconds, provider throttling is reported clearly, and invalid generated board JSON is rejected. Chat context keeps the latest turns for the current panel session; it is not saved as a shared board conversation. These request bounds are independent of daily provider message quotas.

Without a configured service, Assist explains what is missing and offers starter templates. It does not pretend template output is AI inference.

## Automatic local setup

Run `npm run ai:setup` with Docker Desktop running. It creates a dedicated Hermes configuration with tools disabled, starts pinned Hermes and Ollama images, downloads Qwen 3.5 2B, verifies a real Hermes response, and then fills unset local AI environment variables. Generated API keys and runtime data stay in the ignored `.local-tools` directory. Existing configured endpoints are preserved. Restart `npm run dev` after setup.

The stack binds ports only to your laptop. It does not make a production endpoint available to Vercel. For production, run it on a server you control behind an authenticated HTTPS proxy and configure Vercel with that URL.

The dedicated Hermes model is configured for a 65,536-token context, meeting its 64K minimum. Qwen 3.5 2B supports that context. Model thinking is disabled for concise interactive responses; other providers can leave `AI_REASONING_EFFORT` unset. The app caps responses at 1,024 tokens to fit its request deadline.
