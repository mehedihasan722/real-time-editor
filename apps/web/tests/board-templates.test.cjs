const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const { test } = require("node:test");
const ts = require("typescript");

const source = fs.readFileSync(path.join(__dirname, "../src/lib/board-templates.ts"), "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 },
}).outputText;
const moduleExports = {};
vm.runInNewContext(code, {
  exports: moduleExports,
  require: (name) => name === "@/types/canvas" ? { LayerType: { Text: 3, Note: 4 } } : require(name),
});

test("assistant routes common commands to matching workspaces", () => {
  assert.equal(moduleExports.resolveAssistTemplate("Create a login flow for mobile users"), "Flowchart");
  assert.equal(moduleExports.resolveAssistTemplate("Make a kanban for our launch tasks"), "Kanban");
  assert.equal(moduleExports.resolveAssistTemplate("Draft a pitch deck"), "Slides");
});

test("assistant creates the requested sticky note count", () => {
  const layers = moduleExports.getTemplateLayers("AI Playground", "Create 5 sticky notes for launch ideas");
  assert.equal(layers.length, 6);
  assert.equal(layers.filter(([, layer]) => layer.type === 4).length, 5);
});

test("assistant escapes prompt markup before collaborative rendering", () => {
  const layers = moduleExports.getTemplateLayers("AI Playground", "Plan <script>alert(1)</script>");
  assert.equal(layers.some(([, layer]) => String(layer.value).includes("<script>")), false);
});
