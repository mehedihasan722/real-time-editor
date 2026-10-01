import { expect, test } from "@playwright/test";
import { buildSync } from "esbuild";
import fs from "node:fs";
import path from "node:path";

const css = ["src/app/globals.css", "src/app/(dashboard)/admin/admin-dashboard.css", "src/app/(dashboard)/games/games.css", "src/app/board/[boardId]/_components/comment-sidebar.css"].map(file => fs.readFileSync(file, "utf8").replace(/^@(?:config|import).*$/gm, "")).join("\n");
const bundle = buildSync({ stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {BoardStarter} from './src/app/board/[boardId]/_components/board-starter'; window.started=[]; createRoot(document.getElementById('starter')).render(<BoardStarter boardId="fixture" name="Mehedi" onGenerated={()=>{}} onClose={()=>{}} onStart={(template,prompt)=>window.started.push({template,prompt})}/>);`, resolveDir: process.cwd(), loader: "tsx" }, bundle: true, write: false, format: "iife", platform: "browser", target: "es2022", jsx: "automatic", tsconfigRaw: { compilerOptions: { jsx: "react-jsx" } }, define: { "process.env.NODE_ENV": JSON.stringify("production") }, alias: { "@": path.resolve("src") } }).outputFiles[0].text;

for (const dark of [false, true]) test(`${dark ? "dark" : "light"} workspace text contrast and starter actions`, async ({ page }) => {
  await page.route("**/api/assist", route => route.fulfill({ json: { generate: false, chat: false } }));
  await page.goto("/");
  await page.setContent(`<html class="${dark ? "dark" : ""}"><head><style>body{background:${dark ? "#070b18" : "#fff"};font-family:Arial} ${css}</style></head><body><div id="starter"></div><div style="position:absolute;top:900px">
    <div class="settings-panel"><div><h2>Preferences</h2><p data-contrast>Personal settings</p></div><div class="settings-theme-grid"><button><strong data-contrast>Theme</strong><small data-contrast>Follow device</small></button></div></div>
    <div class="board-data-table"><div class="board-data-table__toolbar"><span data-contrast>Loaded boards</span><button class="is-active" data-contrast>Selected view</button></div><table><tr><th data-contrast>Board title</th></tr><tr><td data-contrast>Updated today</td></tr></table></div>
    <div class="admin-intelligence"><div class="ai-panel"><div class="ai-metric"><small data-contrast>Metric description</small></div><div class="ai-search"><kbd data-contrast>Search shortcut</kbd></div><div class="ai-activity-item"><small data-contrast>Today</small></div><div class="ai-create"><button data-contrast>Create board</button></div></div><div class="ai-footer" data-contrast>Workspace report</div></div>
    <div class="flowboard-arcade"><p class="arcade-note" data-contrast>Local high scores</p><div class="arcade-instructions"><small data-contrast>Keyboard controls</small></div></div>
    <div class="comment-sidebar" style="position:relative;height:160px;top:0;bottom:auto"><div class="comment-sidebar__empty"><p data-contrast>No comments yet</p></div><div class="comment-sidebar__composer-label" data-contrast>Add a comment</div></div>
    <button data-contrast style="background:var(--clerk-surface);color:var(--clerk-foreground)">Organization selector</button><span data-contrast style="background:var(--clerk-surface);color:var(--clerk-muted)">Organization details</span>
    </div></body></html>`);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.addScriptTag({ content: bundle });
  await page.waitForTimeout(100);
  expect(errors).toEqual([]);
  await expect(page.getByRole("heading", { name: /Hey Mehedi/ })).toBeVisible();
  for (const [label, template] of [["Map a flow", "Flowchart"], ["Organize ideas", "Kanban"], ["Plan together", "Roadmap"]]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    expect(await page.evaluate(() => (window as unknown as { started: { template: string }[] }).started.at(-1)?.template)).toBe(template);
  }
  const failures = await page.evaluate(() => {
    const rgb = (value: string) => (value.match(/[\d.]+/g) || []).map(Number);
    const blend = (front: number[], back: number[]) => front.slice(0, 3).map((c, i) => c * (front[3] ?? 1) + back[i] * (1 - (front[3] ?? 1)));
    const luminance = (color: number[]) => color.slice(0, 3).map(c => c / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4).reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0);
    return Array.from(document.querySelectorAll('[data-contrast],.board-starter__modes button,.board-starter__composer>div,.board-starter__title-row p,.board-starter__availability')).flatMap(element => {
      const ancestors: Element[] = []; for (let node: Element | null = element; node; node = node.parentElement) ancestors.unshift(node);
      let background = [255, 255, 255]; for (const node of ancestors) background = blend(rgb(getComputedStyle(node).backgroundColor), background);
      const foreground = blend(rgb(getComputedStyle(element).color), background);
      const a = luminance(foreground), b = luminance(background), ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
      return ratio < 4.5 ? [{ text: element.textContent, ratio }] : [];
    });
  });
  expect(failures).toEqual([]);
});
