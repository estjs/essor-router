import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { describe, expect, it } from 'vitest';
import { resolveOptions } from '../../src/core/options';
import { PrefixTree } from '../../src/core/tree';
import { loadConfigRoutes } from '../../src/core/configSource';
import { generateRouteNamedMap } from '../../src/codegen/generateRouteMap';
import { generateRouteRecords } from '../../src/codegen/generateRouteRecords';
import { generateRouteResolver } from '../../src/codegen/generateRouteResolver';
import { ImportsMap } from '../../src/core/utils';
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

describe('config-based routes parser', () => {
  it('should parse basic routes correctly and populate PrefixTree', () => {
    const configPath = join(__dirname, 'fixtures', 'routes.config.ts');

    // Simulate vite config options
    const options = resolveOptions({
      mode: 'config',
      configRoutes: configPath,
      root: __dirname,
    });

    const tree = new PrefixTree(options);

    // Test parsing
    loadConfigRoutes(tree, options);

    // Verify tree is populated correctly
    expect(tree.children.size).toBeGreaterThan(0);

    // Generate RouteNamedMap from the tree to verify types
    const routeNamedMap = generateRouteNamedMap(tree, options, new Map());

    expect(normalizeSnapshotPaths(routeNamedMap)).toMatchSnapshot('RouteNamedMap');
  });

  it('should generate stable route records for config-based routes', () => {
    const configPath = join(__dirname, 'fixtures', 'routes.config.ts');
    const options = resolveOptions({
      mode: 'config',
      configRoutes: configPath,
      root: __dirname,
    });
    const tree = new PrefixTree(options);
    loadConfigRoutes(tree, options);

    const importsMap = new ImportsMap();
    const output = generateRouteRecords(tree, options, importsMap);

    expect(normalizeSnapshotPaths(output)).toMatchSnapshot('RouteRecords');
    expect(normalizeSnapshotPaths(importsMap.toString())).toMatchSnapshot('RouteRecordsImports');
  });

  it('should generate stable resolver for config-based routes', () => {
    const configPath = join(__dirname, 'fixtures', 'routes.config.ts');
    const options = resolveOptions({
      mode: 'config',
      configRoutes: configPath,
      root: __dirname,
    });
    const tree = new PrefixTree(options);
    loadConfigRoutes(tree, options);

    const importsMap = new ImportsMap();
    const output = generateRouteResolver(tree, options, importsMap, new Map());

    expect(normalizeSnapshotPaths(output)).toMatchSnapshot('RouteResolver');
    expect(normalizeSnapshotPaths(importsMap.toString())).toMatchSnapshot('RouteResolverImports');
  });

  it('should correctly merge file-based and config-based routes', () => {
    const configPath = join(__dirname, 'fixtures', 'routes.config.ts');
    // Using default combined mode with configRoutes
    const options = resolveOptions({
      configRoutes: configPath,
      root: __dirname,
    });
    const tree = new PrefixTree(options);

    // 1. Load config routes
    loadConfigRoutes(tree, options);

    // 2. Simulate file traversal inserting file-based routes
    tree.insert('about', join(__dirname, 'fixtures', 'pages', 'About.tsx'));
    tree.insert('contact', join(__dirname, 'fixtures', 'pages', 'Contact.tsx'));

    const routeNamedMap = generateRouteNamedMap(tree, options, new Map());
    expect(normalizeSnapshotPaths(routeNamedMap)).toMatchSnapshot('MixedRouteNamedMap');

    const importsMap = new ImportsMap();
    const recordsOutput = generateRouteRecords(tree, options, importsMap);
    expect(normalizeSnapshotPaths(recordsOutput)).toMatchSnapshot('MixedRouteRecords');
  });
});
