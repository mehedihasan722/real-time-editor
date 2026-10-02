import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import path from "node:path";

const fixture = (await build({
  stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {FlowchartPicker} from './src/app/board/[boardId]/_components/flowchart-picker';function App(){const [open,setOpen]=React.useState(true);return <><button onClick={()=>setOpen(true)}>Choose layout</button><FlowchartPicker open={open} onOpenChange={setOpen} onChoose={(style,steps)=>document.getElementById('result').textContent=JSON.stringify({style,steps})}/><output id="result"/></>}createRoot(document.getElementById('root')).render(<App/>);`, loader: "tsx", resolveDir: path.resolve(".") },
  bundle: true, write: false, format: "iife", platform: "browser", jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' }, alias: { "@": path.resolve("src"), "@flowboard/types/canvas": path.resolve("../../packages/types/src/canvas.ts") },
})).outputFiles[0].text;

test("flowchart picker previews presets and inserts custom steps", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.setContent('<div id="root"></div>'); await page.addScriptTag({ content: fixture });
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("button[aria-pressed] svg[viewBox]")).toHaveCount(5);
  await page.getByRole("button", { name: "decision", exact: true }).click();
  await expect(page.getByRole("button", { name: "decision", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "custom", exact: true }).click();
  await page.getByRole("textbox").fill("Research\nBuild\nShip");
  await page.getByRole("button", { name: "Add flowchart", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("#result")).toHaveText(JSON.stringify({ style: "custom", steps: ["Research", "Build", "Ship"] }));
  await page.getByRole("button", { name: "Choose layout" }).click();
  await page.getByRole("textbox").fill(" \n ");
  await expect(page.getByRole("button", { name: "Add flowchart", exact: true })).toBeDisabled();
  await page.keyboard.press("Escape"); await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(errors).toEqual([]);
});
