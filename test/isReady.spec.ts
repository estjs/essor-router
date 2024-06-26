import { type RouterHistory, createMemoryHistory, createRouter } from '../src';
import { components } from './utils';
import type { RouteRecordRaw } from '../src/types';

// generic component because we are not displaying anything so it doesn't matter
const component = components.Home;

const routes: RouteRecordRaw[] = [
  { path: '/', component },
  { path: '/bar', component },
  { path: '/foo', component, name: 'Foo' },
  {
    path: '/fail-lazy',
    // eslint-disable-next-line require-await
    component: async () => {
      throw new Error('async');
    },
  },
];

describe('isReady', () => {
  function newRouter(options: Partial<Parameters<typeof createRouter>[0]> = {}) {
    const history = (options.history || createMemoryHistory()) as RouterHistory;
    const router = createRouter({ history, routes, ...options });

    return router;
  }

  it('resolves a normal navigation', async () => {
    const router = newRouter();
    router.push('/foo');
    await expect(router.isReady()).resolves.toBe(undefined);
    // can be called again
    await expect(router.isReady()).resolves.toBe(undefined);
  });

  it('resolves a redirected navigation', async () => {
    const router = newRouter();
    router.beforeEach(to => (to.path === '/bar' ? true : '/bar'));
    router.push('/foo');
    await expect(router.isReady()).resolves.toBe(undefined);
    expect(router.currentRoute.value).toMatchObject({
      redirectedFrom: expect.objectContaining({ path: '/foo' }),
    });
    // can be called again
    await expect(router.isReady()).resolves.toBe(undefined);
  });

  it('rejects when an error is thrown in a navigation guard', async () => {
    const router = newRouter();
    const errorSpy = vitest.fn();
    const error = new Error('failed');
    router.onError(errorSpy);
    const remove = router.beforeEach(() => {
      throw error;
    });
    router.push('/foo').catch(() => {});
    await expect(router.isReady()).rejects.toBe(error);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      error,
      // to
      expect.objectContaining({ path: '/foo' }),
      // from
      expect.objectContaining({ path: '/' }),
    );

    // result can change
    remove();
    router.push('/foo').catch(() => {});
    await expect(router.isReady()).resolves.toBe(undefined);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('rejects a cancelled navigation', async () => {
    const router = newRouter();
    const errorSpy = vitest.fn();
    router.onError(errorSpy);
    const remove = router.beforeEach(() => false);
    router.push('/foo').catch(() => {});
    await expect(router.isReady()).rejects.toMatchObject({
      to: expect.objectContaining({ path: '/foo' }),
      from: expect.objectContaining({ path: '/' }),
    });
    expect(errorSpy).toHaveBeenCalledTimes(0);

    // can be checked again
    router.push('/foo').catch(() => {});
    await expect(router.isReady()).rejects.toMatchObject({
      to: expect.objectContaining({ path: '/foo' }),
      from: expect.objectContaining({ path: '/' }),
    });
    expect(errorSpy).toHaveBeenCalledTimes(0);

    // result can change
    remove();
    router.push('/foo').catch(() => {});
    await expect(router.isReady()).resolves.toBe(undefined);
    expect(errorSpy).toHaveBeenCalledTimes(0);
  });

  it('rejects failed lazy loading', () => {
    const router = newRouter();
    const errorSpy = vitest.fn();
    router.onError(errorSpy);
    router.push('/fail-lazy').catch(() => {});
    //TODO: this is not working
    // await expect(router.isReady()).rejects.toEqual(expect.any(Error));
    // expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
