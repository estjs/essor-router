import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import essor from 'unplugin-essor/vite';
import router from 'unplugin-essor-router/vite';
import { defineConfig } from 'vite';

const dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@/': `${resolve(dirname, 'src')}/`,
    },
  },
  plugins: [
    essor(),
    router({
      mode: 'config',
      configRoutes: 'src/routes.config.ts',
      dts: 'typed-router.d.ts',
    }),
  ],
});
