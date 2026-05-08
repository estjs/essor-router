import { describe, expect, it } from 'vitest';
import { ImportsMap } from '../../src/core/utils';
import { PrefixTree } from '../../src/core/tree';
import { resolveOptions } from '../../src/options';
import { generateRouteRecords } from '../../src/codegen/generateRouteRecords';
import { generateRouteResolver } from '../../src/codegen/generateRouteResolver';

/**
 * Builds a standard test route tree with common route patterns:
 * - index route (/)
 * - static route (/about)
 * - dynamic param route (/users/:id)
 * - nested route (/users/:id/posts)
 * - catch-all route (/[...all])
 */
function buildTestTree() {
  const options = resolveOptions({});
  const tree = new PrefixTree(options);

  tree.insert('index', '/src/pages/index.tsx');
  tree.insert('about', '/src/pages/about.tsx');
  tree.insert('users/[id]', '/src/pages/users/[id].tsx');
  tree.insert('users/[id]/posts', '/src/pages/users/[id]/posts.tsx');
  tree.insert('[...all]', '/src/pages/[...all].tsx');

  return { tree, options };
}

describe('generateRouteRecords snapshot', () => {
  it('keeps async route imports lazy', () => {
    const { tree, options } = buildTestTree();
    const importsMap = new ImportsMap();
    const output = generateRouteRecords(tree, options, importsMap);

    expect(output).toContain(`component: lazyRouteComponent(() => import('/src/pages/index.tsx'))`);
    expect(importsMap.toString()).toContain(`import { lazyRouteComponent } from 'essor-router'`);
  });

  it('generates stable route records for standard routes', () => {
    const { tree, options } = buildTestTree();
    const importsMap = new ImportsMap();
    const output = generateRouteRecords(tree, options, importsMap);

    expect(output).toMatchSnapshot();
  });

  it('generates stable imports map for standard routes', () => {
    const { tree, options } = buildTestTree();
    const importsMap = new ImportsMap();
    generateRouteRecords(tree, options, importsMap);

    expect(importsMap.toString()).toMatchSnapshot();
  });

  it('generates sync import when importMode is sync', () => {
    const options = resolveOptions({ importMode: 'sync' });
    const tree = new PrefixTree(options);
    tree.insert('index', '/src/pages/index.tsx');
    tree.insert('users/[id]', '/src/pages/users/[id].tsx');

    const importsMap = new ImportsMap();
    const output = generateRouteRecords(tree, options, importsMap);

    expect(output).toMatchSnapshot();
    expect(importsMap.toString()).toMatchSnapshot();
  });

  it('generates route with nested children', () => {
    const options = resolveOptions({});
    const tree = new PrefixTree(options);
    tree.insert('users/[id]', '/src/pages/users/[id].tsx');
    tree.insert('users/[id]/posts', '/src/pages/users/[id]/posts.tsx');
    tree.insert('users/[id]/settings', '/src/pages/users/[id]/settings.tsx');

    const importsMap = new ImportsMap();
    const output = generateRouteRecords(tree, options, importsMap);
    expect(output).toMatchSnapshot();
  });
});

describe('generateRouteResolver snapshot', () => {
  it('generates stable resolver for standard routes', () => {
    const { tree, options } = buildTestTree();
    const importsMap = new ImportsMap();
    const output = generateRouteResolver(tree, options, importsMap, new Map());

    expect(output).toMatchSnapshot();
    expect(importsMap.toString()).toMatchSnapshot();
  });

  it('generates resolver with static-only routes', () => {
    const options = resolveOptions({});
    const tree = new PrefixTree(options);
    tree.insert('index', '/src/pages/index.tsx');
    tree.insert('about', '/src/pages/about.tsx');
    tree.insert('contact', '/src/pages/contact.tsx');

    const importsMap = new ImportsMap();
    const output = generateRouteResolver(tree, options, importsMap, new Map());
    expect(output).toMatchSnapshot();
  });

  it('generates resolver with deeply nested dynamic routes', () => {
    const options = resolveOptions({});
    const tree = new PrefixTree(options);
    tree.insert('users/[id]/posts/[postId]', '/src/pages/users/[id]/posts/[postId].tsx');

    const importsMap = new ImportsMap();
    const output = generateRouteResolver(tree, options, importsMap, new Map());
    expect(output).toMatchSnapshot();
  });

  it('generates resolver with splat (catch-all) route', () => {
    const options = resolveOptions({});
    const tree = new PrefixTree(options);
    tree.insert('[...all]', '/src/pages/[...all].tsx');
    tree.insert('index', '/src/pages/index.tsx');

    const importsMap = new ImportsMap();
    const output = generateRouteResolver(tree, options, importsMap, new Map());
    expect(output).toMatchSnapshot();
  });

  it('skips non-absolute aliases in resolver generation', () => {
    const options = resolveOptions({});
    const tree = new PrefixTree(options);
    const node = tree.insert('users/[id]', '/src/pages/users/[id].tsx');
    node.setCustomRouteBlock('/src/pages/users/[id].tsx', {
      alias: ['relative-alias', '/users/:id'],
    });

    const importsMap = new ImportsMap();
    const output = generateRouteResolver(tree, options, importsMap, new Map());

    expect(output).toContain('/users/:id');
    expect(output).not.toContain('relative-alias');
  });
});
