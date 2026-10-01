const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");

test("Playground submits chat to Assist and keeps a failed prompt available for retry", async () => {
  for (const success of [true, false]) {
    const changes = [];
    const conversation = { id: "first", title: "New conversation", mode: "chat", messages: [] };
    const states = [[conversation], "first", "Plan my launch", false, "", { chat: true, generate: false }, false];
    let sent;
    const exports = {};
    const mocks = {
      react: { useState: () => { const index = changes.length; changes.push([]); return [states[index], value => changes[index].push(value)]; }, useEffect() {}, useRef: () => ({ current: null }) },
      "next/link": { default: "a" },
      "lucide-react": new Proxy({}, { get: () => "span" }),
      "@liveblocks/react/suspense": { useSelf: callback => callback({ info: { name: "Tester" } }) },
      "@/components/ui/button": { Button: "button" },
      "@/lib/assist": { generatedBoardSchema: { parse() { throw new Error("Chat must not parse a board"); } } },
    };
    const source = fs.readFileSync(path.resolve(__dirname, "../src/app/board/[boardId]/_components/ai-playground.tsx"), "utf8");
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    vm.runInNewContext(code, { exports, require: name => mocks[name] || require(name), AbortController, window: { setTimeout, clearTimeout }, fetch: async (url, options) => { sent = { url, body: JSON.parse(options.body) }; return { ok: success, json: async () => success ? { message: "Launch plan" } : { error: "Provider unavailable" } }; } });
    const tree = exports.AIPlayground({ boardId: "board_1", onCanvas() {}, onGenerated() {} });
    const findForm = node => { if (!React.isValidElement(node)) return; if (node.type === "form") return node; for (const child of React.Children.toArray(node.props.children)) { const form = findForm(child); if (form) return form; } };
    await findForm(tree).props.onSubmit({ preventDefault() {} });
    assert.equal(sent.url, "/api/assist");
    assert.equal(sent.body.boardId, "board_1");
    assert.deepEqual(sent.body.messages, [{ role: "user", content: "Plan my launch" }]);
    const final = changes[0].at(-1)([conversation])[0];
    assert.equal(final.messages.length, success ? 2 : 0);
    if (success) assert.equal(final.messages[1].content, "Launch plan");
    else { assert.equal(changes[2].at(-1), "Plan my launch"); assert.equal(changes[4].at(-1), "Provider unavailable"); }
  }
});
