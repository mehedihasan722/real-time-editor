import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import path from "node:path";

const fixture = (await build({
  stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import Preview from './src/app/(dashboard)/_components/three-template-preview';function App(){const [model,setModel]=React.useState('workspace');const [visible,setVisible]=React.useState(true);return <><button onClick={()=>setModel('tasks')}>Tasks</button><button onClick={()=>setModel('roadmap')}>Roadmap</button><button onClick={()=>setVisible(false)}>Remove preview</button>{visible&&<div style={{width:'100%',height:280}}><Preview model={model}/></div>}</>}createRoot(document.getElementById('root')).render(<App/>);`, loader: "tsx", resolveDir: path.resolve(".") },
  bundle: true, write: false, format: "iife", platform: "browser", jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' },
})).outputFiles[0].text;

test("Blender models animate with WebGL or use their rendered fallback", async ({ page, browserName }, testInfo) => {
  test.skip(browserName === "webkit" && process.platform === "win32", "Windows WebKit does not consistently support the WebGL fixture; image fallbacks are checked separately.");
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  const supportsWebGL = await page.evaluate(() => {
    const context = document.createElement("canvas").getContext("webgl2");
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return Boolean(context);
  });
  await page.setContent('<div id="root"></div>'); await page.addScriptTag({ content: fixture });
  const canvas = page.locator("canvas");
  if (!supportsWebGL) {
    await expect(page.locator("#root div[aria-hidden='true']")).toHaveCSS("background-image", /workspace\.png/);
    await expect(canvas).toHaveCount(0);
    expect(errors).toEqual([]);
    return;
  }
  await expect(canvas).toHaveCount(1);
  await expect.poll(() => canvas.evaluate(element => element.style.opacity)).toBe("1");
  const before = await canvas.screenshot();
  await page.waitForTimeout(450);
  expect((await canvas.screenshot()).equals(before)).toBe(false);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(200);
  const still = await canvas.screenshot();
  await page.waitForTimeout(250);
  expect((await canvas.screenshot()).equals(still)).toBe(true);
  await page.emulateMedia({ reducedMotion: "no-preference" });
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
  for (const model of ["ideas", "tasks", "roadmap", "workspace"]) {
    const poster = await request.get(`/models/${model}.png`); expect(poster.ok()).toBe(true);
    const glb = await request.get(`/models/${model}.glb`); expect(glb.ok()).toBe(true);
    const bytes = await glb.body(); expect(bytes.subarray(0, 4).toString()).toBe("glTF"); expect(bytes.readUInt32LE(4)).toBe(2);
    if (model === "workspace") {
      const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
      expect(json.animations.length).toBeGreaterThan(0);
      expect(json.animations.flatMap((clip: { channels: unknown[] }) => clip.channels).length).toBeGreaterThan(10);
    }
  }
});
