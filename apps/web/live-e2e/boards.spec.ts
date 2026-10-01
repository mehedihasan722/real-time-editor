import { expect, test } from "@playwright/test";

test("create, edit, collaborate, export and delete a test board", async ({ page, browser }) => {
  test.setTimeout(120000);
  await page.goto("/");
  await page.getByRole("button", { name: /Create new|New Board/i }).first().click();
  await expect(page).toHaveURL(/\/board\//);
  const boardUrl = page.url();
  const second = await browser.newContext({ storageState: process.env.FLOWBOARD_E2E_AUTH_STATE });
  try {
    await expect(page.getByRole("button", { name: "Board files" })).toBeVisible();
    await page.getByRole("button", { name: "Plan roadmap", exact: true }).click();
    const editor = page.locator('[contenteditable="true"]').first();
    await expect(editor).toBeVisible();
    const marker = `E2E collaboration ${Date.now()}`;
    await editor.fill(marker);
    const peer = await second.newPage();
    await peer.goto(boardUrl);
    await expect(peer.getByText(marker, { exact: true })).toBeVisible({ timeout: 20000 });
    for (const format of ["editable board", "PNG", "PDF"]) {
      await page.getByRole("button", { name: "Board files" }).click();
      const pending = page.waitForEvent("download");
      await page.getByRole("menuitem", { name: `Export ${format}`, exact: true }).click();
      const download = await pending;
      expect(await download.failure()).toBeNull();
    }
  } finally {
    await second.close();
    await page.goto(boardUrl);
    await page.getByRole("button", { name: "Main menu" }).click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.getByRole("button", { name: "Confirm", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
  }
});

test("an unrelated organization cannot authorize the board room", async ({ page, browser }) => {
  test.skip(!process.env.FLOWBOARD_E2E_OTHER_ORG_STATE, "Provide a second dedicated user in a different organization to verify the live tenant boundary.");
  await page.goto("/");
  await page.getByRole("button", { name: /Create new|New Board/i }).first().click();
  await expect(page).toHaveURL(/\/board\//);
  const room = new URL(page.url()).pathname.split("/").at(-1);
  const other = await browser.newContext({ storageState: process.env.FLOWBOARD_E2E_OTHER_ORG_STATE });
  try {
    const stranger = await other.newPage();
    await stranger.goto("/");
    const status = await stranger.evaluate(async id => (await fetch("/api/liveblocks-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ room: id }) })).status, room);
    expect(status).toBe(403);
  } finally {
    await other.close();
    await page.getByRole("button", { name: "Main menu" }).click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.getByRole("button", { name: "Confirm", exact: true }).click();
  }
});
