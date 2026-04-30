import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const dirname = resolve(fileURLToPath(new URL('.', import.meta.url)));
const repoRoot = resolve(dirname, '../../../');
const workspaceEssor = resolve(repoRoot, 'packages/core/src/index.ts');
export default defineConfig({
  resolve: {
    alias: {
      '@/': `${resolve(dirname, 'src')}/`,
      'essor': workspaceEssor,
    },
  },
  define: {
    __DEV__: true,
    __TEST__: true,
  },
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: [
        'playground/**/*',
        'playwright.config.ts',
        'examples/**/*',
        'scripts/**/*',
        '**/test/**',
        '**/*.d.ts',
        'src/config.ts',
        'src/index.ts',
        'src/experimental/index.ts',
        'src/matcher/types.ts',
        'src/types/utils.ts',
      ],
      reporter: ['text', 'json', 'html'],
    },
    globals: true,
    environment: 'jsdom',
    watch: false,
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
});
