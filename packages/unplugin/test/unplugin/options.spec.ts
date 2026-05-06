import { describe, expect, it } from 'vitest';
import { mergeAllExtensions, resolveOptions } from '../../src/options';
import { mockWarn } from '../utils';

describe('unplugin options', () => {
  mockWarn();

  it('uses code-file extensions by default (non-SFC)', () => {
    const options = resolveOptions({});
    expect(options.extensions).toEqual(['.tsx', '.ts', '.jsx', '.js']);
  });

  it('normalizes extensions and keeps leading dots', () => {
    const options = resolveOptions({
      extensions: ['essor', '.md'],
    });

    expect(options.extensions).toEqual(['.essor', '.md']);
    expect('Invalid extension "essor"').toHaveBeenWarned();
  });

  describe('mode and configRoutes', () => {
    it('defaults to file mode', () => {
      const options = resolveOptions({});
      expect(options.mode).toBe('file');
      expect(options.configRoutes).toBeUndefined();
    });

    it('requires configRoutes when mode is config', () => {
      expect(() => {
        resolveOptions({ mode: 'config' });
      }).toThrowError(/`configRoutes` is required when `mode` is set to "config"/);
    });

    it('resolves configRoutes to absolute path', () => {
      const options = resolveOptions({
        mode: 'config',
        configRoutes: 'my-routes.config.ts',
      });
      // The path should be resolved relative to root
      expect(options.configRoutes).toMatch(/my-routes\.config\.ts$/);
      // It shouldn't be the exact string we passed in if it resolved successfully (unless root is empty)
      expect(
        options.configRoutes?.startsWith('/') || options.configRoutes?.match(/^[A-Z]:\\/i),
      ).toBeTruthy();
    });
  });

  it('normalizes routesFolder, filePatterns, and exclude', () => {
    const options = resolveOptions({
      routesFolder: [
        'src/pages',
        {
          src: 'src/features',
          filePatterns: '*.page.tsx',
          exclude: 'src/features/ignored/**',
        },
      ],
      filePatterns: '*/index.tsx',
      exclude: 'src/pages/ignored/**',
    });

    expect(options.routesFolder.length).toBe(2);
    expect(options.routesFolder[0].src.endsWith('src/pages')).toBe(true);
    expect(options.routesFolder[1].filePatterns).toEqual(['*.page.tsx']);
    expect(options.routesFolder[1].exclude).toEqual(['src/features/ignored/**']);
    expect(options.filePatterns).toEqual(['*/index.tsx']);
    expect(options.exclude).toEqual(['src/pages/ignored/**']);
  });

  it('resolves experimental paramParsers and autoExportsDataLoaders', () => {
    const options = resolveOptions({
      experimental: {
        paramParsers: {
          dir: 'src/params',
        },
        autoExportsDataLoaders: ['src/loaders', 'src/extra-loaders'],
      },
    });

    expect(options.experimental?.paramParsers?.dir?.length).toBe(1);
    expect(options.experimental?.paramParsers?.dir?.[0]).toMatch(/src\/params$/);
    expect(options.experimental?.autoExportsDataLoaders).toEqual([
      expect.stringMatching(/src\/loaders$/),
      expect.stringMatching(/src\/extra-loaders$/),
    ]);
  });

  it('merges extensions across routesFolder overrides', () => {
    const options = resolveOptions({
      extensions: ['.tsx', '.md'],
      routesFolder: [
        { src: 'src/pages', extensions: ['.tsx', '.page.tsx'] },
        { src: 'src/features', extensions: (existing) => [...existing, '.feature.tsx'] },
      ],
    });

    const merged = mergeAllExtensions(options);
    expect(merged).toEqual(expect.arrayContaining(['.tsx', '.md', '.page.tsx', '.feature.tsx']));
  });
});
