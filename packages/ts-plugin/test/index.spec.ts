import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import init from '../src/index';

describe('ts-plugin index', () => {
  it('intercepts essor-router resolution and writes proxy module', () => {
    const root = mkdtempSync(join(tmpdir(), 'ts-plugin-index-'));
    mkdirSync(join(root, 'app/routes/users'), { recursive: true });
    const containingFile = join(root, 'app/routes/users/[id].tsx');
    writeFileSync(containingFile, 'export default null', 'utf8');
    writeFileSync(
      join(root, 'typed-router.d.ts'),
      `declare module 'essor-router' {
  interface RouteNamedMap {
    'users-id': RouteRecordInfo<'users-id', '/users/:id', { id: string }>
  }
  interface _RouteFileInfoMap {
    'app/routes/users/[id].tsx': {
      routes: | 'users-id'
      views: never
    }
  }
}`,
      'utf8',
    );

    const plugin = init({ typescript: { server: { PluginCreateInfo: {} } } as any });

    const languageServiceHost: any = {
      resolveModuleNames(moduleNames: string[]) {
        return moduleNames.map(name => ({ resolvedFileName: `/resolved/${name}.d.ts` }));
      },
    };

    const info: any = {
      config: {
        moduleName: 'essor-router',
        routesFolder: 'app/routes',
        typedRouterDts: 'typed-router.d.ts',
      },
      languageServiceHost,
      languageService: {},
    };

    plugin.create(info);

    const result = info.languageServiceHost.resolveModuleNames(['essor-router'], containingFile);
    expect(
      result[0].resolvedFileName
        .replaceAll('\\\\', '/')
        .endsWith('node_modules/.essor-router/users-id.ts'),
    ).toBe(true);

    const generated = readFileSync(result[0].resolvedFileName, 'utf8');
    expect(generated).toContain("name: 'users-id'");
  });
});
