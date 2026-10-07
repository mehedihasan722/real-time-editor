import { expect, test } from "@playwright/test";

for (const theme of ["light", "dark"]) {
  for (const width of [320, 768, 1440]) {
    test(`public landing page: ${theme}, ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript(theme => localStorage.setItem("theme", theme), theme);
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      const response = await page.goto("/welcome");
      expect(response?.status()).toBe(200);
      await expect(page.locator(".editorial-skip")).toHaveCSS("clip-path", "inset(50%)");
      await expect(page.getByRole("heading", { level: 1 })).toContainText("what’s next.");
      await expect(page.locator("html")).toHaveClass(new RegExp(theme));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(page.getByRole("link", { name: "Start creating" })).toHaveAttribute("href", "/sign-up");
      await page.getByRole("link", { name: "How it works" }).click();
      await expect(page).toHaveURL(/#workflow$/);
      await expect(page.locator("#workflow h2")).toBeInViewport();
      await expect(page.getByRole("button", { name: "Pause 3D animation" })).toBeVisible();
      await page.getByRole("button", { name: "Pause 3D animation" }).click();
      await expect(page.getByRole("button", { name: "Play 3D animation" })).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator(".editorial-asterisk")).toHaveCSS("animation-name", "none");
      const contrastFailures = await page.evaluate(() => {
        const rgb = (value: string) => (value.match(/[\d.]+/g) || []).map(Number);
        const blend = (front: number[], back: number[]) => front.slice(0, 3).map((c, i) => c * (front[3] ?? 1) + back[i] * (1 - (front[3] ?? 1)));
        const luminance = (color: number[]) => color.slice(0, 3).map(c => c / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4).reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0);
        return Array.from(document.querySelectorAll('.editorial-kicker,.editorial-hero__bottom p,.editorial-pill,.editorial-project__meta,.editorial-principles article p,.workflow-showcase__steps p,.editorial-footer nav a,.editorial-footer__bottom')).flatMap(element => {
          const ancestors: Element[] = []; for (let node: Element | null = element; node; node = node.parentElement) ancestors.unshift(node);
          let background = [255, 255, 255]; for (const node of ancestors) background = blend(rgb(getComputedStyle(node).backgroundColor), background);
          const foreground = blend(rgb(getComputedStyle(element).color), background);
          const a = luminance(foreground), b = luminance(background), ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
          return ratio < 4.5 ? [{ text: element.textContent, ratio }] : [];
        });
      });
      expect(contrastFailures).toEqual([]);
      const destinations = await page.locator(".editorial-footer nav a").evaluateAll(links => links.map(link => link.getAttribute("href")));
      expect(destinations).toEqual(["/", "/templates", "/guide", "/settings"]);
      await page.screenshot({ path: testInfo.outputPath(`welcome-${theme}-${width}.png`), fullPage: true });
      expect(errors).toEqual([]);
    });
  }
}

test("appearance control changes the landing theme without leaving the page", async ({ page }) => {
  await page.goto("/welcome");
  await page.getByRole("button", { name: "Change appearance" }).click();
  await page.getByRole("menuitem", { name: "Light", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/light/);
  await page.getByRole("button", { name: "Change appearance" }).click();
  await page.getByRole("menuitem", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("public marketing access does not open protected workspace APIs", async ({ request }) => {
  expect((await request.get("/welcome")).status()).toBe(200);
  expect((await request.get("/admin")).status()).toBe(503);
  expect((await request.post("/api/liveblocks-auth", { data: { room: "test" } })).status()).toBe(503);
});


test("skip link is visible on keyboard focus with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/welcome");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await expect(page.locator(".editorial-skip")).toHaveCSS("clip-path", "none");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
});
