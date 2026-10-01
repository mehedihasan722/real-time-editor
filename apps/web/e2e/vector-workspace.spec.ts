import { expect, test } from "@playwright/test";
import { build } from "esbuild";
import path from "node:path";

const state = `
import { LiveObject, LiveMap } from '@liveblocks/client';
import { useSyncExternalStore } from 'react';
export const storage = new LiveObject({ layers: new LiveMap() });
export let documents = [];
export let presence = { cursor: null, selection: [], dragging: [] };
let revision = 0;
const listeners = new Set();
export function emit() { revision++; for (const listener of listeners) listener(); }
export function subscribe() { useSyncExternalStore(listener => { listeners.add(listener); return () => listeners.delete(listener); }, () => revision, () => revision); }
export function updatePresence(value) { presence = { ...presence, ...value }; emit(); }
export async function commit({ changes }) {
  const result = [];
  for (const change of changes) {
    const previous = documents.find(layer => layer.layerId === change.layerId);
    if ((previous?.version ?? 0) !== change.expectedVersion) throw new Error('Version conflict');
    const document = { ...(change.layer ?? previous), ...(change.position ?? {}), layerId: change.layerId, version: change.expectedVersion + 1, deleted: change.layer === null && !change.position };
    documents = documents.filter(layer => layer.layerId !== change.layerId).concat(document);
    result.push({ layerId: change.layerId, version: document.version });
  }
  emit(); return result;
}
window.vectorFixture = {
  documents: () => documents,
  snapshot: () => storage.toJSON().layers,
  replayOlder: () => { const document = documents.find(layer => !layer.deleted); storage.get('layers').get(document.layerId).update({ x: 9999, version: document.version - 1 }); emit(); },
  abandon: () => { const document = documents.find(layer => !layer.deleted); storage.get('layers').set('abandoned', new LiveObject({ ...document, version: 0 })); emit(); },
};
`;
const fixture = (await build({
  stdin: { contents: `import React from 'react'; import { createRoot } from 'react-dom/client'; import Workspace from './src/engine/CanvasWorkspace'; createRoot(document.getElementById('root')).render(React.createElement(Workspace, { boardId: 'fixture-board' }));`, resolveDir: path.resolve("."), sourcefile: "vector-fixture.tsx" },
  bundle: true, write: false, format: "iife", platform: "browser", target: "es2022", jsx: "automatic",
  plugins: [{ name: "isolated-canvas-services", setup(build) {
    build.onResolve({ filter: /^fixture-state$/ }, () => ({ path: "state", namespace: "fixture" }));
    build.onResolve({ filter: /^convex\/react$/ }, () => ({ path: "convex", namespace: "fixture" }));
    build.onResolve({ filter: /^\.\/liveblocks\.config$/ }, args => args.importer.endsWith("CanvasWorkspace.tsx") ? { path: "liveblocks", namespace: "fixture" } : undefined);
    build.onResolve({ filter: /convex\/_generated\/api$/ }, () => ({ path: "api", namespace: "fixture" }));
    build.onResolve({ filter: /^next-themes$/ }, () => ({ path: "theme", namespace: "fixture" }));
    build.onResolve({ filter: /^next\/link$/ }, () => ({ path: "link", namespace: "fixture" }));
    build.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ resolveDir: path.resolve("."), loader: "tsx", contents:
      args.path === "state" ? state :
      args.path === "convex" ? `import { subscribe, documents, commit } from 'fixture-state'; export function usePaginatedQuery() { subscribe(); return { results: documents, status: 'Exhausted', loadMore: () => {} }; } export function useQuery() { return { title: 'Canvas fixture' }; } export function useMutation() { return commit; }` :
      args.path === "liveblocks" ? `import { useCallback } from 'react'; import { subscribe, storage, presence, updatePresence, emit } from 'fixture-state'; const others = []; const self = { canWrite: true }; export function useStorage(selector) { subscribe(); return selector(storage.toJSON()); } export function useMyPresence() { subscribe(); return [presence, updatePresence]; } export function useMutation(callback, deps) { return useCallback((...args) => { const result = callback({ storage }, ...args); emit(); return result; }, deps); } export function useOthers() { return others; } export function useSelf() { return self; } export function useStatus() { return 'connected'; }` :
      args.path === "api" ? `export const api = { board: { get: 'get' }, vector: { getBoardLayers: 'layers', commitLayers: 'commit' } };` :
      args.path === "theme" ? `export function useTheme() { return { resolvedTheme: 'light' }; }` :
      `import React from 'react'; export default function Link({ children, ...props }) { return <a {...props}>{children}</a>; }`,
    }));
  } }],
})).outputFiles![0].text;

test("actual canvas pointer and keyboard handlers draw, edit, move, cancel and delete", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.goto("/offline.html");
  await page.setContent(`<style>html,body,#root{width:100%;height:100%;margin:0}#root>div{position:relative;height:100vh;width:100%}canvas{width:100%;height:100%}header,nav,aside,footer{position:absolute}header{top:0;left:0;right:0}nav{left:0;top:80px;display:flex;flex-direction:column}aside{right:0;top:80px;width:200px}footer{bottom:0}.sr-only{position:absolute;left:-10000px}</style><div id="root"></div>`);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.addScriptTag({ content: fixture });
  const canvas = page.locator("canvas");
  const documents = () => page.evaluate(() => (window as unknown as { vectorFixture: { documents: () => { x: number; y: number; text: string; deleted: boolean }[] } }).vectorFixture.documents());
  await page.getByRole("button", { name: "Sticky note (N)", exact: true }).click();
  await canvas.click({ position: { x: 350, y: 250 } });
  await expect.poll(async () => (await documents()).length).toBe(1);
  const editor = page.getByRole("textbox", { name: "Layer text", exact: true });
  await expect(editor).toBeEnabled(); await editor.fill("Launch review"); await editor.press("Tab");
  await expect.poll(async () => (await documents())[0].text).toBe("Launch review");
  const rect = (await canvas.boundingBox())!;
  await page.mouse.move(rect.x + 375, rect.y + 275); await page.mouse.down();
  await page.mouse.move(rect.x + 425, rect.y + 325, { steps: 8 }); await page.mouse.up();
  await expect.poll(async () => (await documents())[0].x).toBe(280);
  await canvas.focus(); await page.keyboard.down("Space");
  await page.mouse.move(rect.x + 300, rect.y + 400); await page.mouse.down(); await page.mouse.move(rect.x + 350, rect.y + 450); await page.mouse.up(); await page.keyboard.up("Space");
  expect((await documents())[0].x).toBe(280);
  await page.getByRole("button", { name: "Ellipse (O)", exact: true }).click();
  await canvas.click({ position: { x: 400, y: 500 } });
  await expect.poll(async () => (await documents()).length).toBe(2);
  expect((await documents())[1].x).toBe(230);
  await canvas.focus(); await page.keyboard.press("Delete");
  await expect.poll(async () => (await documents())[1].deleted).toBe(true);
  await page.mouse.move(rect.x + 470, rect.y + 380); await page.mouse.down(); await page.mouse.move(rect.x + 500, rect.y + 410); await page.keyboard.press("Escape"); await page.mouse.up();
  expect((await documents())[0].x).toBe(280);
  await canvas.focus(); await page.keyboard.press("r"); await page.keyboard.press("Enter");
  await expect.poll(async () => (await documents()).length).toBe(3);
  const initial = (await documents())[2].x;
  await page.keyboard.press("Shift+ArrowRight");
  await expect.poll(async () => (await documents())[2].x).toBe(initial + 10);
  await page.evaluate(() => (window as unknown as { vectorFixture: { replayOlder: () => void } }).vectorFixture.replayOlder());
  const snapshot = () => page.evaluate(() => (window as unknown as { vectorFixture: { snapshot: () => Record<string, { x: number; text: string }> } }).vectorFixture.snapshot());
  await expect.poll(async () => Object.values(await snapshot()).find(layer => layer.text === "Launch review")?.x).toBe(280);
  await page.evaluate(() => (window as unknown as { vectorFixture: { abandon: () => void } }).vectorFixture.abandon());
  await expect.poll(async () => Object.hasOwn(await snapshot(), "abandoned"), { timeout: 10000 }).toBe(false);
  expect(errors).toEqual([]);
});
