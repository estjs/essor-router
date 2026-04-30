import { defineConfig } from 'vite';
import essor from 'unplugin-essor/vite';
import router from 'essor-router-unplugin/vite';

export default defineConfig({
  plugins: [essor(), router({ importMode: 'sync' })],
});
