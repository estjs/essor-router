import process from 'node:process';
import { describe, expect, it } from 'vitest';
import unplugin, { DEFAULT_OPTIONS, resolveOptions } from '../../src';
import { MODULE_ROUTES_PATH, VIRTUAL_PREFIX } from '../../src/core/moduleConstants';
describe('unplugin entry', () => {
  it('exposes bundler adapters', () => {
    expect(unplugin.vite).toBeTypeOf('function');
    expect(unplugin.rollup).toBeTypeOf('function');
    expect(unplugin.webpack).toBeTypeOf('function');
    expect(unplugin.esbuild).toBeTypeOf('function');
    expect(unplugin.rolldown).toBeTypeOf('function');
  });

  it('exports defaults and resolver helpers', () => {
    expect(DEFAULT_OPTIONS.routesFolder).toBe('src/pages');
    const resolved = resolveOptions({ routesFolder: 'pages' });
    expect(resolved.routesFolder[0].src.endsWith('pages')).toBe(true);
  });

  it('creates a vite plugin that resolves virtual routes', async () => {
    const pluginResult = unplugin.vite({
      root: process.cwd(),
      routesFolder: 'packages/unplugin/test/unplugin/fixtures/pages',
      dts: false,
      logs: false,
    });
    const plugins = Array.isArray(pluginResult) ? pluginResult : [pluginResult];
    const main = plugins.find((plugin) => plugin.name === 'essor-router');

    expect(main).toBeDefined();

    const resolveId = (main as any)?.resolveId;
    const resolved =
      typeof resolveId === 'function'
        ? await resolveId(MODULE_ROUTES_PATH)
        : await resolveId?.handler?.(MODULE_ROUTES_PATH);

    expect(resolved).toContain(VIRTUAL_PREFIX);

    const load = (main as any)?.load;
    const loaded =
      typeof load === 'function' ? await load(resolved) : await load?.handler?.(resolved);
    expect(typeof loaded).toBe('string');
  });
});
