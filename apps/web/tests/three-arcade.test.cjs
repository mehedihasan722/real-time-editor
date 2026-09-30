const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{test}=require('node:test'),ts=require('typescript'),THREE=require('three');
function load(name,deps){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,`../src/lib/${name}.ts`),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:id=>deps[id]??{},window:{devicePixelRatio:3,innerWidth:390},ResizeObserver:class{observe(){}disconnect(){}}});return exports;}
class Renderer{shadowMap={};renderCount=0;disposed=false;lost=false;setPixelRatio(value){this.ratio=value;}setSize(){}render(){this.renderCount++;}dispose(){this.disposed=true;}forceContextLoss(){this.lost=true;}}
const rules=load('game-rules',{}),{ArcadeWorld}=load('arcade-world',{'./game-rules':rules}),{ThreeArcade}=load('three-arcade',{three:{...THREE,WebGLRenderer:Renderer}});
for(const id of ['fps','football','race','runner','egg','plane','snake','pong','breakout','invaders','flappy','asteroids','catch','dodge','aim','reaction'])test(`${id} creates actual 3D geometry and disposes its renderer`,()=>{
 const game=new ThreeArcade({clientWidth:360},id),world=new ArcadeWorld(id);
 let meshes=0;game.scene.traverse(node=>{if(node instanceof THREE.Mesh){meshes++;assert.ok(node.geometry instanceof THREE.BufferGeometry);}});assert.ok(meshes>0);assert.equal(game.renderer.ratio,1.25);assert.equal(game.renderer.shadowMap.enabled,false);
 world.step(.1,new Set(),null);game.update(world,null);assert.equal(game.renderer.renderCount,1);const renderer=game.renderer;game.dispose();assert.equal(renderer.disposed,true);assert.equal(renderer.lost,true);
});
