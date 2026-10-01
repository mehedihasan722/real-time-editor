import { expect, test } from "@playwright/test";
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync("src/app/(dashboard)/admin/admin-dashboard.css", "utf8");
const fixture = (await build({
  stdin: { contents: `import React from 'react'; import { createRoot } from 'react-dom/client'; import { AdminMembers, OwnershipChart, WorkspaceWorld } from './src/app/(dashboard)/admin/admin-visualizations'; createRoot(document.getElementById('root')).render(<div className="admin-intelligence"><AdminMembers/><OwnershipChart owners={[{name:'Taylor',count:3},{name:'Alex',count:1}]} loading={false}/><WorkspaceWorld/></div>);`, loader: "tsx", resolveDir: path.resolve(".") },
  bundle: true, write: false, format: "iife", platform: "browser", jsx: "automatic", alias: { "@": path.resolve("src") },
  plugins: [{ name: "clerk-admin-fixture", setup(builder) {
    builder.onResolve({ filter: /^@clerk\/nextjs$/ }, () => ({ path: "clerk", namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ resolveDir: path.resolve("."), loader: "tsx", contents: `
      import { useSyncExternalStore } from 'react';
      let revision=0; const listeners=new Set(); window.adminChanges=[];
      const members=[{id:'self',role:'org:admin',roleName:'Admin',publicUserData:{userId:'user-self',firstName:'Taylor',identifier:'taylor@example.com'}},{id:'other',role:'org:member',roleName:'Member',publicUserData:{userId:'user-other',firstName:'Alex',identifier:'alex@example.com'}}];
      for(const member of members){member.update=async({role})=>{window.adminChanges.push({action:'role',id:member.id,role});member.role=role;};member.destroy=async()=>{window.adminChanges.push({action:'remove',id:member.id});members.splice(members.indexOf(member),1);};}
      const organization={getRoles:async()=>({data:[{key:'org:admin',name:'Admin'},{key:'org:member',name:'Member'},{key:'org:guest',name:'Guest'},{key:'org:owner',name:'Owner'}]})};
      const memberships={data:members,count:2,isLoading:false,isFetching:false,hasNextPage:false,hasPreviousPage:false,revalidate:async()=>{revision++;listeners.forEach(fn=>fn());}};
      export function useOrganization(){useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn);},()=>revision);return {organization,memberships};} export function useUser(){return {user:{id:'user-self'}};} export function useClerk(){return {openOrganizationProfile:()=>{}};}
    ` }));
  } }],
})).outputFiles[0].text;

for (const dark of [true, false]) test(`admin controls and charts in ${dark ? "dark" : "light"} mode`, async ({ page }) => {
  await page.route("**/maps/world.json", route => route.fulfill({ contentType: "application/json", body: fs.readFileSync("public/maps/world.json", "utf8") }));
  await page.goto("/");
  await page.setContent(`<html class="${dark ? "dark" : ""}"><head><style>body{margin:0;font-family:Arial}button,select{font:inherit}${css}</style></head><body><div id="root"></div></body></html>`);
  await page.addScriptTag({ content: fixture });
  const selfRole = page.getByRole("combobox", { name: "Role for Taylor" });
  await expect(selfRole).toBeDisabled();
  const role = page.getByRole("combobox", { name: "Role for Alex" });
  await expect(role).toBeEnabled();
  await expect(role.locator("option")).toHaveCount(3);
  await role.selectOption("org:admin");
  await page.getByRole("button", { name: "Save role", exact: true }).last().click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as { adminChanges: unknown[] }).adminChanges)).toEqual([]);
  await page.getByRole("button", { name: "Save role", exact: true }).last().click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { adminChanges: unknown[] }).adminChanges)).toEqual([{ action: "role", id: "other", role: "org:admin" }]);
  await page.getByRole("button", { name: "Remove", exact: true }).last().click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Role for Alex" })).toHaveCount(0);
  await expect(page.getByRole("img", { name: /Board ownership: Taylor, 3; Alex, 1/ })).toBeVisible();
  await expect(page.locator(".ai-map-land").first()).toBeAttached();
  await expect(page.getByText(/member geolocation/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
