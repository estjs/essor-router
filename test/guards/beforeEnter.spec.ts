import fakePromise from 'faked-promise';
import { components, createDom, newRouter as createRouter, noGuard, tick } from '../utils';
import type { RouteRecordRaw } from '../../src/types';

const beforeEnter = vitest.fn();
const beforeEnters = [vitest.fn(), vitest.fn()];
const nested = vitest.fn();

const routes: RouteRecordRaw[] = [
  { path: '/', component:  components.Home },
  { path: '/home', component:  components.Home, beforeEnter },
  { path: '/foo', component:  components.Foo },
  {
    path: '/guard/:n',
    component:  components.Foo,
    beforeEnter,
  },
  {
    path: '/multiple',
    beforeEnter: beforeEnters,
    component:  components.Foo,
  },
  {
    path: '/nested',
    component: {
      component:components.Home,
      beforeRouteEnter:  components.Nested,
    },
  },
];

function resetMocks() {
  beforeEnter.mockReset();
  beforeEnters.forEach(spy => {
    spy.mockReset();
    spy.mockImplementationOnce(noGuard);
  });
}

beforeEach(() => {
  resetMocks();
});

describe('beforeEnter', () => {
  beforeEach(() => {
    createDom();
  });

  it('calls beforeEnter guards on navigation', async () => {
    const router = createRouter({ routes });
    beforeEnter.mockImplementationOnce(noGuard);
    await router.push('/guard/valid');
    expect(beforeEnter).toHaveBeenCalledTimes(1);
  });

  it('supports an array of beforeEnter', async () => {
    const router = createRouter({ routes });
    await router.push('/multiple');
    expect(beforeEnters[0]).toHaveBeenCalledTimes(1);
    expect(beforeEnters[1]).toHaveBeenCalledTimes(1);
    expect(beforeEnters[0]).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/multiple' }),
      expect.objectContaining({ path: '/' }),
      expect.any(Function),
    );
  });

  it('call beforeEnter in nested views', async () => {
    const router = createRouter({ routes });
    await router.push('/nested/a');
    resetMocks();
    await router.push('/nested/nested/foo');
    expect(nested).not.toHaveBeenCalled();
  });

  it('calls beforeEnter different records, same component', async () => {
    const router = createRouter({ routes });
    beforeEnter.mockImplementationOnce(noGuard);
    await router.push('/');
    expect(beforeEnter).not.toHaveBeenCalled();
    await router.push('/home');
    expect(beforeEnter).toHaveBeenCalledTimes(1);
  });

  it('does not call beforeEnter guard if we were already on the page', async () => {
    const router = createRouter({ routes });
    beforeEnter.mockImplementation(noGuard);
    await router.push('/guard/one');
    expect(beforeEnter).toHaveBeenCalledTimes(1);
    await router.push('/guard/one');
    expect(beforeEnter).toHaveBeenCalledTimes(1);
  });

  it('waits before navigating', async () => {
    const [promise, resolve] = fakePromise();
    const router = createRouter({ routes });
    beforeEnter.mockImplementationOnce(async (to, from, next) => {
      await promise;
      next();
    });
    const p = router.push('/foo');
    expect(router.currentRoute.value.fullPath).toBe('/');
    resolve();
    await p;
    expect(router.currentRoute.value.fullPath).toBe('/foo');
  });

  it('waits before navigating in an array of beforeEnter', async () => {
    const [p1, r1] = fakePromise();
    const [p2, r2] = fakePromise();
    const router = createRouter({ routes });
    beforeEnters[0].mockImplementationOnce(async (to, from, next) => {
      await p1;
      next();
    });
    beforeEnters[1].mockImplementationOnce(async (to, from, next) => {
      await p2;
      next();
    });
    const p = router.push('/multiple');
    expect(router.currentRoute.value.fullPath).toBe('/');
    expect(beforeEnters[1]).not.toHaveBeenCalled();
    r1();
    await p1;
    await tick();
    r2();
    await p;
    expect(router.currentRoute.value.fullPath).toBe('/multiple');
  });
});
