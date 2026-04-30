import process from 'node:process';
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

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
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
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
      command:
        'pnpm --filter essor-router build && pnpm --filter essor-router-unplugin build && pnpm --filter essor-router-ts-plugin build && pnpm -C examples/file-routes run dev',
      url: 'http://localhost:3002/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm -C examples/typed-router run dev',
      url: 'http://localhost:3003/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm -C examples/config-router exec vite --host --port 3017 --strictPort',
      url: 'http://localhost:3017/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm -C examples/basic exec vite --host --port 3010 --strictPort',
      url: 'http://localhost:3010/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm -C examples/option-router exec vite --host --port 3011 --strictPort',
      url: 'http://localhost:3011/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm -C examples/router-link exec vite --host --port 3012 --strictPort',
      url: 'http://localhost:3012/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm -C examples/use-api exec vite --host --port 3013 --strictPort',
      url: 'http://localhost:3013/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm -C examples/param-parsers exec vite --host --port 3014 --strictPort',
      url: 'http://localhost:3014/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm -C examples/data-loaders exec vite --host --port 3015 --strictPort',
      url: 'http://localhost:3015/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm -C examples/async-router exec vite --host --port 3016 --strictPort',
      url: 'http://localhost:3016/',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
