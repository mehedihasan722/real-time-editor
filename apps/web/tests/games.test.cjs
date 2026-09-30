const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), assert = require("node:assert/strict"), { test } = require("node:test"), ts = require("typescript");
function load(name, dependencies = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, `../src/lib/${name}.ts`), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, require: id => dependencies[id] ?? {} });
  return exports;
}
const rules = load("game-rules"), catalog = load("games"), { ArcadeWorld } = load("arcade-world", { "./game-rules": rules });
test("arcade has 22 distinct games and valid categories", () => { assert.equal(catalog.games.length, 22); assert.equal(new Set(catalog.games.map(game => game.id)).size, 22); assert.equal(catalog.puzzleIds.length, 6); });
test("2048 merges each tile once and respects direction", () => {
  const board = [2,2,2,2,...Array(12).fill(0)], result = rules.mergeTiles(board,0);
  assert.deepEqual(Array.from(result.board.slice(0,4)),[4,4,0,0]); assert.equal(result.score,8); assert.deepEqual(board.slice(0,4),[2,2,2,2]);
  assert.deepEqual(Array.from(rules.mergeTiles(board,1).board.slice(0,4)),[0,0,4,4]);
  assert.equal(rules.mergeTiles([2,4,8,16,...Array(12).fill(0)],0).changed,false);
});
test("line wins detect diagonal and vertical without wrapping across rows", () => {
  assert.equal(rules.lineWinner([1,0,0,0,1,0,0,0,1],3,3,3),1);
  assert.equal(rules.lineWinner([0,0,1,1,1,0,0,0,0],3,3,3),0);
  const board = Array(42).fill(0); [0,7,14,21].forEach(i=>board[i]=2); assert.equal(rules.lineWinner(board,7,6,4),2);
});
test("mine neighborhoods and egg clusters do not wrap row edges", () => {
  assert.deepEqual(Array.from(rules.mineNeighbors(0)),[1,8,9]);
  assert.equal(rules.eggCluster([1,1,0,1,1,1],2,3).length,1);
  assert.equal(rules.eggCluster([2,2,1,2,1,1],0,3).length,3);
});
for (const game of catalog.games.filter(game => !catalog.puzzleIds.includes(game.id))) test(`${game.name} simulates with finite state`, () => {
  const world = new ArcadeWorld(game.id);
  for (let i=0;i<150;i++) { world.step(.016,new Set(),null); }
  assert.ok(Number.isFinite(world.score)); assert.ok(Number.isFinite(world.x)); assert.ok(Number.isFinite(world.y)); assert.ok(world.lives>=0);
});
test("target hits score once, and ended games ignore further shots", () => {
  const world = new ArcadeWorld("fps"); world.objects=[{x:100,y:100,r:25,vx:0,vy:0}]; world.click(100,100); assert.equal(world.score,100); assert.equal(world.objects.length,0); world.end(); world.click(100,100); assert.equal(world.score,100);
});
test("runner jump avoids barriers and racing collisions consume lives", () => {
  const runner = new ArcadeWorld("runner"); runner.input("ArrowUp"); runner.objects=[{x:360,y:350,r:24,vx:0,vy:0,kind:0}]; runner.step(.016,new Set(),null); assert.equal(runner.lives,3);
  const racer = new ArcadeWorld("race"); racer.objects=[{x:360,y:350,r:24,vx:0,vy:0}]; racer.step(.016,new Set(),null); assert.equal(racer.lives,2);
});
test("football finishes after ten penalties", () => { const world = new ArcadeWorld("football"); world.x=190; for(let i=0;i<10;i++)world.input(" "); assert.equal(world.round,10); assert.equal(world.over,true); assert.equal(world.score,1000); });
test("snake cannot reverse into itself and catches food", () => { const world = new ArcadeWorld("snake"); world.input("ArrowLeft"); world.food=[10,10]; world.step(.2,new Set(),null); assert.equal(world.score,10); assert.equal(world.snake.length,4); });
test("early reflex clicks reset the wait without awarding score", () => { const world = new ArcadeWorld("reaction"); world.input(" "); assert.equal(world.score,0); assert.equal(world.ready,false); world.time=world.wait+.2; world.ready=true; world.input(" "); assert.equal(world.score,800); });

