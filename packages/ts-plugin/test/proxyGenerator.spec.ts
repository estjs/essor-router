import { describe, expect, it } from 'vitest';
import { generateProxyModule } from '../src/proxyGenerator';

describe('generateProxyModule', () => {
  it('generates narrowed useRoute type proxy module', () => {
    const code = generateProxyModule('essor-router', {
      routeName: 'users-id',
      pathPattern: '/users/:id',
      params: { id: 'string' },
    });

    expect(code).toContain("export * from 'essor-router'");
    expect(code).toContain("name: 'users-id'");
    expect(code).toContain('params: { id: string }');
  });

  it('generates union types when multiple routes map to a file', () => {
    const code = generateProxyModule('essor-router', [
      {
        routeName: 'users-id',
        pathPattern: '/users/:id',
        params: { id: 'string' },
      },
      {
        routeName: 'users',
        pathPattern: '/users',
        params: {},
      },
    ]);

    expect(code).toContain("name: 'users-id' | 'users'");
    expect(code).toContain("path: '/users/:id' | '/users'");
    expect(code).toContain('params: { id: string } | Record<never, never>');
  });
});
