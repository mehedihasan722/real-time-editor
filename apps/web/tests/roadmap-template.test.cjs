const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./helpers/load-ts.cjs");
const { getRoadmapLayers } = load("src/lib/roadmap-template.ts");
const { boardFileSchema, parseBoardFile } = load("src/lib/board-portability.ts");

test("roadmap milestones and status metadata survive editable export and import", () => {
  const entries = getRoadmapLayers("Launch roadmap", "Owner");
  const layers = entries.map(([, layer]) => layer);
  const file = boardFileSchema.parse({ version: 1, layers });
  const restored = parseBoardFile(JSON.stringify(file));
  const cards = restored.filter(layer => layer.roadmap);
  assert.equal(cards.length, 5);
  assert.equal(cards[0].author, "Owner");
  assert.equal(cards[0].status, "planned");
  assert.ok(cards.every(card => card.description && card.tags));
  assert.equal(restored.filter(layer => layer.shape === "arrow").length, 4);
  assert.equal(new Set(entries.map(([id]) => id)).size, entries.length);
});
