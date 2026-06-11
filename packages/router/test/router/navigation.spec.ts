import { describe, expect, it, vi } from 'vitest';
import { shallowSignal } from 'essor';
import { isString } from '@estjs/shared';
import { createNavigator } from '../../src/navigation/navigator';
import { parseQuery, stringifyQuery } from '../../src/core/query';
import { START_LOCATION_NORMALIZED } from '../../src/types';

const baseRoute = {
  path: '/',
  name: 'home',
  params: {},
  query: {},
  hash: '',
  fullPath: '/',
  matched: [],
  meta: {},
  redirectedFrom: undefined,
  href: '/',
} as any;

describe('navigator navigation', () => {
  function createTestNavigator() {
    const currentRoute = shallowSignal({ ...baseRoute });
    const nav = createNavigator({
      matcher: {
        resolve: (location: any, _current: any) => ({
          ...baseRoute,
          ...(location.path != null ? { path: location.path, fullPath: location.path } : {}),
          ...(location.name ? { name: location.name } : {}),
          params: location.params || {},
          matched: [],
          meta: {},
        }),
      },
      routerHistory: {
        push: vi.fn(),
        replace: vi.fn(),
        createHref: (fullPath: string) => fullPath,
      } as any,
      currentRoute,
      parseQuery,
      stringifyQuery,
      handleScroll: () => Promise.resolve(),
    });

    return { nav, currentRoute };
  }

  it('normalizes redirect records and preserves query/hash', () => {
    const { nav } = createTestNavigator();
    const redirected = nav.handleRedirectRecord({
      ...baseRoute,
      query: { q: 'abc' },
      hash: '#a',
      matched: [{ redirect: '/login' }],
    } as any);

    expect(redirected).toEqual({
      path: '/login',
      params: {},
      query: { q: 'abc' },
      hash: '#a',
    });
  });

  it('caches route data hooks by fullPath', async () => {
    const { nav } = createTestNavigator();
    const loader = vi.fn(() => Promise.resolve());
    const route = {
      ...baseRoute,
      fullPath: '/users/1',
      matched: [{ loader }],
    } as any;

    await nav.runRouteDataHooks(route);
    await nav.runRouteDataHooks(route);

    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('evicts the oldest cached route data task when cache grows beyond the limit', async () => {
    const { nav } = createTestNavigator();
    const routeCount = 33;
    const loaders = Array.from({ length: routeCount }, () => vi.fn(() => Promise.resolve()));

    for (const [index, loader] of loaders.entries()) {
      await nav.runRouteDataHooks({
        ...baseRoute,
        fullPath: `/users/${index}`,
        matched: [{ loader }],
      } as any);
    }

    await nav.runRouteDataHooks({
      ...baseRoute,
      fullPath: '/users/0',
      matched: [{ loader: loaders[0] }],
    } as any);

    expect(loaders[0]).toHaveBeenCalledTimes(2);
  });

  it('aborts the previous route data hook when a new navigation starts', async () => {
    const { nav } = createTestNavigator();
    let resolveFirstLoader!: () => void;
    let firstSignal: AbortSignal | undefined;
    const firstLoader = vi.fn(
      ({ signal }: { signal?: AbortSignal }) =>
        new Promise<void>((resolve) => {
          firstSignal = signal;
          resolveFirstLoader = resolve;
        }),
    );
    const secondLoader = vi.fn(() => Promise.resolve());

    const firstRoute = {
      ...baseRoute,
      fullPath: '/users/1',
      matched: [{ loader: firstLoader }],
    } as any;
    const secondRoute = {
      ...baseRoute,
      fullPath: '/users/2',
      matched: [{ loader: secondLoader }],
    } as any;

    nav.setPendingLocation(firstRoute);
    const firstTask = nav.runRouteDataHooks(firstRoute, true);
    await Promise.resolve();

    nav.setPendingLocation(secondRoute);
    await nav.runRouteDataHooks(secondRoute, true);

    expect(firstSignal?.aborted).toBe(true);

    resolveFirstLoader();
    await expect(firstTask).rejects.toMatchObject({ type: 8 });
  });

  it('passes the resolved route and runs beforeLoad before loader', async () => {
    const { nav } = createTestNavigator();
    const calls: string[] = [];
    const beforeLoad = vi.fn((ctx: any) => {
      calls.push(`before:${ctx.route.fullPath}`);
      expect(ctx.route.params).toEqual({ id: '1' });
    });
    const loader = vi.fn((ctx: any) => {
      calls.push(`loader:${ctx.route.fullPath}`);
      expect(ctx.route.query).toEqual({ tab: 'info' });
    });
    const route = {
      ...baseRoute,
      fullPath: '/users/1?tab=info',
      params: { id: '1' },
      query: { tab: 'info' },
      matched: [{ beforeLoad, loader }],
    } as any;

    await nav.runRouteDataHooks(route);

    expect(calls).toEqual(['before:/users/1?tab=info', 'loader:/users/1?tab=info']);
    expect(beforeLoad).toHaveBeenCalledTimes(1);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('does not cache a route data task that was aborted before it settled', async () => {
    const { nav } = createTestNavigator();
    let resolveFirstLoader!: () => void;
    let shouldPauseFirstLoader = true;
    const firstLoader = vi.fn(() => {
      if (!shouldPauseFirstLoader) return Promise.resolve();
      shouldPauseFirstLoader = false;
      return new Promise<void>((resolve) => {
        resolveFirstLoader = resolve;
      });
    });
    const secondLoader = vi.fn(() => Promise.resolve());
    const firstRoute = {
      ...baseRoute,
      fullPath: '/users/1',
      matched: [{ loader: firstLoader }],
    } as any;
    const secondRoute = {
      ...baseRoute,
      fullPath: '/users/2',
      matched: [{ loader: secondLoader }],
    } as any;

    nav.setPendingLocation(firstRoute);
    const firstTask = nav.runRouteDataHooks(firstRoute, true);
    const firstTaskResult = firstTask.catch((error) => error);
    await Promise.resolve();

    nav.setPendingLocation(secondRoute);
    await nav.runRouteDataHooks(secondRoute, true);
    resolveFirstLoader();
    await expect(firstTaskResult).resolves.toMatchObject({ type: 8 });

    nav.setPendingLocation(firstRoute);
    await nav.runRouteDataHooks(firstRoute, true);
    expect(firstLoader).toHaveBeenCalledTimes(2);
  });
});
