import { describe, expect, it } from 'vitest';
import {
  AutoExportLoaders,
  extractLoadersToExport,
} from '../../src/data-loaders/auto-exports';

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
});
