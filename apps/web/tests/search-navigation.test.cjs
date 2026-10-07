const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const path = require("node:path");
test("board search from other sections opens results without scrolling or carrying unrelated filters", () => {
  for (const pathname of ["/", "/settings", "/templates", "/admin"]) {
    const calls = []; const effects = []; const editing = { current: false }; let route = pathname;
    const mocks = {
      react: { __esModule: true, default: {}, useState: () => ["roadmap", () => {}], useRef: () => editing, useEffect: callback => effects.push(callback) },
      "next/navigation": { usePathname: () => route, useSearchParams: () => new URLSearchParams("favourites=true&tab=users"), useRouter: () => ({ replace: (...args) => calls.push(args) }) },
      "@/hooks/search-hooks": { useDebounce: value => value },
      "@/components/ui/input": { Input: "input" },
      "lucide-react": { Search: "span" },
    };
    const exported = {};
    const source = fs.readFileSync(path.join(__dirname, "../src/app/(dashboard)/_components/search-input.tsx"), "utf8");
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    vm.runInNewContext(code, { exports: exported, URLSearchParams, require: name => mocks[name] || require(name) });
    const tree = exported.default(); effects.splice(0).forEach(callback => callback());
    assert.equal(calls.length, 0, "mounting does not navigate with a stale debounced value");
    const input = require("react").Children.toArray(tree.props.children).find(child => child.type === "input");
    input.props.onChange({ target: { value: "roadmap" } });
    exported.default(); const updateEffects = effects.splice(0); updateEffects.at(-1)();
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], pathname === "/" ? "/?favourites=true&tab=users&search=roadmap" : "/?search=roadmap");
    assert.equal(calls[0][1].scroll, false);
    route = "/guide"; exported.default(); effects.splice(0).forEach(callback => callback());
    assert.equal(calls.length, 1, "leaving search results does not redirect back to boards");
  }
});
