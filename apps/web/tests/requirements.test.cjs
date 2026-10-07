const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./helpers/load-ts.cjs");
const { boardFileSchema, parseBoardFile } = load("src/lib/board-portability.ts");
const { getTemplateLayers, getWorkspaceType } = load("src/lib/board-templates.ts");

test("product requirement metadata and acceptance criteria round-trip without losing delivery status", () => {
  const layer = { type: 4, x: 0, y: 0, width: 280, height: 210, fill: { r: 181, g: 216, b: 255, a: 1 }, value: "Invite team members", description: "An invited user can join the selected workspace.", requirementSection: "requirements", requirementPriority: "must", status: "in-progress" };
  const result = parseBoardFile(JSON.stringify({ version: 1, layers: [layer] }))[0];
  assert.equal(result.requirementSection, "requirements");
  assert.equal(result.requirementPriority, "must");
  assert.equal(result.status, "in-progress");
  assert.equal(result.description, layer.description);
  assert.equal(boardFileSchema.safeParse({ version: 1, layers: [{ ...layer, requirementPriority: "unknown" }] }).success, false);
});

test("product requirements opens a document workspace without fabricated requirements", () => {
  assert.equal(getWorkspaceType("Product requirements"), "requirements");
  assert.equal(getTemplateLayers("Product requirements").length, 1);
});
