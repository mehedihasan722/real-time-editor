const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const { test } = require("node:test");
const ts = require("typescript");
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/lib/admin-report.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 } }).outputText, { exports: exportsObject });
test("board report escapes CSV content and neutralizes spreadsheet formulas", () => {
  const csv = exportsObject.createBoardCsv([{ title: '=HYPERLINK("bad")', authorName: 'Name, "quoted"', _creationTime: 0, isFavourite: true }]);
  assert.equal(csv, 'Name,Owner,Created,Favourite\r\n"\'=HYPERLINK(""bad"")","Name, ""quoted""","1970-01-01T00:00:00.000Z","Yes"');
  assert.equal(exportsObject.createBoardCsv([]), "Name,Owner,Created,Favourite");
});
