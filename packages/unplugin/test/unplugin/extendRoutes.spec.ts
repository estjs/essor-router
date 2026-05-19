import { describe, expect, it } from 'vitest';
import { resolveOptions } from '../../src/core/options';
import { EditableTreeNode } from '../../src/core/extendRoutes';
import { PrefixTree } from '../../src/core/tree';

describe('editableTreeNode', () => {
  it('inserts routes and exposes traversal helpers', () => {
    const tree = new PrefixTree(resolveOptions({}));
    const root = new EditableTreeNode(tree);

    const users = root.insert('users', '/abs/users.tsx');
    const settings = users.insert('/settings', '/abs/settings.tsx');

    expect(users.path).toBe('/users');
    expect(settings.path.startsWith('/')).toBe(true);
    expect(root.children.length).toBe(1);

    const bfs = Array.from(root.traverseBFS()).map((node) => node.path);
    expect(bfs).toEqual(expect.arrayContaining(['/users', '/settings']));

    const dfs = Array.from(root.traverseDFS()).map((node) => node.path);
    expect(dfs).toEqual(expect.arrayContaining(['/users', '/settings']));
  });

  it('supports meta and alias overrides', () => {
    const tree = new PrefixTree(resolveOptions({}));
    const root = new EditableTreeNode(tree);
    const users = root.insert('users', '/abs/users.tsx');

    users.addToMeta({ section: 'users' });
    users.addAlias('/users-alias');
    users.name = 'users-route';

    expect(users.meta).toEqual({ section: 'users' });
    expect(users.alias).toContain('/users-alias');
    expect(users.name).toBe('users-route');
  });
});
