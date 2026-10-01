const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./helpers/load-ts.cjs");
const { reserveRequest } = load("convex/assist.ts", { "./_generated/server": { mutation: value => value } }, { Date: { now: () => 120000 } });
const identity = { subject: "user_1", org_id: "org_1", org_role: "org:member" };
test("AI reservations enforce the user/tenant limit and reset an expired window", async () => {
  let quota = { _id: "quota_1", window: 2, count: 11 }, patch;
  const query = { withIndex() { return this; }, unique: async () => quota };
  const ctx = { auth: { getUserIdentity: async () => identity }, db: { get: async () => ({ orgId: "org_1" }), query: () => query, patch: async (id, value) => { patch = value; } } };
  assert.equal(await reserveRequest.handler(ctx, { boardId: "board_1" }), true); assert.equal(patch.count, 12);
  quota.count = 12; assert.equal(await reserveRequest.handler(ctx, { boardId: "board_1" }), false);
  quota.window = 1; assert.equal(await reserveRequest.handler(ctx, { boardId: "board_1" }), true); assert.equal(patch.count, 1); assert.equal(patch.window, 2);
});
test("guests and other organizations cannot reserve AI work", async () => {
  const db = { get: async () => ({ orgId: "org_1" }) };
  await assert.rejects(() => reserveRequest.handler({ db, auth: { getUserIdentity: async () => ({ ...identity, org_role: "org:guest" }) } }, { boardId: "board_1" }), /member role/);
  await assert.rejects(() => reserveRequest.handler({ db, auth: { getUserIdentity: async () => ({ ...identity, org_id: "org_2" }) } }, { boardId: "board_1" }), /Board access denied/);
});
