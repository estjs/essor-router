import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['./packages/router', './packages/unplugin'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'json', 'html'],
      include: ['packages/*/src/**'],
      exclude: [
        'packages/*/src/**/*.d.ts',
        'packages/router/src/config.ts',
        'packages/router/src/index.ts',
        'packages/router/src/experimental/index.ts',
        'packages/router/src/matcher/types.ts',
        'packages/router/src/types/utils.ts',
      ],
    },
  },
});
