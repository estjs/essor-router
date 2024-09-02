import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const dirname = resolve();
export default defineConfig({
  resolve: {
    alias: {
      '@/': `${resolve(dirname, 'src')}/`,
      '@/tests/': `${resolve(dirname, 'tests')}/`,
    },
  },
  define: {
    __DEV__: true,
    __TEST__: true,
  },
  test: {
    coverage: {
      provider: 'istanbul',
      include: ['src/**'],
      exclude: [
        'playground/**/*',
        'playwright.config.ts',
        'examples/**/*',
        'scripts/**/*',
        '**/test/**',
      ],
      reporter: ['text', 'json', 'html'],
    },
    globals: true,
    environment: 'jsdom',
    watch: false,
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
});
