import { expect, test } from "@playwright/test";

test("unconfigured workspaces show an actionable setup screen", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Connect your workspace" })).toBeVisible();
  await expect(page.getByText("NEXT_PUBLIC_CONVEX_URL", { exact: false })).toBeVisible();
  expect(errors).toEqual([]);
});
test("readiness and protected APIs fail clearly without service configuration", async ({ request }) => {
  const health = await request.get("/api/health");
  expect(health.status()).toBe(503);
  expect((await health.json()).status).toBe("not_ready");
  expect((await request.post("/api/liveblocks-auth", { data: { room: "test" } })).status()).toBe(503);
  expect((await request.post("/api/assist", { data: {} })).status()).toBe(503);
});
