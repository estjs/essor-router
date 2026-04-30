import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadConfigRoutes } from '../../src/core/configSource';
import { PrefixTree } from '../../src/core/tree';
import { resolveOptions } from '../../src/options';

const __dirname = dirname(fileURLToPath(import.meta.url));

function setupTree(fixtureName: string) {
  const configPath = join(__dirname, 'fixtures', fixtureName);
  const options = resolveOptions({
    mode: 'config',
    configRoutes: configPath,
    root: __dirname,
  });
  const tree = new PrefixTree(options);
  return { tree, options, configPath };
}

describe('configSource logic', () => {
  it('throws when the config file does not exist', () => {
    const { tree, options } = setupTree('non-existent.ts');
    expect(() => {
      loadConfigRoutes(tree, options);
    }).toThrowError(/Failed to parse configRoutes file/);
  });

  it('handles empty config file or missing export default gracefully', () => {
    const { tree, options } = setupTree('empty.config.ts');
    // Shouldn't throw, just populates nothing
    loadConfigRoutes(tree, options);
    expect(tree.children.size).toBe(0);
  });

  it('handles empty array in defineConfigRoutes', () => {
    const { tree, options } = setupTree('empty-array.config.ts');
    loadConfigRoutes(tree, options);
    expect(tree.children.size).toBe(0);
  });

  it('extracts route with name override properly', () => {
    const { tree, options } = setupTree('routes.config.ts'); // Has our big fixture
    loadConfigRoutes(tree, options);

    // Test the specific named route from our previous fixture
    // The node tree is structured by URL path inside `children` maps.
    const homeNode = tree.children.get('/');
    expect(homeNode).toBeDefined();
    // PrefixTree node uses `overrides.name` when explicitly provided
    expect(homeNode?.value.overrides.name).toBe('home');
    expect(homeNode?.name).toBe('home');
  });

  it('correctly builds tree hierarchy for children', () => {
    const { tree, options } = setupTree('routes.config.ts');
    loadConfigRoutes(tree, options);

    // There should be a `/settings` node
    console.log('TREE CHILDREN:', Array.from(tree.children.keys()));
    const settingsNode = tree.children.get('settings');
    expect(settingsNode).toBeDefined();
    expect(settingsNode?.children.has('profile')).toBe(true);

    const profileNode = settingsNode?.children.get('profile');
    expect(profileNode?.fullPath).toBe('/settings/profile');
    expect(profileNode?.name).toBe('settings-profile');
  });
});
