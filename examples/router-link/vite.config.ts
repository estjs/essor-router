import path from 'node:path';
import { defineConfig } from 'vite';
import essor from 'unplugin-essor/vite';
import Inspact from 'vite-plugin-inspect';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      'essor': path.resolve(__dirname, 'node_modules/essor'),
      '@estjs/signals': path.resolve(__dirname, 'node_modules/@estjs/signals'),
      '@/': `${path.resolve(__dirname, '/src')}/`,
    },
  },
  plugins: [essor(), Inspact()],
});
