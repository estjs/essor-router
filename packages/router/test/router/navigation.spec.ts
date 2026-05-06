import { describe, expect, it, vi } from 'vitest';
import { createNavigationCoordinator } from '../../src/router/navigation';

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
          typeof to === 'string'
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
        locationAsObject: (to: any) => (typeof to === 'string' ? { path: to } : { ...to }),
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
        navigate: async () => undefined,
        markAsReady: () => undefined,
        triggerError: async (error) => Promise.reject(error),
        handleScroll: async () => undefined,
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
    const loader = vi.fn(async () => undefined);
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
    const loaders = Array.from({ length: routeCount }, () => vi.fn(async () => undefined));

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
    const secondLoader = vi.fn(async () => undefined);

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
    await firstTask;
  });
});
