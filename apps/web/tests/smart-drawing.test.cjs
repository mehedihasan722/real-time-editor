const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const { test } = require("node:test");
const ts = require("typescript");
const exported = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/lib/smart-drawing.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: exported, require: () => ({ LayerType: { Shape: 5 } }) });
const color = { r: 210, g: 40, b: 60, a: 1 };
function stroke(vertices) {
  return vertices.slice(1).flatMap((end, i) => Array.from({ length: 20 }, (_, j) => {
    const t = j / 20;
    return [70 + (vertices[i][0] + (end[0] - vertices[i][0]) * t) * 140 + Math.sin(i * 20 + j) * 1.5, 40 + (vertices[i][1] + (end[1] - vertices[i][1]) * t) * 110 + Math.cos(i * 20 + j) * 1.5, .5];
  })).concat([[70 + vertices.at(-1)[0] * 140, 40 + vertices.at(-1)[1] * 110, .5]]);
}
for (const [name, vertices] of [
  ["rectangle", [[0,0],[1,0],[1,1],[0,1],[0,0]]],
  ["triangle", [[.5,0],[1,1],[0,1],[.5,0]]],
  ["diamond", [[.5,0],[1,.5],[.5,1],[0,.5],[.5,0]]],
  ["hexagon", [[.25,0],[.75,0],[1,.5],[.75,1],[.25,1],[0,.5],[.25,0]]],
]) test(`magic pen converts a rough ${name}`, () => {
  const result = exported.recognizeDrawing(stroke(vertices), color, 8);
  assert.equal(result?.shape, name);
  assert.equal(result.strokeColor, color);
  assert.equal(result.strokeWidth, 8);
  assert.equal(result.fill.a, 0);
});
const arc = (cy, ry, start, end) => Array.from({ length: 50 }, (_, i) => { const a = start + (end - start) * i / 49; return [.5 + .5 * Math.cos(a), cy + ry * Math.sin(a)]; });
test("magic pen recognizes a rough circle regardless of stroke start", () => {
  const points = arc(.5,.5,1,1+Math.PI*2).map(([x,y],i) => [100+x*150+Math.sin(i)*2, 60+y*150+Math.cos(i)*2,.5]);
  assert.equal(exported.recognizeDrawing(points.reverse(),color,4)?.shape,"circle");
});
test("magic pen recognizes a cylinder with its top ellipse", () => {
  const outline = [...arc(.15,.15,Math.PI,Math.PI*2),[1,.85],...arc(.85,.15,0,Math.PI),[0,.15],...arc(.15,.15,Math.PI,0)];
  assert.equal(exported.recognizeDrawing(stroke(outline),color,4)?.shape,"database");
});
test("magic pen leaves open curves, scribbles and tiny marks freehand", () => {
  assert.equal(exported.recognizeDrawing(stroke([[0,0],[1,1],[0,1],[1,0],[0,0]]),color,4),null);
  assert.equal(exported.recognizeDrawing([[0,0],[1,1],[2,1],[3,0]],color,4),null);
  assert.equal(exported.recognizeDrawing(stroke([[0,0],[.5,1],[1,0]]),color,4),null);
});
test("magic pen straightens a rough line", () => {
  assert.equal(exported.recognizeDrawing(stroke([[0,0],[1,1]]),color,4)?.shape,"line");
});
