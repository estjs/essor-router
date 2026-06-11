import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const dirname = resolve(fileURLToPath(new URL('.', import.meta.url)));

export default defineConfig({
  resolve: {
    alias: {
      '@/': `${resolve(dirname, 'src')}/`,
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
