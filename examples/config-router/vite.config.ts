import { defineConfig } from 'vite';
import essor from 'unplugin-essor/vite';
import router from 'essor-router-unplugin/vite';

export default defineConfig({
  plugins: [
    essor(),
    // In this example we might enable paramParsers to get stronger typing
    router({
      mode: 'config',
      configRoutes: 'src/routes.config.ts',
      importMode: 'sync',
      experimental: {
        paramParsers: true,
      },
    }),
  ],
});
