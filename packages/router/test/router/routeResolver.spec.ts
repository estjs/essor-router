import { describe, expect, it } from 'vitest';
import { createNavigator } from '../../src/navigation/navigator';
import { parseQuery, stringifyQuery } from '../../src/core/query';
import { START_LOCATION_NORMALIZED } from '../../src/types';
import { shallowSignal } from 'essor';

function createTestNavigator(matcherResolve: (location: any) => any) {
  const currentRoute = shallowSignal(START_LOCATION_NORMALIZED);
  return createNavigator({
    matcher: { resolve: matcherResolve },
    routerHistory: {
      createHref: (fullPath: string) => `/base${fullPath}`,
    } as any,
    currentRoute,
    parseQuery,
    stringifyQuery,
    handleScroll: () => Promise.resolve(),
  });
}

describe('navigator resolve', () => {
  it('resolves string locations and produces href', () => {
    const nav = createTestNavigator((location: any) => ({
      name: 'users',
      path: location.path,
      params: {},
      matched: [{ path: '/users' }],
      meta: {},
    }));

    const resolved = nav.resolve('/users?id=1#top');
    expect(resolved.path).toBe('/users');
    expect(resolved.query).toEqual({ id: '1' });
    expect(resolved.hash).toBe('#top');
    expect(resolved.href).toBe('/base/users?id=1#top');
  });

  it('supports object location resolution with params', () => {
    const currentRoute = shallowSignal(START_LOCATION_NORMALIZED);
    const nav = createNavigator({
      matcher: {
        resolve: (location: any) => ({
          name: 'user-id',
          path: `/user/${location.params.id}`,
          params: location.params,
          matched: [{ path: '/user/:id' }],
          meta: {},
        }),
      },
      routerHistory: {
        createHref: (fullPath: string) => fullPath,
      } as any,
      currentRoute,
      parseQuery,
      stringifyQuery,
      handleScroll: () => Promise.resolve(),
    });

    const resolved = nav.resolve({
      name: 'user-id',
      params: { id: '42' },
      query: { tab: 'profile' },
    });

    expect(resolved.path).toBe('/user/42');
    expect(resolved.fullPath).toBe('/user/42?tab=profile');
    expect(resolved.params).toEqual({ id: '42' });
  });
});
