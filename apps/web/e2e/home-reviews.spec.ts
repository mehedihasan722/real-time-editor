import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import path from "node:path";
import fs from "node:fs";

const css = fs.readdirSync(".next/static/chunks").filter(file => file.endsWith(".css")).map(file => fs.readFileSync(path.join(".next/static/chunks", file), "utf8")).join("\n") + fs.readFileSync("src/app/home-reviews.css", "utf8") + "body{padding:12px;margin:0}*{box-sizing:border-box}";
const fixture = (await build({
  stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {HomeReviews} from './src/app/(dashboard)/_components/home-reviews';createRoot(document.getElementById('root')).render(<HomeReviews/>);`, loader: "tsx", resolveDir: path.resolve(".") },
  plugins: [{ name: "next-link", setup(builder) { builder.onResolve({ filter: /^next\/link$/ }, args => ({ path: args.path, namespace: "mock" })); builder.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ contents: `import React from 'react';export default function Link(props){return <a {...props}/>}`, loader: "tsx", resolveDir: path.resolve(".") })); } }],
  bundle: true, write: false, format: "iife", platform: "browser", jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' },
})).outputFiles[0].text;

async function mount(page: import("@playwright/test").Page) {
  await page.goto("/"); await page.setContent('<div id="root"></div>');
  await page.addStyleTag({ content: css }); await page.addScriptTag({ content: fixture });
}

test("sample reviews are clearly labeled, wrap, and support keyboard selection", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await mount(page);
  await expect(page.getByRole("heading", { name: /Good work/ })).toBeVisible();
  await expect(page.getByText("Sample reviews · design preview", { exact: true })).toBeVisible();
  await expect(page.locator(".home-reviews__card.is-current")).toContainText("Sample reviewer");
  await page.getByRole("button", { name: "Previous review", exact: true }).click();
  await expect(page.locator(".home-reviews__card.is-current")).toContainText("Workshop team");
  await page.getByRole("button", { name: "Next review", exact: true }).click();
  await expect(page.locator(".home-reviews__card.is-current")).toContainText("Product team");
  await page.getByRole("button", { name: "Show review 2: Design", exact: true }).focus(); await page.keyboard.press("Enter");
  await expect(page.locator(".home-reviews__card.is-current")).toContainText("Design team");
  await expect(page.getByRole("button", { name: "Show review 2: Design" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("link", { name: "Find your starting point" })).toHaveAttribute("href", "/templates");
  expect(errors).toEqual([]);
});

for (const width of [320, 375, 768, 1440]) test(`review cards fit and honor reduced motion at ${width}px`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height: 1000 }); await page.emulateMedia({ reducedMotion: "reduce" }); await mount(page);
  const section = page.getByRole("region", { name: "Community reviews" });
  const initial = await section.boundingBox();
  for (let index = 1; index <= 3; index++) {
    await page.getByRole("button", { name: `Show review ${index}:`, exact: false }).click();
    const card = page.locator(".home-reviews__card.is-current");
    await expect(card).toHaveCSS("transition-duration", "0s");
    expect(await card.evaluate(element => element.scrollHeight <= element.clientHeight)).toBe(true);
    const box = await section.boundingBox(); expect(box!.height).toBe(initial!.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  if (width === 1440 || width === 375) await section.screenshot({ path: path.resolve(`../../.local-tools/reviews-${testInfo.project.name}-${width}.png`) });
});
