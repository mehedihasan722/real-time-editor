import { test, expect } from "@playwright/test";
import { build } from "esbuild";

import path from "node:path";

const bundle = (await build({
  stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {BoardStarter} from './src/app/board/[boardId]/_components/board-starter';import {AIPlayground} from './src/app/board/[boardId]/_components/ai-playground';import Info from './src/app/board/[boardId]/_components/info';import Participants from './src/app/board/[boardId]/_components/participants';const playground=location.hash==='#chat';createRoot(document.getElementById('fixture')).render(playground?<AIPlayground boardId="fixture" onCanvas={()=>{}} onGenerated={()=>{}}/>:<main className="future-board relative h-dvh"><Info boardId="fixture"/><Participants/><div className="board-file-actions absolute right-4 top-20"><button>Board files</button><button>Cloud services</button></div><BoardStarter boardId="fixture" name="Mehedi" onGenerated={()=>{}} onClose={()=>{}} onStart={()=>{}}/></main>);`, loader: "tsx", resolveDir: process.cwd() },
  bundle: true, write: false, format: "iife", platform: "browser", jsx: "automatic", alias: { "@": path.resolve("src") }, define: { "process.env.NODE_ENV": '"production"' },
  plugins: [{ name: "board-fixture", setup(builder) {
    builder.onResolve({ filter: /^(convex\/react|@liveblocks\/react\/suspense|next\/(image|link)|next-themes|framer-motion|@\/components\/(actions|hint|invite-members-dialog))$/ }, args => ({ path: args.path, namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path: name }) => ({ loader: "tsx", resolveDir: process.cwd(), contents:
      name === "convex/react" ? `export const useQuery=()=>({_id:'fixture',title:'A very long board title that must not overlap collaborators',orgId:'org'});export const useMutation=()=>async()=>{};`
      : name === "@liveblocks/react/suspense" ? `const me={connectionId:1,info:{name:'Mehedi'}};export const useSelf=fn=>fn?fn(me):me;export const useOthers=()=>[];`
      : name === "next-themes" ? `export const useTheme=()=>({theme:'light',setTheme:()=>{}});`
      : name === "framer-motion" ? `import React from 'react';export const m={main:({initial,animate,transition,...props})=><main {...props}/>};export const useReducedMotion=()=>true;`
      : name === "@/components/invite-members-dialog" ? `export const InviteMembersDialog=({children})=>children;`
      : name === "next/image" ? `import React from 'react';export default function Image({unoptimized,...props}){return <img {...props}/>}`
      : name === "next/link" ? `import React from 'react';export default function Link(props){return <a {...props}/>} `
      : `export default function Wrapper({children}){return children;}` }));
  } }],
})).outputFiles[0].text;

for (const [width, height] of [[320,568],[375,812],[568,320],[768,1024],[1024,600],[1440,900]]) test(`Assist and board chrome fit ${width}x${height}`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height });
  await page.route("**/api/assist", route => route.fulfill({ json: { chat:true, generate:true, image:true, providers:{gemini:true} } }));
  await page.goto("/sign-in");
  const styles = await page.locator('link[rel="stylesheet"]').evaluateAll(nodes => nodes.map(node => (node as HTMLLinkElement).href));
  for (const chat of [false,true]) {
    await page.evaluate(chat => { location.hash=chat?'chat':'board'; }, chat);
    await page.setContent(`<html><head>${styles.map(href=>`<link rel="stylesheet" href="${href}">`).join('')}</head><body><div id="fixture"></div></body></html>`);
    await page.addScriptTag({content:bundle});
    const panel = page.locator(chat ? 'main' : '.board-starter').last();
    await expect(panel).toBeVisible();
    const bounds = await panel.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(width+1);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(height+1);
    await expect(page.getByText('AI connections & setup')).toHaveCount(0);
    await expect(page.getByRole('option',{name:'Grok',exact:true})).toHaveCount(0);
    const input=page.getByRole('textbox',{name:chat?'Message to assistant':'Describe your board'});
    await input.fill('Plan a launch');
    await expect(input).toHaveValue('Plan a launch');
    if (!chat) {
      const info=await page.locator('.board-info').boundingBox(), people=await page.locator('.board-people').boundingBox();
      expect(info!.x+info!.width<=people!.x || info!.y+info!.height<=people!.y).toBe(true);
      const menu=await page.getByRole('button',{name:'Main menu',exact:true}).boundingBox();
      expect(menu!.x+menu!.width).toBeLessThanOrEqual(width);
    }
    if(width===375) await page.screenshot({path:testInfo.outputPath(chat?'chat-mobile.png':'starter-mobile.png'),fullPage:true});
  }
});
