import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    __DEV__: true,
    __TEST__: true,
  },
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      reporter: ['text', 'json', 'html'],
    },
    globals: true,
    environment: 'node',
    watch: false,
    exclude: ['**/node_modules/**'],
  },
});
