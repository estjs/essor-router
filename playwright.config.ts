import process from 'node:process';
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'dot',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: 'http://localhost:3002',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'pnpm run build && pnpm --filter essor-file-routes-example run dev -- --strictPort',
      url: 'http://localhost:3002/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter essor-typed-router-example run dev -- --strictPort',
      url: 'http://localhost:3003/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter config-router run dev -- --strictPort',
      url: 'http://localhost:3017/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter essor-option-basic run dev -- --strictPort',
      url: 'http://localhost:3010/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter essor-router-option run dev -- --strictPort',
      url: 'http://localhost:3011/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter essor-router-link run dev -- --strictPort',
      url: 'http://localhost:3012/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter essor-router-use run dev -- --strictPort',
      url: 'http://localhost:3013/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter param-parsers run dev -- --strictPort',
      url: 'http://localhost:3014/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter data-loaders run dev -- --strictPort',
      url: 'http://localhost:3015/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter essor-eouter-async run dev -- --strictPort',
      url: 'http://localhost:3016/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter example-guards run dev -- --strictPort',
      url: 'http://localhost:3020/',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
