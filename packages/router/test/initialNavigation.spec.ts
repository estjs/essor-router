import { type RouterHistory, createRouter, createWebHistory } from '../src';
import { components, createDom, nextNavigation } from './utils';
import type { RouteRecordRaw } from '../src/types';
import type { JSDOM } from 'jsdom';

// override the value of isBrowser because the variable is created before JSDOM
// is created
vitest.mock('../src/utils/env', () => ({
  isBrowser: true,
}));

// generic component because we are not displaying anything so it doesn't matter
const component = components.Home;

const routes: RouteRecordRaw[] = [
  { path: '/home', redirect: '/' },
  { path: '/', component },
  {
    path: '/home-before',
    component,
    beforeEnter: (to, from, next) => {
      next('/');
    },
  },
  { path: '/bar', component },
  { path: '/foo', component, name: 'Foo' },
  { path: '/to-foo', redirect: '/foo' },
];

describe('initial Navigation', () => {
  let dom: JSDOM;
  function newRouter(url: string, options: Partial<Parameters<typeof createRouter>[0]> = {}) {
    dom.reconfigure({ url: `https://example.com${url}` });
    const history = (options.history || createWebHistory()) as RouterHistory;
    const router = createRouter({ history, routes, ...options });

    return { history, router };
  }

  beforeEach(() => {
    dom = createDom();
  });

  afterAll(() => {
    dom.window.close();
  });

  it('handles initial navigation with redirect', async () => {
    const { history, router } = newRouter('/home');
    expect(history.location).toBe('/home');
    // this is done automatically on install but there is none here
    await router.push(history.location);
    expect(router.currentRoute.value).toMatchObject({ path: '/' });
    await router.push('/foo');
    expect(router.currentRoute.value).toMatchObject({ path: '/foo' });
    history.go(-1);
    await nextNavigation(router);
    expect(router.currentRoute.value).toMatchObject({ path: '/' });
  });

  it('handles initial navigation with beforeEnter', async () => {
    const { history, router } = newRouter('/home-before');
    expect(history.location).toBe('/home-before');
    // this is done automatically on mount but there is no mount here
    await router.push(history.location);
    expect(router.currentRoute.value).toMatchObject({ path: '/' });
    await router.push('/foo');
    expect(router.currentRoute.value).toMatchObject({ path: '/foo' });
    history.go(-1);
    await nextNavigation(router);
    expect(router.currentRoute.value).toMatchObject({ path: '/' });
  });
});
