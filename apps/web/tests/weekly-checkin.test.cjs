const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./helpers/load-ts.cjs");
const { boardFileSchema, parseBoardFile } = load("src/lib/board-portability.ts");
const { getTemplateLayers, getWorkspaceType } = load("src/lib/board-templates.ts");

test("weekly check-in fields survive editable board export and reject invalid progress", () => {
  const checkIn = { owner: "user_1", week: "2026-09-28", mood: "Happy", priorities: [{ text: "Ship the launch", done: true }], achievements: ["Completed research"], issues: "Need feedback", objectives: [{ title: "Improve onboarding", progress: 80, status: "on-track" }] };
  const layer = { type: 4, x: 0, y: 0, width: 280, height: 240, fill: { r: 221, g: 214, b: 254, a: 1 }, value: "Weekly summary", checkIn };
  const parsed = parseBoardFile(JSON.stringify({ version: 1, layers: [layer] }));
  assert.equal(JSON.stringify(parsed[0].checkIn), JSON.stringify(checkIn));
  assert.equal(boardFileSchema.safeParse({ version: 1, layers: [{ ...layer, checkIn: { ...checkIn, objectives: [{ title: "Invalid", progress: 101, status: "on-track" }] } }] }).success, false);
});

test("Weekly update opens the check-in workspace without fabricated answers", () => {
  assert.equal(getWorkspaceType("Weekly update"), "weekly");
  assert.equal(getTemplateLayers("Weekly update").length, 1);
});
