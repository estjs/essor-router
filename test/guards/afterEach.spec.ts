import { RouteRecordRaw } from '@/types';
import { components, createDom, newRouter as createRouter } from '../utils';

const routes: RouteRecordRaw[] = [
  { path: '/', component: components.Home },
  { path: '/foo', component: components.Foo },
  {
    path: '/nested',
    component: components.Nested,
    children: [
      { path: '', name: 'nested-default', component: components.Foo },
      { path: 'home', name: 'nested-home', component: components.Home },
    ],
  },
];

describe('router.afterEach', () => {
  beforeEach(() => {
    createDom();
  });

  it('calls afterEach guards on push', async () => {
    const spy = vitest.fn();
    const router = createRouter({ routes });
    router.afterEach(spy);
    await router.push('/foo');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ fullPath: '/foo' }),
      expect.objectContaining({ fullPath: '/' }),
      undefined,
    );
  });

  it('can be removed', async () => {
    const spy = vitest.fn();
    const router = createRouter({ routes });
    const remove = router.afterEach(spy);
    remove();
    await router.push('/foo');
    expect(spy).not.toHaveBeenCalled();
  });

  it('calls afterEach guards on multiple push', async () => {
    const spy = vitest.fn();
    const router = createRouter({ routes });
    await router.push('/nested');
    router.afterEach(spy);
    await router.push('/nested/home');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: 'nested-home' }),
      expect.objectContaining({ name: 'nested-default' }),
      undefined,
    );
    await router.push('/nested');
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: 'nested-default' }),
      expect.objectContaining({ name: 'nested-home' }),
      undefined,
    );
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('removing an afterEach guard within one does not affect others', async () => {
    const spy1 = vitest.fn();
    const spy2 = vitest.fn();
    const router = createRouter({ routes });
    router.afterEach(spy1);
    const remove = router.afterEach(spy2);
    spy1.mockImplementationOnce(remove);
    await router.push('/foo');
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
  });
});
