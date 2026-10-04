import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import path from "node:path";

const fixture = (await build({
  stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import Preview from './src/app/(dashboard)/_components/three-template-preview';function App(){const [model,setModel]=React.useState('ideas');const [visible,setVisible]=React.useState(true);return <><button onClick={()=>setModel('tasks')}>Tasks</button><button onClick={()=>setModel('roadmap')}>Roadmap</button><button onClick={()=>setVisible(false)}>Remove preview</button>{visible&&<div style={{width:'100%',height:280}}><Preview model={model}/></div>}</>}createRoot(document.getElementById('root')).render(<App/>);`, loader: "tsx", resolveDir: path.resolve(".") },
  bundle: true, write: false, format: "iife", platform: "browser", jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' },
})).outputFiles[0].text;

test("Blender models load into WebGL, switch, and dispose on removal", async ({ page, browserName }, testInfo) => {
  test.skip(browserName === "webkit" && process.platform === "win32", "Windows WebKit does not consistently support the WebGL fixture; image fallbacks are checked separately.");
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/"); await page.setContent('<div id="root"></div>'); await page.addScriptTag({ content: fixture });
  const canvas = page.locator("canvas");
  await expect(canvas).toHaveCount(1);
  await expect.poll(() => canvas.evaluate(element => element.style.opacity)).toBe("1");
  await page.screenshot({ path: testInfo.outputPath("blender-model.png") });
  await page.getByRole("button", { name: "Tasks", exact: true }).click();
  await expect.poll(() => canvas.evaluate(element => element.style.opacity)).toBe("1");
  await page.getByRole("button", { name: "Roadmap", exact: true }).click();
  await expect.poll(() => canvas.evaluate(element => element.style.opacity)).toBe("1");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(canvas).toHaveCount(1);
  await page.getByRole("button", { name: "Remove preview" }).click(); await expect(canvas).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("Blender posters and GLB assets are available without external services", async ({ request }) => {
  for (const model of ["ideas", "tasks", "roadmap"]) {
    const poster = await request.get(`/models/${model}.png`); expect(poster.ok()).toBe(true);
    const glb = await request.get(`/models/${model}.glb`); expect(glb.ok()).toBe(true);
    const bytes = await glb.body(); expect(bytes.subarray(0, 4).toString()).toBe("glTF"); expect(bytes.readUInt32LE(4)).toBe(2);
  }
});
