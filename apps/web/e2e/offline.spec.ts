import { expect, test } from "@playwright/test";
test("offline navigation provides a recoverable fallback", async ({ page, context, browserName }) => {
  await page.goto("/offline.html");
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise<void>(resolve => navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true }));
  });
  await context.setOffline(true);
  try {
    // WebKit can report a transport error after the service worker renders the fallback.
    await page.goto("/board/offline-fixture").catch(error => { if (browserName !== "webkit" || !String(error).includes("internal error")) throw error; });
    await expect(page.getByRole("heading", { name: "You're offline" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  } finally { await context.setOffline(false); }
});
