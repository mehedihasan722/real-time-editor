const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./helpers/load-ts.cjs");
const env = { SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "private-storage", SUPABASE_BACKUP_BUCKET: "private-backups", UPSTASH_REDIS_REST_URL: "https://example.upstash.io", UPSTASH_REDIS_REST_TOKEN: "private-redis", PINECONE_API_KEY: "private-pinecone", PINECONE_INDEX_HOST: "https://example.svc.pinecone.io", RESEND_API_KEY: "private-resend", RESEND_FROM_EMAIL: "Flowboard <boards@example.com>", APP_URL: "https://flowboard.example" };
const services = (fetcher, overrides = {}) => load("src/lib/workspace-services.ts", {}, { fetch: fetcher, process: { env: { ...env, ...overrides } } });

test("service status reports configuration booleans without credential values", () => {
  const status = services().integrationStatus();
  assert.equal(status.supabase, true); assert.equal(status.upstash, true);
  assert.ok(!JSON.stringify(status).includes("private-"));
});
test("Supabase snapshots use server-controlled tenant paths and delete exact objects", async () => {
  const calls = [];
  const client = services(async (url, options) => { if (url.includes("/bucket/")) return Response.json({ public: false }); calls.push({ url, options }); return Response.json({ version: 1, layers: [] }); });
  await client.boardBackup("backup", "org_a", "board_1", { version: 1, layers: [] });
  assert.match(calls[0].url, /private-backups\/org_a\/board_1\.json$/);
  assert.equal(calls[0].options.headers["x-upsert"], "true");
  const snapshot = await client.boardBackup("restore", "org_a", "board_1");
  assert.equal(snapshot.version, 1); assert.match(calls[1].url, /object\/authenticated\//);
  await client.boardBackup("delete-backup", "org_a", "board_1");
  assert.deepEqual(JSON.parse(calls[2].options.body), { prefixes: ["org_a/board_1.json"] });
  await assert.rejects(services(async () => Response.json({ public: true })).boardBackup("backup", "org_a", "board_1", {}));
});
test("Upstash reservations atomically increment and expire a tenant/user key", async () => {
  let command;
  const client = services(async (url, options) => { command = JSON.parse(options.body); return Response.json({ result: 13 }); });
  assert.equal(await client.reserveServiceRequest("org_a", "user_1"), false);
  assert.equal(command[0], "EVAL"); assert.match(command[1], /EXPIRE/); assert.equal(command[3], "flowboard:services:org_a:user_1");
  await assert.rejects(services(async () => Response.json({ error: "failed" })).reserveServiceRequest("org_a", "user_1"));
});
test("Pinecone uses the organization namespace and only indexes the title", async () => {
  let sent;
  const client = services(async (url, options) => { sent = { url, options }; return Response.json({ result: { hits: [{ _id: "board_1" }, { _id: "../../other" }] } }); });
  await client.pineconeBoard("index", "org_a", { boardId: "board_1", title: "Launch" });
  assert.match(sent.url, /namespaces\/org_a\/upsert$/);
  assert.deepEqual(JSON.parse(sent.options.body), { _id: "board_1", chunk_text: "Launch" });
  assert.deepEqual(Array.from(await client.pineconeBoard("search", "org_a", { query: "Launch plan" })), ["board_1"]);
});
test("configured Cloudflare verification checks action and hostname", async () => {
  const configured = { TURNSTILE_SECRET_KEY: "private-turnstile", NEXT_PUBLIC_TURNSTILE_SITE_KEY: "public-site" };
  assert.equal(await services(async () => Response.json({ success: true, action: "workspace-services", hostname: "other.example" }), configured).verifyTurnstile("token"), false);
  assert.equal(await services(async () => Response.json({ success: true, action: "workspace-services", hostname: "flowboard.example" }), configured).verifyTurnstile("token"), true);
  assert.equal(await services(undefined, configured).verifyTurnstile(undefined), false);
});
test("service hosts reject credentials, HTTP and unrelated hosts before forwarding secrets", async () => {
  let calls = 0;
  for (const url of ["http://example.supabase.co", "https://example.supabase.co.evil.com", "https://name:password@example.supabase.co"]) {
    await assert.rejects(services(async () => { calls++; }, { SUPABASE_URL: url }).boardBackup("backup", "org_a", "board_1", {}));
  }
  assert.equal(calls, 0);
});

function route({ user = "user_1", org = "org_a", role = "org:member", boardOrg = "org_a", quota = true, verified = true, hits = ["board_1", "deleted", "foreign"], enabled = true } = {}) {
  const calls = [];
  const handler = load("src/app/api/integrations/route.ts", {
    "@clerk/nextjs/server": { auth: async () => ({ userId: user, orgId: org, orgRole: role, sessionClaims: { aud: "convex" }, getToken: async () => "private-token" }), currentUser: async () => ({ primaryEmailAddress: { emailAddress: "owner@example.com", verification: { status: verified ? "verified" : "unverified" } } }) },
    "convex/browser": { ConvexHttpClient: class { setAuth() {} async query(_, { id }) { return id === "deleted" ? null : { _id: id, orgId: id === "foreign" ? "org_other" : boardOrg, title: "Current title" }; } } },
    "../../../../convex/_generated/api": { api: { board: { get: "get" } } },
    "@/lib/public-env": { publicEnv: { success: true, data: { NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud" } } },
    "@/lib/monitoring": { reportFailure() {} },
    "@/lib/workspace-services": { integrationStatus: () => ({ supabase: enabled, resend: enabled, pinecone: enabled, upstash: enabled }), reserveServiceRequest: async () => quota, verifyTurnstile: async () => true, boardBackup: async (...args) => { calls.push(args); return { version: 1, layers: [] }; }, emailBoardLink: async (...args) => { calls.push(args); }, pineconeBoard: async () => hits },
  });
  return { ...handler, calls };
}
const request = (action, values = {}) => new Request("https://flowboard.example/api/integrations", { method: "POST", body: JSON.stringify({ action, boardId: "board_1", ...values }) });
test("cloud routes deny signed-out, guest and cross-tenant writes before touching services", async () => {
  for (const config of [{ user: null }, { role: "org:guest" }, { boardOrg: "org_other" }]) {
    const handler = route(config); const response = await handler.POST(request("backup", { snapshot: { version: 1, layers: [] } }));
    assert.ok([401, 403].includes(response.status)); assert.equal(handler.calls.length, 0);
  }
});
test("search reauthorizes every hit and hides deleted or foreign boards", async () => {
  const response = await route().POST(request("search", { query: "launch plans" }));
  assert.equal(response.status, 200); assert.deepEqual((await response.json()).boards, [{ id: "board_1", title: "Current title" }]);
});
test("Resend only receives the signed-in user's verified primary email", async () => {
  const handler = route(); const response = await handler.POST(request("email", { email: "attacker@example.com" }));
  assert.equal(response.status, 200); assert.equal(handler.calls[0][0], "owner@example.com");
  assert.equal((await route({ verified: false }).POST(request("email"))).status, 400);
  assert.equal((await route({ quota: false }).POST(request("email"))).status, 429);
  assert.equal((await route({ enabled: false }).POST(request("email"))).status, 503);
});
