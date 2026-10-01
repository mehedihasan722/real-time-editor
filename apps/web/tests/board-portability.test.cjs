const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./helpers/load-ts.cjs");
const { parseBoardFile, getBoardBounds, MAX_LAYERS } = load("src/lib/board-portability.ts");
const note = { type: 4, x: 20, y: 40, width: 200, height: 180, fill: { r: 255, g: 229, b: 114, a: 1 }, value: "Launch", rotation: 45 };
const file = layers => JSON.stringify({ version: 1, layers });

test("editable exports round-trip notes, paths and images", () => {
  const layers = [note, { ...note, type: 2, points: [[0, 0, 0.5], [10, 10, 1]], rotation: undefined }, { ...note, type: 7, src: "data:image/png;base64,aGVsbG8=", alt: "Example", rotation: undefined }];
  assert.deepEqual(JSON.parse(JSON.stringify(parseBoardFile(file(layers)))), JSON.parse(JSON.stringify(layers)));
});
test("imports reject active image content, dangerous links, unknown types and invalid coordinates", () => {
  for (const layer of [{ ...note, type: 7, src: "data:image/svg+xml;base64,aGVsbG8=", alt: "Unsafe" }, { ...note, link: "javascript:alert(1)" }, { ...note, type: 99 }, { ...note, x: Infinity }, { ...note, width: -1 }]) assert.throws(() => parseBoardFile(file([layer])));
  assert.throws(() => parseBoardFile(file(Array(MAX_LAYERS + 1).fill(note))));
  assert.throws(() => parseBoardFile(JSON.stringify({ version: 2, layers: [note] })));
});
test("export bounds include rotated layers and negative positions", () => {
  const bounds = getBoardBounds([note, { ...note, x: -500, y: -500 }]);
  assert.ok(bounds.x < -500 && bounds.y < -500);
  assert.ok(bounds.width > 700 && bounds.height > 700);
});
