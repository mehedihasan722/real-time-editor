const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./helpers/load-ts.cjs");
const { parseGeneratedBoard, generatedBoardLayers } = load("src/lib/assist.ts");

test("AI command output becomes editable notes only after validation", () => {
  const board = parseGeneratedBoard('```json\n{"title":"Launch","notes":["Check metrics","Talk to users"]}\n```');
  const layers = generatedBoardLayers(board);
  assert.equal(layers.length, 3);
  assert.equal(layers[1].value, "Check metrics");
  assert.throws(() => parseGeneratedBoard('{"title":"Launch","notes":[]}'));
  assert.throws(() => parseGeneratedBoard('{"title":"Launch","notes":[{"execute":"shell"}]}'));
});

function route({ user = "user_1", org = "org_1", boardOrg = "org_1", fetcher = async () => Response.json({ choices: [{ message: { content: '{"title":"Plan","notes":["First step"]}' } }] }), env = {}, method = "POST" } = {}) {
  const environment = { NODE_ENV: "production", AI_BASE_URL: "https://model.example/v1", AI_MODEL: "test-model", HERMES_BASE_URL: "https://hermes.example/v1", HERMES_API_KEY: "test-key", ...env };
  return load("src/app/api/assist/route.ts", {
    "@/lib/assist-providers": load("src/lib/assist-providers.ts", {}, { process: { env: environment } }),
    "@clerk/nextjs/server": { auth: async () => ({ userId: user, orgId: org, sessionClaims: { aud: "convex" }, getToken: async () => "private-clerk-token" }) },
    "convex/browser": { ConvexHttpClient: class { setAuth() {} async mutation() { return true; } async query() { return { orgId: boardOrg, title: "PRIVATE BOARD TITLE" }; } } },
    "../../../../convex/_generated/api": { api: { board: { get: "get" }, assist: { reserveRequest: "reserveRequest" } } },
    "@/lib/public-env": { publicEnv: { success: true, data: { NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud" } } },
    "@/lib/server-env": { serverEnv: { success: true } },
  }, { fetch: fetcher, process: { env: { NODE_ENV: "production", AI_BASE_URL: "https://model.example/v1", AI_MODEL: "test-model", HERMES_BASE_URL: "https://hermes.example/v1", HERMES_API_KEY: "test-key", ...env } } })[method];
}
const request = (mode = "generate") => new Request("https://flowboard.example/api/assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ boardId: "board_1", mode, messages: [{ role: "user", content: "Make a launch plan" }] }) });

test("custom local chat works without a key when Hermes is not configured", async () => {
  const env = { NODE_ENV: "development", HERMES_BASE_URL: "", HERMES_API_KEY: "", AI_BASE_URL: "http://127.0.0.1:11434/v1" };
  let sent;
  const response = await route({ env, fetcher: async (url, options) => { sent = { url: String(url), ...options }; return Response.json({ choices: [{ message: { content: "Ready" } }] }); } })(request("chat"));
  assert.equal(response.status, 200);
  assert.equal(sent.url, "http://127.0.0.1:11434/v1/chat/completions");
  assert.equal(sent.headers.Authorization, undefined);
  const capabilities = await (await route({ env, method: "GET", fetcher: async () => Response.json({ data: [] }) })()).json();
  assert.equal(capabilities.chat, true);
});

test("AI route cancels oversized upstream JSON before parsing it", async () => {
  for (const declared of [false, true]) {
    let cancelled = false;
    const handler = route({ fetcher: async () => new Response(new ReadableStream({
      pull(controller) { controller.enqueue(new Uint8Array(600_000)); },
      cancel() { cancelled = true; },
    }), { headers: declared ? { "content-length": "2000000" } : {} }) });
    assert.equal((await handler(request())).status, 502);
    assert.equal(cancelled, true);
  }
});

test("AI route blocks signed-out users and cross-organization board access", async () => {
  let calls = 0;
  const fetcher = async () => { calls++; throw new Error("must not run"); };
  assert.equal((await route({ user: null, fetcher })(request())).status, 401);
  assert.equal((await route({ boardOrg: "other_org", fetcher })(request())).status, 403);
  assert.equal(calls, 0);
});
test("AI route sends only submitted messages, not board data or Clerk tokens", async () => {
  let sent;
  const response = await route({ fetcher: async (url, options) => { sent = { url: String(url), ...options }; return Response.json({ choices: [{ message: { content: '{"title":"Plan","notes":["First step"]}' } }] }); } })(request());
  assert.equal(response.status, 200);
  assert.equal(sent.url, "https://model.example/v1/chat/completions");
  assert.ok(!JSON.stringify(sent).includes("PRIVATE BOARD TITLE"));
  assert.ok(!JSON.stringify(sent).includes("private-clerk-token"));
  assert.ok(!JSON.stringify(sent).includes("board_1"));
});
test("AI route reports unconfigured, unsafe and unavailable providers", async () => {
  assert.equal((await route({ env: { AI_BASE_URL: "" } })(request())).status, 503);
  assert.equal((await route({ env: { AI_BASE_URL: "http://127.0.0.1:11434/v1" } })(request())).status, 503);
  assert.equal((await route({ fetcher: async () => Response.json({}, { status: 429 }) })(request())).status, 429);
  assert.equal((await route({ fetcher: async () => Response.json({ choices: [{ message: { content: "broken json" } }] }) })(request())).status, 502);
});
test("Hermes chat uses the dedicated server and returns plain text", async () => {
  let sent;
  const response = await route({ fetcher: async (url, options) => { sent = { url: String(url), ...options }; return Response.json({ choices: [{ message: { content: "Start with a clear goal." } }] }); } })(request("chat"));
  assert.equal(response.status, 200);
  assert.equal(sent.url, "https://hermes.example/v1/chat/completions");
  assert.equal(JSON.parse(sent.body).model, "hermes-agent");
});

test("a temporary provider rejection retries once before streaming starts", async () => {
  let calls = 0;
  const handler = route({ fetcher: async () => ++calls === 1
    ? Response.json({}, { status: 503 })
    : Response.json({ choices: [{ message: { content: "Recovered" } }] }) });
  const response = await handler(request("chat"));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).message, "Recovered");
  assert.equal(calls, 2);
});

test("capacity failures stay bounded and quota failures are not retried", async () => {
  for (const status of [503, 429, 401]) {
    let calls = 0;
    const response = await route({ fetcher: async () => { calls++; return Response.json({ secret: "do not expose" }, { status }); } })(request("chat"));
    assert.equal(calls, status === 503 ? 2 : 1);
    assert.equal(response.status, status === 503 ? 503 : status === 429 ? 429 : 502);
    const message = (await response.json()).error;
    assert.match(message, status === 503 ? /temporarily unavailable/ : status === 429 ? /quota/ : /access/);
    assert.ok(!message.includes("do not expose"));
  }
});

test("Nano Banana preserves quota errors instead of disguising them as a bad response", async () => {
  const response = await route({ env: { GEMINI_API_KEY: "image-secret" }, fetcher: async () => Response.json({}, { status: 429 }) })(request("image"));
  assert.equal(response.status, 429);
  assert.match((await response.json()).error, /quota/);
});

test("Hermes SSE remains streaming and propagates a cancellation signal upstream", async () => {
  let sent;
  const frames = 'data: {"choices":[{"delta":{"content":"Plan"}}]}\n\ndata: [DONE]\n\n';
  const handler = route({ fetcher: async (url, options) => { sent = options; return new Response(frames, { headers: { "content-type": "text/event-stream" } }); } });
  const response = await handler(new Request("https://flowboard.example/api/assist", { method: "POST", body: JSON.stringify({ boardId: "board_1", mode: "chat", stream: true, messages: [{ role: "user", content: "Plan" }] }) }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/event-stream");
  assert.equal(await response.text(), frames);
  assert.equal(JSON.parse(sent.body).stream, true);
  assert.ok(sent.signal instanceof AbortSignal);
});

test("Assist capability discovery requires login and exposes no provider secrets", async () => {
  assert.equal((await route({ user: null, method: "GET" })()).status, 401);
  const response = await route({ method: "GET", env: { HERMES_API_KEY: "private-secret", AI_BASE_URL: "" } })();
  const capabilities = await response.json();
  assert.equal(capabilities.generate, false); assert.equal(capabilities.chat, true);
  assert.equal(capabilities.image, false); assert.equal(capabilities.providers.hermes, true);
  assert.ok(!JSON.stringify(capabilities).includes("private-secret"));
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});

for (const [provider, key, base] of [["gemini", "GEMINI_API_KEY", "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"], ["grok", "XAI_API_KEY", "https://api.x.ai/v1/chat/completions"], ["deepseek", "DEEPSEEK_API_KEY", "https://api.deepseek.com/chat/completions"]]) test(`${provider} uses its own configured credentials`, async () => {
  let sent;
  const handler = route({ env: { [key]: "provider-secret" }, fetcher: async (url, options) => { sent = { url: String(url), ...options }; return Response.json({ choices: [{ message: { content: "Plan" } }] }); } });
  const response = await handler(new Request("https://flowboard.example/api/assist", { method: "POST", body: JSON.stringify({ boardId: "board_1", mode: "chat", provider, messages: [{ role: "user", content: "Plan" }] }) }));
  assert.equal(response.status, 200); assert.equal(sent.url, base); assert.equal(sent.headers.Authorization, "Bearer provider-secret");
  assert.ok(!JSON.stringify(await response.json()).includes("provider-secret"));
  assert.equal(JSON.parse(sent.body).model_options, undefined);
});
test("Nano Banana sends a native image request and returns a bounded image", async () => {
  let sent;
  const handler = route({ env: { GEMINI_API_KEY: "image-secret" }, fetcher: async (url, options) => { sent = { url: String(url), ...options }; return Response.json({ candidates: [{ content: { parts: [{ inlineData: { mimeType: "image/png", data: "aGVsbG8=" } }] } }] }); } });
  const response = await handler(new Request("https://flowboard.example/api/assist", { method: "POST", body: JSON.stringify({ boardId: "board_1", mode: "image", messages: [{ role: "user", content: "Draw a rocket" }] }) }));
  assert.equal(response.status, 200); assert.match(sent.url, /gemini-2.5-flash-image:generateContent$/); assert.equal(sent.headers["x-goog-api-key"], "image-secret");
  assert.equal((await response.json()).image, "data:image/png;base64,aGVsbG8=");
});

test("Assist forwards validated file contents, not local paths or credentials", async () => {
  let sent;
  const handler = route({ fetcher: async (url, options) => { sent = JSON.parse(options.body); return Response.json({ choices: [{ message: { content: "Summary" } }] }); } });
  const response = await handler(new Request("https://flowboard.example/api/assist", { method: "POST", body: JSON.stringify({ boardId: "board_1", mode: "chat", attachments: [{ kind: "text", name: "project/plan.md", content: "Launch checklist" }], messages: [{ role: "user", content: "Summarize the attached files" }] }) }));
  assert.equal(response.status, 200); assert.match(sent.messages.at(-1).content, /Launch checklist/);
  assert.ok(!JSON.stringify(sent).includes("private-clerk-token"));
});
test("malformed images fail validation before calling the provider", async () => {
  let called = false;
  const handler = route({ fetcher: async () => { called = true; throw new Error(); } });
  const response = await handler(new Request("https://flowboard.example/api/assist", { method: "POST", body: JSON.stringify({ boardId: "board_1", mode: "chat", attachments: [{ kind: "image", name: "fake.png", content: "data:image/png;base64,PGh0bWw+" }], messages: [{ role: "user", content: "Analyze this" }] }) }));
  assert.equal(response.status, 400); assert.equal(called, false);
});
