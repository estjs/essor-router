import { describe, expect, it } from 'vitest';
import { createRouteResolver } from '../../src/router/routeResolver';
import { parseQuery, stringifyQuery } from '../../src/query';
import { START_LOCATION_NORMALIZED } from '../../src/types';

describe('createRouteResolver', () => {
  it('resolves string locations and produces href', () => {
    const matcher = {
      resolve: (location: any) => ({
        name: 'users',
        path: location.path,
        params: {},
        matched: [{ path: '/users' }],
        meta: {},
      }),
    } as any;

    const history = {
      createHref: (fullPath: string) => `/base${fullPath}`,
    } as any;

    const resolver = createRouteResolver(
      matcher,
      history,
      parseQuery,
      stringifyQuery,
      () => START_LOCATION_NORMALIZED,
    );

    const resolved = resolver.resolve('/users?id=1#top');
    expect(resolved.path).toBe('/users');
    expect(resolved.query).toEqual({ id: '1' });
    expect(resolved.hash).toBe('#top');
    expect(resolved.href).toBe('/base/users?id=1#top');
  });

  it('supports object location resolution with params', () => {
    const matcher = {
      resolve: (location: any) => ({
        name: 'user-id',
        path: `/user/${location.params.id}`,
        params: location.params,
        matched: [{ path: '/user/:id' }],
        meta: {},
      }),
    } as any;

    const history = {
      createHref: (fullPath: string) => fullPath,
    } as any;

    const resolver = createRouteResolver(
      matcher,
      history,
      parseQuery,
      stringifyQuery,
      () => START_LOCATION_NORMALIZED,
    );

    const resolved = resolver.resolve({
      name: 'user-id',
      params: { id: '42' },
      query: { tab: 'profile' },
    });

    expect(resolved.path).toBe('/user/42');
    expect(resolved.fullPath).toBe('/user/42?tab=profile');
    expect(resolved.params).toEqual({ id: '42' });
  });
});
