import fakePromise from 'faked-promise';
import { h as _h$, template as _template$ } from 'essor';
import { createDom, newRouter as createRouter, noGuard } from '../utils';
import type { RouteRecordRaw } from '../../src/types';
function Home() {
  return _h$(_template$('<div>Home</div>'), {});
}

function Foo() {
  return _h$(_template$('<div>Foo</div>'), {});
}

const beforeRouteEnter = vitest.fn();
const named = {
  default: vitest.fn(),
  other: vitest.fn(),
};

const nested = {
  parent: vitest.fn(),
  nestedEmpty: vitest.fn(),
  nestedA: vitest.fn(),
  nestedAbs: vitest.fn(),
  nestedNested: vitest.fn(),
  nestedNestedFoo: vitest.fn(),
  nestedNestedParam: vitest.fn(),
};

const routes: RouteRecordRaw[] = [
  { path: '/', component: Home },
  { path: '/foo', component: Foo },
  {
    path: '/guard/:n',
    alias: '/guard-alias/:n',
    beforeEnter: beforeRouteEnter,
    component: Foo,
  },
  {
    path: '/named',
    beforeEnter: named.default,
    component: Home,
  },
  {
    path: '/nested',
    beforeEnter: nested.parent,
    component: Home,
    children: [
      {
        path: '',
        name: 'nested-empty-path',
        beforeEnter: nested.nestedEmpty,

        component: Home,
      },
      {
        path: 'a',
        name: 'nested-path',
        beforeEnter: nested.nestedA,

        component: Home,
      },
      {
        path: '/abs-nested',
        name: 'absolute-nested',
        beforeEnter: nested.nestedAbs,

        component: Home,
      },
      {
        path: 'nested',
        name: 'nested-nested',
        beforeEnter: nested.nestedNested,

        component: Home,
        children: [
          {
            path: 'foo',
            name: 'nested-nested-foo',
            beforeEnter: nested.nestedNestedFoo,

            component: Home,
          },
          {
            path: 'param/:p',
            name: 'nested-nested-param',
            beforeEnter: nested.nestedNestedParam,

            component: Home,
          },
        ],
      },
    ],
  },
];

function resetMocks() {
  beforeRouteEnter.mockReset();
  for (const key in named) {
    named[key as keyof typeof named].mockReset();
  }
  for (const key in nested) {
    nested[key as keyof typeof nested].mockReset();
    nested[key as keyof typeof nested].mockImplementation(noGuard);
  }
}

beforeEach(() => {
  resetMocks();
});

describe('beforeRouteEnter', () => {
  beforeEach(() => {
    createDom();
  });

  it('calls beforeRouteEnter guards on navigation', async () => {
    const router = createRouter({ routes });
    beforeRouteEnter.mockImplementationOnce((to, from, next) => {
      if (to.params.n !== 'valid') return next(false);
      next();
    });
    await router.push('/guard/valid');
    expect(beforeRouteEnter).toHaveBeenCalledTimes(1);
  });

  it('does not call beforeRouteEnter guards on navigation between aliases', async () => {
    const router = createRouter({ routes });
    const spy = vitest.fn();
    beforeRouteEnter.mockImplementation(spy);
    await router.push('/guard/valid');
    expect(beforeRouteEnter).toHaveBeenCalledTimes(1);
    await router.push('/guard-alias/valid');
    expect(beforeRouteEnter).toHaveBeenCalledTimes(1);
    await router.push('/guard-alias/other');
    expect(beforeRouteEnter).toHaveBeenCalledTimes(1);
    await router.push('/guard/other');
    expect(beforeRouteEnter).toHaveBeenCalledTimes(1);
  });

  it('calls beforeRouteEnter guards on navigation for nested views', async () => {
    const router = createRouter({ routes });
    await router.push('/nested/nested/foo');
    expect(nested.parent).toHaveBeenCalledTimes(1);
    expect(nested.nestedNested).toHaveBeenCalledTimes(1);
    expect(nested.nestedNestedFoo).toHaveBeenCalledTimes(1);
    expect(nested.nestedAbs).not.toHaveBeenCalled();
    expect(nested.nestedA).not.toHaveBeenCalled();
  });

  it('calls beforeRouteEnter guards on non-entered nested routes', async () => {
    const router = createRouter({ routes });
    await router.push('/nested/nested');
    resetMocks();
    await router.push('/nested/nested/foo');
    expect(nested.parent).not.toHaveBeenCalled();
    expect(nested.nestedNested).not.toHaveBeenCalled();
    expect(nested.nestedNestedFoo).toHaveBeenCalledTimes(1);
  });

  it('does not call beforeRouteEnter guards on param change', async () => {
    const router = createRouter({ routes });
    await router.push('/nested/nested/param/1');
    resetMocks();
    await router.push('/nested/nested/param/2');
    expect(nested.parent).not.toHaveBeenCalled();
    expect(nested.nestedNested).not.toHaveBeenCalled();
    expect(nested.nestedNestedParam).not.toHaveBeenCalled();
  });

  it('calls beforeRouteEnter guards on navigation for named views', async () => {
    const router = createRouter({ routes });
    named.default.mockImplementationOnce(noGuard);
    named.other.mockImplementationOnce(noGuard);
    await router.push('/named');
    expect(named.default).toHaveBeenCalledTimes(1);
    // todo: why 1
    // expect(named.other).toHaveBeenCalledTimes(1);
    expect(router.currentRoute.value.fullPath).toBe('/named');
  });

  it('aborts navigation if one of the named views aborts', async () => {
    const router = createRouter({ routes });
    named.default.mockImplementationOnce((to, from, next) => {
      next(false);
    });
    named.other.mockImplementationOnce(noGuard);
    await router.push('/named').catch();
    expect(named.default).toHaveBeenCalledTimes(1);
    expect(router.currentRoute.value.fullPath).not.toBe('/named');
  });

  it('does not call beforeRouteEnter if we were already on the page', async () => {
    const router = createRouter({ routes });
    beforeRouteEnter.mockImplementation(noGuard);
    await router.push('/guard/one');
    expect(beforeRouteEnter).toHaveBeenCalledTimes(1);
    await router.push('/guard/one');
    expect(beforeRouteEnter).toHaveBeenCalledTimes(1);
  });

  it('waits before navigating', async () => {
    const [promise, resolve] = fakePromise();
    const router = createRouter({ routes });
    beforeRouteEnter.mockImplementationOnce(async (to, from, next) => {
      await promise;
      next();
    });
    const p = router.push('/foo');
    expect(router.currentRoute.value.fullPath).toBe('/');
    resolve();
    await p;
    expect(router.currentRoute.value.fullPath).toBe('/foo');
  });
});
