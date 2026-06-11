import process from 'node:process';
import { defineConfig, devices } from '@playwright/test';

function getWebServerEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) env[key] = value;
  }
  env.CHOKIDAR_USEPOLLING = '1';
  return env;
}

const webServerEnv = getWebServerEnv();

function createViteWebServer(filter: string, port: number, options: { build?: boolean } = {}) {
  const command = `pnpm --filter ${filter} exec vite --host 127.0.0.1 --port ${port} --strictPort`;
  return {
    command: options.build ? `pnpm run build && ${command}` : command,
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: !process.env.CI,
    env: webServerEnv,
  };
}

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
    baseURL: 'http://127.0.0.1:3002',

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
    createViteWebServer('essor-file-routes-example', 3002, { build: true }),
    createViteWebServer('essor-typed-router-example', 3003),
    createViteWebServer('config-router', 3017),
    createViteWebServer('essor-option-basic', 3010),
    createViteWebServer('essor-router-option', 3011),
    createViteWebServer('essor-router-link', 3012),
    createViteWebServer('essor-router-use', 3013),
    createViteWebServer('param-parsers', 3014),
    createViteWebServer('data-loaders', 3015),
    createViteWebServer('essor-router-async', 3016),
    createViteWebServer('example-guards', 3020),
  ],
});
