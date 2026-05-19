import { describe, expect, it } from 'vitest';
import { resolveOptions } from '../../src/core/options';
import { PrefixTree, TreeNode } from '../../src/core/tree';

describe('file routing tree', () => {
  it('builds root index and dynamic param paths', () => {
    const root = new TreeNode(resolveOptions({}), '');

    const indexNode = root.insert('index', '/src/pages/index.tsx');
    const userNode = root.insert('users/[id]', '/src/pages/users/[id].tsx');

    expect(indexNode.fullPath).toBe('/');
    expect(userNode.fullPath).toBe('/users/:id');
    expect(userNode.name).toBe('/users/[id]');
  });

  it('supports _parent convention to create layout-only nodes', () => {
    const root = new TreeNode(resolveOptions({}), '');

    const parentNode = root.insert('nested/_parent', '/src/pages/nested/_parent.tsx');

    expect(parentNode.fullPath).toBe('/nested');
    expect(parentNode.name).toBe(false);
    expect(parentNode.components).toMatchObject({ default: '/src/pages/nested/_parent.tsx' });
  });

  it('maps named views from @ view suffixes', () => {
    const root = new TreeNode(resolveOptions({}), '');
    const indexNode = root.insert('index', '/src/pages/index.tsx');
    root.insert('index@sidebar', '/src/pages/index@sidebar.tsx');

    expect(indexNode.components).toMatchObject({
      default: '/src/pages/index.tsx',
      sidebar: '/src/pages/index@sidebar.tsx',
    });
  });

  it('inserts parsed raw paths as nested nodes', () => {
    const root = new TreeNode(resolveOptions({}), '');
    const node = root.insertParsedPath('users/:id(\\d+)');

    expect(node.fullPath).toBe('/users/:id(\\d+)');
    expect(node.path).toBe(':id(\\d+)');
    expect(root.getChildrenSorted()[0]?.path).toBe('/users');
  });

  it('removes file overrides when removing a mapped child', () => {
    const root = new PrefixTree(resolveOptions({}));
    const defaultFile = '/src/pages/dashboard/index.tsx';
    const sidebarFile = '/src/pages/dashboard/index@sidebar.tsx';

    const node = root.insert('dashboard/index', defaultFile);
    root.insert('dashboard/index@sidebar', sidebarFile);
    node.setCustomRouteBlock(defaultFile, { name: 'dashboard' });
    node.setCustomRouteBlock(sidebarFile, { meta: { view: 'sidebar' } });

    expect(node.value.overrides.name).toBe('dashboard');
    expect(node.value.overrides.meta).toEqual({ view: 'sidebar' });

    // eslint-disable-next-line unicorn/prefer-dom-node-remove
    root.removeChild(defaultFile);

    expect(node.value.overrides.name).toBeUndefined();
    expect(node.value.overrides.meta).toEqual({ view: 'sidebar' });
    expect(node.components).toMatchObject({ sidebar: sidebarFile });
  });
});
