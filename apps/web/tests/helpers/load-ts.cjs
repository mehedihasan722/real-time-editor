const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

module.exports = function loadTs(filename, mocks = {}, globals = {}) {
  const filepath = path.resolve(__dirname, "../..", filename);
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(filepath, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, {
    exports, process, console, TextEncoder, TextDecoder, TransformStream, AbortSignal, URL, Response, Request, fetch, atob,
    require: name => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name === "@flowboard/types/canvas") return module.exports("../../packages/types/src/canvas.ts", mocks, globals);
      if (name === "@flowboard/utils") return module.exports("../../packages/utils/src/index.ts", mocks, globals);
      if (name.startsWith("@/")) return module.exports(`src/${name.slice(2)}.ts`, mocks, globals);
      if (name.startsWith(".")) return module.exports(path.relative(path.resolve(__dirname, "../.."), path.resolve(path.dirname(filepath), `${name}.ts`)), mocks, globals);
      return require(name);
    }, ...globals,
  }, { filename: filepath });
  return exports;
};
