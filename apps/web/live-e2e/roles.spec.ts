import { expect, test } from "@playwright/test";
test("members cannot open organization analytics", async ({ browser }) => {
  test.skip(!process.env.FLOWBOARD_E2E_MEMBER_STATE, "Requires a dedicated member session.");
  const context = await browser.newContext({ storageState: process.env.FLOWBOARD_E2E_MEMBER_STATE });
  try { const page = await context.newPage(); await page.goto("/admin"); await expect(page).toHaveURL(/\/$/); } finally { await context.close(); }
});
test("administrators can open analytics and export the loaded board report", async ({ browser }) => {
  test.skip(!process.env.FLOWBOARD_E2E_ADMIN_STATE, "Requires a dedicated administrator session.");
  const context = await browser.newContext({ storageState: process.env.FLOWBOARD_E2E_ADMIN_STATE });
  try {
    const page = await context.newPage(); await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /Workspace intelligence/ })).toBeVisible();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: /Export/ }).click();
    expect(await (await download).failure()).toBeNull();
  } finally { await context.close(); }
});
test("guests receive a read-only room and cannot edit or export", async ({ page, browser }) => {
  test.skip(!process.env.FLOWBOARD_E2E_GUEST_STATE, "Requires a guest session in the primary test organization.");
  await page.goto("/"); await page.getByRole("button", { name: /Create new|New Board/i }).first().click();
  await expect(page).toHaveURL(/\/board\//); const url = page.url();
  await page.getByRole("button", { name: "Close starter" }).click();
  const context = await browser.newContext({ storageState: process.env.FLOWBOARD_E2E_GUEST_STATE });
  try {
    const guest = await context.newPage(); await guest.goto(url);
    await expect(guest.getByText("Read-only guest access", { exact: true })).toBeVisible();
    await expect(guest.getByRole("button", { name: "Board files" })).toBeDisabled();
    await expect(guest.locator('[contenteditable="true"]')).toHaveCount(0);
  } finally {
    await context.close(); await page.getByRole("button", { name: "Main menu" }).click(); await page.getByRole("button", { name: "Delete", exact: true }).click(); await page.getByRole("button", { name: "Confirm", exact: true }).click();
  }
});
