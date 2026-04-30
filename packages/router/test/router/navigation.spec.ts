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
    return createNavigationCoordinator({
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
      setPendingLocation: location => {
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
      triggerError: async error => Promise.reject(error),
      handleScroll: async () => undefined,
    });
  }

  it('normalizes redirect records and preserves query/hash', () => {
    const coordinator = createCoordinator();
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
    const coordinator = createCoordinator();
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
});
