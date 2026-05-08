import { defineConfig } from 'vite';
import essor from 'unplugin-essor/vite';
import router from 'unplugin-essor-router/vite';

export default defineConfig({
  plugins: [
    essor(),
    router({
      mode: 'config',
      configRoutes: 'src/routes.config.ts',
      dts: 'typed-router.d.ts',
    }),
  ],
});
