const fs = require('node:fs');
const path = require('node:path');
const { build } = require('esbuild');
const { chromium } = require('@playwright/test');
const root = path.resolve(__dirname, '..');
async function main() {
  const engine = await build({stdin:{contents:`import {ThreeArcade} from './apps/web/src/lib/three-arcade';import {ArcadeWorld} from './apps/web/src/lib/arcade-world';import {games,puzzleIds} from './apps/web/src/lib/games';window.catalog=games;window.puzzleIds=puzzleIds;window.renderGame=(id)=>{let seed=174;Math.random=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};window.engine?.dispose();document.body.innerHTML='<canvas style="width:720px;height:440px" width="720" height="440"></canvas>';const world=new ArcadeWorld(id);for(let i=0;i<120;i++)world.step(1/60,new Set(),null);const engine=new ThreeArcade(document.querySelector('canvas'),id);window.engine=engine;engine.update(world,null);};`,resolveDir:root,loader:'ts'},bundle:true,write:false,format:'iife',platform:'browser'});
  const puzzles = await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import{PuzzleGame}from'./apps/web/src/app/(dashboard)/games/puzzle-game';window.renderPuzzle=(id)=>{window.puzzleRoot?.unmount();document.body.innerHTML='<div id="puzzle" class="flowboard-arcade"></div>';window.puzzleRoot=createRoot(document.querySelector('#puzzle'));window.puzzleRoot.render(<PuzzleGame id={id} onFinish={()=>{}}/>);};`,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
  fs.mkdirSync(path.join(root,'apps/web/public/games'),{recursive:true});
  const browser = await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    const page = await browser.newPage({viewport:{width:720,height:440},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.setContent('<html class="dark"><head></head><body style="margin:0"></body></html>');
    await page.addScriptTag({content:engine.outputFiles[0].text});
    const catalog = await page.evaluate(()=>window.catalog);
    const puzzleIds = await page.evaluate(()=>window.puzzleIds);
    for(const game of catalog.filter(game=>!puzzleIds.includes(game.id))){
      await page.evaluate(id=>window.renderGame(id),game.id);
      await page.locator('canvas').screenshot({path:path.join(root,`apps/web/public/games/${game.id}.png`)});
    }
    await page.evaluate(()=>window.engine?.dispose());
    await page.addStyleTag({content:fs.readFileSync(path.join(root,'apps/web/src/app/(dashboard)/games/games.css'),'utf8')+'*{box-sizing:border-box}body{font-family:Arial;background:#0c1224}.flowboard-arcade{margin:0;padding:0;border:0}.puzzle-stage{height:440px;min-height:440px;padding:12px}.puzzle-grid{max-width:300px;margin:12px auto}.puzzle-grid button{font-size:22px}.simon-grid{max-width:280px}'});
    await page.addScriptTag({content:puzzles.outputFiles[0].text});
    for(const id of puzzleIds){
      await page.evaluate(id=>window.renderPuzzle(id),id);
      await page.locator('.puzzle-stage').waitFor();
      if(id==='mines')await page.getByRole('button',{name:'Square 1: empty',exact:true}).click();
      if(id==='tictactoe')await page.getByRole('button',{name:'Square 1: empty',exact:true}).click();
      if(id==='connect'){await page.getByRole('button',{name:'Drop in column 2'}).click();await page.getByRole('button',{name:'Drop in column 4'}).click();}
      await page.locator('.puzzle-stage').screenshot({path:path.join(root,`apps/web/public/games/${id}.png`)});
    }
    if(errors.length)throw new Error(errors.join('\n'));
    console.log(`Rendered ${catalog.length} game covers from the actual game engines.`);
  } finally { await browser.close(); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
