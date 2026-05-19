import { describe, expect, it, vi } from 'vitest';
import { isString } from '@estjs/shared';
import { createNavigationCoordinator } from '../../src/navigation/navigation';

const currentRoute = {
  value: {
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
  },
} as any;

describe('createNavigationCoordinator', () => {
  function createCoordinator() {
    let pending: any = currentRoute.value;
    return {
      setPending: (location: any) => {
        pending = location;
      },
      coordinator: createNavigationCoordinator({
        resolve: (to: any) =>
          isString(to)
            ? {
                ...currentRoute.value,
                path: to,
                fullPath: to,
                href: to,
                matched: [],
              }
            : {
                ...currentRoute.value,
                ...to,
                href: to.fullPath || to.path || '/',
                matched: to.matched || [],
              },
        locationAsObject: (to: any) => (isString(to) ? { path: to } : { ...to }),
        stringifyQuery: (query: Record<string, any>) =>
          new URLSearchParams(query as Record<string, string>).toString(),
        currentRoute,
        setPendingLocation: (location) => {
          pending = location;
        },
        getPendingLocation: () => pending,
        routerHistory: {
          push: vi.fn(),
          replace: vi.fn(),
        },
        triggerAfterEach: vi.fn(),
        navigate: () => Promise.resolve(),
        markAsReady: () => undefined,
        triggerError: (error: any) => Promise.reject(error),
        handleScroll: () => undefined,
      }),
    };
  }

  it('normalizes redirect records and preserves query/hash', () => {
    const { coordinator } = createCoordinator();
    const redirected = coordinator.handleRedirectRecord({
      ...currentRoute.value,
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
    const { coordinator } = createCoordinator();
    const loader = vi.fn(() => Promise.resolve());
    const route = {
      ...currentRoute.value,
      fullPath: '/users/1',
      matched: [{ loader }],
    } as any;

    await coordinator.runRouteDataHooks(route);
    await coordinator.runRouteDataHooks(route);

    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('evicts the oldest cached route data task when cache grows beyond the limit', async () => {
    const { coordinator } = createCoordinator();
    const routeCount = 33;
    const loaders = Array.from({ length: routeCount }, () => vi.fn(() => Promise.resolve()));

    for (const [index, loader] of loaders.entries()) {
      await coordinator.runRouteDataHooks({
        ...currentRoute.value,
        fullPath: `/users/${index}`,
        matched: [{ loader }],
      } as any);
    }

    await coordinator.runRouteDataHooks({
      ...currentRoute.value,
      fullPath: '/users/0',
      matched: [{ loader: loaders[0] }],
    } as any);

    expect(loaders[0]).toHaveBeenCalledTimes(2);
  });

  it('aborts the previous route data hook when a new navigation starts', async () => {
    const { coordinator, setPending } = createCoordinator();
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
      ...currentRoute.value,
      fullPath: '/users/1',
      matched: [{ loader: firstLoader }],
    } as any;
    const secondRoute = {
      ...currentRoute.value,
      fullPath: '/users/2',
      matched: [{ loader: secondLoader }],
    } as any;

    setPending(firstRoute);
    const firstTask = coordinator.runRouteDataHooks(firstRoute, true);
    await Promise.resolve();

    setPending(secondRoute);
    await coordinator.runRouteDataHooks(secondRoute, true);

    expect(firstSignal?.aborted).toBe(true);

    resolveFirstLoader();
    await expect(firstTask).rejects.toMatchObject({ type: 8 });
  });

  it('passes the resolved route and runs beforeLoad before loader', async () => {
    const { coordinator } = createCoordinator();
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
      ...currentRoute.value,
      fullPath: '/users/1?tab=info',
      params: { id: '1' },
      query: { tab: 'info' },
      matched: [{ beforeLoad, loader }],
    } as any;

    await coordinator.runRouteDataHooks(route);

    expect(calls).toEqual(['before:/users/1?tab=info', 'loader:/users/1?tab=info']);
    expect(beforeLoad).toHaveBeenCalledTimes(1);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('does not cache a route data task that was aborted before it settled', async () => {
    const { coordinator, setPending } = createCoordinator();
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
      ...currentRoute.value,
      fullPath: '/users/1',
      matched: [{ loader: firstLoader }],
    } as any;
    const secondRoute = {
      ...currentRoute.value,
      fullPath: '/users/2',
      matched: [{ loader: secondLoader }],
    } as any;

    setPending(firstRoute);
    const firstTask = coordinator.runRouteDataHooks(firstRoute, true);
    const firstTaskResult = firstTask.catch((error) => error);
    await Promise.resolve();

    setPending(secondRoute);
    await coordinator.runRouteDataHooks(secondRoute, true);
    resolveFirstLoader();
    await expect(firstTaskResult).resolves.toMatchObject({ type: 8 });

    setPending(firstRoute);
    await coordinator.runRouteDataHooks(firstRoute, true);
    expect(firstLoader).toHaveBeenCalledTimes(2);
  });
});
