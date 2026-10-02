import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import path from "node:path";
import fs from "node:fs";
const compiledCss = fs.readdirSync(".next/static/chunks").filter(file => file.endsWith(".css")).map(file => fs.readFileSync(path.join(".next/static/chunks", file), "utf8")).join("\n");
const carouselCss = compiledCss + fs.readFileSync("src/app/home-carousel.css", "utf8") + "body{display:block!important;place-items:normal!important;min-height:100vh;padding:12px;margin:0;background:hsl(var(--background))!important;color:hsl(var(--foreground))!important}#root{width:100%;max-width:none}*{box-sizing:border-box}";

const fixture = (await build({
  stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {HomeCarousel} from './src/app/(dashboard)/_components/home-carousel';import {WorkspacePreferencesProvider,useWorkspacePreferences} from './src/providers/workspace-preferences-provider';function Preferences(){const {preferences,updatePreference}=useWorkspacePreferences();return <button onClick={()=>updatePreference('showGrid',!preferences.showGrid)}>Grid: {String(preferences.showGrid)}</button>}createRoot(document.getElementById('root')).render(<React.StrictMode><WorkspacePreferencesProvider><HomeCarousel/><Preferences/></WorkspacePreferencesProvider></React.StrictMode>);`, loader: "tsx", resolveDir: path.resolve(".") },
  plugins: [{ name: "next-link", setup(builder) { builder.onResolve({ filter: /^next\/(link|image)$/ }, args => ({ path: args.path, namespace: "mock" })); builder.onLoad({ filter: /.*/, namespace: "mock" }, args => ({ contents: args.path === "next/image" ? `import React from 'react';export default function Image({unoptimized,...props}){return <img {...props}/>}` : `import React from 'react';export default function Link(props){return <a {...props}/>}`, loader: "tsx", resolveDir: path.resolve(".") })); } }],
  bundle: true, write: false, format: "iife", platform: "browser", jsx: "automatic", define: { "process.env.NODE_ENV": '"development"' },
})).outputFiles[0].text;

test("carousel cycles, wraps and supports keyboard slide selection", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => { document.body.removeAttribute("style"); document.body.innerHTML = '<div id="root"></div>'; }); await page.addStyleTag({ content: carouselCss }); await page.addScriptTag({ content: fixture });
  await expect(page.getByRole("heading", { level: 1 })).toContainText("clear direction");
  await page.getByRole("button", { name: "Previous slide", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("spark");
  await page.getByRole("button", { name: "Next slide", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("clear direction");
  await page.getByRole("button", { name: /Show slide 2/ }).focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("focused work");
  await expect(page.getByRole("button", { name: /Show slide 2/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("link", { name: "Explore task templates" })).toHaveAttribute("href", "/templates");
});

test("saved preferences survive Strict Mode and blocked storage remains usable", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("flowboard-workspace-preferences", JSON.stringify({ showGrid: false, reducedMotion: true, highContrastCanvas: false })));
  await page.evaluate(() => { document.body.removeAttribute("style"); document.body.innerHTML = '<div id="root"></div>'; }); await page.addStyleTag({ content: carouselCss }); await page.addScriptTag({ content: fixture });
  await expect(page.getByRole("button", { name: "Grid: false" })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("flowboard-workspace-preferences")!).showGrid)).toBe(false);
  await page.reload();
  await page.evaluate(() => Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Storage blocked", "SecurityError"); } }));
  await page.evaluate(() => { document.body.removeAttribute("style"); document.body.innerHTML = '<div id="root"></div>'; }); await page.addStyleTag({ content: carouselCss }); await page.addScriptTag({ content: fixture });
  await page.getByRole("button", { name: "Grid: true" }).click();
  await expect(page.getByRole("button", { name: "Grid: false" })).toBeVisible();
  await expect(page.locator("html")).toHaveClass(/hide-board-grid/);
  expect(errors).toEqual([]);
});

for (const width of [320, 375, 768, 1024, 1440]) test(`carousel holds its height and images fit at ${width}px`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/");
  await page.evaluate(() => { document.body.removeAttribute("style"); document.body.innerHTML = '<div id="root"></div>'; }); await page.addStyleTag({ content: carouselCss });
  await page.addScriptTag({ content: fixture });
  const section = page.getByRole("region", { name: "Workspace inspiration" });
  const initial = await section.boundingBox();
  for (let slide = 0; slide < 3; slide++) {
    await expect(page.getByRole("img")).toBeVisible();
    await expect.poll(() => page.getByRole("img").evaluate(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)).toBe(true);
    const box = await section.boundingBox(); expect(box!.height).toBe(initial!.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("button", { name: "Next slide", exact: true }).click();
    await page.waitForTimeout(600);
  }
  if (width === 1440 || width === 375) { await page.screenshot({ path: path.resolve(`../../.local-tools/carousel-${testInfo.project.name}-${width}.png`) }); }
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  if (width === 1440 || width === 375) await page.screenshot({ path: path.resolve(`../../.local-tools/carousel-dark-${testInfo.project.name}-${width}.png`) });
  const art = await page.locator(".home-carousel__art").boundingBox(); const controls = await page.locator(".home-carousel__controls").boundingBox();
  expect(art!.y + art!.height).toBeLessThanOrEqual(controls!.y + 1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await page.getByRole("img").evaluate(image => getComputedStyle(image).animationName)).toBe("none");
});
