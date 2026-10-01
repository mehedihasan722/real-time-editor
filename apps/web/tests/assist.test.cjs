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
  return load("src/app/api/assist/route.ts", {
    "@clerk/nextjs/server": { auth: async () => ({ userId: user, orgId: org, sessionClaims: { aud: "convex" }, getToken: async () => "private-clerk-token" }) },
    "convex/browser": { ConvexHttpClient: class { setAuth() {} async query() { return { orgId: boardOrg, title: "PRIVATE BOARD TITLE" }; } } },
    "../../../../convex/_generated/api": { api: { board: { get: "get" } } },
    "@/lib/public-env": { publicEnv: { success: true, data: { NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud" } } },
    "@/lib/server-env": { serverEnv: { success: true } },
  }, { fetch: fetcher, process: { env: { NODE_ENV: "production", AI_BASE_URL: "https://model.example/v1", AI_MODEL: "test-model", HERMES_BASE_URL: "https://hermes.example/v1", HERMES_API_KEY: "test-key", ...env } } })[method];
}
const request = (mode = "generate") => new Request("https://flowboard.example/api/assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ boardId: "board_1", mode, messages: [{ role: "user", content: "Make a launch plan" }] }) });

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

test("Assist capability discovery requires login and exposes no provider secrets", async () => {
  assert.equal((await route({ user: null, method: "GET" })()).status, 401);
  const response = await route({ method: "GET", env: { HERMES_API_KEY: "private-secret", AI_BASE_URL: "" } })();
  assert.deepEqual(await response.json(), { generate: false, chat: true });
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});
