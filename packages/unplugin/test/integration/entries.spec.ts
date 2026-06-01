import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import unplugin from '../../src';
import vite from '../../src/vite';
import rollup from '../../src/rollup';
import esbuild from '../../src/esbuild';
import webpack from '../../src/webpack';
import rolldown from '../../src/rolldown';
import {
  MODULE_RESOLVER_PATH,
  MODULE_ROUTES_PATH,
  VIRTUAL_PREFIX,
} from '../../src/core/moduleConstants';

const roots = new Set<string>();

afterEach(async () => {
  for (const root of roots) await rm(root, { recursive: true, force: true });
  roots.clear();
});

async function createFixtureRoot() {
  const root = await mkdtemp(join(tmpdir(), 'unplugin-essor-router-entry-'));
  roots.add(root);
  const pagesDir = join(root, 'src/pages');
  const loadersDir = join(root, 'src/loaders');
  await mkdir(pagesDir, { recursive: true });
  await mkdir(loadersDir, { recursive: true });
  await writeFile(
    join(pagesDir, 'index.tsx'),
    `import homeLoader from '../loaders/home'
export default function Home(){ return homeLoader() }
`,
  );
  await writeFile(
    join(loadersDir, 'home.ts'),
    `export default function homeLoader(){ return null }\n`,
  );
  return root;
}

describe('unplugin framework entries', () => {
  it('creates smoke-testable plugins for every published bundler entry', async () => {
    const root = await createFixtureRoot();
    const options = { root, routesFolder: 'src/pages', watch: false };

    expect(vite(options).name).toBe('essor-router');
    expect(rollup(options).name).toBe('essor-router');
    expect(esbuild(options).name).toBe('essor-router');
    expect(webpack(options).apply).toBeTypeOf('function');
    expect(rolldown(options).name).toBe('essor-router');
  });

  it('resolves and loads route virtual modules through the shared core plugin', async () => {
    const root = await createFixtureRoot();
    const [corePlugin] = unplugin.raw(
      { root, routesFolder: 'src/pages', watch: false },
      { framework: 'vite' },
    );

    await corePlugin.buildStart?.call({} as never);

    expect(corePlugin.resolveId?.handler(MODULE_ROUTES_PATH)).toBe(
      `${VIRTUAL_PREFIX}${MODULE_ROUTES_PATH}`,
    );
    expect(corePlugin.resolveId?.handler(MODULE_RESOLVER_PATH)).toBe(
      `${VIRTUAL_PREFIX}${MODULE_RESOLVER_PATH}`,
    );

    const routesCode = await corePlugin.load?.handler(`${VIRTUAL_PREFIX}${MODULE_ROUTES_PATH}`);
    const resolverCode = await corePlugin.load?.handler(`${VIRTUAL_PREFIX}${MODULE_RESOLVER_PATH}`);

    expect(routesCode).toContain('export const routes =');
    expect(routesCode).toContain('index.tsx');
    expect(resolverCode).toContain('export const resolver');

    await corePlugin.buildEnd?.call({} as never);
  });

  it('adds the Vite-only data loader auto-export transform when configured', async () => {
    const root = await createFixtureRoot();
    const plugins = unplugin.raw(
      {
        root,
        routesFolder: 'src/pages',
        watch: false,
        autoExportsDataLoaders: 'src/loaders/**',
      },
      { framework: 'vite' },
    );
    const autoExportPlugin = plugins.find((plugin) => plugin.name.includes('data-loaders'));

    const transformed = await autoExportPlugin?.vite?.transform?.call(
      {} as never,
      `import homeLoader from '/src/loaders/home'
export default function Home(){ return null }
`,
      join(root, 'src/pages/index.tsx'),
    );
    const code = typeof transformed === 'string' ? transformed : transformed?.code;

    expect(autoExportPlugin?.name).toBe('essor-router:data-loaders-auto-export');
    expect(code).toContain('export const __loaders = [');
    expect(code).toContain('homeLoader');
  });
});
