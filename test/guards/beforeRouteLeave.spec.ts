import { components, newRouter as createRouter, noGuard } from '../utils';
import type { RouteRecordRaw } from '../../src/types';
const Home = components.Home;
const Foo = components.Foo
const nested = {
  parent: vitest.fn(),
  nestedEmpty: vitest.fn(),
  nestedA: vitest.fn(),
  nestedB: vitest.fn(),
  nestedAbs: vitest.fn(),
  nestedNested: vitest.fn(),
  nestedNestedFoo: vitest.fn(),
  nestedNestedParam: vitest.fn(),
};
const beforeLeave = vitest.fn();

const routes: RouteRecordRaw[] = [
  { path: '/', component: Home },
  { path: '/foo', component: Foo },
  {
    path: '/guard',
    beforeLeave,
    component: Foo,
  },
  {
    path: '/nested',
    beforeLeave: nested.parent,

    component: Home,
    children: [
      {
        path: '',
        beforeLeave: nested.nestedEmpty,
        name: 'nested-empty-path',
        component: Home,
      },
      {
        path: 'a',
        name: 'nested-path',
        beforeLeave: nested.nestedA,
        component: Home,
      },
      {
        path: 'b',
        name: 'nested-path-b',
        beforeLeave: nested.nestedB,
        component: Home,
      },
      {
        path: '/abs-nested',
        name: 'absolute-nested',
        beforeLeave: nested.nestedAbs,
        component: Home,
      },
      {
        path: 'nested',
        name: 'nested-nested',
        beforeLeave: nested.nestedNested,
        component: Home,
        children: [
          {
            path: 'foo',
            name: 'nested-nested-foo',
            beforeLeave: nested.nestedNestedFoo,
            component: Home,
          },
          {
            path: 'param/:p',
            name: 'nested-nested-param',
            beforeLeave: nested.nestedNestedParam,
            component: Home,
          },
        ],
      },
    ],
  },
];

function resetMocks() {
  beforeLeave.mockReset();
  for (const key in nested) {
    nested[key as keyof typeof nested].mockReset();
    nested[key as keyof typeof nested].mockImplementation(noGuard);
  }
}

beforeEach(() => {
  resetMocks();
});

describe('beforeLeave', () => {
  it('calls beforeLeave guard on navigation', async () => {
    const router = createRouter({ routes });
    beforeLeave.mockImplementationOnce((to, from, next) => {
      if (to.path === 'foo') next(false);
      else next();
    });
    await router.push('/guard');
    expect(beforeLeave).not.toHaveBeenCalled();

    // simulate a mounted route component
    router.currentRoute.value.matched[0].instances.default = {} as any;

    await router.push('/foo');
    expect(beforeLeave).toHaveBeenCalledTimes(1);
  });

  it('does not call beforeLeave guard if the view is not mounted', async () => {
    const router = createRouter({ routes });
    beforeLeave.mockImplementationOnce((to, from, next) => {
      next();
    });
    await router.push('/guard');
    expect(beforeLeave).not.toHaveBeenCalled();

    // usually we would have to simulate a mounted route component
    // router.currentRoute.value.matched[0].instances.default = {} as any

    await router.push('/foo');
    expect(beforeLeave).not.toHaveBeenCalled();
  });

  it('calls beforeLeave guard on navigation between children', async () => {
    const router = createRouter({ routes });
    await router.push({ name: 'nested-path' });

    // simulate a mounted route component
    router.currentRoute.value.matched[0].instances.default = {} as any;
    router.currentRoute.value.matched[1].instances.default = {} as any;

    resetMocks();
    await router.push({ name: 'nested-path-b' });
    expect(nested.nestedEmpty).not.toHaveBeenCalled();
    expect(nested.nestedAbs).not.toHaveBeenCalled();
    expect(nested.nestedB).not.toHaveBeenCalled();
    expect(nested.nestedNestedFoo).not.toHaveBeenCalled();
    expect(nested.parent).not.toHaveBeenCalled();
    expect(nested.nestedNested).not.toHaveBeenCalled();
    expect(nested.nestedA).toHaveBeenCalledTimes(1);
    expect(nested.nestedA).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'nested-path-b',
        fullPath: '/nested/b',
      }),
      expect.objectContaining({
        name: 'nested-path',
        fullPath: '/nested/a',
      }),
      expect.any(Function),
    );
  });

  it('calls beforeLeave guard on navigation between children in order', async () => {
    const router = createRouter({ routes });
    await router.push({ name: 'nested-nested-foo' });
    resetMocks();
    let count = 0;
    nested.nestedNestedFoo.mockImplementation((to, from, next) => {
      expect(count++).toBe(0);
      next();
    });
    nested.nestedNested.mockImplementation((to, from, next) => {
      expect(count++).toBe(1);
      next();
    });
    nested.parent.mockImplementation((to, from, next) => {
      expect(count++).toBe(2);
      next();
    });

    // simulate a mounted route component
    router.currentRoute.value.matched[0].instances.default = {} as any;
    router.currentRoute.value.matched[1].instances.default = {} as any;
    router.currentRoute.value.matched[2].instances.default = {} as any;

    await router.push('/');
    expect(nested.parent).toHaveBeenCalledTimes(1);
    expect(nested.nestedNested).toHaveBeenCalledTimes(1);
    expect(nested.nestedNestedFoo).toHaveBeenCalledTimes(1);
  });

  it('can cancel navigation', async () => {
    const router = createRouter({ routes });
    beforeLeave.mockImplementationOnce((to, from, next) => {
      next(false);
    });
    await router.push('/guard');
    const p = router.push('/');
    const currentRoute = router.currentRoute.value;
    expect(currentRoute.fullPath).toBe('/guard');
    await p.catch();
    expect(currentRoute.fullPath).toBe('/guard');
  });
});
