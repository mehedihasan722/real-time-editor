import { expect, test } from "@playwright/test";
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync("src/app/spatial-design.css", "utf8");
const dashboardFixture = (await build({
  stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {SpatialDashboard} from './src/components/spatial-dashboard';function App(){const [route,setRoute]=React.useState('/templates');window.flowboardTestPath=route;return <main className="future-dashboard">{['/templates','/settings','/admin','/guide','/games'].map(path=><button key={path} onClick={()=>setRoute(path)}>Open {path}</button>)}<SpatialDashboard key={route}><section data-testid="content">Working page content</section></SpatialDashboard></main>}createRoot(document.getElementById('root')).render(<App/>);`, loader: "tsx", resolveDir: path.resolve(".") },
  plugins: [{ name: "dashboard-fixture", setup(builder) {
    builder.onResolve({ filter: /^next\/(navigation|image)$/ }, args => ({ path: args.path, namespace: "mock" }));
    builder.onLoad({ filter: /.*/, namespace: "mock" }, args => ({ contents: args.path === "next/navigation" ? `export function usePathname(){return window.flowboardTestPath}` : `import React from 'react';export default function Image({unoptimized,...props}){return <img {...props}/>}`, loader: "tsx", resolveDir: path.resolve(".") }));
  } }], bundle: true, write: false, format: "iife", platform: "browser", jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' },
})).outputFiles[0].text;
const fixture = (await build({
  stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {AuthExperience} from './src/components/auth/auth-experience';createRoot(document.getElementById('root')).render(<AuthExperience configured/>);`, loader: "tsx", resolveDir: path.resolve(".") },
  plugins: [{ name: "auth-fixture", setup(builder) {
    builder.onResolve({ filter: /^(@clerk\/nextjs|next\/(link|image))$/ }, args => ({ path: args.path, namespace: "mock" }));
    builder.onLoad({ filter: /.*/, namespace: "mock" }, args => ({ contents: args.path === "@clerk/nextjs" ? `import React from 'react';export function SignIn(){return <form aria-label="Sign in"><label>Email address<input type="email" autoComplete="email" required/></label><label>Password<input type="password" autoComplete="current-password" required/></label><button type="submit">Continue</button><a href="/sign-up">Create account</a></form>}export const SignUp=SignIn;` : args.path === "next/image" ? `import React from 'react';export default function Image({unoptimized,...props}){return <img {...props}/>}` : `import React from 'react';export default function Link(props){return <a {...props}/>}`, loader: "tsx", resolveDir: path.resolve(".") }));
  } }], bundle: true, write: false, format: "iife", platform: "browser", jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' },
})).outputFiles[0].text;

for (const width of [320, 375, 768, 1440]) test(`branded authentication fits at ${width}px without configured accounts`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height: 950 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  const response = await page.goto("/sign-in");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Big ideas. One shared space." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("being configured");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (width < 760) {
    const form = await page.locator(".auth-experience__form").boundingBox();
    const story = await page.locator(".auth-experience__story").boundingBox();
    expect(form!.y).toBeLessThan(story!.y);
  }
  await expect(page.getByRole("button", { name: "Pause 3D animation" })).toBeVisible();
  await page.getByRole("button", { name: "Pause 3D animation" }).click();
  await expect(page.getByRole("button", { name: "Play 3D animation" })).toHaveAttribute("aria-pressed", "true");
  if (width === 375 || width === 1440) await page.screenshot({ path: testInfo.outputPath(`sign-in-${width}.png`), fullPage: true });
  await page.getByRole("link", { name: /New here/ }).click();
  await expect(page.getByRole("heading", { name: "Start something great." })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("authentication shell preserves keyboard access to provider inputs", async ({ page }) => {
  await page.goto("/"); await page.setContent('<div id="root"></div>'); await page.addStyleTag({ content: css }); await page.addScriptTag({ content: fixture });
  await page.getByRole("textbox", { name: "Email address" }).fill("designer@example.test");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Password", { exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeFocused();
});

test("authentication preview never opens protected routes without configuration", async ({ request }) => {
  expect((await request.get("/board/test-board")).status()).toBe(503);
  expect((await request.post("/api/integrations", { data: { action: "search", query: "planning" } })).status()).toBe(503);
});

test("shared 3D banners cover every dashboard destination and preserve page content", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/"); await page.setContent('<div id="root"></div>'); await page.addStyleTag({ content: css }); await page.addScriptTag({ content: dashboardFixture });
  for (const route of ["/templates", "/settings", "/admin", "/guide", "/games"]) {
    await page.getByRole("button", { name: `Open ${route}`, exact: true }).click();
    await expect(page.locator(".spatial-route-banner h2")).toBeVisible();
    await expect(page.getByTestId("content")).toHaveText("Working page content");
    await expect(page.getByRole("button", { name: "Pause 3D animation" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await expect(page.locator(".spatial-route-banner h2")).toHaveCSS("color", "rgb(238, 241, 255)");
});
