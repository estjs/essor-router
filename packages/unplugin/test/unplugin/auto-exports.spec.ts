import { describe, expect, it } from 'vitest';
import { createFilter } from 'unplugin-utils';
import { AutoExportLoaders, extractLoadersToExport } from '../../src/data-loaders/auto-exports';

describe('auto exports loaders', () => {
  it('extracts loader imports that match configured globs', () => {
    const code = `
import userLoader from '/src/loaders/user'
import { postLoader } from '/src/loaders/post'
import { helper } from '/src/utils/helper'
`;

    const exports = extractLoadersToExport(code, (id) => id.includes('/src/loaders/'), '/project');
    expect(exports).toEqual(['userLoader', 'postLoader']);
  });

  it('extracts loader imports relative to the transformed page', () => {
    const code = `
import homeLoader from '../loaders/home'
import { userLoader } from '../loaders/user'
import { helper } from '../utils/helper'
`;

    const exports = extractLoadersToExport(
      code,
      (id) => id.includes('/src/loaders/'),
      '/project',
      '/project/src/pages/home.tsx',
    );
    expect(exports).toEqual(['homeLoader', 'userLoader']);
  });

  it('matches page-relative extensionless loader imports against rooted extension globs', () => {
    const code = `
import homeLoader from '../loaders/home'
import { helper } from '../utils/helper'
`;

    const filterPaths = createFilter('src/loaders/**/*.ts', undefined, { resolve: '/project' });
    const exports = extractLoadersToExport(
      code,
      filterPaths,
      '/project',
      '/project/src/pages/home.tsx',
    );

    expect(exports).toEqual(['homeLoader']);
  });

  it('only transforms files matched by transformFilter', async () => {
    const plugin = AutoExportLoaders({
      transformFilter: ['**/*.tsx'],
      loadersPathsGlobs: ['/project/src/loaders/**'],
      root: '/project',
    });

    const code = `
import userLoader from '/src/loaders/user'
export default function Page() { return null }
`;

    const ignored = await plugin.transform?.call({} as never, code, '/project/src/pages/page.mdx');
    expect(ignored).toBeUndefined();

    const transformed = await plugin.transform?.call(
      {} as never,
      code,
      '/project/src/pages/page.tsx',
    );

    const resultCode = typeof transformed === 'string' ? transformed : transformed?.code;
    expect(resultCode).toContain('export const __loaders = [');
    expect(resultCode).toContain('userLoader');
  });

  it('transforms page-relative loader imports', async () => {
    const plugin = AutoExportLoaders({
      transformFilter: ['**/*.tsx'],
      loadersPathsGlobs: ['/project/src/loaders/**'],
      root: '/project',
    });

    const code = `
import homeLoader from '../loaders/home'
export default function Page() { return null }
`;

    const transformed = await plugin.transform?.call(
      {} as never,
      code,
      '/project/src/pages/home.tsx',
    );

    const resultCode = typeof transformed === 'string' ? transformed : transformed?.code;
    expect(resultCode).toContain('export const __loaders = [');
    expect(resultCode).toContain('homeLoader');
  });

  it('transforms page-relative extensionless loader imports with root-relative globs', async () => {
    const plugin = AutoExportLoaders({
      transformFilter: 'src/pages/**/*.tsx',
      loadersPathsGlobs: 'src/loaders/**/*.ts',
      root: '/project',
    });

    const code = `
import homeLoader from '../loaders/home'
export default function Page() { return null }
`;

    const transformed = await plugin.transform?.call(
      {} as never,
      code,
      '/project/src/pages/home.tsx',
    );

    const resultCode = typeof transformed === 'string' ? transformed : transformed?.code;
    expect(resultCode).toContain('export const __loaders = [');
    expect(resultCode).toContain('homeLoader');
  });
});
