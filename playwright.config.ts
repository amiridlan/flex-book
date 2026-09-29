import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests against the static web export (dist/), served by e2e/serve.mjs.
 * Run `npm run e2e` (builds first). Set PW_CHROMIUM_PATH to reuse a preinstalled
 * Chromium instead of the one `npx playwright install chromium` downloads.
 */
const PORT = 4173;
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 45_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    // Every test runs in Malaysia's timezone, like the demo's audience.
    timezoneId: 'Asia/Kuala_Lumpur',
    locale: 'en-MY',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { executablePath },
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `node e2e/serve.mjs ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
