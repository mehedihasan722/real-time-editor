const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./helpers/load-ts.cjs");
const geometry = load("src/engine/geometry.ts");
const { renderScene } = load("src/engine/renderer.ts");
const layer = { type: "rectangle", x: 10, y: 20, width: 100, height: 80, fill: "rgba(99,102,241,1)", stroke: "rgba(0,0,0,1)", strokeWidth: 2, text: "", points: [], order: 1, version: 1 };
const organization = { subject: "user_1", org_id: "org_1", org_role: "org:member" };
const custom = (builder, context) => config => ({ ...config, handler: async (ctx, args) => config.handler({ ...ctx, ...await context(ctx) }, args) });
const vector = load("convex/vector.ts", {
  "./_generated/server": { query: x => x, mutation: x => x, internalMutation: x => x },
  "./_generated/api": { internal: { vector: { cleanupLayers: "cleanupLayers" } } },
  "convex-helpers/server/customFunctions": { customCtx: x => x, customQuery: custom, customMutation: custom },
});
function context(identity = organization, document = null) {
  const writes = [], query = { withIndex() { return this; }, unique: async () => document, take: async () => document ? [document] : [], paginate: async options => ({ page: [], isDone: true, continueCursor: "", options }) };
  return { writes, auth: { getUserIdentity: async () => identity }, db: { get: async () => ({ orgId: "org_1", canvasLayerCount: document && !document.deleted ? 1 : 0, canvasRecordCount: document ? 1 : 0 }), query: () => query, insert: async (table, value) => writes.push({ table, value }), replace: async (id, value) => writes.push({ id, value }), patch: async (id, value) => writes.push({ id, value }) } };
}

test("zoom preserves cursor world coordinates and clamps both limits", () => {
  const camera = { panX: -300, panY: 120, zoom: 2 }, pivot = { x: 815, y: 290 };
  const before = geometry.screenToCanvas(pivot, camera), after = geometry.zoomAt(camera, pivot, -130);
  const actual = geometry.screenToCanvas(pivot, after);
  assert.ok(Math.abs(actual.x - before.x) < 1e-10 && Math.abs(actual.y - before.y) < 1e-10);
  assert.equal(geometry.zoomAt({ ...camera, zoom: 8 }, pivot, -200).zoom, 8);
  assert.equal(geometry.zoomAt({ ...camera, zoom: 0.1 }, pivot, 200).zoom, 0.1);
});
test("freehand simplification handles dense lines, closed rectangles and point strokes", () => {
  const points = Array.from({ length: 1000 }, (_, x) => ({ x, y: 100 + Math.sin(x) * 0.1 }));
  assert.equal(geometry.simplifyStroke(points, 1).length, 2);
  const rectangle = [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }, { x: 100, y: 100 }, { x: 50, y: 100 }, { x: 0, y: 100 }, { x: 0, y: 50 }, { x: 0, y: 0 }];
  assert.equal(geometry.processSketch(rectangle, 1, true).type, "rectangle");
  assert.equal(geometry.processSketch(rectangle, 1, false).type, "path");
  assert.equal(geometry.simplifyStroke([{ x: 1, y: 1 }], 1).length, 1);
});
test("ellipse and path hit testing reject empty bounding-box corners", () => {
  assert.equal(geometry.hitLayer({ ...layer, type: "ellipse" }, { x: 10, y: 20 }, 8), false);
  const path = { ...layer, type: "path", points: [{ x: 0, y: 0 }, { x: 100, y: 80 }] };
  assert.equal(geometry.hitLayer(path, { x: 60, y: 60 }, 1), true);
  assert.equal(geometry.hitLayer(path, { x: 10, y: 100 }, 1), false);
});
test("renderer culls 5000 far-away shapes before invoking drawing operations", () => {
  let drawn = 0;
  const ctx = new Proxy({}, { get: (_, key) => key === "roundRect" ? () => drawn++ : () => {}, set: () => true });
  const layers = Array.from({ length: 5000 }, (_, i) => [String(i), { ...layer, x: i * 1000 }]);
  renderScene(ctx, layers, { panX: 0, panY: 0, zoom: 1 }, 800, 600, 1, false, []);
  assert.equal(drawn, 1);
});
test("layer queries reject missing organization, foreign tenants and missing identities", async () => {
  for (const identity of [null, { subject: "user_1" }, { ...organization, org_id: "org_2" }]) await assert.rejects(() => vector.getBoardLayers.handler(context(identity), { boardId: "board_1", paginationOpts: { cursor: null, numItems: 5000 } }), /organization|denied/);
  const result = await vector.getBoardLayers.handler(context(), { boardId: "board_1", paginationOpts: { cursor: null, numItems: 5000 } });
  assert.equal(result.options.numItems, 50);
});
test("version conflicts and guest writes fail without touching documents", async () => {
  for (const ctx of [context({ ...organization, org_role: "org:guest" }), context(organization, { ...layer, version: 3, _id: "persisted_1", deleted: false })]) {
    const { version, ...value } = layer;
    await assert.rejects(() => vector.commitLayers.handler(ctx, { boardId: "board_1", changes: [{ layerId: "layer_1", expectedVersion: version, layer: value }] }), /member role|another session/);
    assert.equal(ctx.writes.length, 0);
  }
});
test("new layers and deletion tombstones advance versions and maintain counters", async () => {
  const ctx = context(), { version, ...value } = layer;
  const result = await vector.commitLayers.handler(ctx, { boardId: "board_1", changes: [{ layerId: "layer_1", expectedVersion: 0, layer: value }] });
  assert.equal(result[0].version, 1); assert.equal(ctx.writes[0].value.deleted, false); assert.equal(ctx.writes[1].value.canvasLayerCount, 1);
  const deletion = context(organization, { ...layer, _id: "persisted_1", deleted: false });
  await vector.commitLayers.handler(deletion, { boardId: "board_1", changes: [{ layerId: "layer_1", expectedVersion: 1, layer: null }] });
  assert.equal(deletion.writes[0].value.version, 2); assert.equal(deletion.writes[0].value.deleted, true); assert.equal(deletion.writes[1].value.canvasLayerCount, 0); assert.equal(deletion.writes[1].value.canvasRecordCount, 1);
});
test("geometry trust boundary rejects NaN, oversized paths and invalid colors", () => {
  const { version, ...value } = layer;
  for (const patch of [{ x: NaN }, { width: -1 }, { fill: "rgba(999,0,0,1)" }, { fill: "red" }, { type: "path", points: Array.from({ length: 2049 }, () => ({ x: 0, y: 0 })) }, { type: "path", points: [{ x: -1, y: 0 }, { x: 1, y: 0 }] }]) assert.throws(() => vector.validateVector({ ...value, ...patch }));
  assert.doesNotThrow(() => vector.validateVector(value));
});

test("position-only commits retain dense content without retransmitting it", async () => {
  const document = { ...layer, _id: "persisted_1", deleted: false, text: "Preserved content" };
  const ctx = context(organization, document);
  await vector.commitLayers.handler(ctx, { boardId: "board_1", changes: [{ layerId: "layer_1", expectedVersion: 1, position: { x: -100, y: 200 } }] });
  assert.equal(ctx.writes[0].value.x, -100); assert.equal(ctx.writes[0].value.y, 200);
  assert.equal(ctx.writes[0].value.text, document.text); assert.equal(ctx.writes[0].value.version, 2);
  await assert.rejects(() => vector.commitLayers.handler(context(organization, { ...document, deleted: true }), { boardId: "board_1", changes: [{ layerId: "layer_1", expectedVersion: 1, position: { x: 0, y: 0 } }] }), /missing layer/);
});
