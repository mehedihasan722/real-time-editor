const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./helpers/load-ts.cjs");
const { getFlowchartLayers } = load("src/lib/flowchart-template.ts");
const { layerSchema } = load("src/lib/board-portability.ts");

test("flowchart includes valid editable nodes, decision branches, return paths, and a paper background", () => {
  const entries = getFlowchartLayers("Release process");
  assert.equal(new Set(entries.map(([id]) => id)).size, entries.length);
  for (const [, layer] of entries) assert.equal(layerSchema.safeParse(layer).success, true);
  const layers = Object.fromEntries(entries);
  assert.equal(layers["flow-paper"].fill.r, 255);
  assert.equal(layers["template-heading"].value, "Release process");
  assert.equal(layers.scope.shape, "diamond");
  assert.equal(layers.approval.shape, "diamond");
  assert.equal(layers["scope-yes"].value, "YES");
  assert.equal(layers["approval-no"].value, "NO");
  assert.equal(layers["revise-workshop"].shape, "arrow");
  assert.equal(layers["feedback-workshop"].shape, "arrow");
  assert.equal(layers["start-workshop"].rotation, 90);
});
