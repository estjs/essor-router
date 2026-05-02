import { describe, expect, it, vi } from 'vitest';
import { ErrorTypes, createRouterError } from '../../src/errors';
import { createGuardPipeline } from '../../src/router/guardPipeline';

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

describe('createGuardPipeline', () => {
  it('runs global guards and data hooks in order', async () => {
    const pipeline = createGuardPipeline();
    const calls: string[] = [];

    pipeline.beforeGuards.add((_to, _from, next) => {
      calls.push('beforeEach');
      next();
    });
    pipeline.beforeResolveGuards.add((_to, _from, next) => {
      calls.push('beforeResolve');
      next();
    });

    const runRouteDataHooks = vi.fn(async () => {
      calls.push('dataHooks');
    });

    await pipeline.navigate(
      { ...baseRoute },
      { ...baseRoute },
      async () => Promise.resolve(),
      runRouteDataHooks,
    );

    expect(calls).toEqual(['beforeEach', 'beforeResolve', 'dataHooks']);
    expect(runRouteDataHooks).toHaveBeenCalledTimes(1);
  });

  it('returns cancelled navigation failure without throwing', async () => {
    const pipeline = createGuardPipeline();
    const cancelError = createRouterError(ErrorTypes.NAVIGATION_CANCELLED, {
      from: { ...baseRoute },
      to: { ...baseRoute, fullPath: '/next', path: '/next' },
    });

    const result = await pipeline.navigate(
      { ...baseRoute, fullPath: '/next', path: '/next' },
      { ...baseRoute },
      async () => Promise.reject(cancelError),
      async () => Promise.resolve(),
    );

    expect(result).toBe(cancelError);
  });

  it('creates router errors when __BROWSER__ is not injected', () => {
    const globals = globalThis as typeof globalThis & { __BROWSER__?: boolean };
    const hadBrowserFlag = '__BROWSER__' in globals;
    const previousBrowserFlag = globals.__BROWSER__;

    delete globals.__BROWSER__;

    try {
      expect(() =>
        createRouterError(ErrorTypes.NAVIGATION_ABORTED, {
          from: { ...baseRoute },
          to: { ...baseRoute, fullPath: '/next', path: '/next' },
        }),
      ).not.toThrow();
    } finally {
      if (hadBrowserFlag) {
        globals.__BROWSER__ = previousBrowserFlag;
      }
    }
  });
});
