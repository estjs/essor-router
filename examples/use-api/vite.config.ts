import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import essor from 'unplugin-essor/vite';
import inspect from 'vite-plugin-inspect';
import { defineConfig } from 'vite';

const dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@/': `${resolve(dirname, 'src')}/`,
    },
  },
  plugins: [essor(), inspect()],
});
