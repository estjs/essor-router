import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    __DEV__: true,
    __TEST__: true,
  },
  test: {
    name: 'unplugin',
    include: ['test/**/*.spec.ts'],
    globals: true,
    environment: 'node',
    watch: false,
    exclude: ['**/node_modules/**'],
  },
});
