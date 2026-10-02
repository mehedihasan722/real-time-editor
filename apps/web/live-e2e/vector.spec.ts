import { expect, test } from "@playwright/test";

test("Canvas 2D persists a note, synchronizes it with a peer and keeps it after reload", async ({ page, browser }) => {
  test.setTimeout(120000);
  await page.goto("/");
  await page.getByRole("button", { name: /Create new|New Board/i }).first().click();
  await expect(page).toHaveURL(/\/board\//);
  const boardUrl = page.url().split("?")[0];
  const peerContext = await browser.newContext({ storageState: process.env.FLOWBOARD_E2E_PEER_STATE ?? process.env.FLOWBOARD_E2E_AUTH_STATE });
  try {
    await page.goto(`${boardUrl}/engine`);
    const canvas = page.locator("canvas[aria-label^='Collaborative infinite canvas']");
    await expect(page.getByRole("button", { name: "Sticky note (N)", exact: true })).toBeEnabled({ timeout: 30000 });
    await page.getByRole("button", { name: "Sticky note (N)", exact: true }).click();
    await canvas.click({ position: { x: 350, y: 250 } });
    const editor = page.getByRole("textbox", { name: "Layer text", exact: true });
    await expect(editor).toBeEnabled();
    const marker = `Vector collaboration ${Date.now()}`;
    await editor.fill(marker); await editor.press("Tab");
    await expect(page.getByRole("status").filter({ hasText: "Canvas 2D · Connected" })).toBeVisible();
    const peer = await peerContext.newPage(); await peer.goto(`${boardUrl}/engine`);
    const peerCanvas = peer.locator("canvas[aria-label^='Collaborative infinite canvas']");
    await expect(peer.getByRole("button", { name: "Select (V)", exact: true })).toBeVisible();
    await peerCanvas.focus(); await peerCanvas.press("PageDown");
    await expect(peer.getByRole("textbox", { name: "Layer text", exact: true })).toHaveValue(marker, { timeout: 20000 });
    await page.reload();
    await expect(page.getByRole("button", { name: "Select (V)", exact: true })).toBeVisible();
    await canvas.focus(); await canvas.press("PageDown");
    await expect(editor).toHaveValue(marker);
  } finally {
    await peerContext.close(); await page.goto(boardUrl);
    await page.getByRole("button", { name: "Main menu" }).click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.getByRole("button", { name: "Confirm", exact: true }).click();
  }
});
