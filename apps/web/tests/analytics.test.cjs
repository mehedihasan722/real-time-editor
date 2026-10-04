const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./helpers/load-ts.cjs");
test("PostHog stays off without consent and never sends account or board information", () => {
  let consent = "no"; const calls = []; const session = new Map();
  const analytics = load("src/lib/analytics.ts", {}, { process: { env: { NEXT_PUBLIC_POSTHOG_KEY: "public-key" } }, localStorage: { getItem: () => consent }, sessionStorage: { getItem: key => session.get(key), setItem: (key, value) => session.set(key, value) }, crypto: { randomUUID: () => "anonymous-session" }, navigator: { doNotTrack: "0" }, fetch: async (url, options) => { calls.push({ url, data: JSON.parse(options.body) }); } });
  analytics.captureWorkspaceEvent("workspace_viewed", "board"); assert.equal(calls.length, 0);
  consent = "yes"; analytics.captureWorkspaceEvent("workspace_viewed", "board");
  assert.equal(calls.length, 1); assert.equal(calls[0].data.properties.distinct_id, "anonymous-session");
  assert.equal(calls[0].data.properties.$process_person_profile, false); assert.equal(calls[0].data.properties.$geoip_disable, true);
  assert.deepEqual(Object.keys(calls[0].data.properties).sort(), ["$geoip_disable", "$process_person_profile", "action", "distinct_id"]);
});
test("PostHog respects Do Not Track and blocked storage", () => {
  let calls = 0;
  for (const localStorage of [{ getItem: () => "yes" }, { getItem() { throw new Error("blocked"); } }]) {
    const analytics = load("src/lib/analytics.ts", {}, { process: { env: { NEXT_PUBLIC_POSTHOG_KEY: "key" } }, localStorage, navigator: { doNotTrack: "1" }, fetch: async () => { calls++; } });
    assert.doesNotThrow(() => analytics.captureWorkspaceEvent("workspace_viewed"));
  }
  assert.equal(calls, 0);
});
