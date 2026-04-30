import { describe, expect, it } from 'vitest';
import { resolvePluginConfig } from '../src/config';

describe('resolvePluginConfig', () => {
  it('fills defaults', () => {
    expect(resolvePluginConfig(undefined)).toEqual({
      moduleName: 'essor-router',
      routesFolder: 'src/pages',
      typedRouterDts: 'typed-router.d.ts',
    });
  });

  it('applies custom overrides', () => {
    expect(
      resolvePluginConfig({
        moduleName: 'custom-router',
        routesFolder: 'app/pages',
        typedRouterDts: 'types/router.d.ts',
      }),
    ).toEqual({
      moduleName: 'custom-router',
      routesFolder: 'app/pages',
      typedRouterDts: 'types/router.d.ts',
    });
  });
});
