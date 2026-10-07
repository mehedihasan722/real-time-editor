const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.resolve(__dirname, "../src");
function files(directory) { return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(directory, entry.name)) : [path.join(directory, entry.name)]); }
const sourceFiles = files(root);
const routes = sourceFiles.filter(file => /[\\/](page|route)\.tsx?$/.test(file)).map(file => {
  const segments = path.relative(path.join(root, "app"), path.dirname(file)).split(path.sep).filter(segment => !segment.startsWith("("));
  const pattern = segments.map(segment => {
    if (segment.startsWith("[[...")) return "(?:/[^/]+)*";
    if (segment.startsWith("[...")) return "(?:/[^/]+)+";
    if (segment.startsWith("[")) return "/[^/]+";
    return "/" + segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("");
  return new RegExp("^" + pattern + "/?$");
});
test("literal internal links resolve to a route or public asset", () => {
  let checked = 0;
  for (const file of sourceFiles.filter(file => /\.tsx?$/.test(file))) {
    const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
    function visit(node) {
      const isHref = ts.isJsxAttribute(node) && node.name.getText(source) === "href" || ts.isPropertyAssignment(node) && node.name.getText(source) === "href";
      if (isHref) {
        const value = node.initializer;
        if (value && ts.isStringLiteral(value) && value.text.startsWith("/") && !value.text.startsWith("//")) {
          const route = value.text.split(/[?#]/)[0] || "/";
          assert.ok(routes.some(pattern => pattern.test(route)) || fs.existsSync(path.join(root, "../public", route)), `${path.relative(root, file)}: ${value.text}`);
          checked++;
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  assert.ok(checked > 40, "audit includes application links and navigation definitions");
});
