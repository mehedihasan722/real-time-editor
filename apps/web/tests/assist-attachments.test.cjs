const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./helpers/load-ts.cjs");
const { attachmentsSchema, readAssistFiles, attachedMessages } = load("src/lib/assist-attachments.ts");
const file = (name, text, path = "") => ({ name, webkitRelativePath: path, type: "text/plain", size: Buffer.byteLength(text), arrayBuffer: async () => Uint8Array.from(Buffer.from(text)).buffer });

test("folder selection preserves relative paths, skips secrets, and never silently truncates text", async () => {
  const result = await readAssistFiles([file("index.ts", "export const count = 4;", "project/src/index.ts"), file(".env", "secret", "project/.env"), file("auth.json", "secret", "project/.local-tools/auth.json"), file("large.txt", "x".repeat(32001)), file("report.pdf", "fake")], []);
  assert.equal(result.attachments.length, 1);
  assert.equal(result.attachments[0].name, "project/src/index.ts");
  assert.equal(result.warnings.length, 4);
  assert.ok(!JSON.stringify(result.attachments).includes("secret"));
});
test("attachment validation rejects malicious paths, forged images, and oversized batches", () => {
  assert.equal(attachmentsSchema.safeParse([{ kind: "text", name: "../secret.txt", content: "a" }]).success, false);
  assert.equal(attachmentsSchema.safeParse([{ kind: "image", name: "fake.png", content: "data:image/png;base64,PGh0bWw+" }]).success, false);
  assert.equal(attachmentsSchema.safeParse([{ kind: "image", name: "fake.png", content: "data:image/png;base64,a" }]).success, false);
  assert.equal(attachmentsSchema.safeParse(Array.from({ length: 21 }, (_, index) => ({ kind: "text", name: `${index}.txt`, content: "a" }))).success, false);
});
test("valid image input and text are included only in the submitted user message", () => {
  const files = [{ kind: "text", name: "plan.md", content: "Plan a launch" }, { kind: "image", name: "preview.png", content: "data:image/png;base64,iVBORw0KGgo=" }];
  assert.equal(attachmentsSchema.safeParse(files).success, true);
  const messages = [{ role: "assistant", content: "Earlier response" }, { role: "user", content: "Use these files" }];
  const outgoing = attachedMessages(messages, files);
  assert.equal(outgoing[0], messages[0]);
  assert.match(outgoing[1].content[0].text, /Plan a launch/);
  assert.equal(outgoing[1].content[1].image_url.url, files[1].content);
  assert.equal(messages[1].content, "Use these files");
});
