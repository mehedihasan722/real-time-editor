const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./helpers/load-ts.cjs");
const { SpatialIndex } = load("../../packages/utils/src/spatial-index.ts");
const { deterministicJson } = load("../../packages/utils/src/serialization.ts");
const { identityRole, canAdminister, assertEditor } = load("src/lib/roles.ts");
const { consumeAssistStream } = load("src/lib/assist-stream.ts", {}, { TextDecoder });
test("spatial culling preserves negative, rotated and oversized objects", () => {
  const entries = [["negative", { x: -300, y: -100, width: 100, height: 100 }], ["rotated", { x: 400, y: 0, width: 100, height: 300, rotation: 90 }], ["huge", { x: -10000, y: -10000, width: 30000, height: 30000 }], ["far", { x: 50000, y: 50000, width: 50, height: 50 }]];
  const index = new SpatialIndex(entries);
  assert.deepEqual([...index.query({ x: -310, y: -110, width: 120, height: 120 })].sort(), ["huge", "negative"]);
  assert.ok(index.query({ x: 305, y: 90, width: 10, height: 10 }).has("rotated"));
});
test("spatial index agrees with brute-force culling over 10000 objects", () => {
  const entries = Array.from({ length: 10000 }, (_, i) => [String(i), { x: (i % 100) * 120, y: Math.floor(i / 100) * 120, width: 80, height: 80 }]);
  const index = new SpatialIndex(entries), viewport = { x: 400, y: 600, width: 1000, height: 700 };
  const expected = entries.filter(([, l]) => l.x - 16 <= viewport.x + viewport.width && l.x + l.width + 16 >= viewport.x && l.y - 16 <= viewport.y + viewport.height && l.y + l.height + 16 >= viewport.y).map(([id]) => id).sort();
  assert.deepEqual([...index.query(viewport)].sort(), expected);
});
test("exports are deterministic without changing stacking order", () => {
  assert.equal(deterministicJson({ z: 1, layers: [{ b: 2, a: 1 }, { x: 3 }] }), deterministicJson({ layers: [{ a: 1, b: 2 }, { x: 3 }], z: 1 }));
  assert.notEqual(deterministicJson([1, 2]), deterministicJson([2, 1]));
});
test("roles fail closed and support Clerk JWT v1 and v2 claims", () => {
  for (const claims of [{}, { org_role: "org:guest" }, { o: { rol: "unknown" } }]) assert.throws(() => assertEditor(claims), /member role/);
  assert.equal(identityRole({ o: { rol: "adm" } }), "admin");
  assert.equal(canAdminister(identityRole({ org_role: "org:owner" })), true);
  assert.equal(canAdminister(identityRole({ org_role: "org:member" })), false);
});
test("SSE handles arbitrary byte boundaries and multibyte UTF-8", async () => {
  const bytes = new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello 🌍"}}]}\n\ndata: [DONE]\n\n');
  const response = new Response(new ReadableStream({ start(controller) { for (const byte of bytes) controller.enqueue(Uint8Array.of(byte)); controller.close(); } }));
  let text;
  assert.equal(await consumeAssistStream(response, value => { text = value; }), "Hello 🌍");
  assert.equal(text, "Hello 🌍");
});
test("SSE rejects provider errors and honours cancellation", async () => {
  await assert.rejects(() => consumeAssistStream(new Response('data: {"error":"private provider failure"}\n\n'), () => {}), /could not finish/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(() => consumeAssistStream(new Response("data: [DONE]\n\n"), () => {}, controller.signal), { name: "AbortError" });
});
