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
    'index': './src/index.ts',
    'auto-routes': './src/auto-routes.ts',
    'auto-resolver': './src/auto-resolver.ts',
  },
  banner: {
    js: banner,
  },
  outDir: 'dist',
  format: ['cjs', 'esm'],
  target: 'es2016',
  dts: env !== 'production',
  shims: true,
  clean: true,
  sourcemap: false,
  cjsInterop: true,
  minify: env === 'production' ? true : false,
  tsconfig: './tsconfig.build.json',
  external: ['essor'],
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
