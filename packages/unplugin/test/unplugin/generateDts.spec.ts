import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { PrefixTree } from '../../src/core/tree';
import { resolveOptions } from '../../src/options';
import { loadConfigRoutes } from '../../src/core/configSource';
import { generateDTS } from '../../src/codegen/generateDTS';
import { generateRouteNamedMap } from '../../src/codegen/generateRouteMap';
import { generateRouteTreeMap } from '../../src/codegen/generateRouteTree';
import { generateRouteFileInfoMap } from '../../src/codegen/generateRouteFileInfoMap';
import {
  generateParamParserCustomType,
  generateParamParsersTypesDeclarations,
} from '../../src/codegen/generateParamParsers';

const __dirname = (() => {
  if (import.meta.url.startsWith('file:')) {
    try {
      return fileURLToPath(new URL('.', import.meta.url));
    } catch {
      // fall through to cwd-based fallback in non-standard test runners
    }
  }
  const rooted = resolve(process.cwd(), 'router/packages/unplugin/test/unplugin');
  return existsSync(rooted) ? rooted : process.cwd();
})();

const normalizedTestRoot = __dirname.replaceAll('\\', '/');

function normalizeSnapshotPaths(value: string) {
  return value.replaceAll('\\', '/').replaceAll(normalizedTestRoot, '<TEST_ROOT>');
}

/**
 * Builds a standard test route tree with common route patterns for file-based routing:
 */
function buildFileTestTree() {
  const options = resolveOptions({ root: __dirname });
  const tree = new PrefixTree(options);

  // simulate file router insertions
  tree.insertParsedPath('index', resolve(options.root, 'src/pages/index.tsx'));
  tree.insertParsedPath('about', resolve(options.root, 'src/pages/about.tsx'));
  tree.insertParsedPath('users/[id]', resolve(options.root, 'src/pages/users/[id].tsx'));
  tree.insertParsedPath(
    'users/[id]/posts',
    resolve(options.root, 'src/pages/users/[id]/posts.tsx'),
  );
  tree.insertParsedPath('[...all]', resolve(options.root, 'src/pages/[...all].tsx'));

  return { tree, options };
}

describe('generateDTS snapshot', () => {
  it('generates completely typed-router.d.ts for file-based routing', () => {
    const { tree, options } = buildFileTestTree();
    const paramParsersMap = new Map();

    const output = generateDTS({
      routesModule: 'essor-router/auto-routes',
      routeNamedMap: generateRouteNamedMap(tree, options, paramParsersMap),
      routeTreeMap: generateRouteTreeMap(tree),
      routeFileInfoMap: generateRouteFileInfoMap(tree, { root: options.root }),
      paramsTypesDeclaration: generateParamParsersTypesDeclarations(paramParsersMap),
      customParamsType: generateParamParserCustomType(paramParsersMap),
    });

    expect(normalizeSnapshotPaths(output)).toMatchSnapshot('FileBased-typed-router.d.ts');
  });

  it('generates completely typed-router.d.ts for config-based routing', () => {
    const configPath = join(__dirname, 'fixtures', 'routes.config.ts');
    const options = resolveOptions({
      mode: 'config',
      configRoutes: configPath,
      root: __dirname,
    });
    const tree = new PrefixTree(options);
    loadConfigRoutes(tree, options);

    // We can simulate some paramParsers logic if needed, but keeping it empty maps
    // the core structure is well tested here
    const paramParsersMap = new Map();

    const output = generateDTS({
      routesModule: 'essor-router/auto-routes',
      routeNamedMap: generateRouteNamedMap(tree, options, paramParsersMap),
      routeTreeMap: generateRouteTreeMap(tree),
      routeFileInfoMap: generateRouteFileInfoMap(tree, { root: options.root }),
      paramsTypesDeclaration: generateParamParsersTypesDeclarations(paramParsersMap),
      customParamsType: generateParamParserCustomType(paramParsersMap),
    });

    expect(normalizeSnapshotPaths(output)).toMatchSnapshot('ConfigBased-typed-router.d.ts');
  });
});
