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
        'pnpm --filter essor-router build && pnpm --filter unplugin-essor-router build && pnpm --filter essor-router-ts-plugin build && cd examples/file-routes && ../../node_modules/.bin/vite --host --port 3002 --strictPort',
      url: 'http://localhost:3002/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: '../../node_modules/.bin/vite --host --port 3003 --strictPort',
      cwd: 'examples/typed-router',
      url: 'http://localhost:3003/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: '../../node_modules/.bin/vite --host --port 3017 --strictPort',
      cwd: 'examples/config-router',
      url: 'http://localhost:3017/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: '../../node_modules/.bin/vite --host --port 3010 --strictPort',
      cwd: 'examples/basic',
      url: 'http://localhost:3010/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: '../../node_modules/.bin/vite --host --port 3011 --strictPort',
      cwd: 'examples/option-router',
      url: 'http://localhost:3011/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: '../../node_modules/.bin/vite --host --port 3012 --strictPort',
      cwd: 'examples/router-link',
      url: 'http://localhost:3012/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: '../../node_modules/.bin/vite --host --port 3013 --strictPort',
      cwd: 'examples/use-api',
      url: 'http://localhost:3013/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: '../../node_modules/.bin/vite --host --port 3014 --strictPort',
      cwd: 'examples/param-parsers',
      url: 'http://localhost:3014/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: '../../node_modules/.bin/vite --host --port 3015 --strictPort',
      cwd: 'examples/data-loaders',
      url: 'http://localhost:3015/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: '../../node_modules/.bin/vite --host --port 3016 --strictPort',
      cwd: 'examples/async-router',
      url: 'http://localhost:3016/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: '../../node_modules/.bin/vite --host --port 3020 --strictPort',
      cwd: 'examples/guards',
      url: 'http://localhost:3020/',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
