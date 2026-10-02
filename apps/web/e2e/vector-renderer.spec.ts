import { expect, test } from "@playwright/test";
import { buildSync } from "esbuild";
import path from "node:path";
declare global { interface Window { FlowboardRenderer: typeof import("../src/engine/renderer"); FlowboardGeometry: typeof import("../src/engine/geometry"); } }
const bundle = (file: string, globalName: string) => buildSync({ entryPoints: [path.resolve(file)], bundle: true, write: false, format: "iife", globalName, platform: "browser", target: "es2022" }).outputFiles[0].text;
const renderer = bundle("src/engine/renderer.ts", "FlowboardRenderer"), geometry = bundle("src/engine/geometry.ts", "FlowboardGeometry");
for (const dark of [false, true]) test(`Canvas 2D draws and hit-tests ${dark ? "dark" : "light"} layers at device pixel ratio 2`, async ({ page }) => {
  await page.goto("/offline.html"); await page.setContent('<canvas width="1600" height="1200"></canvas>');
  await page.addScriptTag({ content: renderer }); await page.addScriptTag({ content: geometry });
  const result = await page.evaluate(dark => {
    const canvas = document.querySelector("canvas")!, ctx = canvas.getContext("2d")!;
    const layer = { type: "rectangle" as const, x: 20, y: 30, width: 100, height: 100, fill: "rgba(99,102,241,1)", stroke: "rgba(0,0,0,1)", strokeWidth: 0, order: 1, version: 1, text: "", points: [] };
    const camera = { panX: 40, panY: 50, zoom: 2 };
    window.FlowboardRenderer.renderScene(ctx, [["a", layer]], camera, 800, 600, 2, dark, []);
    const position = window.FlowboardGeometry.screenToCanvas({ x: 180, y: 210 }, camera);
    return { pixel: [...ctx.getImageData(360, 420, 1, 1).data], hit: window.FlowboardGeometry.hitLayer(layer, position, camera.zoom), background: [...ctx.getImageData(10, 10, 1, 1).data] };
  }, dark);
  expect(result.pixel).toEqual([99, 102, 241, 255]); expect(result.hit).toBe(true);
  expect(result.background).toEqual(dark ? [11, 17, 32, 255] : [248, 250, 252, 255]);
});
