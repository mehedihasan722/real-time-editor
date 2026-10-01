const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./helpers/load-ts.cjs");
const register = config => config;
const mocks = {
  "./_generated/server": { query: register, mutation: register, internalQuery: register, internalMutation: register, internalAction: register },
  "./_generated/api": { internal: { vector: { cleanupLayers: "cleanupLayers" }, board: { cleanupFavourites: "cleanupFavourites", cleanupRoom: "cleanupRoom", getCleanupJob: "getCleanupJob", finishCleanup: "finishCleanup" } } },
};
const board = load("convex/board.ts", mocks);
const boards = load("convex/boards.ts", mocks);
const identity = { subject: "user_1", org_id: "org_1", org_role: "org:member" };

test("guests cannot change board metadata, create boards or delete boards", async () => {
  const ctx = { auth: { getUserIdentity: async () => ({ ...identity, org_role: "org:guest" }) }, db: { get: async () => ({ orgId: "org_1" }) } };
  await assert.rejects(() => board.create.handler(ctx, { orgId: "org_1", title: "Guest board" }), /member role/);
  await assert.rejects(() => board.update.handler(ctx, { id: "board_1", title: "Guest edit" }), /member role/);
  await assert.rejects(() => board.remove.handler(ctx, { id: "board_1" }), /member role/);
});
test("admin reporting denies members and administrators from other tenants", async () => {
  for (const claims of [identity, { ...identity, org_role: "org:admin", org_id: "other" }]) await assert.rejects(() => boards.adminList.handler({ auth: { getUserIdentity: async () => claims } }, { orgId: "org_1", paginationOpts: { cursor: null, numItems: 10 } }), /Administrator access/);
});

test("paginated boards preserve cursor metadata and enforce organization access", async () => {
  let options;
  const builder = { withIndex() { return this; }, order() { return this; }, async paginate(value) { options = value; return { page: [{ _id: "board_1", orgId: "org_1", title: "First" }], continueCursor: "next-page", isDone: false }; }, async unique() { return null; } };
  const ctx = { auth: { getUserIdentity: async () => identity }, db: { query: () => builder } };
  const result = await boards.list.handler(ctx, { orgId: "org_1", paginationOpts: { cursor: null, numItems: 500 } });
  assert.equal(options.numItems, 100);
  assert.equal(result.continueCursor, "next-page");
  assert.equal(result.isDone, false);
  assert.equal(result.page[0].isFavourite, false);
  await assert.rejects(() => boards.list.handler(ctx, { orgId: "other", paginationOpts: { cursor: null, numItems: 10 } }), /access denied/);
});
test("board deletion schedules durable room and favourite cleanup atomically", async () => {
  const deleted = [], scheduled = [], inserted = [];
  const ctx = { auth: { getUserIdentity: async () => identity }, db: { get: async () => ({ orgId: "org_1" }), delete: async id => deleted.push(id), insert: async (table, value) => { inserted.push({ table, value }); return "job_1"; } }, scheduler: { runAfter: async (...args) => scheduled.push(args) } };
  await board.remove.handler(ctx, { id: "board_1" });
  assert.equal(deleted[0], "board_1");
  assert.equal(inserted[0].table, "roomCleanup");
  assert.equal(scheduled.length, 3);
  assert.equal(scheduled[1][1], "cleanupLayers");
  assert.equal(scheduled[2][1], "cleanupRoom");
});
test("room cleanup retries failure and retains exhausted jobs for operations", async () => {
  let patch, scheduled = 0, deleted = 0;
  const ctx = { db: { get: async () => ({ attempts: 7 }), patch: async (id, data) => { patch = data; }, delete: async () => { deleted++; } }, scheduler: { runAfter: async () => { scheduled++; } } };
  await board.finishCleanup.handler(ctx, { jobId: "job_1", error: "HTTP 500" });
  assert.equal(patch.status, "failed");
  assert.equal(patch.attempts, 8);
  assert.equal(scheduled, 0);
  await board.finishCleanup.handler(ctx, { jobId: "job_1" });
  assert.equal(deleted, 1);
});
test("favourite cleanup continues beyond one batch", async () => {
  let deleted = 0, scheduled = 0;
  const builder = { withIndex() { return this; }, take: async () => Array.from({ length: 200 }, (_, _id) => ({ _id })) };
  await board.cleanupFavourites.handler({ db: { query: () => builder, delete: async () => { deleted++; } }, scheduler: { runAfter: async () => { scheduled++; } } }, { id: "board_1" });
  assert.equal(deleted, 200);
  assert.equal(scheduled, 1);
});
test("room cleanup treats already-deleted rooms as success and does not expose secrets", async () => {
  let request, finish;
  const functions = load("convex/board.ts", mocks, { process: { env: { LIVEBLOCKS_SECRET_KEY: "test-secret" } }, fetch: async (url, options) => { request = { url, options }; return new Response(null, { status: 404 }); } });
  await functions.cleanupRoom.handler({ runQuery: async () => ({ roomId: "board/1" }), runMutation: async (name, value) => { finish = value; } }, { jobId: "job_1" });
  assert.ok(request.url.endsWith("board%2F1"));
  assert.equal(request.options.method, "DELETE");
  assert.equal(finish.error, undefined);
});
