import { defineConfig, devices } from "@playwright/test";

if (!process.env.FLOWBOARD_E2E_AUTH_STATE) throw new Error("Set FLOWBOARD_E2E_AUTH_STATE to a Playwright storage-state file for a dedicated test user with an active test organization.");
export default defineConfig({
  testDir: "./live-e2e", workers: 1, retries: 0,
  use: { baseURL: process.env.FLOWBOARD_E2E_URL ?? "http://127.0.0.1:3101", storageState: process.env.FLOWBOARD_E2E_AUTH_STATE, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.FLOWBOARD_E2E_URL ? undefined : { command: "npm run start -- --port 3101 --hostname 127.0.0.1", url: "http://127.0.0.1:3101/logo.svg", reuseExistingServer: false },
});
