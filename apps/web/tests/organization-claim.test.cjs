const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const { test } = require("node:test");
const ts = require("typescript");

const source = fs.readFileSync(path.join(__dirname, "../src/lib/organization-claim.ts"), "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 },
}).outputText;
const moduleExports = {};
vm.runInNewContext(code, { exports: moduleExports });

test("reads Clerk compact organization claims", () => {
  assert.equal(moduleExports.getActiveOrganizationId({ o: { id: "org_compact" } }), "org_compact");
});

test("keeps legacy organization claim compatibility", () => {
  assert.equal(moduleExports.getActiveOrganizationId({ org_id: "org_legacy" }), "org_legacy");
  assert.equal(moduleExports.getActiveOrganizationId({ orgId: "org_camel" }), "org_camel");
});

test("rejects missing or malformed organization claims", () => {
  assert.equal(moduleExports.getActiveOrganizationId({}), null);
  assert.equal(moduleExports.getActiveOrganizationId({ o: { id: 42 } }), null);
});
