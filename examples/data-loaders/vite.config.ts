import { defineConfig } from 'vite';
import essor from 'unplugin-essor/vite';
import router from 'unplugin-essor-router/vite';

export default defineConfig({
  plugins: [
    essor(),
    // In this example we might enable paramParsers to get stronger typing
    router({
      importMode: 'sync',
      experimental: {
        paramParsers: true,
      },
    }),
  ],
});
