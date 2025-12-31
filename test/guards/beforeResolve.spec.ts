import { components, createDom, newRouter as createRouter } from '../utils';
import type { RouteRecordRaw } from '../../src/types';


const routes: RouteRecordRaw[] = [
  { path: '/', component: components.Home },
  { path: '/foo', component:  components.Foo },
];

describe('router.beforeEach', () => {
  beforeEach(() => {
    createDom();
  });

  it('calls beforeEach guards on navigation', async () => {
    const spy = vitest.fn();
    const router = createRouter({ routes });
    router.beforeResolve(spy);
    await router.push('/foo');
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
