import process from 'node:process';
import { defineConfig } from 'tsup';
import pkg from './package.json';

const env = process.env.NODE_ENV;

const banner = `/**
* ${pkg.name} v${pkg.version}
* (c) 2023-Present jiangxd <jiangxd2016@gmail.com>
* @license MIT
**/`;

export default defineConfig({
  entryPoints: {
    index: './src/index.ts',
    types: './src/types.ts',
    config: './src/config.ts',
    vite: './src/vite.ts',
    webpack: './src/webpack.ts',
    rollup: './src/rollup.ts',
    rolldown: './src/rolldown.ts',
    esbuild: './src/esbuild.ts',
  },
  banner: {
    js: banner,
  },
  outDir: 'dist',
  format: ['cjs', 'esm'],
  target: 'es2019',
  dts: env !== 'production',
  shims: true,
  clean: true,
  sourcemap: false,
  cjsInterop: true,
  minify: env === 'production',
  tsconfig: './tsconfig.build.json',
  external: [
    'essor-router',
    '@babel/generator',
    'ast-walker-scope',
    'chokidar',
    'json5',
    'local-pkg',
    'magic-string',
    'mlly',
    'pathe',
    'picomatch',
    'tinyglobby',
    'unplugin',
    'unplugin-utils',
    'yaml',
  ],
  define: {
    __DEV__: env !== 'production' ? 'true' : 'false',
    __TEST__: 'false',
  },
  outExtension({ format }) {
    return {
      js: `${env !== 'production' ? '.dev' : ''}.${format === 'esm' ? 'm' : 'c'}js`,
    };
  },
});
