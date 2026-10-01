import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import path from "node:path";

const fixture = (await build({
  stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {AssistUpload} from './src/app/board/[boardId]/_components/assist-upload';function App(){const [attachments,setAttachments]=React.useState([]);return <><AssistUpload attachments={attachments} onChange={setAttachments} disabled={false}/><output id="selected">{JSON.stringify(attachments)}</output></>}createRoot(document.getElementById('root')).render(<App/>);`, loader: "tsx", resolveDir: path.resolve(".") },
  bundle: true, write: false, format: "iife", platform: "browser", jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' }, alias: { "@": path.resolve("src") },
})).outputFiles[0].text;

test("Assist files are previewed, rejected safely, and removable without network requests", async ({ page }) => {
  const errors: string[] = []; const requests: string[] = [];
  page.on("pageerror", error => errors.push(error.message)); page.on("request", request => requests.push(request.url()));
  await page.setContent('<div id="root"></div>'); await page.addScriptTag({ content: fixture });
  await expect(page.getByRole("button", { name: "Upload folder", exact: true })).toBeVisible();
  await expect(page.getByLabel("Choose folder for Assist")).toHaveAttribute("webkitdirectory", "");
  await page.getByLabel("Choose files for Assist").setInputFiles([{ name: "plan.md", mimeType: "text/plain", buffer: Buffer.from("Launch checklist") }, { name: ".env", mimeType: "text/plain", buffer: Buffer.from("PRIVATE_KEY=secret") }, { name: "bad.png", mimeType: "image/png", buffer: Buffer.from("not an image") }]);
  await expect(page.getByRole("list", { name: "Attached files" })).toContainText("plan.md");
  await expect(page.getByRole("alert")).toContainText("skipped credential");
  await expect(page.getByRole("alert")).toContainText("Invalid image");
  await expect(page.locator("#selected")).toContainText("Launch checklist");
  await expect(page.locator("#selected")).not.toContainText("PRIVATE_KEY");
  await page.getByRole("button", { name: "Remove plan.md", exact: true }).click();
  await expect(page.locator("#selected")).toHaveText("[]");
  expect(requests).toEqual([]); expect(errors).toEqual([]);
});
