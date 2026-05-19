import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const dirname = resolve(fileURLToPath(new URL('.', import.meta.url)));
const repoRoot = resolve(dirname, '../../');
const workspaceEssor = resolve(repoRoot, 'packages/core/src/index.ts');
const packageEssor = resolve(repoRoot, 'node_modules/essor/dist/essor.esm.js');

export default defineConfig({
  resolve: {
    alias: {
      '@/': `${resolve(dirname, 'src')}/`,
      'essor': existsSync(workspaceEssor) ? workspaceEssor : packageEssor,
    },
  },
  define: {
    __DEV__: true,
    __TEST__: true,
  },
  test: {
    name: 'router',
    include: ['test/**/*.spec.ts'],
    globals: true,
    environment: 'jsdom',
    watch: false,
    exclude: ['**/node_modules/**'],
  },
});
