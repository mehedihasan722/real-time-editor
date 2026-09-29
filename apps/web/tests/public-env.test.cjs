const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const { test } = require("node:test");
const ts = require("typescript");

const source = fs.readFileSync(path.join(__dirname, "../src/lib/public-env.ts"), "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const key = "pk_test_" + Buffer.from("example.clerk.accounts.dev$").toString("base64");

for (const [name, url, pk, expected] of [
  ["missing values", undefined, undefined, false],
  ["empty URL", "", key, false],
  ["invalid URL", "not-a-url", key, false],
  ["HTTP actions URL", "https://example.convex.site", key, false],
  ["unsupported protocol", "ftp://example.com", key, false],
  ["valid cloud configuration", "https://example.convex.cloud", key, true],
  ["local Convex configuration", "http://127.0.0.1:3210", key, true],
  ["invalid Clerk key", "https://example.convex.cloud", "invalid", false],
]) {
  test(name, () => {
    const context = {
      exports: {}, require, URL,
      process: { env: {
        NEXT_PUBLIC_CONVEX_URL: url,
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: pk,
      } },
    };
    vm.runInNewContext(code, context);
    assert.equal(context.exports.publicEnv.success, expected);
  });
}
