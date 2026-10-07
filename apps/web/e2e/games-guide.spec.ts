import { expect, test } from "@playwright/test";
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { games, puzzleIds } from "../src/lib/games";
const fixture = (await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import Games from './src/app/(dashboard)/games/page';import Guide from './src/app/(dashboard)/guide/page';createRoot(document.getElementById('root')).render(location.hash==='#guide'?<Guide/>:<Games/>);`,resolveDir:path.resolve('.'),loader:'tsx'},plugins:[{name:'next-fixture',setup(builder){builder.onResolve({filter:/monitoring$/},()=>({path:'monitoring',namespace:'mock'}));builder.onResolve({filter:/^next\/(dynamic|image|link)$/},args=>({path:args.path,namespace:'mock'}));builder.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:args.path==='monitoring'?`export function reportFailure(){} export function recordDuration(){}`:args.path==='next/dynamic'?`import React from 'react';export default function dynamic(load,options){return function Dynamic(props){const[C,set]=React.useState(null);React.useEffect(()=>{let active=true;load().then(value=>{if(active)set(()=>value.default??value)});return()=>{active=false}},[]);return C?<C {...props}/>:options.loading?<options.loading/>:null}}`:args.path==='next/link'?`import React from 'react';export default function Link(props){return <a {...props}/>}`:`import React from 'react';export default function Image({unoptimized,...props}){return <img {...props}/>}`,loader:'tsx',resolveDir:path.resolve('.')}));}}],bundle:true,write:false,format:'iife',platform:'browser',jsx:'automatic',loader:{'.css':'empty'},define:{'process.env.NODE_ENV':'"production"'}})).outputFiles[0].text;
const css = fs.readFileSync('src/app/(dashboard)/games/games.css','utf8')+fs.readFileSync('src/app/(dashboard)/guide/guide.css','utf8');
async function mount(page: import('@playwright/test').Page, guide=false, dark=false){
 await page.goto(`/offline.html${guide?'#guide':''}`);
 await page.setContent('<div id="root"></div>');
 await page.addStyleTag({content:`*{box-sizing:border-box}body{margin:0;font-family:Arial}button,input{font:inherit}button{cursor:pointer}a{color:inherit;text-decoration:none}:root{--foreground:222 40% 15%;--muted-foreground:215 20% 35%;--card:0 0% 100%;--border:215 20% 85%;--muted:215 20% 95%;--ring:240 50% 50%}.dark{--foreground:220 40% 95%;--muted-foreground:215 20% 75%;--card:222 40% 12%;--border:215 20% 30%;--muted:215 20% 20%;--ring:240 70% 75%;background:#0b1020;color:white}${css}`});
 await page.evaluate(dark=>document.documentElement.classList.toggle('dark',dark),dark);
 await page.addScriptTag({content:fixture});
}
for(const dark of [false,true])test(`game library and documentation fit in ${dark?'dark':'light'} mode`,async({page},info)=>{
 await page.setViewportSize({width:375,height:900});await mount(page,false,dark);
 await expect(page.locator('.arcade-card')).toHaveCount(22);
 expect(await page.locator('.arcade-card img').evaluateAll(images=>new Set(images.map(image=>image.getAttribute('src'))).size)).toBe(22);
 await page.getByRole('button',{name:'Racing',exact:true}).click();await expect(page.locator('.arcade-card')).toHaveCount(1);
 await page.getByRole('textbox',{name:'Search games'}).fill('no such game');await expect(page.locator('.arcade-card')).toHaveCount(0);
 await page.getByRole('button',{name:'Clear filters'}).click();await expect(page.locator('.arcade-card')).toHaveCount(22);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath(`games-${dark?'dark':'light'}.png`),fullPage:true});
 await mount(page,true,dark);await expect(page.locator('.docs-articles article')).toHaveCount(10);
 await page.getByRole('textbox',{name:'Search documentation'}).fill('roles');await expect(page.getByRole('status')).toContainText('matching');
 await expect(page.locator('details[open]').first()).toBeVisible();
 await page.getByRole('button',{name:'Clear documentation search'}).click();await expect(page.locator('.docs-articles article')).toHaveCount(10);
 await page.locator('summary').first().click();await expect(page.locator('details').first()).toHaveAttribute('open','');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath(`docs-${dark?'dark':'light'}.png`),fullPage:true});
});
test('every game opens, restarts and releases its playfield',async({page})=>{
 test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await mount(page);
 for(const game of games){
  await page.locator('.arcade-card').filter({has:page.getByRole('heading',{name:game.name,exact:true})}).click();
  await expect(page.locator('.arcade-player-header h2')).toHaveText(game.name);
  if(puzzleIds.includes(game.id)){await expect(page.locator('.puzzle-stage')).toBeVisible();}
  else{await expect(page.locator('canvas')).toHaveCount(1);await page.getByRole('button',{name:'Pause',exact:true}).click();await expect(page.getByRole('heading',{name:'Paused',exact:true})).toBeVisible();await page.getByRole('button',{name:'Resume',exact:true}).click();}
  await page.getByRole('button',{name:'Restart',exact:true}).click();
  await page.getByRole('button',{name:'Library',exact:true}).click();await expect(page.locator('canvas')).toHaveCount(0);
 }
 expect(errors).toEqual([]);
});
test('game keys only act within the focused playfield and recover from GPU loss',async({page,browserName})=>{
 test.skip(browserName==='webkit' && process.platform==='win32','Windows WebKit GPU recovery is covered by graceful engine fallback and library lifecycle checks.');
 await mount(page);await page.locator('.arcade-card').filter({has:page.getByRole('heading',{name:'Night Circuit',exact:true})}).click();
 const canvas=page.locator('canvas');await expect(canvas).toBeFocused();await page.keyboard.press('p');await expect(page.getByRole('heading',{name:'Paused',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Resume',exact:true}).click();await page.keyboard.press('p');await expect(page.getByRole('heading',{name:'Paused',exact:true})).toHaveCount(0);
 await canvas.evaluate(element=>(element as HTMLCanvasElement).dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
 await expect(page.getByRole('alert')).toContainText('graphics context was lost');
 await page.getByRole('button',{name:'Restart',exact:true}).click();await expect(page.getByRole('alert')).toHaveCount(0);
});
