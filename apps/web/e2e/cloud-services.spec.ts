import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import path from "node:path";

const fixture = (await build({
  stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {BoardCloudServices} from './src/components/board-cloud-services';createRoot(document.getElementById('root')).render(<BoardCloudServices boardId="board_1" snapshot={()=>[]}/>);`, loader: "tsx", resolveDir: path.resolve(".") },
  bundle: true, write: false, format: "iife", platform: "browser", jsx: "automatic", define: { "process.env.NODE_ENV": '"production"', "process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY": '""', "process.env.NEXT_PUBLIC_POSTHOG_KEY": '""' }, alias: { "@": path.resolve("src") },
  plugins: [{ name: "next-script", setup(builder) { builder.onResolve({ filter: /^next\/script$/ }, args => ({ path: args.path, namespace: "mock" })); builder.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ contents: "export default function Script(){return null}", loader: "tsx" })); } }],
})).outputFiles[0].text;

test("cloud controls disclose configuration and only send explicitly requested board actions", async ({ page }) => {
  const errors: string[] = [], actions: Record<string, unknown>[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/api/integrations", async route => {
    if (route.request().method() === "GET") return route.fulfill({ json: { services: { supabase: true, resend: true, upstash: true, pinecone: true }, turnstileRequired: false } });
    actions.push(route.request().postDataJSON()); return route.fulfill({ json: { success: true } });
  });
  await page.goto("/"); await page.setContent('<div id="root"></div>'); await page.addScriptTag({ content: fixture });
  await page.getByRole("button", { name: "Cloud services", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText(/up to 3 MB/)).toBeVisible();
  await page.getByRole("button", { name: "Email board link to me", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("verified primary email");
  expect(actions).toEqual([{ action: "email", boardId: "board_1", turnstileToken: "" }]);
  await page.getByRole("button", { name: "Add title to semantic search", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("title indexed");
  page.once("dialog", dialog => void dialog.dismiss());
  await page.getByRole("button", { name: "Save latest cloud snapshot", exact: true }).click();
  expect(actions).toHaveLength(2);
  page.once("dialog", dialog => void dialog.accept());
  await page.getByRole("button", { name: "Save latest cloud snapshot", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("snapshot saved");
  expect(actions[2]).toEqual({ action: "backup", boardId: "board_1", turnstileToken: "", snapshot: { version: 1, layers: [] } });
  expect(errors).toEqual([]);
});
