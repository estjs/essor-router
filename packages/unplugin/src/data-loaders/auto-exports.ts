import { cwd } from 'node:process';
import { createFilter } from 'unplugin-utils';
import MagicString from 'magic-string';
import { findStaticImports, parseStaticImport } from 'mlly';
import { dirname, extname, resolve } from 'pathe';
import { isObject } from '@estjs/shared';
import type { StringFilter, UnpluginOptions } from 'unplugin';
import type { Plugin } from 'vite';

const RESOLVE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts'];

export function extractLoadersToExport(
  code: string,
  filterPaths: (id: string) => boolean,
  root: string,
  importer?: string,
): string[] {
  const imports = findStaticImports(code);
  const importNames = imports.flatMap((i) => {
    const parsed = parseStaticImport(i);

    const specifier = resolveImportSpecifier(parsed.specifier, root, importer);

    if (!getImportSpecifierCandidates(specifier).some(filterPaths)) return [];

    return [parsed.defaultImport, ...Object.values(parsed.namedImports || {})].filter(
      (value): value is string => !!value && !value.startsWith('_'),
    );
  });

  return importNames;
}

function resolveImportSpecifier(specifier: string, root: string, importer?: string): string {
  if (specifier.startsWith('/')) {
    return resolve(root, specifier.slice(1));
  }

  if (specifier.startsWith('.') && importer) {
    return resolve(dirname(importer.split('?')[0]!), specifier);
  }

  return resolve(root, specifier);
}

function getImportSpecifierCandidates(specifier: string): string[] {
  if (extname(specifier)) return [specifier];

  const candidates = [specifier];
  for (const extension of RESOLVE_EXTENSIONS) {
    candidates.push(`${specifier}${extension}`, resolve(specifier, `index${extension}`));
  }
  return candidates;
}

const PLUGIN_NAME = 'essor-router:data-loaders-auto-export';

/**
 * {@link AutoExportLoaders} options.
 */
export interface AutoExportLoadersOptions {
  /**
   * Filter page components to apply the auto-export.
   */
  transformFilter: StringFilter;

  /**
   * Globs to match the paths of the loaders.
   */
  loadersPathsGlobs: string | string[];

  /**
   * Root of the project. All paths are resolved relatively to this one.
   * @default `process.cwd()`
   */
  root?: string;
}

function isObjectFilter(filter: StringFilter): filter is {
  include?: string | RegExp | Array<string | RegExp>;
  exclude?: string | RegExp | Array<string | RegExp>;
} {
  return (
    !!filter &&
    isObject(filter) &&
    !Array.isArray(filter) &&
    ('include' in filter || 'exclude' in filter)
  );
}

/**
 * Vite plugin to automatically export data loaders from page components.
 */
export function AutoExportLoaders({
  transformFilter,
  loadersPathsGlobs,
  root = cwd(),
}: AutoExportLoadersOptions): Plugin {
  const filterPaths = createFilter(loadersPathsGlobs, undefined, { resolve: root });
  const isTransformTarget = isObjectFilter(transformFilter)
    ? createFilter(transformFilter.include, transformFilter.exclude, { resolve: root })
    : createFilter(transformFilter, undefined, { resolve: root });

  return {
    name: PLUGIN_NAME,
    enforce: 'post',
    transform(code, id) {
      if (!isTransformTarget(id)) return;

      const loadersToExports = extractLoadersToExport(code, filterPaths, root, id);
      if (loadersToExports.length <= 0) return;

      const s = new MagicString(code);
      s.append(`\nexport const __loaders = [\n${loadersToExports.join(',\n')}\n];\n`);

      return {
        code: s.toString(),
        map: s.generateMap(),
      };
    },
  };
}

export function createAutoExportPlugin(options: AutoExportLoadersOptions): UnpluginOptions {
  return {
    name: PLUGIN_NAME,
    vite: AutoExportLoaders(options) as any,
  };
}
