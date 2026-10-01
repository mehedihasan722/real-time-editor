import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import path from "node:path";

const fixture = (await build({
  stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import Actions from './src/components/actions';import RenameModal from './src/components/modals/rename-modal';window.actionCalls=[];window.clipboardValue='';Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.clipboardValue=text;}}});createRoot(document.getElementById('root')).render(<><div style={{height:1400}}/><Actions id="row-board" title="Row board"><button>Row actions</button></Actions><a href="/board/grid-board"><Actions id="grid-board" title="Grid board"><button>Grid actions</button></Actions></a><Actions id="admin-board" title="Admin board"><button>Admin actions</button></Actions><RenameModal/><div style={{height:1400}}/></>);`, loader: "tsx", resolveDir: path.resolve(".") },
  bundle: true, write: false, format: "iife", platform: "browser", jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' }, alias: { "@": path.resolve("src") },
  plugins: [{ name: "isolated-action-services", setup(builder) {
    builder.onResolve({ filter: /^(convex\/react|next\/navigation)$/ }, args => ({ path: args.path, namespace: "fixture" }));
    builder.onResolve({ filter: /convex\/_generated\/api$/ }, () => ({ path: "api", namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ resolveDir: path.resolve("."), loader: "tsx", contents: args.path === "convex/react" ? `export function useMutation(operation){return async payload=>{window.actionCalls.push({operation,...payload});};}` : args.path === "next/navigation" ? `const router={push:path=>window.actionCalls.push({operation:'navigate',path}),refresh:()=>{}};export function useRouter(){return router;}export function usePathname(){return '/';}` : `export const api={board:{remove:'remove',update:'update'}};` }));
  } }],
})).outputFiles[0].text;

for (const dark of [false, true]) test(`board actions keep scroll and release focus in ${dark ? "dark" : "light"} mode`, async ({ page }) => {
  await page.goto("/");
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setContent(`<html class="${dark ? "dark" : ""}"><head><style>body{margin:0;font-family:Arial;background:${dark ? "#11182e" : "#fff"};color:${dark ? "#edf1ff" : "#0f172a"}}[role=menu],[role=dialog],[role=alertdialog]{background:${dark ? "#11182e" : "#fff"};border:1px solid #64748b;padding:12px;z-index:100}[role=menuitem]{padding:12px;cursor:pointer}button{padding:8px}</style></head><body><div id="root"></div></body></html>`);
  await page.addScriptTag({ content: fixture });
  await page.getByRole("button", { name: "Row actions" }).scrollIntoViewIfNeeded();
  const scroll = await page.evaluate(() => scrollY);
  for (const label of ["Row actions", "Grid actions", "Admin actions"]) {
    await page.getByRole("button", { name: label }).click();
    await expect(page.getByRole("menu")).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.body).pointerEvents)).not.toBe("none");
    expect(Math.abs(await page.evaluate(() => scrollY) - scroll)).toBeLessThan(100);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
  }
  expect(page.url()).not.toContain("/board/grid-board");
  await page.getByRole("button", { name: "Row actions" }).click();
  await page.getByRole("menuitem", { name: "Copy board link" }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { clipboardValue: string }).clipboardValue)).toContain("/board/row-board");
  await page.getByRole("button", { name: "Row actions" }).click();
  await page.getByRole("menuitem", { name: "Rename", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByPlaceholder("Board title").fill("Renamed board");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Admin actions" }).click();
  await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await expect(page.getByRole("menu")).toHaveCount(0);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "Admin actions" }).click();
  await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Delete board", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { actionCalls: unknown[] }).actionCalls)).toEqual([{ operation: "update", id: "row-board", title: "Renamed board" }, { operation: "remove", id: "admin-board" }]);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined }));
  await page.getByRole("button", { name: "Row actions" }).click();
  await page.getByRole("menuitem", { name: "Copy board link" }).click();
  await expect(page.getByRole("menu")).toHaveCount(0);
  expect(errors).toEqual([]);
});
