import fakePromise from 'faked-promise';
import { h as _h$, template as _template$ } from 'essor';
import { createDom, newRouter as createRouter, noGuard } from '../utils';
import { onBeforeRouteUpdate } from '../../src';
import type { RouteRecordRaw } from '../../src/types';

const beforeRouteUpdate = vitest.fn();

function Home() {
  onBeforeRouteUpdate(beforeRouteUpdate);
  return _h$(_template$('<div>Home</div>'), {});
}

function Foo() {
  onBeforeRouteUpdate(beforeRouteUpdate);
  return _h$(_template$('<div>Foo</div>'), {});
}

const routes: RouteRecordRaw[] = [
  { path: '/', component: Home },
  { path: '/foo', component: Foo },
  {
    path: '/guard/:go',
    alias: '/guard-alias/:go',
    component: Foo,
  },
];

beforeEach(() => {
  beforeRouteUpdate.mockReset();
});

describe('beforeRouteUpdate', () => {
  beforeEach(() => {
    createDom();
  });

  it('calls beforeRouteUpdate guards when changing params', async () => {
    const router = createRouter({ routes });
    beforeRouteUpdate.mockImplementationOnce(noGuard);
    await router.push('/guard/valid');
    // not called on initial navigation
    expect(beforeRouteUpdate).not.toHaveBeenCalled();
  });

  it('calls beforeRouteUpdate guards when changing params with alias', async () => {
    const router = createRouter({ routes });
    beforeRouteUpdate.mockImplementationOnce(noGuard);
    await router.push('/guard/valid');
    // not called on initial navigation
    expect(beforeRouteUpdate).not.toHaveBeenCalled();
    // simulate a mounted route component
    router.currentRoute.value.matched[0].instances.default = {} as any;
    await router.push('/guard-alias/other');
    expect(beforeRouteUpdate).toHaveBeenCalledTimes(0);
  });

  it('does not call beforeRouteUpdate guard if the view is not mounted', async () => {
    const router = createRouter({ routes });
    beforeRouteUpdate.mockImplementationOnce(noGuard);
    await router.push('/guard/valid');
    // not called on initial navigation
    expect(beforeRouteUpdate).not.toHaveBeenCalled();
    // usually we would have to simulate a mounted route component
    // router.currentRoute.value.matched[0].instances.default = {} as any
    await router.push('/guard/other');
    expect(beforeRouteUpdate).toHaveBeenCalledTimes(0);
  });

  it('waits before navigating', async () => {
    const [promise, resolve] = fakePromise();
    const router = createRouter({ routes });
    beforeRouteUpdate.mockImplementationOnce(async (to, from, next) => {
      await promise;
      next();
    });
    await router.push('/guard/one');
    const p = router.push('/guard/foo');
    expect(router.currentRoute.value.fullPath).toBe('/guard/one');
    resolve();
    await p;
    expect(router.currentRoute.value.fullPath).toBe('/guard/foo');
  });
});
