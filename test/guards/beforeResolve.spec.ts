import { h as _h$, template as _template$ } from 'essor';
import { createDom, newRouter as createRouter } from '../utils';
import type { RouteRecordRaw } from '../../src/types';
function Home() {
  return _h$(_template$('<div>Home</div>'), {});
}

function Foo() {
  return _h$(_template$('<div>Foo</div>'), {});
}

const routes: RouteRecordRaw[] = [
  { path: '/', component: Home },
  { path: '/foo', component: Foo },
];

describe('router.beforeEach', () => {
  beforeAll(() => {
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
