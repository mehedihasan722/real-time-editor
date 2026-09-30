const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const { test } = require("node:test");
const ts = require("typescript");
test("comment authors preserve requested order and handle former members", async () => {
  const exported = {};
  let requested;
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/lib/comment-users.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 } }).outputText, {
    exports: exported, URLSearchParams,
    fetch: async url => { requested = url; return { ok: true, json: async () => [{ id: "user_a", name: "Alice", avatar: "avatar" }] }; },
  });
  const users = await exported.resolveCommentUsers({ userIds: ["missing", "user_a"] });
  assert.equal(users[0].name, "Former team member");
  assert.equal(users[1].name, "Alice");
  assert.equal(requested, "/api/comment-users?id=missing&id=user_a");
  const mentions = await exported.resolveCommentMentions({ text: "Alice & Bob" });
  assert.equal(mentions[0], "user_a");
  assert.equal(requested, "/api/comment-users?q=Alice+%26+Bob");
});
