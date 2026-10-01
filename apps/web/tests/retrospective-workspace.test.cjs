const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { LiveMap, LiveList, LiveObject } = require("@liveblocks/client");

test("retrospective creates shared notes in the selected column", () => {
  const updates = [];
  const states = [{ positive: "New task", improve: "", action: "" }, false, 300, false, false];
  const layers = new LiveMap([]);
  const layerIds = new LiveList([]);
  const storage = new LiveObject({ layers, layerIds });
  let selector;
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, "../src/app/board/[boardId]/_components/retrospective-workspace.tsx"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  const mocks = {
    react: { useEffect() {}, useState: () => { const index = updates.length; const value = states[index]; updates.push([]); return [value, next => updates[index].push(next)]; } },
    "next/link": { default: "a" },
    "lucide-react": new Proxy({}, { get: () => "span" }),
    "@liveblocks/react/suspense": { useStorage: callback => { selector = callback; return callback({ layers: {}, layerIds: [] }); }, useSelf: callback => callback({ info: { name: "Tester" } }), useMutation: callback => (...args) => callback({ storage }, ...args) },
    "@/components/ui/button": { Button: "button" },
    "@/components/ui/input": { Input: "input" },
    "@/types/canvas": { LayerType: { Note: 4 } },
    "@/lib/board-portability": { MAX_LAYERS: 1000 },
    sonner: { toast: { error: message => { throw new Error(message); } } },
  };
  vm.runInNewContext(code, { exports, require: name => mocks[name] || require(name), Date, console });
  const tree = exports.RetrospectiveWorkspace({ onCanvas() {} });
  const find = node => {
    if (!React.isValidElement(node)) return;
    if (node.type === "form") return node;
    for (const child of React.Children.toArray(node.props.children)) { const found = find(child); if (found) return found; }
  };
  find(tree).props.onSubmit({ preventDefault() {} });
  assert.equal(layerIds.length, 1);
  const id = layerIds.get(0);
  assert.equal(layers.get(id).get("value"), "New task");
  assert.equal(layers.get(id).get("lane"), "positive");
  assert.equal(updates[0].length, 1);
  // Liveblocks immutable views expose layer lookups; no map enumeration is needed.
  const saved = layers.get(id);
  const result = selector({ layerIds: [id], layers: { [id]: { type: saved.get("type"), value: saved.get("value"), completed: saved.get("completed") } } });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, id);
  assert.equal(result[0].value, "New task");
});

