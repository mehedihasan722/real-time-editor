import { expect, test } from "@playwright/test";
test("offline navigation provides a recoverable fallback", async ({ page, context, browserName }) => {
  // Playwright service-worker network emulation is only supported on Chromium.
  // Firefox's worker can still reach the live origin when setOffline(true) is used.
  test.skip(browserName === "firefox", "Firefox offline emulation does not reliably affect service-worker fetches; the recovery shell is checked separately.");
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

test("offline recovery shell explains synchronization and provides retry", async ({ page }) => {
  await page.goto("/offline.html");
  await expect(page.getByRole("heading", { name: "You're offline" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(page.getByText(/connection to load and sync/)).toBeVisible();
});
