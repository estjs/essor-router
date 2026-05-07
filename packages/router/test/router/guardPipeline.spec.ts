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

    const runRouteDataHooks = vi.fn(() => {
      calls.push('dataHooks');
    });

    await pipeline.navigate(
      { ...baseRoute },
      { ...baseRoute },
      () => Promise.resolve(),
      runRouteDataHooks as any,
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
      () => Promise.reject(cancelError),
      () => Promise.resolve(),
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

  it('executes beforeEach before beforeResolve', async () => {
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

    await pipeline.navigate(
      { ...baseRoute, matched: [], path: '/next', fullPath: '/next' },
      { ...baseRoute, matched: [], path: '/', fullPath: '/' },
      () => Promise.resolve(),
      () => {
        calls.push('dataHooks');
      },
    );

    const beforeEachIdx = calls.indexOf('beforeEach');
    const beforeResolveIdx = calls.indexOf('beforeResolve');
    const dataHooksIdx = calls.indexOf('dataHooks');

    expect(beforeEachIdx).toBeLessThan(beforeResolveIdx);
    expect(beforeResolveIdx).toBeLessThan(dataHooksIdx);
  });

  it('runs canceledNavigationCheck after each phase', async () => {
    const pipeline = createGuardPipeline();
    let checkCount = 0;

    pipeline.beforeGuards.add((_to, _from, next) => {
      next();
    });
    pipeline.beforeResolveGuards.add((_to, _from, next) => {
      next();
    });

    await pipeline.navigate(
      { ...baseRoute, matched: [], path: '/next', fullPath: '/next' },
      { ...baseRoute, matched: [], path: '/', fullPath: '/' },
      () => {
        checkCount++;
      },
      () => {},
    );

    // canceledNavigationCheck is called once per phase (6 phases)
    expect(checkCount).toBe(6);
  });
});
