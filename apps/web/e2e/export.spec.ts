import { expect, test } from "@playwright/test";
import { buildSync } from "esbuild";
import path from "node:path";

declare global {
  interface Window { FlowboardExport: typeof import("../src/lib/board-export"); }
}

const bundle = buildSync({ entryPoints: [path.resolve("src/lib/board-export.ts")], bundle: true, write: false, format: "iife", globalName: "FlowboardExport", platform: "browser", target: "es2022" }).outputFiles[0].text;

for (const dark of [false, true]) test(`${dark ? "dark" : "light"} PNG and PDF exports retain scoped note styling and omit selection overlays`, async ({ page }) => {
  await page.setContent(`<style>.board-canvas{background:${dark ? "rgb(9,14,28)" : "white"}} .fixture .note{background:rgb(255,229,114);color:rgb(30,41,59);font:20px Arial;display:flex;width:100%;height:100%}</style><div class="fixture board-canvas"><svg width="400" height="300"><g id="content"><foreignObject x="20" y="20" width="200" height="180"><div xmlns="http://www.w3.org/1999/xhtml" class="note" contenteditable="true">Launch plan</div></foreignObject><rect data-export-selection="true" x="20" y="20" width="200" height="180" fill="red" /></g></svg></div>`);
  await page.addScriptTag({ content: bundle });
  const result = await page.evaluate(async () => {
    const rendered = await window.FlowboardExport.renderBoardPng(document.querySelector("#content")!, [{ type: 4, x: 20, y: 20, width: 200, height: 180, fill: { r: 255, g: 229, b: 114, a: 1 }, value: "Launch plan" }]);
    const image = new Image(); image.src = rendered.png; await image.decode();
    const canvas = document.createElement("canvas"); canvas.width = rendered.width; canvas.height = rendered.height;
    const context = canvas.getContext("2d")!; context.drawImage(image, 0, 0);
    const color = Array.from(context.getImageData(60, 120, 1, 1).data);
    const background = Array.from(context.getImageData(1, 1, 1, 1).data);
    const pdf = await window.FlowboardExport.createBoardPdf(rendered);
    return { color, background, header: await pdf.slice(0, 5).text(), png: rendered.png.slice(0, 22), leaked: document.querySelectorAll('[style*="-20000px"]').length };
  });
  expect(result.color).toEqual([255, 229, 114, 255]);
  expect(result.background).toEqual(dark ? [9, 14, 28, 255] : [255, 255, 255, 255]);
  expect(result.header).toBe("%PDF-");
  expect(result.png).toBe("data:image/png;base64,");
  expect(result.leaked).toBe(0);
});
