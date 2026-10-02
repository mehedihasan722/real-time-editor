import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";

const css = ["src/app/globals.css", "src/app/(dashboard)/_components/board-browse.css"].map(file => fs.readFileSync(file, "utf8").replace(/^@(?:config|import).*$/gm, "")).join("\n");
const fixture = (await build({
  stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import Boards from './src/app/(dashboard)/_components/board-list';createRoot(document.getElementById('root')).render(<Boards orgId="org-fixture" query={{}}/>);`, loader: "tsx", resolveDir: path.resolve(".") },
  bundle: true, write: false, format: "iife", platform: "browser", jsx: "automatic", define: { "process.env": "{}", "process.env.NODE_ENV": '"production"' }, alias: { "@": path.resolve("src") },
  plugins: [{ name: "isolated-board-backend", setup(builder) {
    builder.onResolve({ filter: /^(convex\/react|@clerk\/nextjs|next\/link)$/ }, args => ({ path: args.path, namespace: "fixture" }));
    builder.onResolve({ filter: /convex\/_generated\/api$/ }, () => ({ path: "api", namespace: "fixture" }));
    builder.onResolve({ filter: /(template-gallery|new-board-button|components\/actions)$/ }, () => ({ path: "component", namespace: "fixture" }));
    builder.onResolve({ filter: /\.css$/ }, () => ({ path: "css", namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ resolveDir: path.resolve("."), loader: "tsx", contents: args.path === "convex/react" ? `
      import {useSyncExternalStore} from 'react';let count=20;const listeners=new Set();
      const types=['AI Playground','Product requirements','Weekly update','Roadmap','Retrospective','To-do planning','Flowchart','Prototype'];
      const boards=Array.from({length:37},(_,i)=>({_id:'board-'+String(i).padStart(3,'0'),_creationTime:Date.now()-i*1000,title:types[i%types.length]+' '+String(i).padStart(2,'0'),orgId:'org-fixture',authorId:'user-fixture',authorName:'Taylor',imageUrl:'/old-random.svg',isFavourite:i%2===0}));
      const loadMore=(size)=>{count=Math.min(37,count+size);listeners.forEach(fn=>fn());};
      export function usePaginatedQuery(){useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn);},()=>count);return {results:boards.slice(0,count),status:count===37?'Exhausted':'CanLoadMore',loadMore};} export function useMutation(){return async()=>{};}
    ` : args.path === "@clerk/nextjs" ? `export function useAuth(){return {userId:'user-fixture'};} export function useOrganization(){return {organization:{id:'org-fixture'}};}` : args.path === "next/link" ? `export default function Link({children,...props}){return <a {...props}>{children}</a>;}` : args.path === "api" ? `export const api={boards:{list:'list'},board:{favourite:'fav',unfavourite:'unfav'}};` : args.path === "component" ? `export default function Component({children}){return children??null;}` : "" }));
  } }],
})).outputFiles[0].text;

for (const dark of [true, false]) test(`board pagination and distinct previews in ${dark ? "dark" : "light"} mode`, async ({ page }) => {
  await page.goto("/");
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setContent(`<html class="${dark ? "dark" : ""}"><head><style>body{font-family:Arial;margin:12px}.relative{position:relative}.relative.flex-1{height:180px;flex:1}.group{height:240px;display:flex;flex-direction:column}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}@media(max-width:640px){.grid{grid-template-columns:1fr}}${css}</style></head><body><div id="root"></div></body></html>`);
  await page.addScriptTag({ content: fixture });
  await page.waitForTimeout(100);
  expect(errors).toEqual([]);
  const rows = page.locator("tbody tr");
  await expect(rows).toHaveCount(10);
  await expect(page.getByRole("img", { name: "AI Playground", exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Next board page" }).click();
  await expect(rows).toHaveCount(10);
  await expect(rows.first()).toContainText("Weekly update 10");
  await page.getByRole("button", { name: "Next board page" }).click();
  await expect(rows).toHaveCount(10);
  await expect(rows.first()).toContainText("Retrospective 20");
  await page.getByRole("combobox", { name: "Boards per page" }).selectOption("15");
  await expect(rows).toHaveCount(15);
  await expect(rows.first()).toContainText("AI Playground 00");
  await page.getByRole("button", { name: "Next board page" }).click();
  await expect(rows).toHaveCount(15);
  await page.getByRole("button", { name: "Next board page" }).click();
  await expect(rows).toHaveCount(7);
  await expect(page.getByRole("button", { name: "Next board page" })).toBeDisabled();
  await page.getByRole("button", { name: "Grid view" }).click();
  await expect(page.locator(".board-type-preview")).toHaveCount(7);
  await page.getByRole("combobox", { name: "Boards per page" }).selectOption("20");
  await expect(page.locator(".board-type-preview")).toHaveCount(20);
  await expect(page.getByRole("img", { name: /Roadmap preview/ }).first()).toBeVisible();
  await expect(page.getByRole("img", { name: /Retrospective preview/ }).first()).toBeVisible();
  await page.getByRole("button", { name: "Next board page" }).click();
  await expect(page.locator(".board-type-preview")).toHaveCount(17);
  await page.getByRole("button", { name: "List view" }).click();
  await page.getByRole("button", { name: "Favourites", exact: true }).click();
  await expect(rows).toHaveCount(19);
  await expect(page.getByRole("button", { name: "Previous board page" })).toBeDisabled();
});
